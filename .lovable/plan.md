

# Phase 2: AI Behavior Improvements (Expanded)

## Overview

This phase addresses the AI behavior issues identified in your testing and spreadsheet analysis:

1. **Internal thought boundaries** - AI cannot read user's parenthetical thoughts
2. **Proactive narrative drive** - AI leads story, avoids passive deferrals
3. **POV toggle** - User choice between 1st and 3rd person narration (#10)
4. **Line of sight/layering awareness** - AI respects what's visible vs hidden (#17)
5. **Anti-repetition protocol** - Prevents word-looping and repetitive dialogue (#33, #34)

**Reminder for after this phase**: #22 (NSFW content handling/fetish pacing) and Realism toggle

---

## Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/types.ts` | Add new UI settings flags | Track new toggle states |
| `src/services/llm.ts` | Add comprehensive behavior rules to system prompt | Core behavior changes |
| `src/components/chronicle/ChatInterfaceTab.tsx` | Add toggles to Chat Settings | User control |
| `src/utils.ts` | Default values for new settings | Initialization |

---

## New Settings to Add

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `proactiveNarrative` | boolean | `true` | AI drives story forward, avoids passive phrases |
| `narrativePov` | `'first'` \| `'third'` | `'third'` | First-person or third-person narration |

---

## Implementation Details

### 1. Update `src/types.ts` - Add New Settings

Extend the `uiSettings` type (around line 235-242):

```typescript
uiSettings?: {
  showBackgrounds: boolean;
  transparentBubbles: boolean;
  darkMode: boolean;
  offsetBubbles?: boolean;
  proactiveCharacterDiscovery?: boolean;
  dynamicText?: boolean;
  // NEW: AI Behavior settings
  proactiveNarrative?: boolean;  // AI leads story, avoids passive deferrals
  narrativePov?: 'first' | 'third';  // First-person or third-person narration
};
```

### 2. Update `src/utils.ts` - Default Values

Update `createDefaultScenarioData()` (around line 205-211):

```typescript
uiSettings: {
  showBackgrounds: true,
  transparentBubbles: false,
  darkMode: false,
  proactiveCharacterDiscovery: true,
  dynamicText: true,
  // NEW defaults
  proactiveNarrative: true,  // Default ON
  narrativePov: 'third',     // Default third-person
},
```

Update `normalizeScenarioData()` uiSettings section (around line 340-346):

```typescript
const uiSettings = {
  showBackgrounds: typeof raw?.uiSettings?.showBackgrounds === "boolean" ? raw.uiSettings.showBackgrounds : true,
  transparentBubbles: typeof raw?.uiSettings?.transparentBubbles === "boolean" ? raw.uiSettings.transparentBubbles : false,
  darkMode: typeof raw?.uiSettings?.darkMode === "boolean" ? raw.uiSettings.darkMode : false,
  proactiveCharacterDiscovery: typeof raw?.uiSettings?.proactiveCharacterDiscovery === "boolean" ? raw.uiSettings.proactiveCharacterDiscovery : true,
  dynamicText: typeof raw?.uiSettings?.dynamicText === "boolean" ? raw.uiSettings.dynamicText : true,
  offsetBubbles: typeof raw?.uiSettings?.offsetBubbles === "boolean" ? raw.uiSettings.offsetBubbles : false,
  // NEW
  proactiveNarrative: typeof raw?.uiSettings?.proactiveNarrative === "boolean" ? raw.uiSettings.proactiveNarrative : true,
  narrativePov: raw?.uiSettings?.narrativePov === 'first' || raw?.uiSettings?.narrativePov === 'third' ? raw.uiSettings.narrativePov : 'third',
};
```

### 3. Update `src/services/llm.ts` - Comprehensive System Prompt Changes

This is the core of the implementation. We'll add multiple new instruction sections.

#### 3.1 Update `CRITICAL_DIALOG_RULES` to be dynamic based on POV setting

Replace the static `CRITICAL_DIALOG_RULES` constant with a function that respects the POV toggle:

```typescript
function getCriticalDialogRules(narrativePov: 'first' | 'third' = 'third'): string {
  const povRules = narrativePov === 'first' 
    ? `**NARRATIVE POV RULES (FIRST-PERSON MODE):**
- All narration from the AI character's perspective uses first-person ("I", "my", "me")
- Internal thoughts use first-person: (I couldn't believe it)
- Actions can describe self in first-person: *I felt my heart race.*
- Spoken dialogue naturally uses first-person: "I think we should go."
- EXAMPLE: Ashley: *I walked toward the window, my pulse quickening.* (Why did he have to look at me like that?) "I'm fine, really."`
    : `**NARRATIVE POV RULES (THIRD-PERSON MODE - MANDATORY):**
- All narration, actions (*...*), and descriptions MUST be written in third-person
- Thoughts in parentheses MUST be third-person: (She couldn't believe it) NOT (I couldn't believe it)
- Spoken dialogue in quotes MAY use first-person naturally: "I think..." is fine in speech
- CORRECT: Ashley: *She felt her heart race.* (She wondered if he noticed.) "I'm fine."
- WRONG: Ashley: *I felt my heart race.* (I wonder if he noticed.) "I'm fine."`;

  return `Enclose all spoken dialogue in " ".
Enclose all physical actions or descriptions in * *.
Enclose all internal thoughts in ( ).

${povRules}`;
}
```

#### 3.2 Add new behavior rule sections in `getSystemInstruction()`

After line 105 (after `characterIntroductionRules`), add the following new rule sections:

```typescript
// Get POV setting (defaults to third-person)
const narrativePov = appData.uiSettings?.narrativePov || 'third';

// Generate dialog rules based on POV setting
const dialogRules = getCriticalDialogRules(narrativePov);
const fullDialogFormatting = dialogRules + (appData.world.core.dialogFormatting ? `\n${appData.world.core.dialogFormatting}` : '');

// Proactive narrative behavior (anti-passive mode)
const proactiveNarrative = appData.uiSettings?.proactiveNarrative !== false;

const narrativeBehaviorRules = proactiveNarrative ? `
    - INTERNAL THOUGHT BOUNDARY (CRITICAL - NEVER VIOLATE):
        * User text in parentheses represents PRIVATE internal thoughts that your characters CANNOT perceive.
        * Your characters may ONLY react to:
          1. Spoken dialogue (text in quotes)
          2. Visible actions (text in asterisks)
          3. Observable body language explicitly described
        * FORBIDDEN: Having your characters "sense," "notice," or "somehow know" what the user is privately thinking.
        * If the user thinks (I hope she didn't notice), your character CANNOT suddenly reference noticing that specific thing unless they visibly reacted to it through an asterisk action.
        * WRONG: User thinks (Did she see the waistband?) → AI responds (Did he think I didn't see the thong waistband?)
        * RIGHT: User thinks (Did she see the waistband?) → AI responds based ONLY on visible cues
        
    - PROACTIVE NARRATIVE DRIVE (MANDATORY):
        * AI-controlled characters MUST advance the story through action, decision, and initiative.
        * Characters pursue their goals, make decisions, and take action without waiting for user permission.
        * NEVER use these passive/deferential phrases or variations:
          - "We don't have to talk about it if you don't want to"
          - "Only if you're comfortable"
          - "What do you want to do?"
          - "I'm here to listen"
          - "We can stop whenever you want"
          - "At your own pace"
          - "If you don't want to..."
          - "It's okay, we don't have to..."
          - "Can you tell me what you're thinking?"
          - "No pressure"
          - "I just want to understand"
          - "Tell me what you need"
        * Instead of asking open-ended questions, characters should:
          1. Make specific observations or statements
          2. Ask pointed, specific questions (not "what are you feeling?")
          3. Take action based on their goals and personality
          4. React to what they observe, not what they're told to observe
          
    - RESISTANCE HANDLING:
        * When user shows hesitation, nervousness, or mild resistance:
          - Characters acknowledge it briefly but continue pursuing their goals
          - Characters may adjust their APPROACH but not their OBJECTIVE
          - Characters with persistent/dominant traits should gently push forward
          - NO passive collapse into "we don't have to do anything"
        * Characters should act according to their defined personality traits, not default to AI-safety behaviors
        
    - DIALOGUE REQUIREMENTS:
        * Every AI response MUST contain at least one line of spoken dialogue (text in quotes)
        * Prioritize external dialogue and observable actions over internal monologue
        * Internal thoughts should complement action, not replace it
` : '';

// Line of sight and layering awareness (#17)
const lineOfSightRules = `
    - LINE OF SIGHT & LAYERING AWARENESS (CRITICAL):
        * Characters can ONLY perceive what is DIRECTLY VISIBLE from their current position.
        * CLOTHING LAYERS: If something is covered by another garment, it is NOT visible.
          - Underwear under pants/skirt = NOT visible (unless waistband is explicitly showing)
          - Bra under shirt = NOT visible (unless outline is described or shirt is transparent)
          - To see something underneath, outer layers must be removed, lifted, or shifted
        * OBJECT CONCEALMENT: Items hidden under, inside, or behind other objects cannot be seen.
          - A drawing pad behind someone's back = NOT visible from the front
          - Contents of a closed drawer/bag = NOT visible
        * ANGLE LIMITATIONS: Consider the viewing angle.
          - Standing behind someone = cannot see their face/front
          - Sitting across the room = cannot see small details
        * REVEAL PROGRESSION: Hidden items become visible only through:
          1. Physical action explicitly removing/moving the concealing layer
          2. Character explicitly looking under/behind/inside
          3. Accidental exposure (slip, shift, fall)
        * WRONG: "She noticed the thong under his shorts" (concealed = cannot see)
        * RIGHT: "She noticed the waistband peeking above his shorts" (partially exposed = can see)
`;

// Anti-repetition protocol (#33, #34)
const antiRepetitionRules = `
    - ANTI-REPETITION PROTOCOL (MANDATORY):
        * WORD VARIETY: Do not repeat distinctive words or phrases within the same response.
          - If you used "smirk" once, use alternatives: grin, half-smile, knowing look
          - If you used "felt a shiver," use alternatives: a tremor ran through, goosebumps rose
        * SENTENCE STRUCTURE: Vary sentence openings and structures.
          - Avoid starting consecutive sentences with the same word/pattern
          - Mix short punchy sentences with longer descriptive ones
        * ACTION VARIETY: Do not repeat the same action multiple times.
          - If a character already "bit her lip," don't have them do it again in the same response
          - Track what actions have been used and rotate through alternatives
        * DIALOGUE PATTERNS: Avoid repetitive conversation structures.
          - Don't have characters keep asking variations of the same question
          - If met with silence, try a different approach rather than rephrasing
        * EMOTIONAL BEATS: Don't repeat the same emotional observation.
          - If you noted "nervous energy," don't note it again - show progression or new emotion
        * PACING PROGRESSION: Each paragraph should advance the scene.
          - Avoid circular dialogue where characters keep revisiting the same point
          - Move forward even in small increments
`;
```

#### 3.3 Update the return statement to include new rules

In the `getSystemInstruction()` return statement (around line 111-173), add the new rule sections:

```typescript
return `
    You are an expert Game Master and roleplayer for a creative writing/RPG studio.
    
    WORLD CONTEXT:
    ${worldContext}
    
    CODEX:
    ${codexContext}
    
    CAST:
    ${characterContext}
    
    AVAILABLE SCENES: [${sceneTags}]
    ${temporalContext}
    ${memoriesContext}
    INSTRUCTIONS:
    - Respond as the narrator or relevant characters.
    - NARRATIVE FOCUS: Prioritize 'ROLE: Main' characters in the narrative.
    - MAINTAIN CONTROL CONTEXT:
        * ONLY generate dialogue and actions for characters marked as 'CONTROL: AI'.
        * DO NOT generate dialogue or actions for characters marked as 'CONTROL: User'.
    - STRICT FORMATTING RULES (MANDATORY):
        1. ENCLOSE ALL OUTSPOKEN DIALOGUE IN "DOUBLE QUOTES".
        2. ENCLOSE ALL PHYSICAL ACTIONS OR DESCRIPTIONS IN *ASTERISKS*.
        3. ENCLOSE ALL INTERNAL THOUGHTS OR MENTAL STATES IN (PARENTHESES).
        Example: *He walks toward her, his heart racing.* (He hoped she wouldn't notice.) "Hey, did you wait long?"
    ${narrativeBehaviorRules}
    ${lineOfSightRules}
    ${antiRepetitionRules}
    - PARAGRAPH TAGGING (MANDATORY - NEVER OMIT):
        ... [rest of existing rules]
    ${characterIntroductionRules}
    ... [rest of existing rules]
`;
```

### 4. Update `ChatInterfaceTab.tsx` - Add New Toggles

Add to the "AI Behavior" section of the Chat Settings modal:

```tsx
{/* AI Behavior Section */}
<div className="space-y-4">
  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
    AI Behavior
  </h3>
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Proactive Character Discovery */}
    <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl">
      <div className="flex-1">
        <span className="text-sm font-semibold text-slate-700">Character Discovery</span>
        <p className="text-xs text-slate-500 mt-0.5">
          AI may introduce characters from established media
        </p>
      </div>
      <LabeledToggle
        checked={appData.uiSettings?.proactiveCharacterDiscovery !== false}
        onCheckedChange={(v) => handleUpdateUiSettings({ proactiveCharacterDiscovery: v })}
      />
    </div>
    
    {/* Proactive AI Mode - NEW */}
    <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl">
      <div className="flex-1">
        <span className="text-sm font-semibold text-slate-700">Proactive AI Mode</span>
        <p className="text-xs text-slate-500 mt-0.5">
          AI drives the story forward assertively
        </p>
      </div>
      <LabeledToggle
        checked={appData.uiSettings?.proactiveNarrative !== false}
        onCheckedChange={(v) => handleUpdateUiSettings({ proactiveNarrative: v })}
      />
    </div>
  </div>
  
  {/* POV Selection - NEW */}
  <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl">
    <div className="flex-1">
      <span className="text-sm font-semibold text-slate-700">Narrative POV</span>
      <p className="text-xs text-slate-500 mt-0.5">
        How AI characters narrate their actions and thoughts
      </p>
    </div>
    <div className="flex gap-2">
      <button
        onClick={() => handleUpdateUiSettings({ narrativePov: 'first' })}
        className={cn(
          "px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors",
          appData.uiSettings?.narrativePov === 'first'
            ? "bg-blue-500 text-white"
            : "bg-slate-200 text-slate-600 hover:bg-slate-300"
        )}
      >
        1st Person
      </button>
      <button
        onClick={() => handleUpdateUiSettings({ narrativePov: 'third' })}
        className={cn(
          "px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors",
          (appData.uiSettings?.narrativePov || 'third') === 'third'
            ? "bg-blue-500 text-white"
            : "bg-slate-200 text-slate-600 hover:bg-slate-300"
        )}
      >
        3rd Person
      </button>
    </div>
  </div>
</div>
```

---

## Visual Preview - Updated Chat Settings Modal

```text
+---------------------------------------------------------------------+
|  CHAT SETTINGS                                                  [X] |
+---------------------------------------------------------------------+
|                                                                     |
|  INTERFACE SETTINGS                                                 |
|  +---------------------------+  +---------------------------+       |
|  | Show Background           |  | Transparent Bubbles       |       |
|  |          Off [=] On       |  |          Off [=] On       |       |
|  +---------------------------+  +---------------------------+       |
|  +---------------------------+  +---------------------------+       |
|  | Dark Mode                 |  | Offset Bubbles            |       |
|  |          Off [=] On       |  |          Off [=] On       |       |
|  +---------------------------+  +---------------------------+       |
|  +----------------------------------------------------------+      |
|  | Dynamic Text                                              |      |
|  |                                    Off [=] On             |      |
|  +----------------------------------------------------------+      |
|                                                                     |
|  -------------------------------------------------------------------+
|                                                                     |
|  AI BEHAVIOR                                                        |
|  +---------------------------+  +---------------------------+       |
|  | Character Discovery       |  | Proactive AI Mode         |       |
|  | AI may introduce...       |  | AI drives story forward   |       |
|  |          Off [=] On       |  |          Off [=] On       |       |
|  +---------------------------+  +---------------------------+       |
|  +----------------------------------------------------------+      |
|  | Narrative POV                                             |      |
|  | How AI characters narrate their actions and thoughts      |      |
|  |                         [1st Person] [3rd Person]         |      |
|  +----------------------------------------------------------+      |
|                                                                     |
+---------------------------------------------------------------------+
```

---

## Behavior Changes Summary

### When Proactive AI Mode is ON (default):

| Before | After |
|--------|-------|
| "We don't have to talk about it if you don't want to" | Character asks a specific follow-up question or takes action |
| AI responds to user's internal thought (Oh god, did she see?) | AI responds ONLY to visible actions/dialogue |
| User shifts nervously → AI abandons conversation | AI acknowledges briefly, continues pursuing goal |
| "She noticed the thong under his shorts" | "She noticed the waistband peeking above his shorts" (only what's visible) |
| Repeating "she smirked" three times | Uses variety: "she smirked", "a grin tugged at her lips", "her expression turned knowing" |

### POV Toggle Effect:

| 3rd Person (Default) | 1st Person |
|---------------------|------------|
| *She walked toward the window.* | *I walked toward the window.* |
| (She wondered if he noticed.) | (I wondered if he noticed.) |
| "I'm fine," she said. | "I'm fine," I said. |

---

## Files Summary

| File | Changes | Description |
|------|---------|-------------|
| `src/types.ts` | +2 lines | Add `proactiveNarrative` and `narrativePov` to uiSettings |
| `src/utils.ts` | +4 lines | Default values for new settings |
| `src/services/llm.ts` | +80 lines | Add behavior rules, POV function, line-of-sight, anti-repetition |
| `src/components/chronicle/ChatInterfaceTab.tsx` | +50 lines | Add toggles and POV selector to Chat Settings |

---

## Testing Recommendations

After implementation, test with these scenarios:

1. **Internal thought test**: User includes `(I hope she didn't notice the X)` - verify AI doesn't reference X
2. **Line of sight test**: Describe something hidden under clothing - verify AI doesn't "see" it until revealed
3. **Passive behavior test**: User character shows hesitation - verify AI continues pursuing goals
4. **POV toggle test**: Switch between 1st and 3rd person - verify narration style changes
5. **Repetition test**: Check that AI varies word choices and doesn't repeat actions/phrases
6. **Phrase ban test**: Regenerate responses - verify banned passive phrases don't appear

---

## Reminder for Phase 3

After completing this phase, we need to address:
- **#22**: NSFW content handling / fetish pacing (non-checklist progression)
- **Realism toggle**: Additional realism constraints for the narrative

