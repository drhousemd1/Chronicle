

# Diagnose: Tone AI Enhance Produces Nothing

## Finding

After thorough code review, **the tone enhancement uses the exact same code path as every other AI enhance button** in the app. There is no custom or different approach:

1. `openEnhanceModeModal` → user picks mode → `handleEnhanceField` → `aiEnhanceCharacterField` → `callAIWithFallback` → `supabase.functions.invoke('chat')` → Grok API

The only difference is the **prompt text** sent to Grok, which tells it to focus on speech/voice instead of hair color or build — same pattern as every other field having its own instruction.

## Why It's Not Working

The edge function has **zero logs** for any enhance-related calls, meaning the request never reaches the server. Two possible causes:

### 1. CORS Origin Mismatch (Most Likely)
Your CORS whitelist in `supabase/functions/_shared/cors.ts` has a static list of 3 domains. If the browser preview is running on a domain not in that list (e.g. `*.lovableproject.com` vs `*.lovable.app`), the browser silently blocks ALL non-streaming requests. Streaming chat may work differently due to browser handling of SSE streams.

**Fix**: Update `getCorsHeaders` to pattern-match against your domains instead of a static list:

```typescript
export function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const isAllowed =
    origin === 'http://localhost:5173' ||
    origin.endsWith('.lovable.app') ||
    origin.endsWith('.lovableproject.com');
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://hello-git-hug.lovable.app',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  };
}
```

### 2. Auth / Session Issue
If you weren't logged in, the `handleEnhanceField` function silently returns without making any API call (`if (!selected || enhancingField) return`). The catch block also swallows errors silently with just a `console.error`.

## Verification Step

Before applying any fix, we should confirm: **do other enhance buttons (e.g. Hair Color, Build, Eye Color) work right now?** If they also fail silently, it's the CORS issue. If they work but only tone fails, there's a different problem to investigate.

## Plan

1. **Update `supabase/functions/_shared/cors.ts`** — switch from static whitelist to pattern-based origin matching (single file, 13 lines → 13 lines)
2. **Test** — verify tone enhance works after the CORS fix

### Files Modified
- `supabase/functions/_shared/cors.ts` — pattern-based CORS origin matching

