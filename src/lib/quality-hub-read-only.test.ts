import { describe, expect, it } from "vitest";

import { qualityHubInitialRegistry } from "@/data/ui-audit-findings";
import type {
  ChangeLogEntry,
  QualityHubRegistry,
} from "@/lib/ui-audit-schema";
import {
  canonicalJsonEqual,
  guardQualityHubRegistryUpdate,
  legacyChangeLogEqual,
  mergeRegistryUpgradePreservingLegacyChangeLog,
  prepareQualityHubWorkspaceImport,
  type QualityHubRegistryInput,
} from "@/lib/quality-hub-read-only";

function registry(): QualityHubRegistry {
  return structuredClone(qualityHubInitialRegistry);
}

function legacyEntry(id: string, title = id): ChangeLogEntry {
  const entry = structuredClone(qualityHubInitialRegistry.changeLog[0]);
  return {
    ...entry,
    id,
    title,
  };
}

describe("Quality Hub legacy Changelog read-only boundary", () => {
  it("compares object keys canonically while preserving array order as meaningful", () => {
    expect(canonicalJsonEqual({ b: 2, a: 1 }, { a: 1, b: 2 })).toBe(true);
    expect(legacyChangeLogEqual(
      [legacyEntry("first"), legacyEntry("second")],
      [legacyEntry("second"), legacyEntry("first")],
    )).toBe(false);
  });

  it("upgrades operational registry data without adding or reordering seed history", () => {
    const seed = registry();
    const persisted = registry();
    persisted.meta.registryVersion = 1;
    persisted.changeLog = [legacyEntry("owner-second"), legacyEntry("owner-first")];

    const upgraded = mergeRegistryUpgradePreservingLegacyChangeLog(seed, persisted);

    expect(upgraded.changeLog).toEqual(persisted.changeLog);
    expect(upgraded.changeLog.map((entry) => entry.id)).toEqual([
      "owner-second",
      "owner-first",
    ]);
    expect(upgraded.changeLog).not.toBe(persisted.changeLog);
    expect(upgraded.changeLog).toHaveLength(2);
  });

  it("uses an empty embedded history when an older registry has no Changelog", () => {
    const persisted: QualityHubRegistryInput = structuredClone(registry());
    delete persisted.changeLog;

    const upgraded = mergeRegistryUpgradePreservingLegacyChangeLog(
      registry(),
      persisted,
    );

    expect(upgraded.changeLog).toEqual([]);
  });

  it("rejects direct add, edit, and reorder attempts at the shared update boundary", () => {
    const current = registry();
    const protectedChangeLog = current.changeLog;

    const added = guardQualityHubRegistryUpdate(protectedChangeLog, {
      ...current,
      changeLog: [legacyEntry("new"), ...current.changeLog],
    });
    const edited = guardQualityHubRegistryUpdate(protectedChangeLog, {
      ...current,
      changeLog: current.changeLog.map((entry, index) => (
        index === 0 ? { ...entry, status: "planned" } : entry
      )),
    });
    const reordered = guardQualityHubRegistryUpdate(protectedChangeLog, {
      ...current,
      changeLog: [...current.changeLog].reverse(),
    });

    expect(added.accepted).toBe(false);
    expect(edited.accepted).toBe(false);
    expect(reordered.accepted).toBe(false);
  });

  it("accepts unrelated updates and returns a protected clone of the legacy history", () => {
    const current = registry();
    const protectedChangeLog = current.changeLog;
    const proposed = {
      ...current,
      handoffNotes: "Unrelated workspace update",
    };

    const result = guardQualityHubRegistryUpdate(protectedChangeLog, proposed);

    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.registry.handoffNotes).toBe("Unrelated workspace update");
    expect(result.registry.changeLog).toEqual(protectedChangeLog);
    expect(result.registry.changeLog).not.toBe(protectedChangeLog);
  });

  it("accepts imports with an omitted or identical Changelog and preserves the protected value", () => {
    const current = registry();
    current.changeLog = [legacyEntry("owner-only")];
    const withoutChangeLog: QualityHubRegistryInput = structuredClone(current);
    delete withoutChangeLog.changeLog;
    withoutChangeLog.handoffNotes = "Imported without legacy history";

    const missingResult = prepareQualityHubWorkspaceImport(
      current,
      current.changeLog,
      withoutChangeLog,
    );
    const equalResult = prepareQualityHubWorkspaceImport(
      current,
      current.changeLog,
      {
        ...structuredClone(current),
        changeLog: structuredClone(current.changeLog),
        handoffNotes: "Imported with identical legacy history",
      },
    );

    expect(missingResult.accepted).toBe(true);
    expect(equalResult.accepted).toBe(true);
    if (missingResult.accepted) {
      expect(missingResult.registry.changeLog).toEqual(current.changeLog);
    }
    if (equalResult.accepted) {
      expect(equalResult.registry.changeLog).toEqual(current.changeLog);
    }
  });

  it("rejects any import that adds, removes, edits, comments, or reorders legacy history", () => {
    const current = registry();
    current.changeLog = [legacyEntry("first"), legacyEntry("second")];

    const variants: QualityHubRegistry[] = [
      { ...structuredClone(current), changeLog: [legacyEntry("new"), ...current.changeLog] },
      { ...structuredClone(current), changeLog: current.changeLog.slice(1) },
      {
        ...structuredClone(current),
        changeLog: current.changeLog.map((entry, index) => (
          index === 0 ? { ...entry, title: "Edited" } : entry
        )),
      },
      {
        ...structuredClone(current),
        changeLog: current.changeLog.map((entry, index) => (
          index === 0
            ? {
                ...entry,
                comments: [
                  ...entry.comments,
                  {
                    id: "new-comment",
                    author: "Test",
                    timestamp: "2026-08-06T00:00:00.000Z",
                    text: "Changed",
                  },
                ],
              }
            : entry
        )),
      },
      { ...structuredClone(current), changeLog: [...current.changeLog].reverse() },
    ];

    for (const incoming of variants) {
      const result = prepareQualityHubWorkspaceImport(
        current,
        current.changeLog,
        incoming,
      );
      expect(result.accepted).toBe(false);
      if (!result.accepted) {
        expect(result.reason).toMatch(/No Quality Hub data was imported/);
      }
    }
  });
});
