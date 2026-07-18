import { describe, expect, it } from 'vitest';

import {
  buildDayCompressionInputRows,
  persistReviewedDayCompression,
  reviewDayCompressionResponse,
} from './roleplay-day-compression';
import type { Memory } from '@/types';

const memories: Memory[] = ['one', 'two', 'three'].map((id, index) => ({
  id,
  conversationId: 'conversation-1',
  content: `Memory ${id}`,
  day: 1,
  timeOfDay: 'day',
  source: 'message',
  sourceMessageId: `message-${id}`,
  sourceGenerationId: `generation-${id}`,
  entryType: 'bullet',
  createdAt: index + 1,
  updatedAt: index + 1,
}));

describe('day compression row-ID contract', () => {
  it('builds traceable source rows instead of anonymous bullets', () => {
    expect(buildDayCompressionInputRows(memories)).toEqual([
      expect.objectContaining({
        id: 'one',
        content: 'Memory one',
        conversationId: 'conversation-1',
        day: 1,
        sourceMessageId: 'message-one',
        sourceGenerationId: 'generation-one',
        createdAt: 1,
      }),
      expect.objectContaining({ id: 'two' }),
      expect.objectContaining({ id: 'three' }),
    ]);
  });

  it('accepts only an explicit subset of input row IDs', () => {
    const inputMemoryRows = buildDayCompressionInputRows(memories);
    const review = reviewDayCompressionResponse({
      inputMemoryRows,
      response: {
        version: 1,
        synopsis: 'A concise durable synopsis.',
        compressedInputMemoryRowIds: ['one'],
        rejectedInputMemoryRows: [{ id: 'two', reason: 'duplicate_fact' }],
        warnings: ['browser_supplied_input_rows'],
      },
    });

    expect(review.valid).toBe(true);
    expect(review.compressedInputMemoryRowIds).toEqual(['one']);
    expect(review.omittedInputMemoryRowIds).toEqual(['three']);
  });

  it.each([
    ['missing id list', { synopsis: 'Summary', rejectedInputMemoryRows: [], warnings: [] }],
    ['empty synopsis', { synopsis: '', compressedInputMemoryRowIds: ['one'], rejectedInputMemoryRows: [], warnings: [] }],
    ['unknown id', { synopsis: 'Summary', compressedInputMemoryRowIds: ['unknown'], rejectedInputMemoryRows: [], warnings: [] }],
    ['duplicate id', { synopsis: 'Summary', compressedInputMemoryRowIds: ['one', 'one'], rejectedInputMemoryRows: [], warnings: [] }],
    ['overlapping decisions', { synopsis: 'Summary', compressedInputMemoryRowIds: ['one'], rejectedInputMemoryRows: [{ id: 'one', reason: 'bad' }], warnings: [] }],
  ])('blocks deletion for %s', (_label, response) => {
    const review = reviewDayCompressionResponse({
      inputMemoryRows: buildDayCompressionInputRows(memories),
      response,
    });

    expect(review.valid).toBe(false);
  });

  it('persists the synopsis before deleting only validated accepted IDs', async () => {
    const operations: string[] = [];
    const result = await persistReviewedDayCompression({
      inputMemoryRows: buildDayCompressionInputRows(memories),
      response: {
        version: 1,
        synopsis: 'A concise durable synopsis.',
        compressedInputMemoryRowIds: ['one'],
        rejectedInputMemoryRows: [{ id: 'two', reason: 'duplicate_fact' }],
        warnings: [],
      },
      persistSynopsis: async () => {
        operations.push('save:synopsis');
        return { id: 'synopsis-row' };
      },
      deleteInputMemoryRow: async (id) => {
        operations.push(`delete:${id}`);
      },
    });

    expect(result.status).toBe('persisted');
    expect(operations).toEqual(['save:synopsis', 'delete:one']);
    expect(result.deletedInputMemoryRowIds).toEqual(['one']);
    expect(result.review.omittedInputMemoryRowIds).toEqual(['three']);
  });

  it('never deletes source rows when validation or synopsis persistence fails', async () => {
    let deleteCalls = 0;
    const invalid = await persistReviewedDayCompression({
      inputMemoryRows: buildDayCompressionInputRows(memories),
      response: { synopsis: 'Unsafe summary without row IDs.' },
      persistSynopsis: async () => ({ id: 'should-not-save' }),
      deleteInputMemoryRow: async () => { deleteCalls += 1; },
    });
    const saveFailed = await persistReviewedDayCompression({
      inputMemoryRows: buildDayCompressionInputRows(memories),
      response: {
        synopsis: 'Valid summary.',
        compressedInputMemoryRowIds: ['one'],
        rejectedInputMemoryRows: [],
        warnings: [],
      },
      persistSynopsis: async () => { throw new Error('save failed'); },
      deleteInputMemoryRow: async () => { deleteCalls += 1; },
    });

    expect(invalid.status).toBe('rejected');
    expect(saveFailed.status).toBe('persistence_failed');
    expect(deleteCalls).toBe(0);
  });
});
