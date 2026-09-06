import { describe, expect, it } from "vitest";

import {
  deriveKnowledgeTransactionProtection,
  knowledgeProtectionMatchesScopes,
  knowledgeProtectionScopesOverlap,
} from "../../../scripts/knowledge-records/protection-model";

describe("Knowledge record operation protection model", () => {
  it("uses an exact record scope for one Issue update", () => {
    expect(
      deriveKnowledgeTransactionProtection("issue-update", [
        {
          action: "update",
          path: "docs/architecture-knowledge/issues/community-gallery/CG-ISSUE-001.md",
        },
      ]),
    ).toEqual({
      mode: "scoped",
      reason: "one existing Issue record with no identity allocation",
      scopes: [
        {
          kind: "record",
          sourcePath:
            "docs/architecture-knowledge/issues/community-gallery/CG-ISSUE-001.md",
        },
      ],
    });
  });

  it("uses an exact record scope for one Current Work update", () => {
    expect(
      deriveKnowledgeTransactionProtection("project-update", [
        {
          action: "update",
          path: "docs/current-work/active/knowledge-system/KS-WORK-001.md",
        },
      ]),
    ).toEqual({
      mode: "scoped",
      reason: "one existing Current Work record with no identity allocation",
      scopes: [
        {
          kind: "record",
          sourcePath:
            "docs/current-work/active/knowledge-system/KS-WORK-001.md",
        },
      ],
    });
  });

  it.each([
    "project-create",
    "issue-create",
    "accepted-update",
    "legacy-import",
    "correction",
    "closeout",
  ] as const)("keeps %s on the global protection path", (kind) => {
    expect(
      deriveKnowledgeTransactionProtection(kind, [
        {
          action: kind === "closeout" ? "remove" : "create",
          path: "docs/current-work/active/community-gallery/CG-WORK-001.md",
        },
      ]).mode,
    ).toBe("global");
  });

  it("detects same-record conflicts without blocking different records", () => {
    const firstIssue = [
      {
        kind: "record" as const,
        sourcePath:
          "docs/architecture-knowledge/issues/community-gallery/CG-ISSUE-001.md",
      },
    ];
    const secondIssue = [
      {
        kind: "record" as const,
        sourcePath:
          "docs/architecture-knowledge/issues/community-gallery/CG-ISSUE-002.md",
      },
    ];
    expect(knowledgeProtectionScopesOverlap(firstIssue, firstIssue)).toBe(true);
    expect(knowledgeProtectionScopesOverlap(firstIssue, secondIssue)).toBe(false);
    expect(
      knowledgeProtectionScopesOverlap(
        [
          {
            kind: "record",
            sourcePath:
              "docs/current-work/active/knowledge-system/KS-WORK-001.md",
          },
        ],
        firstIssue,
      ),
    ).toBe(false);
  });

  it("rejects a stored transaction whose derived scope differs from its active scoped owner", () => {
    const protection = deriveKnowledgeTransactionProtection("issue-update", [
      {
        action: "update",
        path: "docs/architecture-knowledge/issues/community-gallery/CG-ISSUE-001.md",
      },
    ]);
    expect(
      knowledgeProtectionMatchesScopes(protection, [
        {
          kind: "record",
          sourcePath:
            "docs/architecture-knowledge/issues/community-gallery/CG-ISSUE-001.md",
        },
      ]),
    ).toBe(true);
    expect(
      knowledgeProtectionMatchesScopes(protection, [
        {
          kind: "record",
          sourcePath:
            "docs/architecture-knowledge/issues/community-gallery/CG-ISSUE-002.md",
        },
      ]),
    ).toBe(false);
    expect(
      knowledgeProtectionMatchesScopes(
        deriveKnowledgeTransactionProtection("project-update", [
          {
            action: "update",
            path: "docs/current-work/active/knowledge-system/KS-WORK-001.md",
          },
        ]),
        [
          {
            kind: "record",
            sourcePath:
              "docs/current-work/active/knowledge-system/KS-WORK-001.md",
          },
        ],
      ),
    ).toBe(true);
  });

  it("fails closed on malformed transaction shapes and unsupported namespaces", () => {
    expect(() =>
      deriveKnowledgeTransactionProtection("issue-update", []),
    ).toThrow(/one exact update target/i);
    expect(() =>
      deriveKnowledgeTransactionProtection("project-update", [
        {
          action: "update",
          path: "docs/architecture-knowledge/issues/community-gallery/CG-ISSUE-001.md",
        },
      ]),
    ).toThrow(/active Current Work/i);
  });
});
