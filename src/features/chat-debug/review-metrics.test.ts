import { describe, expect, it } from 'vitest';
import type { Conversation, ScenarioData } from '@/types';
import {
  buildParentMessageResponseDetailMetrics,
  buildReviewDebugMetrics,
} from './review-metrics';

const appData = {
  world: {
    core: {
      scenarioName: 'Metrics Test',
      briefDescription: 'A scene about a candlelit library.',
      storyPremise: 'The library, candle, locked door, and old map are established story details.',
      dialogFormatting: '',
      storyGoals: [
        {
          id: 'goal-1',
          title: 'Find the map',
          desiredOutcome: 'The characters find the old map in the library.',
          steps: [],
          flexibility: 'normal',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
    },
    entries: [{ id: 'entry-1', title: 'Library', body: 'The library smells like wax and dust.', createdAt: 1, updatedAt: 1 }],
  },
  story: { openingDialog: { enabled: true, text: 'The library waits.', startingDay: 1, startingTimeOfDay: 'night' } },
  scenes: [],
  characters: [
    {
      id: 'char-1',
      name: 'Ashley',
      nicknames: '',
      controlledBy: 'AI',
      characterRole: 'Main',
      location: 'Library',
      scenePosition: 'Beside the old desk',
      roleDescription: 'A suspicious archivist.',
      sections: [{
        id: 'section-1',
        title: 'Archive habits',
        items: [{
          id: 'item-1',
          label: 'Map ritual',
          value: 'Always taps the old map twice before speaking.',
          createdAt: 1,
          updatedAt: 1,
        }],
        createdAt: 1,
        updatedAt: 1,
      }],
    },
  ],
  sideCharacters: [],
  conversations: [],
} as unknown as ScenarioData;

const conversation: Conversation = {
  id: 'conversation-1',
  title: 'Metrics run',
  currentDay: 1,
  currentTimeOfDay: 'night',
  createdAt: 1,
  updatedAt: 2,
  messages: [
    { id: 'user-1', role: 'user', text: 'James: *James points at the old map on the library desk.* "That has to matter."', day: 1, timeOfDay: 'night', createdAt: 10 },
    { id: 'assistant-1', generationId: 'gen-1', role: 'assistant', text: 'Ashley: *Ashley shields the candle with one hand.* "It matters because the map was hidden here." (The desk is too obvious, but the wax mark is new.)', day: 1, timeOfDay: 'night', createdAt: 11 },
    { id: 'assistant-2', generationId: 'gen-2', role: 'assistant', text: 'Ashley: *Ashley checks the map, then checks the candle, then checks the door.* "The map is old, but the mark is new." (The candle explains the wax.)', day: 1, timeOfDay: 'night', createdAt: 12 },
  ],
};

describe('buildReviewDebugMetrics', () => {
  it('counts roleplay modalities, repetition, internal thoughts, source overlap, and recent-history treatment evidence locally', () => {
    const metrics = buildReviewDebugMetrics({
      appData,
      conversation,
      segments: [
        {
          reviewId: 'assistant-1-0',
          messageId: 'assistant-1',
          generationId: 'gen-1',
          turnNumber: 2,
          segmentNumber: 1,
          role: 'assistant',
          speakerName: 'Ashley',
          text: '*Ashley shields the candle with one hand.* "It matters because the map was hidden here." Archive habits: Map ritual: Always taps the old map twice before speaking. (The desk is too obvious, but the wax mark is new.)',
          rawMessageText: conversation.messages[1].text,
          userStateAuthorityDecisions: [
            {
              claim: 'James says the map matters.',
              userCharacterId: 'james',
              claimType: 'dialogue_assignment',
              sourceMessageId: 'user-1',
              sourceGenerationId: 'user-generation-1',
              sourceRole: 'user',
              authority: 'raw_user_fact',
              modelFacingAction: 'allow_as_fact',
              reason: 'explicit_user_authorship',
            },
            {
              claim: 'James secretly wants the archivist.',
              userCharacterId: 'james',
              claimType: 'intent',
              sourceMessageId: 'assistant-1',
              sourceGenerationId: 'gen-1',
              sourceRole: 'assistant',
              authority: 'assistant_interpretation',
              modelFacingAction: 'allow_as_character_interpretation',
              reason: 'user_owned_state_requires_user_authorship',
            },
          ],
          characterPromptFactSummaries: [{
            characterId: 'char-1',
            characterName: 'Ashley',
            totalFacts: 8,
            modelFacingFacts: 5,
            transformedFacts: 4,
            suppressedFacts: 0,
            debugOnlyFacts: 3,
            duplicateSourceGroups: [{
              value: 'candlelit library',
              sourceFields: ['background.residence', 'sections[0].freeformValue'],
              renderedOccurrences: 1,
            }],
            repeatedRenderedValues: [],
            legacyRawHeadingsPresent: [],
          }],
        },
        {
          reviewId: 'assistant-2-0',
          messageId: 'assistant-2',
          generationId: 'gen-2',
          turnNumber: 3,
          segmentNumber: 1,
          role: 'assistant',
          speakerName: 'Ashley',
          text: '*Ashley checks the old map, then checks the old map again, then checks the door.* "The map is old, but the mark is new." (The candle explains the wax.)',
          rawMessageText: conversation.messages[2].text,
          recentHistoryPacket: {
            providerMessages: [{ role: 'user', content: 'James points at the map.' }],
            receipts: [
              {
                messageId: 'assistant-summary',
                generationId: 'generation-summary',
                role: 'assistant',
                includedInProviderHistory: true,
                responseJobSource: 'recent_history',
                treatment: 'outcome_summary',
                reason: 'structured_source_authority_outcome_summary',
                transformedContent: 'Older assistant outcome summary:\n- Observed change: The user character steadies one hand.',
                sourceAuthorityDecisionCount: 1,
                sourceAuthorityClasses: ['accepted_assistant_observable_change'],
              },
              {
                messageId: 'assistant-old',
                generationId: 'generation-old',
                role: 'assistant',
                includedInProviderHistory: false,
                responseJobSource: 'recent_history',
                generationMatchesResponseJobSource: false,
                treatment: 'suppressed_style_anchor',
                reason: 'repeated_assistant_phrase',
                repeatedAnchors: ['what do you do next?'],
              },
            ],
            suppressedStyleAnchors: [{
              messageId: 'assistant-old',
              generationId: 'generation-old',
              repeatedAnchors: ['what do you do next?'],
            }],
          },
        },
      ],
    });

    expect(metrics.schema).toBe('chronicle-session-deterministic-metrics-v1');
    expect(metrics.transcript.assistantBlockCount).toBe(2);
    expect(metrics.segments[0].actionSegmentCount).toBe(1);
    expect(metrics.segments[0].dialogueSegmentCount).toBe(1);
    expect(metrics.segments[0].internalThoughtCount).toBe(1);
    expect(metrics.segments[0].compressedModalitySequence).toEqual(['action', 'dialogue', 'plain_text', 'internal_thought']);
    expect(metrics.segments[0].sourceOverlap.some((entry) => entry.source === 'story_card_data')).toBe(true);
    expect(metrics.segments[1].repeatedTermsFromEarlierAssistantBlocks).toContain('candle');
    expect(metrics.segments[1].topRepeatedTerms.some((entry) => entry.value === 'checks')).toBe(true);
    expect(metrics.segments[1].repeatedPhrases.some((entry) => entry.value === 'checks the old map')).toBe(true);
    expect(metrics.segments[1].internalThoughtDiagnostics[0].wordCount).toBeGreaterThan(0);
    expect(metrics.segments[1].internalThoughtDiagnostics[0]).toMatchObject({
      parentMessageId: 'assistant-2',
      segmentId: 'assistant-2-0',
      speakerName: 'Ashley',
      thoughtText: 'The candle explains the wax.',
      concernCount: 1,
      adjacentThoughtCount: 0,
      backToBackChain: false,
      anchoredToNearbySceneEvent: true,
      unsupportedFactRisk: false,
      warningReasons: [],
    });
    expect(metrics.segments[1].recentHistoryReceipts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        messageId: 'assistant-summary',
        treatment: 'outcome_summary',
        sourceAuthorityDecisionCount: 1,
      }),
      expect.objectContaining({
        messageId: 'assistant-old',
        treatment: 'suppressed_style_anchor',
        includedInProviderHistory: false,
      }),
    ]));
    expect(metrics.segments[1].suppressedStyleAnchors[0].repeatedAnchors).toContain('what do you do next?');
    expect(metrics.segments[0].userStateAuthoritySummary).toMatchObject({
      total: 2,
      selected: 1,
      downgraded: 1,
      rejected: 0,
    });
    expect(metrics.segments[0].userStateAuthorityDecisions[1]).toMatchObject({
      authority: 'assistant_interpretation',
      sourceMessageId: 'assistant-1',
    });
    expect(metrics.segments[0].characterPromptFactSummaries[0]).toMatchObject({
      characterName: 'Ashley',
      totalFacts: 8,
      repeatedRenderedValues: [],
      legacyRawHeadingsPresent: [],
    });
    expect(metrics.segments[0].characterPromptOutputCopyMetrics).toContainEqual(expect.objectContaining({
      characterName: 'Ashley',
      exactSourceValueCopies: [expect.objectContaining({
        sourceField: 'sections[0].items[0].value',
        sourceValue: 'Always taps the old map twice before speaking.',
      })],
      copiedSourceLabels: [expect.objectContaining({
        sourceField: 'sections[0].items[0].value',
        sourceLabel: 'Archive habits: Map ritual',
      })],
    }));
  });

  it('flags stitched, adjacent, obvious-action, and unsupported thought signals without changing response text', () => {
    const responseText = '*Ashley grips the lantern and opens the hatch.* (I am afraid of the hatch and I want the crown.) (The lantern grips the hatch.) (Zephyria signed the hidden treaty.)';
    const metrics = buildReviewDebugMetrics({
      appData,
      conversation,
      segments: [{
        reviewId: 'assistant-thoughts-0',
        messageId: 'assistant-thoughts',
        generationId: 'gen-thoughts',
        turnNumber: 4,
        segmentNumber: 1,
        role: 'assistant',
        speakerName: 'Ashley',
        text: responseText,
        rawMessageText: responseText,
      }],
    });

    const diagnostics = metrics.segments[0].internalThoughtDiagnostics;
    expect(diagnostics).toHaveLength(3);
    expect(diagnostics[0]).toMatchObject({
      parentMessageId: 'assistant-thoughts',
      concernCount: 2,
      backToBackChain: true,
    });
    expect(diagnostics[0].warningReasons).toEqual(expect.arrayContaining(['multi_concern', 'back_to_back']));
    expect(diagnostics[1].warningReasons).toEqual(expect.arrayContaining(['back_to_back', 'obvious_echo']));
    expect(diagnostics[2]).toMatchObject({
      anchoredToNearbySceneEvent: false,
      unsupportedFactRisk: true,
    });
    expect(diagnostics[2].warningReasons).toContain('unsupported_fact');
    expect(responseText).toContain('(Zephyria signed the hidden treaty.)');
  });

  it('excludes local provider notices from assistant roleplay transcript metrics', () => {
    const metrics = buildReviewDebugMetrics({
      appData,
      conversation,
      segments: [
        {
          reviewId: 'notice-1-0',
          messageId: 'notice-1',
          generationId: 'notice-1',
          turnNumber: 2,
          segmentNumber: 1,
          role: 'assistant',
          speakerName: 'AI',
          text: 'Chronicle: The model provider blocked this turn. Try editing the last user or AI message, then send again.',
          rawMessageText: 'Chronicle: The model provider blocked this turn. Try editing the last user or AI message, then send again.',
          localNotice: 'content_filter',
        },
        {
          reviewId: 'assistant-1-0',
          messageId: 'assistant-1',
          generationId: 'gen-1',
          turnNumber: 3,
          segmentNumber: 1,
          role: 'assistant',
          speakerName: 'Ashley',
          text: '*Ashley shields the candle.* "The map still matters."',
          rawMessageText: 'Ashley: *Ashley shields the candle.* "The map still matters."',
        },
      ],
    });

    expect(metrics.segments[0].isLocalNotice).toBe(true);
    expect(metrics.segments[0].sourceOverlap).toEqual([]);
    expect(metrics.transcript.assistantBlockCount).toBe(1);
    expect(metrics.transcript.assistantWordCounts).toEqual([8]);
  });

  it('uses generation-captured facts instead of current card data for historical output-copy metrics', () => {
    const metrics = buildReviewDebugMetrics({
      appData,
      conversation,
      segments: [{
        reviewId: 'historical-assistant-0',
        messageId: 'historical-assistant',
        generationId: 'historical-generation',
        turnNumber: 4,
        segmentNumber: 1,
        role: 'assistant',
        speakerName: 'Ashley',
        text: 'Ashley: *She pauses.* Old card phrase from generation time.',
        rawMessageText: 'Ashley: *She pauses.* Old card phrase from generation time.',
        characterPromptFacts: [{
          characterId: 'char-1',
          characterName: 'Ashley',
          sourceField: 'roleDescription',
          sourceLabel: 'Role in story',
          sourceValue: 'Old card phrase from generation time.',
          value: 'Old · card · phrase · generation · time.',
          runtimeUse: 'stable_reference',
          authority: 'saved_card_reference',
          relevance: 'conditional',
          visibility: 'character_knowledge',
          wordingPolicy: 'do_not_copy_phrase',
          modelFacing: true,
          disposition: 'transformed',
          reason: 'creator_reference_requires_compact_nonverbatim_prompt_copy',
        }],
      }],
    });

    expect(metrics.segments[0].characterPromptOutputFactSource).toBe('generation_captured_facts');
    expect(metrics.segments[0].characterPromptOutputCopyMetrics).toContainEqual(expect.objectContaining({
      factSource: 'generation_captured_facts',
      exactSourceValueCopies: [expect.objectContaining({
        sourceValue: 'Old card phrase from generation time.',
      })],
    }));
  });
});

describe('buildParentMessageResponseDetailMetrics', () => {
  const detailed = {
    requestedSetting: 'detailed',
    effectiveSetting: 'detailed',
    source: 'explicit_ui_setting',
    maxOutputTokens: 3072,
    instructionHash: 'fnv1a-12345678',
    instructionPreview: 'Detailed response instruction.',
  } as const;

  it('measures the full parent before child-card breakdowns and keeps warnings diagnostic', () => {
    const metrics = buildParentMessageResponseDetailMetrics({
      parentMessageId: 'assistant-parent',
      generationId: 'generation-1',
      text: `Ashley: *Ashley crosses the room and studies the latch.* "The mechanism is damaged, but I can repair it if you hold the light steady."

Sarah: *Sarah braces the housing and checks the exposed wiring.* "Then I will keep it stable while you work. We only get one clean attempt."`,
      childWordCounts: [24, 25],
      latestPlayerTurn: 'I bring the transmitter to the workbench and ask them to repair it before the storm arrives.',
      effectiveResponseDetail: detailed,
    });

    expect(metrics.parentMessageId).toBe('assistant-parent');
    expect(metrics.totalWords).toBeGreaterThan(30);
    expect(metrics.dialogueWords).toBeGreaterThan(20);
    expect(metrics.renderedChildCardCount).toBe(2);
    expect(metrics.warnings).toContain('uniform_child_card_shape');
    expect(metrics.allowedEscapeReason).toBeNull();
  });

  it('allows a naturally brief turn without converting diagnostics into repair behavior', () => {
    const metrics = buildParentMessageResponseDetailMetrics({
      parentMessageId: 'assistant-brief',
      generationId: 'generation-2',
      text: 'Ashley: "Yes."',
      childWordCounts: [2],
      latestPlayerTurn: 'Ready?',
      effectiveResponseDetail: detailed,
    });

    expect(metrics.allowedEscapeReason).toBe('brief_player_turn');
    expect(metrics.warnings).not.toContain('detailed_response_underdeveloped');
  });
});
