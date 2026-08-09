import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const source = readFileSync("src/pages/Admin.tsx", "utf8");

describe("Admin Chronicle Knowledge Base registration", () => {
  it("adds a distinct tile and route without replacing App Architecture", () => {
    expect(source).toContain("id: 'chronicle_knowledge_base'");
    expect(source).toContain("title: 'Chronicle Knowledge Base'");
    expect(source).toContain(
      "navigate('/style-guide/chronicle-knowledge-base')",
    );

    expect(source).toContain("id: 'app_architecture'");
    expect(source).toContain("title: 'App Architecture'");
    expect(source).toContain("navigate('/style-guide/app-architecture')");
  });
});
