

# Break Out AI Enhance Inspector Into Per-Section Blocks With Exact Prompts

## Problem
The API Inspector currently lumps all character field AI enhance prompts into a single container with paraphrased summaries (e.g., `hairColor — "Describe hair color, style, and length" (max 2 sentences)`). These are not the actual API calls. Each field category is a distinct API call with distinct prompt text, and they need to be broken into their own sections showing the **exact** prompt sent — not summaries.

## What Gets Sent (3 Prompt Templates)

Every AI enhance call sends one of these three exact prompt templates to Grok via the `chat` edge function. The only variables are the field-specific instruction text, context data, and max sentence count.

1. **Detailed Mode** — full narrative enhancement
2. **Precise Mode** — semicolon-separated tags
3. **Generate-Both Mode** — when label is empty, generates LABEL + DESCRIPTION

## Plan

### 1. Sidebar: Expand "Character Builder — AI Enhance" into sub-items

Replace the single `star-char` sidebar entry with a collapsible group containing individual entries for each section:

- Physical Appearance (11 fields)
- Currently Wearing (4 + extras)
- Preferred Clothing (3 + extras)
- Background (6 + extras)
- Personality (standard / outward / inward)
- Tone / Voice
- Role Description
- Key Life Events
- Relationships
- Secrets
- Fears
- Character Goals
- Custom Sections (fallback)

Each gets its own `data-section` and `data-nav` ID (e.g., `star-char-pa`, `star-char-cw`, `star-char-personality`, etc.).

### 2. Content blocks: Each section gets its own page with exact prompts

Each section page will contain:

**System message** (exact): `"You are a concise character creation assistant. Return only the requested content, no explanations."`

**Detailed mode prompt** (exact template with the specific field's instruction and maxSentences filled in — copied verbatim from `CHARACTER_FIELD_PROMPTS`):
```
You are enhancing a character field for an interactive roleplay. Use STRUCTURED EXPANSION:

RULES:
1. Be concise and factual (max {maxSentences} sentences)
2. Focus on narrative-relevant details - what matters for the story
...

FIELD: {label}
INSTRUCTION: {exact instruction text from CHARACTER_FIELD_PROMPTS}
```

**Precise mode prompt** (exact template).

**Generate-both prompt** (exact template with the section-specific hint from `SECTION_HINTS`).

**Field resolution table** showing which fieldName prefixes map to this config.

All prompt text will be the **exact** strings from `character-ai.ts` — no paraphrasing.

### 3. Story Builder: Same treatment

Break `star-world` into per-field blocks (scenarioName, briefDescription, storyPremise, factions, locations, historyTimeline, plotHooks, dialogFormatting, customContent) each showing the exact prompt templates from `world-ai.ts`.

### 4. Keep shared overview block

Add a small overview block at the top of the Character Builder group explaining:
- The shared call flow: `character-ai.ts → callAIWithFallback() → chat edge fn → api.x.ai`
- Model/fallback/temperature/token settings
- The 3 output modes
- Context injection (buildFullContext + buildCharacterSelfContext)

This is the "how it works" block. The per-section blocks are the "what exactly is sent" blocks.

### 5. Update section map and navigation

Update the JavaScript `sectionTitles` map and sidebar click handlers for all new section IDs.

## Files Modified
- `public/api-call-inspector-chronicle.html` — restructure sidebar + content blocks (bulk of changes)

## Scope
This is entirely documentation/inspector changes. No functional code changes.

