import { ROLEPLAY_FRONTEND_ARTIFACT_MANIFEST } from '../../generated/roleplay-artifact-identity';

export type RoleplayArtifactSourceFile = Readonly<{
  path: string;
  sha256: string;
}>;

export type RoleplayArtifactIdentity = Readonly<{
  schemaVersion: 1;
  artifactName: string;
  sourceRevision: string | null;
  sourceState: 'clean' | 'unknown';
  sourceDigest: string;
  sourceFiles: readonly RoleplayArtifactSourceFile[];
  terminalMigration: string | null;
  contractVersions: Readonly<Record<string, string>>;
}>;

export type RoleplayArtifactIdentityComparison = Readonly<{
  status: 'match' | 'mismatch' | 'unknown';
  revisionMatch: boolean | null;
  sourceDigestMatch: boolean;
  terminalMigrationMatch: boolean;
  contractVersionsMatch: boolean;
  reasons: readonly string[];
}>;

export type RoleplayArtifactSourceCheck = Readonly<{
  path: string;
  expectedSha256: string;
  actualSha256: string | null;
  status: 'match' | 'mismatch' | 'missing';
}>;

export type RoleplayArtifactIntegrity = Readonly<{
  artifactName: string;
  sourceIntegrity: 'match' | 'mismatch' | 'missing';
  runtimeIdentity: 'match' | 'mismatch' | 'unknown';
  sourceFiles: readonly RoleplayArtifactSourceCheck[];
  observedIdentity: RoleplayArtifactIdentity | null;
  reasons: readonly string[];
}>;

export type RoleplayArtifactIdentityReport = Readonly<{
  schemaVersion: 1;
  state: 'current' | 'unknown' | 'mismatch';
  sourceRevision: string | null;
  sourceState: 'clean' | 'dirty' | 'unknown';
  terminalMigration: string | null;
  generatedAt: string;
  artifacts: readonly RoleplayArtifactIntegrity[];
  reasons: readonly string[];
}>;

export function buildRoleplayFrontendArtifactIdentity(): RoleplayArtifactIdentity {
  const sourceRevision = ROLEPLAY_FRONTEND_ARTIFACT_MANIFEST.generatedFromRevision;
  return {
    ...ROLEPLAY_FRONTEND_ARTIFACT_MANIFEST,
    sourceRevision,
    sourceState: sourceRevision ? 'clean' : 'unknown',
  };
}

export function compareRoleplayArtifactIdentities(
  left: RoleplayArtifactIdentity | null | undefined,
  right: RoleplayArtifactIdentity | null | undefined,
): RoleplayArtifactIdentityComparison {
  if (!left || !right) {
    return {
      status: 'unknown',
      revisionMatch: null,
      sourceDigestMatch: false,
      terminalMigrationMatch: false,
      contractVersionsMatch: false,
      reasons: ['artifact_identity_missing'],
    };
  }

  const revisionMatch = left.sourceRevision && right.sourceRevision
    ? left.sourceRevision === right.sourceRevision
    : null;
  const sourceDigestMatch = left.sourceDigest === right.sourceDigest;
  const terminalMigrationMatch = left.terminalMigration === right.terminalMigration;
  const contractVersionsMatch = JSON.stringify(left.contractVersions)
    === JSON.stringify(right.contractVersions);
  const reasons = [
    ...(!sourceDigestMatch ? ['source_digest_mismatch'] : []),
    ...(!terminalMigrationMatch ? ['terminal_migration_mismatch'] : []),
    ...(!contractVersionsMatch ? ['contract_version_mismatch'] : []),
    ...(revisionMatch === false ? ['source_revision_mismatch'] : []),
    ...(revisionMatch === null ? ['source_revision_unknown'] : []),
  ];

  return {
    status: reasons.some((reason) => reason !== 'source_revision_unknown')
      ? 'mismatch'
      : revisionMatch === true
        ? 'match'
        : 'unknown',
    revisionMatch,
    sourceDigestMatch,
    terminalMigrationMatch,
    contractVersionsMatch,
    reasons,
  };
}
