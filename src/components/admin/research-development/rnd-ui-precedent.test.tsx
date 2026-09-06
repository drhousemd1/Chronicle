// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RND_PROTOTYPE_DEFINITIONS } from "./rnd-registry";
import {
  RndEffectControlButton,
  RndEffectControlGrid,
} from "./rnd-effects-control-ui";

const localGraphArtifactRoot = "docs/research-development/generated/graphify-chronicle-map";
const hasLocalGraphArtifacts = existsSync(resolve(process.cwd(), localGraphArtifactRoot));

describe("R&D UI precedent contract", () => {
  it("preserves the original Graphify prototype, saved record, and source", () => {
    const graphifyPrototype = RND_PROTOTYPE_DEFINITIONS.find(
      (definition) => definition.id === "6f290eb9-a458-4dbf-bd2d-b12da34b2ac7",
    );

    expect(graphifyPrototype).toMatchObject({
      defaultTitle: "Chronicle Repository & Database Map",
      sourcePath:
        "src/components/admin/research-development/prototypes/graphify-chronicle-map/",
    });
    [
      "src/components/admin/research-development/prototypes/graphify-chronicle-map/GraphifyChronicleMapPreview.tsx",
      "src/components/admin/research-development/prototypes/graphify-chronicle-map/GraphifyChronicleMapPreview.test.tsx",
      "src/components/admin/research-development/prototypes/graphify-chronicle-map/generate-chronicle-area-map.mjs",
      "docs/research-development/mockups/6f290eb9-a458-4dbf-bd2d-b12da34b2ac7/mockup.json",
    ].forEach((path) => {
      expect(existsSync(resolve(process.cwd(), path))).toBe(true);
    });
  });

  // Private generated evidence is intentionally absent from a fresh checkout.
  // Where it has been restored locally, require the complete original artifact set.
  it.skipIf(!hasLocalGraphArtifacts)(
    "preserves every locally restored Graphify generated view and evidence file",
    () => {
      [
        "docs/research-development/generated/graphify-chronicle-map/chronicle-areas.html",
        "docs/research-development/generated/graphify-chronicle-map/graph-tree.html",
        "docs/research-development/generated/graphify-chronicle-map/graph-full.html",
        "docs/research-development/generated/graphify-chronicle-map/graph-communities.html",
        "docs/research-development/generated/graphify-chronicle-map/GRAPH_REPORT.md",
        "docs/research-development/generated/graphify-chronicle-map/rnd-mockup-record.json",
      ].forEach((path) => {
        expect(existsSync(resolve(process.cwd(), path))).toBe(true);
      });
    },
  );

  it("keeps production Knowledge surfaces independent from the R&D prototype", () => {
    const productionOwners = [
      "src/components/admin/knowledge-base/RepositoryGraphView.tsx",
      "src/components/admin/knowledge-base/CapabilityArchitecture.tsx",
      "src/pages/style-guide/chronicle-knowledge-base.tsx",
    ];

    productionOwners.forEach((path) => {
      const source = readFileSync(resolve(process.cwd(), path), "utf8");
      expect(source).not.toContain("GraphifyChronicleMapPreview");
      expect(source).not.toContain("research-development/prototypes/graphify-chronicle-map");
      expect(source).not.toContain("/__rnd-repository/generated/graphify-chronicle-map");
    });
  });

  it("requires every coded preview section to record existing source precedents", () => {
    const sections = RND_PROTOTYPE_DEFINITIONS.flatMap((definition) => [
      definition,
      ...(definition.additionalSections ?? []),
    ]);

    sections.forEach((section) => {
      expect(section.uiPrecedents.length).toBeGreaterThan(0);
      section.uiPrecedents.forEach((precedent) => {
        const isUnavailablePrivateArtifact = !hasLocalGraphArtifacts
          && precedent.sourcePath.startsWith(`${localGraphArtifactRoot}/`);
        if (!isUnavailablePrivateArtifact) {
          expect(existsSync(resolve(process.cwd(), precedent.sourcePath))).toBe(true);
        }
        if (precedent.reuseMethod === "new-pattern") {
          expect(precedent.note?.trim()).toBeTruthy();
        }
      });
    });
  });

  it("does not let an R&D effects adapter become its own visual precedent", () => {
    const effectPrecedents = RND_PROTOTYPE_DEFINITIONS.flatMap((definition) => [
      definition,
      ...(definition.additionalSections ?? []),
    ]).flatMap((section) =>
      section.uiPrecedents.filter((precedent) => /effect|control/i.test(precedent.element)),
    );

    expect(effectPrecedents.length).toBeGreaterThan(0);
    effectPrecedents.forEach((precedent) => {
      expect(precedent.sourcePath).not.toContain("/research-development/");
    });
  });

  it("keeps the App Shell and Chat Interface on the shared Chronicle control source", () => {
    const appShellSource = readFileSync(
      resolve(process.cwd(), "src/components/app-shell/AppShellTopBar.tsx"),
      "utf8",
    );
    const chatSource = readFileSync(
      resolve(process.cwd(), "src/components/chronicle/ChatInterfaceTab.tsx"),
      "utf8",
    );

    expect(appShellSource).toContain("ChronicleSurfaceButton as SurfaceButton");
    expect(chatSource).toContain("CHRONICLE_CHAT_QUICK_ACTION_CLASS");
  });

  it("renders one Chronicle section header with neutral groups and solid-blue selected controls", () => {
    const { container } = render(
      <RndEffectControlGrid
        columns={[
          {
            title: "Weather",
            controls: [<RndEffectControlButton key="rain">Rain</RndEffectControlButton>],
          },
          {
            title: "Condition",
            controls: [<RndEffectControlButton key="bleeding" active>Bleeding</RndEffectControlButton>],
          },
        ]}
      />,
    );

    expect(container.querySelectorAll('[data-rnd-ui-role="section-header"]')).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Effect Controls" }).closest("[data-rnd-ui-pattern]"))
      .toHaveAttribute("data-rnd-ui-pattern", "effect-control-panel");
    expect(screen.getByText("Weather").closest('[data-rnd-ui-role="control-group"]'))
      .toBeInTheDocument();

    const selectedControl = screen.getByRole("button", { name: "Bleeding" });
    expect(selectedControl).toHaveAttribute("aria-pressed", "true");
    expect(selectedControl).toHaveClass("bg-[#3b82f6]");
    expect(selectedControl.className).not.toContain("bg-gradient-to-b");
  });
});
