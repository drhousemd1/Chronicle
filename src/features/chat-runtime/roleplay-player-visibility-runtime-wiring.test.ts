import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const source = readFileSync('src/components/chronicle/ChatInterfaceTab.tsx', 'utf8');
const llmSource = readFileSync('src/services/llm.ts', 'utf8');
const sceneDetectionSource = source.slice(
  source.indexOf('// Canonical scene context is stricter'),
  source.indexOf('// NOTE: Loading/missing conversation guards'),
);
const sceneImageSource = source.slice(
  source.indexOf('// Generate scene image from recent conversation context'),
  source.indexOf('const handleRegenerateSceneImage'),
);

describe('player visibility runtime wiring', () => {
  it('derives canonical and visual scene tags only from model-visible message text', () => {
    expect(sceneDetectionSource).toContain(
      'findLatestVisibleSceneTag(conversation?.messages ?? [])',
    );
    expect(sceneDetectionSource).toContain(
      'findLatestVisibleSceneTag(conversation.messages)',
    );
    expect(sceneDetectionSource).toContain(
      'buildVisibleRoleplayRecentMessages(sceneDetectionMessages, 5)',
    );
    expect(sceneDetectionSource).not.toContain('conversation.messages[i].text.match');
  });

  it('projects scene-image context before it reaches the edge function', () => {
    expect(sceneImageSource).toContain('const recentMessages = buildVisibleRoleplayRecentMessages(');
    expect(sceneImageSource).toContain("conversation.messages.filter((message) => !isLocalRoleplayNoticeMessage(message))");
    expect(sceneImageSource).toContain('recentMessages,');
    expect(sceneImageSource).not.toContain('.slice(-5)');
  });

  it('threads the original current-turn projection into API Call 1 receipts', () => {
    expect(llmSource).toContain('projection: initialPlayerTurnVisibilityProjection');
    expect(llmSource).toContain(
      'playerTurnVisibilityProjection: initialPlayerTurnVisibilityProjection',
    );
  });
});
