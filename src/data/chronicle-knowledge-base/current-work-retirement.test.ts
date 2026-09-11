import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  applyKnowledgeRecordTransaction,
  prepareKnowledgeRecordTransaction,
} from "../../../scripts/knowledge-records/engine";
import { parseKnowledgeRecordRequest } from "../../../scripts/knowledge-records/request-contract";
import { readCanonicalSourceInventory } from "../../../scripts/knowledge-records/source-set";
import {
  acquireKnowledgeTransactionLock,
  createPreparedKnowledgeTransaction,
  generateKnowledgeTransactionId,
  releaseKnowledgeTransactionLock,
} from "../../../scripts/knowledge-records/transaction-store";
import {
  createAcceptedUpdateRequestPackage,
  createIssueCreateRequestPackage,
  createIssueUpdateRequestPackage,
  createKnowledgeRecordTransactionTestRepository,
  createProjectUpdateRequestPackage,
  KNOWLEDGE_TRANSACTION_FIXTURE_AS_OF,
  type KnowledgeRecordRequestPackage,
} from "./knowledge-record-transaction-test-fixtures";
import { validateOperationalRecordSources } from "./operational-record-contract";

const cleanups: Array<() => Promise<void>> = [];
function track<T extends { cleanup: () => Promise<void> }>(fixture: T): T {
  cleanups.push(fixture.cleanup);
  return fixture;
}
const dependencies = { today: () => KNOWLEDGE_TRANSACTION_FIXTURE_AS_OF };
afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()));
});

describe("retired Current Work", () => {
  it("preserves unfinished records as history without inventing a closeout", async () => {
    const fixture = track(await createKnowledgeRecordTransactionTestRepository());
    const source = fixture.baselineSources[fixture.activeProjectPath];
    const archivedPath = fixture.activeProjectPath.replace("/active/", "/archive/");
    const archived = source.replace(fixture.activeProjectPath, archivedPath)
      .replace("record_type: current_work", "record_type: current_work\nworkflow_retired: true");
    const sources = { ...fixture.baselineSources, [archivedPath]: archived };
    delete sources[fixture.activeProjectPath];
    const result = validateOperationalRecordSources(sources, {
      asOf: KNOWLEDGE_TRANSACTION_FIXTURE_AS_OF,
      baselineSources: fixture.baselineSources,
    });
    expect(result.errors).toEqual([]);
    expect(result.registry.activeProjects).toEqual([]);
    expect(result.registry.archivedProjects[0]).toMatchObject({
      workflowRetired: true,
      workflowState: "Closeout pending",
      closeout: null,
    });
    const changed = { ...sources, [archivedPath]: archived.replace("# CG-WORK-001:", "# CG-WORK-001: Changed") };
    expect(validateOperationalRecordSources(changed, {
      asOf: KNOWLEDGE_TRANSACTION_FIXTURE_AS_OF, baselineSources: sources,
    }).errors.join("\n")).toContain("read-only historical material");
  });

  it.each(["project-create", "project-update", "closeout"] as const)("rejects new %s work", async (kind) => {
    const fixture = track(await createKnowledgeRecordTransactionTestRepository());
    const request = track(await createProjectUpdateRequestPackage());
    const source = JSON.parse(await readFile(request.requestPath, "utf8"));
    await writeFile(request.requestPath, JSON.stringify({ ...source, kind }));
    await expect(parseKnowledgeRecordRequest(request.requestPath)).rejects.toThrow("Current Work has been retired");
    await expect(prepareKnowledgeRecordTransaction({
      repoRoot: fixture.repoRoot, requestPath: request.requestPath, expectedKind: kind, dependencies,
    })).rejects.toThrow("Current Work has been retired");
  });

  it.each(["project-create", "project-update", "closeout"] as const)("refuses an old prepared %s transaction before mutation", async (kind) => {
    const fixture = track(await createKnowledgeRecordTransactionTestRepository());
    const inventory = await readCanonicalSourceInventory(fixture.repoRoot);
    const entry = inventory.entries.find((record) => record.sourcePath === fixture.activeProjectPath)!;
    const transactionId = generateKnowledgeTransactionId();
    const lock = await acquireKnowledgeTransactionLock({ repoRoot: fixture.repoRoot, command: "historical transaction fixture", transactionId });
    try {
      await createPreparedKnowledgeTransaction({
        lock, transactionId, kind,
        snapshot: {
          validationAsOf: KNOWLEDGE_TRANSACTION_FIXTURE_AS_OF, requestSha256: "f".repeat(64), packageSha256: null,
          sources: [{ path: entry.sourcePath, state: "present", sha256: entry.sha256, mode: entry.mode }],
        },
        operations: [{ action: "update", path: entry.sourcePath, beforeBytes: entry.bytes, afterBytes: Buffer.from("Historical staged content") }],
      });
    } finally {
      await releaseKnowledgeTransactionLock(lock);
    }
    await expect(applyKnowledgeRecordTransaction({ repoRoot: fixture.repoRoot, transactionId, dependencies }))
      .rejects.toThrow("Current Work has been retired");
    expect(await readFile(path.join(fixture.repoRoot, entry.sourcePath))).toEqual(entry.bytes);
  });

  it("creates and resolves Issues and writes Changelog history with no project records", async () => {
    const fixture = track(await createKnowledgeRecordTransactionTestRepository());
    await rm(path.join(fixture.repoRoot, "docs/current-work/active"), { recursive: true });
    const apply = async (request: KnowledgeRecordRequestPackage, kind: "issue-create" | "issue-update" | "accepted-update") => {
      const prepared = await prepareKnowledgeRecordTransaction({ repoRoot: fixture.repoRoot, requestPath: request.requestPath, expectedKind: kind, dependencies });
      expect((await applyKnowledgeRecordTransaction({ repoRoot: fixture.repoRoot, transactionId: prepared.transactionId, dependencies })).outcome).toBe("applied");
    };
    const create = track(await createIssueCreateRequestPackage());
    await apply(create, "issue-create");
    const update = track(await createIssueUpdateRequestPackage());
    const issueContentPath = Object.values(update.contentPaths)[0];
    const resolved = (await readFile(issueContentPath, "utf8")).replace("status: open", "status: resolved")
      .concat("\n## Resolution\n\nFocused verification confirmed the reported behavior was repaired.\n");
    await writeFile(issueContentPath, resolved);
    await apply(update, "issue-update");
    const change = track(await createAcceptedUpdateRequestPackage());
    const changeContentPath = Object.values(change.contentPaths)[0];
    await writeFile(changeContentPath, (await readFile(changeContentPath, "utf8"))
      .replace(/^workflow_record_context:.*\n/m, "")
      .replace(/\n## Operational Record Context\n[\s\S]*?(?=\n## |$)/, ""));
    await apply(change, "accepted-update");
    const inventory = await readCanonicalSourceInventory(fixture.repoRoot);
    expect(inventory.entries.some((entry) => entry.sourcePath.includes("/current-work/"))).toBe(false);
    expect(inventory.entries.filter((entry) => entry.location === "issue")).toHaveLength(2);
    expect(inventory.entries.filter((entry) => entry.location === "changelog")).toHaveLength(1);
  });
});
