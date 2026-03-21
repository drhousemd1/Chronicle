

# Audit & Fix: AI Enhance Prompt Coverage Across All Character Builder Sections

## Current State — What Has Dedicated Prompts vs. What Falls to Generic

### HAS dedicated prompt configs (works correctly):
| Section | fieldKey pattern | Resolves to | Status |
|---------|-----------------|-------------|--------|
| Physical Appearance (hardcoded) | `hairColor`, `eyeColor`, `build`, etc. | Direct match | GOOD |
| Currently Wearing (hardcoded) | `top`, `bottom`, `undergarments`, `miscellaneous` | Direct match | GOOD |
| Preferred Clothing (hardcoded) | `casual`, `work`, `sleep` | Direct match | GOOD |
| Background (hardcoded) | `jobOccupation`, `educationLevel`, etc. | Direct match in PROMPTS dict | GOOD in theory... |
| Tone (extras) | `extra_tone_<id>` | Resolves → `tone` | GOOD |
| Personality (standard/split) | `personality_<id>`, `personality_outward_<id>`, `personality_inward_<id>` | Resolves correctly | GOOD |

### BROKEN — Has prompt config but fieldKey doesn't resolve:
| Section | fieldKey sent | Expected match | Actual result |
|---------|-------------|----------------|---------------|
| Background (hardcoded) | `bg_jobOccupation` | `jobOccupation` | Falls to `custom` — **the `bg_` prefix is never stripped** |
| Background (hardcoded) | `bg_educationLevel` | `educationLevel` | Falls to `custom` |
| Background (hardcoded) | `bg_residence` | `residence` | Falls to `custom` |
| Background (hardcoded) | `bg_hobbies` | `hobbies` | Falls to `custom` |
| Background (hardcoded) | `bg_financialStatus` | `financialStatus` | Falls to `custom` |
| Background (hardcoded) | `bg_motivation` | `motivation` | Falls to `custom` |

### MISSING — No dedicated prompt config at all (all fall to generic `custom`):
| Section | fieldKey pattern | Section hint in generate-both | What it should generate |
|---------|-----------------|-------------------------------|------------------------|
| Role Description | `roleDescription` | N/A (hardcoded field) | Character's role in the story |
| Key Life Events (extras) | `extra_kle_<id>` | `'key life event'` | A significant past event and its impact |
| Relationships (extras) | `extra_rel_<id>` | `'relationship'` | A relationship dynamic with another character |
| Secrets (extras) | `extra_sec_<id>` | `'secret'` | A hidden truth about the character |
| Fears (extras) | `extra_fear_<id>` | `'fear'` | A specific fear and how it affects behavior |
| Character Goals | goal fields | `'character goal'` | Goal title + desired outcome |
| Physical Appearance (extras) | `extra_pa_<id>` | `'physical appearance detail'` | Additional physical detail |
| Currently Wearing (extras) | `extra_cw_<id>` | `'currently wearing detail'` | Additional clothing item |
| Preferred Clothing (extras) | `extra_pc_<id>` | `'preferred clothing detail'` | Additional preferred outfit |
| Background (extras) | `extra_bg_<id>` | `'background detail'` | Additional background info |
| Custom Sections | `custom_<sectionId>_<itemId>` | `'custom section detail'` | Context-dependent |

## Plan

### 1. `src/services/character-ai.ts` — Fix `bg_` prefix resolution + add missing prompt configs

**Fix the resolver** (line ~287): Add `bg_` prefix stripping so `bg_jobOccupation` → `jobOccupation`:
```
: fieldName.startsWith('bg_') ? fieldName.slice(3)
```

**Add dedicated prompt configs** for sections that currently lack them:

- `roleDescription` — "Describe this character's role and function in the story"
- `keyLifeEvent` — "Describe a formative event from this character's past and how it shaped who they are"
- `relationship` — "Describe this relationship dynamic — who the other person is, the nature of the bond, and any tension or significance"
- `secret` — "Describe a hidden truth, concealed history, or private knowledge this character keeps from others and why"
- `fear` — "Describe this fear — what triggers it, how it manifests in behavior, and what the character does to avoid or cope with it"
- `characterGoal` — "Describe what this character wants to achieve, their motivation, and potential obstacles"

**Add section hints** for generate-both mode for each of the above.

**Add resolver entries** for the extras prefixes:
```
: fieldName.startsWith('extra_kle') ? 'keyLifeEvent'
: fieldName.startsWith('extra_rel') ? 'relationship'
: fieldName.startsWith('extra_sec') ? 'secret'
: fieldName.startsWith('extra_fear') ? 'fear'
: fieldName.startsWith('extra_pa') ? 'physicalAppearanceExtra'
: fieldName.startsWith('extra_cw') ? 'currentlyWearingExtra'
: fieldName.startsWith('extra_pc') ? 'preferredClothingExtra'
: fieldName.startsWith('extra_bg') ? 'backgroundExtra'
```

### 2. `public/api-call-inspector-chronicle.html` — Break down Text Field Generation

Replace the single "Star Icon — Character Fields" block with a detailed breakdown:

**Character Builder — Field-Specific Prompts:**
- Physical Appearance (11 fields): hairColor, eyeColor, build, bodyHair, height, breastSize, genitalia, skinTone, makeup, bodyMarkings, temporaryConditions
- Currently Wearing (4 fields): top, bottom, undergarments, miscellaneous
- Preferred Clothing (3 fields): casual, work, sleep
- Background (6 fields): jobOccupation, educationLevel, residence, hobbies, financialStatus, motivation
- Tone (1 config): vocal qualities, speech rhythm, formality
- Personality (3 configs): standard, outward, inward
- Relationships (1 config): relationship dynamics
- Key Life Events (1 config): formative past events
- Secrets (1 config): hidden truths
- Fears (1 config): specific fears and behavioral impact
- Character Goals (1 config): objectives and motivation
- Role Description (1 config): story function
- Custom Sections: generic fallback

**Story Builder — Field-Specific Prompts:**
- scenarioName, briefDescription, storyPremise, factions, locations, historyTimeline, plotHooks, dialogFormatting, customContent

### 3. Rename sidebar labels
- "Star Icon — Character Fields" → "Character Builder — AI Enhance"
- "Star Icon — World Fields" → "Story Builder — AI Enhance"

## Files Modified
- `src/services/character-ai.ts` — fix `bg_` resolver, add ~8 new prompt configs + resolver entries + section hints
- `public/api-call-inspector-chronicle.html` — restructure Text Field Generation into detailed per-section breakdown

