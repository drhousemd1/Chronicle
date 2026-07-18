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
  status: 'rejected' | 'persistence_failed' | 'persisted' | 'persisted_with_cleanup_gap';
  persistedSynopsis?: T;
  deletedInputMemoryRowIds: string[];
  failedDeletionRows: Array<{ id: string; error: string }>;
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
  deleteInputMemoryRow: (id: string) => Promise<void>;
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
