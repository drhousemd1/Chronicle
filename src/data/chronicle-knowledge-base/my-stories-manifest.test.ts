import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

import {
  chronicleKnowledgeSections,
  getKnowledgeDocumentSource,
  getKnowledgeTabMarkdown,
  parseKnowledgeDocument,
} from "./manifest";

describe("My Stories Knowledge manifest", () => {
  function getMyStories() {
    return chronicleKnowledgeSections.find(
      (section) => section.id === "my-stories",
    )!;
  }

  it("passes the Overview gate through the My Stories source document", () => {
    const myStories = getMyStories();
    const overviewTab = myStories.tabs.find((tab) => tab.id === "overview")!;
    const markdown = getKnowledgeTabMarkdown(myStories, overviewTab);

    expect(myStories.document).toBe("my-stories.md");
    expect(myStories.description).toBe(
      "How people organize owned, draft, published, and saved stories before editing, removing, or starting a new playthrough.",
    );
    expect(overviewTab).toMatchObject({
      label: "Overview",
      contentKind: "markdown-section",
      heading: "Overview",
      reviewed: "08/21/2026",
      updated: "08/21/2026",
    });
    expect(markdown.length).toBeGreaterThan(10_000);
    expect(markdown).toContain("## My Stories at a Glance");
    expect(markdown).toContain("## Collections, Ownership, and Lifecycle");
    expect(markdown).toContain("## Loading, Empty, Failure, and Recovery Expectations");
    expect(markdown).toContain("## Handoffs to the Rest of Chronicle");
    expect(markdown).toContain("It is not proof that every deployed detail is unchanged or represented");
    expect(markdown).toContain("The workspace should distinguish initial loading");
    expect(markdown).not.toContain("The current visible behavior is narrower");
    expect(markdown).not.toContain("visible handoff happens before the conversation save is confirmed");
  });

  it("passes the UI Elements and Functions gate through the intended heading", () => {
    const myStories = getMyStories();
    const tab = myStories.tabs.find(
      (candidate) => candidate.id === "ui-elements-functions",
    )!;
    const markdown = getKnowledgeTabMarkdown(myStories, tab);

    expect(tab).toMatchObject({
      label: "UI Elements and Functions",
      contentKind: "markdown-section",
      heading: "UI Elements and Functions",
      reviewed: "08/21/2026",
      updated: "08/21/2026",
    });
    expect(markdown.length).toBeGreaterThan(10_000);
    expect(markdown).toContain("## Workspace Entry and Header");
    expect(markdown).toContain("Story Hub settings");
    expect(markdown).toContain("## Story Grid and Cards");
    expect(markdown).toContain("Delete Scenario?");
    expect(markdown).toContain("Clone Story for Editing");
    expect(markdown).toContain("## My Stories Background");
    expect(markdown).toContain("Select from Image Library");
    expect(markdown).toContain("Back to folder list");
    expect(markdown).toContain("Could not use that image. Please try again.");
    expect(markdown).toContain("The confirming action must describe creating the copy");
    expect(markdown).toContain("Success must clear the published state");
    expect(markdown).not.toContain("new entry remains visible but unselected");
    expect(markdown).not.toContain("until a broader application reload");
    expect(markdown).not.toContain("shared confirmation currently labels its affirmative action");
    expect(markdown).not.toContain("user_backgrounds_private");
  });

  it("passes the App Architecture gate through the intended heading", () => {
    const myStories = getMyStories();
    const tab = myStories.tabs.find(
      (candidate) => candidate.id === "app-architecture",
    )!;
    const markdown = getKnowledgeTabMarkdown(myStories, tab);

    expect(tab).toMatchObject({
      label: "App Architecture",
      contentKind: "markdown-section",
      heading: "App Architecture",
      reviewed: "08/21/2026",
      updated: "08/21/2026",
    });
    expect(markdown.length).toBeGreaterThan(30_000);
    expect(markdown).toContain("## What This Architecture Account Covers");
    expect(markdown).toContain("it does not delete the publication row");
    expect(markdown).toContain("does not read `avatar_path`");
    expect(markdown).toContain("two updates rather than one transaction");
    expect(markdown).toContain("source cover's hydrated presentation URL");
    expect(markdown).toContain("source-owner private avatar paths");
    expect(markdown).toContain("same sentinel is mounted beneath every active filter");
    expect(markdown).toContain("selected-background identifiers are not restored");
    expect(markdown).toContain("does not inspect the storage-removal or story-update error objects");
    expect(markdown).toContain("live RPC grant and runtime policy result were not exercised");
    expect(markdown).toContain("does not read `content_themes`");
    expect(markdown).toContain("opens Story Builder with `defaultContentThemes`");
    expect(markdown).toContain("Chat History resume depends on the current source");
    expect(markdown).toContain("do not contain a complete snapshot of the story source");
    expect(markdown).toContain("internally inconsistent");
    expect(markdown).toContain("src/hooks/use-index-scenario-persistence.ts");

    const referencedSourcePaths = [
      ...markdown.matchAll(/`((?:src|supabase)\/[^`\n]+)`/g),
    ].map((match) => match[1]);
    expect(referencedSourcePaths.length).toBeGreaterThan(20);
    for (const sourcePath of referencedSourcePaths) {
      expect(existsSync(sourcePath), sourcePath).toBe(true);
    }

    const inspectedSourceBlock = markdown
      .split("### Inspected source paths")[1]
      .split("### Verification limit")[0];
    const inspectedSourcePaths = [
      ...inspectedSourceBlock.matchAll(/^- `([^`]+)`$/gm),
    ].map((match) => match[1]);
    const shaListing = inspectedSourcePaths
      .map((sourcePath) => {
        const digest = createHash("sha256")
          .update(readFileSync(sourcePath))
          .digest("hex");
        return `${digest}  ${sourcePath}\n`;
      })
      .join("");
    const sourceComposite = createHash("sha256")
      .update(shaListing)
      .digest("hex");
    expect(markdown).toContain(
      `Inspected-source composite SHA-256: \`${sourceComposite}\``,
    );
  });

  it("passes the Supabase Tables gate through the shared source", () => {
    const myStories = getMyStories();
    const supabaseTab = myStories.tabs.find(
      (tab) => tab.id === "supabase-tables",
    )!;
    const gallery = chronicleKnowledgeSections.find(
      (section) => section.id === "community-gallery",
    )!;
    const gallerySupabaseTab = gallery.tabs.find(
      (tab) => tab.id === "supabase-tables",
    )!;
    const markdown = getKnowledgeTabMarkdown(myStories, supabaseTab);

    expect(supabaseTab).toMatchObject({
      contentKind: "shared-supabase",
      reviewed: "08/21/2026",
      updated: "07/31/2026",
    });
    expect(markdown).toBe(
      getKnowledgeTabMarkdown(gallery, gallerySupabaseTab),
    );
    expect(markdown).toContain("## Supabase Tables");
    expect(markdown).toContain("last synchronized documented structure");
    expect(markdown).toContain(
      "It is not proof that every live database detail is represented or unchanged",
    );
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

    const overviewTab = myStories.tabs.find((tab) => tab.id === "overview")!;
    const architectureTab = myStories.tabs.find(
      (tab) => tab.id === "app-architecture",
    )!;
    expect(getKnowledgeTabMarkdown(myStories, overviewTab)).toContain(
      "The separate **Supabase Tables** tab is the last synchronized reference",
    );
    expect(getKnowledgeTabMarkdown(myStories, architectureTab)).toContain(
      "it is not a function-definition inventory",
    );
  });

  it("passes the application-map gate through the Chronicle Overview source", () => {
    const applicationMap = chronicleKnowledgeSections.find(
      (section) => section.id === "chronicle-overview",
    )!;
    const mapTab = applicationMap.tabs.find((tab) => tab.id === "my-stories")!;

    expect(mapTab).toMatchObject({
      contentKind: "markdown-section",
      heading: "My Stories",
      reviewed: "08/21/2026",
      updated: "08/21/2026",
    });
    const markdown = getKnowledgeTabMarkdown(applicationMap, mapTab);
    expect(markdown).toContain(
      "My Stories is the account-centered story workspace",
    );
    expect(markdown).toContain("### What My Stories receives");
    expect(markdown).toContain("### What My Stories produces");
    expect(markdown).toContain("marks the owned publication inactive");
    expect(markdown).toContain("without a separate confirmation");
    expect(markdown).toContain("shared account background collection");
    expect(markdown).toContain("Story Builder then owns authored changes");
    expect(markdown).not.toContain("Index.tsx");
    expect(markdown).not.toContain("allow_remix");
  });

  it("registers the isolated six-tab reference contract", () => {
    const myStories = chronicleKnowledgeSections.find(
      (section) => section.id === "my-stories",
    )!;

    expect(myStories.tabs.map((tab) => tab.label)).toEqual([
      "Overview",
      "UI Elements and Functions",
      "App Architecture",
      "Issues",
      "Supabase Tables",
      "Changelog",
    ]);
    expect(myStories.tabs.find((tab) => tab.id === "issues")).toMatchObject({
      contentKind: "issue-records",
      openIssueCount: 2,
    });
    expect(myStories.tabs.find((tab) => tab.id === "current-work")).toBeUndefined();
    expect(myStories.tabs.find((tab) => tab.id === "changelog")).toMatchObject({
      contentKind: "changelog-records",
    });
  });

  it("keeps the raw My Stories source to exactly the three registered manual headings", () => {
    const myStories = chronicleKnowledgeSections.find(
      (section) => section.id === "my-stories",
    )!;
    const source = getKnowledgeDocumentSource(myStories.document!);

    expect(parseKnowledgeDocument(source).headings).toEqual([
      "Overview",
      "UI Elements and Functions",
      "App Architecture",
    ]);
  });
});
