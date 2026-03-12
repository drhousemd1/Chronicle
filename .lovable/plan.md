

# Fix All Text Field Borders in Story Builder to Slate Blue

## Problem
The previous fix only replaced `border-ghost-white` on container/section elements. But the actual text fields (inputs, textareas) inside the Story Builder use `border-zinc-700` — a different class — so they were completely missed. The Character Builder works correctly because its text fields already use `border-[#4a5f7f]`.

## Changes

### 1. `src/components/chronicle/WorldTab.tsx`
Replace all `border-zinc-700` on text input fields with `border-[#4a5f7f]`. This includes:
- Story Name field (conditional: non-error state)
- Brief Description field (conditional: non-error state)
- Story Premise textarea (conditional: non-error state)
- Location name inputs (unconditional)
- Location description textareas (unconditional)
- Custom World Content label inputs (unconditional)
- Custom World Content description textareas (unconditional)
- Custom World Content freeform textareas (unconditional)
- Opening Dialog textarea (conditional: non-error state)
- Additional Formatting Rules textarea
- Dialog Formatting read-only area
- Mode toggle border
- Time interval select border
- Day counter border

**Approach**: Global find-replace `border-zinc-700` → `border-[#4a5f7f]` across the entire file. This is safe because every `border-zinc-700` instance in this file is on an input/textarea that should be slate blue.

Also replace `border-zinc-600` on text input fields only (skip dashed placeholder borders which are intentionally zinc-600 for the "add character" and "no cover" placeholders). Specifically the custom input field borders at lines 135 and 266 in ContentThemesSection.

### 2. `src/components/chronicle/StoryGoalsSection.tsx`
Replace `border-zinc-700` → `border-[#4a5f7f]` on:
- Story Arc Title field (conditional: non-error fallback)
- Desired Outcome field (conditional: non-error fallback)

### 3. `src/components/chronicle/ContentThemesSection.tsx`
Replace `border-zinc-700` → `border-[#4a5f7f]` on:
- Unselected tag pill borders (lines 94, 188)
Replace `border-zinc-600` → `border-[#4a5f7f]` on:
- Custom tag input fields (lines 135, 266)

**Total**: ~94 `border-zinc-700` replacements in WorldTab, 2 in StoryGoalsSection, 4 in ContentThemesSection.

