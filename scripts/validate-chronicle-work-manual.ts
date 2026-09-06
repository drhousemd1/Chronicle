import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import {
  CHRONICLE_WORK_MANUAL_PATH,
  getWorkManualNamedSectionSource,
  validateWorkManualReadingPaths,
  validateWorkManualPointers,
  validateWorkManualSource,
  type WorkManualPointerSource,
} from "../src/data/chronicle-knowledge-base/work-manual-contract";
import {
  assertActiveKnowledgeCertificationContext,
  assertNoUnfinishedKnowledgeTransaction,
} from "./knowledge-record-transaction-guard.mjs";

const repoRoot = process.cwd();
assertActiveKnowledgeCertificationContext({
  repoRoot,
  expectedCommand: "knowledge-work-manual-check",
});
assertNoUnfinishedKnowledgeTransaction({ repoRoot });

function argumentPath(name: string, fallback: string) {
  const prefix = `--${name}=`;
  const argument = process.argv.slice(2).find((value) => value.startsWith(prefix));
  return path.resolve(argument ? argument.slice(prefix.length) : fallback);
}

function argumentValues(name: string) {
  const prefix = `--${name}=`;
  return process.argv
    .slice(2)
    .filter((value) => value.startsWith(prefix))
    .map((value) => value.slice(prefix.length));
}

function readRequired(filePath: string, label: string) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    throw new Error(`${label} is missing or unreadable: ${filePath}`);
  }
}

function requireMarkers(
  label: string,
  source: string,
  required: readonly string[],
  forbidden: readonly string[],
) {
  for (const marker of required) {
    if (!source.includes(marker)) errors.push(`${label} is missing: ${marker}`);
  }
  for (const marker of forbidden) {
    if (source.includes(marker)) errors.push(`${label} still contains retired authority: ${marker}`);
  }
}

function topLevelMarkdownSection(source: string, heading: string) {
  const normalized = source.replace(/\r\n/g, "\n");
  const marker = `# ${heading}\n`;
  const start = normalized.indexOf(marker);
  if (start < 0) return "";
  const next = normalized.indexOf("\n# ", start + marker.length);
  return normalized.slice(start, next < 0 ? normalized.length : next);
}

const manualPath = argumentPath(
  "manual",
  path.join(repoRoot, CHRONICLE_WORK_MANUAL_PATH),
);
const manualSource = readRequired(manualPath, "Canonical Chronicle Work Manual");
const manualResult = validateWorkManualSource(manualSource);
const errors = [...manualResult.errors];

const pointerSources: WorkManualPointerSource[] = [
  {
    label: "Chronicle repository AGENTS.md",
    source: readRequired(
      argumentPath("repo-agents", path.join(repoRoot, "AGENTS.md")),
      "Chronicle repository AGENTS.md",
    ),
    enforceWordCeiling: true,
  },
  {
    label: "Parent AGENTS.md Chronicle pointer",
    source: readRequired(
      argumentPath("parent-agents", path.join(repoRoot, "..", "AGENTS.md")),
      "Parent AGENTS.md",
    ),
    enforceWordCeiling: false,
  },
  {
    label: "Global AGENTS.md Chronicle pointer",
    source: readRequired(
      argumentPath("global-agents", path.join(os.homedir(), ".codex", "AGENTS.md")),
      "Global AGENTS.md",
    ),
    enforceWordCeiling: false,
  },
  {
    label: "General subagent mechanics Chronicle pointer",
    source: readRequired(
      argumentPath("subagents", path.join(os.homedir(), ".codex", "SUBAGENTS.md")),
      "SUBAGENTS.md",
    ),
    enforceWordCeiling: false,
  },
  {
    label: "Installed chronicle-knowledge-workflow skill",
    source: readRequired(
      argumentPath(
        "installed-skill",
        path.join(
          os.homedir(),
          ".codex",
          "skills",
          "chronicle-knowledge-workflow",
          "SKILL.md",
        ),
      ),
      "Installed workflow skill",
    ),
    enforceWordCeiling: true,
  },
  {
    label: "Installed chronicle-knowledge-workflow agent prompt",
    source: readRequired(
      argumentPath(
        "installed-agent",
        path.join(
          os.homedir(),
          ".codex",
          "skills",
          "chronicle-knowledge-workflow",
          "agents",
          "openai.yaml",
        ),
      ),
      "Installed workflow agent prompt",
    ),
    enforceWordCeiling: true,
  },
  {
    label: "App Build Discipline Chronicle boundary",
    source: readRequired(
      argumentPath(
        "app-build-skill",
        path.join(os.homedir(), ".codex", "skills", "app-build-discipline", "SKILL.md"),
      ),
      "App Build Discipline skill",
    ),
    enforceWordCeiling: false,
  },
  {
    label: "Verification Before Completion Chronicle boundary",
    source: readRequired(
      argumentPath(
        "verification-skill",
        path.join(os.homedir(), ".codex", "skills", "verification-before-completion", "SKILL.md"),
      ),
      "Verification Before Completion skill",
    ),
    enforceWordCeiling: false,
  },
  {
    label: "Critical Patch Review Chronicle boundary",
    source: readRequired(
      argumentPath(
        "critical-review-skill",
        path.join(os.homedir(), ".codex", "skills", "critical-patch-review", "SKILL.md"),
      ),
      "Critical Patch Review skill",
    ),
    enforceWordCeiling: false,
  },
  {
    label: "Diagnosis mechanics Chronicle boundary",
    source: readRequired(
      argumentPath(
        "diagnose-skill",
        path.join(os.homedir(), ".codex", "skills", "diagnose", "SKILL.md"),
      ),
      "Diagnose skill",
    ),
    enforceWordCeiling: false,
  },
  {
    label: "Research mechanics Chronicle boundary",
    source: readRequired(
      argumentPath(
        "research-skill",
        path.join(os.homedir(), ".codex", "skills", "research-workflow", "SKILL.md"),
      ),
      "Research Workflow skill",
    ),
    enforceWordCeiling: false,
  },
  {
    label: "Lovable operating mechanics Chronicle boundary",
    source: readRequired(
      argumentPath(
        "lovable-skill",
        path.join(os.homedir(), ".codex", "skills", "lovable-controlled-handoff", "SKILL.md"),
      ),
      "Lovable Controlled Handoff skill",
    ),
    enforceWordCeiling: false,
  },
  {
    label: "Lovable operating mechanics agent prompt",
    source: readRequired(
      argumentPath(
        "lovable-agent",
        path.join(os.homedir(), ".codex", "skills", "lovable-controlled-handoff", "agents", "openai.yaml"),
      ),
      "Lovable Controlled Handoff agent prompt",
    ),
    enforceWordCeiling: true,
  },
];

if (manualResult.metadata) {
  errors.push(
    ...validateWorkManualPointers(manualResult.metadata, pointerSources).errors,
  );
}

const repositoryPointer = pointerSources.find(
  (pointer) => pointer.label === "Chronicle repository AGENTS.md",
)?.source ?? "";
const parentPointer = topLevelMarkdownSection(
  pointerSources.find(
    (pointer) => pointer.label === "Parent AGENTS.md Chronicle pointer",
  )?.source ?? "",
  "Chronicle workflow pointer",
);
const parentPointerHeadingCount = (
  pointerSources.find(
    (pointer) => pointer.label === "Parent AGENTS.md Chronicle pointer",
  )?.source ?? ""
)
  .split(/\r?\n/)
  .filter((line) => line === "# Chronicle workflow pointer").length;
if (parentPointerHeadingCount !== 1) {
  errors.push(
    `Parent AGENTS.md must contain exactly one top-level Chronicle workflow pointer heading; found ${parentPointerHeadingCount}`,
  );
}
const onboardingSkill = pointerSources.find(
  (pointer) => pointer.label === "Installed chronicle-knowledge-workflow skill",
)?.source ?? "";

const selectedReadingPath = argumentValues("reading-path");
if (selectedReadingPath.length > 1) {
  errors.push("only one --reading-path may be supplied");
}
const readingPath = selectedReadingPath[0];
if (
  readingPath &&
  !["routine", "connected", "multi-system"].includes(readingPath)
) {
  errors.push(
    "--reading-path must be routine, connected, or multi-system",
  );
}
const additionalInstructionSources = argumentValues("loaded-instruction").map(
  (filePath) => readRequired(path.resolve(filePath), `Loaded instruction ${filePath}`),
);
const selectedManualSections = argumentValues("manual-section").map((heading) => {
  const section = getWorkManualNamedSectionSource(manualSource, heading);
  if (!section) {
    errors.push(`--manual-section does not match a canonical Manual heading: ${heading}`);
  }
  return section;
});
const taskSpecificReading = [
  ...additionalInstructionSources,
  ...selectedManualSections,
];
if (taskSpecificReading.length > 0 && !readingPath) {
  errors.push(
    "--loaded-instruction and --manual-section require --reading-path so the complete task reading package can be measured",
  );
}

const readingPathSupplements = {
  defaultSources: [repositoryPointer, parentPointer, onboardingSkill],
  routineSources:
    readingPath === "routine" ? taskSpecificReading : undefined,
  connectedSources:
    readingPath === "connected" ? taskSpecificReading : undefined,
  multiSystemSources:
    readingPath === "multi-system" ? taskSpecificReading : undefined,
};
errors.push(
  ...validateWorkManualReadingPaths(manualSource, readingPathSupplements).errors,
);

const parentAgentsSource = pointerSources.find(
  (pointer) => pointer.label === "Parent AGENTS.md Chronicle pointer",
)?.source ?? "";
requireMarkers(
  "Parent AGENTS.md proportional boundary",
  parentAgentsSource,
  [
    "Only restate the request or ask for confirmation when genuine ambiguity would materially change the result.",
    "do not turn that into a repository-wide audit",
    "Expand the investigation only when current source shows a broader behavior",
  ],
  [
    "Wait for the user to confirm we are on the same page before changing anything.",
    "Never spot fix.",
    "every other place in the codebase it will affect",
    "# Roleplay prompt debugging",
    "Do not use test-story details",
    "Do not use the words \"canon\" or \"beat\" in new prompt wording",
  ],
);

const manifestLoader = readRequired(
  path.join(repoRoot, "src/data/chronicle-knowledge-base/manifest.ts"),
  "Knowledge manifest loader",
);
requireMarkers(
  "Knowledge manifest loader",
  manifestLoader,
  ["chronicle-work-manual.md?raw", "chronicleWorkManualDocumentSource"],
  ["chronicle-application-manual-writer-rough-draft.md?raw", "chronicleKnowledgeRoughDraft"],
);

const knowledgePage = readRequired(
  path.join(repoRoot, "src/pages/style-guide/chronicle-knowledge-base.tsx"),
  "Knowledge Base page",
);
requireMarkers(
  "Knowledge Base page",
  knowledgePage,
  [
    "chronicleWorkManualSection",
    "knowledge-work-manual-source",
    "data-reviewed-chapters-sha256",
  ],
  [
    "knowledge-work-manual-entry",
    "knowledge-work-manual-view",
    "knowledge-rough-draft",
    "Chronicle Application Manual Writer — Rough Draft",
  ],
);

const styleGuideTool = readRequired(
  path.join(repoRoot, "src/components/admin/styleguide/StyleGuideTool.tsx"),
  "App Style Guide instructions",
);
requireMarkers(
  "App Style Guide instructions",
  styleGuideTool,
  [
    `Chronicle Work Manual: ${CHRONICLE_WORK_MANUAL_PATH}`,
    "This panel does not require a plan, audit, Current Work record",
  ],
  ["MANDATORY PLANNING STEPS", "General-Purpose Protocol (always use this)"],
);

const qualityHubPage = readRequired(
  path.join(repoRoot, "src/pages/style-guide/ui-audit.tsx"),
  "Quality Hub page",
);
requireMarkers(
  "Quality Hub page",
  qualityHubPage,
  [
    "Quality Hub stores scan mechanics and scan results.",
    "Chronicle records only when the Work Manual trigger applies",
  ],
  ["Track active implementation in the applicable capability", "Follow each module checklist in Overview exactly"],
);

const qualityHubSeed = readRequired(
  path.join(repoRoot, "src/data/ui-audit-findings.ts"),
  "Quality Hub seed registry",
);
requireMarkers(
  "Quality Hub seed registry",
  qualityHubSeed,
  ["chronicle-records-if-triggered"],
  ['"knowledge-base-current-work"'],
);

const qualityHubPlaybook = readRequired(
  path.join(repoRoot, "docs/guides/quality-hub-scan-playbook.md"),
  "Quality Hub scan playbook",
);
requireMarkers(
  "Quality Hub scan playbook",
  qualityHubPlaybook,
  [
    `Chronicle Work Manual: ${CHRONICLE_WORK_MANUAL_PATH}`,
    "Quality Hub Scan Technical Procedure",
    "node node_modules/vitest/vitest.mjs run",
    "node scripts/generate-roleplay-artifact-identity.mjs",
    "node node_modules/vite/bin/vite.js build",
  ],
  [
    "## Required Logging Flow",
    "A scan pass is complete only when",
    "npx tsc --noEmit",
    "npm run test",
  ],
);

const adminGuide = readRequired(
  path.join(repoRoot, "docs/guides/admin-panel-page-structure-guide.md"),
  "Admin Panel architecture guide",
);
requireMarkers(
  "Admin Panel architecture guide",
  adminGuide,
  [`Chronicle Work Manual: ${CHRONICLE_WORK_MANUAL_PATH}`, "PAGE-REFERENCE MECHANICS"],
  ["INSTRUCTIONS FOR LOVABLE / AI AGENTS", "R&D README ↔ parent agent guidance"],
);

const supabaseTables = readRequired(
  path.join(repoRoot, "docs/architecture-knowledge/supabase-tables.md"),
  "Supabase Tables reference",
);
requireMarkers(
  "Supabase Tables reference",
  supabaseTables,
  [
    `Chronicle Work Manual: ${CHRONICLE_WORK_MANUAL_PATH}`,
    "This page supplies reference and handoff mechanics; it does not decide when a Chronicle task requires",
  ],
  [
    "must be inspected during any audit, code review, implementation plan, or code change",
    "the plan must include an explicit Lovable handoff",
  ],
);

const capabilityManualAuthorityChecks = [
  {
    path: "docs/architecture-knowledge/community-gallery.md",
    required: [
      "This manual does not itself create an Issue or Current Work project; the Chronicle Work Manual owns those separate record triggers.",
      "The Chronicle Work Manual governs the evidence selected for later work",
      "the Chronicle Work Manual governs whether a later task requires a live comparison",
    ],
    forbidden: [
      "verified difference belongs in Issues",
      "Active investigation or repair belongs in Current Work",
      "Lovable must verify",
      "mandatory verification and Lovable handoff",
      "Lovable workflow own verification",
      "Evidence Required for Later Runtime Claims",
      "Supabase Tables instructions govern the Lovable verification",
      "subject to Lovable verification",
      "requires Lovable verification",
    ],
  },
  {
    path: "docs/architecture-knowledge/my-images.md",
    required: [
      "the Chronicle Work Manual governs whether a task uses them",
      "this capability manual does not prescribe that future procedure",
    ],
    forbidden: [
      "explains how an agent must use that reference",
      "this manual requires Lovable/reference reconciliation",
      "Lovable owns verification and changes to the live hosted project",
      "Before an agent claims the deployed folder-summary query",
      "Lovable/reference reconciliation is required",
      "The next backend verification must be performed through Lovable",
    ],
  },
  {
    path: "docs/architecture-knowledge/my-stories.md",
    required: [
      "The Chronicle Work Manual governs any later task that needs a live comparison",
      "the Chronicle Work Manual governs the evidence selected for later work",
    ],
    forbidden: [
      "Lovable must verify the live policies",
      "Runtime verification must inspect both",
      "must trigger a focused re-review",
    ],
  },
  {
    path: "docs/architecture-knowledge/character-builder.md",
    required: [
      "The Chronicle Work Manual governs any later task that needs to reconcile those sources",
    ],
    forbidden: ["Agents must use that reference"],
  },
  {
    path: "docs/architecture-knowledge/character-library.md",
    required: [
      "the Chronicle Work Manual governs any later reconciliation",
      "The Chronicle Work Manual governs any later live comparison",
      "the Chronicle Work Manual governs whether a later task requires a live comparison",
    ],
    forbidden: [
      "This requires reconciliation before",
      "Lovable should confirm",
      "require Lovable/reference reconciliation",
      "Before changing or asserting live backend behavior",
      "Lovable verification is still required",
      "subject to Lovable verification",
    ],
  },
  {
    path: "docs/architecture-knowledge/story-builder.md",
    required: [
      "the Chronicle Work Manual governs any later live comparison",
    ],
    forbidden: ["Lovable/reference reconciliation is required"],
  },
] as const;

for (const check of capabilityManualAuthorityChecks) {
  requireMarkers(
    `Capability manual ${check.path}`,
    readRequired(path.join(repoRoot, check.path), check.path),
    check.required,
    check.forbidden,
  );
}

requireMarkers(
  "Quality Hub read-only Changelog explanation",
  qualityHubPage,
  [
    "It is a read-only history surface; the Chronicle Work",
    "Manual separately governs when Current Work or an accepted Changelog",
  ],
  [
    "Active implementation belongs in the applicable",
    "guarded closeout creates accepted",
  ],
);

const lovableMechanics = pointerSources.find(
  (pointer) => pointer.label === "Lovable operating mechanics Chronicle boundary",
)?.source ?? "";
requireMarkers(
  "Lovable operating mechanics",
  lovableMechanics,
  [
    "Do not derive task scope, evidence, approval rules, records, or stopping conditions from this skill.",
    "src/data/supabase-schema-reference.ts",
    "It is the last repository-synchronized account of the backend, not proof of the inaccessible live project.",
    "the Work Manual owns the wider evidence and completion decision.",
  ],
  [
    "src/data/supabase-schema-map.ts",
    "src/data/database-schema-inventory.ts",
    "Use this loop for any serious Lovable task",
    "Approve execution only when the plan is specific, complete, and safe.",
    "The loop ends only when",
    "Pause and ask the user before approving Lovable execution",
  ],
);

for (const referencePath of [
  "docs/guides/account-page-structure-guide.md",
  "docs/guides/app-overview-global-systems.md",
  "docs/guides/character-builder-page-structure-guide.md",
  "docs/guides/character-library-page-structure-guide.md",
  "docs/guides/chat-history-page-structure-guide.md",
  "docs/guides/chat-interface-page-structure-guide.md",
  "docs/guides/community-gallery-page-structure-guide.md",
  "docs/guides/edge-functions-ai-services-structure-guide.md",
  "docs/guides/image-library-page-structure-guide.md",
  "docs/guides/scenario-builder-page-structure-guide.md",
  "docs/guides/shared-elements-architecture-structure-guide.md",
  "docs/guides/your-stories-page-structure-guide.md",
]) {
  requireMarkers(
    `Page reference ${referencePath}`,
    readRequired(path.join(repoRoot, referencePath), referencePath),
    [
      `Chronicle Work Manual: ${CHRONICLE_WORK_MANUAL_PATH}`,
      "This document describes the current page or system architecture. It does not decide when Chronicle work requires",
      "When the Work Manual or the user triggers a factual update to this reference",
    ],
    [
      "INSTRUCTIONS FOR LOVABLE / AI AGENTS",
      "When making changes to this page's code, you MUST:",
      "READ this entire document before making any code changes",
      "UPDATE the Known Issues section (Section 12) when fixing or discovering bugs",
    ],
  );
}

const retiredPolicyPath = argumentPath(
  "retired-policy",
  path.join(repoRoot, "docs/architecture-knowledge/workflow/route-policy.md"),
);
const retiredPolicy = readRequired(retiredPolicyPath, "Retired route-policy pointer");
for (const requiredMarker of [
  "status: retired-historical-pointer",
  `superseded_by: ${CHRONICLE_WORK_MANUAL_PATH}`,
  `Chronicle Work Manual: ${CHRONICLE_WORK_MANUAL_PATH}`,
]) {
  if (!retiredPolicy.includes(requiredMarker)) {
    errors.push(`retired route-policy pointer is missing: ${requiredMarker}`);
  }
}
for (const forbiddenHeading of [
  "## Mandatory Route Selection",
  "## Route 1",
  "## Route 2",
  "## Route 3",
  "## Route 4",
]) {
  if (retiredPolicy.includes(forbiddenHeading)) {
    errors.push(`retired route-policy pointer still contains active rules: ${forbiddenHeading}`);
  }
}

const skillsRoot = argumentPath(
  "skills-root",
  path.join(os.homedir(), ".codex", "skills"),
);
for (const retiredSkill of [
  "pre-push-checklist-for-chronicle-github-push",
  "chronicle-research-workflow",
]) {
  if (fs.existsSync(path.join(skillsRoot, retiredSkill))) {
    errors.push(`retired Chronicle skill is still active: ${retiredSkill}`);
  }
}
if (fs.existsSync(path.join(skillsRoot, "chronicle-knowledge-workflow", "references"))) {
  errors.push("retired chronicle-knowledge-workflow procedural references are still active");
}

for (const retiredRepositoryInstruction of [
  "docs/architecture-knowledge/chronicle-application-manual-writer-rough-draft.md",
]) {
  if (fs.existsSync(path.join(repoRoot, retiredRepositoryInstruction))) {
    errors.push(
      `retired Chronicle repository instruction is still active: ${retiredRepositoryInstruction}`,
    );
  }
}

if (errors.length > 0) {
  console.error("Chronicle Work Manual validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(
  `Chronicle Work Manual validation passed: ${manualResult.metadata?.manual_version}; ${pointerSources.length} synchronized pointer source(s); retired instruction paths absent.`,
);
