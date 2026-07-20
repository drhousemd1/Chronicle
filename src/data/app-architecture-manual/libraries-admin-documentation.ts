import { defineManualArchitectureFiles } from "./types";

const codeHeader = {
  label: "CODE LOGIC" as const,
  className: "code-logic" as const,
  filterValue: "code-logic" as const,
  navAccent: "code-logic" as const,
};

const testHeader = {
  label: "TEST" as const,
  className: "test" as const,
  filterValue: "test" as const,
  navAccent: "test" as const,
};

export const adminDocumentationLibraryArchitectureFiles = defineManualArchitectureFiles([
  {
    path: "/src/lib/api-inspector-pipeline-export.test.ts",
    header: testHeader,
    metric: "84 lines",
    metricDescription: "Markdown export coverage for the Roleplay Pipeline model.",
    description:
      "Builds a representative pipeline with phases, groups, source references, details, and cross-references and verifies that the downloadable Markdown contains the same visible architecture information rather than a reduced summary.",
    rows: [],
    reviewedSource: "Manual review of the export fixture and all asserted pipeline sections.",
  },
  {
    path: "/src/lib/api-inspector-pipeline-export.ts",
    header: codeHeader,
    metric: "314 lines",
    metricDescription: "Typed serializer for the Roleplay Pipeline Markdown download.",
    description:
      "Defines the flattened export contract consumed by the Roleplay Pipeline page and renders its shell metadata, phases, groups, cards, classifications, source files, line ranges, details, cross-references, validation notes, and downloadable reference sections into one reviewable Markdown document. It does not discover runtime behavior; it serializes the page model it is given.",
    rows: [
      {
        id: "pipeline-export-contract",
        title: "Pipeline export model",
        summary:
          "Provides explicit types for files, detail rows, cross-references, items, groups, phases, shell context, and the complete export payload so browser output and downloaded documentation can share one shape.",
        badgeLabel: "EXPORT CONTRACT",
        badgeClass: "data-block",
        details: [],
      },
      {
        id: "pipeline-export-markdown",
        title: "Full-fidelity Markdown rendering",
        summary:
          "Writes every supplied phase and item with status, ownership, timing, inputs, outputs, persistence, failure guarantees, debug evidence, and exact source references. Empty fields are omitted without changing the source model.",
        badgeLabel: "MARKDOWN",
        badgeClass: "documentation",
        details: [],
      },
    ],
    reviewedSource: "Manual review of all export interfaces, value normalization, phase/group/item traversal, detail rendering, and final Markdown assembly.",
  },
  {
    path: "/src/lib/api-inspector-schema.ts",
    header: codeHeader,
    metric: "172 lines",
    metricDescription: "Versioned data contract for portable Roleplay Pipeline maps.",
    description:
      "Defines the portable registry and package shape used by the Roleplay Pipeline maintenance tooling: phases, sections, cards, subitems, source references, cross-references, tag types, legend entries, LLM instructions, change history, and review metadata. The runtime type guards reject packages with the wrong package identity or missing registry structure before imported data is used.",
    rows: [],
    reviewedSource: "Manual review of every schema interface, package constants, allowed tag values, registry guard, and package guard.",
  },
  {
    path: "/src/lib/api-inspector-utils.test.ts",
    header: testHeader,
    metric: "61 lines",
    metricDescription: "Registry validation and package round-trip tests.",
    description:
      "Checks that the baseline Roleplay Pipeline registry is valid, missing source paths and broken cross-references are reported, a valid package survives serialization and parsing, and invalid JSON packages are rejected.",
    rows: [],
    reviewedSource: "Manual review of all baseline, broken-reference, round-trip, and invalid-package cases.",
  },
  {
    path: "/src/lib/api-inspector-utils.ts",
    header: codeHeader,
    metric: "298 lines",
    metricDescription: "Validation and transfer utilities for the Roleplay Pipeline registry.",
    description:
      "Flattens nested pipeline sections into searchable items, builds ID lookups, validates source paths and line ranges, detects duplicate IDs and broken cross-references, and creates or parses the versioned architecture package used for maintenance and transfer. It also supplies timestamp formatting for review metadata; it does not alter the runtime pipeline.",
    rows: [
      {
        id: "api-map-validation",
        title: "Registry integrity validation",
        summary:
          "Checks package metadata, unique item identities, referenced files, line ordering, required content, and cross-reference targets, returning structured warning or error records instead of silently accepting a broken map.",
        badgeLabel: "MAP VALIDATION",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "api-map-transfer",
        title: "Versioned import and export",
        summary:
          "Wraps a registry and maintenance metadata in the Chronicle package identity, serializes stable JSON, validates parsed input, and reports incompatible or malformed packages to the caller.",
        badgeLabel: "TRANSFER",
        badgeClass: "data-block",
        details: [],
      },
    ],
    reviewedSource: "Manual review of flattening, lookup construction, every validation category, package creation, parse guard, serialization, and date labels.",
  },
  {
    path: "/src/lib/app-architecture-export.test.ts",
    header: testHeader,
    metric: "78 lines",
    metricDescription: "Markdown export coverage for App Architecture and backend schema data.",
    description:
      "Uses a representative file profile, navigation section, database table, function, bucket, and edge function to verify that App Architecture's downloadable Markdown contains the same file relationships, architecture rows, signals, security marker, and backend inventory supplied by the page.",
    rows: [],
    reviewedSource: "Manual review of the export fixture and each asserted file and schema section.",
  },
  {
    path: "/src/lib/app-architecture-export.ts",
    header: codeHeader,
    metric: "276 lines",
    metricDescription: "Typed Markdown serializer for App Architecture.",
    description:
      "Defines the page-to-download contract for manually documented files, generated relationships, curated navigation, and the backend schema snapshot. It renders file purpose, metric state, imports, consumers, tables, RPCs, edge functions, storage, browser state, architecture rows, and schema objects into a pasteable Markdown report; it does not create or infer those facts itself.",
    rows: [
      {
        id: "architecture-export-files",
        title: "File profile export",
        summary:
          "Writes every file's manual explanation and detail rows together with the supplied import, consumer, database, service, storage, and browser-state relationships so the downloaded report does not lose information visible in the browser.",
        badgeLabel: "FILE EXPORT",
        badgeClass: "documentation",
        details: [],
      },
      {
        id: "architecture-export-schema",
        title: "Backend inventory export",
        summary:
          "Writes table columns, indexes, policies, database functions, storage buckets, and edge functions with their supplied usage references and security-relevant metadata.",
        badgeLabel: "SCHEMA EXPORT",
        badgeClass: "documentation",
        details: [],
      },
    ],
    reviewedSource: "Manual review of all export contracts, optional-field handling, navigation, file rows, relationship lists, and backend schema rendering.",
  },
  {
    path: "/src/lib/app-architecture-utils.ts",
    header: codeHeader,
    metric: "389 lines",
    metricDescription: "Repository-tree and transfer primitives used by the existing App Architecture page.",
    description:
      "Builds a deterministic folder-and-file tree from an explicit path list, assigns node identity and parentage, counts file categories, validates portable architecture packages, and produces compact node summaries for maintenance prompts. Its built-in descriptions and file-kind guesses are generic scaffolding from the original page and are not acceptable as manual file documentation; the rebuilt page must use the separately reviewed manual registry for visible file explanations.",
    rows: [
      {
        id: "architecture-utils-tree",
        title: "Path tree construction",
        summary:
          "Normalizes and deduplicates explicit repository paths, creates every parent folder, orders folders before files, and calculates aggregate counts without reading or describing source behavior.",
        badgeLabel: "TREE MODEL",
        badgeClass: "code-logic",
        details: [],
      },
      {
        id: "architecture-utils-transfer",
        title: "Registry package validation",
        summary:
          "Checks the legacy version-one tree/package identity and exposes descendant and top-level navigation helpers. These transfer helpers preserve tree structure, not trustworthy per-file technical explanations.",
        badgeLabel: "LEGACY PACKAGE",
        badgeClass: "data-block",
        details: [],
      },
    ],
    reviewedSource: "Manual review of node types, generic inference boundaries, tree construction, statistics, package guards, descendant traversal, and prompt summary helper.",
  },
  {
    path: "/src/lib/ui-audit-schema.ts",
    header: codeHeader,
    metric: "278 lines",
    metricDescription: "Versioned Quality Hub finding, run, review, and change-log contracts.",
    description:
      "Defines the allowed severities, confidence levels, product domains, finding states, verification states, fix levels, implementation difficulty, source kinds, run profiles, review states, agent stamps, comments, findings, review units, scan modules, run summaries, scan runs, metadata, and change-log entries used by Quality Hub. Its registry guard validates the top-level package before data is rendered.",
    rows: [],
    reviewedSource: "Manual review of all value sets, interfaces, registry guard, and deterministic agent-ID construction.",
  },
  {
    path: "/src/lib/ui-audit-utils.ts",
    header: codeHeader,
    metric: "269 lines",
    metricDescription: "Quality Hub sorting, grouping, summaries, and registry merge behavior.",
    description:
      "Implements the non-UI operations behind Quality Hub: stable severity sorting, grouping and counting by review dimensions, run-summary calculation, reviewed-module progress, and merge rules that preserve existing findings, comments, verification history, and change-log records when a new scan registry is imported. It also generates compact timestamps and local IDs for new maintenance records.",
    rows: [],
    reviewedSource: "Manual review of finding order, all counter/group helpers, run summary, registry merge preservation rules, timestamps, and ID creation.",
  },
]);
