import { describe, expect, it } from 'vitest';

import type { RoleplayArtifactIdentity } from './roleplay-artifact-identity';
import {
  deriveRoleplayArtifactIdentityReport,
  type RoleplayArtifactManifestCheck,
} from './roleplay-artifact-identity-node';

const FILE_DIGEST = 'a'.repeat(64);
const SOURCE_DIGEST = 'b'.repeat(64);

function manifestCheck(
  patch: Partial<RoleplayArtifactManifestCheck> = {},
): RoleplayArtifactManifestCheck {
  return {
    manifest: {
      schemaVersion: 1,
      artifactName: 'frontend',
      generatedFromRevision: null,
      sourceDigest: SOURCE_DIGEST,
      sourceFiles: [{ path: 'src/example.ts', sha256: FILE_DIGEST }],
      terminalMigration: '20260719001853_terminal.sql',
      contractVersions: { responseJob: 'v1' },
    },
    sourceFiles: [{
      path: 'src/example.ts',
      expectedSha256: FILE_DIGEST,
      actualSha256: FILE_DIGEST,
      status: 'match',
    }],
    calculatedSourceDigest: SOURCE_DIGEST,
    ...patch,
  };
}

function observedIdentity(
  patch: Partial<RoleplayArtifactIdentity> = {},
): RoleplayArtifactIdentity {
  return {
    schemaVersion: 1,
    artifactName: 'frontend',
    sourceRevision: 'revision-1',
    sourceState: 'clean',
    sourceDigest: SOURCE_DIGEST,
    sourceFiles: [{ path: 'src/example.ts', sha256: FILE_DIGEST }],
    terminalMigration: '20260719001853_terminal.sql',
    contractVersions: { responseJob: 'v1' },
    ...patch,
  };
}

describe('roleplay artifact identity report', () => {
  it('keeps matching source files unknown when the source revision is dirty', () => {
    const report = deriveRoleplayArtifactIdentityReport({
      sourceIdentity: { revision: null, state: 'dirty' },
      currentTerminalMigration: '20260719001853_terminal.sql',
      manifestChecks: [manifestCheck()],
      observedArtifactIdentities: [observedIdentity({ sourceRevision: null, sourceState: 'unknown' })],
      generatedAt: '2026-07-19T00:00:00.000Z',
    });

    expect(report.state).toBe('unknown');
    expect(report.sourceRevision).toBeNull();
    expect(report.reasons).toContain('source_revision_unknown');
  });

  it('reports current only for a clean exact revision with matching observed identity', () => {
    const report = deriveRoleplayArtifactIdentityReport({
      sourceIdentity: { revision: 'revision-1', state: 'clean' },
      currentTerminalMigration: '20260719001853_terminal.sql',
      manifestChecks: [manifestCheck()],
      observedArtifactIdentities: [observedIdentity()],
      generatedAt: '2026-07-19T00:00:00.000Z',
    });

    expect(report.state).toBe('current');
    expect(report.artifacts[0]).toMatchObject({
      sourceIntegrity: 'match',
      runtimeIdentity: 'match',
      reasons: [],
    });
  });

  it('keeps matching local source unknown when no runtime identity was observed', () => {
    const report = deriveRoleplayArtifactIdentityReport({
      sourceIdentity: { revision: 'revision-1', state: 'clean' },
      currentTerminalMigration: '20260719001853_terminal.sql',
      manifestChecks: [manifestCheck()],
      generatedAt: '2026-07-19T00:00:00.000Z',
    });

    expect(report.state).toBe('unknown');
    expect(report.artifacts[0].runtimeIdentity).toBe('unknown');
    expect(report.reasons).toContain('frontend:runtime_identity_missing');
  });

  it('reports a source hash mismatch as mismatch even when runtime identity agrees with the manifest', () => {
    const report = deriveRoleplayArtifactIdentityReport({
      sourceIdentity: { revision: 'revision-1', state: 'clean' },
      currentTerminalMigration: '20260719001853_terminal.sql',
      manifestChecks: [manifestCheck({
        sourceFiles: [{
          path: 'src/example.ts',
          expectedSha256: FILE_DIGEST,
          actualSha256: 'c'.repeat(64),
          status: 'mismatch',
        }],
        calculatedSourceDigest: 'd'.repeat(64),
      })],
      observedArtifactIdentities: [observedIdentity()],
      generatedAt: '2026-07-19T00:00:00.000Z',
    });

    expect(report.state).toBe('mismatch');
    expect(report.artifacts[0].sourceIntegrity).toBe('mismatch');
    expect(report.reasons).toContain('frontend:source_hash_mismatch');
  });

  it('reports terminal migration drift as mismatch', () => {
    const report = deriveRoleplayArtifactIdentityReport({
      sourceIdentity: { revision: 'revision-1', state: 'clean' },
      currentTerminalMigration: '20260719009999_newer.sql',
      manifestChecks: [manifestCheck()],
      observedArtifactIdentities: [observedIdentity()],
      generatedAt: '2026-07-19T00:00:00.000Z',
    });

    expect(report.state).toBe('mismatch');
    expect(report.artifacts[0].sourceIntegrity).toBe('mismatch');
    expect(report.reasons).toContain('frontend:terminal_migration_mismatch');
  });
});
