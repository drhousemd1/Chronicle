import { describe, expect, it } from 'vitest';
import type { Conversation, ScenarioData } from '@/types';
import { buildChatReviewHtml } from './review-export';

const appData = {
  world: {
    core: {
      scenarioName: 'Lost',
      briefDescription: 'A survival test near an abandoned cabin.',
      storyPremise: 'The hearth, fire, storm, and shelter matter to the current survival scene.',
      dialogFormatting: '',
      storyGoals: [
        {
          id: 'goal-1',
          title: 'Reach shelter',
          desiredOutcome: 'The group reaches safe shelter and starts a fire.',
          steps: [],
          flexibility: 'normal',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
    },
    entries: [],
  },
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
      nicknames: 'Ash',
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
  it('exports a styled static session log with speaker cards and one inline live comment per message', () => {
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
            requestBody: {
              modelId: 'test-model',
              messages: [{ role: 'system', content: 'system prompt' }],
              providerTransport: 'responses',
              reasoningEffort: 'medium',
              store: false,
            },
            modelRequest: {
              endpoint: 'https://api.x.ai/v1/responses',
              method: 'POST',
              capturedAt: 3,
              responseUsage: {
                input_tokens: 120,
                output_tokens: 80,
                total_tokens: 200,
                reasoning_tokens: 25,
              },
              reasoningSummaries: ['Provider summarized its reasoning for debug review.'],
              providerStreamError: 'Provider stream failed after completion event.',
              requestBody: {
                model: 'test-model',
                input: [{ role: 'system', content: 'system prompt' }],
                store: false,
                reasoning: { effort: 'medium' },
              },
            },
          },
          supportCalls: [
            {
              id: 'local.assistant-style-telemetry.send',
              label: 'Local assistant style telemetry - send',
              apiCallGroup: 'support',
              endpoint: 'local://assistant-style-telemetry',
              method: 'LOCAL',
              capturedAt: 3,
              status: 'completed',
              requestBody: { source: 'send', diagnosticOnly: true, grokFacing: false },
              responseBody: {
                recentTelemetry: {
                  triggered: true,
                  flags: ['repeated_action_first_dialogue_cadence'],
                  reasons: ['Recent assistant blocks repeatedly opened with action before dialogue.'],
                },
                candidateTelemetry: {
                  triggered: false,
                  flags: [],
                  reasons: [],
                },
                summary: 'Detector telemetry only. This was not sent to Grok/xAI and did not trigger a hidden retry or alter the visible response.',
              },
              notes: [
                'Style and repetition detectors now run as local debug telemetry only.',
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
                endpoint: 'https://api.x.ai/v1/responses',
                method: 'POST',
                capturedAt: 4,
                requestBody: {
                  model: 'test-model',
                  input: [{ role: 'user', content: 'sync prompt' }],
                  store: false,
                  reasoning: { effort: 'medium' },
                  text: {
                    format: {
                      type: 'json_schema',
                      name: 'chronicle_character_updates',
                    },
                  },
                },
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
                physicalStateReviews: [
                  { character: 'Sarah', reviewed: true, locationReviewed: true, scenePositionReviewed: true, changed: false, reason: 'position unchanged', evidence: 'Sarah checks the hearth.', confidence: 0.9, source: 'primary' },
                  { character: 'Ashley', reviewed: true, locationReviewed: true, scenePositionReviewed: true, changed: true, reason: 'review supplied by retry', evidence: 'Ashley moves beside Sarah.', confidence: 0.9, source: 'focused_retry' },
                ],
                physicalStateCompletenessReviews: [
                  { character: 'Sarah', reviewed: true, reason: 'position unchanged', source: 'primary' },
                  { character: 'Ashley', reviewed: true, reason: 'review supplied by retry', source: 'focused_retry' },
                ],
                missingPhysicalStateReviews: [],
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
    expect(html.match(/<section class="live-comment">/g)).toHaveLength(1);
    expect(html).toContain('Tester notes quick links');
    expect(html).not.toContain('Every saved tester note is listed here and repeated');
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
    expect(html).toContain('Provider response usage');
    expect(html).toContain('reasoning_tokens');
    expect(html).toContain('Provider reasoning summaries');
    expect(html).toContain('Provider stream error');
    expect(html).toContain('Provider stream failed after completion event.');
    expect(html).toContain('API Call 2 + Supporting API Call Data');
    expect(html).not.toContain('This section also includes API Call 1 repair attempts');
    expect(html).not.toContain('First draft discarded before repair');
    expect(html).toContain('Assistant style telemetry summary');
    expect(html).toContain('Sent to Grok/xAI');
    expect(html).toContain('Local diagnostic payload');
    expect(html).toContain('repeated_action_first_dialogue_cadence');
    expect(html).toContain('Character state sync summary');
    expect(html).toContain('Proposed candidates');
    expect(html).toContain('Accepted update candidates');
    expect(html).toContain('rejected: unsupported_field');
    expect(html).toContain('Physical state completeness review');
    expect(html).toContain('focused_retry');
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
    expect(html).toContain('Deterministic debug metrics');
    expect(html).toContain('Response structure counts');
    expect(html).toContain('External dialogue');
    expect(html).toContain('Full modality sequence');
    expect(html).toContain('action -&gt; dialogue');
    expect(html).toContain('Source overlap hints');
    expect(html).toContain('story_card_data');
    expect(html).toContain('chronicle-session-deterministic-metrics-v1');
    expect(html).toContain('deterministicMetrics');
    expect(html).toContain('Regenerated');
  });

  it('keeps adjacent same-speaker paragraphs in one review card', () => {
    const singleSpeakerConversation: Conversation = {
      ...conversation,
      messages: [
        {
          id: 'message-ai-single',
          generationId: 'generation-ai-single',
          role: 'assistant',
          text: `Ash: *Ashley moved closer.* "First."

Ashley rested one hand on the table and watched him.

Ashley: "Second."`,
          day: 1,
          timeOfDay: 'sunset',
          createdAt: 11,
        },
      ],
    };

    const html = buildChatReviewHtml({
      appData,
      conversation: singleSpeakerConversation,
      scenarioTitle: 'Lost',
      modelId: 'test-model',
      exportedAt: new Date('2026-04-26T12:00:00.000Z'),
      sanitizeAssistantText: (text) => text,
      messageComments: {
        'message-ai-single': {
          messageId: 'message-ai-single',
          generationId: 'generation-ai-single',
          note: 'This entire assistant response should stay grouped as one Ashley message.',
          tags: ['Speaker Flow'],
          createdAt: 1,
          updatedAt: 2,
        },
      },
    });

    expect(html.match(/class="message-card/g)).toHaveLength(1);
    expect(html.match(/<section class="live-comment">/g)).toHaveLength(1);
    expect(html).toContain('Turn 1</span>');
    expect(html).not.toContain('Turn 1.2');
    expect(html).not.toContain('Turn 1.3');
    expect(html).toContain('Ashley rested one hand on the table');
    expect(html).toContain('This entire assistant response should stay grouped as one Ashley message.');
  });

  it('renders replaced retry attempts for the current visible assistant message', () => {
    const html = buildChatReviewHtml({
      appData,
      conversation,
      scenarioTitle: 'Lost',
      modelId: 'test-model',
      exportedAt: new Date('2026-04-26T12:00:00.000Z'),
      sanitizeAssistantText: (text) => text,
      retryAttemptHistory: {
        'message-ai-1': [
          {
            messageId: 'message-ai-1',
            generationId: 'generation-ai-original',
            attemptNumber: 1,
            capturedAt: 12,
            text: 'Ashley: *Ashley repeated the same exact approach.* "Same answer."',
            day: 1,
            timeOfDay: 'sunset',
            createdAt: 11,
            debugRecord: {
              messageId: 'message-ai-1',
              generationId: 'generation-ai-original',
              capturedAt: 12,
              trace: null,
              call1Request: {
                id: 'call1.original',
                label: 'API Call 1 - Original attempt',
                apiCallGroup: 'call_1',
                endpoint: '/functions/v1/chat',
                method: 'POST',
                capturedAt: 12,
                status: 'sent',
                requestBody: { retry: false },
              },
              supportCalls: [],
            },
          },
          {
            messageId: 'message-ai-1',
            generationId: 'generation-ai-retry-1',
            attemptNumber: 2,
            capturedAt: 13,
            text: 'Ashley: *Ashley only swapped a few words.* "Same answer, slightly rewritten."',
            day: 1,
            timeOfDay: 'sunset',
            createdAt: 12,
            debugRecord: null,
          },
        ],
      },
    });

    expect(html).toContain('Retry Attempt History (2)');
    expect(html).toContain('Debug-only captured versions that were replaced by Retry');
    expect(html).toContain('Attempt 1');
    expect(html).toContain('generation-ai-original');
    expect(html).toContain('Original attempt');
    expect(html).toContain('Same answer.');
    expect(html).toContain('Attempt 2');
    expect(html).toContain('generation-ai-retry-1');
    expect(html).toContain('Same answer, slightly rewritten.');
    expect(html).toContain('chronicle-session-retry-attempt-history-v1');
    expect(html).toContain('retryAttempts');
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
