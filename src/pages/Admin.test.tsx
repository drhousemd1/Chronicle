import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const source = readFileSync("src/pages/Admin.tsx", "utf8");

describe("Admin documentation tool registration", () => {
  it("keeps Chronicle Knowledge Base and omits the retired tool tiles and navigation", () => {
    expect(source).toContain("id: 'chronicle_knowledge_base'");
    expect(source).toContain("title: 'Chronicle Knowledge Base'");
    expect(source).toContain(
      "navigate('/style-guide/chronicle-knowledge-base')",
    );

    expect(source).not.toContain("id: 'app_architecture'");
    expect(source).not.toContain("title: 'App Architecture'");
    expect(source).not.toContain("navigate('/style-guide/app-architecture')");
    expect(source).not.toContain("id: 'roleplay_pipeline'");
    expect(source).not.toContain("title: 'Roleplay Pipeline'");
    expect(source).not.toContain("navigate('/style-guide/api-inspector')");

    expect(source).toContain(
      "'Central hub for Style Guide, App Guide, App Architecture, Quality Hub, and API Inspector'",
    );
  });
});
