import { describe, expect, it } from 'vitest';

import type { Memory } from '@/types';
import { buildMemoryFetchWithPruningReport } from './conversations';

const memory = (patch: Partial<Memory>): Memory => ({
  id: patch.id || 'memory-1',
  conversationId: patch.conversationId || 'conversation-1',
  content: patch.content || 'memory',
  day: patch.day ?? 1,
  timeOfDay: patch.timeOfDay ?? 'day',
  source: patch.source || 'message',
  entryType: patch.entryType || 'bullet',
  createdAt: patch.createdAt ?? 1,
  updatedAt: patch.updatedAt ?? 1,
  ...patch,
});

describe('conversation memory pruning reports', () => {
  it('returns active persisted memories plus debug-only pruning evidence', () => {
    const result = buildMemoryFetchWithPruningReport([
      memory({ id: 'manual-memory', source: 'user', sourceMessageId: undefined, sourceGenerationId: undefined }),
      memory({ id: 'current-memory', sourceMessageId: 'assistant-1', sourceGenerationId: 'generation-current' }),
      memory({ id: 'legacy-memory', sourceMessageId: 'assistant-1', sourceGenerationId: undefined }),
      memory({ id: 'stale-memory', sourceMessageId: 'assistant-1', sourceGenerationId: 'generation-stale' }),
      memory({ id: 'deleted-source-memory', sourceMessageId: 'assistant-deleted', sourceGenerationId: 'generation-old' }),
    ], new Map([
      ['assistant-1', 'generation-current'],
    ]));

    expect(result.activeMemories.map((entry) => entry.id)).toEqual([
      'manual-memory',
      'current-memory',
      'legacy-memory',
    ]);
    expect(result.pruningReports).toEqual(expect.arrayContaining([
      expect.objectContaining({
        itemType: 'memory',
        itemId: 'current-memory',
        included: true,
        reason: 'current_generation',
        currentGenerationId: 'generation-current',
      }),
      expect.objectContaining({
        itemType: 'memory',
        itemId: 'stale-memory',
        included: false,
        reason: 'stale_generation',
        sourceMessageId: 'assistant-1',
        sourceGenerationId: 'generation-stale',
        currentGenerationId: 'generation-current',
      }),
      expect.objectContaining({
        itemType: 'memory',
        itemId: 'deleted-source-memory',
        included: false,
        reason: 'deleted_source_message',
        sourceMessageId: 'assistant-deleted',
        sourceGenerationId: 'generation-old',
      }),
    ]));
  });
});
