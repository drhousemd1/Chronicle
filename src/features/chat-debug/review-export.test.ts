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
      continueMessageEvents: [],
      regenerateMessageEvents: [{ messageId: 'message-ai-1', generationId: 'generation-ai-1', timestamp: 4 }],
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
              id: 'call1.roleplay-generation.discarded-send-first-draft',
              label: 'API Call 1 - First draft discarded before repair',
              apiCallGroup: 'call_1',
              endpoint: '/functions/v1/chat',
              method: 'POST',
              capturedAt: 3,
              status: 'completed',
              requestBody: { modelId: 'test-model', messages: [{ role: 'user', content: 'draft prompt' }] },
              responseBody: {
                discardedDraftText: 'Sarah: "Fire first."',
                repairDirective: 'Break the repeated structure.',
              },
              notes: [
                'This API Call 1 attempt was discarded because the repetition repair guard triggered before the final assistant message was committed.',
              ],
            },
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
              responseBody: {
                updates: [
                  { character: 'Sarah', field: 'currentMood', value: 'Focused', evidence: 'Sarah checks the hearth.', confidence: 0.9 },
                ],
                candidateReviews: [
                  { index: 0, accepted: true, reason: 'accepted', character: 'Sarah', field: 'currentMood', value: 'Focused', evidence: 'Sarah checks the hearth.', confidence: 0.9 },
                  { index: 1, accepted: false, reason: 'unsupported_field', character: 'Sarah', field: 'unsupported.path', value: 'Nope', evidence: 'n/a', confidence: 0.5 },
                ],
                rejectedCandidates: [
                  { index: 1, accepted: false, reason: 'unsupported_field', character: 'Sarah', field: 'unsupported.path', value: 'Nope', evidence: 'n/a', confidence: 0.5 },
                ],
              },
            },
	            {
	              id: 'call2.goal-progress',
	              label: 'Support Call - Goal progress evaluation',
	              apiCallGroup: 'support',
              endpoint: '/functions/v1/evaluate-goal-progress',
              method: 'POST',
              capturedAt: 5,
              status: 'completed',
              requestBody: { userMessage: 'hello', aiResponse: 'reply' },
              responseBody: {
                stepUpdates: [
                  { stepId: 'step-1', result: 'completed', completed: true, modelCompleted: true, confidence: 0.9, evidence: 'Fire first.', accepted: true },
                  { stepId: 'step-2', result: 'completed', completed: false, modelCompleted: true, confidence: 0.3, evidence: 'too vague', accepted: false, reason: 'low_confidence' },
                ],
                classificationReviews: [
                  { stepId: 'step-1', result: 'completed', completed: true, modelCompleted: true, confidence: 0.9, evidence: 'Fire first.', accepted: true },
                  { stepId: 'step-2', result: 'completed', completed: false, modelCompleted: true, confidence: 0.3, evidence: 'too vague', accepted: false, reason: 'low_confidence' },
	                ],
	              },
	            },
	            {
	              id: 'support.goal-alignment',
	              label: 'Support Call - Goal alignment evaluation',
	              apiCallGroup: 'support',
	              endpoint: '/functions/v1/evaluate-goal-alignment',
	              method: 'POST',
	              capturedAt: 6,
	              status: 'completed',
	              requestBody: { goals: ['goal-1'] },
	              responseBody: {
	                evaluations: [],
	                alignmentReviews: [
	                  { index: 0, accepted: false, reason: 'unknown_goal', goalId: 'missing-goal', signal: 'support', intensity: 2, rationale: 'Model referenced a goal that was not provided.', evidence: 'unknown' },
	                ],
	                rejectedEvaluations: [
	                  { index: 0, accepted: false, reason: 'unknown_goal', goalId: 'missing-goal', signal: 'support', intensity: 2, rationale: 'Model referenced a goal that was not provided.', evidence: 'unknown' },
	                ],
	                parseError: 'evaluations_not_array',
	                shadowMode: true,
	                persistence: 'diagnostic_only',
	              },
	            },
	            {
	              id: 'support.memory-extraction',
	              label: 'Support Call - Memory extraction',
	              apiCallGroup: 'support',
	              endpoint: '/functions/v1/extract-memory-events',
	              method: 'POST',
	              capturedAt: 7,
	              status: 'completed',
	              requestBody: { userMessage: 'hello', aiResponse: 'reply' },
	              responseBody: {
	                extractedEvents: [],
	                rejectedEvents: [
	                  { index: 0, accepted: false, reason: 'parse_error', value: 'not json' },
	                ],
	                parseError: 'parse_error',
	              },
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
    expect(html).toContain('This section also includes API Call 1 repair attempts');
    expect(html).toContain('First draft discarded before repair');
    expect(html).toContain('Character state sync summary');
    expect(html).toContain('Proposed candidates');
    expect(html).toContain('Accepted update candidates');
    expect(html).toContain('rejected: unsupported_field');
	    expect(html).toContain('Goal progress summary');
	    expect(html).toContain('Model marked complete');
	    expect(html).toContain('accepted by gate');
	    expect(html).toContain('not accepted by gate');
	    expect(html).toContain('Goal alignment summary');
	    expect(html).toContain('Rejected evaluations');
	    expect(html).toContain('evaluations_not_array');
	    expect(html).toContain('rejected: unknown_goal');
	    expect(html).toContain('Memory extraction summary');
	    expect(html).toContain('Rejected/malformed rows');
	    expect(html).toContain('Rejected memory output');
	    expect(html).toContain('parse_error');
	    expect(html).toContain('Applied Updates Summary');
    expect(html).toContain('Sarah.currentMood updated at Day 1, sunset');
    expect(html).toContain('chronicle-session-review-v2');
    expect(html).toContain('Regenerated');
  });

  it('does not apply regenerate markers to later edited generations', () => {
    const editedConversation = {
      ...conversation,
      messages: conversation.messages.map((message) =>
        message.id === 'message-ai-1'
          ? { ...message, generationId: 'generation-ai-edited', text: 'Sarah: "Edited manually."' }
          : message,
      ),
    };

    const html = buildChatReviewHtml({
      appData,
      conversation: editedConversation,
      scenarioTitle: 'Lost',
      modelId: 'test-model',
      exportedAt: new Date('2026-04-26T12:00:00.000Z'),
      regenerateMessageEvents: [{ messageId: 'message-ai-1', generationId: 'generation-ai-1', timestamp: 4 }],
      sanitizeAssistantText: (text) => text,
    });

    expect(html).not.toContain('Regenerated');
  });

  it('does not apply continue markers to later edited generations', () => {
    const editedConversation = {
      ...conversation,
      messages: conversation.messages.map((message) =>
        message.id === 'message-ai-1'
          ? { ...message, generationId: 'generation-ai-edited', text: 'Sarah: "Edited manually."' }
          : message,
      ),
    };

    const html = buildChatReviewHtml({
      appData,
      conversation: editedConversation,
      scenarioTitle: 'Lost',
      modelId: 'test-model',
      exportedAt: new Date('2026-04-26T12:00:00.000Z'),
      continueMessageEvents: [{ messageId: 'message-ai-1', generationId: 'generation-ai-1', timestamp: 4 }],
      sanitizeAssistantText: (text) => text,
    });

    expect(html).not.toContain('Continue</span>');
  });
});
