

# Remove Narrative Directive ("Second API Call") to Fix Outdated Responses

## Problem
After each AI response, a second API call (`generate-narrative-directive`) runs in the background, generating a 1-3 sentence "tactical directive" for the next turn. This directive is stored and injected as a `[DIRECTOR: ...]` tag into the next request. Because it's based on the *previous* conversation state, it often conflicts with what the user actually typed next — causing the AI to follow the outdated suggestion instead of naturally continuing from the user's latest input.

## Solution
Remove the narrative directive system entirely. The existing system prompt rules (FORWARD MOMENTUM, TURN PROGRESSION CONTRACT, goal-aware continue prompts) already provide sufficient continuity guidance without a competing outdated suggestion.

## Changes

### 1. `src/components/chronicle/ChatInterfaceTab.tsx`
- Remove `narrativeDirectiveRef` declaration and its reset in the conversation-switch effect
- Remove the `generateNarrativeDirective` callback function entirely
- Remove directive consumption (the `directorTag` / `narrativeDirectiveRef.current` blocks) from `handleSend`, `handleContinueConversation`
- Remove the `generateNarrativeDirective()` fire-and-forget calls after response completion in `handleSend` and `handleContinue`
- Simplify `runtimeDirectives` to only include `antiLoopDirective` (no more director tag assembly)

### 2. `src/services/llm.ts`
- Remove `[DIRECTOR]` from the priority hierarchy in the INSTRUCTIONS block (currently listed as #2)
- Renumber remaining priorities
- Remove any references to `[DIRECTOR]` tag handling in the system prompt text

### 3. `supabase/functions/generate-narrative-directive/index.ts`
- Delete the edge function file entirely (no longer called)

### 4. `supabase/config.toml`
- Remove the `[functions.generate-narrative-directive]` entry

### 5. `public/api-call-inspector-chronicle.html`
- Remove the "Narrative Directive" sidebar nav item
- Remove the "Narrative Directive Generation" documentation block
- Update the "Runtime Directives" block to reflect that only anti-loop directives are injected (no more `[DIRECTOR]` tags)
- Update the priority hierarchy display to remove `[DIRECTOR]` as #2
- Update the message assembly diagram to remove the narrative director injection comment

### 6. `docs/guides/edge-functions-ai-services-structure-guide.md`
- Remove `generate-narrative-directive` from the Edge Functions inventory table
- Update known issues/resolved items that reference Pass 13/14 narrative director

## What This Preserves
- Anti-loop directives (structural repetition detection, ping-pong detection, stagnation detection) — these remain fully functional
- Goal-aware continue prompts — already built into `handleContinueConversation`
- All canon note / forward momentum enforcement — unchanged
- Character extraction, memory extraction, goal evaluation — all unaffected

