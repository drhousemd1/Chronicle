import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const supportFunctions = [
  {
    scope: 'extract-memory-events',
    path: 'supabase/functions/extract-memory-events/index.ts',
    providerCall: 'const result = await callXaiResponses',
    requestParse: 'await req.json()',
  },
  {
    scope: 'compress-day-memories',
    path: 'supabase/functions/compress-day-memories/index.ts',
    providerCall: 'const result = await callXaiResponses',
    requestParse: 'await req.json()',
  },
  {
    scope: 'extract-character-updates',
    path: 'supabase/functions/extract-character-updates/index.ts',
    providerCall: 'const result = await callXaiResponses',
    requestParse: 'await req.json()',
  },
  {
    scope: 'evaluate-goal-progress',
    path: 'supabase/functions/evaluate-goal-progress/index.ts',
    providerCall: 'const result = await callXaiResponses',
    requestParse: 'await req.json()',
  },
  {
    scope: 'evaluate-goal-alignment',
    path: 'supabase/functions/evaluate-goal-alignment/index.ts',
    providerCall: 'const result = await callXaiResponses',
    requestParse: 'await req.json()',
  },
] as const;

const read = (path: string) => readFileSync(path, 'utf8');

describe('AI support Edge Function ingress rate limits', () => {
  it.each(supportFunctions)('$scope checks the shared limiter before parsing or provider calls', ({ path, scope, providerCall, requestParse }) => {
    const source = read(path);

    expect(source).toContain('import { checkRateLimit, getRateLimitHeaders } from "../_shared/rate-limit.ts";');
    expect(source).toContain('const SUPPORT_RATE_LIMIT_WINDOW_MS = 60_000;');
    expect(source).toContain('const SUPPORT_RATE_LIMIT_MAX = 30;');
    expect(source).toContain(`const rateDecision = checkRateLimit({ scope: "${scope}", key: user.id, windowMs: SUPPORT_RATE_LIMIT_WINDOW_MS, max: SUPPORT_RATE_LIMIT_MAX });`);
    expect(source).toContain('if (!rateDecision.allowed) {');
    expect(source).toContain('retryAfterSeconds: rateDecision.retryAfterSeconds');
    expect(source).toContain('{ status: 429, headers: { ...corsHeaders, ...getRateLimitHeaders(rateDecision), "Content-Type": "application/json" } }');
    expect(source).toContain('const rateHeaders = getRateLimitHeaders(rateDecision);');
    expect(source).toContain('const responseHeadersBase = { ...corsHeaders, ...rateHeaders };');

    const limiterIndex = source.indexOf('const rateDecision = checkRateLimit');
    const requestParseIndex = source.indexOf(requestParse);
    const providerCallIndex = source.indexOf(providerCall);

    expect(limiterIndex).toBeGreaterThan(-1);
    expect(requestParseIndex).toBeGreaterThan(limiterIndex);
    expect(providerCallIndex).toBeGreaterThan(limiterIndex);
  });
});
