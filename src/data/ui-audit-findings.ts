import {
  makeAgentId,
  QualityAgent,
  QualityHubRegistry,
  QUALITY_HUB_VERSION,
} from "@/lib/ui-audit-schema";

const createdAt = new Date().toISOString();

const defaultAgent: QualityAgent = {
  id: makeAgentId("ChatGPT Codex", "gpt-5"),
  agentName: "ChatGPT Codex",
  modelName: "gpt-5",
  platform: "Codex",
};

export const qualityHubDefaultAgent = defaultAgent;

export const qualityHubInitialRegistry: QualityHubRegistry = {
  meta: {
    version: QUALITY_HUB_VERSION,
    project: "Chronicle",
    createdAt,
    lastUpdatedAt: createdAt,
  },
  scanModules: [
    {
      id: "module-ui-ux",
      name: "UI / UX and Design System",
      description: "Visual consistency, design-token drift, hierarchy, responsive behavior.",
      status: "not-started",
      priority: "high",
    },
    {
      id: "module-functionality",
      name: "Functionality and Behavior Bugs",
      description: "Broken flows, regression risk, state synchronization, user-impacting issues.",
      status: "not-started",
      priority: "high",
    },
    {
      id: "module-orphan-code",
      name: "Orphan / Dead Code",
      description: "Unused components, stale utilities, unreachable paths, redundant variants.",
      status: "not-started",
      priority: "medium",
    },
    {
      id: "module-cleanup",
      name: "Code Cleanup Candidates",
      description: "Near-duplicate logic, one-off patterns, technical debt consolidation targets.",
      status: "not-started",
      priority: "medium",
    },
    {
      id: "module-accessibility",
      name: "Accessibility",
      description: "Contrast, keyboard support, focus visibility, labeling and semantics.",
      status: "not-started",
      priority: "high",
    },
    {
      id: "module-performance",
      name: "Performance",
      description: "Rendering hot spots, expensive effects, bundle risk, caching opportunities.",
      status: "not-started",
      priority: "medium",
    },
    {
      id: "module-security",
      name: "Security and Dependencies",
      description: "Dependency risk, unsafe handling, configuration pitfalls.",
      status: "not-started",
      priority: "high",
    },
    {
      id: "module-tests",
      name: "Test Health",
      description: "Coverage gaps, missing regression tests, flaky or absent test paths.",
      status: "not-started",
      priority: "medium",
    },
    {
      id: "module-build",
      name: "Build / Type / Lint Health",
      description: "Type errors, lint debt, warnings that mask regressions.",
      status: "not-started",
      priority: "high",
    },
    {
      id: "module-data-integrity",
      name: "Data and API Integrity",
      description: "Schema mismatch, stale fields, parsing/merge edge cases.",
      status: "not-started",
      priority: "high",
    },
    {
      id: "module-docs",
      name: "Documentation and Handoff",
      description: "Runbooks, maintenance notes, import/export guidance for cross-agent workflow.",
      status: "not-started",
      priority: "low",
    },
  ],
  runs: [],
  findings: [],
  reviewUnits: [
    {
      id: "unit-story-builder",
      name: "Story Builder",
      route: "/",
      files: ["src/components/chronicle/WorldTab.tsx"],
      notes: "Pending fresh baseline scan.",
      status: "pending",
    },
    {
      id: "unit-character-builder",
      name: "Character Builder",
      route: "/",
      files: ["src/components/chronicle/CharactersTab.tsx"],
      notes: "Pending fresh baseline scan.",
      status: "pending",
    },
    {
      id: "unit-chat-interface",
      name: "Chat Interface",
      route: "/",
      files: ["src/components/chronicle/ChatInterfaceTab.tsx"],
      notes: "Pending fresh baseline scan.",
      status: "pending",
    },
    {
      id: "unit-admin-style-guide",
      name: "Admin Style Guide",
      route: "/",
      files: ["src/components/admin/styleguide/StyleGuideTool.tsx"],
      notes: "Pending fresh baseline scan.",
      status: "pending",
    },
  ],
  handoffNotes:
    "Fresh Quality Hub baseline initialized. Import external findings JSON from other agents, then verify and reconcile in this dashboard.",
};
