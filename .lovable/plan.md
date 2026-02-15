

# Internal Thought Quality Improvement

## Problem

The current prompt tells Grok *how to format* internal thoughts (parentheses) and *when to include them* (naturally, frequently during NSFW) but never defines *what they should contain* or *what narrative purpose they serve*. This produces flat, dead-end statements that don't move the story forward or reveal character depth.

**Pattern of current output:**
- "He has no idea what's coming." (Vague -- what IS coming?)
- "He's already learning. Soon he'll crave this as much as I do." (What specifically will he crave? What's the plan?)
- "Every hesitation just makes him more mine." (Dead-end observation -- how? What's the next step?)

These are all **conclusions without premises** -- they state a verdict but reveal nothing about the reasoning, strategy, or upcoming actions behind it.

## Solution

Add a dedicated **INTERNAL THOUGHT QUALITY** block to the prompt in `src/services/llm.ts`. This block will be inserted into the `narrativeBehaviorRules` section (alongside the existing Dialogue Requirements block at ~line 330), since it governs narrative output quality for all scenes.

## Proposed Prompt Block

```text
- INTERNAL THOUGHT QUALITY (MANDATORY):
    * Internal thoughts in parentheses are NOT filler -- they are a narrative 
      tool for revealing what characters WON'T say aloud.
    * Every internal thought MUST serve at least one of these purposes:
      1. STRATEGY: Reveal a plan, next step, or manipulation tactic
         - WRONG: (He has no idea what's coming.)
         - RIGHT: (Once the serum hits stage two, he won't even remember 
           what he looked like before. And by then, he'll be begging 
           for stage three.)
      2. DESIRE: Expose what the character truly wants, with specificity
         - WRONG: (He'll crave this as much as I do.)
         - RIGHT: (He'll be the one initiating next time -- crawling 
           into my lap, desperate for another dose.)
      3. ASSESSMENT: Evaluate the situation with actionable insight
         - WRONG: (Every hesitation just makes him more mine.)
         - RIGHT: (His resistance is crumbling faster than expected. 
           Two more pushes and he'll stop questioning entirely -- 
           then I can move to phase two.)
      4. FORESHADOWING: Hint at upcoming events or consequences
         - WRONG: (He's so confused. Perfect.)
         - RIGHT: (That confusion is exactly what I need. By tomorrow 
           he'll rationalize everything I've done as normal, and 
           then I can introduce the real changes.)
    * FORBIDDEN in internal thoughts:
      - Vague statements with no follow-through ("He has no idea..." 
        followed by nothing specific)
      - Repeating what was just shown in action or dialogue
      - Generic observations that any character could think
    * Internal thoughts should feel like reading a character's private 
      journal -- specific, strategic, and revealing something the 
      reader couldn't get from dialogue alone.
    * Keep thoughts concise but substantive: 1-3 sentences that carry 
      real narrative weight.
```

## Where It Goes

This block is inserted into the `narrativeBehaviorRules` variable in `src/services/llm.ts`, right after the DIALOGUE REQUIREMENTS block (~line 338). This is the natural home because:
- It governs narrative output quality (same category as dialogue rules)
- It applies to all scenes, not just NSFW
- It sits within the proactive narrative section, reinforcing that thoughts should drive the story forward

## Interaction with Existing Rules

- **NSFW line 434** ("Sexual thoughts should be frequent and explicit"): Still applies, but now those thoughts must also meet the quality bar -- not just "she's so hot" but revealing desire with specificity and intent.
- **Anti-Echo Rule** (line 294-298): Still applies -- thoughts can't mirror user's exact words.
- **Priority Hierarchy**: Internal thought quality sits below Control/Scene Presence/Line of Sight but is a general narrative quality rule that always applies.

## Technical Details

- **File**: `src/services/llm.ts`
- **Location**: Inside the `narrativeBehaviorRules` template string, after the DIALOGUE REQUIREMENTS block (~line 338)
- **Size**: ~25 lines of prompt text
- **No other files affected**: This is a prompt-only change, no UI or backend modifications needed.

