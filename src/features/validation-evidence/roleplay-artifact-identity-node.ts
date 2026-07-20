import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';

import { ROLEPLAY_FRONTEND_ARTIFACT_MANIFEST } from '../../generated/roleplay-artifact-identity';
import { ROLEPLAY_EDGE_ARTIFACT_MANIFESTS } from '../../../supabase/functions/_shared/roleplay-artifact-manifests';
import {
  compareRoleplayArtifactIdentities,
  type RoleplayArtifactIdentity,
  type RoleplayArtifactIdentityReport,
  type RoleplayArtifactIntegrity,
  type RoleplayArtifactSourceCheck,
} from './roleplay-artifact-identity';
import type { ValidationSourceIdentity } from './source-identity';

type GeneratedRoleplayArtifactManifest = Readonly<{
  schemaVersion: 1;
  artifactName: string;
  generatedFromRevision: string | null;
  sourceDigest: string;
  sourceFiles: readonly Readonly<{ path: string; sha256: string }>[];
  terminalMigration: string | null;
  contractVersions: Readonly<Record<string, string>>;
}>;

export type RoleplayArtifactManifestCheck = Readonly<{
  manifest: GeneratedRoleplayArtifactManifest;
  sourceFiles: readonly RoleplayArtifactSourceCheck[];
  calculatedSourceDigest: string | null;
}>;

export type DeriveRoleplayArtifactIdentityReportInput = Readonly<{
  sourceIdentity: ValidationSourceIdentity;
  currentTerminalMigration: string | null;
  manifestChecks: readonly RoleplayArtifactManifestCheck[];
  observedArtifactIdentities?: readonly RoleplayArtifactIdentity[];
  generatedAt?: string;
}>;

const ROLEPLAY_ARTIFACT_MANIFESTS: readonly GeneratedRoleplayArtifactManifest[] = [
  ROLEPLAY_FRONTEND_ARTIFACT_MANIFEST,
  ...Object.values(ROLEPLAY_EDGE_ARTIFACT_MANIFESTS),
];

function sha256(value: Uint8Array | string) {
  return createHash('sha256').update(value).digest('hex');
}

function calculateSourceDigest(sourceFiles: readonly RoleplayArtifactSourceCheck[]) {
  if (sourceFiles.some((sourceFile) => !sourceFile.actualSha256)) return null;
  return sha256(sourceFiles
    .map((sourceFile) => `${sourceFile.path}:${sourceFile.actualSha256}`)
    .join('\n'));
}

function resolveRepositoryPath(repositoryRoot: string, sourcePath: string) {
  if (isAbsolute(sourcePath)) throw new Error(`Artifact source path must be repository-relative: ${sourcePath}`);
  const root = resolve(repositoryRoot);
  const target = resolve(root, sourcePath);
  const relativePath = relative(root, target);
  if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
    throw new Error(`Artifact source path escapes repository root: ${sourcePath}`);
  }
  return target;
}

async function readCurrentTerminalMigration(repositoryRoot: string) {
  try {
    const migrations = (await readdir(resolve(repositoryRoot, 'supabase/migrations')))
      .filter((name) => name.endsWith('.sql'))
      .sort();
    return migrations.at(-1) ?? null;
  } catch {
    return null;
  }
}

async function inspectManifest(
  repositoryRoot: string,
  manifest: GeneratedRoleplayArtifactManifest,
): Promise<RoleplayArtifactManifestCheck> {
  const sourceFiles = await Promise.all(manifest.sourceFiles.map(async (sourceFile) => {
    try {
      const actualSha256 = sha256(await readFile(resolveRepositoryPath(repositoryRoot, sourceFile.path)));
      return {
        path: sourceFile.path,
        expectedSha256: sourceFile.sha256,
        actualSha256,
        status: actualSha256 === sourceFile.sha256 ? 'match' : 'mismatch',
      } satisfies RoleplayArtifactSourceCheck;
    } catch {
      return {
        path: sourceFile.path,
        expectedSha256: sourceFile.sha256,
        actualSha256: null,
        status: 'missing',
      } satisfies RoleplayArtifactSourceCheck;
    }
  }));

  return {
    manifest,
    sourceFiles,
    calculatedSourceDigest: calculateSourceDigest(sourceFiles),
  };
}

export function deriveRoleplayArtifactIdentityReport(
  input: DeriveRoleplayArtifactIdentityReportInput,
): RoleplayArtifactIdentityReport {
  const observedByName = new Map<string, RoleplayArtifactIdentity[]>();
  for (const identity of input.observedArtifactIdentities ?? []) {
    observedByName.set(identity.artifactName, [...(observedByName.get(identity.artifactName) ?? []), identity]);
  }

  const artifacts = input.manifestChecks.map<RoleplayArtifactIntegrity>((check) => {
    const { manifest, sourceFiles, calculatedSourceDigest } = check;
    const missingSource = sourceFiles.some((sourceFile) => sourceFile.status === 'missing');
    const mismatchedSource = sourceFiles.some((sourceFile) => sourceFile.status === 'mismatch')
      || (calculatedSourceDigest !== null && calculatedSourceDigest !== manifest.sourceDigest);
    const terminalMigrationMismatch = input.currentTerminalMigration !== manifest.terminalMigration;
    const generatedRevisionMismatch = Boolean(
      manifest.generatedFromRevision
      && input.sourceIdentity.revision
      && manifest.generatedFromRevision !== input.sourceIdentity.revision,
    );
    const observed = observedByName.get(manifest.artifactName) ?? [];
    const duplicateObservedIdentity = observed.length > 1;
    const observedIdentity = observed.length === 1 ? observed[0] : null;
    const expectedIdentity: RoleplayArtifactIdentity = {
      schemaVersion: 1,
      artifactName: manifest.artifactName,
      sourceRevision: input.sourceIdentity.state === 'clean' ? input.sourceIdentity.revision : null,
      sourceState: input.sourceIdentity.state === 'clean' && input.sourceIdentity.revision ? 'clean' : 'unknown',
      sourceDigest: manifest.sourceDigest,
      sourceFiles: manifest.sourceFiles,
      terminalMigration: manifest.terminalMigration,
      contractVersions: manifest.contractVersions,
    };
    const runtimeComparison = duplicateObservedIdentity
      ? null
      : observedIdentity
        ? compareRoleplayArtifactIdentities(expectedIdentity, observedIdentity)
        : null;
    const runtimeArtifactNameMismatch = Boolean(
      observedIdentity && observedIdentity.artifactName !== manifest.artifactName,
    );
    const reasons = [
      ...(missingSource ? ['source_file_missing'] : []),
      ...(mismatchedSource ? ['source_hash_mismatch'] : []),
      ...(terminalMigrationMismatch ? ['terminal_migration_mismatch'] : []),
      ...(generatedRevisionMismatch ? ['generated_revision_mismatch'] : []),
      ...(duplicateObservedIdentity ? ['duplicate_runtime_identity'] : []),
      ...(runtimeArtifactNameMismatch ? ['runtime_artifact_name_mismatch'] : []),
      ...(!observedIdentity && !duplicateObservedIdentity ? ['runtime_identity_missing'] : []),
      ...(runtimeComparison?.reasons ?? []),
    ];
    const sourceIntegrity = missingSource
      ? 'missing'
      : mismatchedSource || terminalMigrationMismatch || generatedRevisionMismatch
        ? 'mismatch'
        : 'match';
    const runtimeIdentity = duplicateObservedIdentity || runtimeArtifactNameMismatch || runtimeComparison?.status === 'mismatch'
      ? 'mismatch'
      : runtimeComparison?.status ?? 'unknown';

    return {
      artifactName: manifest.artifactName,
      sourceIntegrity,
      runtimeIdentity,
      sourceFiles,
      observedIdentity,
      reasons: [...new Set(reasons)],
    };
  });
  const hasMismatch = artifacts.some((artifact) => artifact.sourceIntegrity !== 'match'
    || artifact.runtimeIdentity === 'mismatch');
  const allRuntimeIdentitiesMatch = artifacts.every((artifact) => artifact.runtimeIdentity === 'match');
  const sourceRevisionKnown = input.sourceIdentity.state === 'clean' && Boolean(input.sourceIdentity.revision);
  const state = hasMismatch
    ? 'mismatch'
    : sourceRevisionKnown && allRuntimeIdentitiesMatch
      ? 'current'
      : 'unknown';
  const reasons = [
    ...(!sourceRevisionKnown ? ['source_revision_unknown'] : []),
    ...artifacts.flatMap((artifact) => artifact.reasons.map((reason) => `${artifact.artifactName}:${reason}`)),
  ];

  return {
    schemaVersion: 1,
    state,
    sourceRevision: sourceRevisionKnown ? input.sourceIdentity.revision : null,
    sourceState: input.sourceIdentity.state,
    terminalMigration: input.currentTerminalMigration,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    artifacts,
    reasons: [...new Set(reasons)],
  };
}

export async function buildRoleplayArtifactIdentityReport(
  repositoryRoot: string,
  sourceIdentity: ValidationSourceIdentity,
  observedArtifactIdentities: readonly RoleplayArtifactIdentity[] = [],
) {
  const [manifestChecks, currentTerminalMigration] = await Promise.all([
    Promise.all(ROLEPLAY_ARTIFACT_MANIFESTS.map((manifest) => inspectManifest(repositoryRoot, manifest))),
    readCurrentTerminalMigration(repositoryRoot),
  ]);
  return deriveRoleplayArtifactIdentityReport({
    sourceIdentity,
    currentTerminalMigration,
    manifestChecks,
    observedArtifactIdentities,
  });
}
