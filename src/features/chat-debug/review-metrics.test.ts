import { describe, expect, it } from 'vitest';
import type { Conversation, ScenarioData } from '@/types';
import { buildReviewDebugMetrics } from './review-metrics';

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
      currentMood: 'Guarded',
      roleDescription: 'A suspicious archivist.',
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
  it('counts roleplay modalities, repetition, internal thoughts, and source overlap locally', () => {
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
          text: '*Ashley shields the candle with one hand.* "It matters because the map was hidden here." (The desk is too obvious, but the wax mark is new.)',
          rawMessageText: conversation.messages[1].text,
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
        },
      ],
    });

    expect(metrics.schema).toBe('chronicle-session-deterministic-metrics-v1');
    expect(metrics.transcript.assistantBlockCount).toBe(2);
    expect(metrics.segments[0].actionSegmentCount).toBe(1);
    expect(metrics.segments[0].dialogueSegmentCount).toBe(1);
    expect(metrics.segments[0].internalThoughtCount).toBe(1);
    expect(metrics.segments[0].compressedModalitySequence).toEqual(['action', 'dialogue', 'internal_thought']);
    expect(metrics.segments[0].sourceOverlap.some((entry) => entry.source === 'story_card_data')).toBe(true);
    expect(metrics.segments[1].repeatedTermsFromEarlierAssistantBlocks).toContain('candle');
    expect(metrics.segments[1].topRepeatedTerms.some((entry) => entry.value === 'checks')).toBe(true);
    expect(metrics.segments[1].repeatedPhrases.some((entry) => entry.value === 'checks the old map')).toBe(true);
    expect(metrics.segments[1].internalThoughtDiagnostics[0].wordCount).toBeGreaterThan(0);
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
});
