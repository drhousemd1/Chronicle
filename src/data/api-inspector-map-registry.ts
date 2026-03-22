import { ApiArchitectureMapRegistry, ApiMapPhase } from "@/lib/api-inspector-schema";
import { apiInspectorCodeTruthRegistry } from "@/data/api-inspector-code-truth-registry";
import { apiInspectorGuidePhases } from "@/data/api-inspector-guide-phases";

function withUniquePhaseIds(phases: ApiMapPhase[]): ApiMapPhase[] {
  const used = new Set<string>();
  return phases.map((phase, index) => {
    let id = phase.id || `phase-${index + 1}`;
    if (used.has(id)) {
      let n = 2;
      while (used.has(`${id}-${n}`)) n += 1;
      id = `${id}-${n}`;
    }
    used.add(id);
    return {
      ...phase,
      id,
    };
  });
}

const codeTruthPhasesPrefixed: ApiMapPhase[] = apiInspectorCodeTruthRegistry.phases.map((phase) => ({
  ...phase,
  id: `code-truth-${phase.id}`,
  title: `Code-Truth Expansion: ${phase.title}`,
  subtitle: `${phase.subtitle} (verified from current runtime code)`,
  defaultOpen: false,
  sections: phase.sections.map((section) => ({
    ...section,
    id: `code-truth-${section.id}`,
    defaultOpen: false,
    items: section.items.map((item) => ({
      ...item,
      id: `code-truth-${item.id}`,
      crossRefs: undefined,
    })),
  })),
}));

export const apiInspectorMapRegistry: ApiArchitectureMapRegistry = {
  ...apiInspectorCodeTruthRegistry,
  meta: {
    ...apiInspectorCodeTruthRegistry.meta,
    generatedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    sourcePolicy:
      "Visual/layout and micro-detail structure are sourced from the API Inspector rework guide, while runtime mapping is expanded with current code-truth phases. This map intentionally keeps exhaustive detail to make omissions obvious during debugging.",
  },
  phases: withUniquePhaseIds([...apiInspectorGuidePhases, ...codeTruthPhasesPrefixed]),
  changelog: [
    {
      id: `changelog-${Date.now()}-exhaustive-rebuild`,
      timestamp: new Date().toISOString(),
      title: "Exhaustive guide-structured map merge",
      author: "ChatGPT Codex",
      problem:
        "Previous React inspector map was too condensed and omitted many micro-level details from the approved guide structure, making debugging coverage unclear.",
      previousAttempt:
        "Built a compact code-truth-first map with typed schema but only partial detail density (high-level sections with limited sub-item granularity).",
      changeMade:
        "Ported detailed phase/section/item/sub-item structure from the approved guide into typed React map data, then appended a dedicated code-truth expansion set for current runtime behavior so detail and verification can coexist.",
      filesTouched: [
        "src/data/api-inspector-guide-phases.ts",
        "src/data/api-inspector-code-truth-registry.ts",
        "src/data/api-inspector-map-registry.ts",
      ],
      expectedOutcome:
        "Inspector provides exhaustive, micro-detail mapping with enough depth that missing pieces are immediately visible during debugging.",
      actualOutcome:
        "Map now includes guide-level dense detail and additional code-truth expansions in a single React inspector view.",
    },
    ...apiInspectorCodeTruthRegistry.changelog,
  ],
};
