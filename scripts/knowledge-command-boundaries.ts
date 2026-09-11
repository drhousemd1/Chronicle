export type KnowledgeCommandBoundary = Readonly<{
  script: string;
  command: string;
  protection: "independent" | "knowledge-certification" | "nested";
  reason: string;
}>;

/**
 * One reviewable contract for package commands that previously acquired a
 * Chronicle Knowledge certification lease. "Independent" means the command
 * does not require a stable Knowledge snapshot. "Nested" means the outer
 * command stays free and its Knowledge-bearing inner command acquires the
 * lease. The exclusive writer lock and record transactions are not changed by
 * this contract.
 */
export const KNOWLEDGE_COMMAND_BOUNDARIES = Object.freeze([
  {
    script: "prebuild",
    command: "node scripts/generate-roleplay-artifact-identity.mjs",
    protection: "independent",
    reason: "Generates roleplay artifact identities from runtime and Supabase sources, not Knowledge sources.",
  },
  {
    script: "build",
    command: "vite-node scripts/run-with-knowledge-certification-lease.ts build -- vite build",
    protection: "knowledge-certification",
    reason: "The Vite application bundle includes Knowledge documents and computes a repository source fingerprint.",
  },
  {
    script: "prebuild:dev",
    command: 'node -e "process.exit(0)"',
    protection: "independent",
    reason: "This lifecycle hook intentionally performs no work.",
  },
  {
    script: "build:dev",
    command: "vite-node scripts/run-with-knowledge-certification-lease.ts build-dev -- vite build --mode development",
    protection: "knowledge-certification",
    reason: "The development-mode Vite bundle includes the same Knowledge documents as the production bundle.",
  },
  {
    script: "typecheck",
    command: "tsc -b",
    protection: "independent",
    reason: "TypeScript checks source types but does not load canonical Knowledge Markdown or operational records.",
  },
  {
    script: "ship-check",
    command: "npm run -s ship-check:steps",
    protection: "nested",
    reason: "Typecheck and lint run freely; the nested build acquires the Knowledge lease only for its Knowledge-bearing portion.",
  },
  {
    script: "ship-check:steps",
    command: "npm run -s typecheck && npm run -s lint && npm run -s build",
    protection: "nested",
    reason: "This sequence delegates protection to the build command instead of holding one broad lease.",
  },
  {
    script: "architecture:refresh",
    command: "vite-node scripts/run-with-knowledge-certification-lease.ts architecture-refresh -- node scripts/refresh-architecture-paths.mjs",
    protection: "knowledge-certification",
    reason: "Refresh reads the repository, including Knowledge sources, and rewrites generated architecture inventories.",
  },
  {
    script: "knowledge:check",
    command: "vite-node scripts/run-with-knowledge-certification-lease.ts knowledge-check -- node scripts/validate-architecture-knowledge.mjs",
    protection: "knowledge-certification",
    reason: "Certifies the canonical Knowledge documents and their application wiring against one stable source set.",
  },
  {
    script: "knowledge:operational:check",
    command: "vite-node scripts/run-with-knowledge-certification-lease.ts knowledge-operational-check -- vite-node scripts/validate-chronicle-operational-records.ts",
    protection: "knowledge-certification",
    reason: "Certifies Current Work, Issues, evidence, and Changelog relationships against one stable source set.",
  },
  {
    script: "quality:scan",
    command: "vite-node scripts/run-with-knowledge-certification-lease.ts quality-scan -- node scripts/run-quality-hub-scan.mjs",
    protection: "knowledge-certification",
    reason: "The scan reports one aggregate result across full tests and a build, so one lease keeps those checks on the same Knowledge snapshot.",
  },
  {
    script: "lint",
    command: "eslint .",
    protection: "independent",
    reason: "ESLint checks source text and configuration without loading canonical Knowledge Markdown or operational records.",
  },
  {
    script: "test",
    command: "vite-node scripts/run-with-knowledge-certification-lease.ts test -- vitest run",
    protection: "knowledge-certification",
    reason: "The complete test suite includes Knowledge contracts, renderers, records, and transaction tests.",
  },
  {
    script: "test:product",
    command: "vite-node scripts/run-product-tests.ts --",
    protection: "independent",
    reason: "Runs only explicit test files after a fail-closed source and import-graph check proves they cannot reach Knowledge.",
  },
  {
    script: "test:watch",
    command: "vite-node scripts/run-with-knowledge-certification-lease.ts test-watch -- vitest",
    protection: "knowledge-certification",
    reason: "Watch mode can execute the complete Knowledge-bearing test surface.",
  },
  {
    script: "test:coverage",
    command: "vite-node scripts/run-with-knowledge-certification-lease.ts test-coverage -- vitest run --coverage",
    protection: "knowledge-certification",
    reason: "Coverage executes the complete Knowledge-bearing test surface.",
  },
  {
    script: "test:e2e",
    command: "vite-node scripts/run-with-knowledge-certification-lease.ts test-e2e -- playwright test",
    protection: "knowledge-certification",
    reason: "Browser tests can start and inspect the Vite application that bundles Knowledge content.",
  },
  {
    script: "validation:roleplay:batch0",
    command: "vite-node scripts/write-roleplay-batch0-validation-ledger.ts",
    protection: "independent",
    reason: "Runs roleplay fixtures and writes the separate validation-evidence ledger without reading or writing Knowledge records.",
  },
  {
    script: "validation:roleplay:batch1",
    command: "vite-node scripts/write-roleplay-batch1-validation-ledger.ts",
    protection: "independent",
    reason: "Runs roleplay fixtures and writes the separate validation-evidence ledger without reading or writing Knowledge records.",
  },
  {
    script: "validation:gate",
    command: "vite-node scripts/run-with-knowledge-certification-lease.ts validation-gate -- vite-node scripts/run-validation-gate.ts",
    protection: "knowledge-certification",
    reason: "Its extensible gate catalog can select test or validation commands, so it remains protected until that catalog has its own fail-closed Knowledge boundary.",
  },
  {
    script: "validation:reconcile",
    command: "vite-node scripts/reconcile-validation-evidence.ts",
    protection: "independent",
    reason: "Reconciles only the separate roleplay validation-evidence stores.",
  },
  {
    script: "validation:manual-review",
    command: "vite-node scripts/record-validation-manual-review.ts",
    protection: "independent",
    reason: "Appends a manual-review receipt only to the separate roleplay validation-evidence store.",
  },
  {
    script: "artifacts:roleplay:refresh",
    command: "node scripts/generate-roleplay-artifact-identity.mjs",
    protection: "independent",
    reason: "Reads roleplay runtime, edge-function, and migration sources and rewrites only roleplay identity artifacts.",
  },
  {
    script: "artifacts:roleplay:check",
    command: "node scripts/generate-roleplay-artifact-identity.mjs --check",
    protection: "independent",
    reason: "Compares roleplay identity artifacts against roleplay and migration sources only.",
  },
  {
    script: "graph:history",
    command: "vite-node scripts/run-with-knowledge-certification-lease.ts graph-history -- vite-node --script scripts/chronicle-repository-graph/history-cli-entry.ts",
    protection: "knowledge-certification",
    reason: "Reads and validates the canonical Changelog registry, so one lease keeps the bounded history query on a stable Knowledge source set.",
  },
  {
    script: "graph:check",
    command: "vite-node scripts/run-with-knowledge-certification-lease.ts graph-check -- vitest run src/data/chronicle-knowledge-base/repository-graph-toolchain.test.ts src/data/chronicle-knowledge-base/repository-graph-contract.test.ts src/data/chronicle-knowledge-base/repository-graph-pipeline.test.ts src/data/chronicle-knowledge-base/repository-graph-historian.test.ts src/components/admin/knowledge-base/ChangelogHistorianView.test.tsx src/components/admin/knowledge-base/RepositoryGraphView.test.tsx src/pages/style-guide/chronicle-knowledge-base.repository-graph.test.tsx",
    protection: "knowledge-certification",
    reason: "The focused graph collection imports canonical Knowledge documents, operational records, and the Knowledge Base renderer.",
  },
] satisfies readonly KnowledgeCommandBoundary[]);

export const KNOWLEDGE_SOURCE_BOUNDARIES = Object.freeze([
  "docs/architecture-knowledge",
  "docs/current-work",
  "src/components/admin/knowledge-base",
  "src/data/chronicle-knowledge-base",
  "src/pages/style-guide/changelog-record",
  "src/pages/style-guide/chronicle-knowledge-base",
  "scripts/knowledge-records",
] as const);
