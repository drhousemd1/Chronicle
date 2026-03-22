import {
  API_ARCHITECTURE_PACKAGE_TYPE,
  API_ARCHITECTURE_PACKAGE_VERSION,
  API_MAP_TAG_TYPES,
  ApiArchitectureMapPackage,
  ApiArchitectureMapRegistry,
  ApiMapItem,
  ApiMapTagType,
  isApiArchitectureMapPackage,
} from "@/lib/api-inspector-schema";

export interface ApiMapValidationIssue {
  id: string;
  severity: "error" | "warning";
  scope: "registry" | "phase" | "section" | "item" | "cross-ref" | "changelog";
  itemId?: string;
  message: string;
}

export interface ApiMapTagMeta {
  type: ApiMapTagType;
  label: string;
  icon: string;
  className: string;
  color: string;
}

export const apiMapTagMeta: Record<ApiMapTagType, ApiMapTagMeta> = {
  "code-logic": {
    type: "code-logic",
    label: "Code Logic",
    icon: "🔧",
    className: "code-logic",
    color: "#555555",
  },
  "validation-check": {
    type: "validation-check",
    label: "Validation Check",
    icon: "✓",
    className: "validation-check",
    color: "#dc2626",
  },
  "core-prompt": {
    type: "core-prompt",
    label: "Core Prompt",
    icon: "📝",
    className: "core-prompt",
    color: "#1565c0",
  },
  "data-block": {
    type: "data-block",
    label: "Data Block",
    icon: "📦",
    className: "data-block",
    color: "#0f766e",
  },
  "context-injection": {
    type: "context-injection",
    label: "Context Injection",
    icon: "📥",
    className: "context-injection",
    color: "#e67e22",
  },
};

const mustIncludeCodeSource = new Set<ApiMapTagType>(["core-prompt", "data-block"]);

export function flattenMapItems(registry: ApiArchitectureMapRegistry): ApiMapItem[] {
  return registry.phases.flatMap((phase) =>
    phase.sections.flatMap((section) => section.items),
  );
}

export function buildItemLookup(registry: ApiArchitectureMapRegistry): Map<string, ApiMapItem> {
  const lookup = new Map<string, ApiMapItem>();
  flattenMapItems(registry).forEach((item) => lookup.set(item.id, item));
  return lookup;
}

export function validateApiArchitectureRegistry(
  registry: ApiArchitectureMapRegistry,
): ApiMapValidationIssue[] {
  const issues: ApiMapValidationIssue[] = [];

  if (!registry.meta.name.trim()) {
    issues.push({
      id: "meta-name-empty",
      severity: "error",
      scope: "registry",
      message: "Registry meta.name is required.",
    });
  }

  if (!registry.meta.sourcePolicy.trim()) {
    issues.push({
      id: "meta-source-policy-empty",
      severity: "warning",
      scope: "registry",
      message: "Registry meta.sourcePolicy should explain code-truth precedence.",
    });
  }

  if (registry.phases.length === 0) {
    issues.push({
      id: "phases-empty",
      severity: "error",
      scope: "registry",
      message: "At least one phase is required.",
    });
  }

  const itemLookup = buildItemLookup(registry);
  const seenItemIds = new Set<string>();

  registry.phases.forEach((phase) => {
    if (!phase.title.trim()) {
      issues.push({
        id: `phase-title-empty:${phase.id}`,
        severity: "error",
        scope: "phase",
        message: `Phase ${phase.id} is missing a title.`,
      });
    }

    if (phase.sections.length === 0) {
      issues.push({
        id: `phase-sections-empty:${phase.id}`,
        severity: "warning",
        scope: "phase",
        message: `Phase \"${phase.title}\" has no sections.`,
      });
    }

    phase.sections.forEach((section) => {
      if (!section.title.trim()) {
        issues.push({
          id: `section-title-empty:${section.id}`,
          severity: "error",
          scope: "section",
          message: `Section ${section.id} is missing a title.`,
        });
      }

      if (section.items.length === 0) {
        issues.push({
          id: `section-items-empty:${section.id}`,
          severity: "warning",
          scope: "section",
          message: `Section \"${section.title}\" has no mapped items.`,
        });
      }

      section.items.forEach((item) => {
        if (seenItemIds.has(item.id)) {
          issues.push({
            id: `item-duplicate-id:${item.id}`,
            severity: "error",
            scope: "item",
            itemId: item.id,
            message: `Duplicate item id \"${item.id}\" detected.`,
          });
        }
        seenItemIds.add(item.id);

        if (!API_MAP_TAG_TYPES.includes(item.tagType)) {
          issues.push({
            id: `item-tag-invalid:${item.id}`,
            severity: "error",
            scope: "item",
            itemId: item.id,
            message: `Item \"${item.title}\" has an invalid tag type.`,
          });
        }

        if (!item.icon.trim()) {
          issues.push({
            id: `item-icon-missing:${item.id}`,
            severity: "error",
            scope: "item",
            itemId: item.id,
            message: `Item \"${item.title}\" is missing icon metadata.`,
          });
        }

        if (!item.purpose.trim()) {
          issues.push({
            id: `item-purpose-missing:${item.id}`,
            severity: "error",
            scope: "item",
            itemId: item.id,
            message: `Item \"${item.title}\" is missing a plain-English purpose.`,
          });
        }

        if (!item.fileRefs?.length) {
          issues.push({
            id: `item-fileref-missing:${item.id}`,
            severity: "error",
            scope: "item",
            itemId: item.id,
            message: `Item \"${item.title}\" is missing file-ref metadata.`,
          });
        } else {
          item.fileRefs.forEach((ref, idx) => {
            if (!ref.path.trim()) {
              issues.push({
                id: `item-fileref-empty-path:${item.id}:${idx}`,
                severity: "error",
                scope: "item",
                itemId: item.id,
                message: `Item \"${item.title}\" has a file-ref with an empty path.`,
              });
            }
          });
        }

        if (mustIncludeCodeSource.has(item.tagType) && !item.codeSource?.trim()) {
          issues.push({
            id: `item-codesource-missing:${item.id}`,
            severity: "warning",
            scope: "item",
            itemId: item.id,
            message: `Item \"${item.title}\" should include a code-source snippet.`,
          });
        }
      });
    });
  });

  flattenMapItems(registry).forEach((item) => {
    item.crossRefs?.forEach((ref) => {
      if (!itemLookup.has(ref.targetItemId)) {
        issues.push({
          id: `cross-ref-missing-target:${item.id}:${ref.badge}`,
          severity: "error",
          scope: "cross-ref",
          itemId: item.id,
          message: `Cross-ref badge ${ref.badge} on \"${item.title}\" points to missing target \"${ref.targetItemId}\".`,
        });
      }
    });
  });

  registry.changelog.forEach((entry) => {
    if (
      !entry.problem.trim() ||
      !entry.previousAttempt.trim() ||
      !entry.changeMade.trim() ||
      entry.filesTouched.length === 0 ||
      !entry.expectedOutcome.trim() ||
      !entry.actualOutcome.trim()
    ) {
      issues.push({
        id: `changelog-incomplete:${entry.id}`,
        severity: "error",
        scope: "changelog",
        message: `Changelog entry \"${entry.title}\" is missing one or more required fields.`,
      });
    }
  });

  return issues;
}

export function makeApiArchitecturePackage(
  registry: ApiArchitectureMapRegistry,
): ApiArchitectureMapPackage {
  return {
    packageType: API_ARCHITECTURE_PACKAGE_TYPE,
    packageVersion: API_ARCHITECTURE_PACKAGE_VERSION,
    exportedAt: new Date().toISOString(),
    registry,
  };
}

export function parseApiArchitecturePackage(raw: string): ApiArchitectureMapPackage {
  const parsed = JSON.parse(raw);
  if (!isApiArchitectureMapPackage(parsed)) {
    throw new Error("Invalid package format. Expected Chronicle API architecture package v1.");
  }
  return parsed;
}

export function serializeApiArchitecturePackage(
  registry: ApiArchitectureMapRegistry,
): string {
  return JSON.stringify(makeApiArchitecturePackage(registry), null, 2);
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function toTimestampLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
