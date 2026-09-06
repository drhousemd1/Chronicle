import { describe, expect, it } from "vitest";

import {
  ISSUE_OPERATIONAL_CAPABILITIES,
  OPERATIONAL_CAPABILITIES,
  assertOperationalIssueOwner,
  assertOperationalProjectOwner,
  canonicalIssueSourcePath,
  canonicalCurrentWorkSourcePath,
  getOperationalCapability,
  isOperationalNestedId,
  isOperationalIssueId,
  isOperationalProjectId,
  parseOperationalIssueId,
  parseOperationalProjectId,
} from "./operational-capability-registry";

describe("operational capability registry", () => {
  it("contains the explicitly approved operational owner mappings", () => {
    expect(OPERATIONAL_CAPABILITIES).toEqual([
      {
        id: "community-gallery",
        displayName: "Community Gallery",
        recordPrefix: "CG",
        activePath: "docs/current-work/active/community-gallery",
        archivePath: "docs/current-work/archive/community-gallery",
      },
      {
        id: "my-stories",
        displayName: "My Stories",
        recordPrefix: "MS",
        activePath: "docs/current-work/active/my-stories",
        archivePath: "docs/current-work/archive/my-stories",
      },
      {
        id: "character-library",
        displayName: "Character Library",
        recordPrefix: "CL",
        activePath: "docs/current-work/active/character-library",
        archivePath: "docs/current-work/archive/character-library",
      },
      {
        id: "my-images",
        displayName: "Image Library",
        recordPrefix: "MI",
        activePath: "docs/current-work/active/my-images",
        archivePath: "docs/current-work/archive/my-images",
      },
      {
        id: "story-builder",
        displayName: "Story Builder",
        recordPrefix: "SB",
        activePath: "docs/current-work/active/story-builder",
        archivePath: "docs/current-work/archive/story-builder",
      },
      {
        id: "character-builder",
        displayName: "Character Builder",
        recordPrefix: "CB",
        activePath: "docs/current-work/active/character-builder",
        archivePath: "docs/current-work/archive/character-builder",
      },
      {
        id: "chat-interface",
        displayName: "Chat Interface",
        recordPrefix: "CI",
        activePath: "docs/current-work/active/chat-interface",
        archivePath: "docs/current-work/archive/chat-interface",
      },
      {
        id: "roleplay-pipeline",
        displayName: "Roleplay Pipeline",
        recordPrefix: "RP",
        activePath: "docs/current-work/active/roleplay-pipeline",
        archivePath: "docs/current-work/archive/roleplay-pipeline",
      },
      {
        id: "chat-history",
        displayName: "Chat History",
        recordPrefix: "CH",
        activePath: "docs/current-work/active/chat-history",
        archivePath: "docs/current-work/archive/chat-history",
      },
      {
        id: "public-profile",
        displayName: "Public Profile",
        recordPrefix: "PP",
        activePath: "docs/current-work/active/public-profile",
        archivePath: "docs/current-work/archive/public-profile",
      },
      {
        id: "account",
        displayName: "Account & Subscription",
        recordPrefix: "AC",
        activePath: "docs/current-work/active/account",
        archivePath: "docs/current-work/archive/account",
      },
      {
        id: "admin",
        displayName: "Admin Panel",
        recordPrefix: "AD",
        activePath: "docs/current-work/active/admin",
        archivePath: "docs/current-work/archive/admin",
      },
      {
        id: "shared-systems",
        displayName: "Shared Application Systems",
        recordPrefix: "SA",
        activePath: "docs/current-work/active/shared-systems",
        archivePath: "docs/current-work/archive/shared-systems",
      },
      {
        id: "knowledge-system",
        displayName: "Chronicle Knowledge System",
        recordPrefix: "KS",
        activePath: "docs/current-work/active/knowledge-system",
        archivePath: "docs/current-work/archive/knowledge-system",
      },
    ]);
  });

  it("validates caller-supplied identities without allocating a number", () => {
    expect(parseOperationalProjectId("KS-WORK-001")).toMatchObject({
      projectId: "KS-WORK-001",
      sequence: "001",
      capability: { id: "knowledge-system", recordPrefix: "KS" },
    });
    expect(isOperationalProjectId("CG-WORK-027")).toBe(true);
    expect(isOperationalProjectId("MS-WORK-027")).toBe(true);
    expect(isOperationalProjectId("CB-WORK-027")).toBe(true);
    expect(isOperationalProjectId("RP-WORK-027")).toBe(true);
    expect(isOperationalProjectId("KS-WORK-027")).toBe(true);
    expect(isOperationalProjectId("WORK-001")).toBe(false);
    expect(isOperationalProjectId("XY-WORK-001")).toBe(false);
    expect(getOperationalCapability("fabricated-capability")).toBeNull();
  });

  it("binds Issue identity, ownership, and canonical paths to the capability prefix", () => {
    expect(ISSUE_OPERATIONAL_CAPABILITIES.map((capability) => capability.id)).toEqual([
      "community-gallery",
      "my-stories",
      "character-library",
      "my-images",
      "story-builder",
      "character-builder",
      "chat-interface",
      "roleplay-pipeline",
      "chat-history",
      "public-profile",
      "account",
      "admin",
      "shared-systems",
    ]);
    expect(parseOperationalIssueId("MS-ISSUE-001")).toMatchObject({
      issueId: "MS-ISSUE-001",
      sequence: "001",
      capability: { id: "my-stories", recordPrefix: "MS" },
    });
    expect(isOperationalIssueId("CL-ISSUE-999")).toBe(true);
    expect(isOperationalIssueId("RP-ISSUE-001")).toBe(true);
    expect(isOperationalIssueId("KS-ISSUE-001")).toBe(false);
    expect(isOperationalIssueId("XY-ISSUE-001")).toBe(false);
    expect(canonicalIssueSourcePath("CB-ISSUE-003")).toBe(
      "docs/architecture-knowledge/issues/character-builder/CB-ISSUE-003.md",
    );
    expect(() =>
      assertOperationalIssueOwner("MI-ISSUE-001", "my-stories"),
    ).toThrow(/belongs to my-images/);
  });

  it("binds the owner, nested IDs, and canonical paths to the same prefix", () => {
    expect(
      canonicalCurrentWorkSourcePath("active", "KS-WORK-001"),
    ).toBe("docs/current-work/active/knowledge-system/KS-WORK-001.md");
    expect(
      canonicalCurrentWorkSourcePath("archive", "KS-WORK-001"),
    ).toBe("docs/current-work/archive/knowledge-system/KS-WORK-001.md");
    expect(isOperationalNestedId("KS-WORK-001", "STEP", "KS-STEP-001")).toBe(
      true,
    );
    expect(isOperationalNestedId("KS-WORK-001", "EV", "CG-EV-001")).toBe(
      false,
    );
    expect(() =>
      assertOperationalProjectOwner("KS-WORK-001", "community-gallery"),
    ).toThrow(/belongs to knowledge-system/);
  });
});
