import { describe, expect, it } from 'vitest';
import type { Conversation, ScenarioData } from '@/types';
import { buildChatReviewHtml } from './review-export';

const appData = {
  characters: [
    {
      name: 'James',
      nicknames: '',
      controlledBy: 'User',
      characterRole: 'Main',
      avatarDataUrl: 'data:image/png;base64,user-avatar',
    },
    {
      name: 'Sarah',
      nicknames: 'Mom',
      controlledBy: 'AI',
      characterRole: 'Main',
      avatarDataUrl: 'data:image/png;base64,sarah-avatar',
    },
    {
      name: 'Ashley',
      nicknames: '',
      controlledBy: 'AI',
      characterRole: 'Main',
      avatarDataUrl: 'data:image/png;base64,ashley-avatar',
    },
  ],
  sideCharacters: [],
} as unknown as ScenarioData;

const conversation: Conversation = {
  id: 'conversation-1',
  title: 'Lost QA',
  currentDay: 1,
  currentTimeOfDay: 'sunset',
  createdAt: 1,
  updatedAt: 2,
  messages: [
    {
      id: 'message-user-1',
      role: 'user',
      text: 'James: *James blocks the door with his shoulder.* "Stay close."',
      day: 1,
      timeOfDay: 'sunset',
      createdAt: 10,
    },
    {
      id: 'message-ai-1',
      generationId: 'generation-ai-1',
      role: 'assistant',
      text: `Sarah: *Sarah checks the hearth.* "Fire first."

Ashley: *Ashley keeps moving her fingers.* "I can feel my thumb."`,
      day: 1,
      timeOfDay: 'sunset',
      createdAt: 11,
    },
  ],
};

describe('buildChatReviewHtml', () => {
  it('exports a styled static session log with split speaker cards and live comments', () => {
    const html = buildChatReviewHtml({
      appData,
      conversation,
      scenarioTitle: 'Lost',
      modelId: 'test-model',
      exportedAt: new Date('2026-04-26T12:00:00.000Z'),
      continueMessageIds: [],
      regenerateMessageIds: ['message-ai-1'],
      sanitizeAssistantText: (text) => text,
      messageComments: {
        'message-ai-1': {
          messageId: 'message-ai-1',
          generationId: 'generation-ai-1',
          note: 'Ashley answered correctly, but Sarah sounded too mechanical.',
          tags: ['Dialogue Quality', 'Speaker Flow'],
          createdAt: 1,
          updatedAt: 2,
        },
      },
      postTurnStateChanges: {
        'message-ai-1': ['Sarah.currentMood updated at Day 1, sunset -> Worried but focused'],
      },
      debugRecords: {
        'message-ai-1:generation-ai-1': {
          messageId: 'message-ai-1',
          generationId: 'generation-ai-1',
          capturedAt: 3,
          trace: null,
          call1Request: {
            id: 'call1.roleplay-generation',
            label: 'API Call 1 - Roleplay generation',
            apiCallGroup: 'call_1',
            endpoint: '/functions/v1/chat',
            method: 'POST',
            capturedAt: 3,
            status: 'sent',
            requestBody: { modelId: 'test-model', messages: [{ role: 'system', content: 'system prompt' }] },
            modelRequest: {
              endpoint: 'https://api.x.ai/v1/chat/completions',
              method: 'POST',
              capturedAt: 3,
              requestBody: { model: 'test-model', messages: [{ role: 'system', content: 'system prompt' }] },
            },
          },
          supportCalls: [
            {
              id: 'call2.character-state-sync',
              label: 'API Call 2 - Character state sync',
              apiCallGroup: 'call_2',
              endpoint: '/functions/v1/extract-character-updates',
              method: 'POST',
              capturedAt: 4,
              status: 'completed',
              requestBody: { userMessage: 'hello', aiResponse: 'reply' },
              modelRequest: {
                endpoint: 'https://api.x.ai/v1/chat/completions',
                method: 'POST',
                capturedAt: 4,
                requestBody: { model: 'test-model', messages: [{ role: 'user', content: 'sync prompt' }] },
              },
              responseBody: { updates: [] },
            },
          ],
        },
      },
    });

    expect(html).toContain('Chronicle session log');
    expect(html).not.toContain('Download annotation JSON');
    expect(html).not.toContain('Download annotated HTML');
    expect(html).toContain('James');
    expect(html).toContain('Sarah');
    expect(html).toContain('Ashley');
    expect(html).not.toContain('What went wrong?');
    expect(html).toContain('Live tester note');
    expect(html.match(/<section class="live-comment">/g)).toHaveLength(2);
    expect(html).toContain('Live tester notes index');
    expect(html).toContain('chronicle-session-review-comments');
    expect(html).toContain('data-has-live-comment="true"');
    expect(html).toContain('data-live-comment-note="Ashley answered correctly, but Sarah sounded too mechanical."');
    expect(html).toContain('Sarah sounded too mechanical.');
    expect(html).toContain('Issue summary');
    expect(html).toContain('Dialogue Quality');
    expect(html).toContain('Speaker Flow');
    expect(html).toContain('Turn 2 Sarah');
    expect(html).toContain('Turn 2.2 Ashley');
    expect(html).toContain('data-review-id="message-ai-1-1"');
    expect(html).not.toContain('Raw saved message text');
    expect(html).toContain('API Call 1 Data');
    expect(html).toContain('Exact request body sent to Grok');
    expect(html).toContain('API Call 2 + Supporting API Call Data');
    expect(html).toContain('Character state sync summary');
    expect(html).toContain('Proposed updates');
    expect(html).toContain('No character-card updates returned.');
    expect(html).toContain('Applied Updates Summary');
    expect(html).toContain('Sarah.currentMood updated at Day 1, sunset');
    expect(html).toContain('chronicle-session-review-v2');
    expect(html).toContain('Regenerated');
  });
});
