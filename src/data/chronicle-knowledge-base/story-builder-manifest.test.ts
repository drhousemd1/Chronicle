import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  chronicleKnowledgeSections,
  getKnowledgeDocumentSource,
  getKnowledgeTabMarkdown,
  parseKnowledgeDocument,
} from "./manifest";

describe("Story Builder Knowledge manifest", () => {
  function getStoryBuilder() {
    return chronicleKnowledgeSections.find(
      (section) => section.id === "story-builder",
    )!;
  }

  it("passes the Overview gate through the Story Builder source", () => {
    const section = getStoryBuilder();
    const tab = section.tabs.find((candidate) => candidate.id === "overview")!;
    const markdown = getKnowledgeTabMarkdown(section, tab);

    expect(section.document).toBe("story-builder.md");
    expect(section.description).toBe(
      "How a story's world, direction, cast, opening state, media, and publication readiness are assembled.",
    );
    expect(tab).toMatchObject({
      label: "Overview",
      contentKind: "markdown-section",
      heading: "Overview",
      reviewed: "08/22/2026",
      updated: "08/22/2026",
    });
    expect(markdown.length).toBeGreaterThan(15_000);
    expect(markdown).toContain("## Story Builder at a Glance");
    expect(markdown).toContain("## Ownership and Story Lifecycle");
    expect(markdown).toContain("## Complete Authoring Workflows");
    expect(markdown).toContain(
      "## Loading, Empty, Failure, and Recovery Expectations",
    );
    expect(markdown).toContain("## Handoffs to the Rest of Chronicle");
    expect(markdown).not.toContain("save_scenario_atomic");
    expect(markdown).not.toContain("console-only");
  });

  it("passes the UI Elements and Functions gate", () => {
    const section = getStoryBuilder();
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
    expect(markdown.length).toBeGreaterThan(14_000);
    expect(markdown).toContain("## Workspace Frame and Header Actions");
    expect(markdown).toContain("## Character Roster and Character Creation");
    expect(markdown).toContain("## Story Card");
    expect(markdown).toContain("## World Core and Custom World Content");
    expect(markdown).toContain("## Story Goals");
    expect(markdown).toContain("## Opening Dialog and Starting Clock");
    expect(markdown).toContain("## Scene Gallery");
    expect(markdown).toContain("## Content Themes");
    expect(markdown).toContain("## Share Your Story and Publication Controls");
    expect(markdown).toContain("Finalize and Close");
    expect(markdown).toContain("Generate Scene Image");
    expect(markdown).toContain("Coercion / Manipulation");
    expect(markdown).not.toContain("save_scenario_atomic");
    expect(markdown).not.toContain("console-only");
  });

  it("passes the App Architecture gate and recomputes its source composite", () => {
    const section = getStoryBuilder();
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
    expect(markdown).toContain("## Ordered Runtime and Data Flows");
    expect(markdown).toContain("## State Authority and Conflict Precedence");
    expect(markdown).toContain("## Responsibility and Ownership Map");
    expect(markdown).toContain("## Diagnostics Versus Enforcement");
    expect(markdown).toContain("## Current Implementation Limitations");
    expect(markdown).toContain("save_scenario_atomic");
    expect(markdown).toContain("get_public_art_styles");
    expect(markdown).toContain("The architecture review inspected these **92 existing paths**");

    const sourceBlock = markdown
      .split("### Exact ordered source paths")[1]
      .split("### Composite algorithm and value")[0];
    const inspectedPaths = sourceBlock
      .split("```text")[1]
      .split("```")[0]
      .trim()
      .split("\n");
    expect(inspectedPaths).toHaveLength(92);
    for (const sourcePath of inspectedPaths) {
      expect(existsSync(sourcePath), sourcePath).toBe(true);
    }

    const listing = inspectedPaths
      .map((sourcePath) => {
        const digest = createHash("sha256")
          .update(readFileSync(sourcePath))
          .digest("hex");
        return `${digest}  ${sourcePath}\n`;
      })
      .join("");
    const composite = createHash("sha256").update(listing).digest("hex");
    expect(markdown).toContain(composite);
  });

  it("passes the unchanged shared Supabase Tables gate", () => {
    const section = getStoryBuilder();
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

  it("passes the Story Builder application-map gate", () => {
    const applicationMap = chronicleKnowledgeSections.find(
      (section) => section.id === "chronicle-overview",
    )!;
    const tab = applicationMap.tabs.find(
      (candidate) => candidate.id === "story-builder",
    )!;
    const markdown = getKnowledgeTabMarkdown(applicationMap, tab);

    expect(tab).toMatchObject({
      label: "Story Builder",
      contentKind: "markdown-section",
      heading: "Story Builder",
      reviewed: "08/22/2026",
      updated: "08/22/2026",
    });
    expect(markdown.length).toBeGreaterThan(2_500);
    expect(markdown).toContain(
      "Story Builder is Chronicle's story-source authoring owner",
    );
    expect(markdown).toContain("### What Story Builder receives");
    expect(markdown).toContain("### What Story Builder produces");
    expect(markdown).toContain(
      "### Ownership transfers at save, publication, and play",
    );
    expect(markdown).toContain("Chat Interface becomes the next-stage owner");
    expect(markdown).not.toContain("Index.tsx");
    expect(markdown).not.toContain("save_scenario_atomic");
  });

  it("registers isolated operational tabs and raw headings exact", () => {
    const section = getStoryBuilder();
    expect(section.tabs.map((tab) => tab.label)).toEqual([
      "Overview",
      "UI Elements and Functions",
      "App Architecture",
      "Issues",
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
