import type { ChatDebugTrace, StoredChatDebugTrace } from './types';

function joinOrFallback(values: string[], fallback: string): string {
  return values.length ? values.join('; ') : fallback;
}

function describeFinalPath(finalPath: string): string {
  switch (finalPath) {
    case 'roleplay_v2_validated':
      return 'roleplay_v2 -> writer draft approved';
    case 'roleplay_v2_validator_revised':
      return 'roleplay_v2 -> validator revised the draft';
    case 'roleplay_v2_writer_draft':
      return 'roleplay_v2 -> writer draft used as final';
    case 'roleplay_v2_policy_repaired':
      return 'roleplay_v2 -> deterministic policy repair pass applied';
    case 'roleplay_v2_direct_fallback':
      return 'roleplay_v2 -> direct fallback';
    case 'direct':
      return 'direct pipeline';
    default:
      return finalPath;
  }
}

export function formatChatDebugTraceForSessionLog(
  traceRecord: StoredChatDebugTrace | null,
): string[] {
  if (!traceRecord) {
    return [
      '#### Debug Trace',
      '',
      '> Debug trace unavailable for this turn.',
      '',
    ];
  }

  const { trace } = traceRecord;
  const lines: string[] = [];
  lines.push('#### Debug Trace');
  lines.push('');
  lines.push(`- Pipeline: ${trace.pipeline}`);
  lines.push(`- Final path: ${describeFinalPath(trace.finalPath)}`);
  lines.push(`- Fallback reason: ${trace.fallbackReason || 'none'}`);
  lines.push(`- Latest user turn basis: ${trace.latestUserTurnPreview || '(none captured)'}`);
  lines.push(`- Recent window count: ${trace.recentWindowCount}`);
  lines.push(`- Supporting excerpts selected: ${trace.supportingExcerpts.length}`);
  lines.push(`- Planner fallback used: ${trace.planner.usedFallback ? 'yes' : 'no'}`);
  lines.push(`- Validator approved: ${trace.validator.approved === null ? 'n/a' : trace.validator.approved ? 'yes' : 'no'}`);
  lines.push(`- Validator used revision: ${trace.validator.usedRevision ? 'yes' : 'no'}`);
  lines.push(`- Normalization changed output: ${trace.normalization.changed ? 'yes' : 'no'}`);
  lines.push('');

  lines.push('**Roleplay Context**');
  lines.push('');
  lines.push(`- Conversation: ${trace.roleplayContext.conversationId || '(unknown)'}`);
  lines.push(`- Day / Time: ${trace.roleplayContext.currentDay ?? '?'} / ${trace.roleplayContext.currentTimeOfDay || '?'}`);
  lines.push(`- Active Scene: ${trace.roleplayContext.activeSceneTitle || '(none)'}`);
  lines.push(`- AI characters: ${joinOrFallback(trace.roleplayContext.aiCharacterNames, '(none)')}`);
  lines.push(`- User characters: ${joinOrFallback(trace.roleplayContext.userCharacterNames, '(none)')}`);
  lines.push('');

  lines.push('**Planner**');
  lines.push('');
  lines.push(`- Focus character: ${trace.planner.plan.focusCharacter || 'none'}`);
  lines.push(`- Allowed speakers: ${joinOrFallback(trace.planner.plan.allowedSpeakers, '(none)')}`);
  lines.push(`- Max speaker blocks: ${trace.planner.plan.maxSpeakerBlocks}`);
  lines.push(`- Immediate beat: ${trace.planner.plan.immediateBeat || '(none)'}`);
  lines.push(`- Direct questions to answer: ${joinOrFallback(trace.planner.plan.directQuestionsToAnswer, '(none)')}`);
  lines.push(`- Mentioned AI characters: ${joinOrFallback(trace.planner.plan.mentionedAiCharacters, '(none)')}`);
  lines.push(`- Must include: ${joinOrFallback(trace.planner.plan.mustInclude, '(none)')}`);
  lines.push(`- Must avoid: ${joinOrFallback(trace.planner.plan.mustAvoid, '(none)')}`);
  lines.push(`- Continuity notes: ${joinOrFallback(trace.planner.plan.continuityNotes, '(none)')}`);
  lines.push(`- Scene-state facts: ${joinOrFallback(trace.planner.plan.sceneStateFacts, '(none)')}`);
  lines.push(`- Formatting notes: ${joinOrFallback(trace.planner.plan.formattingNotes, '(none)')}`);
  lines.push(`- Planner failure reason: ${trace.planner.failureReason || 'none'}`);
  lines.push('');

  lines.push('**Supporting Excerpts**');
  lines.push('');
  if (trace.supportingExcerpts.length === 0) {
    lines.push('- None selected');
  } else {
    trace.supportingExcerpts.forEach((excerpt, index) => {
      lines.push(`${index + 1}. [${excerpt.role}] ${excerpt.selectionReason} (score ${excerpt.score}) — ${excerpt.preview}`);
    });
  }
  lines.push('');

  lines.push('**Writer / Validator**');
  lines.push('');
  lines.push(`- Writer temperature: ${trace.writer.temperature}`);
  lines.push(`- Writer draft preview: ${trace.writer.draftPreview || '(empty)'}`);
  lines.push(`- Validator issues: ${joinOrFallback(trace.validator.issues, '(none)')}`);
  lines.push(`- Validator failure reason: ${trace.validator.failureReason || 'none'}`);
  lines.push(`- Revised preview: ${trace.validator.revisedPreview || '(none)'}`);
  lines.push('');

  if (trace.notes.length > 0) {
    lines.push('**Trace Notes**');
    lines.push('');
    trace.notes.forEach((note) => lines.push(`- ${note}`));
    lines.push('');
  }

  return lines;
}

export function countCapturedAssistantDebugTraces(
  traceRecords: Array<StoredChatDebugTrace | null>,
): number {
  return traceRecords.filter(Boolean).length;
}
