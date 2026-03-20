

# Fix: User-Authored AI Dialogue Rehashing

## Problem
When users write dialogue/actions for AI-controlled characters, Grok rephrases and expands it instead of treating it as already-spoken canon and continuing forward.

## Root Cause
The FORWARD MOMENTUM rule in the system prompt is too brief — it says "do not re-narrate" but lacks enforcement mechanics (violation check, examples) that Grok needs to follow it reliably.

## Changes

### 1. `src/services/llm.ts` — Expand FORWARD MOMENTUM block (lines 325-329)
Replace the current 4-line FORWARD MOMENTUM section with the enhanced version that includes:
- Explicit "USER-AUTHORED AI DIALOGUE ACCEPTANCE" sub-rule at highest priority
- A VIOLATION CHECK instruction (scan-and-delete enforcement)
- CORRECT and WRONG examples so the model learns the exact behavior
- "Immutable canon" reinforcement language

### 2. `public/api-call-inspector-chronicle.html` — Update matching block (lines 1222-1226)
Update the API Inspector's FORWARD MOMENTUM section to mirror the new rules, keeping the inspector's condensed format but adding the key enforcement points (violation check, canon acceptance, examples).

### 3. Master Prompt Download — No changes needed
The "Download Master Prompt" button in the chat settings already exports `systemInstruction` verbatim from `buildSystemPrompt()`, so it will automatically include the updated rules.

## Files Modified
- `src/services/llm.ts` — expanded FORWARD MOMENTUM + dialogue acceptance rules
- `public/api-call-inspector-chronicle.html` — matching inspector documentation update

