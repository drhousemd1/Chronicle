

# Admin Tool: Download Master Prompt (Current Snapshot)

## What this does

Adds a second button to the Admin section: **"Download Master Prompt"**. One click generates a Markdown file containing the **exact** system instruction text that would be sent to Grok right now — assembled from the current scenario's characters, world, goals, arcs, memories, content themes, and all behavioral rules.

This is a single snapshot, not repeated per message. The Session Log export already captures the conversation flow. Together they give you everything needed for external debugging:
- **Session Log** = "Here's what happened in the conversation"
- **Master Prompt** = "Here's what the AI was told to do"

## What's in the export

1. **Header** — model ID, verbosity setting, max_tokens, temperature
2. **Full System Instruction** — the exact output of `getSystemInstruction()` called with current scenario data, day, time, memories, and memory-enabled flag. Verbatim, unedited.
3. **Runtime Parameters** — the small per-turn pieces:
   - Current anti-loop directive (if any would fire based on last AI message)
   - Current narrative directive (if one is stored)
   - Sample style hint (marked as "one of N random options")
   - Regeneration directive template (the fixed text block)
   - Verbosity-to-max_tokens mapping
   - Session message count format

This uses the **same** `getSystemInstruction` function and `buildLLMAppData` data — not a recreation or paraphrase.

## Files changed

- **`src/services/llm.ts`** — Add `export` to `getSystemInstruction` and `getRandomStyleHint` (2-word change each, makes them importable)
- **`src/components/chronicle/ChatInterfaceTab.tsx`** — Add "Download Master Prompt" button in Admin section, with `generateMasterPromptSnapshot()` function

## Output format

```text
# Master Prompt Snapshot
**Model:** grok-4-1-fast-reasoning
**Verbosity:** balanced → max_tokens: 2048
**Temperature:** 0.9 (hardcoded in edge function)
**Exported:** 2026-03-20 14:30

---

## System Instruction (verbatim)

[exact multi-hundred-line system instruction text]

---

## Runtime Parameters

### Anti-Loop Directive (current)
[output of getAntiLoopDirective based on last AI message, or "None — no patterns detected"]

### Narrative Director Tag (current)
[contents of narrativeDirectiveRef, or "None stored"]

### Style Hint Pool (balanced mode)
- [Style: one character drives this beat — others react briefly in narration]
- [Style: try a different paragraph structure than your last response]
- ... (all 8 options listed)

### Regeneration Directive (fixed template)
[the exact regeneration directive text]

### Session Message Format
[SESSION: Message {N} of current session]
```

