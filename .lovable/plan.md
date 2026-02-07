
# Revamped Character Tracking: Goals-First Architecture, Rich Descriptions, and Fixed Regeneration

## Summary

Three interconnected fixes based on your analysis:

1. **Merge desires/preferences into the Goals system** -- no separate "Kinks" or "Desires" sections. Goals already have the right structure (title, desired outcome, current status, progress). A desire IS a goal.
2. **Fix the extraction prompt to demand depth** -- 2-3 sentence minimum for goal descriptions instead of lazy one-liners.
3. **Fix regeneration** to produce "different takes" instead of complete 180s, and prevent absent characters from appearing.

Plus a critical bug fix: the frontend parser doesn't actually extract `desired_outcome` from the AI's response, so that field has been silently dropped every time.

---

## Changes

### File 1: `supabase/functions/extract-character-updates/index.ts`

Complete overhaul of the system prompt. The new prompt gives the AI a defined **role** ("Character Evolution Analyst"), a **mandatory two-phase process**, and explicit instructions for depth.

**Key changes to the prompt:**

**A) Two-Phase Mandatory Process:**

```text
PHASE 1 - SCAN: Read the dialogue and identify any new information.

PHASE 2 - REVIEW EXISTING STATE (MANDATORY):
For EACH character, review their current goals and sections:
- Has any goal progressed, even slightly? Update current_status.
- Has a new desire, ambition, or preference emerged? Create a goal.
- Has the character repeatedly engaged in or expressed enthusiasm
  for something? Create or update a goal for it.
- Is any existing section value now outdated or contradicted?
  Update it.
- DO NOT skip this phase. DO NOT return empty if the character
  is actively present in the scene.
```

This addresses the "lazy scan" problem. The AI can't just glance at existing data and say "looks fine" -- it has to actively review each item.

**B) Desires and Preferences as Goals:**

The prompt explicitly tells the AI that desires, preferences, fantasies, and evolving interests belong in the goals system, not in custom sections:

```text
DESIRES & PREFERENCES AS GOALS:
- Any desire, preference, kink, or evolving interest a character 
  develops MUST be tracked as a goal
- These are NOT custom section items -- they have progression
- Example: If a character shows growing interest in an activity,
  create a goal tracking that desire's evolution

NEVER create custom sections for: Desires, Kinks, Preferences,
Fantasies, Interests, or Wants. These are ALL goals.
```

**C) Mandatory Description Depth:**

The prompt mandates multi-sentence descriptions instead of one-liners:

```text
DESCRIPTION DEPTH REQUIREMENTS:
- desired_outcome: 2-3 sentences minimum describing the emotional
  and behavioral state that represents fulfillment. What does
  success look like? How does the character feel? What has changed
  in their life or relationship?
- current_status: 2-3 sentences minimum describing where the
  character currently stands. What have they done so far? What's
  their emotional state about it? What's the next step?
- Do NOT write one-liners. "Wants to try X" is NOT acceptable.
```

**D) Continuous Goal Refinement:**

Instead of "track new goals when expressed," the new instructions say:

```text
GOAL LIFECYCLE (MANDATORY REVIEW):
- EVERY existing goal must be reviewed against the dialogue
- Even subtle cues warrant a status update (new sentence added
  to current_status describing latest development)
- Behavioral patterns imply progress: if a character repeatedly
  does something, the related goal's progress should increment
- A goal with no updates for multiple exchanges should still be
  acknowledged if the character is present
- Add milestone-style entries to current_status: append new
  developments rather than replacing the entire status
```

**E) Expanded context window:**

Change from sending only the last user message + AI response to also sending the previous 4 messages (6 total). This gives the AI enough context to detect patterns like "she's been enthusiastic about X for 3 turns."

The edge function already accepts `userMessage` and `aiResponse` -- we'll add an optional `recentContext` field that contains the additional history.

---

### File 2: `src/components/chronicle/ChatInterfaceTab.tsx`

Three changes:

**A) Send last 6 messages as context to extraction:**

Currently the extraction call sends only the single `userMessage` and `aiResponse`. Change it to also send the last 6 messages as `recentContext`:

```typescript
// Build recent context (last 6 messages for pattern detection)
const recentMessages = conversation.messages.slice(-6);
const recentContext = recentMessages
  .map(m => `${m.role === 'user' ? 'USER' : 'AI'}: ${m.text}`)
  .join('\n\n');

const { data, error } = await supabase.functions.invoke(
  'extract-character-updates', {
    body: {
      userMessage,
      aiResponse,
      recentContext,  // NEW
      characters: allCharacters,
      modelId
    }
  }
);
```

**B) Fix `desiredOutcome` parsing:**

The current parser only extracts `progress` and treats everything else as `currentStatus`. It never parses `desired_outcome`. Fix:

```typescript
// Parse "desired_outcome: X | current_status: Y | progress: Z"
let desiredOutcome = '';
let currentStatus = value;
let progress = 0;

const desiredMatch = value.match(
  /desired_outcome:\s*(.*?)\s*\|\s*current_status:/i
);
if (desiredMatch) {
  desiredOutcome = desiredMatch[1].trim();
}

const statusMatch = value.match(
  /current_status:\s*(.*?)\s*\|\s*progress:/i
);
if (statusMatch) {
  currentStatus = statusMatch[1].trim();
}

const progressMatch = value.match(/progress:\s*(\d+)/i);
if (progressMatch) {
  progress = Math.min(100, Math.max(0, parseInt(progressMatch[1])));
}
```

And when creating new goals, use `desiredOutcome` instead of `''`:
```typescript
updatedGoals.push({
  id: `goal_${uuid().slice(0, 12)}`,
  title: goalTitle,
  desiredOutcome,  // Was hardcoded to ''
  currentStatus,
  progress,
  ...
});
```

When updating existing goals, also update `desiredOutcome` if the AI provided one:
```typescript
updatedGoals[existingGoalIndex] = {
  ...updatedGoals[existingGoalIndex],
  currentStatus,
  progress,
  ...(desiredOutcome ? { desiredOutcome } : {}),
  updatedAt: Date.now()
};
```

**C) Strip old response from regeneration context:**

Before calling `generateRoleplayResponseStream` with `isRegeneration=true`, create a truncated copy of `appData` that removes the message being regenerated. This prevents the AI from seeing the rejected response and swinging to its opposite:

```typescript
// Remove the old AI response so the AI generates fresh
const truncatedConvs = appData.conversations.map(c =>
  c.id === conversationId
    ? { ...c, messages: c.messages.slice(0, msgIndex) }
    : c
);
const truncatedAppData = { ...appData, conversations: truncatedConvs };

const stream = generateRoleplayResponseStream(
  truncatedAppData, conversationId, userMessage.text,
  modelId, currentDay, currentTimeOfDay,
  memories, memoriesEnabled, true
);
```

---

### File 3: `src/services/llm.ts`

Replace the aggressive regeneration directive (lines 416-429):

**Before:**
```text
Take a COMPLETELY DIFFERENT narrative direction
Fundamentally different approach
The user wants something DIFFERENT
```

**After:**
```text
REGENERATION DIRECTIVE:
The user wants a DIFFERENT VERSION of this response.
1. Maintain the same general scene context and emotional tone
2. Vary the specific dialogue, word choices, actions, and pacing
3. Try a different focus (e.g., more internal thought, or more
   physical description, or different dialogue approach)
4. Keep ONLY the characters who are present in the current scene
   -- do NOT introduce characters who are elsewhere
5. Do NOT reverse the character's emotional state or stance --
   if they were enthusiastic, they should still be enthusiastic
   but expressed differently
6. Think of this as a "different take" by a different director
   on the same scene, not a plot reversal
```

---

## What This Solves

| Problem | Root Cause | Fix |
|---------|-----------|-----|
| Personality/desires never update | No trackable fields for desires; prompt doesn't mandate review of existing state | Desires become goals; mandatory two-phase review process |
| Goals only get one update then stop | Prompt says "track new goals" but doesn't say "continuously refine existing ones" | Mandatory goal lifecycle review on every extraction |
| One-liner descriptions | Prompt says "keep values concise" | Explicit 2-3 sentence minimum requirement |
| `desiredOutcome` always empty | Parser only extracts `progress`, ignores `desired_outcome` field | Full three-field parser |
| Refresh does a 180 | Directive says "COMPLETELY DIFFERENT"; old response stays in context | Nuanced "different take" directive; strip old response from context |
| Absent characters appear on refresh | No scene-awareness instruction | Explicit rule: only include present characters |

---

## Files Modified

| File | Type of Change |
|------|---------------|
| `supabase/functions/extract-character-updates/index.ts` | Prompt overhaul (role, two-phase process, depth requirements, desire-as-goal rules) |
| `src/components/chronicle/ChatInterfaceTab.tsx` | Fix `desiredOutcome` parsing; send 6-message context; strip old response on regeneration |
| `src/services/llm.ts` | Replace aggressive regeneration directive with nuanced "different take" version |
