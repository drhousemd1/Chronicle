import { describe, expect, it } from 'vitest';
import type { Conversation, ScenarioData } from '@/types';
import { buildChatReviewHtml, renderSupportCallSummary } from './review-export';
import {
  buildContinueAssistantTailResponseJob,
  buildRetryRegenerateResponseJob,
} from '@/features/chat-runtime/roleplay-response-job';

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
  it('renders row-level day compression decisions and cleanup evidence', () => {
    const html = renderSupportCallSummary({
      id: 'call2.memory-compress',
      label: 'Supporting Call - Day memory compression',
      apiCallGroup: 'call_2',
      endpoint: '/functions/v1/compress-day-memories',
      capturedAt: 4,
      status: 'completed',
      requestBody: {},
      responseBody: {
        synopsis: 'A durable day summary.',
        inputTrustBoundary: 'browser_supplied_runtime_rows',
        inputMemoryRows: [
          { id: 'memory-1', content: 'Durable event', sourceMessageId: 'message-1', sourceGenerationId: 'generation-1' },
          { id: 'memory-2', content: 'Unsupported inference' },
          { id: 'memory-3', content: 'Unclassified event' },
        ],
        compressedInputMemoryRowIds: ['memory-1'],
        rejectedInputMemoryRows: [{ id: 'memory-2', reason: 'unsupported_inference' }],
        omittedInputMemoryRowIds: ['memory-3'],
        deletedInputMemoryRowIds: ['memory-1'],
        failedDeletionRows: [],
        warnings: ['browser_supplied_runtime_rows'],
        validationErrors: [],
      },
    } as any);

    expect(html).toContain('Day memory compression review');
    expect(html).toContain('<strong>Accepted for compression:</strong> memory-1');
    expect(html).toContain('<strong>memory-2</strong> - unsupported_inference');
    expect(html).toContain('<strong>Omitted and retained:</strong> memory-3');
    expect(html).toContain('<strong>Deleted after synopsis persistence:</strong> memory-1');
    expect(html).toContain('source message: message-1');
  });

  it('does not revive edge-accepted candidates when frontend acceptedUpdates is intentionally empty', () => {
    const html = renderSupportCallSummary({
      id: 'call2.character-state-sync',
      label: 'API Call 2 - Character state sync',
      apiCallGroup: 'call_2',
      endpoint: '/functions/v1/extract-character-updates',
      capturedAt: 4,
      status: 'completed',
      requestBody: {},
      responseBody: {
        candidateReviews: [{
          accepted: true,
          character: 'Sarah',
          field: 'location',
          value: 'Kitchen',
          reason: 'accepted_at_edge',
        }],
        acceptedUpdates: [],
        rejectedUpdates: [{
          characterName: 'Sarah',
          field: 'location',
          value: 'Kitchen',
          edgeAccepted: true,
          frontendAccepted: false,
          reason: 'missing_required_review',
        }],
      },
    } as any);

    expect(html).toContain('<strong>Accepted update candidates</strong>0');
    expect(html).toContain('<strong>Rejected updates</strong>1');
    expect(html).toContain('<strong>Sarah.location</strong>');
    expect(html).toContain('rejected: missing_required_review');
    expect(html).not.toContain('[accepted]');
  });

  it('does not label raw candidates accepted when the memory response contract was rejected', () => {
    const html = renderSupportCallSummary({
      id: 'call2.memory-extraction',
      label: 'Supporting Call - Memory extraction',
      apiCallGroup: 'call_2',
      endpoint: '/functions/v1/extract-memory-events',
      capturedAt: 4,
      status: 'error',
      requestBody: {},
      responseBody: {
        responseContractStatus: 'rejected',
        responseContractReason: 'memory_response_worker_artifact_invalid',
        candidates: [{
          id: 'legacy-memory-1',
          candidateText: 'A stale worker called this accepted.',
          decision: 'accepted',
        }],
        candidateReviews: [],
        acceptedCandidates: [],
      },
    } as any);

    expect(html).toContain('Contract review');
    expect(html).toContain('rejected');
    expect(html).toContain('<span><strong>Accepted candidates</strong>0</span>');
    expect(html).toContain('contract_rejected_unreviewed_candidate');
    expect(html).not.toContain('[accepted]');
  });

  it('renders one saved message parent with nested child speaker cards and parent-owned evidence', () => {
    const html = buildChatReviewHtml({
      appData,
      conversation,
      scenarioTitle: 'Lost',
      modelId: 'test-model',
      exportedAt: new Date('2026-07-10T12:00:00.000Z'),
      sanitizeAssistantText: (text) => text,
      messageComments: {
        'message-ai-1': {
          messageId: 'message-ai-1',
          generationId: 'generation-ai-1',
          note: 'One parent-owned tester note.',
          tags: ['Speaker Flow'],
          createdAt: 1,
          updatedAt: 2,
        },
      },
      debugRecords: {
        'message-ai-1:generation-ai-1': {
          messageId: 'message-ai-1',
          generationId: 'generation-ai-1',
          capturedAt: 3,
          trace: null,
          call1Request: {
            id: 'call1.parent-boundary',
            label: 'API Call 1 - Parent boundary fixture',
            apiCallGroup: 'call_1',
            endpoint: '/functions/v1/chat',
            capturedAt: 3,
            requestBody: { messages: [] },
            roleplayArtifactIdentity: {
              schemaVersion: 1,
              artifactName: 'frontend',
              sourceRevision: null,
              sourceState: 'unknown',
              sourceDigest: 'frontend-digest',
              sourceFiles: [],
              terminalMigration: 'migration.sql',
              contractVersions: { responseJob: 'v1' },
            },
            roleplaySourceReceipts: [
              {
                id: 'player_turn:player_turn:fnv1a-12345678',
                packetVersion: 'roleplay-source-packet-v1',
                surface: 'player_turn',
                sourceClass: 'player_turn',
                sourceId: 'player_turn',
                textHash: 'fnv1a-12345678',
                authority: 'highest',
                modelFacing: true,
                disposition: 'included',
                transformation: 'exact',
                duplicateGroup: 'exact:fnv1a-12345678',
                reason: 'response_job_lane:player_turn',
                contentLength: 14,
                preview: 'I step closer.',
              },
            ],
            roleplayDuplicateSourceMetrics: [
              {
                duplicateGroup: 'exact:fnv1a-12345678',
                receiptIds: [
                  'recent_user_history:user-1:fnv1a-12345678',
                  'player_turn:player_turn:fnv1a-12345678',
                ],
                surfaces: ['recent_user_history', 'player_turn'],
                authorities: ['high', 'highest'],
                dispositions: ['included'],
                modelFacingCount: 2,
                totalCount: 2,
              },
            ],
            roleplaySourceReceiptCoverage: [
              {
                receiptId: 'player_turn:player_turn:fnv1a-12345678',
                surface: 'player_turn',
                status: 'covered',
                providerMessageIndexes: [1],
                reason: 'receipt_preview_found_in_rendered_provider_message',
              },
            ],
            roleplayEffectiveFieldEvidence: [{
              id: 'scene-roster:sarah:location',
              entityId: 'sarah',
              fieldPath: 'location',
              valuePreview: 'Cabin',
              sourceKind: 'scene_roster',
              sourceReceiptIds: ['current_state:current-physical-scene-state:fnv1a-12345678'],
              authority: 'current_state',
              modelFacing: true,
              treatment: 'selected',
              reason: 'effective_scene_roster_location',
            }],
            roleplaySourceBudgetSummary: {
              id: 'source-budget:1:0',
              totalReceipts: 1,
              modelFacingReceipts: 1,
              debugOnlyReceipts: 0,
              bySurface: { current_state: 1 },
              byAuthority: { high: 1 },
              byTreatment: { included: 1, downgraded: 0, omitted_by_budget: 0, suppressed_conflict: 0, debug_only: 0 },
              duplicateGroups: [],
              repeatedSourcePressureReceiptIds: [],
            },
            roleplayActiveScenePacketCandidate: {
              id: 'active-scene-candidate:2:1',
              strategy: 'active_scene_packet',
              turnNumber: 2,
              refreshReason: 'manual_debug',
              liveShapingEnabled: false,
              fullContextReceiptIds: ['current_state:current-physical-scene-state:fnv1a-12345678'],
              includedReceiptIds: ['current_state:current-physical-scene-state:fnv1a-12345678'],
              omittedReceipts: [],
            },
            roleplaySourceSelection: {
              id: 'source-selection:routine_turn:2:1',
              packetVersion: 'roleplay-source-packet-v1',
              policyVersion: 'roleplay-source-selection-v1',
              liveShapingEnabled: true,
              refreshReason: 'routine_turn',
              candidateCount: 2,
              selectedCandidateIds: ['candidate:player-turn'],
              omittedCandidateIds: ['candidate:background'],
              decisions: [
                {
                  candidateId: 'candidate:player-turn',
                  receiptId: 'player_turn:player_turn:fnv1a-12345678',
                  disposition: 'selected',
                  reason: 'mandatory_source_selected',
                  modelFacingSection: 'final_player_turn',
                },
                {
                  candidateId: 'candidate:background',
                  receiptId: 'story_world:background:fnv1a-87654321',
                  disposition: 'omitted',
                  reason: 'section_budget_exceeded:10000+2000>10000',
                  modelFacingSection: 'system_story_world',
                },
              ],
              sectionBudgets: [{
                sectionId: 'final_player_turn',
                sourceClass: 'player_turn',
                maxChars: 40000,
                usedChars: 14,
                selectedCount: 1,
              }],
              mandatorySourceCoverage: [{
                candidateId: 'candidate:player-turn',
                receiptId: 'player_turn:player_turn:fnv1a-12345678',
                status: 'covered',
                reason: 'mandatory_candidate_selected',
              }],
            },
            roleplaySourcePacketComparison: {
              fullMessageCount: 5,
              selectedMessageCount: 3,
              fullChars: 1200,
              selectedChars: 700,
              removedChars: 500,
            },
            roleplayProviderSectionCoverage: [
              {
                providerSectionId: 'final-user-lane:player_turn',
                expectedSurface: 'player_turn',
                status: 'covered',
                receiptIds: ['player_turn:player_turn:fnv1a-12345678'],
              },
            ],
            roleplayCharacterPromptFacts: [{
              characterId: 'character-sarah',
              characterName: 'Sarah',
              sourceField: 'physicalAppearance.eyeColor',
              sourceLabel: 'Eye color',
              sourceValue: 'Green',
              sourceSurface: 'main_character_cards',
              value: 'Green',
              semanticKey: 'physicalAppearance.eyeColor:green',
              runtimeUse: 'stable_reference',
              authority: 'saved_card_reference',
              relevance: 'conditional',
              visibility: 'character_knowledge',
              wordingPolicy: 'do_not_copy_phrase',
              modelFacing: true,
              disposition: 'transformed',
              reason: 'creator_reference_requires_compact_nonverbatim_prompt_copy',
            }],
            roleplayCharacterPromptFactSummaries: [{
              characterId: 'character-sarah',
              characterName: 'Sarah',
              totalFacts: 8,
              modelFacingFacts: 5,
              transformedFacts: 4,
              suppressedFacts: 0,
              debugOnlyFacts: 3,
              duplicateSourceGroups: [],
              repeatedRenderedValues: [],
              legacyRawHeadingsPresent: [],
            }],
            roleplaySupportReadinessSnapshot: {
              id: 'support-snapshot-user-2',
              dispatchMessageId: 'message-user-2',
              dispatchGenerationId: 'generation-user-2',
              responseJobId: 'response-job-user-2',
              responseJobMode: 'normal_send',
              responseJobPurpose: 'respond_to_player_turn',
              previousAssistantMessageId: 'message-ai-1',
              previousAssistantGenerationId: 'generation-ai-1',
              capturedAt: 5,
              records: [],
              scope: 'session_debug_only',
            },
          },
          supportCalls: [
            {
              id: 'call2.parent-boundary-support',
              label: 'API Call 2 - Parent boundary support fixture',
              apiCallGroup: 'call_2',
              endpoint: '/functions/v1/extract-memory-events',
              capturedAt: 4,
              status: 'completed',
              requestBody: {},
              responseBody: {},
              roleplayArtifactIdentity: {
                schemaVersion: 1,
                artifactName: 'extract-memory-events',
                sourceRevision: 'revision-123',
                sourceState: 'clean',
                sourceDigest: 'memory-worker-digest',
                sourceFiles: [],
                terminalMigration: 'migration.sql',
                contractVersions: { responseJob: 'v1' },
              },
              roleplaySupportReadinessRecord: {
                id: 'readiness:memory:message-ai-1:generation-ai-1',
                worker: 'memory_extraction',
                sourceMessageId: 'message-ai-1',
                sourceGenerationId: 'generation-ai-1',
                lifecycle: 'completed',
                persistenceStatus: 'persisted',
                unavailableToTriggeringResponse: true,
                queuedAt: 3,
                startedAt: 3,
                completedAt: 4,
                reason: 'reviewed_memory_events_persisted',
                scope: 'session_debug_only',
              },
              roleplaySupportReviewEnvelope: {
                contract: 'RoleplaySupportReviewEnvelope',
                version: 2,
                worker: 'memory_extraction',
                sourceMessageId: 'message-ai-1',
                sourceGenerationId: 'generation-ai-1',
                accepted: [{
                  id: 'memory-accepted-parent',
                  label: 'One accepted durable event.',
                  reason: 'accepted_with_exact_source_evidence',
                  evidence: 'Accepted evidence.',
                  sourceMessageId: 'message-ai-1',
                  sourceGenerationId: 'generation-ai-1',
                }],
                rejected: [{
                  id: 'memory-rejected-parent',
                  label: 'One rejected unsupported claim.',
                  reason: 'unsupported_overreach',
                  evidence: 'Rejected evidence.',
                  sourceMessageId: 'message-ai-1',
                  sourceGenerationId: 'generation-ai-1',
                }],
                omitted: [{
                  id: 'memory-omitted-parent',
                  label: 'One omitted duplicate.',
                  reason: 'near_duplicate_existing_memory',
                }],
                persistence: {
                  status: 'persisted',
                  targets: ['memory-row-parent'],
                  reason: 'reviewed_memory_events_persisted',
                },
                readiness: 'completed',
                futurePromptImpact: {
                  eligible: true,
                  targets: ['memory'],
                  reason: 'accepted_output_persisted_for_future_prompt_use',
                },
                contextGaps: ['One source field was unavailable.'],
              },
            },
          ],
        },
      },
      retryAttemptHistory: {
        'message-ai-1': [{
          messageId: 'message-ai-1',
          generationId: 'generation-ai-retry-1',
          attemptNumber: 1,
          capturedAt: 4,
          text: 'Rejected attempt.',
          createdAt: 4,
        }],
      },
    });

    expect(html.match(/class="message-parent-card/g)).toHaveLength(2);
    expect(html.match(/data-parent-message-id="message-ai-1"/g)).toHaveLength(1);
    expect(html.match(/class="message-child-card/g)).toHaveLength(3);
    expect(html).toContain('href="#review-message-ai-1"');
    expect(html).toContain('id="review-message-ai-1-0"');
    expect(html).toContain('id="review-message-ai-1-1"');
    expect(html).toContain('data-generation-id="generation-ai-1"');
    expect(html.match(/<section class="live-comment">/g)).toHaveLength(1);
    expect(html).toContain('data-live-comment-note="One parent-owned tester note."');
    expect(html.match(/Retry Attempt History/g)).toHaveLength(1);
    expect(html.match(/API Call 1 Data/g)).toHaveLength(1);
    expect(html).toContain('API Call 1 - Parent boundary fixture');
    expect(html.match(/Source Receipt Ledger \(1\)/g)).toHaveLength(1);
    expect(html.match(/Character Prompt Fact Ledger \(1\)/g)).toHaveLength(1);
    expect(html).toContain('physicalAppearance.eyeColor');
    expect(html).toContain('Eye color');
    expect(html).toContain('Character fact copy-risk metrics');
    expect(html).toContain('Internal Thought Diagnostics - Parent Message');
    expect(html).toContain('debug-only review evidence for parent message message-ai-1');
    expect(html).toContain('generation_captured_facts');
    expect(html).toContain('No exact raw card phrase or creator-label copy was detected in this assistant block.');
    expect(html.match(/Roleplay support review envelope/g)).toHaveLength(1);
    expect(html).toContain('Support Readiness At Dispatch (0)');
    expect(html).toContain('response-job-user-2');
    expect(html).toContain('normal_send');
    expect(html).toContain('respond_to_player_turn');
    expect(html).toContain('Support worker readiness');
    expect(html).toContain('unavailable to the assistant response that created this worker');
    expect(html).toContain('One accepted durable event.');
    expect(html).toContain('One rejected unsupported claim.');
    expect(html).toContain('One omitted duplicate.');
    expect(html).toContain('memory-row-parent');
    expect(html).toContain('accepted_output_persisted_for_future_prompt_use');
    expect(html).toContain('One source field was unavailable.');
    expect(html).toContain('Artifact Identity');
    expect(html).toContain('unknown - one or both artifact identities are missing');
    expect(html).toContain('Support Worker Artifact Identity');
    expect(html).toContain('captured source revision revision-123');
    expect(html).toContain('memory-worker-digest');
    const lastChildCard = html.lastIndexOf('class="message-child-card');
    expect(html.indexOf('Source Receipt Ledger (1)')).toBeGreaterThan(lastChildCard);
    expect(html.indexOf('Roleplay support review envelope')).toBeGreaterThan(lastChildCard);
    const embeddedReviewData = html.match(
      /<script type="application\/json" id="chronicle-session-review-data">([\s\S]*?)<\/script>/,
    )?.[1];
    expect(embeddedReviewData).toBeTruthy();
    const parsedReviewData = JSON.parse(embeddedReviewData || '{}') as {
      parentMessages?: Array<{
        childSegments?: Array<Record<string, unknown>>;
        retryLineage?: Record<string, unknown> | null;
        parentMetrics?: unknown[];
        internalThoughtDiagnostics?: Array<{ parentMessageId?: string; thoughtText?: string }>;
      }>;
    };
    const assistantParent = parsedReviewData.parentMessages?.[1];
    const assistantChild = assistantParent?.childSegments?.[0] || {};
    expect(assistantParent?.retryLineage).toMatchObject({
      parentMessageId: 'message-ai-1',
      finalGenerationId: 'generation-ai-1',
      storageScope: 'session_debug_only',
      livePromptReentry: false,
    });
    expect(assistantParent?.parentMetrics).toHaveLength(2);
    expect(assistantParent?.internalThoughtDiagnostics).toEqual([]);
    expect(assistantChild).not.toHaveProperty('debugRecord');
    expect(assistantChild).not.toHaveProperty('debugMetrics');
    expect(assistantChild).not.toHaveProperty('retryAttempts');
    expect(assistantChild).not.toHaveProperty('liveComment');
    expect(html).toContain('response_job_lane:player_turn');
    expect(html).toContain('Duplicate source groups');
    expect(html).toContain('Receipt to provider coverage');
    expect(html).toContain('Source Selection And Provider-Packet Comparison');
    expect(html).toContain('Effective field evidence');
    expect(html).toContain('Source budget summary');
    expect(html).toContain('Live source-selection decisions');
    expect(html).toContain('Full vs selected provider-packet counts');
    expect(html).toContain('Legacy active-scene debug comparator');
    expect(html).toContain('The selected packet is the live request sent to the provider.');
    expect(html).toContain('Live source selection');
    expect(html).toContain('Provider Infrastructure / Request Source Boundary');
    expect(html).toContain('Provider infrastructure evidence');
    expect(html).toContain('Request source-discipline evidence');
    expect(html).toContain('Provider settings cannot substitute for these records.');
    expect(html).toContain('Post-generation diagnostic boundary');
    expect(html).toContain('do not start provider fallback, user Retry, an automatic regeneration, a hidden rewrite, or assistant-message replacement');
    expect(html).toContain('Provider section to receipt coverage');
    expect(html).toContain('"parentMessages"');
    expect(html).toContain('"parserDiagnostics"');
    expect(html).toContain('"parentMetrics"');
    expect(html).toContain('"rawSpeakerLabelCount": 2');
    expect(html).toContain('"renderedChildCount": 2');
  });

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
        'message-ai-1': ['Sarah.location updated at Day 1, sunset -> Library'],
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
            roleplayUserStateAuthorityDecisions: [
              {
                claim: 'James says the map matters.',
                userCharacterId: 'james',
                claimType: 'dialogue_assignment',
                sourceMessageId: 'message-user-1',
                sourceGenerationId: 'generation-user-1',
                sourceRole: 'user',
                authority: 'raw_user_fact',
                modelFacingAction: 'allow_as_fact',
                reason: 'explicit_user_authorship',
              },
              {
                claim: 'James secretly wants Ashley.',
                userCharacterId: 'james',
                claimType: 'intent',
                sourceMessageId: 'message-ai-1',
                sourceGenerationId: 'generation-ai-1',
                sourceRole: 'assistant',
                authority: 'assistant_interpretation',
                modelFacingAction: 'allow_as_character_interpretation',
                reason: 'user_owned_state_requires_user_authorship',
              },
            ],
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
              roleplaySupportReviewEnvelope: {
                contract: 'RoleplaySupportReviewEnvelope',
                version: 2,
                worker: 'character_state',
                sourceMessageId: 'message-ai-1',
                sourceGenerationId: 'generation-ai-1',
                accepted: [{
                  id: 'candidate-1',
                  label: 'Sarah location Kitchen',
                  reason: 'accepted',
                  evidence: 'Sarah enters the kitchen.',
                }],
                rejected: [{
                  id: 'candidate-2',
                  label: 'Sarah unsupported.path Nope',
                  reason: 'unsupported_field',
                }],
                omitted: [],
                persistence: {
                  status: 'persisted',
                  targets: ['snapshot-sarah-1'],
                  reason: 'character_state_snapshots_persisted',
                },
                readiness: 'completed',
                futurePromptImpact: {
                  eligible: true,
                  targets: ['current_state'],
                  reason: 'accepted_output_persisted_for_future_prompt_use',
                },
                contextGaps: [],
              },
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
                  { character: 'Sarah', field: 'location', value: 'Kitchen', evidence: 'Sarah enters the kitchen.', confidence: 0.9 },
                ],
                candidateReviews: [
                  { index: 0, accepted: true, reason: 'accepted', character: 'Sarah', field: 'location', value: 'Kitchen', evidence: 'Sarah enters the kitchen.', confidence: 0.9 },
                  { index: 1, accepted: false, reason: 'unsupported_field', character: 'Sarah', field: 'unsupported.path', value: 'Nope', evidence: 'n/a', confidence: 0.5 },
                ],
                acceptedUpdates: [
                  { index: 0, characterName: 'Sarah', field: 'location', value: 'Kitchen', evidence: 'Sarah enters the kitchen.', confidence: 0.9, edgeAccepted: true, reason: 'accepted' },
                ],
                rejectedUpdates: [
                  { index: 1, characterName: 'Sarah', field: 'unsupported.path', value: 'Nope', evidence: 'n/a', confidence: 0.5, edgeAccepted: false, reason: 'unsupported_field' },
                ],
                characterEligibilityReviews: [
                  { characterId: 'character-sarah', characterName: 'Sarah', reasons: ['name_match'] },
                  { characterId: 'character-ashley', characterName: 'Ashley', reasons: ['speaker_tag', 'name_match'] },
                ],
                reviewedCharacterStateRows: [
                  { characterId: 'character-sarah', characterName: 'Sarah', eligible: true, eligibilityReasons: ['name_match'], reviewedFields: ['location', 'scenePosition'], acceptedUpdates: [{ field: 'location', value: 'Kitchen' }], rejectedUpdates: [] },
                  { characterId: 'character-ashley', characterName: 'Ashley', eligible: true, eligibilityReasons: ['speaker_tag', 'name_match'], reviewedFields: [], acceptedUpdates: [], rejectedUpdates: [], missingReviewReason: 'missing_physical_state_review' },
                ],
                missingCharacterStateReviews: [
                  { characterId: 'character-ashley', characterName: 'Ashley', missingReviewReason: 'missing_physical_state_review' },
                ],
                applyStageReviews: [
                  { characterId: 'character-sarah', characterName: 'Sarah', field: 'location', value: 'Kitchen', edgeAccepted: true, frontendAccepted: true, persisted: true, runtimeStateApplied: true, outcome: 'persisted', reason: 'character_state_snapshot_persisted', sourceMessageId: 'message-ai-1', sourceGenerationId: 'generation-ai-1', persistenceTargetId: 'snapshot-sarah-1' },
                  { characterId: 'character-morgan', characterName: 'Morgan', field: 'scenePosition', value: 'At the door', edgeAccepted: true, frontendAccepted: true, persisted: true, runtimeStateApplied: false, outcome: 'runtime_state_sync_failed', reason: 'side_character_state_snapshot_persisted_but_runtime_state_sync_failed', sourceMessageId: 'message-ai-1', sourceGenerationId: 'generation-ai-1', persistenceTargetId: 'snapshot-morgan-1' },
                  { characterId: 'character-ashley', characterName: 'Ashley', field: 'scenePosition', value: 'Beside Sarah', edgeAccepted: true, frontendAccepted: true, persisted: false, outcome: 'missing_source_metadata', reason: 'canonical_source_message_or_generation_missing' },
                ],
                persistedUpdates: [
                  { characterId: 'character-sarah', characterName: 'Sarah', field: 'location', value: 'Kitchen', persisted: true, outcome: 'persisted', persistenceTargetId: 'snapshot-sarah-1' },
                  { characterId: 'character-morgan', characterName: 'Morgan', field: 'scenePosition', value: 'At the door', persisted: true, runtimeStateApplied: false, outcome: 'runtime_state_sync_failed', persistenceTargetId: 'snapshot-morgan-1' },
                ],
                rejectedAtApplyStage: [
                  { characterId: 'character-ashley', characterName: 'Ashley', field: 'scenePosition', value: 'Beside Sarah', persisted: false, outcome: 'missing_source_metadata', reason: 'canonical_source_message_or_generation_missing' },
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
		                contract: 'MemoryExtractionResponseV1',
		                version: 1,
		                workerArtifact: {
		                  worker: 'extract-memory-events',
		                  contract: 'MemoryExtractionResponseV1',
		                  version: 1,
		                  artifactVersion: 'extract-memory-events-candidates-v1',
		                },
		                acceptedCandidates: ['James says the map matters.'],
	                candidateReviews: [
	                  {
	                    id: 'memory-1',
	                    label: 'James says the map matters.',
	                    accepted: true,
	                    reason: 'explicit_user_authorship',
	                    durabilityCategory: 'durable_scene_or_world_fact',
	                    sourceClassification: 'raw_user_fact',
	                    evidence: 'That has to matter',
	                    persistenceStatus: 'persisted',
	                    persistenceTargetId: 'memory-row-1',
	                  },
	                  {
	                    id: 'memory-2',
	                    label: 'James secretly wants Ashley.',
	                    accepted: false,
	                    reason: 'user_owned_state_requires_user_authorship',
	                    durabilityCategory: 'not_memory',
	                    sourceClassification: 'assistant_interpretation',
	                    evidence: 'James secretly wants Ashley',
	                    persistenceStatus: 'not_requested_rejected',
	                  },
	                ],
	                rejectedEvents: [
	                  { index: 0, accepted: false, reason: 'parse_error', value: 'not json' },
	                ],
	                parseError: 'parse_error',
		              },
		              roleplaySupportReviewEnvelope: {
		                contract: 'RoleplaySupportReviewEnvelope',
		                version: 2,
		                worker: 'memory_extraction',
		                workerArtifact: {
		                  worker: 'extract-memory-events',
		                  contract: 'MemoryExtractionResponseV1',
		                  version: 1,
		                  artifactVersion: 'extract-memory-events-candidates-v1',
		                },
	                sourceMessageId: 'message-ai-1',
	                sourceGenerationId: 'generation-ai-1',
	                accepted: [{
	                  id: 'memory-1',
	                  label: 'James says the map matters.',
	                  reason: 'explicit_user_authorship',
	                  evidence: 'That has to matter',
	                  claimType: 'dialogue_assignment',
	                  sourceRole: 'user',
	                  evidenceBasis: 'explicit_user_authorship',
	                  authority: 'raw_user_fact',
	                  modelFacingAction: 'allow_as_fact',
	                  sourceMessageId: 'message-user-1',
	                  sourceGenerationId: 'generation-user-1',
	                  userCharacterId: 'james',
	                  category: 'durable_scene_or_world_fact',
	                  sourceClassification: 'raw_user_fact',
	                  persistenceStatus: 'persisted',
	                  persistenceTargetId: 'memory-row-1',
	                }],
	                rejected: [{
	                  id: 'memory-2',
	                  label: 'James secretly wants Ashley.',
	                  reason: 'user_owned_state_requires_user_authorship',
	                  evidence: 'James secretly wants Ashley',
	                  claimType: 'intent',
	                  sourceRole: 'assistant',
	                  evidenceBasis: 'in_character_interpretation',
	                  authority: 'assistant_interpretation',
	                  modelFacingAction: 'reject_from_persistence',
	                  sourceMessageId: 'message-ai-1',
	                  sourceGenerationId: 'generation-ai-1',
	                  userCharacterId: 'james',
	                  category: 'not_memory',
	                  sourceClassification: 'assistant_interpretation',
	                  persistenceStatus: 'not_requested_rejected',
	                }],
	                omitted: [],
	                persistence: { status: 'persisted', targets: ['memory-row-1'], reason: 'reviewed_memory_events_persisted' },
	                readiness: 'completed',
	                futurePromptImpact: { eligible: true, targets: ['memory'], reason: 'accepted_output_persisted_for_future_prompt_use' },
		                contextGaps: [],
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
    expect(html).toContain('Roleplay support review envelope');
    expect(html).toContain('Source generation');
    expect(html).toContain('generation-ai-1');
    expect(html).toContain('Future prompt eligible');
    expect(html).toContain('character_state_snapshots_persisted');
    expect(html).toContain('Accepted outcomes');
    expect(html).toContain('Rejected outcomes');
    expect(html).toContain('User-state source authority');
    expect(html).toContain('James secretly wants Ashley.');
    expect(html).toContain('assistant_interpretation');
    expect(html).toContain('allow_as_character_interpretation');
    expect(html).toContain('source message: message-user-1');
    expect(html).toContain('evidence basis: explicit_user_authorship');
    expect(html).toContain('evidence basis: in_character_interpretation');
    expect(html).toContain('action: reject_from_persistence');
    expect(html).toContain('browser-local admin debug trace');
    expect(html).toContain('service-role access can bypass normal row-level security');
    const telemetryStart = html.indexOf('Local assistant style telemetry - send');
    const characterCallStart = html.indexOf('API Call 2 - Character state sync');
    const envelopeStart = html.indexOf('Roleplay support review envelope', characterCallStart);
    const characterRawRequestStart = html.indexOf('Browser-to-edge request body', characterCallStart);
    const goalProgressStart = html.indexOf('Support Call - Goal progress evaluation');
    const goalAlignmentStart = html.indexOf('Support Call - Goal alignment evaluation');
    expect(telemetryStart).toBeGreaterThanOrEqual(0);
    expect(characterCallStart).toBeGreaterThan(telemetryStart);
    expect(html.slice(telemetryStart, characterCallStart)).not.toContain('Legacy support record');
    expect(envelopeStart).toBeGreaterThan(characterCallStart);
    expect(characterRawRequestStart).toBeGreaterThan(envelopeStart);
    expect(goalProgressStart).toBeGreaterThan(characterCallStart);
    expect(goalAlignmentStart).toBeGreaterThan(goalProgressStart);
    expect(html.slice(goalProgressStart, goalAlignmentStart)).toContain('Legacy support record');
    expect(html).toContain('Proposed candidates');
    expect(html).toContain('Accepted update candidates');
    expect(html).toContain('rejected: unsupported_field');
    expect(html).toContain('Physical state completeness review');
    expect(html).toContain('focused_retry');
    expect(html).toContain('Deterministic character eligibility');
    expect(html).toContain('Missing reviewed character coverage');
    expect(html).toContain('Apply-stage persistence receipts');
    expect(html).toContain('snapshot-sarah-1');
    expect(html).toContain('snapshot-morgan-1');
    expect(html).toContain('runtime state not applied');
    expect(html).toContain('missing_source_metadata');
    expect(html).toContain('Persisted apply outcomes');
    expect(html).toContain('Rejected/skipped apply outcomes');
	    expect(html).toContain('Goal progress summary');
	    expect(html).toContain('Model marked complete');
	    expect(html).toContain('accepted by gate');
	    expect(html).toContain('not accepted by gate');
	    expect(html).toContain('Goal alignment summary');
	    expect(html).toContain('Rejected evaluations');
	    expect(html).toContain('evaluations_not_array');
	    expect(html).toContain('rejected: unknown_goal');
	    expect(html).toContain('Memory extraction summary');
	    expect(html).toContain('Reviewed candidates');
	    expect(html).toContain('durability durable_scene_or_world_fact');
	    expect(html).toContain('source raw_user_fact');
	    expect(html).toContain('persistence persisted');
	    expect(html).toContain('row memory-row-1');
	    expect(html).toContain('not_requested_rejected');
	    expect(html).toContain('Rejected/malformed rows');
	    expect(html).toContain('Rejected memory output');
	    expect(html).toContain('parse_error');
	    expect(html).toContain('Applied Updates Summary');
    expect(html).toContain('Sarah.location updated at Day 1, sunset');
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

    expect(html.match(/class="message-parent-card/g)).toHaveLength(1);
    expect(html.match(/class="message-child-card/g)).toHaveLength(1);
    expect(html.match(/<section class="live-comment">/g)).toHaveLength(1);
    expect(html).toContain('Turn 1 Ashley</span>');
    expect(html).not.toContain('Turn 1.2');
    expect(html).not.toContain('Turn 1.3');
    expect(html).toContain('"parsedSegmentCount": 3');
    expect(html).toContain('"renderedChildCount": 1');
    expect(html).toContain('"mergeCount": 2');
    expect(html).toContain('"raw_speaker_label"');
    expect(html).toContain('"paragraph_split"');
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

    expect(html.match(/Retry Attempt History \(2\)/g)).toHaveLength(1);
    expect(html).toContain('Debug-only captured versions that were replaced by Retry');
    expect(html.match(/<strong>Attempt 1<\/strong>/g)).toHaveLength(1);
    expect(html).toContain('generation-ai-original');
    expect(html).toContain('Original attempt');
    expect(html).toContain('Same answer.');
    expect(html.match(/<strong>Attempt 2<\/strong>/g)).toHaveLength(1);
    expect(html).toContain('generation-ai-retry-1');
    expect(html).toContain('Same answer, slightly rewritten.');
    expect(html.match(/<strong>Attempt message<\/strong>message-ai-1/g)).toHaveLength(2);
    expect(html.indexOf('Retry Attempt History (2)')).toBeGreaterThan(
      html.lastIndexOf('class="message-child-card'),
    );
    expect(html).not.toContain('chronicle-session-retry-attempt-history-v1');
    expect(html).toContain('chronicle-session-retry-lineage-v1');
    expect(html).toContain('retryLineage');
    expect(html).toContain('session_debug_only');
    expect(html).toContain('Live prompt re-entry</strong>no');
    expect(html).toContain('"parentMessageId": "message-ai-1"');
    expect(html).toContain('"finalGenerationId": "generation-ai-1"');
    expect(html).toContain('"childSegmentIds"');
    const embeddedReviewData = html.match(
      /<script type="application\/json" id="chronicle-session-review-data">([\s\S]*?)<\/script>/,
    )?.[1];
    expect(embeddedReviewData).toBeTruthy();
    const parsedReviewData = JSON.parse(embeddedReviewData || '{}') as {
      retryAttemptHistory?: unknown;
      parentMessages?: Array<{ retryLineage?: unknown; childSegments?: Array<Record<string, unknown>> }>;
      messages?: Array<{ retryAttempts?: unknown }>;
    };
    expect(parsedReviewData.retryAttemptHistory).toBeUndefined();
    expect(parsedReviewData.messages?.every((message) => message.retryAttempts === undefined)).toBe(true);
    expect(parsedReviewData.parentMessages?.[1]?.retryLineage).toBeTruthy();
    expect(parsedReviewData.parentMessages?.[1]?.childSegments?.every((child) => (
      !Object.prototype.hasOwnProperty.call(child, 'retryLineage')
      && !Object.prototype.hasOwnProperty.call(child, 'retryAttempts')
    ))).toBe(true);
  });

  it('renders response-job and recent-history treatment metadata for debug review', () => {
    const retryResponseJob = buildRetryRegenerateResponseJob({
      conversationId: 'conversation-1',
      playerTurn: {
        messageId: 'message-user-1',
        text: 'James: *James blocks the door with his shoulder.* "Stay close."',
      },
      rejectedAttempt: {
        messageId: 'message-ai-rejected',
        generationId: 'generation-ai-rejected',
        text: 'Rejected full assistant text should stay debug-only.',
        summary: 'The rejected answer repeated the same closing question.',
      },
      currentStateSummary: 'Day 1 sunset shelter scene remains active.',
      responseDetail: 'detailed',
    });
    const continueResponseJob = buildContinueAssistantTailResponseJob({
      conversationId: 'conversation-1',
      assistantAnchor: {
        messageId: 'message-ai-1',
        acceptedTextTail: 'Sarah: *Sarah checks the hearth.* "Fire first."',
      },
      currentStateSummary: 'Day 1 sunset shelter scene remains active.',
      responseDetail: 'standard',
    });

    const html = buildChatReviewHtml({
      appData,
      conversation,
      scenarioTitle: 'Lost',
      modelId: 'test-model',
      exportedAt: new Date('2026-04-26T12:00:00.000Z'),
      sanitizeAssistantText: (text) => text,
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
              responseJob: retryResponseJob,
              recentHistoryPacket: {
                providerMessages: [
                  { role: 'user', content: 'James: "Try another answer."' },
                ],
                receipts: [
                  {
                    messageId: 'message-ai-summary',
                    generationId: 'generation-ai-summary',
                    role: 'assistant',
                    includedInProviderHistory: true,
                    responseJobSource: 'recent_history',
                    treatment: 'outcome_summary',
                    reason: 'structured_source_authority_outcome_summary',
                    transformedContent: 'Older assistant outcome summary:\n- Observed change: The user character visibly steadies one hand.',
                    sourceAuthorityDecisionCount: 1,
                    sourceAuthorityClasses: ['accepted_assistant_observable_change'],
                  },
                  {
                    messageId: 'message-user-1',
                    role: 'user',
                    includedInProviderHistory: true,
                    responseJobSource: 'player_turn',
                    alsoRenderedInFinalUserLane: 'player_turn',
                    treatment: 'exact_user',
                    reason: 'exact_user_turn_also_rendered_in_player_lane',
                  },
                  {
                    messageId: 'message-ai-rejected',
                    generationId: 'generation-ai-rejected',
                    role: 'assistant',
                    includedInProviderHistory: false,
                    responseJobSource: 'retry_contrast',
                    sourceGenerationId: 'generation-ai-rejected',
                    generationMatchesResponseJobSource: true,
                    alsoRenderedInFinalUserLane: 'retry_rejection',
                    treatment: 'suppressed_style_anchor',
                    reason: 'rejected_retry_attempt_not_accepted_history',
                    repeatedAnchors: ['same closing question'],
                  },
                ],
                suppressedStyleAnchors: [
                  {
                    messageId: 'message-ai-rejected',
                    generationId: 'generation-ai-rejected',
                    repeatedAnchors: ['same closing question'],
                  },
                ],
              },
            },
          },
        },
      },
      retryAttemptHistory: {
        'message-ai-1': [
          {
            messageId: 'message-ai-1',
            generationId: 'generation-ai-retry-1',
            attemptNumber: 1,
            capturedAt: 12,
            text: 'Sarah: *Sarah repeats the same answer.* "Same question?"',
            day: 1,
            timeOfDay: 'sunset',
            createdAt: 11,
            debugRecord: {
              messageId: 'message-ai-1',
              generationId: 'generation-ai-retry-1',
              capturedAt: 12,
              trace: null,
              call1Request: {
                id: 'call1.retry',
                label: 'API Call 1 - Retry',
                apiCallGroup: 'call_1',
                endpoint: '/functions/v1/chat',
                method: 'POST',
                capturedAt: 12,
                status: 'sent',
                requestBody: {
                  responseJob: retryResponseJob,
                },
              },
            },
          },
          {
            messageId: 'message-ai-1',
            generationId: 'generation-ai-continue-1',
            attemptNumber: 2,
            capturedAt: 13,
            text: 'Sarah: *Sarah keeps working with the hearth.* "Keep the door shut."',
            day: 1,
            timeOfDay: 'sunset',
            createdAt: 12,
            debugRecord: {
              messageId: 'message-ai-1',
              generationId: 'generation-ai-continue-1',
              capturedAt: 13,
              trace: null,
              call1Request: {
                id: 'call1.continue',
                label: 'API Call 1 - Continue',
                apiCallGroup: 'call_1',
                endpoint: '/functions/v1/chat',
                method: 'POST',
                capturedAt: 13,
                status: 'sent',
                requestBody: {
                  responseJob: continueResponseJob,
                },
              },
            },
          },
        ],
      },
    });

    expect(html).toContain('Response Job Summary');
    expect(html).toContain('Mode</strong>retry_regenerate');
    expect(html).toContain('History treatment</strong>exclude_rejected_attempt');
    expect(html).toContain('retry_rejection / assistant / control / model-facing');
    expect(html).toContain('Rejected attempt summary');
    expect(html).toContain('The rejected answer repeated the same closing question.');
    expect(html).toContain('Mode</strong>continue_assistant_tail');
    expect(html).toContain('History treatment</strong>anchor_on_accepted_assistant_tail');
    expect(html).toContain('continue_anchor / assistant / state / model-facing');
    expect(html).toContain('Continue anchor message');
    expect(html).toContain('message-ai-1');
    expect(html).toContain('Recent-history treatment receipts');
    expect(html).toContain('message-ai-summary');
    expect(html).toContain('structured_source_authority_outcome_summary');
    expect(html).toContain('source-authority decisions: 1');
    expect(html).toContain('accepted_assistant_observable_change');
    expect(html).toContain('transformed summary: Older assistant outcome summary:');
    expect(html).toContain('Observed change: The user character visibly steadies one hand.');
    expect(html).toContain('message-ai-rejected');
    expect(html).toContain('excluded from provider history');
    expect(html).toContain('rejected_retry_attempt_not_accepted_history');
    expect(html).toContain('Suppressed assistant style anchors');
    expect(html).toContain('same closing question');
    expect(html).toContain('generation: generation-ai-rejected');
    expect(html).toContain('response-job generation: generation-ai-rejected');
    expect(html).toContain('generation match: yes');
    expect(html).toContain('This does not prove why the model wrote something');
    expect(html).toContain('they are not model reasoning');
    expect(html).not.toContain('Rejected full assistant text should stay debug-only.');
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

  it('renders state pruning reports without treating pruned values as applied updates', () => {
    const html = buildChatReviewHtml({
      appData,
      conversation,
      scenarioTitle: 'Lost',
      modelId: 'test-model',
      exportedAt: new Date('2026-04-26T12:00:00.000Z'),
      sanitizeAssistantText: (text) => text,
      statePruningReports: {
        'message-ai-1:generation-ai-1': [
          {
            itemType: 'memory',
            itemId: 'memory-current',
            sourceMessageId: 'message-ai-1',
            sourceGenerationId: 'generation-ai-1',
            currentGenerationId: 'generation-ai-1',
            included: true,
            reason: 'current_generation',
            valuePreview: 'Sarah stayed by the hearth.',
          },
          {
            itemType: 'memory',
            itemId: 'memory-stale',
            sourceMessageId: 'message-ai-1',
            sourceGenerationId: 'generation-ai-stale',
            currentGenerationId: 'generation-ai-1',
            included: false,
            reason: 'stale_generation',
            valuePreview: 'Sarah walked away in the rejected attempt.',
          },
        ],
      },
    });

    expect(html).toContain('State Pruning Report');
    expect(html).toContain('memory-current');
    expect(html).toContain('current_generation');
    expect(html).toContain('memory-stale');
    expect(html).toContain('stale_generation');
    expect(html).toContain('Sarah walked away in the rejected attempt.');
    expect(html).not.toContain('Applied Updates Summary (2)');
  });

  it('renders per-turn goal exposure receipts without adding them to provider prose', () => {
    const html = buildChatReviewHtml({
      appData,
      conversation,
      scenarioTitle: 'Lost',
      modelId: 'test-model',
      exportedAt: new Date('2026-04-26T12:00:00.000Z'),
      sanitizeAssistantText: (text) => text,
      debugRecords: {
        'message-ai-1:generation-ai-1': {
          messageId: 'message-ai-1',
          generationId: 'generation-ai-1',
          capturedAt: 3,
          trace: null,
          call1Request: {
            id: 'call1.goal-exposure',
            label: 'API Call 1 - Goal exposure',
            apiCallGroup: 'call_1',
            endpoint: '/functions/v1/chat',
            capturedAt: 3,
            requestBody: { messages: [] },
            roleplayGoalExposureDecision: {
              mode: 'continue_assistant_tail',
              receiptId: 'goal-exposure:continue_assistant_tail:12345678',
              decisions: [{
                goalId: 'goal-1',
                title: 'Reach shelter',
                goalKind: 'story',
                tier: 'active',
                reason: 'supported_by_current_turn_evidence',
                evidence: ['latest_player_turn_goal_terms:reach,shelter'],
                evidenceConfidence: 'explicit',
                renderDetail: 'full',
                openMilestoneId: 'milestone-1',
                partialProgress: 'debug_only',
              }, {
                goalId: 'goal-2',
                title: 'Future direction',
                goalKind: 'story',
                tier: 'hidden_this_turn',
                reason: 'alignment_not_writer_visible',
                evidence: ['existing_goal_alignment_policy'],
                evidenceConfidence: 'none',
                renderDetail: 'debug_only',
                partialProgress: 'debug_only',
              }],
            },
            effectiveResponseDetail: {
              requestedSetting: 'detailed',
              effectiveSetting: 'detailed',
              source: 'explicit_ui_setting',
              maxOutputTokens: 3072,
              instructionHash: 'fnv1a-12345678',
              instructionPreview: 'RESPONSE DETAIL: Detailed response instruction.',
            },
          },
        },
      },
    });

    expect(html).toContain('Goal Exposure Receipts (2)');
    expect(html).toContain('continue_assistant_tail');
    expect(html).toContain('goal-exposure:continue_assistant_tail:12345678');
    expect(html).toContain('supported_by_current_turn_evidence');
    expect(html).toContain('hidden_this_turn');
    expect(html).toContain('partial-progress notes remain debug-only');
    expect(html).toContain('Response Detail Request And Parent Output');
    expect(html).toContain('Effective response detail');
    expect(html).toContain('Parent message response detail metrics');
    expect(html).toContain('response_development_review');
    expect(html).toContain('3072');
    expect(html).toContain('Warnings are diagnostic only');
  });

  it('renders exact internal-thought diagnostics once under the owning parent message', () => {
    const thoughtConversation: Conversation = {
      ...conversation,
      messages: [
        conversation.messages[0],
        {
          ...conversation.messages[1],
          text: 'Sarah: *Sarah grips the lantern and opens the hatch.* (I am afraid of the hatch and I want the crown.) (Zephyria signed the hidden treaty.)',
        },
      ],
    };
    const html = buildChatReviewHtml({
      appData,
      conversation: thoughtConversation,
      scenarioTitle: 'Lost',
      modelId: 'test-model',
      exportedAt: new Date('2026-04-26T12:00:00.000Z'),
      sanitizeAssistantText: (text) => text,
    });

    expect(html.match(/Internal Thought Diagnostics - Parent Message/g)).toHaveLength(1);
    expect(html).toContain('Thought function review');
    expect(html).toContain('thought_function_review');
    expect(html).toContain('internal_thought_stitches_unrelated_concerns');
    expect(html).toContain('I am afraid of the hatch and I want the crown.');
    expect(html).toContain('Zephyria signed the hidden treaty.');
    expect(html).toContain('multi_concern');
    expect(html).toContain('unsupported_fact');
    const embeddedReviewData = html.match(
      /<script type="application\/json" id="chronicle-session-review-data">([\s\S]*?)<\/script>/,
    )?.[1];
    const parsed = JSON.parse(embeddedReviewData || '{}') as {
      parentMessages?: Array<{
        internalThoughtDiagnostics?: Array<{ parentMessageId?: string }>;
        thoughtFunctionReview?: { kind?: string };
      }>;
    };
    expect(parsed.parentMessages?.[1]?.internalThoughtDiagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ parentMessageId: 'message-ai-1' }),
    ]));
    expect(parsed.parentMessages?.[1]?.thoughtFunctionReview?.kind).toBe('thought_function_review');
  });
});
