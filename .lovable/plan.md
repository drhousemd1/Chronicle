

# Fix Tone Section AI Enhancement

## Problem
When the AI Enhance button is clicked on a tone field, it falls through to the generic `custom` prompt: *"Provide relevant details for this character trait."* This produces irrelevant text because the AI doesn't know the field is about **how the character speaks**. There are three user scenarios that need distinct handling:

1. **Label filled, description empty** (e.g. "Nurturing: ___") — generate a description of that specific tone trait, informed by all character/world context
2. **Both empty** — generate both a fitting label AND description from scratch based on character context
3. **Description filled** — enhance the existing description while keeping it about tone

## Current Flow
- All character/world context is already sent (personality, background, story premise, etc.) — that part works fine
- The problem is purely in the **instruction text** — the AI doesn't know to focus on speech/voice
- Tone fields use fieldName `custom` and customLabel `"character tone/voice detail"`, so they hit the generic fallback

## Changes — Single file: `src/services/character-ai.ts`

### 1. Add `tone` entry to `CHARACTER_FIELD_PROMPTS`

After the background fields (line ~246), before `custom`:

```typescript
// Tone / Voice
tone: {
  label: "Tone",
  instruction: "Describe how this character speaks and expresses themselves. Focus on vocal qualities, speech rhythm, vocabulary level, verbal tics or habits, formality, and emotional register. This must naturally reflect the character's personality, background, and world context — not a random or generic speech style. If a specific tone label is provided (e.g. 'Nurturing', 'Sarcastic'), describe how THAT tone manifests in this character's speech specifically, drawing on who they are.",
  maxSentences: 3
},
```

### 2. Add section-aware hints in the generate-both branch

In `buildCharacterFieldPrompt`, update the generate-both prompt (lines 272-294) to inject a section-specific hint when the `sectionHint` is `"character tone/voice detail"`. This replaces the generic guidance with tone-specific instructions:

- The LABEL should be a tone/voice category (e.g. "Warm Drawl", "Clipped Authority", "Nervous Rambling")
- The DESCRIPTION should explain how this character specifically exhibits that tone, based on their personality, background, and context
- It must NOT duplicate tone traits the character already has

### 3. Wire tone fields to use the `tone` config instead of `custom`

In `CharactersTab.tsx`, update the `buildExtraEnhanceArgs` call for tone extras (line ~1774) to pass `'tone'` as the fieldName instead of `'custom'`, so it hits the new dedicated prompt config. When label exists, it goes through the standard enhance path with tone-specific instructions. When label is empty, it goes through generate-both with the section hint.

## Result
- **"Nurturing" + empty description** → AI describes how THIS character's nurturing tone sounds in speech, based on their background/personality
- **Both empty** → AI generates a fitting tone label + description that matches the character
- **Existing description** → AI enhances while keeping it about vocal/speech style

