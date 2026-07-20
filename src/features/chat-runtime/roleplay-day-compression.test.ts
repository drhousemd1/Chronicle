import { describe, expect, it } from 'vitest';

import {
  buildDayCompressionInputRows,
  isDayCompressionInputMemoryRowCurrent,
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

  it('requires the same memory row and the current source generation before persistence', () => {
    const [row] = buildDayCompressionInputRows(memories);
    const currentMemory = memories[0];

    expect(isDayCompressionInputMemoryRowCurrent({
      row,
      currentMemory,
      currentGenerationId: 'generation-one',
    })).toBe(true);
    expect(isDayCompressionInputMemoryRowCurrent({
      row,
      currentMemory: { ...currentMemory, content: 'Edited after compression started' },
      currentGenerationId: 'generation-one',
    })).toBe(false);
    expect(isDayCompressionInputMemoryRowCurrent({
      row,
      currentMemory,
      currentGenerationId: 'replacement-generation',
    })).toBe(false);
    expect(isDayCompressionInputMemoryRowCurrent({
      row,
      currentMemory: undefined,
      currentGenerationId: 'generation-one',
    })).toBe(false);
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

  it('does not persist or delete when any worker input became stale', async () => {
    const operations: string[] = [];
    const result = await persistReviewedDayCompression({
      inputMemoryRows: buildDayCompressionInputRows(memories),
      response: {
        version: 1,
        synopsis: 'This result was generated from stale evidence.',
        compressedInputMemoryRowIds: ['one', 'two'],
        rejectedInputMemoryRows: [{ id: 'three', reason: 'temporary_detail' }],
        warnings: [],
      },
      isInputMemoryRowCurrent: async (row) => row.id !== 'two',
      persistSynopsis: async () => {
        operations.push('save:synopsis');
        return { id: 'synopsis-row' };
      },
      deleteInputMemoryRow: async (id) => {
        operations.push(`delete:${id}`);
      },
    });

    expect(result.status).toBe('stale');
    expect(result.staleInputMemoryRowIds).toEqual(['two']);
    expect(result.deletedInputMemoryRowIds).toEqual([]);
    expect(operations).toEqual([]);
  });

  it('rolls back the synopsis and deletes no source rows when inputs become stale during persistence', async () => {
    const operations: string[] = [];
    let inputsAreCurrent = true;
    const result = await persistReviewedDayCompression({
      inputMemoryRows: buildDayCompressionInputRows(memories),
      response: {
        version: 1,
        synopsis: 'This synopsis became stale while it was being saved.',
        compressedInputMemoryRowIds: ['one', 'two'],
        rejectedInputMemoryRows: [{ id: 'three', reason: 'temporary_detail' }],
        warnings: [],
      },
      isInputMemoryRowCurrent: async () => inputsAreCurrent,
      persistSynopsis: async () => {
        operations.push('save:synopsis');
        inputsAreCurrent = false;
        return { id: 'synopsis-row' };
      },
      rollbackPersistedSynopsis: async (synopsis) => {
        operations.push(`rollback:${synopsis.id}`);
      },
      deleteInputMemoryRow: async (id) => {
        operations.push(`delete:${id}`);
      },
    });

    expect(result.status).toBe('stale');
    expect(result.staleInputMemoryRowIds).toEqual(['one', 'two', 'three']);
    expect(result.rolledBackPersistedSynopsis).toBe(true);
    expect(result.deletedInputMemoryRowIds).toEqual([]);
    expect(operations).toEqual(['save:synopsis', 'rollback:synopsis-row']);
  });

  it('reports a rollback gap without deleting source rows when stale synopsis cleanup fails', async () => {
    let inputsAreCurrent = true;
    let deleteCalls = 0;
    const result = await persistReviewedDayCompression({
      inputMemoryRows: buildDayCompressionInputRows(memories),
      response: {
        version: 1,
        synopsis: 'This stale synopsis cannot be allowed to hide its cleanup failure.',
        compressedInputMemoryRowIds: ['one'],
        rejectedInputMemoryRows: [{ id: 'two', reason: 'duplicate_fact' }],
        warnings: [],
      },
      isInputMemoryRowCurrent: async () => inputsAreCurrent,
      persistSynopsis: async () => {
        inputsAreCurrent = false;
        return { id: 'synopsis-row' };
      },
      rollbackPersistedSynopsis: async () => {
        throw new Error('rollback blocked');
      },
      deleteInputMemoryRow: async () => {
        deleteCalls += 1;
      },
    });

    expect(result.status).toBe('stale_with_rollback_gap');
    expect(result.synopsisRollbackError).toBe('rollback blocked');
    expect(result.rolledBackPersistedSynopsis).toBe(false);
    expect(result.deletedInputMemoryRowIds).toEqual([]);
    expect(deleteCalls).toBe(0);
  });

  it('preserves failed cleanup rows while reporting every successful and failed deletion', async () => {
    const operations: string[] = [];
    const result = await persistReviewedDayCompression({
      inputMemoryRows: buildDayCompressionInputRows(memories),
      response: {
        version: 1,
        synopsis: 'Two durable rows were compressed into this synopsis.',
        compressedInputMemoryRowIds: ['one', 'two'],
        rejectedInputMemoryRows: [{ id: 'three', reason: 'temporary_detail' }],
        warnings: [],
      },
      persistSynopsis: async () => {
        operations.push('save:synopsis');
        return { id: 'synopsis-row' };
      },
      deleteInputMemoryRow: async (id) => {
        operations.push(`delete:${id}`);
        if (id === 'two') throw new Error('delete blocked');
      },
    });

    expect(result.status).toBe('persisted_with_cleanup_gap');
    expect(operations).toEqual(['save:synopsis', 'delete:one', 'delete:two']);
    expect(result.deletedInputMemoryRowIds).toEqual(['one']);
    expect(result.failedDeletionRows).toEqual([{ id: 'two', error: 'delete blocked' }]);
    expect(result.review.rejectedInputMemoryRows).toEqual([
      { id: 'three', reason: 'temporary_detail' },
    ]);
  });

  it('creates a separate immutable synopsis for each compression batch', async () => {
    const savedSynopses: Array<{ id: string; content: string }> = [];
    const deletedRows: string[] = [];
    const persistBatch = async (
      batchId: string,
      batchMemories: Memory[],
      synopsis: string,
    ) => persistReviewedDayCompression({
      inputMemoryRows: buildDayCompressionInputRows(batchMemories),
      response: {
        version: 1,
        synopsis,
        compressedInputMemoryRowIds: batchMemories.map((memory) => memory.id),
        rejectedInputMemoryRows: [],
        warnings: [],
      },
      persistSynopsis: async (content) => {
        const row = { id: `synopsis-${batchId}`, content };
        savedSynopses.push(row);
        return row;
      },
      deleteInputMemoryRow: async (id) => {
        deletedRows.push(id);
      },
    });

    const first = await persistBatch('day-1', memories.slice(0, 2), 'Day 1 remained intact.');
    const firstSnapshot = structuredClone(savedSynopses[0]);
    const second = await persistBatch('day-2', [
      {
        ...memories[2],
        id: 'day-two-row',
        day: 2,
        content: 'A later day produced a different durable event.',
      },
    ], 'Day 2 remained separate.');

    expect(first.status).toBe('persisted');
    expect(second.status).toBe('persisted');
    expect(savedSynopses).toEqual([
      { id: 'synopsis-day-1', content: 'Day 1 remained intact.' },
      { id: 'synopsis-day-2', content: 'Day 2 remained separate.' },
    ]);
    expect(savedSynopses[0]).toEqual(firstSnapshot);
    expect(deletedRows).toEqual(['one', 'two', 'day-two-row']);
  });
});
