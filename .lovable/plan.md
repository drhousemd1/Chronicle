

# Fix Character Evolution Bugs #1, #2, #4 + Update Guides

## 1. Current Problems (Detail)

### Bug #1: `buildCharacterStateBlock()` omits empty sections
**File**: `supabase/functions/extract-character-updates/index.ts`, lines 50-165

The function skips any section that has no data. Specifically:
- **Physical Appearance** (line 82): Only outputs if `appearance` string is non-empty after filtering
- **Preferred Clothing** (line 90): Only outputs if `preferred` string is non-empty after filtering
- **Currently Wearing** (line 67): Only outputs if the object exists — but if it exists with all empty values, it outputs `(not set)`. However if the object is `undefined`, the entire section is skipped
- **Background** (line 94): Only outputs if `bgEntries` is non-empty
- **Personality** (line 109): Only outputs if trait arrays have values
- **Extras-only sections** (lines 129-135 — Tone, Key Life Events, Relationships, Secrets, Fears): Only output if `_extras` array exists AND has items with non-empty values
- **Custom sections** (lines 155-162): Only output if `customSections` array exists and has items — but these are fine since they always have content if they exist

Result: A new character with just a name sees only ~3 sections. The AI never learns the other 13 section types exist and cannot populate them.

### Bug #2: `personality.traits` missing from TRACKABLE FIELDS
**File**: `supabase/functions/extract-character-updates/index.ts`, line 311

The prompt lists `personality.outwardTraits` and `personality.inwardTraits` but NOT `personality.traits` (unified mode). Characters not using split personality mode can never have traits extracted.

### Bug #4: Wrong default fallback model
**Files**: 
- `supabase/functions/extract-character-updates/index.ts`, line 405 — defaults to `grok-3-mini`
- `src/components/chronicle/CharacterEditModal.tsx`, line 519 — Deep Scan defaults to `grok-3-mini`

**Critical nuance (from Claude's review)**: The 403 retry path at line 465 uses `modelForRequest` which inherits from the default. If we change the default, the retry path also changes. The retry path should stay on the lighter model intentionally. The fix must be surgical: change only the default fallback, then hardcode the 403 retry to use `grok-3-mini` explicitly so it doesn't inherit the upgraded default.

---

## 2. What These Bugs Cause

- **Bug #1**: Characters never develop in sections that start empty. A character with no relationships, fears, secrets, tone, or background will NEVER get those sections populated — the AI literally doesn't know those fields are available. This affects the core character evolution promise of the app.
- **Bug #2**: Any character using unified personality mode has their personality frozen. The AI only knows about outward/inward split traits.
- **Bug #4**: Extraction analysis runs on a cheaper model than the one generating the narrative, leading to shallow or missed trait inferences. The 403 retry path correctly uses a lighter model for safe-mode fallback and must not be changed.

---

## 3. Scope — Affected Files

| File | Change Type |
|------|-------------|
| `supabase/functions/extract-character-updates/index.ts` | Bug #1 scaffolding, Bug #2 trackable fields, Bug #4 default model + protect retry path |
| `src/components/chronicle/CharacterEditModal.tsx` | Bug #4 Deep Scan fallback model |
| `docs/guides/character-builder-page-structure-guide.md` | Update Known Issues to RESOLVED |
| `docs/guides/edge-functions-ai-services-structure-guide.md` | Update bug table + model info |

---

## 4. Proposed Fixes (Detail)

### Bug #1 Fix: Show all sections as scaffolding when empty

In `buildCharacterStateBlock()`:

**Physical Appearance (line 77-83)**: Remove the `if (appearance)` guard. When empty, output:
`Physical Appearance: (not yet described -- populate when revealed in dialogue)`

**Currently Wearing (line 67-73)**: Remove the `if (c.currentlyWearing)` guard. When the object is undefined or all values are empty, output:
`Currently Wearing: (not yet described -- update when clothing is mentioned)`

**Preferred Clothing (line 85-91)**: Remove the `if (preferred)` guard. When empty, output:
`Preferred Clothing: (not yet described -- populate when style preferences emerge)`

**Background (line 94-106)**: When no entries exist, output:
`Background: (not yet described -- populate when job, education, residence, hobbies, etc. are revealed)`

**Personality (line 109-118)**: When no traits exist (regardless of split mode), output:
`Personality: (not yet described -- infer traits from observed behavior and dialogue patterns)`

**Extras-only sections (lines 129-135)**: For each of Tone, Key Life Events, Relationships, Secrets, Fears — when `_extras` is empty or missing, output:
`[SectionName]: (none yet -- populate when revealed in dialogue)`

### Bug #2 Fix: Add `personality.traits` to TRACKABLE FIELDS

After line 311, add:
```
- personality.traits (unified trait array -- used when character is NOT in split mode. Provide value as "Label: Description" format)
```

### Bug #4 Fix: Surgical model change

**Line 405** — Change default fallback from `'grok-3-mini'` to `'grok-3'`:
```typescript
const effectiveModelId = (modelId && VALID_GROK_MODELS.includes(modelId)) ? modelId : 'grok-3';
```

**Line 465 (403 retry)** — Hardcode `grok-3-mini` explicitly instead of using `modelForRequest`:
```typescript
model: 'grok-3-mini',  // Intentionally lighter model for safe-mode retry
```

**CharacterEditModal.tsx line 519** — Change Deep Scan fallback:
```typescript
modelId: modelId || 'grok-3'  // GROK ONLY
```

---

## 5. Expected Behavior After Fix

- **Bug #1**: Every character's state block will always show ALL section types, even when empty. The AI will see scaffolding like `Relationships: (none yet -- populate when revealed)` and know it can populate that field when relationships emerge in dialogue. This applies to all 16 section types including Currently Wearing and custom sections.
- **Bug #2**: Characters using unified personality mode will have `personality.traits` listed in TRACKABLE FIELDS. The AI will correctly emit updates using the unified format.
- **Bug #4**: Primary extraction uses `grok-3` (full model) for better analytical depth. The 403 safe-mode retry path remains on `grok-3-mini` intentionally — it's a fallback for content-filtered scenarios where speed and cost matter more than depth. Deep Scan from character edit also uses `grok-3`.

---

## 6. Codebase Analysis Confirmation

I have read and analyzed in full:
- `supabase/functions/extract-character-updates/index.ts` (all 541 lines) — `buildCharacterStateBlock()`, system prompt, TRACKABLE FIELDS, model selection, and the 403 retry path
- `src/components/chronicle/CharacterEditModal.tsx` (lines 505-530) — Deep Scan invocation with hardcoded model fallback
- `docs/guides/character-builder-page-structure-guide.md` (Known Issues section, lines 365-394)
- `docs/guides/edge-functions-ai-services-structure-guide.md` (full file, bug table at lines 103-110)
- `src/types.ts` — Character data types including `CharacterTraitSection`, `PhysicalAppearance`, `CurrentlyWearing`, `PreferredClothing`

I confirm the 403 retry path at line 461-494 uses `modelForRequest` (which equals `effectiveModelId`), so changing the default WOULD affect it. The fix must explicitly hardcode `grok-3-mini` in the retry path.

---

## 7. Guide Document Confirmation

I have read:
- `docs/guides/character-builder-page-structure-guide.md` — Section 12 (Known Issues) at lines 380-388
- `docs/guides/edge-functions-ai-services-structure-guide.md` — Section 5 (Known Bugs) at lines 103-110
- `docs/guides/GUIDE_STYLE_RULES.md` exists and is referenced

---

## 8. Guide Documentation Updates

### `docs/guides/character-builder-page-structure-guide.md` — Section 12

Update bug items:
- Bug #1: `ACTIVE` to `RESOLVED -- 2026-03-01 -- buildCharacterStateBlock now outputs scaffolding placeholders for all section types when empty, including currentlyWearing and custom sections`
- Bug #2: `ACTIVE` to `RESOLVED -- 2026-03-01 -- personality.traits added to TRACKABLE FIELDS for unified personality mode`
- Bug #4: `ACTIVE` to `RESOLVED -- 2026-03-01 -- Default extraction model changed to grok-3; 403 retry path intentionally remains on grok-3-mini`

### `docs/guides/edge-functions-ai-services-structure-guide.md`

- Section 2 table: Update `extract-character-updates` model from `grok-3-mini (Bug #4: should be grok-3)` to `grok-3 (default), grok-3-mini (403 safe-mode retry)`
- Section 5 bug table: Update bugs #1, #2, #4 status from `ACTIVE` to `RESOLVED`
- Section 13: Remove the now-completed planned items

