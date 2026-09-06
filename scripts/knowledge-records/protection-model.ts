import { parseCanonicalRecordSourcePath } from "./path-safety";
import type { KnowledgeTransactionKind } from "./transaction-store";

export type KnowledgeProtectionScope =
  | Readonly<{ kind: "record"; sourcePath: string }>
  | Readonly<{ kind: "namespace"; sourcePath: string }>;

export type KnowledgeTransactionProtection =
  | Readonly<{ mode: "global"; reason: string }>
  | Readonly<{
      mode: "scoped";
      reason: string;
      scopes: readonly KnowledgeProtectionScope[];
    }>;

type ProtectionOperation = Readonly<{
  action: "create" | "update" | "remove" | "move";
  path?: string;
  sourcePath?: string;
  destinationPath?: string;
}>;

function exactUpdatePath(
  kind: KnowledgeTransactionKind,
  operations: readonly ProtectionOperation[],
) {
  if (
    operations.length !== 1 ||
    operations[0].action !== "update" ||
    typeof operations[0].path !== "string"
  ) {
    throw new Error(`${kind} protection requires one exact update target.`);
  }
  return operations[0].path;
}

export function deriveKnowledgeTransactionProtection(
  kind: KnowledgeTransactionKind,
  operations: readonly ProtectionOperation[],
): KnowledgeTransactionProtection {
  if (kind === "issue-update") {
    const sourcePath = exactUpdatePath(kind, operations);
    const identity = parseCanonicalRecordSourcePath(sourcePath);
    if (identity.location !== "issue") {
      throw new Error("Issue update protection target is not a canonical Issue.");
    }
    return Object.freeze({
      mode: "scoped" as const,
      reason: "one existing Issue record with no identity allocation",
      scopes: Object.freeze([
        Object.freeze({ kind: "record" as const, sourcePath }),
      ]),
    });
  }

  if (kind === "project-update") {
    const sourcePath = exactUpdatePath(kind, operations);
    const identity = parseCanonicalRecordSourcePath(sourcePath);
    if (identity.location !== "active-current-work") {
      throw new Error(
        "Project update protection target is not an active Current Work record.",
      );
    }
    return Object.freeze({
      mode: "scoped" as const,
      reason: "one existing Current Work record with no identity allocation",
      scopes: Object.freeze([
        Object.freeze({ kind: "record" as const, sourcePath }),
      ]),
    });
  }

  return Object.freeze({
    mode: "global" as const,
    reason:
      kind === "project-create" || kind === "issue-create"
        ? "identity allocation, registry membership, and relationship validation"
        : kind === "accepted-update"
          ? "supplied accepted-history identity uniqueness and complete registry validation"
        : kind === "correction"
          ? "append-only history identity and correction ordering"
          : kind === "legacy-import"
            ? "registry-wide migration and reconciliation"
            : "multi-record closeout and exact all-or-nothing recovery",
  });
}

export function serializeKnowledgeProtectionScope(
  scope: KnowledgeProtectionScope,
) {
  return `${scope.kind}:${scope.sourcePath}`;
}

export function parseKnowledgeProtectionScope(
  value: string,
): KnowledgeProtectionScope {
  const separator = value.indexOf(":");
  const kind = value.slice(0, separator);
  const sourcePath = value.slice(separator + 1);
  if (kind === "record") {
    parseCanonicalRecordSourcePath(sourcePath);
    return Object.freeze({ kind, sourcePath });
  }
  throw new Error("Knowledge protection scope is malformed or unsupported.");
}

function namespaceContains(namespace: string, sourcePath: string) {
  return sourcePath === namespace || sourcePath.startsWith(`${namespace}/`);
}

export function knowledgeProtectionScopesOverlap(
  left: readonly KnowledgeProtectionScope[],
  right: readonly KnowledgeProtectionScope[],
) {
  return left.some((leftScope) =>
    right.some((rightScope) => {
      if (leftScope.kind === "record" && rightScope.kind === "record") {
        return leftScope.sourcePath === rightScope.sourcePath;
      }
      if (leftScope.kind === "namespace" && rightScope.kind === "namespace") {
        return (
          namespaceContains(leftScope.sourcePath, rightScope.sourcePath) ||
          namespaceContains(rightScope.sourcePath, leftScope.sourcePath)
        );
      }
      const namespace =
        leftScope.kind === "namespace" ? leftScope : rightScope;
      const record = leftScope.kind === "record" ? leftScope : rightScope;
      return namespaceContains(namespace.sourcePath, record.sourcePath);
    }),
  );
}

export function knowledgeProtectionMatchesScopes(
  protection: KnowledgeTransactionProtection,
  scopes: readonly KnowledgeProtectionScope[],
) {
  if (protection.mode !== "scoped") return false;
  const expected = protection.scopes.map(serializeKnowledgeProtectionScope);
  const actual = scopes.map(serializeKnowledgeProtectionScope);
  if (
    new Set(expected).size !== expected.length ||
    new Set(actual).size !== actual.length
  ) {
    return false;
  }
  return [...expected].sort().join("\0") === [...actual].sort().join("\0");
}
