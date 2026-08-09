import { describe, expect, it } from "vitest";

import {
  CHRONICLE_CHANGELOG_RECORDS_CHECKED_ON,
  loadChronicleChangelogRegistry,
  readCanonicalChangelogRegistryModules,
  readChangelogRegistrySources,
  selectLoadedChangelogEntries,
} from "./changelog-record-sources";

const EXPECTED_GALLERY_IDS = [
  "CG-CHANGE-001",
  "LEGACY-QH-cl-20260327-001",
  "LEGACY-QH-cl-20260327-006",
  "LEGACY-QH-cl-20260330-001",
  "LEGACY-QH-cl-20260404-004",
  "LEGACY-QH-cl-20260405-001",
  "LEGACY-QH-cl-20260405-002",
  "LEGACY-QH-cl-20260410-001",
  "LEGACY-QH-cl-20260411-002",
  "LEGACY-QH-cl-20260417-001",
  "LEGACY-QH-cl-20260417-002",
  "LEGACY-QH-cl-20260417-003",
  "LEGACY-QH-cl-20260417-005",
  "LEGACY-QH-cl-20260417-007",
  "LEGACY-QH-cl-20260417-008",
  "LEGACY-QH-cl-20260613-003",
  "LEGACY-QH-cl-20260614-003",
  "LEGACY-QH-cl-20260614-004",
  "LEGACY-QH-cl-20260614-005",
  "LEGACY-QH-cl-20260619-001",
  "LEGACY-QH-cl-20260619-002",
  "LEGACY-QH-cl-20260619-003",
  "LEGACY-QH-cl-20260620-001",
].sort();

function acceptedRecordOnSharedCheckDate() {
  const id = "CG-CHANGE-900";
  const sourcePath = `docs/architecture-knowledge/changelog/entries/${id}.md`;

  return {
    [sourcePath]: `---
record_type: changelog
variant: accepted_closeout
change_id: ${id}
title: Shared date boundary fixture
change_date: ${CHRONICLE_CHANGELOG_RECORDS_CHECKED_ON}
problem: The shared reader fixture needed a complete accepted narrative.
why_change_was_needed: A date-boundary result alone would not explain why the accepted work mattered.
changes: The accepted fixture now carries the required source-readable narrative fields.
outcome: The shared Changelog reader accepts a closeout on its recorded check date.
accepted_evidence_summary: The fixture acceptance proof and archived work relationship are recorded.
accepted_evidence_limits: The fixture proves only the shared source-reader date boundary.
provenance: accepted-closeout
affected_capabilities: [community-gallery]
owning_capability: community-gallery
accepted_on: ${CHRONICLE_CHANGELOG_RECORDS_CHECKED_ON}
accepted_by: Chronicle owner
acceptance_ref: CG-EV-900
source_revision: sha256:${"c".repeat(64)}
archived_project_id: CG-WORK-900
archive_record: docs/current-work/archive/community-gallery/CG-WORK-900.md
archive_route: /style-guide/chronicle-knowledge-base/archive/CG-WORK-900
resolved_issue_ids: []
remaining_issue_ids: []
source_record: ${sourcePath}
---
# ${id}: Shared date boundary fixture

## Problem

The shared reader fixture needed a complete accepted narrative.

## Why the Change Was Needed

A date-boundary result alone would not explain why the accepted work mattered.

## Changes

The accepted fixture now carries the required source-readable narrative fields.

## Outcome

The shared Changelog reader accepts a closeout on its recorded check date.

## Accepted Evidence Summary

The fixture acceptance proof and archived work relationship are recorded.

## Accepted Evidence Limits

The fixture proves only the shared source-reader date boundary.

## Provenance

This fixture is limited to the source-loader date boundary.

## Applicability

This fixture applies to Community Gallery.

## Acceptance and Source State

The accepted date matches the reader's recorded check date.

## Issue Disposition

No Issues are linked to this fixture.

## Preserved Work Record

The fixture points to its exact archived Current Work record.
`,
  };
}

describe("canonical Changelog record sources", () => {
  it("loads one cached 204-record registry and the exact reviewed Gallery projection", async () => {
    const first = await loadChronicleChangelogRegistry();
    const second = await loadChronicleChangelogRegistry();

    expect(second).toBe(first);
    expect(first.status).toBe("ready");
    if (first.status !== "ready") return;

    const global = selectLoadedChangelogEntries(first);
    const gallery = selectLoadedChangelogEntries(first, "community-gallery");
    const globalIds = global.map((entry) => entry.id);
    const galleryIds = gallery.map((entry) => entry.id);

    expect(global).toHaveLength(204);
    expect(new Set(globalIds).size).toBe(204);
    expect(gallery).toHaveLength(23);
    expect(new Set(galleryIds).size).toBe(23);
    expect([...galleryIds].sort()).toEqual(EXPECTED_GALLERY_IDS);
    expect(galleryIds.every((id) => globalIds.includes(id))).toBe(true);
    expect(
      gallery.every((entry) =>
        entry.affectedCapabilities.includes("community-gallery"),
      ),
    ).toBe(true);
    expect(galleryIds).not.toContain("LEGACY-QH-cl-20260331-005");

    for (let index = 1; index < global.length; index += 1) {
      const previous = global[index - 1];
      const current = global[index];
      expect(
        previous.changeDate > current.changeDate ||
          (previous.changeDate === current.changeDate && previous.id < current.id),
      ).toBe(true);
    }
  });

  it("distinguishes a valid empty registry from malformed repository history", () => {
    const empty = readChangelogRegistrySources({});
    expect(empty.status).toBe("ready");
    if (empty.status === "ready") {
      expect(empty.registry.effectiveEntries).toEqual([]);
    }

    const malformed = readChangelogRegistrySources({
      "docs/architecture-knowledge/changelog/entries/BAD.md": [
        "---",
        "record_type: changelog",
        "variant: legacy_import",
        "---",
        "# Incomplete record",
      ].join("\n"),
    });
    expect(malformed.status).toBe("error");
    if (malformed.status === "error") {
      expect(malformed.errors.length).toBeGreaterThan(0);
    }

    const missingCanonicalSources = readCanonicalChangelogRegistryModules({});
    expect(missingCanonicalSources.status).toBe("error");
    if (missingCanonicalSources.status === "error") {
      expect(missingCanonicalSources.errors[0]).toContain(
        "source-loading failure, not an empty history",
      );
    }
  });

  it("accepts a modern closeout dated on the shared canonical check date", () => {
    const result = readChangelogRegistrySources(
      acceptedRecordOnSharedCheckDate(),
    );

    expect(result.status).toBe("ready");
    if (result.status === "ready") {
      expect(result.registry.effectiveEntries).toHaveLength(1);
      expect(result.registry.effectiveEntries[0].changeDate).toBe(
        CHRONICLE_CHANGELOG_RECORDS_CHECKED_ON,
      );
    }
  });
});
