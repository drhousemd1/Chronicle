import { describe, expect, it } from "vitest";
import { buildAppArchitectureMarkdown, AppArchitectureExportModel } from "./app-architecture-export";

describe("buildAppArchitectureMarkdown", () => {
  it("exports file architecture and backend schema details as pasteable markdown", () => {
    const model: AppArchitectureExportModel = {
      generatedAt: "2026-05-31T10:00:00.000Z",
      repoName: "Chronicle-main",
      rootPath: "/repo/Chronicle-main",
      sourcePathCount: 1,
      staticPaths: ["/package.json"],
      navSections: [
        {
          title: "Core",
          path: "/src",
          entries: ["- /src/App.tsx"],
        },
      ],
      files: [
        {
          path: "/src/App.tsx",
          name: "App.tsx",
          type: "REACT COMPONENT",
          description: "Routes the application.",
          lineCount: 42,
          lineCountStatus: "Healthy size.",
          imports: ["/src/pages/Index.tsx"],
          importedBy: ["/src/main.tsx"],
          tables: [],
          tableReads: [],
          tableWrites: [],
          rpcs: [],
          edgeFunctions: ["chat"],
          storageBuckets: [],
          storageReads: [],
          storageWrites: [],
          browserStorageReads: [],
          browserStorageWrites: [],
          rows: [
            {
              title: "Application Router",
              type: "REACT COMPONENT",
              summary: "Owns the route surface.",
              details: [{ label: "Calls", values: ["chat"] }],
            },
          ],
        },
      ],
      schema: {
        exportedAt: "2026-04-05",
        tables: [
          {
            name: "messages",
            columns: [
              { name: "id", type: "uuid", nullable: false, default: "gen_random_uuid()", primaryKey: true },
            ],
            indexes: ["messages_pkey (id)"],
            policies: [{ name: "Users can read messages", command: "SELECT" }],
            usedBy: ["/src/components/chronicle/ChatInterfaceTab.tsx"],
          },
        ],
        databaseFunctions: [{ name: "get_creator_stats", usedBy: ["/src/components/account/PublicProfileTab.tsx"] }],
        storageBuckets: [{ name: "avatars", public: true, usedBy: ["/src/components/account/PublicProfileTab.tsx"] }],
        edgeFunctions: [{ name: "chat", tablesReferenced: ["messages"], usedBy: ["/src/services/llm.ts"], paidAiPath: true }],
      },
    };

    const markdown = buildAppArchitectureMarkdown(model);

    expect(markdown).toContain("# Chronicle App Architecture");
    expect(markdown).toContain("### /src/App.tsx");
    expect(markdown).toContain("- Edge functions: chat");
    expect(markdown).toContain("#### messages");
    expect(markdown).toContain("- Policies: Users can read messages (SELECT)");
    expect(markdown).toContain("#### chat");
    expect(markdown).toContain("- Paid AI path: yes");
  });
});
