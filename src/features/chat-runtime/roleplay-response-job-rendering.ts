import type {
  RoleplayFinalUserLane,
  RoleplayFinalUserLaneEvidence,
  RoleplayResponseJob,
} from './roleplay-response-job';

export const ROLEPLAY_EXECUTION_BRIEF_TEXT = `[EXECUTION BRIEF]
Continue from the latest established scene change.
Preserve user-written facts, character awareness, and the current physical state.
When player_turn conflicts with current_state, follow player_turn for the current response and treat current_state as lower-authority background until state reconciliation updates it.
Recent messages provide story state and continuity, not a template for response length or structure.
Follow the active Response Detail setting.
Use clear external dialogue when a present AI-controlled character can naturally speak.
Develop the AI-controlled character's side of the current exchange before stopping for the user.
Stop before narrating any user-owned response, decision, voluntary follow-up, or interpretation.`;

function compactLaneContent(value: string, maxLength = 180): string {
  const compact = value.replace(/\s+/g, ' ').trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength - 3)}...`;
}

function renderLaneLabel(lane: RoleplayFinalUserLane): string {
  const facing = lane.modelFacing ? 'model-facing' : 'debug-only';
  return `[${lane.kind} | ${lane.sourceRole} | ${lane.authority} | ${facing}]`;
}

export function getRoleplayResponseJobFinalUserLaneEvidence(responseJob: RoleplayResponseJob): RoleplayFinalUserLaneEvidence[] {
  return responseJob.finalUserLanes.map((lane) => {
    const content = lane.content.trim();

    return {
      id: lane.id,
      kind: lane.kind,
      sourceRole: lane.sourceRole,
      authority: lane.authority,
      modelFacing: lane.modelFacing,
      contentLength: content.length,
      contentPreview: compactLaneContent(content),
    };
  });
}

export function renderRoleplayResponseJobFinalUserContent(responseJob: RoleplayResponseJob): string {
  const laneBlocks = responseJob.finalUserLanes
    .filter((lane) => lane.modelFacing)
    .map((lane) => `${renderLaneLabel(lane)}\n${lane.content.trim()}`)
    .join('\n\n');

  return [
    `[ROLEPLAY RESPONSE JOB]
Mode: ${responseJob.mode}
Purpose: ${responseJob.purpose}
History policy: ${responseJob.historyPolicy.strategy}`,
    laneBlocks ? `[FINAL USER LANES]\n${laneBlocks}` : '',
    ROLEPLAY_EXECUTION_BRIEF_TEXT,
  ]
    .filter(Boolean)
    .join('\n\n')
    .trim();
}
