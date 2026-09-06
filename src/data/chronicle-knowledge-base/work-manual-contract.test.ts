import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  CHRONICLE_REVIEWED_CHAPTERS_SHA256,
  CHRONICLE_WORK_MANUAL_PATH,
  CHRONICLE_WORK_MANUAL_VERSION,
  getWorkManualNamedSectionSource,
  validateWorkManualReadingPaths,
  validateWorkManualPointers,
  validateWorkManualSource,
} from "./work-manual-contract";

const canonicalSource = fs.readFileSync(
  path.join(process.cwd(), CHRONICLE_WORK_MANUAL_PATH),
  "utf8",
);

function pointerSource(version = CHRONICLE_WORK_MANUAL_VERSION) {
  return [
    "# Chronicle workflow",
    "",
    `Chronicle Work Manual: ${CHRONICLE_WORK_MANUAL_PATH}`,
    `Chronicle Work Manual version: ${version}`,
    "",
    "Open the canonical manual at Start Here before Chronicle work.",
  ].join("\n");
}

describe("Chronicle Work Manual contract", () => {
  it("keeps the obsolete application-manual writer authority retired", () => {
    expect(
      fs.existsSync(
        path.join(
          process.cwd(),
          "docs/architecture-knowledge/chronicle-application-manual-writer-rough-draft.md",
        ),
      ),
    ).toBe(false);
  });

  it("accepts the active provisional canonical manual and reviewed chapters", () => {
    const result = validateWorkManualSource(canonicalSource);

    expect(result.errors).toEqual([]);
    expect(result.metadata).toMatchObject({
      manual_version: CHRONICLE_WORK_MANUAL_VERSION,
      status: "active-provisional",
      canonical_path: CHRONICLE_WORK_MANUAL_PATH,
    });
    expect(result.chaptersSha256).toBe(CHRONICLE_REVIEWED_CHAPTERS_SHA256);
    expect(result.wordCount).toBeLessThan(25_000);
    expect(result.readingPathWordCounts.routine).toBeLessThanOrEqual(4_000);
    expect(result.readingPathWordCounts.connected).toBeLessThanOrEqual(8_000);
    expect(result.readingPathWordCounts.multiSystem).toBeLessThanOrEqual(15_000);
  });

  it("rejects a base-scope reading path above its hard ceiling", () => {
    const inflatedRoutine = canonicalSource.replace(
      "## 2. Routine Local Work",
      `## 2. Routine Local Work\n\n${"extra ".repeat(4_100)}`,
    );

    expect(validateWorkManualSource(inflatedRoutine).errors.join("\n")).toContain(
      "Routine Work Manual reading path exceeds the 4,000-word ceiling",
    );
  });

  it("includes the active workspace, repository, and onboarding pointers in every hard reading ceiling", () => {
    const activeDefaultSources = [
      fs.readFileSync(path.join(process.cwd(), "..", "AGENTS.md"), "utf8")
        .split("# Chronicle workflow pointer")[1],
      fs.readFileSync(path.join(process.cwd(), "AGENTS.md"), "utf8"),
      fs.readFileSync(
        path.join(
          process.env.HOME ?? "",
          ".codex/skills/chronicle-knowledge-workflow/SKILL.md",
        ),
        "utf8",
      ),
    ];
    const result = validateWorkManualReadingPaths(canonicalSource, {
      defaultSources: activeDefaultSources,
    });

    expect(result.errors).toEqual([]);
    expect(result.counts.routine).toBeLessThanOrEqual(4_000);
    expect(result.counts.connected).toBeLessThanOrEqual(8_000);
    expect(result.counts.multiSystem).toBeLessThanOrEqual(15_000);
  });

  it("rejects a triggered instruction source that makes the complete task reading path exceed its ceiling", () => {
    const result = validateWorkManualReadingPaths(canonicalSource, {
      defaultSources: [pointerSource()],
      routineSources: ["triggered ".repeat(2_500)],
    });

    expect(result.errors.join("\n")).toContain(
      "Routine Work Manual reading path exceeds the 4,000-word ceiling",
    );
  });

  it("leaves enough Routine headroom for normal browser mechanics and one small safeguard", () => {
    const sharedPresentationSafeguard = getWorkManualNamedSectionSource(
      canonicalSource,
      "6.1 Shared presentation source",
    );
    const result = validateWorkManualReadingPaths(canonicalSource, {
      defaultSources: [pointerSource()],
      routineSources: [
        "browser-mechanics ".repeat(1_829),
        sharedPresentationSafeguard,
      ],
    });

    expect(sharedPresentationSafeguard).toContain(
      "### 6.1 Shared presentation source",
    );
    expect(result.errors).toEqual([]);
    expect(result.counts.routine).toBeLessThanOrEqual(4_000);
  });

  it("extracts and counts an exact triggered subsection from the canonical manual", () => {
    const beforeValidation = getWorkManualNamedSectionSource(
      canonicalSource,
      "11.1 Before validation",
    );
    expect(beforeValidation).toContain("### 11.1 Before validation");
    expect(beforeValidation).not.toContain("### 11.2 Repository and focused checks");

    const result = validateWorkManualReadingPaths(canonicalSource, {
      defaultSources: [pointerSource()],
      routineSources: [beforeValidation],
    });
    expect(result.counts.routine).toBeGreaterThan(
      validateWorkManualReadingPaths(canonicalSource, {
        defaultSources: [pointerSource()],
      }).counts.routine,
    );
  });

  it("keeps task coordination limited to actual overlapping mutation", () => {
    for (const requiredRule of [
      "It must not stop read-only work, unrelated files, unrelated projects, or ordinary Chronicle work outside those declared targets.",
      "Coordination conflicts are based on overlapping mutation, not shared context.",
      "There is no automatic lock claim for ordinary files.",
      "the earlier active writer keeps priority",
      "Send one targeted wait notice only to that later conflicting task",
      "Do not broadcast lock, pause, release, or unlock messages to other tasks.",
      "Releasing the overlap is silent",
      "A dirty working tree by itself is not a conflict, a lock, or a reason to stop unrelated work.",
    ]) {
      expect(canonicalSource).toContain(requiredRule);
    }
  });

  it("activates requirements fidelity and R&D preservation without broadening routine work", () => {
    const subagentSource = fs.readFileSync(
      path.join(process.env.HOME ?? "", ".codex/SUBAGENTS.md"),
      "utf8",
    );
    const researchDevelopmentSource = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/components/admin/research-development/README.md",
      ),
      "utf8",
    );

    for (const requiredInstruction of [
      "### 1.10 Preserve complex supplied requirements before planning",
      "Invoke the installed `requirements-fidelity-planning` skill when Chronicle work is requirement-heavy",
      "This safeguard does not raise the base scope",
      "Do not invoke it for routine styling",
      "R&D isolation does not make a prototype disposable.",
      "Preserve the prototype unless the user directly names that lifecycle change.",
      "For a requirement or plan review, the coordinator gives the worker access to the raw supplied artifacts",
    ]) {
      expect(canonicalSource).toContain(requiredInstruction);
    }

    for (const requiredInstruction of [
      "Assign stable source IDs",
      "later user amendments",
      "first reconstruct the requested outcome",
      "does not silently replace the rest of the packet",
      "Do not infer permission to delete, retire, clean up, replace, archive, or demote",
      "Coordinate writers by exact overlap.",
      "do not broadcast lock or release messages",
    ]) {
      expect(subagentSource).toContain(requiredInstruction);
    }

    for (const requiredInstruction of [
      "R&D prototypes are isolated from production, but they are not disposable.",
      "Retire or delete a prototype only when the user directly instructs that named lifecycle outcome.",
      "Production code must not import or depend on prototype code",
      "must not encode inferred prototype absence as success",
      "may coexist",
    ]) {
      expect(researchDevelopmentSource).toContain(requiredInstruction);
    }
  });

  it("teaches bounded repository-map and canonical-history use without activating another workflow", () => {
    const installedSkill = fs.readFileSync(
      path.join(
        process.env.HOME ?? "",
        ".codex/skills/chronicle-knowledge-workflow/SKILL.md",
      ),
      "utf8",
    );

    for (const requiredInstruction of [
      "### 1.9 Use the repository map only when it answers a real source question",
      "Routine work normally omits the map.",
      "### 9.7 Private repository map and canonical history",
      "If the map is stale, unavailable, or contradicts a manual or current source, distrust the map",
      "Regeneration is not an automatic after-edit step.",
      "does not read Graphify memory or infer history from Git",
      "npm run graph:status",
      "npm run graph:query -- <literal>",
      "npm run graph:path -- --from <node-id> --to <node-id>",
      "npm run graph:explain -- <node-id>",
      "npm run graph:update",
      "npm run graph:history -- [--capability <capability-id>] [--source <repository-path>] [<literal>] [--limit <1-50>]",
      "npm run graph:check",
    ]) {
      expect(canonicalSource).toContain(requiredInstruction);
    }

    expect(installedSkill).not.toMatch(/Graphify|graph:(?:status|query|path|update|history)/i);
  });

  it("keeps Chronicle roleplay prompt procedure in the canonical manual instead of the parent workspace pointer", () => {
    const parentSource = fs.readFileSync(
      path.join(process.cwd(), "..", "AGENTS.md"),
      "utf8",
    );

    expect(
      parentSource
        .split(/\r?\n/)
        .filter((line) => line === "# Chronicle workflow pointer"),
    ).toHaveLength(1);
    expect(parentSource).not.toContain("# Roleplay prompt debugging");
    expect(parentSource).not.toContain("Do not use test-story details");
    expect(canonicalSource).toContain("Prompt and pipeline fixes must be scenario-independent.");
    expect(canonicalSource).toContain(
      "Do not introduce the rejected ambiguous terms “canon” or “beat”",
    );
  });

  it("rejects an overbroad Chronicle stop gate in the manual", () => {
    const source = `${canonicalSource}\nStop all ordinary Chronicle work.\n`;

    expect(validateWorkManualSource(source).errors).toContain(
      "Work Manual contains an overbroad Chronicle stop gate",
    );
  });

  it("rejects an inactive manual at the canonical authority path", () => {
    const source = canonicalSource.replace(
      "status: active-provisional",
      "status: inactive-review-draft",
    );

    expect(validateWorkManualSource(source).errors.join("\n")).toContain(
      "invalid Work Manual metadata",
    );
  });

  it("rejects a changed reviewed chapter", () => {
    const source = canonicalSource.replace(
      "Routine is the firm cheap path, not a preliminary phase.",
      "Routine is the expanded path.",
    );

    expect(validateWorkManualSource(source).errors.join("\n")).toContain(
      "reviewed chapter bytes changed",
    );
  });

  it("rejects a missing required chapter", () => {
    const source = canonicalSource.replace(
      "## 11. Checks, Delivery, and Reporting",
      "## Checks and reporting",
    );

    expect(validateWorkManualSource(source).errors).toContain(
      'expected exactly one level-two heading "11. Checks, Delivery, and Reporting", found 0',
    );
  });

  it("accepts synchronized thin pointers", () => {
    const result = validateWorkManualSource(canonicalSource);
    expect(result.metadata).not.toBeNull();

    expect(
      validateWorkManualPointers(result.metadata!, [
        { label: "repo", source: pointerSource() },
        { label: "parent", source: pointerSource() },
        { label: "skill", source: pointerSource() },
      ]),
    ).toEqual({ ok: true, errors: [] });
  });

  it("rejects stale, duplicated, or obsolete pointer authority", () => {
    const result = validateWorkManualSource(canonicalSource);
    const pointers = validateWorkManualPointers(result.metadata!, [
      { label: "stale", source: pointerSource("0.1-phase-c-draft") },
      {
        label: "duplicate",
        source: `${pointerSource()}\n## 2. Routine Local Work`,
      },
      {
        label: "obsolete",
        source: `${pointerSource()}\nChronicle route policy: old.md`,
      },
      {
        label: "broad-gate",
        source: `${pointerSource()}\nStop all ordinary Chronicle work.`,
      },
    ]);

    expect(pointers.errors).toContain(
      "stale must contain exactly one current Work Manual version marker",
    );
    expect(pointers.errors).toContain(
      "duplicate duplicates or revives Chronicle workflow authority",
    );
    expect(pointers.errors).toContain(
      "obsolete duplicates or revives Chronicle workflow authority",
    );
    expect(pointers.errors).toContain(
      "broad-gate contains an overbroad Chronicle stop gate",
    );
  });
});
