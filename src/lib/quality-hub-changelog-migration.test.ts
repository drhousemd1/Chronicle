import { createHash, webcrypto } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  CHANGELOG_MIGRATION_LIMITS,
  CHANGELOG_MIGRATION_PACKAGE_TYPE,
  CHANGELOG_MIGRATION_PACKAGE_VERSION,
  ChangelogMigrationError,
  analyzeQualityHubRegistrySource,
  assertBoundedJsonGraph,
  canonicalJsonStringify,
  createChangelogMigrationExport,
  projectQualityHubChangeLog,
  sha256Hex,
  type CreateChangelogMigrationExportInput,
  type MigrationCryptoRuntime,
} from "@/lib/quality-hub-changelog-migration";

const secureCrypto: MigrationCryptoRuntime = {
  isSecureContext: true,
  subtle: webcrypto.subtle as unknown as SubtleCrypto,
  getRandomValues: (target) => {
    webcrypto.getRandomValues(target);
    return target;
  },
};

const capturedAt = "2026-08-01T12:34:56.789Z";
const databaseUpdatedAt = "2026-08-01T12:30:00.000Z";
const initialReadAt = "2026-08-01T12:31:00.000Z";
const finalReadAt = "2026-08-01T12:34:00.000Z";
const localInitialCapturedAt = "2026-08-01T12:29:00.000Z";
const localFinalCapturedAt = "2026-08-01T12:33:00.000Z";

function changeLogEntry(overrides: Record<string, unknown> = {}) {
  return {
    id: "cl-1",
    title: "Gallery change",
    summary: "A concise summary.",
    severity: "fix",
    status: "completed",
    problem: "The old behavior was incorrect.",
    plan: "Correct the behavior.",
    changes: "The behavior was corrected.",
    filesAffected: ["src/example.ts"],
    agent: "Codex",
    relatedFindingIds: ["finding-1"],
    relatedRunIds: ["run-1"],
    tags: ["community-gallery"],
    comments: [
      {
        id: "comment-1",
        author: "Owner",
        timestamp: "2026-08-01T12:00:00.000Z",
        text: "Accepted.",
      },
    ],
    createdAt: "2026-08-01T11:00:00.000Z",
    updatedAt: "2026-08-01T12:00:00.000Z",
    ...overrides,
  };
}

function registry(
  entry = changeLogEntry(),
  extras: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    meta: {
      version: "quality-hub-v1",
      registryVersion: 50,
      project: "Chronicle",
      createdAt: "2026-01-01T00:00:00.000Z",
      lastUpdatedAt: databaseUpdatedAt,
    },
    scanModules: [],
    runs: [],
    findings: [],
    reviewUnits: [],
    changeLog: [entry],
    handoffNotes: "",
    ...extras,
  };
}

function exportInput(
  overrides: Partial<CreateChangelogMigrationExportInput> = {},
): CreateChangelogMigrationExportInput {
  const ownerRegistry = registry();
  return {
    authenticatedOwnerInitial: {
      authenticatedUserId: "owner-user-id-123",
      authenticatedUserEmail: "owner@example.test",
      databaseUpdatedAt,
      readAt: initialReadAt,
      registry: ownerRegistry,
    },
    authenticatedOwnerFinal: {
      authenticatedUserId: "owner-user-id-123",
      authenticatedUserEmail: "owner@example.test",
      databaseUpdatedAt,
      readAt: finalReadAt,
      registry: structuredClone(ownerRegistry),
    },
    localStorageInitial: {
      presence: "captured",
      capturedAt: localInitialCapturedAt,
      registry: structuredClone(ownerRegistry),
    },
    localStorageFinal: {
      presence: "captured",
      capturedAt: localFinalCapturedAt,
      registry: structuredClone(ownerRegistry),
    },
    repositorySeedRegistry: structuredClone(ownerRegistry),
    capturedAt,
    applicationBuild: {
      applicationVersion: "0.0.0",
      sourceRevision: "d9a3fa6adfd84ab896289e03d82283f676a1695e",
      sourceFingerprint: "a".repeat(64),
    },
    ...overrides,
  };
}

async function expectMigrationError(
  promise: Promise<unknown>,
  code: ChangelogMigrationError["code"],
) {
  try {
    await promise;
    throw new Error("Expected migration capture to fail.");
  } catch (error) {
    expect(error).toBeInstanceOf(ChangelogMigrationError);
    expect((error as ChangelogMigrationError).code).toBe(code);
  }
}

describe("canonical JSON and SHA-256", () => {
  it("sorts object keys recursively while preserving array order", () => {
    expect(
      canonicalJsonStringify({ z: 1, a: { d: 4, c: 3 }, list: ["second", "first"] }),
    ).toBe('{"a":{"c":3,"d":4},"list":["second","first"],"z":1}');
    expect(canonicalJsonStringify([3, 2, 1])).toBe("[3,2,1]");
  });

  it("rejects an oversized or excessively wide graph before canonical serialization", () => {
    expect(() => assertBoundedJsonGraph({ value: "0123456789" }, 8)).toThrow(
      /migration size limit/,
    );
    expect(() => assertBoundedJsonGraph(new Array(20).fill(1), 10)).toThrow(
      /migration node limit/,
    );
  });

  it("matches the published SHA-256 vector for abc", async () => {
    await expect(sha256Hex("abc", secureCrypto)).resolves.toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("fails closed in an insecure context or without SubtleCrypto", async () => {
    await expectMigrationError(
      sha256Hex("abc", { ...secureCrypto, isSecureContext: false }),
      "INSECURE_CONTEXT",
    );
    await expectMigrationError(
      sha256Hex("abc", { isSecureContext: true, getRandomValues: secureCrypto.getRandomValues }),
      "CRYPTO_UNAVAILABLE",
    );
  });
});

describe("strict Changelog projection", () => {
  it("copies only the current ChangeLogEntry and comment contract", () => {
    const original = changeLogEntry();
    const projected = projectQualityHubChangeLog([original]);
    expect(projected).toEqual([original]);
    expect(projected[0]).not.toBe(original);
    expect(projected[0].comments[0]).not.toBe(original.comments[0]);
  });

  it("rejects unknown entry and nested comment fields", () => {
    expect(() =>
      projectQualityHubChangeLog([changeLogEntry({ privateToken: "must-not-pass" })]),
    ).toThrow(/unknown field privateToken/);
    expect(() =>
      projectQualityHubChangeLog([
        changeLogEntry({
          comments: [
            {
              id: "comment-1",
              author: "Owner",
              timestamp: capturedAt,
              text: "Accepted.",
              session: "must-not-pass",
            },
          ],
        }),
      ]),
    ).toThrow(/unknown field session/);
  });

  it("rejects malformed arrays and values outside the exact enums", () => {
    expect(() =>
      projectQualityHubChangeLog([changeLogEntry({ filesAffected: "src/example.ts" })]),
    ).toThrow(/filesAffected must be an array/);
    expect(() =>
      projectQualityHubChangeLog([changeLogEntry({ severity: "urgent" })]),
    ).toThrow(/severity is not an allowed value/);
    expect(() =>
      projectQualityHubChangeLog([changeLogEntry({ status: "verified" })]),
    ).toThrow(/status is not an allowed value/);
  });

  it("rejects too many entries and oversized content before export", () => {
    const tooMany = new Array(CHANGELOG_MIGRATION_LIMITS.maxEntries + 1).fill(null);
    expect(() => projectQualityHubChangeLog(tooMany)).toThrow(/entry-count limit/);
    expect(() =>
      projectQualityHubChangeLog([
        changeLogEntry({
          summary: "x".repeat(CHANGELOG_MIGRATION_LIMITS.maxStringBytes + 1),
        }),
      ]),
    ).toThrow(/string-size limit/);
  });
});

describe("source analysis", () => {
  it("retains only the projected Changelog while hashing the complete source", async () => {
    const fullRegistrySecret = "ONLY-IN-THE-FULL-REGISTRY";
    const analyzed = await analyzeQualityHubRegistrySource(
      registry(changeLogEntry(), { handoffNotes: fullRegistrySecret }),
      "owner-db",
      capturedAt,
      secureCrypto,
    );

    expect(analyzed.source).toBe("owner-db");
    expect(analyzed.registryVersion).toBe(50);
    expect(analyzed.changeLogCount).toBe(1);
    expect(analyzed.fullRegistryHash).toMatch(/^[a-f0-9]{64}$/);
    expect(analyzed.changeLogHash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(analyzed)).not.toContain(fullRegistrySecret);
    expect(analyzed).not.toHaveProperty("registry");
  });

  it("treats a valid pre-Changelog registry as captured history with zero entries", async () => {
    const legacyRegistry = registry();
    delete legacyRegistry.changeLog;
    const analyzed = await analyzeQualityHubRegistrySource(
      legacyRegistry,
      "local-storage",
      localInitialCapturedAt,
      secureCrypto,
    );
    expect(analyzed.changeLogCount).toBe(0);
    expect(analyzed.changeLog).toEqual([]);
    expect(analyzed.fullRegistryHash).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("authenticated migration export", () => {
  it("blocks owner identity, database timestamp, and registry hash changes", async () => {
    const identityInput = exportInput();
    identityInput.authenticatedOwnerFinal.authenticatedUserId = "different-owner";
    await expectMigrationError(
      createChangelogMigrationExport(identityInput, secureCrypto),
      "OWNER_IDENTITY_CHANGED",
    );

    const timestampInput = exportInput();
    timestampInput.authenticatedOwnerFinal.databaseUpdatedAt = "2026-08-01T12:31:00.000Z";
    await expectMigrationError(
      createChangelogMigrationExport(timestampInput, secureCrypto),
      "OWNER_UPDATED_AT_CHANGED",
    );

    const hashInput = exportInput();
    hashInput.authenticatedOwnerFinal.registry = registry(
      changeLogEntry({ summary: "Changed during capture." }),
    );
    await expectMigrationError(
      createChangelogMigrationExport(hashInput, secureCrypto),
      "OWNER_REGISTRY_CHANGED",
    );
  });

  it("always distinguishes owner, local-storage, and repository-seed sources", async () => {
    const present = await createChangelogMigrationExport(exportInput(), secureCrypto);
    expect(present.envelope.sources.ownerDb.source).toBe("owner-db");
    expect(present.envelope.sources.localStorage.source).toBe("local-storage");
    expect(present.envelope.sources.repositorySeed.source).toBe("repository-seed");
    expect(present.envelope.sources.localStorage.presence).toBe("captured");
    expect(present.envelope.sources.ownerDb.capturedAt).toBe(finalReadAt);
    expect(present.envelope.sources.localStorage.capturedAt).toBe(localInitialCapturedAt);
    expect(present.envelope.qualityHub.applicationVersion).toBe("0.0.0");
    expect(present.envelope.qualityHub.sourceRevision).toHaveLength(40);
    expect(present.envelope.qualityHub.sourceFingerprintAlgorithm).toBe("SHA-256");
    expect(present.envelope.qualityHub.sourceFingerprintScope).toBe(
      "git-tracked-and-untracked-nonignored-file-bytes-v1",
    );
    expect(present.envelope.qualityHub.sourceFingerprint).toHaveLength(64);

    const absent = await createChangelogMigrationExport(
      exportInput({
        localStorageInitial: {
          presence: "absent",
          capturedAt: localInitialCapturedAt,
          registry: null,
        },
        localStorageFinal: {
          presence: "absent",
          capturedAt: localFinalCapturedAt,
          registry: null,
        },
      }),
      secureCrypto,
    );
    expect(absent.envelope.sources.localStorage).toEqual({
      presence: "absent",
      source: "local-storage",
      capturedAt: localInitialCapturedAt,
      registryVersion: null,
      fullRegistryHash: null,
      changeLogHash: null,
      changeLogCount: 0,
      changeLog: [],
    });
  });

  it("fails closed when present local-storage data is malformed", async () => {
    await expectMigrationError(
      createChangelogMigrationExport(
        exportInput({
          localStorageInitial: {
            presence: "captured",
            capturedAt: localInitialCapturedAt,
            registry: { meta: {}, changeLog: "not-an-array" },
          },
        }),
        secureCrypto,
      ),
      "INVALID_INPUT",
    );
  });

  it("blocks local-storage presence or content changes during capture", async () => {
    const presenceInput = exportInput({
      localStorageFinal: {
        presence: "absent",
        capturedAt: localFinalCapturedAt,
        registry: null,
      },
    });
    await expectMigrationError(
      createChangelogMigrationExport(presenceInput, secureCrypto),
      "LOCAL_STORAGE_CHANGED",
    );

    const contentInput = exportInput();
    contentInput.localStorageFinal = {
      presence: "captured",
      capturedAt: localFinalCapturedAt,
      registry: registry(changeLogEntry({ summary: "Changed in another tab." })),
    };
    await expectMigrationError(
      createChangelogMigrationExport(contentInput, secureCrypto),
      "LOCAL_STORAGE_CHANGED",
    );
  });

  it("uses the fixed package identity and omits private registry and auth material", async () => {
    const rawUserId = "private-owner-uuid-12345";
    const ownerRegistry = registry(changeLogEntry(), {
      handoffNotes: "FULL-REGISTRY-ONLY-PRIVATE-NOTE",
      session: "SUPABASE-SESSION-MUST-NOT-EXPORT",
    });
    const input = exportInput({
      authenticatedOwnerInitial: {
        authenticatedUserId: rawUserId,
        authenticatedUserEmail: null,
        databaseUpdatedAt,
        readAt: initialReadAt,
        registry: ownerRegistry,
      },
      authenticatedOwnerFinal: {
        authenticatedUserId: rawUserId,
        authenticatedUserEmail: null,
        databaseUpdatedAt,
        readAt: finalReadAt,
        registry: structuredClone(ownerRegistry),
      },
    });
    const result = await createChangelogMigrationExport(input, secureCrypto);

    expect(result.envelope.packageType).toBe(CHANGELOG_MIGRATION_PACKAGE_TYPE);
    expect(result.envelope.packageVersion).toBe(CHANGELOG_MIGRATION_PACKAGE_VERSION);
    expect(result.envelope.authenticatedOwner.userFingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(result.envelope.authenticatedOwner.fingerprintSalt).toMatch(/^[a-f0-9]{64}$/);
    expect(result.json).not.toContain(rawUserId);
    expect(result.json).not.toContain("FULL-REGISTRY-ONLY-PRIVATE-NOTE");
    expect(result.json).not.toContain("SUPABASE-SESSION-MUST-NOT-EXPORT");
    expect(result.json).not.toContain("email");
    expect(result.json).not.toContain("access_token");
    expect(result.json).not.toContain("supabaseUrl");
  });

  it("blocks owner identifiers and email addresses embedded in projected history", async () => {
    const ownerIdInput = exportInput();
    const ownerRegistry = registry(
      changeLogEntry({ summary: "Changed by owner-user-id-123." }),
    );
    ownerIdInput.authenticatedOwnerInitial.registry = ownerRegistry;
    ownerIdInput.authenticatedOwnerFinal.registry = structuredClone(ownerRegistry);
    await expectMigrationError(
      createChangelogMigrationExport(ownerIdInput, secureCrypto),
      "SENSITIVE_VALUE_FOUND",
    );

    const emailInput = exportInput();
    const emailRegistry = registry(
      changeLogEntry({ comments: [{
        id: "comment-1",
        author: "Owner",
        timestamp: capturedAt,
        text: "Contact private.person@example.com",
      }] }),
    );
    emailInput.authenticatedOwnerInitial.registry = emailRegistry;
    emailInput.authenticatedOwnerFinal.registry = structuredClone(emailRegistry);
    await expectMigrationError(
      createChangelogMigrationExport(emailInput, secureCrypto),
      "SENSITIVE_VALUE_FOUND",
    );
  });

  it("uses a fresh per-export salt so owner fingerprints are not reusable identifiers", async () => {
    const first = await createChangelogMigrationExport(exportInput(), secureCrypto);
    const second = await createChangelogMigrationExport(exportInput(), secureCrypto);

    expect(first.envelope.authenticatedOwner.fingerprintDomain).toBe(
      "chronicle-quality-hub-changelog-migration/v1/authenticated-owner",
    );
    expect(first.envelope.authenticatedOwner.fingerprintSalt).not.toBe(
      second.envelope.authenticatedOwner.fingerprintSalt,
    );
    expect(first.envelope.authenticatedOwner.userFingerprint).not.toBe(
      second.envelope.authenticatedOwner.userFingerprint,
    );
  });

  it("checksums the exact serialized UTF-8 bytes and returns safe filenames", async () => {
    const result = await createChangelogMigrationExport(exportInput(), secureCrypto);
    const independentlyComputedHash = createHash("sha256").update(result.bytes).digest("hex");

    expect(new TextDecoder().decode(result.bytes)).toBe(result.json);
    expect(result.sha256).toBe(independentlyComputedHash);
    expect(result.filename).toMatch(
      /^chronicle-quality-hub-changelog-migration-v1-[0-9]+-qhcm-[a-f0-9]{32}\.json$/,
    );
    expect(result.filename).not.toMatch(/[\\/:*?"<>|]/);
    expect(result.checksumFilename).toBe(`${result.filename}.sha256`);
    expect(result.checksumText).toBe(`${result.sha256}  ${result.filename}\n`);
  });
});
