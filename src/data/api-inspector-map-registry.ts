import { ApiArchitectureMapRegistry, ApiMapItem, ApiMapPhase, ApiMapSection } from "@/lib/api-inspector-schema";
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

const MERGED_CODE_TRUTH_PREFIX = "code-truth-merged";

function cloneGuideItem(item: ApiMapItem): ApiMapItem {
  return {
    ...item,
    fileRefs: item.fileRefs.map((fileRef) => ({ ...fileRef })),
    subItems: item.subItems?.map((subItem) => ({ ...subItem })),
    crossRefs: item.crossRefs?.map((crossRef) => ({ ...crossRef })),
  };
}

function cloneGuideSection(section: ApiMapSection): ApiMapSection {
  return {
    ...section,
    items: section.items.map(cloneGuideItem),
  };
}

function cloneGuidePhase(phase: ApiMapPhase): ApiMapPhase {
  return {
    ...phase,
    sections: phase.sections.map(cloneGuideSection),
  };
}

function prefixMergedCodeTruthId(id: string) {
  return `${MERGED_CODE_TRUTH_PREFIX}-${id}`;
}

function cloneMergedCodeTruthItem(item: ApiMapItem): ApiMapItem {
  return {
    ...item,
    id: prefixMergedCodeTruthId(item.id),
    fileRefs: item.fileRefs.map((fileRef) => ({ ...fileRef })),
    subItems: item.subItems?.map((subItem) => ({
      ...subItem,
      id: prefixMergedCodeTruthId(subItem.id),
    })),
    crossRefs: item.crossRefs?.map((crossRef) => ({
      ...crossRef,
      targetItemId: prefixMergedCodeTruthId(crossRef.targetItemId),
    })),
  };
}

function cloneMergedCodeTruthSection(section: ApiMapSection, items = section.items): ApiMapSection {
  return {
    ...section,
    id: prefixMergedCodeTruthId(section.id),
    defaultOpen: true,
    items: items.map(cloneMergedCodeTruthItem),
  };
}

function getRequiredCodeTruthPhase(id: string): ApiMapPhase {
  const phase = apiInspectorCodeTruthRegistry.phases.find((entry) => entry.id === id);
  if (!phase) {
    throw new Error(`Missing API inspector code-truth phase: ${id}`);
  }
  return phase;
}

function getRequiredCodeTruthSection(phase: ApiMapPhase, id: string): ApiMapSection {
  const section = phase.sections.find((entry) => entry.id === id);
  if (!section) {
    throw new Error(`Missing API inspector code-truth section: ${phase.id} -> ${id}`);
  }
  return section;
}

function buildMergedPhases(): ApiMapPhase[] {
  const mergedGuidePhases = apiInspectorGuidePhases.map(cloneGuidePhase);
  const phaseById = new Map(mergedGuidePhases.map((phase) => [phase.id, phase]));

  const appendSections = (targetPhaseId: string, sections: ApiMapSection[]) => {
    const targetPhase = phaseById.get(targetPhaseId);
    if (!targetPhase) {
      throw new Error(`Missing API inspector guide phase: ${targetPhaseId}`);
    }
    targetPhase.sections.push(...sections);
  };

  const preSendPhase = getRequiredCodeTruthPhase("phase-pre-send");
  appendSections("phase-user-sends-message", [
    cloneMergedCodeTruthSection(getRequiredCodeTruthSection(preSendPhase, "section-send-entrypoints")),
  ]);
  appendSections("phase-system-prompt-assembly", [
    cloneMergedCodeTruthSection(getRequiredCodeTruthSection(preSendPhase, "section-system-prompt-assembly")),
  ]);
  appendSections("phase-api-call-1-fires", [
    cloneMergedCodeTruthSection(getRequiredCodeTruthSection(preSendPhase, "section-message-array")),
  ]);

  const apiCall1Phase = getRequiredCodeTruthPhase("phase-api-call-1");
  const chatEdgeGatewaySection = getRequiredCodeTruthSection(apiCall1Phase, "section-chat-edge-gateway");
  appendSections("phase-api-call-1-fires", [
    cloneMergedCodeTruthSection(
      {
        ...chatEdgeGatewaySection,
        title: "Verified Gateway and Provider Dispatch",
        description: "Verified runtime dispatch path from frontend relay call through chat edge and xAI provider request.",
      },
      chatEdgeGatewaySection.items.filter((item) => item.id !== "item-stream-pass-through"),
    ),
  ]);

  const streamPassThroughItem = chatEdgeGatewaySection.items.find((item) => item.id === "item-stream-pass-through");
  if (!streamPassThroughItem) {
    throw new Error("Missing API inspector code-truth item: item-stream-pass-through");
  }
  appendSections("phase-response-streaming-display", [
    cloneMergedCodeTruthSection({
      id: "section-streaming-pass-through",
      title: "Verified Stream Assembly and Pass-Through",
      description: "Verified runtime streaming path from edge SSE passthrough into the live chat renderer.",
      defaultOpen: true,
      items: [streamPassThroughItem],
    }),
  ]);

  const apiCall2Phase = getRequiredCodeTruthPhase("phase-api-call-2");
  appendSections(
    "phase-post-response-processing-api-call-2",
    apiCall2Phase.sections.map((section) => cloneMergedCodeTruthSection(section)),
  );

  const supportingApisPhase = getRequiredCodeTruthPhase("phase-supporting-apis");
  appendSections(
    "phase-image-generation-calls",
    supportingApisPhase.sections.map((section) => cloneMergedCodeTruthSection(section)),
  );

  const aiEnhancePhase = getRequiredCodeTruthPhase("phase-ai-enhance");
  appendSections(
    "phase-ai-character-generation-calls",
    aiEnhancePhase.sections.map((section) => cloneMergedCodeTruthSection(section)),
  );

  return mergedGuidePhases;
}

export const apiInspectorMapRegistry: ApiArchitectureMapRegistry = {
  ...apiInspectorCodeTruthRegistry,
  meta: {
    ...apiInspectorCodeTruthRegistry.meta,
    generatedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    sourcePolicy:
      "Visual/layout and micro-detail structure are sourced from the API Inspector rework guide, while current runtime verification is merged directly into the matching live phases instead of rendered as a separate competing phase stack.",
  },
  phases: withUniquePhaseIds(buildMergedPhases()),
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
        "Ported detailed phase/section/item/sub-item structure from the approved guide into typed React map data, then merged the verified code-truth sections directly into the matching live phases so detail and runtime verification coexist without creating a second competing red phase stack.",
      filesTouched: [
        "src/data/api-inspector-guide-phases.ts",
        "src/data/api-inspector-code-truth-registry.ts",
        "src/data/api-inspector-map-registry.ts",
      ],
      expectedOutcome:
        "Inspector provides exhaustive, micro-detail mapping with enough depth that missing pieces are immediately visible during debugging.",
      actualOutcome:
        "Map now includes guide-level dense detail plus verified runtime expansions inside the same real phase flow, instead of splitting the inspector into guide phases followed by a second code-truth phase layer.",
    },
    ...apiInspectorCodeTruthRegistry.changelog,
  ],
};
