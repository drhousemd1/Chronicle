

# Add Internal Thought Violation Check

## Problem

The INTERNAL THOUGHT QUALITY block defines what good thoughts look like, but it lacks the enforcement mechanism that makes the Control and Line of Sight rules actually work: a **VIOLATION CHECK** step that instructs the model to re-read its own output and actively rewrite any thoughts that fail.

The existing pattern that works:
- Control rules: "re-read it and DELETE any paragraphs where a User-controlled character speaks"
- Line of Sight: "re-read it and DELETE any references where a character names specific hidden attributes"

Both tell the model to (1) re-read, (2) identify violations, and (3) take a specific corrective action (delete/rewrite). The internal thought block currently only says "don't do this" but never says "check your work and fix it."

## Solution

Append a VIOLATION CHECK to the end of the INTERNAL THOUGHT QUALITY block (after line 372, before the closing backtick on line 373). This check will:

1. Tell the model to re-read all parenthetical thoughts in its response
2. Test each one against the four purposes (strategy, desire, assessment, foreshadowing)
3. If a thought fails: **rewrite it** with specific, actionable content -- not just delete it

The "rewrite" instruction is critical. For Control and Line of Sight, deletion is the right fix (remove the violation). For thoughts, deletion would just remove characterization. The fix is to make the thought substantive, not remove it.

## Proposed Addition

Appended after "Keep thoughts concise but substantive: 1-3 sentences that carry real narrative weight." (line 371-372):

```text
        * VIOLATION CHECK: Before finalizing your response, re-read every 
          internal thought (parenthetical). For each one, ask: "Does this 
          reveal a specific plan, desire, assessment, or foreshadow something 
          concrete?" If the answer is no -- if the thought is a vague 
          dead-end statement like "He has no idea" or "Perfect" with no 
          follow-through -- REWRITE it with specific, actionable content 
          that reveals what the character is actually planning, wanting, 
          or anticipating. Do NOT leave vague thoughts in place. Do NOT 
          simply delete them. Replace them with substance.
```

## Technical Details

- **File**: `src/services/llm.ts`
- **Location**: Lines 371-372, appending before the closing backtick on line 373
- **Size**: ~9 lines of prompt text added
- **No other files affected**

