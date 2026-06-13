import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Message } from '@/types';
import type { DialogDebugComment } from '@/features/chat-debug/types';
import { buildDialogDebugCommentKey } from '@/features/chat-debug/storage';
import {
  buildConversationMessageGenerationMap,
  buildDialogDebugCommentsStorageKey,
  buildExportDialogDebugComments,
  dialogDebugCommentsEqual,
  loadDialogDebugComments,
  mergeDialogDebugComments,
  saveDialogDebugComments,
  stripDialogDebugCommentsForMessage,
} from './dialog-debug-comments';

function makeComment(overrides: Partial<DialogDebugComment> = {}): DialogDebugComment {
  return {
    messageId: 'msg-1',
    generationId: 'gen-1',
    note: 'Needs better physical continuity.',
    tags: ['Scene Logic'],
    createdAt: 100,
    updatedAt: 100,
    ...overrides,
  };
}

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg-1',
    generationId: 'gen-1',
    role: 'assistant',
    text: 'Ashley: "Still here."',
    createdAt: 100,
    ...overrides,
  };
}

function stubLocalStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  const localStorage = {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
  };
  vi.stubGlobal('window', { localStorage });
  return { localStorage, store };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('dialog debug comment helpers', () => {
  it('uses the same storage key namespace as the original chat UI helper', () => {
    expect(buildDialogDebugCommentsStorageKey('scenario-1', 'conversation-2'))
      .toBe('chronicle_dialog_debug_comments_v1:scenario-1:conversation-2');
  });

  it('builds message-generation maps for generation-aware comment keys', () => {
    const map = buildConversationMessageGenerationMap([
      makeMessage({ id: 'message-a', generationId: 'generation-a' }),
      makeMessage({ id: 'message-b', generationId: undefined }),
    ]);

    expect(map.get('message-a')).toBe('generation-a');
    expect(map.get('message-b')).toBe('message-b');
  });

  it('merges comments by newest updatedAt value', () => {
    const older = makeComment({ note: 'older', updatedAt: 10 });
    const newer = makeComment({ note: 'newer', updatedAt: 20 });
    const key = buildDialogDebugCommentKey('msg-1', 'gen-1');

    expect(mergeDialogDebugComments({ [key]: older }, { [key]: newer })[key].note).toBe('newer');
    expect(mergeDialogDebugComments({ [key]: newer }, { [key]: older })[key].note).toBe('newer');
  });

  it('strips comments tied to a deleted message id', () => {
    const kept = makeComment({ messageId: 'msg-2', generationId: 'gen-2' });
    const removed = makeComment({ messageId: 'msg-1', generationId: 'gen-1' });
    const comments = {
      [buildDialogDebugCommentKey('msg-1', 'gen-1')]: removed,
      [buildDialogDebugCommentKey('msg-2', 'gen-2')]: kept,
    };

    expect(stripDialogDebugCommentsForMessage(comments, 'msg-1')).toEqual({
      [buildDialogDebugCommentKey('msg-2', 'gen-2')]: kept,
    });
  });

  it('compares comments without depending on object insertion order', () => {
    const first = makeComment({ messageId: 'msg-1', generationId: 'gen-1' });
    const second = makeComment({ messageId: 'msg-2', generationId: 'gen-2' });

    expect(dialogDebugCommentsEqual(
      {
        [buildDialogDebugCommentKey('msg-1', 'gen-1')]: first,
        [buildDialogDebugCommentKey('msg-2', 'gen-2')]: second,
      },
      {
        [buildDialogDebugCommentKey('msg-2', 'gen-2')]: second,
        [buildDialogDebugCommentKey('msg-1', 'gen-1')]: first,
      },
    )).toBe(true);
    expect(dialogDebugCommentsEqual(
      { [buildDialogDebugCommentKey('msg-1', 'gen-1')]: first },
      { [buildDialogDebugCommentKey('msg-1', 'gen-1')]: { ...first, note: 'changed' } },
    )).toBe(false);
  });

  it('maps comments by visible message id for review export', () => {
    const comment = makeComment({ messageId: 'msg-1', generationId: 'gen-1' });
    const comments = { [buildDialogDebugCommentKey('msg-1', 'gen-1')]: comment };

    expect(buildExportDialogDebugComments(comments, [makeMessage()])).toEqual({
      'msg-1': comment,
    });
  });

  it('loads comments from local storage, normalizes legacy generation ids, and drops empty invalid entries', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const storageKey = buildDialogDebugCommentsStorageKey('scenario-1', 'conversation-1');
    const legacyComment = {
      messageId: 'msg-1',
      generationId: '',
      note: '  Still valid.  ',
      tags: ['Scene Logic', 'Not A Tag'],
      createdAt: 50,
    };
    stubLocalStorage({
      [storageKey]: JSON.stringify({
        'msg-1:old': legacyComment,
        'msg-2:gen-2': makeComment({ messageId: 'msg-2', generationId: 'gen-2', note: '   ', tags: [] }),
      }),
    });

    const loaded = loadDialogDebugComments('scenario-1', 'conversation-1', [
      makeMessage({ id: 'msg-1', generationId: 'fresh-gen-1' }),
      makeMessage({ id: 'msg-2', generationId: 'gen-2' }),
    ]);

    expect(Object.keys(loaded)).toEqual([buildDialogDebugCommentKey('msg-1', 'fresh-gen-1')]);
    expect(loaded[buildDialogDebugCommentKey('msg-1', 'fresh-gen-1')]).toMatchObject({
      messageId: 'msg-1',
      generationId: 'fresh-gen-1',
      note: '  Still valid.  ',
      tags: ['Scene Logic'],
      createdAt: 50,
      updatedAt: 50,
    });
  });

  it('returns an empty object instead of crashing on malformed local storage', () => {
    const storageKey = buildDialogDebugCommentsStorageKey('scenario-1', 'conversation-1');
    stubLocalStorage({ [storageKey]: '{not json' });

    expect(loadDialogDebugComments('scenario-1', 'conversation-1', [])).toEqual({});
  });

  it('saves comments to local storage and ignores storage failures', () => {
    const { localStorage, store } = stubLocalStorage();
    const comment = makeComment();

    saveDialogDebugComments('scenario-1', 'conversation-1', {
      [buildDialogDebugCommentKey('msg-1', 'gen-1')]: comment,
    });

    expect(localStorage.setItem).toHaveBeenCalledTimes(1);
    expect(store.get(buildDialogDebugCommentsStorageKey('scenario-1', 'conversation-1')))
      .toBe(JSON.stringify({ [buildDialogDebugCommentKey('msg-1', 'gen-1')]: comment }));

    localStorage.setItem.mockImplementationOnce(() => {
      throw new Error('quota');
    });
    expect(() => saveDialogDebugComments('scenario-1', 'conversation-1', {})).not.toThrow();
  });
});
