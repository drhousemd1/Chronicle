import { describe, expect, it } from "vitest";
import { ADMIN_TOOL_SECTION_IDS } from "./admin-tool-ids";

import {
  chronicleKnowledgeBaseManifest,
  chronicleKnowledgeSections,
  getKnowledgeIssueCount,
  getKnowledgeTabMarkdown,
} from "./manifest";

const expectedCapabilityIds = [
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
];

describe("Chronicle Knowledge Base manifest", () => {
  it("preserves the approved section and application-map order", () => {
    expect(chronicleKnowledgeSections.map((section) => section.id)).toEqual([
      "chronicle-overview",
      ...expectedCapabilityIds,
      ...ADMIN_TOOL_SECTION_IDS,
    ]);

    expect(
      chronicleKnowledgeBaseManifest.applicationMap.tabs.map((tab) => tab.label),
    ).toEqual([
      "Chronicle",
      "Community Gallery",
      "My Stories",
      "Character Library",
      "Image Library",
      "Story Builder",
      "Character Builder",
      "Chat Interface",
  "Roleplay Pipeline",
      "Chat History",
      "Public Profile",
      "Account & Subscription",
      "Admin Panel",
      "Shared Application Systems",
    ]);
    expect(
      chronicleKnowledgeBaseManifest.applicationMap.tabs.map((tab) => tab.id),
    ).toEqual([
      "overview",
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
  });

  it("uses repository-owned sources without an external migration dependency", () => {
    expect(chronicleKnowledgeBaseManifest).not.toHaveProperty("migrationSource");
  });

  it("preserves the six-tab capability contracts without active work tracking", () => {
    for (const capabilityId of expectedCapabilityIds.filter((id) => id !== "roleplay-pipeline")) {
      const section = chronicleKnowledgeSections.find(
        (candidate) => candidate.id === capabilityId,
      );
      expect(section?.tabs.map((tab) => tab.label), capabilityId).toEqual([
        "Overview",
        "UI Elements and Functions",
        "App Architecture",
        "Issues",
        "Supabase Tables",
        "Changelog",
      ]);
      expect(section?.tabs.map((tab) => tab.contentKind), capabilityId).toEqual([
        "markdown-section",
        "markdown-section",
        "markdown-section",
        "issue-records",
        "shared-supabase",
        "changelog-records",
      ]);
      expect(
        section?.tabs.find((tab) => tab.id === "issues")?.openIssueCount,
      ).toBeTypeOf("number");
    }
  });

  it("removes Current Work from every registered section while keeping Issues and Changelog", () => {
    for (const section of chronicleKnowledgeSections) {
      expect(section.tabs.some((tab) => tab.id === "current-work"), section.id).toBe(false);
      expect(section.tabs.some((tab) => tab.label === "Current Work"), section.id).toBe(false);
      if (section.id !== "chronicle-overview") {
        expect(section.tabs.some((tab) => tab.id === "issues"), section.id).toBe(true);
        expect(section.tabs.some((tab) => tab.id === "changelog"), section.id).toBe(true);
      }
    }
  });

  it("preserves the standalone capability identities and descriptions verbatim", () => {
    expect(
      chronicleKnowledgeBaseManifest.capabilities.map(
        ({ id, label, description }) => ({ id, label, description }),
      ),
    ).toEqual([
      {
        id: "community-gallery",
        label: "Community Gallery",
        description:
          "How people discover, evaluate, save, play, review, remix, and publish shared stories.",
      },
      {
        id: "my-stories",
        label: "My Stories",
        description:
          "How people organize owned, draft, published, and saved stories before editing, removing, or starting a new playthrough.",
      },
      {
        id: "character-library",
        label: "Character Library",
        description:
          "How reusable global characters are created, edited, selected, copied into stories, and kept separate from story-owned characters.",
      },
      {
        id: "my-images",
        label: "Image Library",
        description:
          "How private images are uploaded, organized, viewed, copied into consuming features, and deleted.",
      },
      {
        id: "story-builder",
        label: "Story Builder",
        description:
          "How a story's world, direction, cast, opening state, media, and publication readiness are assembled.",
      },
      {
        id: "character-builder",
        label: "Character Builder",
        description:
          "How reusable and story-owned character profiles are authored, assisted, copied, and saved without losing lifecycle ownership.",
      },
      {
        id: "chat-interface",
        label: "Chat Interface",
        description:
          "How the visible play screen presents a conversation, accepts user actions, exposes local controls, and hands an opaque turn request to the separate Roleplay Pipeline.",
      },
      {
        id: "roleplay-pipeline",
        label: "Roleplay Pipeline",
        description:
          "How a Chat Interface action becomes a model request, a current accepted response, and saved state for later turns.",
      },
      {
        id: "chat-history",
        label: "Chat History",
        description:
          "How saved conversations are listed, resumed, paginated, identified, and deleted without becoming the active play interface.",
      },
      {
        id: "public-profile",
        label: "Public Profile",
        description:
          "How creators edit their public identity and how other people view, follow, evaluate, and enter their published work.",
      },
      {
        id: "account",
        label: "Account & Subscription",
        description:
          "How a signed-in user views private account facts, changes credentials, and understands the current subscription and available plans.",
      },
      {
        id: "admin",
        label: "Admin Panel",
        description:
          "How privileged operators enter the Admin hub and reach each registered specialist tool while preserving the boundary between the hub and the tools it launches.",
      },
      {
        id: "shared-systems",
        label: "Shared Application Systems",
        description:
          "How Chronicle's shell, navigation, authentication, common persistence adapters, private media, shared configuration, and cross-capability state support the application without absorbing feature ownership.",
      },
    ]);
  });

  it("keeps migrated content substantive and the issue count derived from records", () => {
    const overview = chronicleKnowledgeSections[0];
    const gallery = chronicleKnowledgeSections.find(
      (section) => section.id === "community-gallery",
    );
    const myStories = chronicleKnowledgeSections.find(
      (section) => section.id === "my-stories",
    );
    const characterLibrary = chronicleKnowledgeSections.find(
      (section) => section.id === "character-library",
    );
    const myImages = chronicleKnowledgeSections.find(
      (section) => section.id === "my-images",
    );
    const storyBuilder = chronicleKnowledgeSections.find(
      (section) => section.id === "story-builder",
    );
    expect(gallery).toBeDefined();
    expect(myStories).toBeDefined();
    expect(characterLibrary).toBeDefined();
    expect(myImages).toBeDefined();
    expect(storyBuilder).toBeDefined();
    const overviewMarkdown = getKnowledgeTabMarkdown(
      overview,
      overview.tabs[0],
    );
    const galleryOverviewMarkdown = getKnowledgeTabMarkdown(
      gallery!,
      gallery!.tabs[0],
    );
    const galleryUiMarkdown = getKnowledgeTabMarkdown(
      gallery!,
      gallery!.tabs[1],
    );
    const galleryArchitectureMarkdown = getKnowledgeTabMarkdown(
      gallery!,
      gallery!.tabs[2],
    );
    const applicationMapMyStories = getKnowledgeTabMarkdown(
      overview,
      overview.tabs[2],
    );
    const myStoriesOverviewMarkdown = getKnowledgeTabMarkdown(
      myStories!,
      myStories!.tabs[0],
    );
    const myStoriesUiMarkdown = getKnowledgeTabMarkdown(
      myStories!,
      myStories!.tabs[1],
    );
    const myStoriesArchitectureMarkdown = getKnowledgeTabMarkdown(
      myStories!,
      myStories!.tabs[2],
    );
    const applicationMapCharacterLibrary = getKnowledgeTabMarkdown(
      overview,
      overview.tabs[3],
    );
    const characterLibraryOverviewMarkdown = getKnowledgeTabMarkdown(
      characterLibrary!,
      characterLibrary!.tabs[0],
    );
    const characterLibraryUiMarkdown = getKnowledgeTabMarkdown(
      characterLibrary!,
      characterLibrary!.tabs[1],
    );
    const characterLibraryArchitectureMarkdown = getKnowledgeTabMarkdown(
      characterLibrary!,
      characterLibrary!.tabs[2],
    );
    const applicationMapMyImages = getKnowledgeTabMarkdown(
      overview,
      overview.tabs[4],
    );
    const myImagesOverviewMarkdown = getKnowledgeTabMarkdown(
      myImages!,
      myImages!.tabs[0],
    );
    const myImagesUiMarkdown = getKnowledgeTabMarkdown(
      myImages!,
      myImages!.tabs[1],
    );
    const myImagesArchitectureMarkdown = getKnowledgeTabMarkdown(
      myImages!,
      myImages!.tabs[2],
    );
    const applicationMapStoryBuilder = getKnowledgeTabMarkdown(
      overview,
      overview.tabs[5],
    );
    const storyBuilderOverviewMarkdown = getKnowledgeTabMarkdown(
      storyBuilder!,
      storyBuilder!.tabs[0],
    );
    const storyBuilderUiMarkdown = getKnowledgeTabMarkdown(
      storyBuilder!,
      storyBuilder!.tabs[1],
    );
    const storyBuilderArchitectureMarkdown = getKnowledgeTabMarkdown(
      storyBuilder!,
      storyBuilder!.tabs[2],
    );
    const issuesTab = gallery!.tabs.find((tab) => tab.id === "issues");
    const currentWorkTab = gallery!.tabs.find(
      (tab) => tab.id === "current-work",
    );
    const changelogTab = gallery!.tabs.find((tab) => tab.id === "changelog");

    expect(overviewMarkdown.length).toBeGreaterThan(25_000);
    expect(overviewMarkdown).toContain(
      "Adult and NSFW Material Is First-Class Story Data",
    );
    expect(galleryOverviewMarkdown.length).toBeGreaterThan(14_000);
    expect(galleryOverviewMarkdown).toContain(
      "knowledge-asset:community-gallery-overview",
    );
    expect(galleryUiMarkdown.length).toBeGreaterThan(18_000);
    expect(galleryUiMarkdown).toContain("Gallery Feed Views");
    expect(gallery!.tabs[2]).toMatchObject({
      contentKind: "markdown-section",
      heading: "App Architecture",
      reviewed: "08/08/2026",
      updated: "08/08/2026",
    });
    expect(galleryArchitectureMarkdown.length).toBeGreaterThan(35_000);
    expect(galleryArchitectureMarkdown).toContain(
      "Delivery Boundary and Runtime Entry",
    );
    expect(galleryArchitectureMarkdown).toContain(
      "src/pages/Gallery.tsx` contains a separate standalone Gallery page",
    );
    expect(galleryArchitectureMarkdown).toContain(
      "The current My Stories clone path checks whether the user owns the source story, but it does not check the publication’s `allow_remix` value",
    );
    expect(galleryArchitectureMarkdown).toContain(
      "Only a successful response containing no publications becomes an empty array",
    );
    expect(galleryArchitectureMarkdown).toContain(
      "src/components/chronicle/GalleryHub.test.tsx",
    );
    expect(galleryArchitectureMarkdown).toContain(
      "src/services/gallery-data.test.ts",
    );
    expect(galleryArchitectureMarkdown).toContain(
      "d9a3fa6adfd84ab896289e03d82283f676a1695e",
    );
    expect(overview.tabs[2]).toMatchObject({
      contentKind: "markdown-section",
      heading: "My Stories",
    });
    expect(applicationMapMyStories).toContain(
      "My Stories is the account-centered story workspace",
    );
    expect(myStories!.document).toBe("my-stories.md");
    expect(myStories!.tabs.find((tab) => tab.id === "supabase-tables")).toMatchObject({
      label: "Supabase Tables",
      contentKind: "shared-supabase",
      reviewed: "08/21/2026",
      updated: "07/31/2026",
    });
    expect(myStoriesOverviewMarkdown.length).toBeGreaterThan(13_000);
    expect(myStoriesOverviewMarkdown).toContain("My Stories at a Glance");
    expect(myStoriesOverviewMarkdown).toContain(
      "Story Builder owns authored changes",
    );
    expect(myStoriesUiMarkdown.length).toBeGreaterThan(13_000);
    expect(myStoriesUiMarkdown).toContain("Workspace Entry and Header");
    expect(myStoriesUiMarkdown).toContain("Clone Story for Editing");
    expect(myStoriesArchitectureMarkdown.length).toBeGreaterThan(30_000);
    expect(myStoriesArchitectureMarkdown).toContain(
      "Delivery Boundary and Runtime Entry",
    );
    expect(myStoriesArchitectureMarkdown).toContain(
      "Current Implementation Limitations",
    );
    expect(myStoriesArchitectureMarkdown).toContain(
      "cc3a57ccc3c25ff86bbe0abe183457f1e28d92d7",
    );
    expect(overview.tabs[3]).toMatchObject({
      contentKind: "markdown-section",
      heading: "Character Library",
      reviewed: "08/22/2026",
      updated: "08/22/2026",
    });
    expect(applicationMapCharacterLibrary).toContain(
      "Character Library is the account's reusable character source",
    );
    expect(characterLibrary!.document).toBe("character-library.md");
    expect(
      characterLibrary!.tabs.find((tab) => tab.id === "supabase-tables"),
    ).toMatchObject({
      label: "Supabase Tables",
      contentKind: "shared-supabase",
      reviewed: "08/22/2026",
      updated: "07/31/2026",
    });
    expect(characterLibraryOverviewMarkdown.length).toBeGreaterThan(10_000);
    expect(characterLibraryOverviewMarkdown).toContain(
      "Character Library at a Glance",
    );
    expect(characterLibraryUiMarkdown.length).toBeGreaterThan(15_000);
    expect(characterLibraryUiMarkdown).toContain(
      "Collection Grid and Character Cards",
    );
    expect(characterLibraryArchitectureMarkdown.length).toBeGreaterThan(30_000);
    expect(characterLibraryArchitectureMarkdown).toContain(
      "Current Implementation Limitations",
    );
    expect(overview.tabs[4]).toMatchObject({
      contentKind: "markdown-section",
      heading: "Image Library",
      reviewed: "08/22/2026",
      updated: "08/22/2026",
    });
    expect(applicationMapMyImages).toContain(
      "Image Library is the account's private reusable media source",
    );
    expect(myImages!.document).toBe("my-images.md");
    expect(
      myImages!.tabs.find((tab) => tab.id === "supabase-tables"),
    ).toMatchObject({
      label: "Supabase Tables",
      contentKind: "shared-supabase",
      reviewed: "08/22/2026",
      updated: "07/31/2026",
    });
    expect(myImagesOverviewMarkdown.length).toBeGreaterThan(10_000);
    expect(myImagesOverviewMarkdown).toContain("My Images at a Glance");
    expect(myImagesOverviewMarkdown).toContain(
      "A handoff creates an independent destination copy",
    );
    expect(myImagesUiMarkdown.length).toBeGreaterThan(14_000);
    expect(myImagesUiMarkdown).toContain("Folder Library");
    expect(myImagesUiMarkdown).toContain("Image Details Editor");
    expect(myImagesArchitectureMarkdown.length).toBeGreaterThan(30_000);
    expect(myImagesArchitectureMarkdown).toContain(
      "Ordered Runtime and Data Flows",
    );
    expect(myImagesArchitectureMarkdown).toContain(
      "Current Implementation Limitations",
    );
    expect(overview.tabs[5]).toMatchObject({
      contentKind: "markdown-section",
      heading: "Story Builder",
      reviewed: "08/22/2026",
      updated: "08/22/2026",
    });
    expect(applicationMapStoryBuilder).toContain(
      "Story Builder is Chronicle's story-source authoring owner",
    );
    expect(storyBuilder!.document).toBe("story-builder.md");
    expect(
      storyBuilder!.tabs.find((tab) => tab.id === "supabase-tables"),
    ).toMatchObject({
      label: "Supabase Tables",
      contentKind: "shared-supabase",
      reviewed: "08/22/2026",
      updated: "07/31/2026",
    });
    expect(storyBuilderOverviewMarkdown.length).toBeGreaterThan(15_000);
    expect(storyBuilderOverviewMarkdown).toContain("Story Builder at a Glance");
    expect(storyBuilderOverviewMarkdown).toContain("Finalize and Close");
    expect(storyBuilderUiMarkdown.length).toBeGreaterThan(14_000);
    expect(storyBuilderUiMarkdown).toContain("Workspace Frame and Header Actions");
    expect(storyBuilderUiMarkdown).toContain("Share Your Story and Publication Controls");
    expect(storyBuilderArchitectureMarkdown.length).toBeGreaterThan(30_000);
    expect(storyBuilderArchitectureMarkdown).toContain("Ordered Runtime and Data Flows");
    expect(storyBuilderArchitectureMarkdown).toContain(
      "Current Implementation Limitations",
    );
    expect(getKnowledgeIssueCount(issuesTab!)).toBe(0);
    expect(issuesTab).toMatchObject({ contentKind: "issue-records" });
    expect(currentWorkTab).toBeUndefined();
    expect(changelogTab).toMatchObject({ contentKind: "changelog-records" });
    expect(issuesTab).not.toHaveProperty("issues");
    expect(changelogTab).not.toHaveProperty("heading");
  });

  it("keeps Supabase verification centralized and excludes the removed Preview audit", () => {
    const gallery = chronicleKnowledgeSections.find(
      (section) => section.id === "community-gallery",
    )!;
    const supabaseTab = gallery.tabs.find(
      (tab) => tab.id === "supabase-tables",
    )!;
    const supabaseMarkdown = getKnowledgeTabMarkdown(gallery, supabaseTab);
    const allActiveText = [
      ...chronicleKnowledgeSections.flatMap((section) =>
        section.tabs.map((tab) => getKnowledgeTabMarkdown(section, tab)),
      ),
    ].join("\n");

    expect(supabaseMarkdown).toContain(
      "](/style-guide/supabase-schema-reference)",
    );
    expect(supabaseMarkdown).toContain(
      "This page supplies reference and handoff mechanics; it does not decide when a Chronicle task requires",
    );
    expect(supabaseMarkdown).toContain(
      "identify anything that cannot be verified as unverified rather than guessing",
    );
    expect(allActiveText).not.toContain("Workflow Failure Analysis");
    expect(allActiveText).not.toContain("Preview accordion");
  });
});
