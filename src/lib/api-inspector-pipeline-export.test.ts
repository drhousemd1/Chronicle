import { describe, expect, it } from "vitest";
import { buildRoleplayPipelineMarkdown } from "./api-inspector-pipeline-export";

describe("buildRoleplayPipelineMarkdown", () => {
  it("exports the visible pipeline model as reviewable Markdown", () => {
    const markdown = buildRoleplayPipelineMarkdown({
      shells: [
        {
          id: "live-chat",
          kicker: "Live Chat Flow",
          title: "Live Chat Roleplay Flow",
          subtitle: "Runtime request path.",
          navLabel: "Live Chat Flow",
          navSubtitle: "Turn-by-turn runtime",
          phases: [
            {
              id: "phase-1",
              title: "Phase 1 - Prompt Assembly",
              subtitle: "Browser creates the outbound request.",
              defaultOpen: true,
              groups: [
                {
                  id: "group-1",
                  title: "llm.ts",
                  description: "Prompt assembly service.",
                  defaultOpen: true,
                  items: [
                    {
                      id: "item-1",
                      title: "System instruction renderer",
                      summary: "Builds the roleplay system message.",
                      tag: "core-prompt",
                      settingsGate: "Runs for API Call 1.",
                      ownerPath: "src/services/llm.ts",
                      ownerFolderPath: "src/services",
                      ownerFileName: "llm.ts",
                      fileRefs: [
                        {
                          path: "/src/services/llm.ts",
                          lines: "100-110",
                          note: "getSystemInstruction",
                        },
                      ],
                      details: [
                        {
                          id: "detail-1",
                          label: "Prompt Contract",
                          text: "Keeps prompt review text aligned with the runtime renderer.",
                        },
                      ],
                      codeSource: "Header\n```text\nnested fence\n```",
                      codeSourceLabel: "Prompt Snapshot",
                      promptViewEnabled: true,
                      meta: ["API Call 1", "review surface"],
                      review: {
                        lastReviewedAt: "2026-05-31T08:00:00.000Z",
                        reviewedBy: "Codex",
                        runId: "run-test",
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      anchorLookup: new Map(),
      phaseIds: [],
      groupIds: [],
      itemIds: [],
    } as any);

    expect(markdown).toContain("# Chronicle Roleplay Pipeline");
    expect(markdown).toContain("## Live Chat Roleplay Flow");
    expect(markdown).toContain("### Phase 1 - Prompt Assembly");
    expect(markdown).toContain("##### System instruction renderer");
    expect(markdown).toContain("- Settings Gate: Runs for API Call 1.");
    expect(markdown).toContain("- /src/services/llm.ts - 100-110 - getSystemInstruction");
    expect(markdown).toContain("###### Prompt Snapshot");
    expect(markdown).toContain("````text\nHeader\n```text\nnested fence\n```\n````");
    expect(markdown).toContain("- Review run: run-test");
  });
});
