import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import {
  ArchitectureNode,
  ArchitectureRegistry,
  buildArchitectureRegistry,
  countDescendants,
} from "@/lib/app-architecture-utils";
import { architectureSourcePaths } from "@/data/architecture-source-paths";
import { architectureExtraPaths } from "@/data/architecture-extra-paths";
import { architectureFileMetrics } from "@/data/architecture-file-metrics";
import { architectureFileAnalysis } from "@/data/architecture-file-analysis";
import { databaseSchemaInventory } from "@/data/database-schema-inventory";
import securityShieldIcon from "@/assets/admin/security-shield-v2-cropped.png";

const STATIC_ARCHITECTURE_PATHS = [
  "/README.md",
  "/package.json",
  "/vite.config.ts",
  "/playwright.config.ts",
  "/eslint.config.js",
  "/tsconfig.json",
  "/components.json",
  "/scripts/refresh-architecture-paths.mjs",
  "/scripts/run-quality-hub-scan.mjs",
  "/scripts/verify-prompt-serialization.ts",
  "/e2e/smoke.spec.ts",
];

const GENERATED_PATHS = [...STATIC_ARCHITECTURE_PATHS, ...architectureSourcePaths, ...architectureExtraPaths].sort((a, b) =>
  a.localeCompare(b),
);

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "service", label: "Services" },
  { value: "hook", label: "Hooks" },
  { value: "context", label: "Contexts" },
  { value: "component", label: "React Components" },
  { value: "feature", label: "Features" },
  { value: "code-logic", label: "Code Logic" },
  { value: "context-injection", label: "Context Injection" },
  { value: "data-block", label: "Data Blocks" },
  { value: "db-table", label: "Database Tables" },
  { value: "db-migration", label: "DB Migrations" },
  { value: "edge-fn", label: "Edge Functions" },
  { value: "integration", label: "Integrations" },
  { value: "documentation", label: "Documentation" },
  { value: "tooling", label: "Tooling" },
  { value: "script", label: "Scripts" },
  { value: "test", label: "Tests" },
  { value: "api-call", label: "API Calls" },
  { value: "security", label: "Security" },
] as const;

type FilterValue = (typeof FILTER_OPTIONS)[number]["value"];

type NavSnapshotEntry =
  | {
      kind: "file";
      path: string;
    }
  | {
      kind: "folder";
      path: string;
      children: NavSnapshotEntry[];
    };

type NavSnapshotSection = {
  title: string;
  path?: string;
  children: NavSnapshotEntry[];
};

type FileAnalysis = {
  imports: string[];
  importedBy: string[];
  tables: string[];
  rpcs: string[];
  edgeFunctions: string[];
  storageBuckets: string[];
};

type DetailLineKind = "files" | "tables" | "rpcs" | "edges" | "buckets" | "plain";

type DetailLine = {
  label: string;
  values: string[];
  kind: DetailLineKind;
};

type FileRow = {
  id: string;
  title: string;
  summary: string;
  badgeLabel: string;
  badgeClass:
    | "component"
    | "feature"
    | "code-logic"
    | "data-block"
    | "context-injection"
    | "edge-fn"
    | "db-table"
    | "integration"
    | "api-call"
    | "hook"
    | "context"
    | "documentation"
    | "tooling"
    | "script"
    | "test"
    | "db-migration";
  details: DetailLine[];
  signal?: "refactor" | "issue";
  note?: string;
  security?: boolean;
};

type LineCountState = {
  badgeClass: "" | "is-large" | "is-refactor-soon" | "is-refactor-needed";
  description: string;
  fileSignal?: "refactor";
  rowSignal?: "refactor";
};

type RefactorTriageOverride = {
  suppressAutoRefactor?: boolean;
  lineBadgeClass?: LineCountState["badgeClass"];
  lineBadgeDescription?: string;
  fileSignal?: "refactor";
  fileNote?: string;
  rowOverrides?: Record<string, Partial<Pick<FileRow, "signal" | "note">>>;
};

type HeaderBadge = {
  label:
    | "TOOLING"
    | "SERVICE"
    | "HOOK"
    | "CONTEXT PROVIDER"
    | "REACT COMPONENT"
    | "INTEGRATION"
    | "DOCUMENTATION"
    | "SCRIPT"
    | "TEST"
    | "EDGE FUNCTION"
    | "DB MIGRATION"
    | "CODE LOGIC";
  className:
    | "tooling"
    | "service"
    | "hook"
    | "context"
    | "component"
    | "integration"
    | "documentation"
    | "script"
    | "test"
    | "edge-fn"
    | "db-migration"
    | "code-logic";
  filterValue: FilterValue;
  navAccent:
    | "tooling"
    | "service"
    | "hook"
    | "context"
    | "component"
    | "integration"
    | "documentation"
    | "script"
    | "test"
    | "edge-fn"
    | "db-migration"
    | "code-logic";
};

type StaticFileOverride = {
  description: string;
  rows: FileRow[];
};

const REFACTOR_TRIAGE_OVERRIDES: Record<string, RefactorTriageOverride> = {
  "/src/pages/Index.tsx": {
    fileNote:
      "Refactor target: split the workspace shell into smaller ownership layers for auth/bootstrap, tab routing, scenario state, modal orchestration, and page-specific loaders. Right now one change to app navigation or startup flow can easily collide with unrelated chat, builder, or admin behavior.",
  },
  "/src/components/admin/finance/FinanceDashboardTool.tsx": {
    fileNote:
      "Refactor target: break this dashboard into smaller finance modules for overview metrics, user/subscription management, usage telemetry, billing, validation reporting, and document workflows. At its current size, one finance fix can destabilize the entire admin finance surface.",
  },
  "/src/components/chronicle/ChatInterfaceTab.tsx": {
    fileNote:
      "Refactor target: separate message rendering/composer UI, effective canonical-state resolution, AI request orchestration, and modal/tool launchers into smaller units. This file now carries both the visible chat UX and the generation-safe continuity engine, which makes safe iteration harder than it should be.",
  },
  "/src/features/story-builder/StoryBuilderScreen.tsx": {
    fileNote:
      "Refactor target: split the story-builder shell into layout/sidebar ownership, section render configuration, media/modals, and AI-enhance orchestration. The screen currently carries too much UI, workflow, and persistence-adjacent behavior in one place.",
  },
  "/src/features/character-builder/CharacterBuilderScreen.tsx": {
    fileNote:
      "Refactor target: split the character-builder shell into navigation/progress UI, hardcoded section rendering, custom-content rendering, and enhance/media flows. That would make custom-field work and AI-enhance fixes safer and easier to reason about.",
  },
  "/src/services/character-ai.ts": {
    fileNote:
      "Refactor target: split section prompt construction, enhance request execution, response parsing, and persistence/update helpers into focused modules. The current file is carrying too much end-to-end responsibility for the character-enhance pipeline.",
  },
  "/src/services/llm.ts": {
    fileNote:
      "Refactor target: separate prompt assembly, `roleplay_v2` request execution, post-response parsing, and follow-up extraction/update helpers. This is one of the highest-risk files in the app because it now sits directly on the planner/writer/validator chat runtime path.",
  },
  "/src/pages/style-guide/app-architecture.tsx": {
    fileNote:
      "Refactor target: split this page into shell/layout, left-rail navigation, file-card rendering, schema rendering, legend/filter controls, and static triage metadata. The architecture tool is now strong enough that it needs its own modular structure too.",
  },
  "/src/data/ui-audit-findings.ts": {
    fileNote:
      "Refactor target: split Quality Hub data into smaller registries for overview metadata, scan modules, findings, scan runs, and change-log entries. Keeping all operator history and scan definitions in one mega file is becoming a maintenance bottleneck.",
  },
  "/src/data/api-inspector-guide-template.ts": {
    fileNote:
      "Refactor target: split the API Inspector template content by lifecycle section or API call so prompt-map maintenance stops flowing through one 3k-line content registry. Smaller slices would also make code-truth updates much less error-prone.",
  },
  "/src/data/api-inspector-guide-phases.ts": {
    lineBadgeClass: "is-refactor-needed",
    lineBadgeDescription: "Refactor needed: this phase registry is approaching the same maintenance cliff as the larger inspector template files.",
    fileSignal: "refactor",
    fileNote:
      "Refactor target: split phase definitions by lifecycle segment or API-call family instead of one shared registry. This file is already dense enough that keeping all phases together is starting to work against clarity.",
  },
  "/src/data/database-schema-inventory.ts": {
    suppressAutoRefactor: true,
    lineBadgeClass: "is-large",
    lineBadgeDescription: "Large generated schema inventory file. Size alone is expected here and should not be treated as refactor debt.",
  },
  "/src/integrations/supabase/types.ts": {
    suppressAutoRefactor: true,
    lineBadgeClass: "is-large",
    lineBadgeDescription: "Large generated Supabase types file. Size alone is expected here and should not be treated as refactor debt.",
  },
};

const CURATED_NAV_SECTIONS: NavSnapshotSection[] = [
  {
    title: "Root Files",
    children: [
      { kind: "file", path: "/README.md" },
      { kind: "file", path: "/package.json" },
      { kind: "file", path: "/vite.config.ts" },
      { kind: "file", path: "/playwright.config.ts" },
      { kind: "file", path: "/eslint.config.js" },
      { kind: "file", path: "/tsconfig.json" },
      { kind: "file", path: "/components.json" },
    ],
  },
  {
    title: "src",
    path: "/src",
    children: [
      {
        kind: "folder",
        path: "/src/pages",
        children: [
          { kind: "file", path: "/src/pages/Index.tsx" },
          { kind: "file", path: "/src/pages/Admin.tsx" },
          { kind: "file", path: "/src/pages/Gallery.tsx" },
        ],
      },
      {
        kind: "folder",
        path: "/src/features",
        children: [
          {
            kind: "folder",
            path: "/src/features/story-builder",
            children: [{ kind: "file", path: "/src/features/story-builder/StoryBuilderScreen.tsx" }],
          },
          {
            kind: "folder",
            path: "/src/features/character-builder",
            children: [{ kind: "file", path: "/src/features/character-builder/CharacterBuilderScreen.tsx" }],
          },
          {
            kind: "folder",
            path: "/src/features/character-editor-modal",
            children: [{ kind: "file", path: "/src/features/character-editor-modal/CharacterEditorModalScreen.tsx" }],
          },
        ],
      },
      {
        kind: "folder",
        path: "/src/services",
        children: [
          { kind: "file", path: "/src/services/llm.ts" },
          { kind: "file", path: "/src/services/supabase-data.ts" },
          {
            kind: "folder",
            path: "/src/services/persistence",
            children: [
              { kind: "file", path: "/src/services/persistence/shared.ts" },
              { kind: "file", path: "/src/services/persistence/characters.ts" },
              { kind: "file", path: "/src/services/persistence/scenarios.ts" },
              { kind: "file", path: "/src/services/persistence/conversations.ts" },
              { kind: "file", path: "/src/services/persistence/side-characters.ts" },
              { kind: "file", path: "/src/services/persistence/content-themes.ts" },
              { kind: "file", path: "/src/services/persistence/media-settings.ts" },
            ],
          },
          { kind: "file", path: "/src/services/usage-tracking.ts" },
        ],
      },
      {
        kind: "file",
        path: "/src/types.ts",
      },
      {
        kind: "folder",
        path: "/src/hooks",
        children: [{ kind: "file", path: "/src/hooks/use-auth.ts" }],
      },
      {
        kind: "folder",
        path: "/src/contexts",
        children: [
          { kind: "file", path: "/src/contexts/ModelSettingsContext.tsx" },
          { kind: "file", path: "/src/contexts/ArtStylesContext.tsx" },
        ],
      },
      {
        kind: "folder",
        path: "/src/components",
        children: [
          {
            kind: "folder",
            path: "/src/components/admin",
            children: [
              {
                kind: "folder",
                path: "/src/components/admin/guide",
                children: [{ kind: "file", path: "/src/components/admin/guide/AppGuideTool.tsx" }],
              },
              {
                kind: "folder",
                path: "/src/components/admin/finance",
                children: [{ kind: "file", path: "/src/components/admin/finance/FinanceDashboardTool.tsx" }],
              },
            ],
          },
          {
            kind: "folder",
            path: "/src/components/chronicle",
            children: [
              { kind: "file", path: "/src/components/chronicle/ChatInterfaceTab.tsx" },
              { kind: "file", path: "/src/components/chronicle/CharacterCreationModal.tsx" },
              { kind: "file", path: "/src/components/chronicle/MemoriesModal.tsx" },
            ],
          },
        ],
      },
      {
        kind: "folder",
        path: "/src/data",
        children: [
          { kind: "file", path: "/src/data/database-schema-inventory.ts" },
          { kind: "file", path: "/src/data/ui-audit-findings.ts" },
          { kind: "file", path: "/src/data/api-inspector-map-registry.ts" },
        ],
      },
      {
        kind: "folder",
        path: "/src/lib",
        children: [
          { kind: "file", path: "/src/lib/app-architecture-utils.ts" },
          { kind: "file", path: "/src/lib/canonical-field-registry.ts" },
          { kind: "file", path: "/src/lib/api-inspector-schema.ts" },
        ],
      },
      {
        kind: "folder",
        path: "/src/integrations",
        children: [
          {
            kind: "folder",
            path: "/src/integrations/supabase",
            children: [
              { kind: "file", path: "/src/integrations/supabase/client.ts" },
              { kind: "file", path: "/src/integrations/supabase/types.ts" },
            ],
          },
        ],
      },
    ],
  },
  {
    title: "docs",
    path: "/docs",
    children: [
      {
        kind: "folder",
        path: "/docs/guides",
        children: [
          { kind: "file", path: "/docs/guides/app-overview-global-systems.md" },
          { kind: "file", path: "/docs/guides/chat-interface-page-structure-guide.md" },
          { kind: "file", path: "/docs/guides/scenario-builder-page-structure-guide.md" },
          { kind: "file", path: "/docs/guides/character-builder-page-structure-guide.md" },
          { kind: "file", path: "/docs/guides/edge-functions-ai-services-structure-guide.md" },
          { kind: "file", path: "/docs/guides/quality-hub-scan-playbook.md" },
          { kind: "file", path: "/docs/guides/story-character-builder-refactor-blueprint.md" },
        ],
      },
    ],
  },
  {
    title: "scripts",
    path: "/scripts",
    children: [
      { kind: "file", path: "/scripts/refresh-architecture-paths.mjs" },
      { kind: "file", path: "/scripts/run-quality-hub-scan.mjs" },
      { kind: "file", path: "/scripts/verify-prompt-serialization.ts" },
    ],
  },
  {
    title: "e2e",
    path: "/e2e",
    children: [{ kind: "file", path: "/e2e/smoke.spec.ts" }],
  },
  {
    title: "supabase",
    path: "/supabase",
    children: [
      { kind: "file", path: "/supabase/config.toml" },
      {
        kind: "folder",
        path: "/supabase/functions",
        children: [
          {
            kind: "folder",
            path: "/supabase/functions/chat",
            children: [{ kind: "file", path: "/supabase/functions/chat/index.ts" }],
          },
          {
            kind: "folder",
            path: "/supabase/functions/track-ai-usage",
            children: [{ kind: "file", path: "/supabase/functions/track-ai-usage/index.ts" }],
          },
          {
            kind: "folder",
            path: "/supabase/functions/api-usage-test-session",
            children: [{ kind: "file", path: "/supabase/functions/api-usage-test-session/index.ts" }],
          },
          {
            kind: "folder",
            path: "/supabase/functions/xai-billing-balance",
            children: [{ kind: "file", path: "/supabase/functions/xai-billing-balance/index.ts" }],
          },
        ],
      },
      {
        kind: "folder",
        path: "/supabase/migrations",
        children: [
          { kind: "file", path: "/supabase/migrations/20260331153000_security_rls_hardening.sql" },
          { kind: "file", path: "/supabase/migrations/20260329112000_finance_live_wiring_tables.sql" },
          { kind: "file", path: "/supabase/migrations/20260404133000_add_side_character_custom_sections.sql" },
          { kind: "file", path: "/supabase/migrations/20260417041136_297c107c-c7f2-49be-9458-9f4502ee75a7.sql" },
        ],
      },
    ],
  },
];

const PAID_AI_EDGE_FUNCTIONS = new Set([
  "chat",
  "extract-character-updates",
  "extract-memory-events",
  "compress-day-memories",
  "evaluate-goal-progress",
  "generate-cover-image",
  "generate-scene-image",
  "generate-side-character",
  "generate-side-character-avatar",
]);

const FOLDER_ICON_DATA_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M3.5 7.5c0-1.1.9-2 2-2h4.2l1.6 1.7h7.2c1.1 0 2 .9 2 2v6.8c0 1.1-.9 2-2 2H5.5c-1.1 0-2-.9-2-2V7.5Z' fill='%239bd0ff'/%3E%3Cpath d='M3.5 8.6c0-.9.7-1.6 1.6-1.6h5.3c.4 0 .8.2 1.1.5l.9.9h6.4c.9 0 1.6.7 1.6 1.6v5.9c0 .9-.7 1.6-1.6 1.6H5.1c-.9 0-1.6-.7-1.6-1.6V8.6Z' fill='url(%23g)' stroke='rgba(255,255,255,0.32)' stroke-width='.6'/%3E%3Cdefs%3E%3ClinearGradient id='g' x1='12' y1='7' x2='12' y2='17.5' gradientUnits='userSpaceOnUse'%3E%3Cstop stop-color='%237da4d3'/%3E%3Cstop offset='1' stop-color='%235f85b3'/%3E%3C/linearGradient%3E%3C/defs%3E%3C/svg%3E";

type SchemaTable = (typeof databaseSchemaInventory.tables)[keyof typeof databaseSchemaInventory.tables];
type SchemaFunction = (typeof databaseSchemaInventory.database_functions)[number];
type SchemaBucket = (typeof databaseSchemaInventory.storage_buckets)[number];
type SchemaEdgeFunction = (typeof databaseSchemaInventory.edge_functions)[number];

const ROOT_CHILD_ORDER: readonly string[] = [
  "README.md",
  "package.json",
  "vite.config.ts",
  "playwright.config.ts",
  "eslint.config.js",
  "tsconfig.json",
  "components.json",
  "src",
  "docs",
  "scripts",
  "e2e",
  "supabase",
];

const STATIC_LINE_COUNT_OVERRIDES: Record<string, number> = {
  "/README.md": 73,
  "/package.json": 111,
  "/vite.config.ts": 35,
  "/playwright.config.ts": 11,
  "/eslint.config.js": 39,
  "/tsconfig.json": 24,
  "/components.json": 20,
  "/scripts/refresh-architecture-paths.mjs": 276,
  "/scripts/run-quality-hub-scan.mjs": 48,
  "/scripts/verify-prompt-serialization.ts": 290,
  "/e2e/smoke.spec.ts": 11,
};

const STATIC_FILE_OVERRIDES: Record<string, StaticFileOverride> = {
  "/README.md": {
    description: "Top-level operator-facing project overview, setup notes, and repository orientation document.",
    rows: [
      {
        id: "readme-project-orientation",
        title: "Project Orientation",
        summary: "Gives the repo-level starting context for what Chronicle is, how to run it locally, and where major workspace commands begin.",
        badgeLabel: "DOCUMENTATION",
        badgeClass: "documentation",
        details: [
          { label: "Defines", values: ["project overview", "local setup flow", "baseline development commands"], kind: "plain" },
          { label: "Used By", values: ["new contributors", "local onboarding", "high-level repo orientation"], kind: "plain" },
          { label: "Requires", values: ["stays aligned with actual package scripts and current local workflow"], kind: "plain" },
        ],
      },
    ],
  },
  "/package.json": {
    description: "Project manifest and command hub for Chronicle's frontend, test, and architecture-maintenance workflows.",
    rows: [
      {
        id: "package-json-workspace-command-surface",
        title: "Workspace Command Surface",
        summary: "Defines the main dev, build, test, preview, architecture refresh, and quality scan commands that other tools and teammates rely on.",
        badgeLabel: "TOOLING",
        badgeClass: "tooling",
        details: [
          { label: "Defines", values: ["dev", "build", "typecheck", "test", "test:e2e", "architecture:refresh", "quality:scan"], kind: "plain" },
          { label: "Calls", values: ["refresh-architecture-paths.mjs", "Playwright", "Vitest", "Vite build pipeline"], kind: "plain" },
          { label: "Used By", values: ["local development", "CI checks", "architecture refresh tasks", "future refactor automation"], kind: "plain" },
          { label: "Requires", values: ["script names stay stable so docs, agents, and teammates can trigger the right workflows"], kind: "plain" },
        ],
      },
    ],
  },
  "/vite.config.ts": {
    description: "Vite build config for the dev server, path aliases, and manual chunk splitting.",
    rows: [
      {
        id: "vite-config-build-pipeline-settings",
        title: "Build Pipeline Settings",
        summary: "Controls the local dev server, the @ alias, and vendor chunking for Supabase and chart libraries.",
        badgeLabel: "TOOLING",
        badgeClass: "tooling",
        details: [
          { label: "Defines", values: ["host ::", "port 8080", "@ => ./src", "manual chunks like vendor-supabase and vendor-charts"], kind: "plain" },
          { label: "Uses", values: ["React SWC plugin", "Lovable component tagger in development mode"], kind: "plain" },
          { label: "Used By", values: ["package.json dev/build/preview commands", "local deploy previews"], kind: "plain" },
          { label: "Requires", values: ["alias and chunk names stay aligned with imports and bundle expectations across the app"], kind: "plain" },
        ],
      },
    ],
  },
  "/playwright.config.ts": {
    description: "Playwright entry config that delegates Chronicle's browser smoke tests through Lovable's shared Playwright wrapper.",
    rows: [
      {
        id: "playwright-config-e2e-harness",
        title: "E2E Harness Settings",
        summary: "Pins the Chronicle end-to-end test runner to Lovable's shared Playwright config factory so smoke checks inherit the expected preview/browser defaults.",
        badgeLabel: "TOOLING",
        badgeClass: "tooling",
        details: [
          { label: "Defines", values: ["Playwright config bootstrap", "Lovable preview/browser defaults", "e2e folder as the default test home"], kind: "plain" },
          { label: "Used By", values: ["npm run test:e2e", "/e2e/smoke.spec.ts"], kind: "plain" },
          { label: "Requires", values: ["the shared Lovable Playwright package stays installed and the e2e suite remains compatible with its wrapper contract"], kind: "plain" },
        ],
      },
    ],
  },
  "/eslint.config.js": {
    description: "Workspace lint policy file that sets the baseline TypeScript and React hygiene rules used in ship-check and quality scans.",
    rows: [
      {
        id: "eslint-config-lint-policy",
        title: "Lint Policy Settings",
        summary: "Defines which files are linted, which config files are ignored, and which React/TypeScript rule severities Chronicle uses during local and pre-push validation.",
        badgeLabel: "TOOLING",
        badgeClass: "tooling",
        details: [
          { label: "Defines", values: ["TypeScript ESLint baseline", "React hooks and refresh rules", "explicit ignore list for config files"], kind: "plain" },
          { label: "Used By", values: ["npm run lint", "npm run ship-check", "quality scan validation gates"], kind: "plain" },
          { label: "Requires", values: ["rule intent stays aligned with the repo's actual tolerance for warnings vs blocking issues"], kind: "plain" },
        ],
      },
    ],
  },
  "/tsconfig.json": {
    description: "TypeScript workspace root config that controls cross-project references and baseline compiler strictness.",
    rows: [
      {
        id: "tsconfig-workspace-compiler-contract",
        title: "Workspace Compiler Contract",
        summary: "Defines the shared TypeScript aliasing and strictness defaults that the app and node-side config projects inherit.",
        badgeLabel: "TOOLING",
        badgeClass: "tooling",
        details: [
          { label: "Defines", values: ["@/* path alias", "noImplicitAny enabled", "strictNullChecks enabled", "app/node project references"], kind: "plain" },
          { label: "Used By", values: ["npm run typecheck", "editor IntelliSense", "Vite/TS module resolution"], kind: "plain" },
          { label: "Requires", values: ["aliases stay synchronized with Vite and generated code paths"], kind: "plain" },
        ],
      },
    ],
  },
  "/components.json": {
    description: "shadcn/Radix generation config that still defines alias and Tailwind defaults for the repo's shared UI primitive layer.",
    rows: [
      {
        id: "components-json-component-registry-settings",
        title: "Component Registry Settings",
        summary: "Pins the registry preset, Tailwind entry points, and alias paths that still back Chronicle's shared `src/components/ui` primitive layer.",
        badgeLabel: "TOOLING",
        badgeClass: "tooling",
        details: [
          { label: "Defines", values: ["tsx: true", "Tailwind CSS path src/index.css", "base color slate", "aliases for components, ui, lib, and hooks"], kind: "plain" },
          { label: "Used By", values: ["shared Radix/shadcn-style UI primitives in src/components/ui", "component generation flows", "future registry maintenance inside the repo"], kind: "plain" },
          { label: "Requires", values: ["alias paths stay synchronized with TypeScript and Vite resolution so generated code lands in the right places"], kind: "plain" },
        ],
      },
    ],
  },
  "/scripts/run-quality-hub-scan.mjs": {
    description: "Quality Hub sweep script that runs the core repo validation gates in sequence and stops at the first failure.",
    rows: [
      {
        id: "quality-scan-validation-runner",
        title: "Validation Gate Runner",
        summary: "Executes the repeatable baseline scan stack for Quality Hub so lint, typecheck, tests, build, and dependency audit can be run as one ordered sweep.",
        badgeLabel: "SCRIPT",
        badgeClass: "script",
        details: [
          { label: "Defines", values: ["lint", "Type Check", "Unit Tests", "Build", "Dependency Audit"], kind: "plain" },
          { label: "Calls", values: ["npm run lint", "npx tsc --noEmit", "npm run test", "npm run build", "npm audit --omit=dev"], kind: "plain" },
          { label: "Used By", values: ["npm run quality:scan", "Quality Hub stability sweeps", "pre-push validation passes"], kind: "plain" },
          { label: "Requires", values: ["each downstream command stays green and the stop-on-first-failure behavior remains intentional"], kind: "plain" },
        ],
      },
    ],
  },
  "/scripts/verify-prompt-serialization.ts": {
    description: "Prompt-contract verification script that constructs realistic story and character fixtures and asserts the assembled AI instruction blocks still include required authored data.",
    rows: [
      {
        id: "verify-prompt-serialization-contract",
        title: "Prompt Serialization Verification",
        summary: "Builds sample scenario, main-character, user-character, and side-character data and checks that Chronicle's prompt assembler still serializes the required sections into the final instruction output.",
        badgeLabel: "SCRIPT",
        badgeClass: "script",
        details: [
          { label: "Uses", values: ["/src/utils.ts", "/src/types.ts", "/src/services/llm.ts"], kind: "files" },
          { label: "Defines", values: ["fixture scenario data", "fixture main/user/side characters", "prompt content assertions"], kind: "plain" },
          { label: "Used By", values: ["manual prompt regression checks", "future serialization automation", "AI contract debugging"], kind: "plain" },
          { label: "Requires", values: ["fixture shapes stay aligned with current app types and prompt assembly rules"], kind: "plain" },
        ],
      },
    ],
  },
  "/src/pages/Index.tsx": {
    description: "Main Chronicle workspace shell that owns tab routing, auth-aware app bootstrap, scenario state, and lazy loading for the primary app surfaces.",
    rows: [
      {
        id: "index-workspace-shell",
        title: "Workspace Shell",
        summary: "Acts as the central runtime shell for Chronicle's primary logged-in experience and orchestrates which major tabs, builders, chat flows, and admin surfaces are loaded.",
        badgeLabel: "REACT COMPONENT",
        badgeClass: "component",
        details: [
          { label: "Renders / Opens", values: ["/src/components/chronicle/GalleryHub.tsx", "/src/components/chronicle/StoryHub.tsx", "/src/components/chronicle/ChatInterfaceTab.tsx", "/src/features/story-builder/StoryBuilderScreen.tsx", "/src/features/character-builder/CharacterBuilderScreen.tsx", "/src/pages/Admin.tsx"], kind: "files" },
          { label: "Uses", values: ["/src/services/supabase-data.ts", "/src/services/api-usage-test-session.ts", "/src/hooks/use-auth.ts", "/src/features/navigation/builder-tabs.ts"], kind: "files" },
          { label: "Access", values: ["client-rendered primary app shell after auth/bootstrap", "owns tab selection and active scenario state"], kind: "plain" },
          { label: "Requires", values: ["lazy-loaded tab contracts stay stable", "scenario state, auth state, and navigation state remain synchronized"], kind: "plain" },
        ],
      },
    ],
  },
  "/src/types.ts": {
    description: "Shared Chronicle runtime contract file defining scenario, character, conversation, message, snapshot, and derivation shapes used across UI, persistence, and backend boundaries.",
    rows: [
      {
        id: "types-continuity-contract",
        title: "Continuity Contract Types",
        summary: "Defines the canonical app-level types for generation-aware messages, main/side-character snapshots, goal derivations, and scenario payloads so the UI, persistence layer, and backend pipeline all speak the same language.",
        badgeLabel: "CODE LOGIC",
        badgeClass: "code-logic",
        details: [
          {
            label: "Defines",
            values: [
              "Message.generationId",
              "CharacterStateMessageSnapshot",
              "SideCharacterMessageSnapshot",
              "StoryGoalStepDerivation",
              "ScenarioData",
            ],
            kind: "plain",
          },
          {
            label: "Used By",
            values: [
              "/src/components/chronicle/ChatInterfaceTab.tsx",
              "/src/services/llm.ts",
              "/src/services/persistence/conversations.ts",
              "/src/services/persistence/side-characters.ts",
            ],
            kind: "files",
          },
          {
            label: "Requires",
            values: ["type definitions stay synchronized with Supabase schema changes and the live chat continuity pipeline"],
            kind: "plain",
          },
        ],
      },
    ],
  },
  "/src/services/supabase-data.ts": {
    description: "Thin compatibility barrel that preserves Chronicle's older persistence import surface while delegating the real work to focused domain modules under `src/services/persistence/`.",
    rows: [
      {
        id: "supabase-data-compatibility-barrel",
        title: "Persistence Compatibility Barrel",
        summary: "Keeps the rest of the app stable while the persistence layer is split into smaller ownership modules, so imports do not have to be rewritten all at once.",
        badgeLabel: "CODE LOGIC",
        badgeClass: "code-logic",
        details: [
          {
            label: "Uses",
            values: [
              "/src/services/persistence/shared.ts",
              "/src/services/persistence/characters.ts",
              "/src/services/persistence/scenarios.ts",
              "/src/services/persistence/conversations.ts",
              "/src/services/persistence/side-characters.ts",
              "/src/services/persistence/content-themes.ts",
              "/src/services/persistence/media-settings.ts",
            ],
            kind: "files",
          },
          {
            label: "Used By",
            values: [
              "/src/pages/Index.tsx",
              "/src/features/story-builder/StoryBuilderScreen.tsx",
              "/src/features/character-builder/CharacterBuilderScreen.tsx",
              "/src/components/chronicle/ChatInterfaceTab.tsx",
            ],
            kind: "files",
          },
          {
            label: "Access",
            values: ["client-side persistence facade for Chronicle's main workspace flows"],
            kind: "plain",
          },
          {
            label: "Requires",
            values: ["export names stay backward compatible until direct imports are migrated to the domain modules"],
            kind: "plain",
          },
        ],
      },
    ],
  },
  "/src/services/persistence/shared.ts": {
    description: "Shared persistence helper layer for common converters, extra-row normalization, timestamp utilities, and storage upload helpers reused by the domain modules.",
    rows: [
      {
        id: "persistence-shared-helpers",
        title: "Shared Persistence Helpers",
        summary: "Provides the low-level conversion and storage helpers the split persistence modules reuse so field normalization and upload handling stay consistent across the app.",
        badgeLabel: "CODE LOGIC",
        badgeClass: "code-logic",
        details: [
          {
            label: "Used By",
            values: [
              "/src/services/persistence/characters.ts",
              "/src/services/persistence/scenarios.ts",
              "/src/services/persistence/side-characters.ts",
              "/src/services/persistence/media-settings.ts",
            ],
            kind: "files",
          },
          {
            label: "Defines",
            values: ["shared converters", "extra-row normalization", "timestamp helpers", "storage upload helpers"],
            kind: "plain",
          },
          {
            label: "Requires",
            values: ["shared conversion rules stay aligned with the character and scenario type contracts"],
            kind: "plain",
          },
        ],
      },
    ],
  },
  "/src/services/persistence/scenarios.ts": {
    description: "Scenario/world persistence module for story records, world-core loading, codex entries, scenes, and scenario bootstrap assembly.",
    rows: [
      {
        id: "persistence-scenarios-module",
        title: "Scenario Persistence",
        summary: "Owns scenario-level CRUD and load-for-play/bootstrap behavior, including world-core backfill checks and the main story payload returned to the builders and chat runtime.",
        badgeLabel: "CODE LOGIC",
        badgeClass: "code-logic",
        details: [
          {
            label: "Uses Tables",
            values: ["stories", "characters", "codex_entries", "scenes", "conversations"],
            kind: "tables",
          },
          {
            label: "Used By",
            values: [
              "/src/services/supabase-data.ts",
              "/src/pages/Index.tsx",
              "/src/features/story-builder/StoryBuilderScreen.tsx",
            ],
            kind: "files",
          },
          {
            label: "Mutates",
            values: ["scenario metadata", "world core", "codex entries", "scene records", "scenario bootstrap payloads"],
            kind: "plain",
          },
          {
            label: "Requires",
            values: ["world-core migration and canonical field rules stay aligned with current Story Builder terminology"],
            kind: "plain",
          },
        ],
      },
    ],
  },
  "/src/services/persistence/conversations.ts": {
    description: "Conversation and continuity persistence module for messages, session state, memories, and generation-scoped derivation ledgers.",
    rows: [
      {
        id: "persistence-conversations-module",
        title: "Conversation Persistence",
        summary: "Owns conversation/message loading and save flows, along with the durable memory and session-state records that Chronicle's live chat depends on.",
        badgeLabel: "CODE LOGIC",
        badgeClass: "code-logic",
        details: [
          {
            label: "Uses Tables",
            values: ["conversations", "messages", "character_session_states", "memories"],
            kind: "tables",
          },
          {
            label: "Used By",
            values: ["/src/services/supabase-data.ts", "/src/components/chronicle/ChatInterfaceTab.tsx"],
            kind: "files",
          },
          {
            label: "Mutates",
            values: ["conversation history", "message rows", "manual session overrides", "memory visibility"],
            kind: "plain",
          },
          {
            label: "Requires",
            values: ["message ordering and canonical conversation hydration stay stable before chat runtime state is derived"],
            kind: "plain",
          },
        ],
      },
      {
        id: "persistence-generation-ledger",
        title: "Generation Ledger Persistence",
        summary: "Stores and resolves the message-scoped snapshot and derivation records that make refresh/regenerate safe instead of letting stale branches overwrite canon.",
        badgeLabel: "DATA BLOCK",
        badgeClass: "data-block",
        details: [
          {
            label: "Uses Tables",
            values: ["character_state_message_snapshots", "story_goal_step_derivations", "messages", "memories"],
            kind: "tables",
          },
          {
            label: "Used By",
            values: ["/src/components/chronicle/ChatInterfaceTab.tsx", "/src/types.ts"],
            kind: "files",
          },
          {
            label: "Requires",
            values: ["active message generation filters stay aligned with ChatInterfaceTab's effective-state resolver"],
            kind: "plain",
          },
        ],
      },
    ],
  },
  "/src/services/persistence/side-characters.ts": {
    description: "Side-character persistence module for roster CRUD plus generation-scoped canonical snapshot storage.",
    rows: [
      {
        id: "persistence-side-character-roster",
        title: "Side Character Persistence",
        summary: "Handles durable side-character roster reads and writes, including custom sections and other builder-authored fields that the live chat should inherit.",
        badgeLabel: "CODE LOGIC",
        badgeClass: "code-logic",
        details: [
          {
            label: "Uses Tables",
            values: ["side_characters"],
            kind: "tables",
          },
          {
            label: "Used By",
            values: ["/src/services/supabase-data.ts", "/src/components/chronicle/ChatInterfaceTab.tsx"],
            kind: "files",
          },
          {
            label: "Mutates",
            values: ["side-character roster rows", "custom sections", "chat-visible side-character source state"],
            kind: "plain",
          },
          {
            label: "Requires",
            values: ["side-character field contracts stay aligned with Character Builder and side-character edit surfaces"],
            kind: "plain",
          },
        ],
      },
      {
        id: "persistence-side-character-snapshots",
        title: "Side Character Snapshot Ledger",
        summary: "Stores AI-derived side-character canon per message generation so refresh/regenerate no longer mutates the wrong timeline branch.",
        badgeLabel: "DATA BLOCK",
        badgeClass: "data-block",
        details: [
          {
            label: "Uses Tables",
            values: ["side_character_message_snapshots"],
            kind: "tables",
          },
          {
            label: "Used By",
            values: ["/src/components/chronicle/ChatInterfaceTab.tsx", "/src/types.ts"],
            kind: "files",
          },
          {
            label: "Requires",
            values: ["snapshot writes and active generation resolution stay synchronized with the message ledger contract"],
            kind: "plain",
          },
        ],
      },
    ],
  },
  "/src/components/chronicle/ChatInterfaceTab.tsx": {
    description: "Primary Chronicle chat workspace that renders the live conversation while resolving effective canonical state, orchestrating generation side effects, and launching adjacent chat tools.",
    rows: [
      {
        id: "chat-interface-live-workspace",
        title: "Live Chat Workspace",
        summary: "Owns the visible Chronicle conversation surface, message flow controls, regenerate/edit actions, and the surrounding chat-adjacent tools.",
        badgeLabel: "REACT COMPONENT",
        badgeClass: "component",
        details: [
          {
            label: "Used By",
            values: ["/src/pages/Index.tsx"],
            kind: "files",
          },
          {
            label: "Uses",
            values: [
              "/src/services/llm.ts",
              "/src/services/persistence/conversations.ts",
              "/src/services/persistence/side-characters.ts",
            ],
            kind: "files",
          },
          {
            label: "Access",
            values: ["client-rendered Chronicle roleplay workspace for the active scenario and conversation"],
            kind: "plain",
          },
          {
            label: "Requires",
            values: ["conversation state, scenario state, and speaker rendering rules remain synchronized across send, regenerate, continue, and edit flows"],
            kind: "plain",
          },
        ],
      },
      {
        id: "chat-interface-effective-canon",
        title: "Effective Canonical State Resolver",
        summary: "Builds the active main-character, side-character, memory, and goal state from the current message generation before anything is rendered or sent back to the AI.",
        badgeLabel: "CODE LOGIC",
        badgeClass: "code-logic",
        details: [
          {
            label: "Uses",
            values: [
              "/src/types.ts",
              "/src/services/persistence/conversations.ts",
              "/src/services/persistence/side-characters.ts",
            ],
            kind: "files",
          },
          {
            label: "Mutates",
            values: ["effective main-character state", "effective side-character state", "active memory view", "effective story-goal progress"],
            kind: "plain",
          },
          {
            label: "Requires",
            values: ["generation IDs, snapshot tables, and message ordering all resolve to the same active canon branch"],
            kind: "plain",
          },
        ],
      },
      {
        id: "chat-interface-roleplay-runtime-path",
        title: "Roleplay Runtime Path",
        summary: "Packages the effective chat runtime into the Chronicle LLM request path and then applies the returned generation's post-response derivations back into the continuity ledger.",
        badgeLabel: "API CALL",
        badgeClass: "api-call",
        details: [
          {
            label: "Calls",
            values: ["/src/services/llm.ts", "/supabase/functions/chat/index.ts"],
            kind: "files",
          },
          {
            label: "Mutates",
            values: ["message generation IDs", "snapshot writes", "memory/goal derivations tied to the returned response"],
            kind: "plain",
          },
          {
            label: "Requires",
            values: ["the frontend request contract and backend `roleplay_v2` pipeline stay in sync"],
            kind: "plain",
          },
        ],
      },
    ],
  },
  "/src/services/llm.ts": {
    description: "Chronicle's main prompt-assembly and AI transport layer for paid roleplay chat, prompt serialization, and response-stream handling.",
    rows: [
      {
        id: "llm-chat-request-assembly",
        title: "Chronicle Chat Request Assembly",
        summary: "Builds the live system instruction, runtime directives, recent transcript slice, and final user wrapper before the paid Chronicle chat request is fired.",
        badgeLabel: "API CALL",
        badgeClass: "api-call",
        details: [
          {
            label: "Used By",
            values: ["/src/components/chronicle/ChatInterfaceTab.tsx", "/scripts/verify-prompt-serialization.ts"],
            kind: "files",
          },
          {
            label: "Calls",
            values: ["/supabase/functions/chat/index.ts"],
            kind: "files",
          },
          {
            label: "Requires",
            values: ["prompt serialization stays aligned with current scenario, character, and side-character runtime contracts"],
            kind: "plain",
          },
        ],
      },
      {
        id: "llm-roleplay-v2-context",
        title: "roleplay_v2 Runtime Context Injection",
        summary: "Attaches the current conversation, temporal state, active scene, and AI/user speaker lists so the backend planner/writer/validator pipeline can reason against the right live canon.",
        badgeLabel: "CONTEXT INJECTION",
        badgeClass: "context-injection",
        details: [
          {
            label: "Uses",
            values: ["/src/types.ts", "/src/components/chronicle/ChatInterfaceTab.tsx"],
            kind: "files",
          },
          {
            label: "Calls",
            values: ["/supabase/functions/chat/index.ts"],
            kind: "files",
          },
          {
            label: "Requires",
            values: ["effective character resolution and active scene metadata are correct before the request is sent"],
            kind: "plain",
          },
        ],
      },
    ],
  },
  "/supabase/functions/chat/index.ts": {
    description: "Server-side Chronicle chat edge function that receives the assembled request and routes it through the paid chat runtime, including the newer multi-pass roleplay pipeline.",
    rows: [
      {
        id: "chat-edge-entry",
        title: "Chronicle Chat Entry Point",
        summary: "Acts as the backend entry point for Chronicle's live roleplay requests, authenticating the caller, applying rate limits, and choosing which chat pipeline executes.",
        badgeLabel: "EDGE FUNCTION",
        badgeClass: "edge-fn",
        details: [
          {
            label: "Used By",
            values: ["/src/services/llm.ts"],
            kind: "files",
          },
          {
            label: "Access",
            values: ["server-side paid AI orchestration behind Supabase auth and rate-limit guards"],
            kind: "plain",
          },
          {
            label: "Requires",
            values: ["valid auth/session headers, working xAI credentials, and stable request-body contracts from the frontend"],
            kind: "plain",
          },
        ],
      },
      {
        id: "chat-edge-roleplay-v2",
        title: "roleplay_v2 Planner / Writer / Validator Pipeline",
        summary: "Runs Chronicle chat through a continuity planner, constrained writer, and validator/reviser so the final response is grounded in the latest canon instead of a single-pass raw draft.",
        badgeLabel: "API CALL",
        badgeClass: "api-call",
        details: [
          {
            label: "Defines",
            values: ["recent-history window", "supporting-history selection", "planner pass", "writer pass", "validator/reviser pass"],
            kind: "plain",
          },
          {
            label: "Used By",
            values: ["/src/services/llm.ts", "/src/components/chronicle/ChatInterfaceTab.tsx"],
            kind: "files",
          },
          {
            label: "Requires",
            values: ["the latest user turn remains highest priority and supporting history never overrides the current canon branch"],
            kind: "plain",
          },
        ],
      },
    ],
  },
  "/supabase/migrations/20260417041136_297c107c-c7f2-49be-9458-9f4502ee75a7.sql": {
    description: "Continuity migration that introduced Chronicle's generation ledger schema for rollback-safe chat canon, message-scoped snapshots, and goal derivations.",
    rows: [
      {
        id: "message-generation-ledger-schema",
        title: "Message Generation Ledger Schema",
        summary: "Adds the backend schema that lets chat refresh/regenerate branch safely instead of overwriting canon in place, including message generation IDs and per-message snapshot/derivation tables.",
        badgeLabel: "DB MIGRATION",
        badgeClass: "db-migration",
        details: [
          {
            label: "Defines",
            values: [
              "messages.generation_id",
              "memories.source_generation_id",
              "character_state_message_snapshots",
              "side_character_message_snapshots",
              "story_goal_step_derivations",
            ],
            kind: "plain",
          },
          {
            label: "Used By",
            values: [
              "/src/services/persistence/conversations.ts",
              "/src/services/persistence/side-characters.ts",
              "/src/components/chronicle/ChatInterfaceTab.tsx",
              "/src/types.ts",
            ],
            kind: "files",
          },
          {
            label: "Requires",
            values: ["typed Supabase metadata and runtime active-generation filtering stay aligned with this schema contract"],
            kind: "plain",
          },
        ],
      },
    ],
  },
  "/src/data/ui-audit-findings.ts": {
    description: "Quality Hub source-of-truth registry containing issue entries, scan-run records, overview row metadata, and implementation change-log history.",
    rows: [
      {
        id: "ui-audit-findings-registry",
        title: "Quality Hub Registry",
        summary: "Stores the structured findings, scan packs, app-unit review rows, and change-log entries that the Quality Hub renders as its operator-facing history and scan catalog.",
        badgeLabel: "DATA BLOCK",
        badgeClass: "data-block",
        details: [
          { label: "Uses", values: ["/src/lib/ui-audit-schema.ts"], kind: "files" },
          { label: "Used By", values: ["/src/pages/style-guide/ui-audit.tsx"], kind: "files" },
          { label: "Mutates", values: ["Issue Registry contents", "Scan Runs history", "Change Log history", "Overview scan metadata"], kind: "plain" },
          { label: "Requires", values: ["schema keys remain aligned with ui-audit.tsx rendering expectations and Quality Hub typing"], kind: "plain" },
        ],
      },
    ],
  },
  "/src/lib/app-architecture-utils.ts": {
    description: "Core registry builder and inference helper for the App Architecture page's generated tree, file-kind tagging, and node descriptions.",
    rows: [
      {
        id: "app-architecture-utils-registry-builder",
        title: "Architecture Registry Builder",
        summary: "Turns the generated repo path inventory into the normalized tree structure the App Architecture page renders, while inferring file kinds, tags, descriptions, and prompt-friendly summaries.",
        badgeLabel: "CODE LOGIC",
        badgeClass: "code-logic",
        details: [
          { label: "Used By", values: ["/src/pages/style-guide/app-architecture.tsx"], kind: "files" },
          { label: "Defines", values: ["node typing", "file-kind inference", "folder/file descriptions", "registry assembly", "descendant counting"], kind: "plain" },
          { label: "Requires", values: ["path normalization and file-kind inference rules stay aligned with the repo's actual ownership patterns"], kind: "plain" },
        ],
      },
    ],
  },
};

const DETAIL_HELPERS: Record<string, string> = {
  Uses: "Shows other code files this file directly imports and depends on.",
  Calls: "Shows backend functions or services this file triggers directly.",
  "Renders / Opens": "Shows the visible UI blocks, modal flows, or screens this file directly renders or opens.",
  "Uses Table": "Shows backend tables this file directly reads from or writes to.",
  "Uses Tables": "Shows backend tables this file directly reads from or writes to.",
  "Uses RPC": "Shows database functions this file calls through Supabase RPC.",
  "Uses RPCs": "Shows database functions this file calls through Supabase RPC.",
  "Uses Storage": "Shows storage buckets this file reads from or writes to.",
  "Used By": "Shows other files that import and depend on this file.",
  Access: "Shows the access boundary this row operates inside.",
  Mutates: "Shows the durable data or state this row can change.",
  Requires: "Shows the conditions that must be true before this row can work safely.",
  "Tracks Usage In": "Shows the analytics or billing table that records the paid event path.",
  "Code Reference": "Shows backend names the code is currently expecting to exist.",
  "Verified Tables": "Shows matching real backend tables from the latest schema export.",
  Columns: "Shows how many fields exist on the live database table.",
  RLS: "Row Level Security policies controlling who can access rows in this table.",
};

const architectureStyles = `
.app-architecture-page {
  --bg: #121214;
  --text: #e0e0e0;
  --line: #555555;
  --indent: 28px;
  --danger-red: #ef4444;
  --live-header-height: 76px;
  --nav-rail-width: 296px;
  --header-pad-x: 24px;
  --content-pad: 24px;
  min-height: 100%;
  height: 100%;
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.app-architecture-page * {
  box-sizing: border-box;
}

.app-architecture-page .page-header {
  position: sticky;
  top: 0;
  z-index: 30;
  background: rgba(255,255,255,0.96);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e0e0e0;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}

.app-architecture-page .page-title {
  font-size: 17px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #111111;
}

.app-architecture-page .header-spacer {
  flex: 1 1 auto;
}

.app-architecture-page .legend-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 16px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.08);
  background: #2b2b2e;
  color: #f7fbff;
  font-size: 12px;
  font-weight: 700;
  box-shadow:
    0 10px 24px rgba(0,0,0,0.16),
    inset 0 1px 0 rgba(255,255,255,0.04);
}

.app-architecture-page .page-shell {
  display: flex;
  align-items: stretch;
  min-height: calc(100vh - var(--live-header-height));
}

.app-architecture-page .nav-rail-shell {
  flex: 0 0 var(--nav-rail-width);
  width: var(--nav-rail-width);
  height: calc(100vh - var(--live-header-height));
  min-height: calc(100vh - var(--live-header-height));
  max-height: calc(100vh - var(--live-header-height));
  position: sticky;
  top: var(--live-header-height);
  align-self: flex-start;
  background: #2a2a2f;
  border-right: 1px solid rgba(255,255,255,0.08);
  box-shadow:
    0 18px 42px -24px rgba(0,0,0,0.68),
    inset 1px 0 0 rgba(255,255,255,0.04),
    inset -1px 0 0 rgba(0,0,0,0.26);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 9;
}

.app-architecture-page .nav-rail-body {
  flex: 1;
  height: 100%;
  min-height: 0;
  padding: 16px 14px 20px;
  background: #2e2e33;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  scrollbar-width: none;
}

.app-architecture-page .nav-rail-body::-webkit-scrollbar {
  display: none;
}

.app-architecture-page .nav-root-link {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 44px;
  width: 100%;
  padding: 0 16px;
  margin-bottom: 12px;
  border-radius: 14px;
  background: linear-gradient(180deg, #6f8db5 0%, #4f688a 100%);
  box-shadow:
    0 10px 22px rgba(0,0,0,0.24),
    inset 0 1px 0 rgba(255,255,255,0.12),
    inset 0 -1px 0 rgba(0,0,0,0.22);
  color: #f7fbff;
  text-decoration: none;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: -0.01em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  text-align: left;
}

.app-architecture-page .nav-section-stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.app-architecture-page .nav-section {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.app-architecture-page .nav-section-link,
.app-architecture-page .nav-section-title {
  display: flex;
  align-items: center;
  min-height: 42px;
  padding: 0 14px;
  border-radius: 14px;
  background: #3c3e47;
  border: 1px solid rgba(0,0,0,0.3);
  box-shadow:
    0 8px 20px rgba(0,0,0,0.28),
    inset 0 1px 0 rgba(255,255,255,0.07),
    inset 0 -1px 0 rgba(0,0,0,0.18);
  color: rgba(255,255,255,0.92);
  text-decoration: none;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: -0.01em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.app-architecture-page .nav-tree-group {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0 0 0 4px;
  padding-left: 18px;
}

.app-architecture-page .nav-tree-group::before {
  content: "";
  position: absolute;
  left: 8px;
  top: 8px;
  bottom: 8px;
  width: 1px;
  background: rgba(255,255,255,0.16);
}

.app-architecture-page .nav-tree-group--nested {
  margin-left: 14px;
  padding-top: 2px;
}

.app-architecture-page .nav-tree-group > .nav-tree-item,
.app-architecture-page .nav-tree-group > .nav-branch {
  position: relative;
}

.app-architecture-page .nav-tree-group > .nav-tree-item::before,
.app-architecture-page .nav-tree-group > .nav-branch::before {
  content: "";
  position: absolute;
  left: -10px;
  top: 18px;
  width: 12px;
  height: 1px;
  background: rgba(255,255,255,0.16);
}

.app-architecture-page .nav-tree-group > .nav-tree-item:last-child::after,
.app-architecture-page .nav-tree-group > .nav-branch:last-child::after {
  content: "";
  position: absolute;
  left: -10px;
  top: 18px;
  bottom: -10px;
  width: 1px;
  background: #2d2e36;
}

.app-architecture-page .nav-branch {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.app-architecture-page .nav-branch-link,
.app-architecture-page .nav-tree-item {
  display: flex;
  align-items: stretch;
  gap: 0;
  min-height: 36px;
  color: #d4d4d8;
  text-decoration: none;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.01em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  min-width: 0;
  max-width: 100%;
  overflow: visible;
}

.app-architecture-page .nav-link-body {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  max-width: 100%;
  min-height: 36px;
  min-width: 0;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid transparent;
  color: inherit;
  transition:
    background 140ms ease,
    color 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease;
}

.app-architecture-page .nav-link-label {
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-architecture-page .nav-tree-item.nav-accent-tooling .nav-link-label { color: #d8ccff; }
.app-architecture-page .nav-tree-item.nav-accent-service .nav-link-label { color: #5eead4; }
.app-architecture-page .nav-tree-item.nav-accent-hook .nav-link-label { color: #a5b4fc; }
.app-architecture-page .nav-tree-item.nav-accent-context .nav-link-label { color: #fcd34d; }
.app-architecture-page .nav-tree-item.nav-accent-component .nav-link-label { color: #d8b4fe; }
.app-architecture-page .nav-tree-item.nav-accent-integration .nav-link-label { color: #7dd3fc; }
.app-architecture-page .nav-tree-item.nav-accent-documentation .nav-link-label { color: #eab308; }
.app-architecture-page .nav-tree-item.nav-accent-script .nav-link-label { color: #38bdf8; }
.app-architecture-page .nav-tree-item.nav-accent-test .nav-link-label { color: #f472b6; }
.app-architecture-page .nav-tree-item.nav-accent-edge-fn .nav-link-label { color: #f8fafc; }
.app-architecture-page .nav-tree-item.nav-accent-db-migration .nav-link-label { color: #34d399; }
.app-architecture-page .nav-tree-item.nav-accent-code-logic .nav-link-label { color: #cbd5e1; }
.app-architecture-page .nav-section-link {
  color: rgba(255,255,255,0.92);
}

.app-architecture-page .nav-branch-link .nav-link-label {
  color: rgba(255,255,255,0.92);
}

.app-architecture-page .nav-branch-link:hover .nav-link-body,
.app-architecture-page .nav-tree-item:hover .nav-link-body {
  background: rgba(255,255,255,0.04);
  color: #ffffff;
}

.app-architecture-page .nav-jump-link.active .nav-link-body {
  border-color: rgba(110, 137, 173, 0.45);
  background:
    linear-gradient(180deg, rgba(111,141,181,0.18) 0%, rgba(79,104,138,0.22) 100%),
    rgba(255,255,255,0.03);
  box-shadow:
    0 0 0 1px rgba(110,137,173,0.12),
    inset 0 1px 0 rgba(255,255,255,0.06);
}

.app-architecture-page .nav-section-link:hover,
.app-architecture-page .nav-root-link:hover {
  filter: brightness(1.05);
}

.app-architecture-page .nav-section-link.active,
.app-architecture-page .nav-root-link.active {
  border-color: rgba(110, 137, 173, 0.45);
}

.app-architecture-page .page-main {
  flex: 1 1 auto;
  min-width: 0;
}

.app-architecture-page .page-main-scroll {
  height: calc(100vh - var(--live-header-height));
  overflow: auto;
  padding: 24px;
}

.app-architecture-page .legend-panel {
  margin: 0 8px 24px;
  padding: 18px 20px;
  border-radius: 16px;
  background: #1f2025;
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow:
    0 18px 32px rgba(0,0,0,0.28),
    inset 0 1px 0 rgba(255,255,255,0.04);
}

.app-architecture-page .legend-title {
  font-size: 18px;
  font-weight: 800;
  color: #f5f7fb;
  margin-bottom: 16px;
}

.app-architecture-page .legend-grid {
  display: grid;
  gap: 18px;
}

.app-architecture-page .legend-section-title {
  color: #f4f7fb;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.app-architecture-page .legend-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  color: #b6bcc8;
  font-size: 13px;
  line-height: 1.55;
  margin: 6px 0;
}

.app-architecture-page .architecture-filter-dropdown {
  position: relative;
}

.app-architecture-page .architecture-filter-trigger {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  padding: 4px 6px 4px 14px;
  border-radius: 999px;
  background: #2b2b2e;
  border: 1px solid #2b2b2e;
  box-shadow:
    0 10px 24px rgba(0,0,0,0.16),
    inset 0 1px 0 rgba(255,255,255,0.04);
  cursor: pointer;
}

.app-architecture-page .architecture-filter-trigger-label {
  color: #f4f7fb;
  font-size: 12px;
  font-weight: 700;
}

.app-architecture-page .architecture-filter-trigger-current {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  background: linear-gradient(180deg, #6f8db5 0%, #4f688a 100%);
  box-shadow:
    0 8px 18px rgba(0,0,0,0.18),
    inset 0 1px 0 rgba(255,255,255,0.14),
    inset 0 -1px 0 rgba(0,0,0,0.18);
  border-top: 1px solid rgba(255,255,255,0.2);
  color: #f7fbff;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.app-architecture-page .architecture-filter-trigger-chevron {
  width: 16px;
  height: 16px;
  color: #d3d7df;
  transition: transform 0.18s ease;
}

.app-architecture-page .architecture-filter-dropdown.open .architecture-filter-trigger-chevron {
  transform: rotate(180deg);
}

.app-architecture-page .architecture-filter-menu {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  min-width: 240px;
  max-height: min(68vh, 520px);
  overflow: auto;
  display: grid;
  gap: 6px;
  padding: 10px;
  border-radius: 18px;
  background: #2b2b2e;
  border: 1px solid rgba(255,255,255,0.06);
  box-shadow:
    0 24px 48px rgba(0,0,0,0.34),
    inset 0 1px 0 rgba(255,255,255,0.05);
  z-index: 40;
}

.app-architecture-page .architecture-filter-option {
  width: 100%;
  border: none;
  background: transparent;
  color: #a1a1aa;
  padding: 9px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}

.app-architecture-page .architecture-filter-option:hover {
  color: #eef2f7;
  background: rgba(255,255,255,0.04);
}

.app-architecture-page .architecture-filter-option.is-active {
  color: #f7fbff;
  background: linear-gradient(180deg, #6f8db5 0%, #4f688a 100%);
  box-shadow:
    0 8px 18px rgba(0,0,0,0.18),
    inset 0 1px 0 rgba(255,255,255,0.14),
    inset 0 -1px 0 rgba(0,0,0,0.18);
}

.app-architecture-page .architecture-tree.filter-mode-active .filter-dim,
.app-architecture-page .filter-mode-active .schema-block.filter-dim {
  opacity: 0.28;
  filter: grayscale(1) saturate(0.18);
}

.app-architecture-page .architecture-tree .folder-row,
.app-architecture-page .architecture-tree .app-card,
.app-architecture-page .architecture-tree .detail-block,
.app-architecture-page .schema-block {
  transition: opacity 0.18s ease, filter 0.18s ease, box-shadow 0.18s ease;
}

.app-architecture-page .tree-node {
  position: relative;
  padding: 12px 0;
}

.app-architecture-page .tree-node.root-node {
  border-left: none;
}

.app-architecture-page .children {
  display: none;
  margin-left: var(--indent);
  position: relative;
}

.app-architecture-page .tree-node.open > .children {
  display: block;
}

.app-architecture-page .children > .item-row,
.app-architecture-page .children > .tree-node {
  border-left: 1px solid var(--line);
}

.app-architecture-page .children > :last-child {
  border-left-color: transparent;
}

.app-architecture-page .children > .item-row,
.app-architecture-page .children > .tree-node {
  position: relative;
}

.app-architecture-page .children > .item-row::before,
.app-architecture-page .children > .tree-node::before {
  content: '';
  position: absolute;
  top: 0;
  left: -1px;
  width: 15px;
  height: 14px;
  border: solid var(--line);
  border-width: 0 0 1px 1px;
}

.app-architecture-page .root-node > .children::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(-1 * var(--indent));
  border-left: 1px solid var(--line);
}

.app-architecture-page .root-node > .children > .item-row,
.app-architecture-page .root-node > .children > .tree-node {
  border-left: none;
}

.app-architecture-page .root-node > .children > .item-row::before,
.app-architecture-page .root-node > .children > .tree-node::before {
  left: calc(-1 * var(--indent));
  width: calc(var(--indent) + 15px);
}

.app-architecture-page .folder-row {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 9px 16px;
  border-radius: 12px;
  cursor: pointer;
  background: linear-gradient(180deg, #c07840 0%, #a5652e 100%);
  border-top: 1px solid rgba(255,255,255,0.22);
  color: #ffffff;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.35);
  overflow: hidden;
}

.app-architecture-page .folder-row::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.00) 30%);
  pointer-events: none;
}

.app-architecture-page .folder-row:hover {
  box-shadow: 0 12px 20px -3px rgba(0,0,0,0.40);
  filter: brightness(1.08);
}

.app-architecture-page .folder-row.is-root {
  margin-left: 8px;
}

.app-architecture-page .folder-icon {
  width: 20px;
  height: 20px;
  color: #9bd0ff;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.app-architecture-page .chevron-icon {
  width: 18px;
  height: 18px;
  color: rgba(255,255,255,0.78);
  transition: transform 0.15s ease;
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}

.app-architecture-page .tree-node.open > .folder-row > .chevron-icon,
.app-architecture-page details[open] > summary .detail-chevron {
  transform: rotate(180deg);
}

.app-architecture-page .folder-label {
  font-weight: 700;
  color: #ffffff;
  font-size: 15px;
  letter-spacing: -0.015em;
  position: relative;
  z-index: 1;
}

.app-architecture-page .folder-desc {
  color: rgba(255,255,255,0.7);
  font-weight: 400;
  font-size: 12px;
  margin-left: 4px;
  position: relative;
  z-index: 1;
}

.app-architecture-page .folder-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 0 9px;
  margin-left: 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #ffffff;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.20);
  border-radius: 999px;
  white-space: nowrap;
  position: relative;
  z-index: 1;
}

.app-architecture-page .app-card {
  margin: 0 0 16px;
  border-radius: 16px;
  overflow: hidden;
  background: #2a2a2f;
  box-shadow:
    0 12px 32px -2px rgba(0,0,0,0.50),
    inset 1px 1px 0 rgba(255,255,255,0.09),
    inset -1px -1px 0 rgba(0,0,0,0.35);
}

.app-architecture-page .app-card.has-error {
  position: relative;
  border: 2px solid rgba(255,70,70,0.95);
  box-shadow:
    0 0 2px rgba(255,40,40,0.95),
    0 0 6px rgba(255,30,30,0.95),
    0 0 14px rgba(255,20,20,0.9),
    0 0 22px rgba(255,10,10,0.6),
    0 0 32px rgba(255,0,0,0.3),
    inset 0 0 1px rgba(255,255,255,0.2);
}

.app-architecture-page .app-card.has-error::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 16px;
  background: radial-gradient(circle at 50% 50%, rgba(255,0,0,0) 70%, rgba(255,0,0,0.06) 82%, rgba(255,0,0,0.12) 92%, rgba(255,0,0,0.15) 100%);
  filter: blur(10px);
  transform: scale(1.01);
  pointer-events: none;
  z-index: -1;
}

.app-architecture-page .app-card.has-refactor {
  position: relative;
  border: 2px solid rgba(70,130,255,0.95);
  box-shadow:
    0 0 2px rgba(40,100,255,0.95),
    0 0 6px rgba(30,90,255,0.95),
    0 0 14px rgba(20,80,255,0.9),
    0 0 22px rgba(10,70,255,0.6),
    0 0 32px rgba(0,60,255,0.3),
    inset 0 0 1px rgba(255,255,255,0.2);
}

.app-architecture-page .app-card.has-refactor::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 16px;
  background: radial-gradient(circle at 50% 50%, rgba(0,60,255,0) 70%, rgba(0,60,255,0.06) 82%, rgba(0,60,255,0.12) 92%, rgba(0,60,255,0.15) 100%);
  filter: blur(10px);
  transform: scale(1.01);
  pointer-events: none;
  z-index: -1;
}

.app-architecture-page .highlighted-card {
  box-shadow:
    0 0 0 2px rgba(255,255,255,0.18),
    0 0 0 5px rgba(96, 165, 250, 0.25),
    0 18px 36px rgba(0,0,0,0.52),
    inset 1px 1px 0 rgba(255,255,255,0.09),
    inset -1px -1px 0 rgba(0,0,0,0.35);
}

.app-architecture-page .app-card-header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: linear-gradient(180deg, #5a7292 0%, #4a5f7f 100%);
  border-top: 1px solid rgba(255,255,255,0.20);
  box-shadow: 0 6px 16px rgba(0,0,0,0.35);
}

.app-architecture-page .app-card-header::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 30%);
  pointer-events: none;
}

.app-architecture-page .tag,
.app-architecture-page .tag-dark {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  padding: 1px 6px;
  border-radius: 2px;
  vertical-align: baseline;
  white-space: nowrap;
}

.app-architecture-page .tag-dark {
  font-size: 11px;
  padding: 3px 9px;
  border-radius: 8px;
  background: #2a2a2f;
}

.app-architecture-page .tag.code-logic,
.app-architecture-page .tag-dark.code-logic { background: rgba(85,85,85,0.10); color: #d1d5db; border: 1px solid rgba(85,85,85,0.3); }
.app-architecture-page .tag.component,
.app-architecture-page .tag-dark.component { background: rgba(123,31,162,0.12); color: #c084fc; border: 1px solid rgba(123,31,162,0.25); }
.app-architecture-page .tag.feature,
.app-architecture-page .tag-dark.feature { background: rgba(21,101,192,0.10); color: #60a5fa; border: 1px solid rgba(21,101,192,0.25); }
.app-architecture-page .tag.service,
.app-architecture-page .tag-dark.service,
.app-architecture-page .tag.data-block,
.app-architecture-page .tag-dark.data-block { background: rgba(15,118,110,0.10); color: #2dd4bf; border: 1px solid rgba(15,118,110,0.3); }
.app-architecture-page .tag.context-injection,
.app-architecture-page .tag-dark.context-injection,
.app-architecture-page .tag.context,
.app-architecture-page .tag-dark.context { background: rgba(230,126,34,0.10); color: #fb923c; border: 1px solid rgba(230,126,34,0.3); }
.app-architecture-page .tag.hook,
.app-architecture-page .tag-dark.hook { background: rgba(79,70,229,0.10); color: #a5b4fc; border: 1px solid rgba(79,70,229,0.25); }
.app-architecture-page .tag.edge-fn,
.app-architecture-page .tag-dark.edge-fn { background: rgba(220,38,38,0.08); color: #f8fafc; border: 1px solid rgba(220,38,38,0.2); }
.app-architecture-page .tag.db-table,
.app-architecture-page .tag-dark.db-table,
.app-architecture-page .tag.db-migration,
.app-architecture-page .tag-dark.db-migration { background: rgba(6,78,59,0.10); color: #34d399; border: 1px solid rgba(6,78,59,0.3); }
.app-architecture-page .tag.integration,
.app-architecture-page .tag-dark.integration { background: rgba(3,105,161,0.08); color: #7dd3fc; border: 1px solid rgba(3,105,161,0.2); }
.app-architecture-page .tag.api-call,
.app-architecture-page .tag-dark.api-call { background: rgba(239,68,68,0.08); color: var(--danger-red); border: 1px solid rgba(239,68,68,0.2); }
.app-architecture-page .tag.documentation,
.app-architecture-page .tag-dark.documentation { background: rgba(250,204,21,0.10); color: #eab308; border: 1px solid rgba(250,204,21,0.24); }
.app-architecture-page .tag.tooling,
.app-architecture-page .tag-dark.tooling { background: rgba(196,181,253,0.10); color: #d8ccff; border: 1px solid rgba(196,181,253,0.24); }
.app-architecture-page .tag.script,
.app-architecture-page .tag-dark.script { background: rgba(56,189,248,0.10); color: #38bdf8; border: 1px solid rgba(56,189,248,0.22); }
.app-architecture-page .tag.test,
.app-architecture-page .tag-dark.test { background: rgba(244,114,182,0.10); color: #f472b6; border: 1px solid rgba(244,114,182,0.24); }

.app-architecture-page .item-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  width: 100%;
  position: relative;
  z-index: 1;
}

.app-architecture-page .item-name {
  font-weight: 800;
  font-size: 14px;
  color: #ffffff;
  min-width: 0;
}

.app-architecture-page .line-count-badge {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 0 9px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.10);
  background: #1c1c1f;
  color: #b9bec8;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.app-architecture-page .line-count-badge.is-large { color: #ffe28a; }
.app-architecture-page .line-count-badge.is-refactor-soon { color: #ffc18c; }
.app-architecture-page .line-count-badge.is-refactor-needed {
  color: #ff8f8f;
  border-color: rgba(239,68,68,0.82);
  box-shadow:
    0 0 2px rgba(239,68,68,0.95),
    0 0 6px rgba(239,68,68,0.82),
    0 0 14px rgba(239,68,68,0.50),
    inset 0 0 1px rgba(255,255,255,0.12);
}

.app-architecture-page .app-card-body {
  padding: 16px 18px 18px;
}

.app-architecture-page .app-card-desc {
  color: #9aa2af;
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 14px;
}

.app-architecture-page .signal-note {
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 12px;
  line-height: 1.55;
}

.app-architecture-page .signal-note.refactor {
  background: rgba(37,99,235,0.14);
  border: 1px solid rgba(96,165,250,0.32);
  color: #dbeafe;
}

.app-architecture-page .signal-note.issue {
  background: rgba(127,29,29,0.24);
  border: 1px solid rgba(248,113,113,0.36);
  color: #fee2e2;
}

.app-architecture-page .app-card-inner {
  display: grid;
  gap: 10px;
}

.app-architecture-page .app-card-row,
.app-architecture-page .detail-block > summary,
.app-architecture-page .schema-block > summary {
  list-style: none;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  width: 100%;
  padding: 13px 14px;
  border-radius: 14px;
  background: #35363d;
  border: 1px solid rgba(255,255,255,0.06);
  box-shadow:
    0 10px 22px rgba(0,0,0,0.26),
    inset 0 1px 0 rgba(255,255,255,0.05);
  cursor: default;
}

.app-architecture-page .app-card-row.has-error {
  position: relative;
  border: 2px solid rgba(255, 78, 78, 0.92);
  box-shadow:
    0 0 2px rgba(255, 50, 50, 0.95),
    0 0 6px rgba(255, 35, 35, 0.92),
    0 0 12px rgba(255, 20, 20, 0.82),
    0 0 18px rgba(255, 10, 10, 0.45),
    inset 0 0 1px rgba(255,255,255,0.12);
}

.app-architecture-page .app-card-row.has-refactor {
  position: relative;
  border: 2px solid rgba(70,130,255,0.95);
  box-shadow:
    0 0 2px rgba(40,100,255,0.95),
    0 0 6px rgba(30,90,255,0.92),
    0 0 12px rgba(20,80,255,0.82),
    0 0 18px rgba(10,70,255,0.4),
    inset 0 0 1px rgba(255,255,255,0.12);
}

.app-architecture-page .detail-block > summary,
.app-architecture-page .schema-block > summary {
  cursor: pointer;
}

.app-architecture-page .detail-block.has-error > summary {
  position: relative;
  border: 2px solid rgba(255, 78, 78, 0.92);
  box-shadow:
    0 0 2px rgba(255, 50, 50, 0.95),
    0 0 6px rgba(255, 35, 35, 0.92),
    0 0 12px rgba(255, 20, 20, 0.82),
    0 0 18px rgba(255, 10, 10, 0.45),
    inset 0 0 1px rgba(255,255,255,0.12);
}

.app-architecture-page .detail-block.has-refactor > summary {
  position: relative;
  border: 2px solid rgba(70,130,255,0.95);
  box-shadow:
    0 0 2px rgba(40,100,255,0.95),
    0 0 6px rgba(30,90,255,0.92),
    0 0 12px rgba(20,80,255,0.82),
    0 0 18px rgba(10,70,255,0.4),
    inset 0 0 1px rgba(255,255,255,0.12);
}

.app-architecture-page .detail-block > summary::-webkit-details-marker,
.app-architecture-page .schema-block > summary::-webkit-details-marker {
  display: none;
}

.app-architecture-page .detail-summary-inline,
.app-architecture-page .schema-summary-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1 1 auto;
  flex-wrap: wrap;
}

.app-architecture-page .sub-name {
  color: #f3f4f6;
  font-weight: 700;
  font-size: 13px;
}

.app-architecture-page .sub-desc {
  color: #9ca3af;
  font-size: 12px;
  line-height: 1.5;
}

.app-architecture-page .detail-chevron {
  width: 18px;
  height: 18px;
  color: rgba(255,255,255,0.72);
  margin-left: auto;
  flex-shrink: 0;
  transition: transform 0.15s ease;
}

.app-architecture-page .detail-content,
.app-architecture-page .schema-content {
  padding: 12px 14px 6px 18px;
}

.app-architecture-page .detail-line,
.app-architecture-page .schema-list,
.app-architecture-page .schema-column-meta,
.app-architecture-page .schema-description {
  color: #aeb5c1;
  font-size: 12px;
  line-height: 1.65;
}

.app-architecture-page .detail-line strong,
.app-architecture-page .schema-list strong {
  color: #d9dde5;
}

.app-architecture-page .detail-link {
  border: none;
  background: transparent;
  color: #d6e6ff;
  font-size: 12px;
  font-weight: 600;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
  margin-right: 8px;
}

.app-architecture-page .detail-link.table-link { color: #8ce9c6; }
.app-architecture-page .detail-link.rpc-link { color: #f4d38b; }
.app-architecture-page .detail-link.edge-link { color: #f4a3a3; }
.app-architecture-page .detail-link.bucket-link { color: #8dd7ff; }

.app-architecture-page .detail-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255,255,255,0.08);
  color: #d4d7dd;
  margin-right: 8px;
  margin-top: 6px;
}

.app-architecture-page .security-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: rgba(217, 119, 6, 0.14);
  border: 1px solid rgba(245, 158, 11, 0.36);
  color: #fbbf24;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.12);
}

.app-architecture-page .backend-section {
  margin: 28px 8px 0;
  display: grid;
  gap: 12px;
}

.app-architecture-page .backend-title {
  color: #f4f7fb;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.app-architecture-page .schema-grid {
  display: grid;
  gap: 12px;
}

.app-architecture-page .schema-column-list {
  display: grid;
  gap: 10px;
  margin-top: 10px;
}

.app-architecture-page .schema-column {
  padding: 10px 12px;
  border-radius: 12px;
  background: #303138;
  border: 1px solid rgba(255,255,255,0.06);
}

.app-architecture-page .schema-column-name {
  color: #f4f7fb;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 4px;
}

.app-architecture-page .schema-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.app-architecture-page .schema-stat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255,255,255,0.08);
  color: #dbe1eb;
  font-size: 11px;
}

.app-architecture-page .schema-stat-label {
  color: #9aa2af;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 10px;
}

.app-architecture-page button {
  appearance: none;
}

.app-architecture-page .header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e0e0e0;
  padding: 14px var(--header-pad-x);
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}

.app-architecture-page .header-filter-wrap {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 0 0 auto;
}

.app-architecture-page .legend-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-left: auto;
  height: 40px;
  padding: 0 20px;
  border-radius: 14px;
  border: none;
  background: #2f3137;
  color: #eaedf1;
  box-shadow:
    0 8px 24px rgba(0,0,0,0.45),
    inset 0 1px 0 rgba(255,255,255,0.09),
    inset 0 -1px 0 rgba(0,0,0,0.20);
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.app-architecture-page .legend-toggle-btn:hover { background: #343439; }
.app-architecture-page .legend-toggle-btn:active { transform: scale(0.98); }
.app-architecture-page .legend-toggle-btn[aria-expanded="true"] {
  background: #38414c;
}

.app-architecture-page .page-main {
  flex: 1 1 auto;
  min-width: 0;
}

.app-architecture-page .content {
  height: calc(100vh - 76px);
  min-height: calc(100vh - 76px);
  overflow: auto;
  padding: var(--content-pad);
}

.app-architecture-page .legend {
  margin: 0 24px 24px;
  display: none;
}

.app-architecture-page .legend.open {
  display: block;
}

.app-architecture-page .legend-shell {
  background: #2a2a2f;
  border-radius: 24px;
  overflow: hidden;
  box-shadow:
    0 12px 32px -2px rgba(0,0,0,0.50),
    inset 1px 1px 0 rgba(255,255,255,0.09),
    inset -1px -1px 0 rgba(0,0,0,0.35);
}

.app-architecture-page .legend-shell-header {
  position: relative;
  overflow: hidden;
  padding: 14px 20px 12px;
  background: linear-gradient(180deg, #5a7292 0%, #4a5f7f 100%);
  border-top: 1px solid rgba(255,255,255,0.20);
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.30);
}

.app-architecture-page .legend-shell-header::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.00) 30%);
  pointer-events: none;
}

.app-architecture-page .legend-shell-kicker {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  color: rgba(235,241,250,0.82);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.app-architecture-page .legend-shell-title {
  position: relative;
  z-index: 1;
  margin: 0;
  color: #f7f9fc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 23px;
  line-height: 1.15;
  font-weight: 900;
  letter-spacing: -0.03em;
}

.app-architecture-page .legend-shell-body {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.app-architecture-page .legend-main-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: minmax(0, 1.25fr) minmax(350px, 0.95fr);
  align-items: start;
}

.app-architecture-page .legend-card {
  background: #2e2e33;
  border-radius: 20px;
  padding: 16px;
  box-shadow:
    inset 1px 1px 0 rgba(255,255,255,0.07),
    inset -1px -1px 0 rgba(0,0,0,0.30),
    0 4px 12px rgba(0,0,0,0.25);
}

.app-architecture-page .legend-card-kicker {
  margin-bottom: 6px;
  color: #9fb3d0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.10em;
  text-transform: uppercase;
}

.app-architecture-page .legend-card-title {
  margin: 0 0 14px;
  color: #f5f7fb;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 18px;
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.app-architecture-page .legend-definition-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.app-architecture-page .legend-definition-item,
.app-architecture-page .legend-health-row {
  background: #1c1c1f;
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 14px;
  box-shadow:
    inset 0 3px 10px rgba(0,0,0,0.6),
    inset 0 1px 0 rgba(255,255,255,0.05);
}

.app-architecture-page .legend-definition-item {
  padding: 12px 13px;
  min-height: 92px;
}

.app-architecture-page .legend-definition-copy {
  margin: 10px 0 0;
  color: #c7ccd5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px;
  line-height: 1.55;
}

.app-architecture-page .legend-security-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 11px 5px 8px;
  border-radius: 10px;
  background: #1b160a;
  border: 1px solid rgba(255,211,77,0.20);
  box-shadow:
    inset 0 1px 0 rgba(255,244,195,0.14),
    0 0 0 1px rgba(0,0,0,0.12);
  color: #ffd95b;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.app-architecture-page .legend-security-badge img {
  width: 18px;
  height: 18px;
  object-fit: contain;
  flex-shrink: 0;
}

.app-architecture-page .legend-signal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.app-architecture-page .legend-signal-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.app-architecture-page .legend-signal-label,
.app-architecture-page .legend-health-title {
  color: #f0f4fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.app-architecture-page .legend-signal-preview-card,
.app-architecture-page .legend-signal-preview-shell {
  background: #2a2a2f;
  border-radius: 16px;
  padding: 12px;
  box-shadow:
    0 6px 16px rgba(0,0,0,0.35),
    inset 1px 1px 0 rgba(255,255,255,0.07),
    inset -1px -1px 0 rgba(0,0,0,0.35);
}

.app-architecture-page .legend-signal-preview-card { min-height: 110px; }

.app-architecture-page .legend-signal-preview-card.is-blue-card {
  border: 2px solid rgba(70,130,255,0.95);
  box-shadow:
    0 0 2px rgba(40,100,255,0.95),
    0 0 6px rgba(30,90,255,0.95),
    0 0 14px rgba(20,80,255,0.9),
    0 0 22px rgba(10,70,255,0.45),
    inset 0 0 1px rgba(255,255,255,0.2);
}

.app-architecture-page .legend-signal-preview-card.is-red-card {
  border: 2px solid rgba(239,68,68,0.95);
  box-shadow:
    0 0 2px rgba(239,68,68,0.95),
    0 0 6px rgba(239,68,68,0.85),
    0 0 14px rgba(239,68,68,0.8),
    0 0 22px rgba(239,68,68,0.45),
    inset 0 0 1px rgba(255,255,255,0.2);
}

.app-architecture-page .legend-preview-mini-header {
  height: 16px;
  border-radius: 10px 10px 0 0;
  margin: -12px -12px 12px;
  background: linear-gradient(180deg, #5a7292 0%, #4a5f7f 100%);
  border-top: 1px solid rgba(255,255,255,0.12);
}

.app-architecture-page .legend-preview-mini-row {
  min-height: 46px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #3c3e47;
  box-shadow:
    0 8px 24px rgba(0,0,0,0.32),
    inset 0 1px 0 rgba(255,255,255,0.08),
    inset 0 -1px 0 rgba(0,0,0,0.18);
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-architecture-page .legend-preview-mini-row.is-blue-row {
  border: 2px solid rgba(70,130,255,0.95);
  box-shadow:
    0 0 2px rgba(40,100,255,0.95),
    0 0 6px rgba(30,90,255,0.95),
    0 0 14px rgba(20,80,255,0.55),
    inset 0 1px 0 rgba(255,255,255,0.08),
    inset 0 -1px 0 rgba(0,0,0,0.18);
}

.app-architecture-page .legend-preview-mini-row.is-red-row {
  border: 2px solid rgba(239,68,68,0.95);
  box-shadow:
    0 0 2px rgba(239,68,68,0.95),
    0 0 6px rgba(239,68,68,0.85),
    0 0 14px rgba(239,68,68,0.55),
    inset 0 1px 0 rgba(255,255,255,0.08),
    inset 0 -1px 0 rgba(0,0,0,0.18);
}

.app-architecture-page .legend-preview-mini-copy {
  color: #d8dce4;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 12px;
  line-height: 1.45;
  font-weight: 600;
}

.app-architecture-page .legend-signal-copy {
  margin: 0;
  color: #b9c0cb;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px;
  line-height: 1.5;
}

.app-architecture-page .legend-health-block {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255,255,255,0.07);
}

.app-architecture-page .legend-health-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.app-architecture-page .legend-health-row {
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-architecture-page .legend-health-copy {
  color: #c5cad2;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px;
  line-height: 1.5;
}

.app-architecture-page .tree > .tree-node {
  border-left: 2px solid var(--line);
  padding-left: 22px;
  margin-left: 8px;
}

.app-architecture-page .tree > .tree-node:last-child {
  border-left-color: transparent;
}

.app-architecture-page .tree > .tree-node::before {
  content: '';
  position: absolute;
  top: 0;
  left: -2px;
  width: 20px;
  height: 16px;
  border: solid var(--line);
  border-width: 0 0 2px 2px;
}

.app-architecture-page .tree > .tree-node.root-node {
  border-left: none;
  padding-left: 0;
  margin-left: 0;
}

.app-architecture-page .tree > .tree-node.root-node::before {
  display: none;
}

.app-architecture-page .tree > .tree-node.root-node > .children {
  position: relative;
}

.app-architecture-page .tree > .tree-node.root-node > .children::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(-1 * var(--indent));
  border-left: 2px solid var(--line);
}

.app-architecture-page .folder-row {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border-radius: 12px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  background: linear-gradient(180deg, #c07840 0%, #a5652e 100%);
  border-top: 1px solid rgba(255,255,255,0.22);
  border-left: none;
  border-right: none;
  border-bottom: none;
  margin: 2px 0;
  color: #ffffff;
  overflow: hidden;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.35);
}

.app-architecture-page .folder-row::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.00) 30%);
  pointer-events: none;
}

.app-architecture-page .folder-row:hover {
  box-shadow: 0 12px 20px -3px rgba(0,0,0,0.40);
  filter: brightness(1.08);
}

.app-architecture-page .folder-row:active { transform: scale(0.98); }

.app-architecture-page .folder-icon-image {
  width: 22px;
  height: 22px;
  object-fit: contain;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.app-architecture-page .chevron {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  font-size: 0;
  color: transparent;
  transition: transform 0.15s ease;
  transform: rotate(-90deg);
}

.app-architecture-page .chevron::before {
  content: '';
  display: block;
  width: 18px;
  height: 18px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.78)' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 18px 18px;
}

.app-architecture-page .tree-node.open > .folder-row > .chevron {
  transform: rotate(0deg);
}

.app-architecture-page .children {
  display: none;
  margin-left: var(--indent);
  position: relative;
}

.app-architecture-page .tree-node.open > .children {
  display: block;
}

.app-architecture-page .architecture-tree .children::before {
  display: none;
}

.app-architecture-page .architecture-tree .children > .item-row,
.app-architecture-page .architecture-tree .children > .tree-node {
  border-left: 1px solid var(--line);
}

.app-architecture-page .architecture-tree .children > :last-child {
  border-left-color: transparent;
}

.app-architecture-page .architecture-tree > .tree-node.root-node > .children::before {
  display: block;
  left: calc(-1 * var(--indent));
  border-left: 1px solid var(--line);
}

.app-architecture-page .architecture-tree > .tree-node.root-node > .children > .item-row,
.app-architecture-page .architecture-tree > .tree-node.root-node > .children > .tree-node {
  border-left: none;
}

.app-architecture-page .architecture-tree > .tree-node.root-node > .children > .item-row::before,
.app-architecture-page .architecture-tree > .tree-node.root-node > .children > .tree-node::before {
  left: calc(-1 * var(--indent));
  width: calc(var(--indent) + 15px);
}

.app-architecture-page .item-row {
  position: relative;
  padding: 3px 8px 3px 16px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.app-architecture-page .item-row::before {
  content: '';
  position: absolute;
  top: 0;
  left: -1px;
  width: 15px;
  height: 14px;
  border: solid var(--line);
  border-width: 0 0 1px 1px;
}

.app-architecture-page .children > .tree-node {
  padding-left: 16px;
}

.app-architecture-page .children > .tree-node::before {
  content: '';
  position: absolute;
  top: 0;
  left: -1px;
  width: 15px;
  height: 14px;
  border: solid var(--line);
  border-width: 0 0 1px 1px;
}

.app-architecture-page .item-name-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
  width: 100%;
}

.app-architecture-page .app-card {
  background: #2a2a2f;
  border-radius: 16px;
  overflow: hidden;
  box-shadow:
    0 12px 32px -2px rgba(0,0,0,0.50),
    inset 1px 1px 0 rgba(255,255,255,0.09),
    inset -1px -1px 0 rgba(0,0,0,0.35);
  margin: 12px 0;
}

.app-architecture-page .app-card-header {
  position: relative;
  background: linear-gradient(180deg, #5a7292 0%, #4a5f7f 100%);
  border-top: 1px solid rgba(255,255,255,0.20);
  border-radius: 16px 16px 0 0;
  padding: 9px 16px;
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  box-shadow: 0 6px 16px rgba(0,0,0,0.35);
  overflow: hidden;
}

.app-architecture-page .app-card-header::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.00) 30%);
  pointer-events: none;
}

.app-architecture-page .app-card-header .item-name {
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  position: relative;
  z-index: 1;
}

.app-architecture-page .app-card-header .line-count-badge {
  position: relative;
  z-index: 1;
  background: #1c1c1f;
  border-color: rgba(255,255,255,0.16);
  color: #eef4ff;
}

.app-architecture-page .app-card-body {
  padding: 14px;
}

.app-architecture-page .app-card-desc {
  color: #a1a1aa;
  font-size: 12px;
  line-height: 1.5;
  margin-bottom: 4px;
}

.app-architecture-page .app-card-inner {
  background: #2e2e33;
  border-radius: 12px;
  box-shadow:
    inset 1px 1px 0 rgba(255,255,255,0.07),
    inset -1px -1px 0 rgba(0,0,0,0.30),
    0 4px 12px rgba(0,0,0,0.25);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.app-architecture-page .app-card-row {
  background: #3c3e47;
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  box-shadow:
    0 8px 24px rgba(0,0,0,0.45),
    inset 0 1px 0 rgba(255,255,255,0.09),
    inset 0 -1px 0 rgba(0,0,0,0.20);
}

.app-architecture-page .app-card-row .sub-name,
.app-architecture-page .detail-summary-inline .sub-name {
  font-weight: 600;
  color: #eaedf1;
  font-size: 13px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.app-architecture-page .app-card-row .sub-desc,
.app-architecture-page .detail-summary-inline .sub-desc {
  color: #a1a1aa;
  font-size: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.app-architecture-page .detail-block {
  display: grid;
  gap: 8px;
}

.app-architecture-page .detail-block > summary {
  list-style: none;
  display: block;
  padding: 10px 14px;
  background: #3c3e47;
  border-radius: 10px;
  cursor: pointer;
  position: relative;
  padding-right: 40px;
  box-shadow:
    0 8px 24px rgba(0,0,0,0.45),
    inset 0 1px 0 rgba(255,255,255,0.09),
    inset 0 -1px 0 rgba(0,0,0,0.20);
}

.app-architecture-page .detail-block > summary::-webkit-details-marker,
.app-architecture-page .schema-block > summary::-webkit-details-marker {
  display: none;
}

.app-architecture-page .detail-block > summary::after,
.app-architecture-page .schema-block > summary::after {
  content: '';
  display: inline-block;
  width: 20px;
  height: 20px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.72)' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 18px 18px;
  transition: transform 0.15s ease;
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.app-architecture-page .detail-block[open] > summary::after {
  transform: translateY(-50%) rotate(180deg);
}

.app-architecture-page .schema-block[open] > summary::after {
  transform: rotate(180deg);
}

.app-architecture-page .detail-summary-inline {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}

.app-architecture-page .detail-summary-inline.has-security-icon {
  align-items: flex-start;
}

.app-architecture-page .detail-summary-text {
  min-width: 0;
  flex: 1;
}

.app-architecture-page .security-shield-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  object-fit: contain;
  align-self: flex-start;
  margin-top: 2px;
}

.app-architecture-page .detail-panel {
  padding: 12px 14px;
  background: #1c1c1f;
  border: 1px solid rgba(0,0,0,0.35);
  border-radius: 10px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
}

.app-architecture-page .detail-stack {
  display: grid;
  gap: 4px;
}

.app-architecture-page .detail-line {
  color: #a1a1aa;
  font-size: 12px;
  line-height: 1.55;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.app-architecture-page .detail-line strong {
  color: #eaedf1;
  font-weight: 600;
}

.app-architecture-page .jump-link {
  color: #d4d7de;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
  text-decoration-color: rgba(212, 215, 222, 0.38);
  transition: color 0.15s ease, text-decoration-color 0.15s ease;
}

.app-architecture-page .jump-link:hover {
  color: #f3f4f6;
  text-decoration-color: rgba(243, 244, 246, 0.75);
}

.app-architecture-page .detail-link {
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
  font-size: inherit;
  font-weight: inherit;
  font-family: inherit;
  cursor: pointer;
}

.app-architecture-page .inline-error-text {
  color: var(--danger-red);
  font-size: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  line-height: 1.5;
  margin-bottom: 8px;
}

.app-architecture-page .inline-size-warning {
  color: rgba(70,130,255,0.95);
  font-size: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  line-height: 1.5;
  margin-bottom: 8px;
}

.app-architecture-page .tag-header {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  padding: 3px 9px;
  border-radius: 8px;
  font-family: -apple-system, sans-serif;
  background: rgba(0,0,0,0.25);
  border: 1px solid rgba(255,255,255,0.12);
  position: relative;
  z-index: 1;
}

.app-architecture-page .tag-inset {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  padding: 3px 9px;
  border-radius: 8px;
  font-family: -apple-system, sans-serif;
  background: #1c1c1f;
  border-top: 1px solid rgba(0,0,0,0.35);
}

.app-architecture-page .tag-header .tag-icon,
.app-architecture-page .tag-inset .tag-icon {
  display: none;
}

.app-architecture-page .tag-header.service { color: #5eead4; }
.app-architecture-page .tag-header.data-block { color: #5eead4; }
.app-architecture-page .tag-header.code-logic { color: #cbd5e1; }
.app-architecture-page .tag-header.feature { color: #93c5fd; }
.app-architecture-page .tag-header.component { color: #d8b4fe; }
.app-architecture-page .tag-header.context-injection { color: #fdba74; }
.app-architecture-page .tag-header.hook { color: #a5b4fc; }
.app-architecture-page .tag-header.context { color: #fcd34d; }
.app-architecture-page .tag-header.edge-fn { color: #f8fafc; }
.app-architecture-page .tag-header.db-table { color: #6ee7b7; }
.app-architecture-page .tag-header.integration { color: #7dd3fc; }
.app-architecture-page .tag-header.api-call { color: var(--danger-red); }
.app-architecture-page .tag-header.documentation { color: #fde68a; }
.app-architecture-page .tag-header.tooling { color: #d8ccff; }
.app-architecture-page .tag-header.script { color: #93dcff; }
.app-architecture-page .tag-header.test { color: #fbcfe8; }
.app-architecture-page .tag-header.db-migration { color: #86efac; }

.app-architecture-page .tag-inset.service { color: #2dd4bf; }
.app-architecture-page .tag-inset.code-logic { color: #94a3b8; }
.app-architecture-page .tag-inset.feature { color: #60a5fa; }
.app-architecture-page .tag-inset.component { color: #c084fc; }
.app-architecture-page .tag-inset.context-injection { color: #fb923c; }
.app-architecture-page .tag-inset.data-block { color: #2dd4bf; }
.app-architecture-page .tag-inset.hook { color: #818cf8; }
.app-architecture-page .tag-inset.context { color: #fbbf24; }
.app-architecture-page .tag-inset.edge-fn { color: #f8fafc; }
.app-architecture-page .tag-inset.db-table { color: #34d399; }
.app-architecture-page .tag-inset.integration { color: #38bdf8; }
.app-architecture-page .tag-inset.api-call { color: var(--danger-red); }
.app-architecture-page .tag-inset.documentation { color: #fde68a; }
.app-architecture-page .tag-inset.tooling { color: #c4b5fd; }
.app-architecture-page .tag-inset.script { color: #7dd3fc; }
.app-architecture-page .tag-inset.test { color: #f9a8d4; }
.app-architecture-page .tag-inset.db-migration { color: #6ee7b7; }

.app-architecture-page .schema-block {
  background: #3c3e47;
  border-radius: 12px;
  box-shadow:
    0 8px 24px rgba(0,0,0,0.45),
    inset 0 1px 0 rgba(255,255,255,0.09),
    inset 0 -1px 0 rgba(0,0,0,0.20);
  overflow: hidden;
}

.app-architecture-page .schema-block > summary {
  list-style: none;
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  padding: 12px 14px;
  cursor: pointer;
  position: relative;
  padding-right: 42px;
}

.app-architecture-page .schema-panel {
  padding: 0 14px 14px;
  display: grid;
  gap: 10px;
}

.app-architecture-page .schema-block-list {
  display: grid;
  gap: 12px;
}

.app-architecture-page .schema-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.app-architecture-page .schema-stat {
  padding: 10px 12px;
  border-radius: 10px;
  background: #1c1c1f;
  border: 1px solid rgba(0,0,0,0.35);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
  display: block;
}

.app-architecture-page .schema-stat-label {
  display: block;
  color: #8f97a7;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  margin-bottom: 4px;
}

.app-architecture-page .schema-stat-value {
  color: #eef2f9;
  font-size: 13px;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
}

.app-architecture-page .schema-columns {
  display: grid;
  gap: 8px;
}

.app-architecture-page .schema-columns-title {
  color: #cfd5e2;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.app-architecture-page .schema-column-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.app-architecture-page .schema-column {
  padding: 10px 12px;
  border-radius: 10px;
  background: #1c1c1f;
  border: 1px solid rgba(0,0,0,0.35);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
}

.app-architecture-page .schema-column-name {
  color: #f3f5fa;
  font-size: 13px;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
}

.app-architecture-page .schema-column-type {
  color: #7dd3fc;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  margin-top: 2px;
}

.app-architecture-page .schema-column-meta {
  color: #9fa8b8;
  font-size: 11px;
  line-height: 1.45;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  margin-top: 6px;
}

@media (max-width: 1420px) {
  .app-architecture-page {
    --nav-rail-width: 268px;
    --header-pad-x: 20px;
    --content-pad: 20px;
  }

  .app-architecture-page .header {
    gap: 14px;
  }

  .app-architecture-page .nav-rail-body {
    padding: 14px 12px 18px;
  }

  .app-architecture-page .nav-section-stack {
    gap: 12px;
  }

  .app-architecture-page .nav-section {
    gap: 8px;
  }
}

@media (max-width: 1280px) {
  .app-architecture-page {
    --nav-rail-width: 232px;
    --header-pad-x: 16px;
    --content-pad: 16px;
  }

  .app-architecture-page .header {
    gap: 12px;
  }

  .app-architecture-page .page-title {
    font-size: 16px;
  }

  .app-architecture-page .nav-root-link,
  .app-architecture-page .nav-section-link,
  .app-architecture-page .nav-section-title {
    min-height: 40px;
    border-radius: 12px;
    font-size: 12px;
  }

  .app-architecture-page .nav-root-link {
    padding: 0 14px;
  }

  .app-architecture-page .nav-section-link,
  .app-architecture-page .nav-section-title {
    padding: 0 12px;
  }

  .app-architecture-page .nav-tree-group {
    gap: 6px;
    padding-left: 16px;
  }

  .app-architecture-page .nav-branch-link,
  .app-architecture-page .nav-tree-item {
    min-height: 34px;
    font-size: 12px;
  }

  .app-architecture-page .nav-link-body {
    min-height: 34px;
    padding: 0 10px;
  }

  .app-architecture-page .folder-row {
    padding: 8px 12px;
    gap: 7px;
  }

  .app-architecture-page .folder-desc {
    font-size: 12px;
  }
}

@media (max-width: 1120px) {
  .app-architecture-page {
    --nav-rail-width: 212px;
    --header-pad-x: 14px;
    --content-pad: 14px;
  }

  .app-architecture-page .header {
    gap: 10px;
  }

  .app-architecture-page .folder-row {
    padding: 8px 10px;
  }

  .app-architecture-page .folder-count {
    padding: 0 8px;
    font-size: 10px;
  }

  .app-architecture-page .app-card-header {
    padding: 12px 14px;
  }

  .app-architecture-page .app-card-body {
    padding: 14px 14px 16px;
  }

  .app-architecture-page .detail-block > summary,
  .app-architecture-page .schema-block > summary,
  .app-architecture-page .app-card-row {
    padding: 12px 12px;
  }
}

@media (max-width: 980px) {
  .app-architecture-page .page-shell {
    display: block;
  }

  .app-architecture-page .nav-rail-shell {
    display: none;
  }

  .app-architecture-page .content {
    height: auto;
    min-height: calc(100vh - 76px);
    padding: 16px;
  }

  .app-architecture-page .legend-main-grid,
  .app-architecture-page .legend-definition-grid,
  .app-architecture-page .legend-signal-grid,
  .app-architecture-page .schema-grid,
  .app-architecture-page .schema-column-list {
    grid-template-columns: 1fr;
  }

  .app-architecture-page .legend {
    margin: 0 16px 16px;
  }

  .app-architecture-page .legend-shell-header {
    padding: 12px 16px 10px;
  }

  .app-architecture-page .legend-shell-title {
    font-size: 21px;
  }

  .app-architecture-page .legend-shell-body {
    padding: 16px;
  }

  .app-architecture-page .legend-toggle-btn {
    margin-left: 0;
  }
}
`;

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function toTitleWords(input: string): string {
  return input
    .replace(/\.[^.]+$/, "")
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function createPrimaryTitle(node: ArchitectureNode): string {
  const symbol = node.fileMeta?.probableSymbols?.[0];
  if (symbol) return symbol;
  return toTitleWords(node.name) || node.name;
}

function pushDetail(lines: DetailLine[], label: string, values: string[], kind: DetailLineKind) {
  const clean = uniqueStrings(values);
  if (clean.length > 0) {
    lines.push({ label, values: clean, kind });
  }
}

function resolveHeaderBadge(node: ArchitectureNode): HeaderBadge {
  const path = node.path;
  const fileKind = node.fileMeta?.fileKind ?? "source-file";
  const fileName = node.name;

  if (
    path === "/package.json" ||
    path === "/vite.config.ts" ||
    path === "/components.json" ||
    path === "/tailwind.config.ts" ||
    path === "/playwright.config.ts" ||
    path === "/eslint.config.js" ||
    path === "/tsconfig.json" ||
    path === "/tsconfig.app.json" ||
    path === "/tsconfig.node.json" ||
    path === "/postcss.config.js" ||
    fileName === "config.toml"
  ) {
    return { label: "TOOLING", className: "tooling", filterValue: "tooling", navAccent: "tooling" };
  }

  if (path.startsWith("/scripts/")) {
    return { label: "SCRIPT", className: "script", filterValue: "script", navAccent: "script" };
  }

  if (path.startsWith("/e2e/") || /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(path) || /validation\.test\.ts$/.test(path)) {
    return { label: "TEST", className: "test", filterValue: "test", navAccent: "test" };
  }

  if (fileKind === "service") {
    return { label: "SERVICE", className: "service", filterValue: "service", navAccent: "service" };
  }

  if (fileKind === "react-hook") {
    return { label: "HOOK", className: "hook", filterValue: "hook", navAccent: "hook" };
  }

  if (fileKind === "context-provider") {
    return { label: "CONTEXT PROVIDER", className: "context", filterValue: "context", navAccent: "context" };
  }

  if (["route-page", "feature-screen", "feature-component", "shared-component", "modal-component"].includes(fileKind)) {
    return { label: "REACT COMPONENT", className: "component", filterValue: "component", navAccent: "component" };
  }

  if (fileKind === "integration") {
    return { label: "INTEGRATION", className: "integration", filterValue: "integration", navAccent: "integration" };
  }

  if (fileKind === "documentation") {
    return { label: "DOCUMENTATION", className: "documentation", filterValue: "documentation", navAccent: "documentation" };
  }

  if (fileKind === "edge-function") {
    return { label: "EDGE FUNCTION", className: "edge-fn", filterValue: "edge-fn", navAccent: "edge-fn" };
  }

  if (fileKind === "database-script") {
    return { label: "DB MIGRATION", className: "db-migration", filterValue: "db-migration", navAccent: "db-migration" };
  }

  return { label: "CODE LOGIC", className: "code-logic", filterValue: "code-logic", navAccent: "code-logic" };
}

function getLineCountState(path: string, lineCount: number): LineCountState {
  const override = REFACTOR_TRIAGE_OVERRIDES[path];

  let state: LineCountState;

  if (override?.suppressAutoRefactor) {
    state = {
      badgeClass: lineCount >= 300 ? "is-large" : "",
      description: lineCount >= 300 ? "Large file. Keep an eye on it." : "Healthy size.",
    };
  } else if (lineCount >= 1200) {
    state = {
      badgeClass: "is-refactor-needed",
      description: "File needs refactoring due to being too large.",
      fileSignal: "refactor",
    };
  } else if (lineCount >= 600) {
    state = {
      badgeClass: "is-refactor-soon",
      description: "Consider refactoring soon.",
      rowSignal: "refactor",
    };
  } else if (lineCount >= 300) {
    state = {
      badgeClass: "is-large",
      description: "Large file. Keep an eye on it.",
    };
  } else {
    state = {
      badgeClass: "",
      description: "Healthy size.",
    };
  }

  if (override?.lineBadgeClass) {
    state.badgeClass = override.lineBadgeClass;
  }
  if (override?.lineBadgeDescription) {
    state.description = override.lineBadgeDescription;
  }
  if (override?.fileSignal === "refactor") {
    delete state.rowSignal;
    state.fileSignal = "refactor";
  }

  return state;
}

function rowFilterValue(row: FileRow): FilterValue {
  switch (row.badgeClass) {
    case "component":
      return "component";
    case "feature":
      return "feature";
    case "code-logic":
      return "code-logic";
    case "data-block":
      return "data-block";
    case "context-injection":
      return "context-injection";
    case "edge-fn":
      return "edge-fn";
    case "db-table":
      return "db-table";
    case "integration":
      return "integration";
    case "api-call":
      return "api-call";
    case "hook":
      return "hook";
    case "context":
      return "context";
    case "documentation":
      return "documentation";
    case "tooling":
      return "tooling";
    case "script":
      return "script";
    case "test":
      return "test";
    case "db-migration":
      return "db-migration";
    default:
      return "all";
  }
}

function folderCountLabel(registry: ArchitectureRegistry, node: ArchitectureNode): string {
  if (node.type === "root") {
    const { folders, files } = countDescendants(registry, node.id);
    return `${folders} folders + ${files} files shown`;
  }

  const childNodes = node.childIds
    .map((id) => registry.nodes[id])
    .filter(Boolean);

  if (node.depth === 1) {
    const directFolders = childNodes.filter((child) => child.type === "folder").length;
    const directFiles = childNodes.filter((child) => child.type === "file").length;
    if (directFolders > 0 && directFiles === 0) return `${directFolders} folders shown`;
    if (directFiles > 0 && directFolders === 0) return `${directFiles} files shown`;
    return `${directFolders} folders + ${directFiles} files shown`;
  }

  const { folders, files } = countDescendants(registry, node.id);
  return `${folders + files} items`;
}

function sortChildNodes(nodes: ArchitectureNode[], parent: ArchitectureNode) {
  if (parent.type === "root") {
    const order = new Map(ROOT_CHILD_ORDER.map((name, index) => [name, index]));
    return [...nodes].sort((a, b) => {
      const aOrder = order.get(a.name);
      const bOrder = order.get(b.name);
      if (aOrder !== undefined || bOrder !== undefined) {
        return (aOrder ?? Number.MAX_SAFE_INTEGER) - (bOrder ?? Number.MAX_SAFE_INTEGER);
      }
      return a.name.localeCompare(b.name);
    });
  }

  return [...nodes].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "folder" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

function resolveFileDescription(node: ArchitectureNode) {
  return STATIC_FILE_OVERRIDES[node.path]?.description ?? node.description;
}

function resolveLineCount(path: string, metrics: Record<string, { lineCount: number }>) {
  return metrics[path]?.lineCount ?? STATIC_LINE_COUNT_OVERRIDES[path] ?? 0;
}

function isRenderableUiImport(path: string) {
  return (
    /\.(tsx|jsx)$/.test(path) &&
    (path.includes("/components/") || path.includes("/features/") || path.includes("/pages/"))
  );
}

function isPureLogicImport(path: string) {
  return (
    path.includes("/services/") ||
    path.includes("/hooks/") ||
    path.includes("/contexts/") ||
    path.includes("/integrations/") ||
    path.includes("/lib/") ||
    path.includes("/utils") ||
    path.includes("/types") ||
    path.includes("/data/")
  );
}

function buildAccessValues(fileKind: string, isReactSurface: boolean): string[] {
  if (fileKind === "edge-function") {
    return ["server-side edge runtime with backend access, request validation, and secret-backed execution"];
  }
  if (fileKind === "database-script") {
    return ["database migration scope applied directly to Supabase schema, policy, and RPC state"];
  }
  if (isReactSurface) {
    return ["client-rendered Chronicle workspace UI reached through the main app shell"];
  }
  if (fileKind === "service") {
    return ["client-side service layer called by tabs, builders, modals, and route screens"];
  }
  if (fileKind === "react-hook") {
    return ["client-side shared hook state reused across multiple React components"];
  }
  if (fileKind === "context-provider") {
    return ["application-wide shared state boundary consumed across multiple app surfaces"];
  }
  if (fileKind === "integration") {
    return ["shared provider bridge that downstream files call instead of talking to the external system directly"];
  }
  return [];
}

function buildRequireValues(
  fileKind: string,
  isReactSurface: boolean,
  tables: string[],
  rpcs: string[],
  edgeFunctions: string[],
  storageBuckets: string[],
) {
  const values: string[] = [];

  if (tables.length > 0) {
    values.push("matching live Supabase table names and column contracts");
  }
  if (rpcs.length > 0) {
    values.push("RPC names and parameter shapes stay aligned with the live database");
  }
  if (edgeFunctions.length > 0) {
    values.push("reachable edge-function deployments with accepted request payloads");
  }
  if (storageBuckets.length > 0) {
    values.push("matching storage bucket names and valid storage access rules");
  }
  if (isReactSurface) {
    values.push("the imported UI blocks, state providers, and upstream props stay available");
  } else if (fileKind === "react-hook") {
    values.push("the consuming component tree stays mounted inside the expected React state flow");
  } else if (fileKind === "context-provider") {
    values.push("consumers stay mounted beneath the provider so shared state remains readable");
  }

  return uniqueStrings(values);
}

function buildFileRows(
  node: ArchitectureNode,
  analysis: FileAnalysis,
  lineState: LineCountState,
  knownTables: Set<string>,
  knownRpcs: Set<string>,
  knownEdgeFunctions: Set<string>,
  knownBuckets: Set<string>,
): FileRow[] {
  const staticOverride = STATIC_FILE_OVERRIDES[node.path];
  if (staticOverride) {
    const override = REFACTOR_TRIAGE_OVERRIDES[node.path];
    return staticOverride.rows.map((row) => {
      const rowOverride =
        override?.rowOverrides?.[row.id] ??
        override?.rowOverrides?.[row.title] ??
        override?.rowOverrides?.primary;
      if (!rowOverride) return row;
      return {
        ...row,
        signal: rowOverride.signal ?? row.signal,
        note: rowOverride.note ?? row.note,
      };
    });
  }

  const fileKind = node.fileMeta?.fileKind ?? "source-file";
  const headerBadge = resolveHeaderBadge(node);
  const rows: FileRow[] = [];
  const imports = analysis.imports.slice(0, 8);
  const importedBy = analysis.importedBy.slice(0, 8);
  const tables = analysis.tables;
  const rpcs = analysis.rpcs;
  const edgeFunctions = analysis.edgeFunctions;
  const storageBuckets = analysis.storageBuckets;
  const missingTables = tables.filter((name) => !knownTables.has(name));
  const missingRpcs = rpcs.filter((name) => !knownRpcs.has(name));
  const missingEdgeFunctions = edgeFunctions.filter((name) => !knownEdgeFunctions.has(name));
  const missingBuckets = storageBuckets.filter((name) => !knownBuckets.has(name));
  const isReactSurface = ["route-page", "feature-screen", "feature-component", "shared-component", "modal-component"].includes(fileKind);
  const renderedImports = analysis.imports.filter((value) => isRenderableUiImport(value)).slice(0, 8);
  const logicImports = (
    isReactSurface
      ? analysis.imports.filter((value) => !renderedImports.includes(value) && isPureLogicImport(value))
      : analysis.imports
  ).slice(0, 8);
  const accessValues = buildAccessValues(fileKind, isReactSurface);
  const requireValues = buildRequireValues(fileKind, isReactSurface, tables, rpcs, edgeFunctions, storageBuckets);

  const primaryDetails: DetailLine[] = [];
  if (isReactSurface) {
    pushDetail(primaryDetails, "Renders / Opens", renderedImports, "files");
    pushDetail(primaryDetails, "Uses", logicImports, "files");
  } else {
    pushDetail(primaryDetails, "Uses", imports, "files");
  }
  pushDetail(primaryDetails, "Used By", importedBy, "files");
  pushDetail(primaryDetails, "Access", accessValues, "plain");
  pushDetail(primaryDetails, "Requires", requireValues, "plain");

  if (isReactSurface || fileKind === "react-hook" || fileKind === "context-provider") {
    pushDetail(primaryDetails, tables.length > 1 ? "Uses Tables" : "Uses Table", tables, "tables");
    pushDetail(primaryDetails, "Calls", edgeFunctions, "edges");
    pushDetail(primaryDetails, rpcs.length > 1 ? "Uses RPCs" : "Uses RPC", rpcs, "rpcs");
    pushDetail(primaryDetails, "Uses Storage", storageBuckets, "buckets");
  }

  let badgeLabel: FileRow["badgeLabel"] = "CODE LOGIC";
  let badgeClass: FileRow["badgeClass"] = "code-logic";
  let summary = node.description;
  const rowOverrideMap = REFACTOR_TRIAGE_OVERRIDES[node.path]?.rowOverrides;

  const applyRowOverride = (rowKey: string, row: FileRow): FileRow => {
    const override = rowOverrideMap?.[rowKey] ?? rowOverrideMap?.[row.id];
    if (!override) return row;
    return {
      ...row,
      signal: override.signal ?? row.signal,
      note: override.note ?? row.note,
    };
  };

  if (headerBadge.filterValue === "tooling") {
    badgeLabel = "TOOLING";
    badgeClass = "tooling";
    summary = "Defines the build, generation, or workspace rules that other files and teammates rely on.";
  } else if (headerBadge.filterValue === "script") {
    badgeLabel = "SCRIPT";
    badgeClass = "script";
    summary = "Runs a maintenance or scanning workflow that updates architecture-critical generated data.";
  } else if (headerBadge.filterValue === "test") {
    badgeLabel = "TEST";
    badgeClass = "test";
    summary = "Protects behavior during refactors or deploy checks by verifying the expected flow still works.";
  } else if (isReactSurface) {
    badgeLabel = "REACT COMPONENT";
    badgeClass = "component";
    summary = "Owns the primary UI surface for this file and composes the visible interactions users work through here.";
  } else if (fileKind === "service") {
    badgeLabel = tables.length > 0 || storageBuckets.length > 0 ? "DATA BLOCK" : "CODE LOGIC";
    badgeClass = tables.length > 0 || storageBuckets.length > 0 ? "data-block" : "code-logic";
    summary = tables.length > 0 || storageBuckets.length > 0
      ? "Coordinates persistence and durable data operations for the app layer that depends on this service."
      : "Runs behind-the-scenes orchestration, transformation, and request logic that other files depend on.";
  } else if (fileKind === "react-hook") {
    badgeLabel = "CODE LOGIC";
    badgeClass = "hook";
    summary = "Packages reusable state and behavior so multiple components can share the same interaction logic.";
  } else if (fileKind === "context-provider") {
    badgeLabel = "CODE LOGIC";
    badgeClass = "context";
    summary = "Provides shared state and actions across multiple parts of the app through a context boundary.";
  } else if (fileKind === "edge-function") {
    badgeLabel = "EDGE FUNCTION";
    badgeClass = "edge-fn";
    summary = "Runs server-side logic for the app and acts as the backend entry point for the workflow owned by this file.";
  } else if (fileKind === "integration") {
    badgeLabel = "CODE LOGIC";
    badgeClass = "integration";
    summary = "Bridges the app to an external contract so the rest of the code can use it in a safer, more consistent way.";
  } else if (fileKind === "documentation") {
    badgeLabel = "DOCUMENTATION";
    badgeClass = "documentation";
    summary = "Documents architecture, implementation, or operating behavior that other contributors rely on.";
  } else if (fileKind === "database-script") {
    badgeLabel = "DB MIGRATION";
    badgeClass = "db-migration";
    summary = "Defines schema evolution, policy changes, or SQL behavior for persisted backend data.";
  }

  const primarySecurity =
    tables.length > 0 &&
    (node.path.includes("supabase-data") || node.path.includes("track-ai-usage") || node.path.includes("chat") || /auth|role|policy|secure|usage/i.test(node.path));

  rows.push(
    applyRowOverride("primary", {
      id: `${node.id}-primary`,
      title: createPrimaryTitle(node),
      summary,
      badgeLabel,
      badgeClass,
      details: primaryDetails,
      signal: lineState.rowSignal,
      note: lineState.rowSignal === "refactor" ? "This row should be split out soon because the file is already carrying too much responsibility." : undefined,
      security: primarySecurity,
    }),
  );

  if (tables.length > 0 || rpcs.length > 0 || storageBuckets.length > 0) {
    const persistenceDetails: DetailLine[] = [];
    pushDetail(persistenceDetails, tables.length > 1 ? "Uses Tables" : "Uses Table", tables, "tables");
    pushDetail(persistenceDetails, rpcs.length > 1 ? "Uses RPCs" : "Uses RPC", rpcs, "rpcs");
    pushDetail(persistenceDetails, "Uses Storage", storageBuckets, "buckets");
    pushDetail(persistenceDetails, "Used By", importedBy, "files");
    pushDetail(persistenceDetails, "Access", accessValues, "plain");
    if (tables.length > 0) {
      pushDetail(persistenceDetails, "Requires", ["per-table RLS and ownership checks before durable rows can be changed"], "plain");
    }
    pushDetail(persistenceDetails, "Requires", requireValues, "plain");

    rows.push(
      applyRowOverride("persistence", {
        id: `${node.id}-persistence`,
        title: "Persistence touchpoints",
        summary: "Shows the durable data, RPC, and storage surfaces this file directly depends on.",
        badgeLabel: "DATA BLOCK",
        badgeClass: "data-block",
        details: persistenceDetails,
        security: tables.length > 0,
      }),
    );
  }

  if (edgeFunctions.length > 0) {
    const isPaidApiPath = edgeFunctions.some((name) => PAID_AI_EDGE_FUNCTIONS.has(name));
    const edgeDetails: DetailLine[] = [];
    pushDetail(edgeDetails, "Calls", edgeFunctions, "edges");
    pushDetail(edgeDetails, tables.length > 1 ? "Uses Tables" : "Uses Table", tables, "tables");
    pushDetail(edgeDetails, "Used By", importedBy, "files");
    pushDetail(edgeDetails, "Access", accessValues, "plain");
    pushDetail(edgeDetails, "Requires", requireValues, "plain");
    if (isPaidApiPath) {
      pushDetail(edgeDetails, "Tracks Usage In", ["ai_usage_events"], "plain");
    }

    rows.push(
      applyRowOverride("edge", {
        id: `${node.id}-edge`,
        title: isPaidApiPath ? "Paid AI request path" : "Edge function usage",
        summary: isPaidApiPath
          ? "This row participates in a usage-tracked AI request flow that reaches paid backend inference paths."
          : "This row invokes backend edge functions as part of the runtime behavior in this file.",
        badgeLabel: isPaidApiPath ? "API CALL" : "EDGE FUNCTION",
        badgeClass: isPaidApiPath ? "api-call" : "edge-fn",
        details: edgeDetails,
        security: true,
      }),
    );
  }

  if (missingTables.length > 0 || missingRpcs.length > 0 || missingEdgeFunctions.length > 0 || missingBuckets.length > 0) {
    const mismatchDetails: DetailLine[] = [];
    pushDetail(mismatchDetails, "Code Reference", [...missingTables, ...missingRpcs, ...missingEdgeFunctions, ...missingBuckets], "plain");
    pushDetail(mismatchDetails, "Verified Tables", tables.filter((name) => knownTables.has(name)), "tables");

    rows.push(
      applyRowOverride("mismatch", {
        id: `${node.id}-mismatch`,
        title: "Backend contract mismatch",
        summary: "Code in this file references backend resources that do not appear in the latest live schema inventory.",
        badgeLabel: "CODE LOGIC",
        badgeClass: "code-logic",
        details: mismatchDetails,
        signal: "issue",
        note: "This usually means the code is expecting an old name, a missing migration, or a backend resource that was never created.",
        security: false,
      }),
    );
  }

  return rows;
}

function renderDetailValues(
  line: DetailLine,
  onJumpToFile: (path: string) => void,
  onJumpToSchema: (kind: "table" | "rpc" | "edge" | "bucket", name: string) => void,
) {
  return line.values.map((value, index) => {
    const suffix = index < line.values.length - 1 ? ", " : "";
    if (line.kind === "files") {
      return (
        <React.Fragment key={value}>
          <button type="button" className="jump-link detail-link" onClick={() => onJumpToFile(value)}>
            {value}
          </button>
          {suffix}
        </React.Fragment>
      );
    }
    if (line.kind === "tables") {
      return (
        <React.Fragment key={value}>
          <button type="button" className="jump-link detail-link table-link" onClick={() => onJumpToSchema("table", value)}>
            {value}
          </button>
          {suffix}
        </React.Fragment>
      );
    }
    if (line.kind === "rpcs") {
      return (
        <React.Fragment key={value}>
          <button type="button" className="jump-link detail-link rpc-link" onClick={() => onJumpToSchema("rpc", value)}>
            {value}
          </button>
          {suffix}
        </React.Fragment>
      );
    }
    if (line.kind === "edges") {
      return (
        <React.Fragment key={value}>
          <button type="button" className="jump-link detail-link edge-link" onClick={() => onJumpToSchema("edge", value)}>
            {value}
          </button>
          {suffix}
        </React.Fragment>
      );
    }
    if (line.kind === "buckets") {
      return (
        <React.Fragment key={value}>
          <button type="button" className="jump-link detail-link bucket-link" onClick={() => onJumpToSchema("bucket", value)}>
            {value}
          </button>
          {suffix}
        </React.Fragment>
      );
    }
    return (
      <React.Fragment key={value}>
        <span className="detail-pill">{value}</span>
        {suffix}
      </React.Fragment>
    );
  });
}

function rowMatchesFilter(row: FileRow, currentFilter: FilterValue) {
  if (currentFilter === "all") return true;
  if (currentFilter === "security") return !!row.security;
  return rowFilterValue(row) === currentFilter;
}

function fileMatchesFilter(
  node: ArchitectureNode,
  rows: FileRow[],
  currentFilter: FilterValue,
) {
  if (currentFilter === "all") return true;
  if (currentFilter === "security") return rows.some((row) => row.security);
  const headerBadge = resolveHeaderBadge(node);
  return headerBadge.filterValue === currentFilter || rows.some((row) => rowMatchesFilter(row, currentFilter));
}

function folderMatchesFilter(
  registry: ArchitectureRegistry,
  node: ArchitectureNode,
  currentFilter: FilterValue,
  fileMatchMap: Map<string, boolean>,
): boolean {
  if (currentFilter === "all") return true;
  const queue = [...node.childIds];
  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId) continue;
    const currentNode = registry.nodes[currentId];
    if (!currentNode) continue;
    if (currentNode.type === "file" && fileMatchMap.get(currentNode.id)) return true;
    queue.push(...currentNode.childIds);
  }
  return false;
}

function ArchitectureFileCard({
  node,
  analysis,
  lineCount,
  highlighted,
  currentFilter,
  knownTables,
  knownRpcs,
  knownEdgeFunctions,
  knownBuckets,
  onJumpToFile,
  onJumpToSchema,
  closedDetailIds,
  onDetailToggle,
}: {
  node: ArchitectureNode;
  analysis: FileAnalysis;
  lineCount: number;
  highlighted: boolean;
  currentFilter: FilterValue;
  knownTables: Set<string>;
  knownRpcs: Set<string>;
  knownEdgeFunctions: Set<string>;
  knownBuckets: Set<string>;
  onJumpToFile: (path: string) => void;
  onJumpToSchema: (kind: "table" | "rpc" | "edge" | "bucket", name: string) => void;
  closedDetailIds: Set<string>;
  onDetailToggle: (detailId: string, open: boolean) => void;
}) {
  const headerBadge = resolveHeaderBadge(node);
  const lineState = getLineCountState(node.path, lineCount);
  const triageOverride = REFACTOR_TRIAGE_OVERRIDES[node.path];
  const rows = buildFileRows(node, analysis, lineState, knownTables, knownRpcs, knownEdgeFunctions, knownBuckets);
  const issueRowCount = rows.filter((row) => row.signal === "issue").length;
  const refactorRowCount = rows.filter((row) => row.signal === "refactor").length;
  const hasIssue = issueRowCount > 0;
  const hasRefactor = lineState.fileSignal === "refactor" || refactorRowCount > 0;
  const cardLevelIssue = issueRowCount > 1;
  const cardLevelRefactor = lineState.fileSignal === "refactor" || refactorRowCount > 1;
  const matchesFilter = fileMatchesFilter(node, rows, currentFilter);
  const cardClasses = ["app-card"];
  if (!matchesFilter) cardClasses.push("filter-dim");
  if (cardLevelIssue) cardClasses.push("has-error");
  else if (cardLevelRefactor) cardClasses.push("has-refactor");
  if (highlighted) cardClasses.push("highlighted-card");

  return (
    <article
      id={node.id}
      data-nav-anchor="true"
      data-node-id={node.id}
      className={cardClasses.join(" ")}
    >
      <div className="app-card-header">
        <span className={`tag-header ${headerBadge.className}`}>{headerBadge.label}</span>
        <span className="item-name">{node.name}</span>
        <span className={`line-count-badge ${lineState.badgeClass}`} title={lineState.description}>
          {lineCount.toLocaleString()} lines
        </span>
      </div>

      <div className="app-card-body">
        <div className="app-card-desc">{resolveFileDescription(node)}</div>

        {(lineState.fileSignal === "refactor" || triageOverride?.fileNote) && (
          <div className="inline-size-warning">
            {triageOverride?.fileNote ?? "File needs refactoring due to being too large."}
          </div>
        )}

        {hasIssue && (
          <div className="inline-error-text">
            At least one backend contract in this file does not match the latest schema inventory.
          </div>
        )}

        <div className="app-card-inner">
          {rows.map((row) => {
            const rowDimmed = currentFilter !== "all" && !rowMatchesFilter(row, currentFilter);
            const rowHasRefactor = row.signal === "refactor" && !cardLevelRefactor;
            const rowHasIssue = row.signal === "issue" && !cardLevelIssue;
            const rowClassName = ["detail-block"];
            if (rowDimmed) rowClassName.push("filter-dim");
            if (rowHasRefactor) rowClassName.push("has-refactor");
            if (rowHasIssue) rowClassName.push("has-error");
            const defaultOpen = !closedDetailIds.has(row.id);

            if (row.details.length === 0 && !row.note) {
              const flatRowClassName = ["app-card-row"];
              if (rowDimmed) flatRowClassName.push("filter-dim");
              if (rowHasRefactor) flatRowClassName.push("has-refactor");
              if (rowHasIssue) flatRowClassName.push("has-error");
              return (
                <div key={row.id} className={flatRowClassName.join(" ")}>
                  {row.security && (
                    <img
                      className="security-shield-icon"
                      src={securityShieldIcon}
                      alt=""
                      aria-hidden="true"
                    />
                  )}
                  <span className={`tag-inset ${row.badgeClass}`}>{row.badgeLabel}</span>
                  <div className="detail-summary-text">
                    <span className="sub-name">{row.title}:</span>{" "}
                    <span className="sub-desc">{row.summary}</span>
                  </div>
                </div>
              );
            }

            return (
              <details
                key={row.id}
                className={rowClassName.join(" ")}
                open={defaultOpen}
                onToggle={(event) => onDetailToggle(row.id, event.currentTarget.open)}
              >
                <summary>
                  <div className={`detail-summary-inline ${row.security ? "has-security-icon" : ""}`.trim()}>
                    {row.security && (
                      <img
                        className="security-shield-icon"
                        src={securityShieldIcon}
                        alt=""
                        aria-hidden="true"
                      />
                    )}
                    <span className={`tag-inset ${row.badgeClass}`}>{row.badgeLabel}</span>
                    <div className="detail-summary-text">
                      <span className="sub-name">{row.title}:</span>{" "}
                      <span className="sub-desc">{row.summary}</span>
                    </div>
                  </div>
                </summary>
                <div className="detail-panel">
                  {row.note && (
                    <div className={row.signal === "issue" ? "inline-error-text" : "inline-size-warning"}>
                      {row.note}
                    </div>
                  )}
                  <div className="detail-stack">
                    {row.details.map((line, index) => (
                      <div key={`${row.id}-${line.label}-${index}`} className="detail-line">
                        <strong title={DETAIL_HELPERS[line.label] || line.label}>{line.label}:</strong>{" "}
                        {renderDetailValues(line, onJumpToFile, onJumpToSchema)}
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </article>
  );
}

function TreeFolder({
  registry,
  node,
  openFolderIds,
  onToggle,
  highlightedId,
  fileAnalysis,
  metrics,
  currentFilter,
  fileMatchMap,
  knownTables,
  knownRpcs,
  knownEdgeFunctions,
  knownBuckets,
  onJumpToFile,
  onJumpToSchema,
  closedDetailIds,
  onDetailToggle,
}: {
  registry: ArchitectureRegistry;
  node: ArchitectureNode;
  openFolderIds: Set<string>;
  onToggle: (nodeId: string) => void;
  highlightedId: string | null;
  fileAnalysis: Record<string, FileAnalysis>;
  metrics: Record<string, { lineCount: number }>;
  currentFilter: FilterValue;
  fileMatchMap: Map<string, boolean>;
  knownTables: Set<string>;
  knownRpcs: Set<string>;
  knownEdgeFunctions: Set<string>;
  knownBuckets: Set<string>;
  onJumpToFile: (path: string) => void;
  onJumpToSchema: (kind: "table" | "rpc" | "edge" | "bucket", name: string) => void;
  closedDetailIds: Set<string>;
  onDetailToggle: (detailId: string, open: boolean) => void;
}) {
  const isOpen = openFolderIds.has(node.id);
  const matchesFilter = folderMatchesFilter(registry, node, currentFilter, fileMatchMap);
  const childNodes = sortChildNodes(
    node.childIds.map((nodeId) => registry.nodes[nodeId]).filter(Boolean) as ArchitectureNode[],
    node,
  );

  return (
    <div className={`tree-node ${isOpen ? "open" : ""} ${node.type === "root" ? "root-node" : ""}`.trim()}>
      <button
        type="button"
        className={`folder-row ${node.type === "root" ? "is-root" : ""} ${currentFilter !== "all" && !matchesFilter ? "filter-dim" : ""}`.trim()}
        data-nav-anchor="true"
        data-node-id={node.id}
        onClick={() => onToggle(node.id)}
      >
        <div className="chevron" aria-hidden="true" />
        <img className={`folder-icon-image ${node.type === "root" ? "is-root-folder" : ""}`.trim()} src={FOLDER_ICON_DATA_URI} alt="" aria-hidden="true" />
        <span className="folder-label">{node.name}</span>
        <span className="folder-desc">— {node.description}</span>
        <span className="folder-count">{folderCountLabel(registry, node)}</span>
      </button>

      <div className="children">
        {childNodes.map((child) => {
          if (child.type === "folder") {
            return (
              <TreeFolder
                key={child.id}
                registry={registry}
                node={child}
                openFolderIds={openFolderIds}
                onToggle={onToggle}
                highlightedId={highlightedId}
                fileAnalysis={fileAnalysis}
                metrics={metrics}
                currentFilter={currentFilter}
                fileMatchMap={fileMatchMap}
                knownTables={knownTables}
                knownRpcs={knownRpcs}
                knownEdgeFunctions={knownEdgeFunctions}
                knownBuckets={knownBuckets}
                onJumpToFile={onJumpToFile}
                onJumpToSchema={onJumpToSchema}
                closedDetailIds={closedDetailIds}
                onDetailToggle={onDetailToggle}
              />
            );
          }

          return (
            <div key={child.id} className="item-row">
              <ArchitectureFileCard
                node={child}
                analysis={fileAnalysis[child.path] ?? {
                  imports: [],
                  importedBy: [],
                  tables: [],
                  rpcs: [],
                  edgeFunctions: [],
                  storageBuckets: [],
                }}
                lineCount={resolveLineCount(child.path, metrics)}
                highlighted={highlightedId === child.id}
                currentFilter={currentFilter}
                knownTables={knownTables}
                knownRpcs={knownRpcs}
                knownEdgeFunctions={knownEdgeFunctions}
                knownBuckets={knownBuckets}
                onJumpToFile={onJumpToFile}
                onJumpToSchema={onJumpToSchema}
                closedDetailIds={closedDetailIds}
                onDetailToggle={onDetailToggle}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NavSnapshotGroup({
  entries,
  nodeByPath,
  activeNavId,
  onJump,
  nested = false,
}: {
  entries: NavSnapshotEntry[];
  nodeByPath: Map<string, ArchitectureNode>;
  activeNavId: string | null;
  onJump: (nodeId: string) => void;
  nested?: boolean;
}) {
  return (
    <div className={nested ? "nav-tree-group nav-tree-group--nested" : "nav-tree-group"}>
      {entries.map((entry) => {
        const node = nodeByPath.get(entry.path);
        if (!node) return null;

        if (entry.kind === "folder") {
          return (
            <div key={node.id} className="nav-branch">
              <button
                type="button"
                className={`nav-branch-link nav-jump-link ${activeNavId === node.id ? "active" : ""}`.trim()}
                data-nav-id={node.id}
                title={`${node.name}\nFolder`}
                onClick={() => onJump(node.id)}
              >
                <span className="nav-link-body">
                  <span className="nav-link-label">{node.name}</span>
                </span>
              </button>
              {entry.children.length > 0 && (
                <NavSnapshotGroup entries={entry.children} nodeByPath={nodeByPath} activeNavId={activeNavId} onJump={onJump} nested />
              )}
            </div>
          );
        }

        const badge = resolveHeaderBadge(node);
        return (
          <button
            key={node.id}
            type="button"
            className={`nav-tree-item nav-accent-${badge.navAccent} nav-jump-link ${activeNavId === node.id ? "active" : ""}`.trim()}
            data-nav-id={node.id}
            title={`${node.name}\n${badge.label}`}
            onClick={() => onJump(node.id)}
          >
            <span className="nav-link-body">
              <span className="nav-link-label">{node.name}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ArchitectureLegend({ open }: { open: boolean }) {
  return (
    <div id="legend" className={`legend ${open ? "open" : ""}`.trim()}>
      <div className="legend-shell">
        <div className="legend-shell-header">
          <div className="legend-shell-kicker">Visual System</div>
          <h3 className="legend-shell-title">App Architecture Page Legend</h3>
        </div>

        <div className="legend-shell-body">
          <div className="legend-main-grid">
            <section className="legend-card">
              <div className="legend-card-kicker">Badge Meanings</div>
              <h4 className="legend-card-title">What each label communicates</h4>

              <div className="legend-definition-grid">
                <div className="legend-definition-item"><span className="tag-dark code-logic">Code Logic</span><p className="legend-definition-copy">App logic, calculations, processing behavior, orchestration, validation, or state transitions.</p></div>
                <div className="legend-definition-item"><span className="tag-dark feature">Feature</span><p className="legend-definition-copy">A specific capability or behavior inside a file or component.</p></div>
                <div className="legend-definition-item"><span className="tag-dark component">React Component</span><p className="legend-definition-copy">A named React UI block exported from a file.</p></div>
                <div className="legend-definition-item"><span className="tag-dark service">Service</span><p className="legend-definition-copy">Backend data/API service logic that the UI depends on.</p></div>
                <div className="legend-definition-item"><span className="tag-dark hook">Hook</span><p className="legend-definition-copy">Reusable React state or behavior shared across components.</p></div>
                <div className="legend-definition-item"><span className="tag-dark context">Context Provider</span><p className="legend-definition-copy">App-wide shared state delivered through React context.</p></div>
                <div className="legend-definition-item"><span className="tag-dark context-injection">Context Injection</span><p className="legend-definition-copy">Runtime values inserted into a prompt, message, or outgoing request.</p></div>
                <div className="legend-definition-item"><span className="tag-dark data-block">Data Block</span><p className="legend-definition-copy">A chunk of structured persistence, CRUD, or grouped data shape.</p></div>
                <div className="legend-definition-item"><span className="tag-dark edge-fn">Edge Function</span><p className="legend-definition-copy">Server-side function logic that runs off the client.</p></div>
                <div className="legend-definition-item"><span className="tag-dark db-table">Database Table</span><p className="legend-definition-copy">A persisted Supabase table the app reads from or writes to.</p></div>
                <div className="legend-definition-item"><span className="tag-dark integration">Integration</span><p className="legend-definition-copy">Bridge code that connects the app to something external like Supabase.</p></div>
                <div className="legend-definition-item"><span className="tag-dark api-call">API Call</span><p className="legend-definition-copy">Participates in a paid AI request path such as Call 1, Call 2, or a single isolated call.</p></div>
                <div className="legend-definition-item"><span className="tag-dark documentation">Documentation</span><p className="legend-definition-copy">Human-readable guides that define page structure, architecture rules, and intended behavior.</p></div>
                <div className="legend-definition-item"><span className="tag-dark tooling">Tooling</span><p className="legend-definition-copy">Build, registry, or workspace configuration that changes how the app runs or is generated.</p></div>
                <div className="legend-definition-item"><span className="tag-dark script">Script</span><p className="legend-definition-copy">Utility or automation code that scans, syncs, verifies, or generates architecture-critical data.</p></div>
                <div className="legend-definition-item"><span className="tag-dark test">Test</span><p className="legend-definition-copy">Coverage that protects app behavior during refactors or deploy checks.</p></div>
                <div className="legend-definition-item"><span className="tag-dark db-migration">DB Migration</span><p className="legend-definition-copy">SQL schema change, policy update, or RPC definition applied to the backend data layer.</p></div>
                <div className="legend-definition-item">
                  <span className="legend-security-badge">
                    <img src={securityShieldIcon} alt="" aria-hidden="true" />
                    Security Control
                  </span>
                  <p className="legend-definition-copy">Marks code that actively enforces auth, ownership, RLS, or another protection boundary.</p>
                </div>
              </div>
            </section>

            <section className="legend-card">
              <div className="legend-card-kicker">Signals + Health</div>
              <h4 className="legend-card-title">How status appears on the map</h4>

              <div className="legend-signal-grid">
                <div className="legend-signal-item">
                  <div className="legend-signal-label">Blue Card</div>
                  <div className="legend-signal-preview-card is-blue-card">
                    <div className="legend-preview-mini-header" />
                    <div className="legend-preview-mini-row">
                      <span className="tag-inset feature">Refactor</span>
                      <span className="legend-preview-mini-copy">File-level refactor</span>
                    </div>
                  </div>
                  <p className="legend-signal-copy">Use when the planned change affects 2 or more rows, or the file is being split, moved, renamed, or structurally reorganized.</p>
                </div>

                <div className="legend-signal-item">
                  <div className="legend-signal-label">Blue Row</div>
                  <div className="legend-signal-preview-shell">
                    <div className="legend-preview-mini-row is-blue-row">
                      <span className="tag-inset feature">Refactor</span>
                      <span className="legend-preview-mini-copy">Local cleanup</span>
                    </div>
                  </div>
                  <p className="legend-signal-copy">Use when only one specific row or sub-flow is being cleaned up.</p>
                </div>

                <div className="legend-signal-item">
                  <div className="legend-signal-label">Red Card</div>
                  <div className="legend-signal-preview-card is-red-card">
                    <div className="legend-preview-mini-header" />
                    <div className="legend-preview-mini-row">
                      <span className="tag-inset edge-fn">Issue</span>
                      <span className="legend-preview-mini-copy">File-wide breakage</span>
                    </div>
                  </div>
                  <p className="legend-signal-copy">Use when 2 or more rows are broken, or one file-level failure affects the whole module.</p>
                </div>

                <div className="legend-signal-item">
                  <div className="legend-signal-label">Red Row</div>
                  <div className="legend-signal-preview-shell">
                    <div className="legend-preview-mini-row is-red-row">
                      <span className="tag-inset edge-fn">Issue</span>
                      <span className="legend-preview-mini-copy">Isolated breakage</span>
                    </div>
                  </div>
                  <p className="legend-signal-copy">Use when exactly one dependency, table, or sub-component is broken and the rest of the file still basically works.</p>
                </div>
              </div>

              <div className="legend-health-block">
                <div className="legend-health-title">Line Count Health</div>
                <div className="legend-health-list">
                  <div className="legend-health-row"><span className="line-count-badge">299 lines</span><span className="legend-health-copy">Healthy size. Usually safe to leave alone.</span></div>
                  <div className="legend-health-row"><span className="line-count-badge is-large">428 lines</span><span className="legend-health-copy">Large file. Keep an eye on it.</span></div>
                  <div className="legend-health-row"><span className="line-count-badge is-refactor-soon">612 lines</span><span className="legend-health-copy">Consider refactoring soon.</span></div>
                  <div className="legend-health-row"><span className="line-count-badge is-refactor-needed">1,200 lines</span><span className="legend-health-copy">Refactoring needed.</span></div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function SchemaSection({
  currentFilter,
  highlightedId,
  closedSchemaIds,
  onSchemaToggle,
  schemaTables,
  schemaFunctions,
  storageBuckets,
  edgeFunctions,
  tableUsageMap,
  rpcUsageMap,
  bucketUsageMap,
  edgeUsageMap,
  onJumpToFile,
  onJumpToSchema,
}: {
  currentFilter: FilterValue;
  highlightedId: string | null;
  closedSchemaIds: Set<string>;
  onSchemaToggle: (schemaId: string, open: boolean) => void;
  schemaTables: Array<[string, SchemaTable]>;
  schemaFunctions: SchemaFunction[];
  storageBuckets: SchemaBucket[];
  edgeFunctions: SchemaEdgeFunction[];
  tableUsageMap: Map<string, string[]>;
  rpcUsageMap: Map<string, string[]>;
  bucketUsageMap: Map<string, string[]>;
  edgeUsageMap: Map<string, string[]>;
  onJumpToFile: (path: string) => void;
  onJumpToSchema: (kind: "table" | "rpc" | "edge" | "bucket", name: string) => void;
}) {
  const tableDim = currentFilter !== "all" && currentFilter !== "db-table" && currentFilter !== "security";
  const rpcDim = currentFilter !== "all" && currentFilter !== "code-logic";
  const bucketDim = currentFilter !== "all" && currentFilter !== "data-block";
  const edgeDim = currentFilter !== "all" && currentFilter !== "edge-fn" && currentFilter !== "api-call" && currentFilter !== "security";

  return (
    <section className={`backend-section ${currentFilter !== "all" ? "filter-mode-active" : ""}`.trim()}>
      <div className="backend-title">Backend Inventory</div>

      <div className="schema-block-list">
        {schemaTables.map(([tableName, table]) => {
          const fileUsers = tableUsageMap.get(tableName) ?? [];
          const schemaId = `schema-table-${tableName}`;
          const hasSecurity = table.rls_policies.length > 0;
          return (
            <details
              key={tableName}
              id={schemaId}
              className={`schema-block ${tableDim ? "filter-dim" : ""} ${highlightedId === schemaId ? "highlighted-card" : ""}`.trim()}
              open={!closedSchemaIds.has(schemaId)}
              onToggle={(event) => onSchemaToggle(schemaId, event.currentTarget.open)}
            >
              <summary>
                <div className="schema-summary-inline">
                  <span className="tag-inset db-table">DATABASE TABLE</span>
                  {hasSecurity && (
                    <img className="security-shield-icon" src={securityShieldIcon} alt="" aria-hidden="true" />
                  )}
                  <span className="sub-name">{tableName}</span>
                  <span className="sub-desc">
                    {table.columns.length} columns • {table.indexes.length} indexes • {table.rls_policies.length} RLS policies
                  </span>
                </div>
              </summary>
              <div className="schema-panel">
                <div className="schema-grid">
                  <div className="schema-stat">
                    <span className="schema-stat-label">Columns</span>
                    <span className="schema-stat-value">{table.columns.length}</span>
                  </div>
                  <div className="schema-stat">
                    <span className="schema-stat-label">Foreign Keys</span>
                    <span className="schema-stat-value">{table.foreign_keys.length}</span>
                  </div>
                  <div className="schema-stat">
                    <span className="schema-stat-label">RLS</span>
                    <span className="schema-stat-value">{table.rls_policies.length}</span>
                  </div>
                </div>
                {fileUsers.length > 0 && (
                  <div className="detail-line">
                    <strong>Used By:</strong>{" "}
                    {fileUsers.map((filePath) => (
                      <button key={filePath} type="button" className="jump-link detail-link" onClick={() => onJumpToFile(filePath)}>
                        {filePath}
                      </button>
                    ))}
                  </div>
                )}
                <div className="schema-columns">
                  <div className="schema-columns-title">Table Columns</div>
                  <div className="schema-column-list">
                    {table.columns.map((column: SchemaTable["columns"][number]) => (
                      <div key={column.name} className="schema-column">
                        <div className="schema-column-name">{column.name}</div>
                        <div className="schema-column-type">{column.type}</div>
                        <div className="schema-column-meta">
                          Nullable: {column.nullable ? "yes" : "no"}<br />
                          Default: {column.default ?? "none"}
                          {"primary_key" in column && column.primary_key ? <><br />Primary key: yes</> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {table.indexes.length > 0 && (
                  <div className="schema-list" style={{ marginTop: 10 }}>
                    <strong>Indexes:</strong> {table.indexes.join(" • ")}
                  </div>
                )}
                {table.rls_policies.length > 0 && (
                  <div className="schema-list" style={{ marginTop: 10 }}>
                    <strong>RLS:</strong> {table.rls_policies.map((policy: SchemaTable["rls_policies"][number]) => policy.name).join(" • ")}
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </div>

      <div className="schema-block-list">
        {schemaFunctions.map((item) => {
          const schemaId = `schema-rpc-${item.name}`;
          return (
            <details
              key={item.name}
              id={schemaId}
              className={`schema-block ${rpcDim ? "filter-dim" : ""} ${highlightedId === schemaId ? "highlighted-card" : ""}`.trim()}
              open={!closedSchemaIds.has(schemaId)}
              onToggle={(event) => onSchemaToggle(schemaId, event.currentTarget.open)}
            >
              <summary>
                <div className="schema-summary-inline">
                  <span className="tag-inset code-logic">CODE LOGIC</span>
                  <span className="sub-name">{item.name}</span>
                  <span className="sub-desc">{item.security} security • touches {item.touches.join(", ") || "no tables listed"}</span>
                </div>
              </summary>
              <div className="schema-panel">
                <div className="schema-description">{item.description}</div>
                {(rpcUsageMap.get(item.name) ?? []).length > 0 && (
                  <div className="detail-line" style={{ marginTop: 10 }}>
                    <strong>Used By:</strong>{" "}
                    {(rpcUsageMap.get(item.name) ?? []).map((filePath) => (
                      <button key={filePath} type="button" className="jump-link detail-link" onClick={() => onJumpToFile(filePath)}>
                        {filePath}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </div>

      <div className="schema-block-list">
        {storageBuckets.map((item) => {
          const schemaId = `schema-bucket-${item.name}`;
          return (
            <details
              key={item.name}
              id={schemaId}
              className={`schema-block ${bucketDim ? "filter-dim" : ""} ${highlightedId === schemaId ? "highlighted-card" : ""}`.trim()}
              open={!closedSchemaIds.has(schemaId)}
              onToggle={(event) => onSchemaToggle(schemaId, event.currentTarget.open)}
            >
              <summary>
                <div className="schema-summary-inline">
                  <span className="tag-inset data-block">DATA BLOCK</span>
                  <span className="sub-name">{item.name}</span>
                  <span className="sub-desc">{item.public ? "Public bucket" : "Private bucket"}</span>
                </div>
              </summary>
              <div className="schema-panel">
                {(bucketUsageMap.get(item.name) ?? []).length > 0 ? (
                  <div className="detail-line">
                    <strong>Used By:</strong>{" "}
                    {(bucketUsageMap.get(item.name) ?? []).map((filePath) => (
                      <button key={filePath} type="button" className="jump-link detail-link" onClick={() => onJumpToFile(filePath)}>
                        {filePath}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="schema-description">No direct storage bucket reference was found in the scanned frontend/backend code files.</div>
                )}
              </div>
            </details>
          );
        })}
      </div>

      <div className="schema-block-list">
        {edgeFunctions.map((item) => {
          const schemaId = `schema-edge-${item.name}`;
          const isPaidApiPath = PAID_AI_EDGE_FUNCTIONS.has(item.name);
          return (
            <details
              key={item.name}
              id={schemaId}
              className={`schema-block ${edgeDim ? "filter-dim" : ""} ${highlightedId === schemaId ? "highlighted-card" : ""}`.trim()}
              open={!closedSchemaIds.has(schemaId)}
              onToggle={(event) => onSchemaToggle(schemaId, event.currentTarget.open)}
            >
              <summary>
                <div className="schema-summary-inline">
                  <span className={`tag-inset ${isPaidApiPath ? "api-call" : "edge-fn"}`}>{isPaidApiPath ? "API CALL" : "EDGE FUNCTION"}</span>
                  <img className="security-shield-icon" src={securityShieldIcon} alt="" aria-hidden="true" />
                  <span className="sub-name">{item.name}</span>
                  <span className="sub-desc">Touches {item.tables_referenced.join(", ") || "no tables listed"}</span>
                </div>
              </summary>
              <div className="schema-panel">
                <div className="detail-line">
                  <strong>Uses Tables:</strong>{" "}
                  {item.tables_referenced.map((tableName) => (
                    <button key={tableName} type="button" className="jump-link detail-link table-link" onClick={() => onJumpToSchema("table", tableName)}>
                      {tableName}
                    </button>
                  ))}
                </div>
                {(edgeUsageMap.get(item.name) ?? []).length > 0 && (
                  <div className="detail-line" style={{ marginTop: 10 }}>
                    <strong>Used By:</strong>{" "}
                    {(edgeUsageMap.get(item.name) ?? []).map((filePath) => (
                      <button key={filePath} type="button" className="jump-link detail-link" onClick={() => onJumpToFile(filePath)}>
                        {filePath}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}

export default function AppArchitecturePage() {
  const navigate = useNavigate();
  const baselineRegistry = useMemo(() => buildArchitectureRegistry(GENERATED_PATHS, "Chronicle-main"), []);
  const registry = baselineRegistry;
  const rootNode = registry.nodes[registry.rootId];
  const nodeByPath = useMemo(() => {
    const map = new Map<string, ArchitectureNode>();
    Object.values(registry.nodes).forEach((node) => {
      map.set(node.path, node);
    });
    return map;
  }, [registry]);

  const schemaTables = useMemo<Array<[string, SchemaTable]>>(
    () => Object.entries(databaseSchemaInventory.tables).sort((a, b) => a[0].localeCompare(b[0])) as Array<[string, SchemaTable]>,
    [],
  );
  const schemaFunctions = useMemo<SchemaFunction[]>(
    () => [...databaseSchemaInventory.database_functions].sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );
  const storageBuckets = useMemo<SchemaBucket[]>(
    () => [...databaseSchemaInventory.storage_buckets].sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );
  const edgeFunctions = useMemo<SchemaEdgeFunction[]>(
    () => [...databaseSchemaInventory.edge_functions].sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  const knownTables = useMemo(() => new Set(schemaTables.map(([name]) => name)), [schemaTables]);
  const knownRpcs = useMemo(() => new Set(schemaFunctions.map((item) => item.name)), [schemaFunctions]);
  const knownBuckets = useMemo(() => new Set(storageBuckets.map((item) => item.name)), [storageBuckets]);
  const knownEdgeFunctions = useMemo(() => new Set(edgeFunctions.map((item) => item.name)), [edgeFunctions]);

  const initialClosedDetailIds = useMemo(() => {
    const next = new Set<string>();
    Object.values(registry.nodes).forEach((node) => {
      if (node.type !== "file") return;
      const analysis = architectureFileAnalysis[node.path] ?? {
        imports: [],
        importedBy: [],
        tables: [],
        rpcs: [],
        edgeFunctions: [],
        storageBuckets: [],
      };
      const rows = buildFileRows(
        node,
        analysis,
        getLineCountState(node.path, resolveLineCount(node.path, architectureFileMetrics)),
        knownTables,
        knownRpcs,
        knownEdgeFunctions,
        knownBuckets,
      );
      rows.forEach((row) => {
        if (row.details.length > 0 || row.note) {
          next.add(row.id);
        }
      });
    });
    return next;
  }, [registry, knownTables, knownRpcs, knownEdgeFunctions, knownBuckets]);

  const [openFolderIds, setOpenFolderIds] = useState<Set<string>>(() => {
    const next = new Set<string>();
    Object.values(registry.nodes).forEach((node) => {
      if (node.type === "root" || node.type === "folder") {
        next.add(node.id);
      }
    });
    return next;
  });
  const [closedDetailIds, setClosedDetailIds] = useState<Set<string>>(() => new Set(initialClosedDetailIds));
  const [closedSchemaIds, setClosedSchemaIds] = useState<Set<string>>(() => new Set());
  const [showLegend, setShowLegend] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<FilterValue>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [activeNavId, setActiveNavId] = useState<string | null>(rootNode?.id ?? null);
  const filterRef = useRef<HTMLDivElement>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const navRailRef = useRef<HTMLDivElement>(null);

  const fileMatchMap = useMemo(() => {
    const map = new Map<string, boolean>();
    Object.values(registry.nodes).forEach((node) => {
      if (node.type !== "file") return;
      const analysis = architectureFileAnalysis[node.path] ?? {
        imports: [],
        importedBy: [],
        tables: [],
        rpcs: [],
        edgeFunctions: [],
        storageBuckets: [],
      };
      const rows = buildFileRows(
        node,
        analysis,
        getLineCountState(node.path, resolveLineCount(node.path, architectureFileMetrics)),
        knownTables,
        knownRpcs,
        knownEdgeFunctions,
        knownBuckets,
      );
      map.set(node.id, fileMatchesFilter(node, rows, currentFilter));
    });
    return map;
  }, [registry, currentFilter, knownTables, knownRpcs, knownEdgeFunctions, knownBuckets]);

  const tableUsageMap = useMemo(() => {
    const map = new Map<string, string[]>();
    Object.entries(architectureFileAnalysis).forEach(([filePath, analysis]) => {
      analysis.tables.forEach((tableName) => {
        if (!map.has(tableName)) map.set(tableName, []);
        map.get(tableName)?.push(filePath);
      });
    });
    for (const [key, value] of map.entries()) {
      map.set(key, uniqueStrings(value).sort((a, b) => a.localeCompare(b)));
    }
    return map;
  }, []);

  const rpcUsageMap = useMemo(() => {
    const map = new Map<string, string[]>();
    Object.entries(architectureFileAnalysis).forEach(([filePath, analysis]) => {
      analysis.rpcs.forEach((name) => {
        if (!map.has(name)) map.set(name, []);
        map.get(name)?.push(filePath);
      });
    });
    for (const [key, value] of map.entries()) {
      map.set(key, uniqueStrings(value).sort((a, b) => a.localeCompare(b)));
    }
    return map;
  }, []);

  const bucketUsageMap = useMemo(() => {
    const map = new Map<string, string[]>();
    Object.entries(architectureFileAnalysis).forEach(([filePath, analysis]) => {
      analysis.storageBuckets.forEach((name) => {
        if (!map.has(name)) map.set(name, []);
        map.get(name)?.push(filePath);
      });
    });
    for (const [key, value] of map.entries()) {
      map.set(key, uniqueStrings(value).sort((a, b) => a.localeCompare(b)));
    }
    return map;
  }, []);

  const edgeUsageMap = useMemo(() => {
    const map = new Map<string, string[]>();
    Object.entries(architectureFileAnalysis).forEach(([filePath, analysis]) => {
      analysis.edgeFunctions.forEach((name) => {
        if (!map.has(name)) map.set(name, []);
        map.get(name)?.push(filePath);
      });
    });
    for (const [key, value] of map.entries()) {
      map.set(key, uniqueStrings(value).sort((a, b) => a.localeCompare(b)));
    }
    return map;
  }, []);

  useEffect(() => {
    if (!highlightedId) return;
    const timeout = window.setTimeout(() => setHighlightedId(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [highlightedId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!filterRef.current?.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const navRoot = navRailRef.current;
    if (!navRoot || !activeNavId) return;
    const activeElement = navRoot.querySelector<HTMLElement>(`[data-nav-id="${CSS.escape(activeNavId)}"]`);
    if (!activeElement) return;
    activeElement.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
  }, [activeNavId]);

  useEffect(() => {
    const scroller = mainScrollRef.current;
    if (!scroller) return;
    let frame = 0;

    const updateActive = () => {
      frame = 0;
      const anchors = Array.from(scroller.querySelectorAll<HTMLElement>("[data-nav-anchor='true']"));
      if (anchors.length === 0) return;

      const viewportTop = scroller.getBoundingClientRect().top + 92;
      let bestId: string | null = null;
      let bestScore = Number.POSITIVE_INFINITY;

      anchors.forEach((anchor) => {
        const rect = anchor.getBoundingClientRect();
        if (rect.bottom < viewportTop - 32 || rect.top > window.innerHeight - 60) return;
        const score = Math.abs(rect.top - viewportTop);
        if (score < bestScore) {
          bestScore = score;
          bestId = anchor.dataset.nodeId ?? null;
        }
      });

      if (bestId) {
        setActiveNavId(bestId);
      }
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateActive);
    };

    updateActive();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const revealNode = useCallback((nodeId: string, behavior: ScrollBehavior = "smooth") => {
    const node = registry.nodes[nodeId];
    if (!node) return;

    setOpenFolderIds((current) => {
      const next = new Set(current);
      let cursor: ArchitectureNode | undefined = node;
      while (cursor?.parentId) {
        next.add(cursor.parentId);
        cursor = registry.nodes[cursor.parentId];
      }
      if (node.type === "folder" || node.type === "root") next.add(node.id);
      return next;
    });

    setActiveNavId(nodeId);
    setHighlightedId(nodeId);
    window.requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(`[data-node-id="${CSS.escape(nodeId)}"]`);
      target?.scrollIntoView({ behavior, block: "center" });
    });
  }, [registry.nodes]);

  const revealFile = useCallback((filePath: string) => {
    const target = nodeByPath.get(filePath);
    if (!target) return;
    revealNode(target.id);
  }, [nodeByPath, revealNode]);

  const revealSchema = useCallback((kind: "table" | "rpc" | "edge" | "bucket", name: string) => {
    const schemaId = `schema-${kind}-${name}`;
    setHighlightedId(schemaId);
    window.requestAnimationFrame(() => {
      document.getElementById(schemaId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, []);

  const handleToggleFolder = useCallback((nodeId: string) => {
    setOpenFolderIds((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const handleDetailToggle = useCallback((detailId: string, open: boolean) => {
    setClosedDetailIds((current) => {
      const next = new Set(current);
      if (open) next.delete(detailId);
      else next.add(detailId);
      return next;
    });
  }, []);

  const handleSchemaToggle = useCallback((schemaId: string, open: boolean) => {
    setClosedSchemaIds((current) => {
      const next = new Set(current);
      if (open) next.delete(schemaId);
      else next.add(schemaId);
      return next;
    });
  }, []);

  if (!rootNode) return null;

  return (
    <div className="app-architecture-page">
      <style>{architectureStyles}</style>

      <header className="header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={() => navigate("/?tab=admin&adminTool=style_guide")}
            className="p-2 text-[hsl(var(--ui-surface-2))] hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Go back"
            title="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <h1 className="page-title" style={{ margin: 0 }}>App Architecture</h1>
        </div>

        <div className="header-filter-wrap">
          <div className="architecture-filter-dropdown" ref={filterRef}>
          <button
            type="button"
            className="architecture-filter-trigger"
            onClick={() => setIsFilterOpen((value) => !value)}
            aria-haspopup="menu"
            aria-expanded={isFilterOpen}
          >
            <span className="architecture-filter-trigger-label">Filter</span>
            <span className="architecture-filter-trigger-current">
              {FILTER_OPTIONS.find((option) => option.value === currentFilter)?.label ?? "All"}
            </span>
            <ChevronDown className="architecture-filter-trigger-chevron" />
          </button>

          {isFilterOpen && (
            <div className="architecture-filter-menu" role="menu">
              {FILTER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`architecture-filter-option ${currentFilter === option.value ? "is-active" : ""}`.trim()}
                  onClick={() => {
                    setCurrentFilter(option.value);
                    setIsFilterOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
        </div>

        <button
          type="button"
          className="legend-toggle-btn"
          aria-expanded={showLegend}
          aria-controls="legend"
          onClick={() => setShowLegend((value) => !value)}
        >
          {showLegend ? "Hide Legend" : "View Legend"}
        </button>
      </header>

      <div className="page-shell">
        <aside className="nav-rail-shell">
          <div className="nav-rail-body" ref={navRailRef}>
            <button
              type="button"
              className={`nav-root-link ${activeNavId === rootNode.id ? "active" : ""}`.trim()}
              data-nav-id={rootNode.id}
              title={`${rootNode.name}\nFolder`}
              onClick={() => revealNode(rootNode.id)}
            >
              {rootNode.name}
            </button>

            <div className="nav-section-stack">
              {CURATED_NAV_SECTIONS.map((section) => {
                const sectionNode = section.path ? nodeByPath.get(section.path) : null;
                const sectionId = sectionNode?.id ?? section.title;

                return (
                  <section key={sectionId} className="nav-section">
                    {sectionNode ? (
                      <button
                        type="button"
                        className={`nav-section-link ${activeNavId === sectionNode.id ? "active" : ""}`.trim()}
                        data-nav-id={sectionNode.id}
                        title={`${sectionNode.name}\nFolder`}
                        onClick={() => revealNode(sectionNode.id)}
                      >
                        {sectionNode.name}
                      </button>
                    ) : (
                      <div className="nav-section-title">{section.title}</div>
                    )}

                    <NavSnapshotGroup
                      entries={section.children}
                      nodeByPath={nodeByPath}
                      activeNavId={activeNavId}
                      onJump={revealNode}
                    />
                  </section>
                );
              })}
            </div>
          </div>
        </aside>

        <main className="page-main">
          <div ref={mainScrollRef} className="content" id="app-architecture-content">
            <ArchitectureLegend open={showLegend} />

            <div className={`tree architecture-tree ${currentFilter !== "all" ? "filter-mode-active" : ""}`.trim()}>
              <TreeFolder
                registry={registry}
                node={rootNode}
                openFolderIds={openFolderIds}
                onToggle={handleToggleFolder}
                highlightedId={highlightedId}
                fileAnalysis={architectureFileAnalysis}
                metrics={architectureFileMetrics}
                currentFilter={currentFilter}
                fileMatchMap={fileMatchMap}
                knownTables={knownTables}
                knownRpcs={knownRpcs}
                knownEdgeFunctions={knownEdgeFunctions}
                knownBuckets={knownBuckets}
                onJumpToFile={revealFile}
                onJumpToSchema={revealSchema}
                closedDetailIds={closedDetailIds}
                onDetailToggle={handleDetailToggle}
              />
            </div>

            <SchemaSection
              currentFilter={currentFilter}
              highlightedId={highlightedId}
              closedSchemaIds={closedSchemaIds}
              onSchemaToggle={handleSchemaToggle}
              schemaTables={schemaTables}
              schemaFunctions={schemaFunctions}
              storageBuckets={storageBuckets}
              edgeFunctions={edgeFunctions}
              tableUsageMap={tableUsageMap}
              rpcUsageMap={rpcUsageMap}
              bucketUsageMap={bucketUsageMap}
              edgeUsageMap={edgeUsageMap}
              onJumpToFile={revealFile}
              onJumpToSchema={revealSchema}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
