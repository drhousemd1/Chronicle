import { defineManualArchitectureFiles } from "./types";

const toolingHeader = {
  label: "TOOLING" as const,
  className: "tooling" as const,
  filterValue: "tooling" as const,
  navAccent: "tooling" as const,
};

const scriptHeader = {
  label: "SCRIPT" as const,
  className: "script" as const,
  filterValue: "script" as const,
  navAccent: "script" as const,
};

const testHeader = {
  label: "TEST" as const,
  className: "test" as const,
  filterValue: "test" as const,
  navAccent: "test" as const,
};

const codeHeader = {
  label: "CODE LOGIC" as const,
  className: "code-logic" as const,
  filterValue: "code-logic" as const,
  navAccent: "code-logic" as const,
};

export const repositoryEntrypointAndScriptArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/.githooks/pre-push",
    header: toolingHeader,
    metric: "9 lines",
    metricDescription: "Git pre-push quality gate.",
    description:
      "Changes to the repository root, moves there, and runs Chronicle's ship-check before Git is allowed to push. Because the shell uses strict error handling, a failed typecheck, lint, or production build stops the push instead of allowing a knowingly broken revision onto the remote.",
    rows: [],
    reviewedSource: "Manual review of repository resolution, strict shell flags, ship-check invocation, and failure behavior.",
  },
  {
    path: "/e2e/smoke.spec.ts",
    header: testHeader,
    metric: "11 lines",
    metricDescription: "Minimal Playwright application-shell smoke test.",
    description:
      "Loads the application root through Chronicle's shared Playwright fixture and verifies that the Chronicle brand and Community Gallery navigation are visible. This catches a completely broken app shell or primary-navigation render, but it does not exercise authentication, story editing, roleplay, persistence, or admin tools.",
    rows: [],
    reviewedSource: "Manual review of the single Playwright scenario and both visible assertions.",
  },
  {
    path: "/scripts/reconcile-validation-evidence.ts",
    header: scriptHeader,
    metric: "28 lines",
    metricDescription: "Local legacy-evidence reconciliation command.",
    description:
      "Finds the old public validation ledger when present or falls back to the archived local copy, classifies its legacy rows through the validation-evidence reconciliation service, rebuilds the local ledger snapshot for the current source identity, and prints matched, orphaned, malformed, duplicate, and missing-report totals. It exits unsuccessfully only for malformed rows, duplicate IDs, or missing referenced reports.",
    rows: [],
    reviewedSource: "Manual review of source selection, reconciliation call, snapshot rebuild, printed classifications, and exit criteria.",
  },
  {
    path: "/scripts/record-validation-manual-review.ts",
    header: scriptHeader,
    metric: "46 lines",
    metricDescription: "Restricted CLI for append-only manual validation decisions.",
    description:
      "Accepts only gate, approved-or-rejected outcome, reviewer, notes, and repeatable evidence-reference arguments. It validates the complete argument set, appends a manual-review record through the local evidence writer, rebuilds the derived ledger snapshot, and prints the new review identity. It cannot execute a test gate or accept arbitrary command text.",
    rows: [
      {
        id: "manual-review-cli-validation",
        title: "Argument and outcome guard",
        summary:
          "Rejects unsupported switches, missing required values, and outcomes outside approved or rejected before any record is written.",
        badgeLabel: "INPUT GUARD",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "manual-review-cli-write",
        title: "Append and refresh",
        summary:
          "Delegates immutable review creation to ledger-file.ts and then regenerates the local derived view using the current source identity.",
        badgeLabel: "EVIDENCE WRITE",
        badgeClass: "data-block",
        details: [],
      },
    ],
    reviewedSource: "Manual review of CLI parsing, allowlist, required fields, append operation, and snapshot refresh.",
  },
  {
    path: "/scripts/refresh-architecture-paths.mjs",
    header: scriptHeader,
    metric: "896 lines",
    metricDescription: "Static inventory and relationship refresh command for App Architecture.",
    description:
      "Walks tracked source, documentation, script, test, public, and Supabase files; measures text line counts; parses TypeScript and JavaScript ASTs; resolves imports; and detects explicit Supabase tables, RPCs, edge functions, storage operations, and browser-storage access. It rewrites the four generated architecture path, metric, and relationship datasets. It deliberately does not understand product purpose and must not generate or overwrite manual file descriptions.",
    rows: [
      {
        id: "architecture-refresh-inventory",
        title: "Tracked-file inventory and metrics",
        summary:
          "Filters the filesystem through Git's tracked paths, separates src from extra architecture files, and writes deterministic path lists and text line counts.",
        badgeLabel: "INVENTORY",
        badgeClass: "script",
        details: [],
      },
      {
        id: "architecture-refresh-analysis",
        title: "Static relationship extraction",
        summary:
          "Uses AST and targeted source-pattern analysis to capture imports, reverse consumers, database operations, edge calls, storage access, and browser-state access without executing application code.",
        badgeLabel: "STATIC ANALYSIS",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "architecture-refresh-boundary",
        title: "Manual documentation boundary",
        summary:
          "Writes measured evidence only. File categories, responsibilities, operational status, risks, and explanations remain manually reviewed content.",
        badgeLabel: "NO AUTOFILL",
        badgeClass: "documentation",
        details: [],
      },
    ],
    reviewedSource: "Manual review of filesystem traversal, Git filtering, AST extraction, import resolution, relationship detection, and all four generated outputs.",
  },
  {
    path: "/scripts/run-quality-hub-scan.mjs",
    header: scriptHeader,
    metric: "48 lines",
    metricDescription: "Sequential local quality-scan runner.",
    description:
      "Runs lint, TypeScript, unit tests, the production build, and a production-dependency audit in order with direct process spawning. It stops at the first failed check, prints start and finish times plus per-check results, and exits unsuccessfully when any stage fails. It reports repository health; it does not update Quality Hub findings automatically.",
    rows: [],
    reviewedSource: "Manual review of check list, shell-free process spawning, sequential stop behavior, summary output, and exit code.",
  },
  {
    path: "/scripts/run-validation-gate.ts",
    header: scriptHeader,
    metric: "47 lines",
    metricDescription: "Restricted local entry point for predefined validation-evidence gates.",
    description:
      "Provides a small Node localStorage shim, resolves Chronicle's repository and local evidence roots, accepts one predefined gate ID through the guarded CLI parser, rejects unknown, inactive, and manual gates, and dispatches either the approved Batch 0/Batch 1 fixture runner or the restricted command runner. It preserves the gate result in the process exit code and never accepts an arbitrary shell command.",
    rows: [
      {
        id: "validation-gate-selection",
        title: "Predefined-gate enforcement",
        summary:
          "Loads the registered gate definition and refuses identities or lifecycle states that are not eligible for automated execution.",
        badgeLabel: "GATE LOOKUP",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "validation-gate-dispatch",
        title: "Fixture and command dispatch",
        summary:
          "Routes fixture gates to their owned batch harness and command gates to the restricted process runner, records evidence beneath the local evidence root, and propagates failure to the caller.",
        badgeLabel: "LOCAL RUNNER",
        badgeClass: "script",
        details: [],
      },
    ],
    reviewedSource: "Manual review of environment shim, path resolution, CLI parsing, gate guards, fixture dispatch, command dispatch, and exit-code handling.",
  },
  {
    path: "/scripts/verify-prompt-serialization.ts",
    header: scriptHeader,
    metric: "299 lines",
    metricDescription: "Human-readable prompt serialization probe.",
    description:
      "Builds representative story, main-character, user-character, side-character, and custom-section data, calls the real getSystemInstruction renderer, prints selected prompt blocks, and checks that required story, custom-world, character-card, side-character, and user-control content appears. It is a focused development diagnostic with explicit sample data, not a live provider call or full roleplay regression suite.",
    rows: [
      {
        id: "prompt-serialization-fixture",
        title: "Representative prompt fixture",
        summary:
          "Constructs detailed supported fields and freeform sections specifically to make serialization omissions visible in the rendered prompt.",
        badgeLabel: "LOCAL FIXTURE",
        badgeClass: "test",
        details: [],
      },
      {
        id: "prompt-serialization-assertions",
        title: "Required-content assertions",
        summary:
          "Checks section headings, custom-world rows, hardcoded and custom character facts, side-character inclusion, and the user-controlled generation boundary, then exits nonzero if any marker is absent.",
        badgeLabel: "PROMPT CHECK",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of all fixture builders, prompt extraction, printed blocks, required markers, and failure count.",
  },
  {
    path: "/scripts/write-roleplay-batch0-validation-ledger.ts",
    header: scriptHeader,
    metric: "22 lines",
    metricDescription: "Legacy all-gates Batch 0 evidence writer.",
    description:
      "Adds a Node localStorage shim, invokes the complete Batch 0 roleplay validation harness, prints its pass total, and exits unsuccessfully if any fixture fails. Unlike the per-gate runner, this command executes the whole Batch 0 fixture set and writes its local evidence records through the harness.",
    rows: [],
    reviewedSource: "Manual review of environment shim, Batch 0 invocation, summary output, and failure exit behavior.",
  },
  {
    path: "/scripts/write-roleplay-batch1-validation-ledger.ts",
    header: scriptHeader,
    metric: "22 lines",
    metricDescription: "Legacy all-gates Batch 1 evidence writer.",
    description:
      "Adds a Node localStorage shim, invokes the complete Batch 1 roleplay validation harness, prints its pass total, and exits unsuccessfully if any fixture fails. Unlike the per-gate runner, this command executes the whole Batch 1 fixture set and writes its local evidence records through the harness.",
    rows: [],
    reviewedSource: "Manual review of environment shim, Batch 1 invocation, summary output, and failure exit behavior.",
  },
  {
    path: "/src/App.css",
    header: toolingHeader,
    metric: "42 lines",
    metricDescription: "Unused Vite starter stylesheet retained in the repository.",
    description:
      "Contains the original Vite demo root constraint, logo hover animation, card padding, and read-the-docs color. No source file imports it, so it has no current effect on Chronicle's rendered UI and should not be confused with the active global stylesheet in index.css.",
    rows: [],
    reviewedSource: "Manual review of every selector plus a repository-wide import search confirming no current consumer.",
  },
  {
    path: "/src/App.test.tsx",
    header: testHeader,
    metric: "19 lines",
    metricDescription: "Source-level authorization guard for internal admin routes.",
    description:
      "Reads App.tsx as text and verifies that the shared AdminOnlyRoute exists, checks admin access, caches the result, redirects unauthenticated and unauthorized users, and wraps each standalone Style Guide operator route. This guards route wiring against accidental removal; it does not perform a browser login or prove backend RLS.",
    rows: [],
    reviewedSource: "Manual review of the source fixture and every required authorization and route assertion.",
  },
  {
    path: "/src/App.tsx",
    header: {
      label: "REACT COMPONENT",
      className: "component",
      filterValue: "component",
      navAccent: "component",
    },
    metric: "92 lines",
    metricDescription: "Top-level provider, router, and internal-route authorization component.",
    description:
      "Creates the shared React Query client, mounts art-style and tooltip providers, defines public application routes, lazy-loads internal admin documentation pages, and installs the global Sonner toast host. Its AdminOnlyRoute waits for authentication, checks the user's admin role through the app-settings service, caches the result, and redirects non-admin users before rendering Style Guide tools.",
    rows: [
      {
        id: "app-provider-stack",
        title: "Application provider stack",
        summary:
          "Places React Query, art-style state, tooltip behavior, browser routing, suspense, and toast delivery around every route so feature screens share one application shell.",
        badgeLabel: "APP ROOT",
        badgeClass: "component",
        details: [],
      },
      {
        id: "app-admin-routing",
        title: "Admin-only tool boundary",
        summary:
          "Protects Quality Hub, Roleplay Pipeline, App Architecture, Validation Evidence Ledger, and Supabase Schema Reference routes with the same asynchronous admin-role decision.",
        badgeLabel: "ROUTE GUARD",
        badgeClass: "code-logic",
        details: [],
        security: true,
      },
    ],
    reviewedSource: "Manual review of imports, provider nesting, AdminOnlyRoute state/effect branches, all routes, lazy boundaries, and toast host.",
  },
  {
    path: "/src/constants.tsx",
    header: codeHeader,
    metric: "56 lines",
    metricDescription: "Application model constants and small shared SVG icon components.",
    description:
      "Defines Chronicle's persisted application storage key and version, restricts text generation to the Grok model vocabulary, maps every supported text model to grok-imagine-image, and exports small Users, Globe, MessageSquare, Database, Plus, and Trash icons used by builder and library surfaces. The gateway helpers intentionally return xAI only.",
    rows: [
      {
        id: "constants-model-policy",
        title: "Global model policy",
        summary:
          "Provides the model list and deterministic text-to-image and model-to-gateway helpers consumed by settings, persistence defaults, and normalization code.",
        badgeLabel: "MODEL CONFIG",
        badgeClass: "data-block",
        details: [],
      },
      {
        id: "constants-inline-icons",
        title: "Legacy shared icons",
        summary:
          "Exports six hand-authored SVG React components still consumed by Story Builder, Character Builder, gallery, theme, and image-library controls.",
        badgeLabel: "ICON SET",
        badgeClass: "component",
        details: [],
      },
    ],
    reviewedSource: "Manual review of storage constants, model contract, mapping helpers, and every exported icon component plus current consumers.",
  },
  {
    path: "/src/index.css",
    header: toolingHeader,
    metric: "159 lines",
    metricDescription: "Active global Tailwind entry point and shared design tokens.",
    description:
      "Loads Tailwind's base, component, and utility layers; defines light and dark color tokens plus Chronicle's dark-panel variables; applies global border, background, and text defaults; and provides shared utilities for hidden scrollbars, the animated day/time background, guide-editor syntax colors, and guide table striping. main.tsx imports this file, so its tokens and base rules affect the entire application.",
    rows: [
      {
        id: "index-css-tokens",
        title: "Global design tokens",
        summary:
          "Defines the CSS custom properties used by Tailwind-backed components for backgrounds, text, cards, controls, borders, sidebars, and Chronicle-specific dark UI panels in both themes.",
        badgeLabel: "DESIGN TOKENS",
        badgeClass: "data-block",
        details: [],
      },
      {
        id: "index-css-utilities",
        title: "Shared behavioral styling",
        summary:
          "Owns cross-screen scrollbar suppression, day/time animation, and scoped App Guide editor and table presentation that would otherwise be duplicated in components.",
        badgeLabel: "GLOBAL CSS",
        badgeClass: "code-logic",
        details: [],
      },
    ],
    reviewedSource: "Manual review of Tailwind layers, all token groups, global base rules, custom utilities, animation, and guide-specific scopes.",
  },
  {
    path: "/src/main.tsx",
    header: codeHeader,
    metric: "10 lines",
    metricDescription: "Browser bootstrap entry point.",
    description:
      "Imports the active global stylesheet, finds the root element created by index.html, creates the React 18 root, and renders App inside StrictMode. It is the first application-owned code executed by the browser bundle and contains no routes or business logic itself.",
    rows: [],
    reviewedSource: "Manual review of imports, root lookup, StrictMode wrapper, and render call.",
  },
  {
    path: "/src/test/setup.ts",
    header: testHeader,
    metric: "15 lines",
    metricDescription: "Vitest browser-environment setup.",
    description:
      "Loads Testing Library's DOM matchers and installs a stable matchMedia mock with both modern and legacy listener methods. This prevents component tests from failing merely because jsdom does not implement browser media-query APIs.",
    rows: [],
    reviewedSource: "Manual review of matcher import and the complete matchMedia compatibility object.",
  },
  {
    path: "/src/vite-env.d.ts",
    header: toolingHeader,
    metric: "1 line",
    metricDescription: "Vite ambient TypeScript declarations.",
    description:
      "References Vite's client type definitions so TypeScript understands import.meta environment values and asset-module imports throughout the frontend. It contributes compile-time types only and emits no runtime code.",
    rows: [],
    reviewedSource: "Manual review of the single Vite client type reference.",
  },
  {
    path: "/scripts/generate-roleplay-artifact-identity.mjs",
    header: scriptHeader,
    metric: "126 lines",
    metricDescription: "Build-time generator for frontend and edge roleplay artifact manifests.",
    description:
      "Hashes the exact frontend and Supabase edge-function source files that define the roleplay pipeline, binds those hashes to the latest terminal migration and contract versions, and writes deterministic manifests for runtime identity checks. Check mode compares generated output without changing files, while normal mode refreshes both frontend and edge manifests.",
    rows: [],
    reviewedSource: "Manual review of source ownership lists, SHA-256 generation, terminal-migration lookup, deterministic module serialization, check-only behavior, and both generated destinations.",
  },
]);
