import { describe, expect, it } from "vitest";

import { chronicleChangelogRecordSources } from "./changelog-record-sources";
import {
  galleryOperationalRecordRegistry,
  galleryOperationalRecordSources,
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
    expect(galleryOperationalRecordRegistry.archivedProjects).toHaveLength(1);
    expect(galleryOperationalRecordRegistry.archivedProjects[0]?.id).toBe(
      "CG-WORK-002",
    );
  });
});
