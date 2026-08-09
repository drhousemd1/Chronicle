import type {
  ChangeLogEntry,
  QualityHubRegistry,
} from "@/lib/ui-audit-schema";
import { mergeRegistries } from "@/lib/ui-audit-utils";

export type QualityHubRegistryInput = Omit<QualityHubRegistry, "changeLog"> & {
  changeLog?: ChangeLogEntry[];
};

export type QualityHubImportResult =
  | {
      accepted: true;
      registry: QualityHubRegistry;
    }
  | {
      accepted: false;
      reason: string;
    };

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => canonicalize(item));
  if (value === null || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, canonicalize(child)]),
  );
}

export function canonicalJsonEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));
}

export function cloneLegacyChangeLog(
  value: QualityHubRegistryInput["changeLog"],
): ChangeLogEntry[] {
  if (!Array.isArray(value)) return [];
  return structuredClone(value);
}

export function legacyChangeLogEqual(
  left: QualityHubRegistryInput["changeLog"],
  right: QualityHubRegistryInput["changeLog"],
): boolean {
  return canonicalJsonEqual(left ?? [], right ?? []);
}

export function withLegacyChangeLog(
  registry: QualityHubRegistry,
  protectedChangeLog: QualityHubRegistryInput["changeLog"],
): QualityHubRegistry {
  return {
    ...registry,
    changeLog: cloneLegacyChangeLog(protectedChangeLog),
  };
}

export function mergeRegistryUpgradePreservingLegacyChangeLog(
  seed: QualityHubRegistry,
  persisted: QualityHubRegistryInput,
): QualityHubRegistry {
  const protectedChangeLog = cloneLegacyChangeLog(persisted.changeLog);
  const seedWithoutLegacyHistory: QualityHubRegistry = {
    ...seed,
    changeLog: [],
  };
  const persistedWithoutLegacyHistory: QualityHubRegistry = {
    ...persisted,
    changeLog: [],
  };
  const merged = mergeRegistries(
    seedWithoutLegacyHistory,
    persistedWithoutLegacyHistory,
  );
  return withLegacyChangeLog(merged, protectedChangeLog);
}

export function guardQualityHubRegistryUpdate(
  protectedChangeLog: QualityHubRegistryInput["changeLog"],
  proposedRegistry: QualityHubRegistry,
): QualityHubImportResult {
  if (!legacyChangeLogEqual(protectedChangeLog, proposedRegistry.changeLog)) {
    return {
      accepted: false,
      reason:
        "Quality Hub blocked a write that would change the read-only legacy Changelog.",
    };
  }

  return {
    accepted: true,
    registry: withLegacyChangeLog(proposedRegistry, protectedChangeLog),
  };
}

export function prepareQualityHubWorkspaceImport(
  currentRegistry: QualityHubRegistry,
  protectedChangeLog: QualityHubRegistryInput["changeLog"],
  incomingRegistry: QualityHubRegistryInput,
): QualityHubImportResult {
  if (
    incomingRegistry.changeLog !== undefined
    && !legacyChangeLogEqual(protectedChangeLog, incomingRegistry.changeLog)
  ) {
    return {
      accepted: false,
      reason:
        "Import blocked: this file would change the read-only legacy Changelog. No Quality Hub data was imported.",
    };
  }

  const merged = mergeRegistries(
    withLegacyChangeLog(currentRegistry, protectedChangeLog),
    {
      ...incomingRegistry,
      changeLog: cloneLegacyChangeLog(protectedChangeLog),
    },
  );

  return {
    accepted: true,
    registry: withLegacyChangeLog(merged, protectedChangeLog),
  };
}
