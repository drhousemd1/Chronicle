import { describe, expect, it } from 'vitest';

import {
  buildRoleplayFrontendArtifactIdentity,
  compareRoleplayArtifactIdentities,
  type RoleplayArtifactIdentity,
} from './roleplay-artifact-identity';

function identity(patch: Partial<RoleplayArtifactIdentity> = {}): RoleplayArtifactIdentity {
  return {
    schemaVersion: 1,
    artifactName: 'frontend',
    sourceRevision: 'revision-1',
    sourceState: 'clean',
    sourceDigest: 'digest-1',
    sourceFiles: [],
    terminalMigration: 'migration.sql',
    contractVersions: { responseJob: 'v1' },
    ...patch,
  };
}

describe('roleplay artifact identity', () => {
  it('exposes the generated frontend source digest without inventing a revision', () => {
    const result = buildRoleplayFrontendArtifactIdentity();
    expect(result.artifactName).toBe('frontend');
    expect(result.sourceDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(result.sourceRevision).toBeNull();
    expect(result.sourceState).toBe('unknown');
  });

  it('requires revision, digest, schema, and contract agreement for a match', () => {
    expect(compareRoleplayArtifactIdentities(identity(), identity())).toMatchObject({
      status: 'match',
      revisionMatch: true,
      sourceDigestMatch: true,
      terminalMigrationMatch: true,
      contractVersionsMatch: true,
      reasons: [],
    });
  });

  it('keeps matching hashes at unknown freshness when either exact revision is missing', () => {
    expect(compareRoleplayArtifactIdentities(
      identity({ sourceRevision: null, sourceState: 'unknown' }),
      identity(),
    )).toMatchObject({
      status: 'unknown',
      revisionMatch: null,
      reasons: ['source_revision_unknown'],
    });
  });

  it('reports a blocking mismatch without combining different artifacts', () => {
    const result = compareRoleplayArtifactIdentities(
      identity(),
      identity({ sourceDigest: 'different', sourceRevision: 'revision-2' }),
    );
    expect(result.status).toBe('mismatch');
    expect(result.reasons).toEqual(['source_digest_mismatch', 'source_revision_mismatch']);
  });
});
