import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

const debugPayloadFunctions = [
  {
    path: 'supabase/functions/extract-memory-events/index.ts',
    scope: '[extract-memory-events]',
  },
  {
    path: 'supabase/functions/compress-day-memories/index.ts',
    scope: '[compress-day-memories]',
  },
  {
    path: 'supabase/functions/extract-character-updates/index.ts',
    scope: '[extract-character-updates]',
  },
  {
    path: 'supabase/functions/evaluate-goal-progress/index.ts',
    scope: '[evaluate-goal-progress]',
  },
  {
    path: 'supabase/functions/evaluate-goal-alignment/index.ts',
    scope: '[evaluate-goal-alignment]',
  },
  {
    path: 'supabase/functions/generate-side-character/index.ts',
    scope: '[generate-side-character]',
  },
  {
    path: 'supabase/functions/generate-side-character-avatar/index.ts',
    scope: '[generate-avatar]',
  },
] as const;

describe('admin debug trace authorization source contracts', () => {
  it('centralizes debug-trace authorization on the backend admin role RPC', () => {
    const source = read('supabase/functions/_shared/admin-debug.ts');

    expect(source).toContain('export async function shouldReturnAdminDebugTrace');
    expect(source).toContain('if (requested !== true) return false;');
    expect(source).toContain('await supabase.rpc("has_role", {');
    expect(source).toContain('_user_id: userId');
    expect(source).toContain('_role: "admin"');
    expect(source).toContain('return isAdmin === true;');
  });

  it('gates chat turn debug traces with the backend admin role check', () => {
    const source = read('supabase/functions/chat/index.ts');

    expect(source).toContain('import { shouldReturnAdminDebugTrace } from "../_shared/admin-debug.ts";');
    expect(source).toContain('const debugTraceAllowed = await shouldReturnAdminDebugTrace(supabase, user.id, body.debugTrace, "[chat]");');
    expect(source).toContain('debugTraceAllowed ? buildDirectDebugTrace(messages, roleplayContext) : null');
    expect(source).not.toContain('const debugTraceRequested = body.debugTrace === true;');
  });

  it.each(debugPayloadFunctions)('$path gates support debug payloads with the backend admin role check', ({ path, scope }) => {
    const source = read(path);

    expect(source).toContain('import { shouldReturnAdminDebugTrace } from "../_shared/admin-debug.ts";');
    expect(source).toContain(`const debugTraceAllowed = await shouldReturnAdminDebugTrace(supabase, user.id, debugTrace, "${scope}");`);
    expect(source).toContain('debugTraceAllowed');
    expect(source).not.toContain('debugTrace === true ?');
    expect(source).not.toContain('if (debugTrace === true)');
  });
});
