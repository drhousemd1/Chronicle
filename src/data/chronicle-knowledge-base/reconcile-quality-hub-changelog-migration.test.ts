import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  buildChangelogRecordRegistry,
  computeLegacyPayloadHash,
  selectChangelogEntriesFromRegistry,
  type LegacyQualityHubPayload,
} from "./changelog-record-contract";
import {
  canonicalJsonStringify,
  CHANGELOG_MIGRATION_PACKAGE_TYPE,
  CHANGELOG_MIGRATION_PACKAGE_VERSION,
  type ChangelogMigrationEnvelopeV1,
} from "../../lib/quality-hub-changelog-migration";
import {
  reconcileQualityHubMigrationEnvelope,
  renderLegacyChangelogRecord,
  renderMigrationReceipt,
  type ReconciliationPolicy,
} from "../../../scripts/reconcile-quality-hub-changelog-migration";

const DIGEST = "a".repeat(64);
const PACKAGE_DIGEST = "b".repeat(64);
const CAPTURED_AT = "2026-08-01T10:29:17.082Z";
const DATABASE_UPDATED_AT = "2026-08-01T10:29:17.082+00:00";
const IMPORTED_ON = "2026-08-04";

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function payload(
  id: string,
  overrides: Partial<LegacyQualityHubPayload> = {},
): LegacyQualityHubPayload {
  return {
    id,
    title: `Title for ${id}`,
    summary: `Summary for ${id}`,
    severity: "fix",
    status: "completed",
    problem: `Problem for ${id}`,
    plan: `Plan for ${id}`,
    changes: `Changes for ${id}`,
    filesAffected: ["src/services/gallery-data.ts"],
    agent: "Fixture agent",
    relatedFindingIds: [],
    relatedRunIds: [],
    tags: ["fixture"],
    comments: [],
    createdAt: "2026-06-20T12:00:00.000Z",
    updatedAt: "2026-06-20T12:00:00.000Z",
    ...overrides,
  };
}

function capturedVariant(
  source: "owner-db" | "local-storage" | "repository-seed",
  entries: readonly LegacyQualityHubPayload[],
  fullRegistryHash: string,
) {
  return {
    presence: "captured" as const,
    source,
    capturedAt: CAPTURED_AT,
    registryVersion: 1,
    fullRegistryHash,
    changeLogHash: sha256(canonicalJsonStringify(entries)),
    changeLogCount: entries.length,
    changeLog: [...entries] as unknown as ChangelogMigrationEnvelopeV1["sources"]["ownerDb"]["changeLog"],
  };
}

function fixture() {
  const exact = payload("cl-gallery");
  const pendingOwner = payload("cl-pending", {
    changes: "Updated /Users/private-name/Desktop/Chronicle/file.ts",
    filesAffected: ["/Users/private-name/Desktop/Chronicle/file.ts"],
  });
  const pendingSeed = JSON.parse(
    JSON.stringify({ ...pendingOwner, relatedRunIds: undefined }),
  ) as LegacyQualityHubPayload;
  const collisionOwner = payload("cl-collision", {
    title: "Owner-selected title",
  });
  const collisionSeed = payload("cl-collision", {
    title: "Seed collision title",
    summary: "Seed collision summary",
  });
  const owner = [exact, pendingOwner, collisionOwner];
  const seed = [exact, pendingSeed, collisionSeed];
  const ownerFullHash = "c".repeat(64);
  const envelope: ChangelogMigrationEnvelopeV1 = {
    packageType: CHANGELOG_MIGRATION_PACKAGE_TYPE,
    packageVersion: CHANGELOG_MIGRATION_PACKAGE_VERSION,
    captureId: "fixture-capture",
    capturedAt: CAPTURED_AT,
    qualityHub: {
      contractVersion: "quality-hub-v1" as ChangelogMigrationEnvelopeV1["qualityHub"]["contractVersion"],
      repositorySeedRegistryVersion: 1,
      applicationVersion: "fixture",
      sourceRevision: "fixture-revision",
      sourceFingerprintAlgorithm: "SHA-256",
      sourceFingerprintScope: "fixture-scope" as ChangelogMigrationEnvelopeV1["qualityHub"]["sourceFingerprintScope"],
      sourceFingerprint: DIGEST,
    },
    authenticatedOwner: {
      fingerprintAlgorithm: "SHA-256",
      fingerprintDomain: "fixture-owner-domain" as ChangelogMigrationEnvelopeV1["authenticatedOwner"]["fingerprintDomain"],
      fingerprintSalt: "private-fixture-salt",
      userFingerprint: DIGEST,
      initialDatabaseUpdatedAt: DATABASE_UPDATED_AT,
      finalDatabaseUpdatedAt: DATABASE_UPDATED_AT,
      initialFullRegistryHash: ownerFullHash,
      finalFullRegistryHash: ownerFullHash,
      initialChangeLogHash: sha256(canonicalJsonStringify(owner)),
      finalChangeLogHash: sha256(canonicalJsonStringify(owner)),
    },
    sources: {
      ownerDb: capturedVariant("owner-db", owner, ownerFullHash),
      localStorage: capturedVariant("local-storage", owner, "d".repeat(64)),
      repositorySeed: capturedVariant("repository-seed", seed, "e".repeat(64)),
    },
  };
  const policy: ReconciliationPolicy = {
    expectedEntryCount: 3,
    applicable: {
      "cl-gallery": "Direct Gallery service evidence.",
    },
    pendingExcluded: {
      "cl-pending": "Gallery applicability is still unresolved.",
    },
  };
  return { envelope, owner, seed, policy };
}

function reconcile() {
  const { envelope, seed, policy } = fixture();
  return reconcileQualityHubMigrationEnvelope(envelope, {
    sourcePackageSha256: PACKAGE_DIGEST,
    importedOn: IMPORTED_ON,
    currentRepositorySeed: seed,
    policy,
  });
}

describe("Quality Hub Changelog reconciliation", () => {
  it("accounts for exact, normalized, and reviewed collision variants", () => {
    const result = reconcile();
    expect(result).toMatchObject({
      identicalCount: 1,
      normalizedEquivalentCount: 1,
      reviewedReferenceDifferenceCount: 0,
      reviewedSubstantiveCollisionCount: 1,
      galleryCount: 1,
      pendingExcludedCount: 1,
      nonGalleryCount: 1,
    });
    expect(
      result.entries.map((entry) => [entry.legacySourceId, entry.sourceDifference]),
    ).toEqual([
      ["cl-collision", "reviewed-substantive-collision"],
      ["cl-gallery", "exact"],
      ["cl-pending", "normalized-empty-optional-field"],
    ]);
  });

  it("keeps the pending record explicit and replaces only the private home prefix", () => {
    const result = reconcile();
    const pending = result.entries.find(
      (entry) => entry.legacySourceId === "cl-pending",
    );
    expect(pending).toMatchObject({
      galleryClassification: "pending_excluded",
      galleryApplicability: "pending_excluded",
      applicabilityStatus: "gallery-review-pending",
      sourceHash: computeLegacyPayloadHash(fixture().owner[1]),
    });
    expect(pending?.originalRecord.filesAffected).toEqual([
      "$HOME/Desktop/Chronicle/file.ts",
    ]);
    expect(pending?.privacyRedactions).toEqual([
      {
        field: "changes",
        transformation: "home-directory-prefix-to-$HOME",
      },
      {
        field: "filesAffected[0]",
        transformation: "home-directory-prefix-to-$HOME",
      },
    ]);
    expect(pending?.preservedRecordHash).toBe(
      pending ? computeLegacyPayloadHash(pending.originalRecord) : undefined,
    );
  });

  it("renders one valid global registry and one filtered Gallery projection", () => {
    const result = reconcile();
    const sources = Object.fromEntries(
      result.entries.map((entry) => [
        `docs/architecture-knowledge/changelog/entries/${entry.canonicalChangeId}.md`,
        renderLegacyChangelogRecord(entry, result),
      ]),
    );
    const registry = buildChangelogRecordRegistry(sources, {
      asOf: IMPORTED_ON,
    });
    expect(registry.roots).toHaveLength(3);
    expect(selectChangelogEntriesFromRegistry(registry)).toHaveLength(3);
    expect(
      selectChangelogEntriesFromRegistry(registry, "community-gallery").map(
        (entry) => entry.id,
      ),
    ).toEqual(["LEGACY-QH-cl-gallery"]);
  });

  it("renders a complete receipt without private identity or absolute home paths", () => {
    const result = reconcile();
    const receipt = renderMigrationReceipt(result, "imported");
    expect(receipt).toContain("global_legacy_count: 3");
    expect(receipt).toContain("community_gallery_count: 1");
    expect(receipt).toContain("pending_gallery_count: 1");
    expect(receipt).toContain("generated_markdown_sha256");
    expect(receipt).toContain("reviewed-substantive-collision");
    expect(receipt).not.toContain("private-fixture-salt");
    expect(receipt).not.toContain("/Users/");
  });

  it("rejects envelope drift, owner/local disagreement, and repository-seed drift", () => {
    const { envelope, owner, seed, policy } = fixture();
    const withExtraField = {
      ...envelope,
      unexpected: true,
    };
    expect(() =>
      reconcileQualityHubMigrationEnvelope(withExtraField, {
        sourcePackageSha256: PACKAGE_DIGEST,
        importedOn: IMPORTED_ON,
        currentRepositorySeed: seed,
        policy,
      }),
    ).toThrow("missing or unsupported fields");

    const localMismatch = {
      ...envelope,
      sources: {
        ...envelope.sources,
        localStorage: capturedVariant(
          "local-storage",
          [owner[0], owner[1], payload("cl-collision", { title: "Changed" })],
          "d".repeat(64),
        ),
      },
    };
    expect(() =>
      reconcileQualityHubMigrationEnvelope(localMismatch, {
        sourcePackageSha256: PACKAGE_DIGEST,
        importedOn: IMPORTED_ON,
        currentRepositorySeed: seed,
        policy,
      }),
    ).toThrow("Owner database and local-storage copies differ");

    expect(() =>
      reconcileQualityHubMigrationEnvelope(envelope, {
        sourcePackageSha256: PACKAGE_DIGEST,
        importedOn: IMPORTED_ON,
        currentRepositorySeed: [...seed].reverse(),
        policy,
      }),
    ).toThrow("Captured repository seed no longer matches");
  });
});
