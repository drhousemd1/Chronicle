import type { MessageFormattingWarning } from './message-formatting-utils';
import { scanBalancedParentheticalSpans } from './message-formatting-utils';
import type { RoleplayResponseJob } from './roleplay-response-job';
import type { Message } from '@/types';

export type PlayerTurnPrivateSpan = Readonly<{
  id: string;
  index: number;
  start: number;
  end: number;
  rawText: string;
  content: string;
}>;

export type PlayerTurnVisibilityProjection = Readonly<{
  sourceMessageId?: string;
  visibleText: string;
  privateSpans: readonly PlayerTurnPrivateSpan[];
  warnings: readonly MessageFormattingWarning[];
  changed: boolean;
}>;

export type RoleplayVisibleMessage = Readonly<{
  role: Message['role'];
  text: string;
}>;

function cleanProjectedText(value: string): string {
  return value
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+([,.;!?])/g, '$1')
    .trim();
}

export function projectPlayerTurnVisibility(
  rawText: string,
  sourceMessageId?: string,
): PlayerTurnVisibilityProjection {
  const { spans, warnings } = scanBalancedParentheticalSpans(rawText);
  const visibleSegments: string[] = [];
  let cursor = 0;

  spans.forEach((span) => {
    visibleSegments.push(rawText.slice(cursor, span.start));
    cursor = span.end;
  });
  visibleSegments.push(rawText.slice(cursor));

  const visibleText = cleanProjectedText(visibleSegments.join(' '));
  const privateSpans = spans.map((span, index) => ({
    id: `${sourceMessageId || 'unpersisted-player-turn'}:private-parenthetical:${index + 1}`,
    index,
    ...span,
  }));

  return {
    sourceMessageId,
    visibleText,
    privateSpans,
    warnings,
    changed: privateSpans.length > 0,
  };
}

export function projectRoleplayMessageText(
  message: Pick<Message, 'id' | 'role' | 'text'>,
): string {
  return message.role === 'user'
    ? projectPlayerTurnVisibility(message.text, message.id).visibleText
    : message.text;
}

export function buildVisibleRoleplayRecentMessages(
  messages: readonly Pick<Message, 'id' | 'role' | 'text'>[],
  limit: number,
): RoleplayVisibleMessage[] {
  if (!Number.isFinite(limit) || limit <= 0) return [];

  return messages
    .map((message) => ({
      role: message.role,
      text: projectRoleplayMessageText(message),
    }))
    .filter((message) => message.text.trim().length > 0)
    .slice(-Math.floor(limit));
}

export function findLatestVisibleSceneTag(
  messages: readonly Pick<Message, 'id' | 'role' | 'text'>[],
): string | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const visibleText = projectRoleplayMessageText(messages[index]);
    const match = visibleText.match(/\[SCENE:\s*([^\]]+?)\]/i);
    const tag = match?.[1]?.trim();
    if (tag) return tag;
  }

  return null;
}

export function applyPlayerTurnVisibilityToResponseJob(input: {
  responseJob: RoleplayResponseJob;
  rawPlayerText?: string;
}): Readonly<{
  responseJob: RoleplayResponseJob;
  projection: PlayerTurnVisibilityProjection | null;
}> {
  if (!input.responseJob.playerTurn) {
    return { responseJob: input.responseJob, projection: null };
  }

  const projection = projectPlayerTurnVisibility(
    input.rawPlayerText ?? input.responseJob.playerTurn.text,
    input.responseJob.playerTurn.messageId,
  );
  const responseJob = {
    ...input.responseJob,
    playerTurn: {
      ...input.responseJob.playerTurn,
      text: projection.visibleText,
    },
    finalUserLanes: input.responseJob.finalUserLanes.map((lane) => (
      lane.kind === 'player_turn'
        ? { ...lane, content: projection.visibleText }
        : lane
    )),
  } satisfies RoleplayResponseJob;

  return { responseJob, projection };
}
