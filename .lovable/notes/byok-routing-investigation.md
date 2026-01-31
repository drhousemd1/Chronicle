# Investigation Notes: BYOK Gateway Routing Issue

**Date**: January 2026  
**Status**: Unresolved - Could not reproduce

---

## Symptoms

- Chat interface failed to generate AI responses during NSFW testing
- Error toast/overlay appeared briefly (possibly with Lovable logo)
- User was using Grok model, not Gemini
- Issue went away after a short period and could not be reproduced

---

## Suspected Cause

The `extract-memory-events` and `generate-cover-image` edge functions may be hardcoded to use Gemini/Lovable Gateway instead of routing through the user's selected model (Grok). When NSFW content is processed, Gemini's content policy would block it.

---

## Affected Files (to review if issue recurs)

| File | Issue |
|------|-------|
| `supabase/functions/extract-memory-events/index.ts` | Falls back to `google/gemini-3-flash-preview` if no `modelId` provided. Always uses Lovable Gateway regardless of which model is selected - there's no `getGateway()` routing logic. |
| `supabase/functions/generate-cover-image/index.ts` | Hardcodes `google/gemini-2.5-flash-image` with no option to use Grok's image model. |

---

## Functions That ARE Correctly Routing

These functions properly respect the BYOK pattern and can be used as reference:
- `supabase/functions/chat/index.ts` - Has `getGateway()` logic
- `supabase/functions/extract-character-updates/index.ts` - Has full BYOK routing
- `supabase/functions/generate-side-character/index.ts` - Has BYOK routing
- `supabase/functions/generate-scene-image/index.ts` - Has BYOK routing

---

## Resolution (if issue recurs)

Add `getGateway()` routing logic to the affected functions, similar to `chat/index.ts` and `extract-character-updates/index.ts`:

```typescript
function getGateway(modelId: string): 'lovable' | 'xai' {
  if (modelId.startsWith('grok')) {
    return 'xai';
  }
  return 'lovable';
}

// Then conditionally set apiUrl and apiKey based on gateway
const gateway = getGateway(modelId);
let apiUrl: string;
let apiKey: string | undefined;

if (gateway === 'xai') {
  apiKey = Deno.env.get("XAI_API_KEY");
  apiUrl = "https://api.x.ai/v1/chat/completions";
} else {
  apiKey = Deno.env.get("LOVABLE_API_KEY");
  apiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
}
```

---

## Related Memory

See `memory/features/byok-extraction-routing` for context on how the `extract-character-updates` function was fixed to support BYOK routing.
