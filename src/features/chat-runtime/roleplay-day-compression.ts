import type { Memory } from '@/types';

export type DayCompressionInputMemoryRow = {
  id: string;
  content: string;
  conversationId: string;
  day: number | null;
  sourceMessageId?: string;
  sourceGenerationId?: string;
  createdAt: number;
};

export type DayCompressionRejectedInputRow = {
  id: string;
  reason: string;
};

export type DayCompressionResponseV1 = {
  version: 1;
  synopsis: string;
  compressedInputMemoryRowIds: string[];
  rejectedInputMemoryRows: DayCompressionRejectedInputRow[];
  warnings: string[];
};

export type ReviewedDayCompressionResponse = DayCompressionResponseV1 & {
  valid: boolean;
  omittedInputMemoryRowIds: string[];
  validationErrors: string[];
};

export type DayCompressionPersistenceResult<T extends { id: string }> = {
  review: ReviewedDayCompressionResponse;
  status: 'rejected' | 'stale' | 'stale_with_rollback_gap' | 'persistence_failed' | 'persisted' | 'persisted_with_cleanup_gap';
  persistedSynopsis?: T;
  deletedInputMemoryRowIds: string[];
  failedDeletionRows: Array<{ id: string; error: string }>;
  staleInputMemoryRowIds?: string[];
  rolledBackPersistedSynopsis?: boolean;
  synopsisRollbackError?: string;
  persistenceError?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function buildDayCompressionInputRows(memories: Memory[]): DayCompressionInputMemoryRow[] {
  return memories.map((memory) => ({
    id: memory.id,
    content: memory.content.trim(),
    conversationId: memory.conversationId,
    day: memory.day,
    sourceMessageId: memory.sourceMessageId,
    sourceGenerationId: memory.sourceGenerationId,
    createdAt: memory.createdAt,
  }));
}

export function isDayCompressionInputMemoryRowCurrent(input: {
  row: DayCompressionInputMemoryRow;
  currentMemory?: Memory;
  currentGenerationId?: string | null;
}): boolean {
  const { row, currentMemory, currentGenerationId } = input;
  if (!currentMemory) return false;
  if (
    currentMemory.content.trim() !== row.content
    || currentMemory.conversationId !== row.conversationId
    || currentMemory.day !== row.day
    || currentMemory.sourceMessageId !== row.sourceMessageId
    || currentMemory.sourceGenerationId !== row.sourceGenerationId
    || currentMemory.createdAt !== row.createdAt
  ) {
    return false;
  }
  if (!row.sourceMessageId) return true;
  return currentGenerationId === (row.sourceGenerationId || row.sourceMessageId);
}

export function reviewDayCompressionResponse(input: {
  inputMemoryRows: DayCompressionInputMemoryRow[];
  response: unknown;
}): ReviewedDayCompressionResponse {
  const response = asRecord(input.response);
  const inputIds = input.inputMemoryRows.map((row) => row.id);
  const inputIdSet = new Set(inputIds);
  const validationErrors: string[] = [];
  const synopsis = asText(response?.synopsis);
  if (!synopsis) validationErrors.push('missing_synopsis');

  const rawCompressedIds = response?.compressedInputMemoryRowIds;
  const compressedInputMemoryRowIds = Array.isArray(rawCompressedIds)
    ? rawCompressedIds.map(asText).filter(Boolean)
    : [];
  if (!Array.isArray(rawCompressedIds)) validationErrors.push('missing_compressed_input_memory_row_ids');
  if (new Set(compressedInputMemoryRowIds).size !== compressedInputMemoryRowIds.length) {
    validationErrors.push('duplicate_compressed_input_memory_row_ids');
  }
  if (compressedInputMemoryRowIds.some((id) => !inputIdSet.has(id))) {
    validationErrors.push('unknown_compressed_input_memory_row_id');
  }

  const rawRejectedRows = response?.rejectedInputMemoryRows;
  const rejectedInputMemoryRows = (Array.isArray(rawRejectedRows) ? rawRejectedRows : [])
    .map((value): DayCompressionRejectedInputRow | null => {
      const row = asRecord(value);
      const id = asText(row?.id);
      const reason = asText(row?.reason);
      return id && reason ? { id, reason } : null;
    })
    .filter((row): row is DayCompressionRejectedInputRow => Boolean(row));
  if (!Array.isArray(rawRejectedRows)) validationErrors.push('missing_rejected_input_memory_rows');
  if (Array.isArray(rawRejectedRows) && rejectedInputMemoryRows.length !== rawRejectedRows.length) {
    validationErrors.push('malformed_rejected_input_memory_row');
  }
  const rejectedIds = rejectedInputMemoryRows.map((row) => row.id);
  if (new Set(rejectedIds).size !== rejectedIds.length) {
    validationErrors.push('duplicate_rejected_input_memory_row_id');
  }
  if (rejectedIds.some((id) => !inputIdSet.has(id))) {
    validationErrors.push('unknown_rejected_input_memory_row_id');
  }
  if (rejectedIds.some((id) => compressedInputMemoryRowIds.includes(id))) {
    validationErrors.push('row_both_compressed_and_rejected');
  }

  const warnings = Array.isArray(response?.warnings)
    ? response.warnings.map(asText).filter(Boolean)
    : [];
  if (!Array.isArray(response?.warnings)) validationErrors.push('missing_warnings');

  const decidedIds = new Set([...compressedInputMemoryRowIds, ...rejectedIds]);
  const omittedInputMemoryRowIds = inputIds.filter((id) => !decidedIds.has(id));
  if (compressedInputMemoryRowIds.length === 0) {
    validationErrors.push('no_compressed_input_memory_rows');
  }

  return {
    version: 1,
    synopsis,
    compressedInputMemoryRowIds,
    rejectedInputMemoryRows,
    warnings,
    omittedInputMemoryRowIds,
    validationErrors,
    valid: validationErrors.length === 0,
  };
}

export async function persistReviewedDayCompression<T extends { id: string }>(input: {
  inputMemoryRows: DayCompressionInputMemoryRow[];
  response: unknown;
  persistSynopsis: (synopsis: string) => Promise<T>;
  rollbackPersistedSynopsis?: (persistedSynopsis: T) => Promise<void>;
  deleteInputMemoryRow: (id: string) => Promise<void>;
  isInputMemoryRowCurrent?: (row: DayCompressionInputMemoryRow) => boolean | Promise<boolean>;
}): Promise<DayCompressionPersistenceResult<T>> {
  const review = reviewDayCompressionResponse(input);
  if (!review.valid) {
    return {
      review,
      status: 'rejected',
      deletedInputMemoryRowIds: [],
      failedDeletionRows: [],
    };
  }

  const staleInputMemoryRowIds: string[] = [];
  if (input.isInputMemoryRowCurrent) {
    for (const row of input.inputMemoryRows) {
      if (!await input.isInputMemoryRowCurrent(row)) {
        staleInputMemoryRowIds.push(row.id);
      }
    }
  }
  if (staleInputMemoryRowIds.length > 0) {
    return {
      review,
      status: 'stale',
      deletedInputMemoryRowIds: [],
      failedDeletionRows: [],
      staleInputMemoryRowIds,
    };
  }

  let persistedSynopsis: T;
  try {
    persistedSynopsis = await input.persistSynopsis(review.synopsis);
  } catch (error) {
    return {
      review,
      status: 'persistence_failed',
      deletedInputMemoryRowIds: [],
      failedDeletionRows: [],
      persistenceError: error instanceof Error ? error.message : String(error),
    };
  }

  const staleAfterPersistenceInputMemoryRowIds: string[] = [];
  if (input.isInputMemoryRowCurrent) {
    for (const row of input.inputMemoryRows) {
      if (!await input.isInputMemoryRowCurrent(row)) {
        staleAfterPersistenceInputMemoryRowIds.push(row.id);
      }
    }
  }
  if (staleAfterPersistenceInputMemoryRowIds.length > 0) {
    if (!input.rollbackPersistedSynopsis) {
      return {
        review,
        status: 'stale_with_rollback_gap',
        persistedSynopsis,
        deletedInputMemoryRowIds: [],
        failedDeletionRows: [],
        staleInputMemoryRowIds: staleAfterPersistenceInputMemoryRowIds,
        rolledBackPersistedSynopsis: false,
        synopsisRollbackError: 'rollback_callback_unavailable',
      };
    }
    try {
      await input.rollbackPersistedSynopsis(persistedSynopsis);
      return {
        review,
        status: 'stale',
        persistedSynopsis,
        deletedInputMemoryRowIds: [],
        failedDeletionRows: [],
        staleInputMemoryRowIds: staleAfterPersistenceInputMemoryRowIds,
        rolledBackPersistedSynopsis: true,
      };
    } catch (error) {
      return {
        review,
        status: 'stale_with_rollback_gap',
        persistedSynopsis,
        deletedInputMemoryRowIds: [],
        failedDeletionRows: [],
        staleInputMemoryRowIds: staleAfterPersistenceInputMemoryRowIds,
        rolledBackPersistedSynopsis: false,
        synopsisRollbackError: error instanceof Error ? error.message : String(error),
      };
    }
  }

  const deletedInputMemoryRowIds: string[] = [];
  const failedDeletionRows: Array<{ id: string; error: string }> = [];
  for (const id of review.compressedInputMemoryRowIds) {
    try {
      await input.deleteInputMemoryRow(id);
      deletedInputMemoryRowIds.push(id);
    } catch (error) {
      failedDeletionRows.push({
        id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    review,
    status: failedDeletionRows.length > 0 ? 'persisted_with_cleanup_gap' : 'persisted',
    persistedSynopsis,
    deletedInputMemoryRowIds,
    failedDeletionRows,
  };
}
