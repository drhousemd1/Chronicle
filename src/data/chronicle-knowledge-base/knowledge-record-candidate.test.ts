import path from "node:path";

import { describe, expect, it, vi } from "vitest";

vi.mock("./operational-record-contract", () => ({
  validateOperationalRecordSources: vi.fn(() => ({
    ok: true,
    errors: [],
  })),
}));

import {
  validateStoredKnowledgeRecordCandidate,
  type CandidateOperation,
} from "../../../scripts/knowledge-records/candidate";
import {
  canonicalRecordSourcePath,
} from "../../../scripts/knowledge-records/path-safety";
import {
  sha256Buffer,
  type CanonicalSourceEntry,
  type CanonicalSourceInventory,
} from "../../../scripts/knowledge-records/source-set";

const CREATE_PATH = canonicalRecordSourcePath("changelog", "LEGACY-QH-created");
const UPDATE_PATH = canonicalRecordSourcePath(
  "active-current-work",
  "CG-WORK-001",
);
const REMOVE_PATH = canonicalRecordSourcePath("issue", "CG-ISSUE-001");
const BEFORE_UPDATE = Buffer.from("update before", "utf8");
const AFTER_UPDATE = Buffer.from("update after", "utf8");
const BEFORE_REMOVE = Buffer.from("remove before", "utf8");
const AFTER_CREATE = Buffer.from("create after", "utf8");

function sourceEntry(
  sourcePath: string,
  bytes: Buffer,
  mode: number,
): CanonicalSourceEntry {
  const identity = sourcePath.includes("/issues/")
    ? { location: "issue" as const, recordId: "CG-ISSUE-001" }
    : { location: "active-current-work" as const, recordId: "CG-WORK-001" };
  return Object.freeze({
    ...identity,
    sourcePath,
    absolutePath: path.join("/fixture", ...sourcePath.split("/")),
    bytes,
    sha256: sha256Buffer(bytes),
    mode,
  });
}

function inventory(): CanonicalSourceInventory {
  const entries = [
    sourceEntry(REMOVE_PATH, BEFORE_REMOVE, 0o644),
    sourceEntry(UPDATE_PATH, BEFORE_UPDATE, 0o640),
  ].sort((left, right) => left.sourcePath.localeCompare(right.sourcePath));
  return Object.freeze({
    repoRoot: "/fixture",
    entries: Object.freeze(entries),
    membership: Object.freeze(entries.map((entry) => entry.sourcePath)),
  });
}

function validOperations(): CandidateOperation[] {
  return [
    {
      index: 0,
      action: "create",
      sourcePath: CREATE_PATH,
      beforeBytes: null,
      beforeMode: null,
      afterBytes: AFTER_CREATE,
      afterMode: 0o644,
    },
    {
      index: 1,
      action: "update",
      sourcePath: UPDATE_PATH,
      beforeBytes: BEFORE_UPDATE,
      beforeMode: 0o640,
      afterBytes: AFTER_UPDATE,
      afterMode: 0o640,
    },
    {
      index: 2,
      action: "remove",
      sourcePath: REMOVE_PATH,
      beforeBytes: BEFORE_REMOVE,
      beforeMode: 0o644,
      afterBytes: null,
      afterMode: null,
    },
  ];
}

function replaceOperation(
  operations: CandidateOperation[],
  index: number,
  replacement: CandidateOperation,
) {
  return operations.map((operation, position) =>
    position === index ? replacement : operation,
  );
}

describe("stored Knowledge record candidate filesystem state", () => {
  it("accepts canonical create, update, and remove state combinations", () => {
    const result = validateStoredKnowledgeRecordCandidate(
      inventory(),
      "2026-08-01",
      validOperations(),
    );

    expect(result.operations).toHaveLength(3);
    expect(result.candidateSources[CREATE_PATH]).toBe("create after");
    expect(result.candidateSources[UPDATE_PATH]).toBe("update after");
    expect(result.candidateSources).not.toHaveProperty(REMOVE_PATH);
  });

  it.each([
    {
      name: "create with before bytes",
      index: 0,
      patch: { beforeBytes: Buffer.from("unexpected"), beforeMode: 0o644 },
      message: /Stored create operation has an invalid source state/,
    },
    {
      name: "create with a noncanonical mode",
      index: 0,
      patch: { afterMode: 0o600 },
      message: /Stored create operation has an invalid source state/,
    },
    {
      name: "create without staged bytes",
      index: 0,
      patch: { afterBytes: null },
      message: /Stored create operation has an invalid source state/,
    },
    {
      name: "update with the wrong before mode",
      index: 1,
      patch: { beforeMode: 0o600 },
      message: /Stored update target is missing/,
    },
    {
      name: "update that changes the mode",
      index: 1,
      patch: { afterMode: 0o600 },
      message: /Stored update operation has no staged result/,
    },
    {
      name: "update without staged bytes",
      index: 1,
      patch: { afterBytes: null },
      message: /Stored update operation has no staged result/,
    },
    {
      name: "update with unchanged bytes",
      index: 1,
      patch: { afterBytes: BEFORE_UPDATE },
      message: /Stored update operation has no staged result/,
    },
    {
      name: "remove with the wrong before mode",
      index: 2,
      patch: { beforeMode: 0o600 },
      message: /Stored remove target is missing/,
    },
    {
      name: "remove with after bytes",
      index: 2,
      patch: { afterBytes: Buffer.from("unexpected") },
      message: /Stored remove operation contains unexpected after bytes/,
    },
    {
      name: "remove with an after mode",
      index: 2,
      patch: { afterMode: 0o644 },
      message: /Stored remove operation contains unexpected after bytes/,
    },
  ])("rejects $name", ({ index, patch, message }) => {
    const operations = validOperations();
    const malformed = {
      ...operations[index],
      ...patch,
    } as CandidateOperation;

    expect(() =>
      validateStoredKnowledgeRecordCandidate(
        inventory(),
        "2026-08-01",
        replaceOperation(operations, index, malformed),
      ),
    ).toThrow(message);
  });
});
