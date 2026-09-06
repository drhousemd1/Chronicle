import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  chronicleKnowledgeSections,
  getKnowledgeDocumentSource,
  getKnowledgeTabMarkdown,
  parseKnowledgeDocument,
} from "./manifest";

describe("My Images Knowledge manifest", () => {
  function getMyImages() {
    return chronicleKnowledgeSections.find(
      (section) => section.id === "my-images",
    )!;
  }

  it("passes the Overview gate through the My Images source", () => {
    const section = getMyImages();
    const tab = section.tabs.find((candidate) => candidate.id === "overview")!;
    const markdown = getKnowledgeTabMarkdown(section, tab);

    expect(section.document).toBe("my-images.md");
    expect(section.description).toBe(
      "How private images are uploaded, organized, viewed, copied into consuming features, and deleted.",
    );
    expect(tab).toMatchObject({
      label: "Overview",
      contentKind: "markdown-section",
      heading: "Overview",
      reviewed: "08/22/2026",
      updated: "08/22/2026",
    });
    expect(markdown.length).toBeGreaterThan(10_000);
    expect(markdown).toContain("## My Images at a Glance");
    expect(markdown).toContain("## Ownership and Media Lifecycle");
    expect(markdown).toContain("## Loading, Empty, Failure, and Recovery Expectations");
    expect(markdown).toContain("## Handoffs to the Rest of Chronicle");
    expect(markdown).toContain("A handoff creates an independent destination copy");
    expect(markdown).not.toContain("hasLoadedRef");
    expect(markdown).not.toContain("console-only");
  });

  it("passes the UI Elements and Functions gate", () => {
    const section = getMyImages();
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
    expect(markdown).toContain("## Workspace Entry and Shared Header");
    expect(markdown).toContain("## Folder Library");
    expect(markdown).toContain("## Open Folder Workspace");
    expect(markdown).toContain("## Image Details Editor");
    expect(markdown).toContain("## Image Library Background");
    expect(markdown).toContain("## Select from Image Library Consumer Picker");
    expect(markdown).toContain("+ Upload Images");
    expect(markdown).toContain("Migration pending — re-upload required");
    expect(markdown).toContain("Could not use that image. Please try again.");
    expect(markdown).not.toContain("hasLoadedRef");
    expect(markdown).not.toContain("fixed black ten-percent overlay");
  });

  it("passes the App Architecture gate and recomputes its source composite", () => {
    const section = getMyImages();
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
    expect(markdown).toContain("## Diagnostics Versus Enforcement");
    expect(markdown).toContain("## Current Implementation Limitations");
    expect(markdown).toContain("get_folders_with_details");
    expect(markdown).toContain("PublicProfileTab.uploadAvatarFromUrl()");
    expect(markdown).toContain("The architecture review inspected these **47 existing paths**");

    const sourceBlock = markdown
      .split("### Exact ordered source paths")[1]
      .split("### Composite algorithm and value")[0];
    const inspectedPaths = sourceBlock
      .split("```text")[1]
      .split("```")[0]
      .trim()
      .split("\n");
    expect(inspectedPaths).toHaveLength(47);
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
    const section = getMyImages();
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

  it("passes the My Images application-map gate", () => {
    const applicationMap = chronicleKnowledgeSections.find(
      (section) => section.id === "chronicle-overview",
    )!;
    const tab = applicationMap.tabs.find(
      (candidate) => candidate.id === "my-images",
    )!;
    const markdown = getKnowledgeTabMarkdown(applicationMap, tab);

    expect(tab).toMatchObject({
      label: "Image Library",
      contentKind: "markdown-section",
      heading: "Image Library",
      reviewed: "08/22/2026",
      updated: "08/22/2026",
    });
    expect(markdown.length).toBeGreaterThan(2_500);
    expect(markdown).toContain(
      "Image Library is the account's private reusable media source",
    );
    expect(markdown).toContain("### What Image Library receives");
    expect(markdown).toContain("### What Image Library produces");
    expect(markdown).toContain(
      "### Ownership transfers at the destination-copy boundary",
    );
    expect(markdown).toContain("Story Builder is the immediate next-stage owner");
    expect(markdown).not.toContain("Index.tsx");
    expect(markdown).not.toContain("get_folders_with_details");
  });

  it("registers isolated operational tabs and raw headings exact", () => {
    const section = getMyImages();
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
