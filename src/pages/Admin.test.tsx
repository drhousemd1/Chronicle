import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const source = readFileSync("src/pages/Admin.tsx", "utf8");
const indexSource = readFileSync("src/pages/Index.tsx", "utf8");

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


  });

  it("registers Research & Development as a normal editable embedded Admin tile", () => {
    expect(source).toContain("id: 'research_development'");
    expect(source).toContain("title: 'Research & Development'");
    expect(source).toContain("<LazyResearchDevelopment");
    expect(source).toContain("onOpenStyleGuide={() => navigate('/style-guide/chronicle-ui-guide')}");
    expect(source).toContain("onRegisterBeforeLeave={onRegisterRndBeforeLeave}");
    expect(source).toContain("onRegisterAddMockup={onRegisterRndAddMockup}");
    expect(source).toContain("onRegisterRepositorySave={onRegisterRndRepositorySave}");
    expect(source).toContain("onRepositorySaveStateChange={onRndRepositorySaveStateChange}");
    expect(indexSource).toContain("runAfterAdminWorkspaceSave");
    expect(indexSource).toContain("onRndAddMockup: () => { void rndAddMockupRef.current?.(); }");
    expect(indexSource).toContain("onRndRepositorySave: () => { void rndRepositorySaveRef.current?.(); }");
    expect(indexSource).toContain(
      'onBackToHub: () => { void runAfterAdminWorkspaceSave(() => setAdminActiveTool("hub")); }',
    );
  });
});
