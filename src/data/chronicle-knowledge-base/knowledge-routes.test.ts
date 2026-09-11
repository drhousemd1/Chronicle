import { describe, expect, it } from "vitest";

import {
  buildArchivedCurrentWorkHref,
  buildChangelogRecordPath,
  buildKnowledgeBaseTabHref,
  buildQualityHubChangelogHref,
  buildQualityHubOverviewHref,
} from "./knowledge-routes";

describe("Chronicle Knowledge navigation registry", () => {
  it("owns live Changelog destinations and the historical work archive reader in one source", () => {
    expect(buildKnowledgeBaseTabHref("community-gallery", "changelog")).toBe(
      "/style-guide/chronicle-knowledge-base?section=community-gallery&tab=changelog",
    );
    expect(buildQualityHubChangelogHref()).toBe(
      "/style-guide/ui-audit?view=changelog",
    );
    expect(buildQualityHubChangelogHref("community-gallery")).toBe(
      "/style-guide/ui-audit?view=changelog&capability=community-gallery",
    );
    expect(buildQualityHubOverviewHref("CG-CHANGE-001")).toBe(
      "/style-guide/ui-audit#changelog-CG-CHANGE-001",
    );
    expect(buildChangelogRecordPath("CG CHANGE/001")).toBe(
      "/style-guide/changelog/CG%20CHANGE%2F001",
    );
    expect(buildArchivedCurrentWorkHref("CG WORK/001")).toBe(
      "/style-guide/chronicle-knowledge-base/archive/CG%20WORK%2F001",
    );
  });
});
