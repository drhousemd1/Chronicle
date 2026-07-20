import { ROLEPLAY_EDGE_ARTIFACT_MANIFESTS } from './roleplay-artifact-manifests.ts';

export type RoleplayEdgeArtifactName = keyof typeof ROLEPLAY_EDGE_ARTIFACT_MANIFESTS;

export function buildRoleplayEdgeArtifactIdentity(artifactName: RoleplayEdgeArtifactName) {
  const manifest = ROLEPLAY_EDGE_ARTIFACT_MANIFESTS[artifactName];
  const sourceRevision = Deno.env.get('CHRONICLE_SOURCE_REVISION')?.trim()
    || manifest.generatedFromRevision
    || null;
  return {
    ...manifest,
    sourceRevision,
    sourceState: sourceRevision ? 'clean' as const : 'unknown' as const,
  };
}
