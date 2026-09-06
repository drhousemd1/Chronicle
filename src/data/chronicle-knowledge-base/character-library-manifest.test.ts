import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  chronicleKnowledgeSections,
  getKnowledgeDocumentSource,
  getKnowledgeTabMarkdown,
  parseKnowledgeDocument,
} from "./manifest";

describe("Character Library Knowledge manifest", () => {
  function getCharacterLibrary() {
    return chronicleKnowledgeSections.find(
      (section) => section.id === "character-library",
    )!;
  }

  it("passes the Overview gate through the Character Library source document", () => {
    const section = getCharacterLibrary();
    const tab = section.tabs.find((candidate) => candidate.id === "overview")!;
    const markdown = getKnowledgeTabMarkdown(section, tab);

    expect(section.document).toBe("character-library.md");
    expect(section.description).toBe(
      "How reusable global characters are created, edited, selected, copied into stories, and kept separate from story-owned characters.",
    );
    expect(tab).toMatchObject({
      label: "Overview",
      contentKind: "markdown-section",
      heading: "Overview",
      reviewed: "08/22/2026",
      updated: "08/22/2026",
    });
    expect(markdown.length).toBeGreaterThan(10_000);
    expect(markdown).toContain("## Character Library at a Glance");
    expect(markdown).toContain("## Ownership, Reuse, and Lifecycle");
    expect(markdown).toContain(
      "## Loading, Empty, Failure, and Recovery Expectations",
    );
    expect(markdown).toContain("## Handoffs to the Rest of Chronicle");
    expect(markdown).toContain("The practical rule is copy independence");
    expect(markdown).toContain(
      "The synchronized Supabase reference describes the documented `characters` table",
    );
    expect(markdown).not.toContain(
      "deep-clones the profile without assigning a new UUID",
    );
    expect(markdown).not.toContain("console-only");
  });

  it("passes the UI Elements and Functions gate through the intended heading", () => {
    const section = getCharacterLibrary();
    const tab = section.tabs.find(
      (candidate) => candidate.id === "ui-elements-functions",
    )!;
    const markdown = getKnowledgeTabMarkdown(section, tab);

    expect(tab).toMatchObject({
      label: "UI Elements and Functions",
      contentKind: "markdown-section",
      heading: "UI Elements and Functions",
      reviewed: "08/22/2026",
      updated: "08/22/2026",
    });
    expect(markdown.length).toBeGreaterThan(15_000);
    expect(markdown).toContain("## Workspace Entry and Page Header");
    expect(markdown).toContain("## Collection Grid and Character Cards");
    expect(markdown).toContain("## Character Editor Frame and Section Navigation");
    expect(markdown).toContain("Search characters...");
    expect(markdown).toContain("Update Character");
    expect(markdown).toContain("Global Library");
    expect(markdown).toContain("Use all details currently in character card");
    expect(markdown).toContain("Select Image");
    expect(markdown).toContain("Enhancement Style");
    expect(markdown).toContain("Generate Avatar");
    expect(markdown).toContain("Add Text Field");
    expect(markdown).not.toContain(
      "The editor's **Back** callback clears only `selectedCharacterId`",
    );
    expect(markdown).not.toContain("has `tabIndex={-1}`");
  });

  it("passes the App Architecture gate and recomputes its exact source composite", () => {
    const section = getCharacterLibrary();
    const tab = section.tabs.find(
      (candidate) => candidate.id === "app-architecture",
    )!;
    const markdown = getKnowledgeTabMarkdown(section, tab);

    expect(tab).toMatchObject({
      label: "App Architecture",
      contentKind: "markdown-section",
      heading: "App Architecture",
      reviewed: "08/22/2026",
      updated: "08/22/2026",
    });
    expect(markdown.length).toBeGreaterThan(30_000);
    expect(markdown).toContain("## Coverage and Delivery Boundary");
    expect(markdown).toContain("## Ordered Runtime and Data Flows");
    expect(markdown).toContain("## State Authority and Conflict Precedence");
    expect(markdown).toContain("## Diagnostics Versus Enforcement");
    expect(markdown).toContain("## Current Implementation Limitations");
    expect(markdown).toContain("scenario_id = null");
    expect(markdown).toContain("get_public_art_styles");
    expect(markdown).toContain("Unauthorized: characters row");
    expect(markdown).toContain("deep-clones the profile without assigning a new UUID");
    expect(markdown).toContain("handleDeleteAvatar()");
    expect(markdown).toContain("`characterInLibrary` browser state");
    expect(markdown).toContain("src/hooks/use-index-scenario-persistence.ts");
    expect(markdown).toContain(
      "The architecture review inspected these 59 existing paths",
    );

    const sourceBlock = markdown
      .split("### Exact ordered source paths")[1]
      .split("### Composite algorithm and value")[0];
    const inspectedPaths = sourceBlock
      .split("```text")[1]
      .split("```")[0]
      .trim()
      .split("\n");
    expect(inspectedPaths).toHaveLength(59);
    for (const sourcePath of inspectedPaths) {
      expect(existsSync(sourcePath), sourcePath).toBe(true);
    }

    const shaListing = inspectedPaths
      .map((sourcePath) => {
        const digest = createHash("sha256")
          .update(readFileSync(sourcePath))
          .digest("hex");
        return `${digest}  ${sourcePath}\n`;
      })
      .join("");
    const composite = createHash("sha256")
      .update(shaListing)
      .digest("hex");
    expect(markdown).toContain(composite);
  });

  it("passes the Supabase Tables gate through the unchanged shared source", () => {
    const section = getCharacterLibrary();
    const tab = section.tabs.find(
      (candidate) => candidate.id === "supabase-tables",
    )!;
    const gallery = chronicleKnowledgeSections.find(
      (candidate) => candidate.id === "community-gallery",
    )!;
    const galleryTab = gallery.tabs.find(
      (candidate) => candidate.id === "supabase-tables",
    )!;
    const markdown = getKnowledgeTabMarkdown(section, tab);

    expect(tab).toMatchObject({
      label: "Supabase Tables",
      contentKind: "shared-supabase",
      reviewed: "08/22/2026",
      updated: "07/31/2026",
    });
    expect(markdown).toBe(getKnowledgeTabMarkdown(gallery, galleryTab));
    expect(markdown).toContain("## Supabase Tables");
    expect(markdown).toContain("last synchronized documented structure");
    expect(markdown).toContain(
      "](/style-guide/supabase-schema-reference)",
    );
    expect(markdown).toContain("/src/data/supabase-schema-reference.ts");
    expect(markdown).toContain(
      "This page supplies reference and handoff mechanics; it does not decide when a Chronicle task requires",
    );
    expect(markdown).toContain(
      "identify anything that cannot be verified as unverified rather than guessing",
    );
  });

  it("passes the Character Library application-map gate", () => {
    const applicationMap = chronicleKnowledgeSections.find(
      (section) => section.id === "chronicle-overview",
    )!;
    const tab = applicationMap.tabs.find(
      (candidate) => candidate.id === "character-library",
    )!;
    const markdown = getKnowledgeTabMarkdown(applicationMap, tab);

    expect(tab).toMatchObject({
      label: "Character Library",
      contentKind: "markdown-section",
      heading: "Character Library",
      reviewed: "08/22/2026",
      updated: "08/22/2026",
    });
    expect(markdown.length).toBeGreaterThan(1_500);
    expect(markdown).toContain(
      "Character Library is the account's reusable character source",
    );
    expect(markdown).toContain("### What Character Library receives");
    expect(markdown).toContain("### What Character Library produces");
    expect(markdown).toContain("### Ownership transfers at the copy boundary");
    expect(markdown).toContain("Story Builder becomes the immediate next-stage owner");
    expect(markdown).not.toContain("Index.tsx");
    expect(markdown).not.toContain("Unauthorized: characters row");
  });

  it("registers isolated operational tabs and keeps raw headings exact", () => {
    const section = getCharacterLibrary();
    expect(section.tabs.map((tab) => tab.label)).toEqual([
      "Overview",
      "UI Elements and Functions",
      "App Architecture",
      "Issues",
      "Current Work",
      "Supabase Tables",
      "Changelog",
    ]);
    expect(section.tabs.find((tab) => tab.id === "issues")).toMatchObject({
      contentKind: "issue-records",
      openIssueCount: 2,
    });

    const source = getKnowledgeDocumentSource(section.document!);
    expect(parseKnowledgeDocument(source).headings).toEqual([
      "Overview",
      "UI Elements and Functions",
      "App Architecture",
    ]);
  });
});
