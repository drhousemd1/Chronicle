import { defineManualArchitectureFiles } from "./types";

const componentHeader = {
  label: "REACT COMPONENT" as const,
  className: "component" as const,
  filterValue: "component" as const,
  navAccent: "component" as const,
};

export const chronicleArcArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/src/components/chronicle/arc/ArcBranchLane.tsx",
    header: componentHeader,
    metric: "285 lines",
    metricDescription: "Editable success or failure branch inside a story-goal phase.",
    description:
      "Renders one side of an Arc phase as a trigger plus ordered recovery or progression steps. It exposes step creation, editing, deletion, and status callbacks; displays retry counts, permanent-failure state, completion timing, and flexibility-sensitive labels; and shows the locked dynamic-recovery sentinel that explains what the AI handles after authored recovery attempts.",
    rows: [
      {
        id: "arc-branch-step-status",
        title: "Branch step status controls",
        summary:
          "Maps pending, failed, succeeded, and deviated status to explicit actions and presentation without changing branch state directly.",
        badgeLabel: "ARC STATE",
        badgeClass: "feature",
        details: [
          { label: "Inputs", values: ["ArcBranch", "fail or success type", "GoalFlexibility", "simple or advanced mode"], kind: "plain" },
          { label: "Outputs", values: ["onUpdateStep", "onDeleteStep", "onToggleStatus", "onAddStep"], kind: "plain" },
          { label: "Display Rules", values: ["rigid success uses Deviated rather than Failed", "retry clones are summarized on their original step", "resolved descriptions are struck through"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of trigger editing, step filtering, retry and permanent-failure display, status controls, dynamic recovery, and mode rules.",
  },
  {
    path: "/src/components/chronicle/arc/ArcConnectors.tsx",
    header: componentHeader,
    metric: "49 lines",
    metricDescription: "Static split and merge connectors for arc phases.",
    description:
      "Draws the fixed SVG connector that visually splits a phase into fail and success lanes or merges those lanes before the next phase. It owns only line geometry and the split-stem fade; it does not inspect branch state or calculate live step-to-step transitions.",
    rows: [],
    reviewedSource: "Manual review of both SVG modes, dimensions, line coordinates, and gradient definition.",
  },
  {
    path: "/src/components/chronicle/arc/ArcFlowConnector.tsx",
    header: componentHeader,
    metric: "102 lines",
    metricDescription: "Live cross-branch step connector.",
    description:
      "Locates a source and target Arc step by data-step-id, converts their current DOM rectangles into a right-angle SVG path, and redraws that path when the container resizes or its step DOM changes. It visualizes a transition selected by ArcPhaseCard and does not decide which transition is active.",
    rows: [
      {
        id: "arc-flow-geometry",
        title: "DOM-relative connector geometry",
        summary:
          "Chooses opposing card edges from left/right placement, routes horizontally through a midpoint, and overlays a blue glow path at the container's current size.",
        badgeLabel: "LAYOUT LOGIC",
        badgeClass: "code-logic",
        details: [
          { label: "Observes", values: ["container ResizeObserver", "subtree MutationObserver", "window resize"], kind: "plain" },
          { label: "Input", values: ["sourceStepId", "targetStepId", "containerRef"], kind: "plain" },
          { label: "Fallback", values: ["renders nothing until both step elements and nonzero container dimensions exist"], kind: "plain" },
        ],
      },
    ],
    reviewedSource: "Manual review of element lookup, coordinate conversion, right-angle path construction, observer cleanup, and rendering guard.",
  },
  {
    path: "/src/components/chronicle/arc/ArcModeToggle.tsx",
    header: componentHeader,
    metric: "38 lines",
    metricDescription: "Simple-versus-advanced Arc editor switch.",
    description:
      "Renders a controlled two-option switch for ArcMode and reports simple or advanced to the phase owner. It changes no branch data itself; ArcPhaseCard is responsible for initializing advanced branch steps when the mode changes.",
    rows: [],
    reviewedSource: "Manual review of the controlled mode state and both callbacks.",
  },
  {
    path: "/src/components/chronicle/arc/ArcPhaseCard.tsx",
    header: componentHeader,
    metric: "304 lines",
    metricDescription: "Story-arc phase editor and branch-transition coordinator.",
    description:
      "Owns the editable presentation of one Arc phase: title, desired outcome, guidance strength, editing mode, fail and success branches, step status ordering, progress, and active cross-branch flow. It returns phase patches to its parent, creates missing branches and initial advanced steps, and delegates field enhancement through the same parent-owned AI contract used by other builders.",
    rows: [
      {
        id: "arc-phase-state",
        title: "Phase and branch state orchestration",
        summary:
          "Creates stable branch and step IDs, applies immutable branch patches, stamps phase updates, and increments statusEventCounter whenever a step enters or leaves a resolved state.",
        badgeLabel: "STATE OWNER",
        badgeClass: "feature",
        details: [
          { label: "Owns", values: ["branch initialization", "step CRUD", "step status events", "phase progress calculation"], kind: "plain" },
          { label: "Uses", values: ["/src/components/chronicle/arc/ArcBranchLane.tsx", "/src/components/chronicle/arc/ArcModeToggle.tsx", "/src/components/chronicle/GuidanceStrengthSlider.tsx"], kind: "files" },
          { label: "Output", values: ["Partial<ArcPhase> through onUpdate"], kind: "plain" },
        ],
      },
      {
        id: "arc-phase-active-flow",
        title: "Latest resolved cross-branch transition",
        summary:
          "Finds the most recent resolved step by statusEventOrder and draws one transition from recovered failure to the next success step or from failed/deviated success to the next failure step.",
        badgeLabel: "FLOW LOGIC",
        badgeClass: "code-logic",
        details: [
          { label: "Success Direction", values: ["succeeded fail-branch step to first unresolved success step"], kind: "plain" },
          { label: "Recovery Direction", values: ["failed or deviated success step to first unresolved fail step"], kind: "plain" },
          { label: "Uses", values: ["/src/components/chronicle/arc/ArcFlowConnector.tsx", "/src/components/chronicle/arc/ArcConnectors.tsx"], kind: "files" },
        ],
      },
    ],
    reviewedSource: "Manual review of phase fields, branch initialization, step CRUD, status event ordering, progress, active-flow selection, mode change, and AI handoff.",
  },
]);
