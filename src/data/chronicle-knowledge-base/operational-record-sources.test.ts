import { describe, expect, it } from "vitest";

import { chronicleChangelogRecordSources } from "./changelog-record-sources";
import {
  chronicleOperationalRecordRegistry,
  chronicleOperationalRecordSources,
  galleryOperationalRecordRegistry,
  galleryOperationalRecordSources,
  getCapabilityOperationalRecordRegistry,
} from "./operational-record-sources";

describe("Community Gallery browser operational sources", () => {
  it("validates archived work against the same canonical Changelog source set", () => {
    const changelogPaths = Object.keys(chronicleChangelogRecordSources);

    expect(changelogPaths.length).toBeGreaterThan(0);
    expect(
      changelogPaths.every(
        (sourcePath) => galleryOperationalRecordSources[sourcePath] !== undefined,
      ),
    ).toBe(true);
    expect(galleryOperationalRecordRegistry.changelogEntries).toHaveLength(
      changelogPaths.length,
    );
    expect(
      galleryOperationalRecordRegistry.changelogRegistry.records,
    ).toHaveLength(changelogPaths.length);
    expect(
      galleryOperationalRecordRegistry.changelogRegistry.effectiveEntries,
    ).toHaveLength(
      galleryOperationalRecordRegistry.changelogRegistry.roots.length,
    );
    expect(
      galleryOperationalRecordRegistry.changelogRegistry.roots.length +
        galleryOperationalRecordRegistry.changelogRegistry.corrections.length,
    ).toBe(changelogPaths.length);
    expect(galleryOperationalRecordRegistry.archivedProjects.map((project) => project.id))
      .toEqual(["CG-WORK-001", "CG-WORK-002"]);
  });

  it("keeps retired work in history and exposes no active project or resume target", () => {
    expect(Object.keys(chronicleOperationalRecordSources)
      .some((sourcePath) => sourcePath.includes("/current-work/active/"))).toBe(false);
    expect(chronicleOperationalRecordRegistry.activeProjects).toEqual([]);
    expect(galleryOperationalRecordRegistry.activeProjects).toEqual([]);
    expect(chronicleOperationalRecordRegistry.archivedProjects.map((project) => project.id))
      .toEqual(["CG-WORK-001", "CG-WORK-002", "KS-WORK-001", "KS-WORK-002", "KS-WORK-003", "KS-WORK-004", "KS-WORK-005", "KS-WORK-006", "KS-WORK-007"]);
    expect(galleryOperationalRecordRegistry.archivedProjects[0]).toMatchObject({
      id: "CG-WORK-001",
      ownerCapability: "community-gallery",
      workflowRetired: true,
    });
    expect(
      Object.keys(galleryOperationalRecordSources).some((sourcePath) =>
        sourcePath.includes("/knowledge-system/"),
      ),
    ).toBe(false);
  });

  it("projects Issues and owner-only work independently for every documented capability", () => {
    for (const capabilityId of [
      "my-stories",
      "character-library",
      "my-images",
      "story-builder",
      "character-builder",
    ] as const) {
      const registry = getCapabilityOperationalRecordRegistry(capabilityId);
      expect(registry.issues, capabilityId).toHaveLength(2);
      expect(
        registry.issues.every((issue) => issue.ownerCapability === capabilityId),
        capabilityId,
      ).toBe(true);
      expect(registry.openIssueCount, capabilityId).toBe(2);
      expect(registry.activeProjects, capabilityId).toEqual([]);
      expect(registry.archivedProjects, capabilityId).toEqual([]);
    }

    for (const capabilityId of [
      "chat-interface",
      "chat-history",
      "public-profile",
      "account",
      "admin",
      "shared-systems",
    ] as const) {
      const registry = getCapabilityOperationalRecordRegistry(capabilityId);
      expect(registry.issues, capabilityId).toEqual([]);
      expect(registry.openIssueCount, capabilityId).toBe(0);
      expect(registry.activeProjects, capabilityId).toEqual([]);
      expect(registry.archivedProjects, capabilityId).toEqual([]);
    }
  });
});
