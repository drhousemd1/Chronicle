

# Pass 13 (Continued): Fix Narrative Director + Continue Button

## Root Cause Analysis

I checked the edge function logs. **The narrative director has ZERO logs** — it has never fired once. Combined with the fact that **`handleContinueConversation` completely ignores the narrative directive**, every time you clicked Continue, the AI got a vague "take a DECISIVE FORWARD ACTION" prompt with no specific guidance about what to do. So it defaults to the easiest pattern: more emotional processing.

Three concrete problems:

1. **Narrative director edge function never fires.** Zero logs. The `supabase.functions.invoke()` call is in the code but is silently failing — likely because the function wasn't deployed or has an auth/config issue. Need to verify deployment and add visible error logging.

2. **`handleContinueConversation` doesn't use the director.** Lines 3032-3042: it builds `runtimeDirectives` from only `antiLoopDirective`. It never reads `narrativeDirectiveRef.current`, never injects a `[DIRECTOR]` tag, and never calls `generateNarrativeDirective()` after completion. So even if the director worked, clicking Continue would bypass it entirely.

3. **The continue prompt is generic.** "Take a DECISIVE FORWARD ACTION" is too vague — the model doesn't know WHICH goal to advance. It needs specific character goals injected into the continue prompt so the AI knows what "forward" means.

## Plan

### Change 1: Fix narrative director deployment
Redeploy the `generate-narrative-directive` edge function to ensure it's live. Add explicit console logging at the invocation site in `ChatInterfaceTab.tsx` so we can see if the call is being made and what response comes back.

### Change 2: Wire `handleContinueConversation` to the narrative director
**File: `src/components/chronicle/ChatInterfaceTab.tsx`**
- Consume `narrativeDirectiveRef.current` in the continue handler (same pattern as `handleSend`)
- Inject it as `[DIRECTOR: ...]` in the runtime directives
- Call `generateNarrativeDirective()` after the continue response completes
- This ensures that every Continue click gets director guidance and generates a new directive for the next click

### Change 3: Make the continue prompt goal-aware
**File: `src/components/chronicle/ChatInterfaceTab.tsx`**
- Build a compact summary of active character goals and pending arc steps
- Inject them directly into the continue prompt so the model knows SPECIFICALLY what to advance
- Example: instead of "take a DECISIVE FORWARD ACTION", it becomes "Ashley's active goal: 'Develop a femdom relationship with James' — current step: 'Share personal writings to deepen emotional connection'. Ashley must BEGIN READING from the journal NOW. No more building up to it."

### Change 4: Update docs
**File: `docs/guides/edge-functions-ai-services-structure-guide.md`**

## Files Changed
- `src/components/chronicle/ChatInterfaceTab.tsx` — wire director to continue handler, make continue prompt goal-aware, add debug logging
- `supabase/functions/generate-narrative-directive/index.ts` — redeploy (touch to trigger)
- `docs/guides/edge-functions-ai-services-structure-guide.md` — update Pass 13 notes

