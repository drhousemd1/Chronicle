import { describe, expect, it } from "vitest";

import {
  chronicleKnowledgeBaseManifest,
  chronicleKnowledgeRoughDraft,
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
  "chat-history",
  "public-profile",
  "account",
  "admin",
  "shared-systems",
  "ai-api-services",
  "app-architecture-reference",
];

describe("Chronicle Knowledge Base manifest", () => {
  it("preserves the approved section and application-map order", () => {
    expect(chronicleKnowledgeSections.map((section) => section.id)).toEqual([
      "chronicle-overview",
      ...expectedCapabilityIds,
    ]);

    expect(
      chronicleKnowledgeBaseManifest.applicationMap.tabs.map((tab) => tab.label),
    ).toEqual([
      "Overview",
      "Community Gallery",
      "My Stories",
      "Character Library",
      "My Images",
      "Story Builder",
      "Character Builder",
      "Chat Interface",
      "Chat History",
      "Public Profile",
      "Account Settings",
      "Admin Panel",
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
      "chat-history",
      "public-profile",
      "account",
      "admin",
    ]);
  });

  it("uses repository-owned sources without an external migration dependency", () => {
    expect(chronicleKnowledgeBaseManifest).not.toHaveProperty("migrationSource");
  });

  it("preserves Gallery's seven tabs and the three-tab placeholder contract elsewhere", () => {
    const gallery = chronicleKnowledgeSections.find(
      (section) => section.id === "community-gallery",
    );
    expect(gallery?.tabs.map((tab) => tab.label)).toEqual([
      "Overview",
      "UI Elements and Functions",
      "App Architecture",
      "Issues",
      "Current Work",
      "Supabase Tables",
      "Changelog",
    ]);

    chronicleKnowledgeSections
      .filter(
        (section) =>
          section.id !== "chronicle-overview" &&
          section.id !== "community-gallery",
      )
      .forEach((section) => {
        expect(section.tabs.map((tab) => tab.label), section.id).toEqual([
          "Overview",
          "Architecture",
          "Supabase Tables",
        ]);
        expect(section.tabs[0].contentKind, section.id).toBe("blank");
        expect(section.tabs[1].contentKind, section.id).toBe("blank");
      });
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
          "How drafts, saved community stories, published work, imports, exports, and play entry are managed.",
      },
      {
        id: "character-library",
        label: "Character Library",
        description:
          "How reusable global characters are created, edited, selected, copied into stories, and kept separate from story-owned characters.",
      },
      {
        id: "my-images",
        label: "My Images",
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
          "How story and library characters are authored, enhanced, validated, and persisted.",
      },
      {
        id: "chat-interface",
        label: "Chat Interface",
        description:
          "The complete live roleplay lifecycle from player action through response construction, commit, support work, and evidence.",
      },
      {
        id: "chat-history",
        label: "Chat History",
        description:
          "How conversations are listed, resumed, paginated, identified, and deleted.",
      },
      {
        id: "public-profile",
        label: "Public Profile",
        description:
          "How creators edit their identity and how other users view, follow, and enter published work.",
      },
      {
        id: "account",
        label: "Account Settings",
        description:
          "How authentication, account settings, subscription visibility, sessions, and account actions work.",
      },
      {
        id: "admin",
        label: "Admin Panel",
        description:
          "How privileged operators enter the Admin hub and use specialist tools without confusing documentation, diagnostics, validation, and operations.",
      },
      {
        id: "shared-systems",
        label: "Shared Systems",
        description:
          "The shell, navigation, authentication, persistence, private media, caching, and shared state used across Chronicle.",
      },
      {
        id: "ai-api-services",
        label: "AI & API Services",
        description:
          "Shared provider transport, AI operations, support calls, usage accounting, and service-level failure boundaries.",
      },
      {
        id: "app-architecture-reference",
        label: "App Architecture Reference",
        description:
          "The exhaustive generated repository lookup that supports, but does not replace, the capability manuals.",
      },
    ]);
  });

  it("keeps migrated content substantive and the issue count derived from records", () => {
    const overview = chronicleKnowledgeSections[0];
    const gallery = chronicleKnowledgeSections.find(
      (section) => section.id === "community-gallery",
    );
    expect(gallery).toBeDefined();
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
    expect(getKnowledgeIssueCount(issuesTab!)).toBe(0);
    expect(issuesTab).toMatchObject({ contentKind: "issue-records" });
    expect(currentWorkTab).toMatchObject({ contentKind: "current-work-records" });
    expect(changelogTab).toMatchObject({ contentKind: "changelog-records" });
    expect(issuesTab).not.toHaveProperty("issues");
    expect(currentWorkTab).not.toHaveProperty("heading");
    expect(changelogTab).not.toHaveProperty("heading");
    expect(chronicleKnowledgeRoughDraft).toContain(
      "Chronicle Application Manual Writer",
    );
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
      chronicleKnowledgeRoughDraft,
    ].join("\n");

    expect(supabaseMarkdown).toContain(
      "](/style-guide/supabase-schema-reference)",
    );
    expect(supabaseMarkdown).toContain(
      "Anything that cannot be verified through the reference or by Lovable must be identified as unverified rather than guessed.",
    );
    expect(allActiveText).not.toContain("Workflow Failure Analysis");
    expect(allActiveText).not.toContain("Preview accordion");
  });
});
