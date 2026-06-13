import type { Character, ScenarioData } from '@/types';
import type { MessageSegment } from '@/services/side-character-generator';
import { parseMessageSegments } from '@/services/side-character-generator';

export const MESSAGE_SYSTEM_TAG_REGEX = /\[SCENE:\s*.*?\]|\[UPDATE:[^\]]*\]|\[ADDROW:[^\]]*\]|\[NEWCAT:[^\]]*\]/g;

export function extractHiddenMessageTags(text: string): string[] {
  return text.match(MESSAGE_SYSTEM_TAG_REGEX) ?? [];
}

export function inferCanonicalNarrativeSpeakerName(
  segment: MessageSegment,
  appData: ScenarioData,
  resolveCanonicalName?: (name: string) => string | null,
): string | null {
  const trimmed = segment.content.trim();
  if (!trimmed) return null;

  const aliases: Array<{ alias: string; canonicalName: string }> = [];

  for (const character of appData.characters) {
    aliases.push({ alias: character.name, canonicalName: character.name });
    character.nicknames?.split(',').map((value) => value.trim()).filter(Boolean).forEach((nickname) => {
      aliases.push({ alias: nickname, canonicalName: character.name });
    });
  }

  for (const character of (appData.sideCharacters || [])) {
    aliases.push({ alias: character.name, canonicalName: character.name });
    character.nicknames?.split(',').map((value) => value.trim()).filter(Boolean).forEach((nickname) => {
      aliases.push({ alias: nickname, canonicalName: character.name });
    });
  }

  aliases.sort((left, right) => right.alias.length - left.alias.length);

  for (const entry of aliases) {
    const escapedAlias = entry.alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`^${escapedAlias}(?:['’]s\\b|\\b(?=[\\s,]))`, 'i');
    if (pattern.test(trimmed)) {
      return resolveCanonicalName?.(entry.canonicalName) || entry.canonicalName;
    }
  }

  return null;
}

export function resolveRenderedSpeakerName(
  segment: MessageSegment,
  isAi: boolean,
  appData: ScenarioData,
  userChar: Character | null,
  resolveCanonicalName?: (name: string) => string | null,
): string {
  if (segment.speakerName) {
    const canonical = resolveCanonicalName?.(segment.speakerName);
    return (canonical || segment.speakerName).toLowerCase();
  } else if (isAi) {
    const inferredName = inferCanonicalNarrativeSpeakerName(segment, appData, resolveCanonicalName);
    if (inferredName) return inferredName.toLowerCase();
    const aiChars = appData.characters.filter(c => c.controlledBy === 'AI');
    return (aiChars[0]?.name || 'Narrator').toLowerCase();
  } else if (!isAi) {
    return (userChar?.name || 'You').toLowerCase();
  } else {
    const aiChars = appData.characters.filter(c => c.controlledBy === 'AI');
    return (aiChars[0]?.name || 'Narrator').toLowerCase();
  }
}

export function mergeByRenderedSpeaker(
  rawSegments: MessageSegment[],
  isAi: boolean,
  appData: ScenarioData,
  userChar: Character | null,
  resolveCanonicalName?: (name: string) => string | null,
): MessageSegment[] {
  if (rawSegments.length <= 1) return rawSegments;

  const withResolvedNames = rawSegments.map(seg => ({
    ...seg,
    resolvedName: resolveRenderedSpeakerName(seg, isAi, appData, userChar, resolveCanonicalName),
    canonicalSpeakerName: seg.speakerName
      ? (resolveCanonicalName?.(seg.speakerName) || seg.speakerName)
      : inferCanonicalNarrativeSpeakerName(seg, appData, resolveCanonicalName)
  }));

  const merged: MessageSegment[] = [];
  let current = withResolvedNames[0];

  for (let i = 1; i < withResolvedNames.length; i++) {
    const next = withResolvedNames[i];
    if (current.resolvedName === next.resolvedName) {
      current = {
        ...current,
        content: current.content + '\n\n' + next.content
      };
    } else {
      merged.push({
        speakerName: current.canonicalSpeakerName ?? current.speakerName,
        content: current.content
      });
      current = next;
    }
  }
  merged.push({
    speakerName: current.canonicalSpeakerName ?? current.speakerName,
    content: current.content
  });

  return merged;
}

export function buildEditableMessageSegments(
  text: string,
  isAi: boolean,
  appData: ScenarioData,
  userChar: Character | null,
  resolveCanonicalName?: (name: string) => string | null,
): MessageSegment[] {
  return mergeByRenderedSpeaker(
    parseMessageSegments(text),
    isAi,
    appData,
    userChar,
    resolveCanonicalName,
  );
}

export function serializeEditableMessageSegments(segments: MessageSegment[]): string {
  return segments
    .map((segment) => {
      const content = segment.content.trim();
      if (!content) return '';
      return segment.speakerName ? `${segment.speakerName}: ${content}` : content;
    })
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

export function buildInlineEditedMessageText(segments: MessageSegment[], systemTags: string[]): string {
  const visibleBody = serializeEditableMessageSegments(segments);
  const hiddenTags = systemTags.join('\n').trim();
  return [hiddenTags, visibleBody].filter((part) => part.trim().length > 0).join('\n\n').trim();
}
