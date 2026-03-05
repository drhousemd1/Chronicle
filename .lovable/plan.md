

## Plan: Fix Personality Labels, Location Labels, Custom Section Headers, and Add Content Type Picker

### Problem 1: Personality trait labels not styled
The `PersonalitySection.tsx` has its own local `AutoResizeTextarea` and `TraitRow` component. The label input on line 100 uses `text-white` instead of `text-zinc-400 uppercase tracking-widest`. This was missed in the previous styling pass because it's in a separate file.

**Fix:** In `src/components/chronicle/PersonalitySection.tsx` line 100, change the label className to add `uppercase tracking-widest text-zinc-400` and `placeholder:normal-case placeholder:tracking-normal`, matching the other sections.

### Problem 2: Primary Locations labels still white
In `WorldTab.tsx` line 598, the location label input uses `text-white` instead of `text-zinc-400 uppercase tracking-widest`.

**Fix:** In `src/components/chronicle/WorldTab.tsx` line 598, swap `text-white` to `text-zinc-400 uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal`.

### Problem 3: Custom sections in Character Builder use darker blue header
Line 1197 in `CharactersTab.tsx`: custom sections use `bg-blue-900/40 border-b border-blue-500/20` instead of the standard `bg-[#4a5f7f] border-b border-white/20 shadow-lg`.

**Fix:** Change the header div class on line 1197 to `bg-[#4a5f7f] border-b border-white/20 shadow-lg` to match all other section headers.

### Problem 4: Custom World Content sections use dark blue banner behind title
Lines 644 in `WorldTab.tsx`: the title wrapper has `bg-[#1e293b] rounded-xl border border-white/5 px-4 py-3`. This should be removed so the title renders inline like "PRIMARY LOCATIONS" — as a simple `text-[10px] font-black text-zinc-400 uppercase tracking-widest` label with no background box.

**Fix:** Remove the wrapping div with `bg-[#1e293b]` and render the title as a plain editable label matching the "Primary Locations" style.

### Problem 5: Add Content Type picker when clicking "+ Add Custom Content" in World Core
Instead of immediately adding a label/description section, show a modal (same style as the Enhancement Style picker) letting the user choose between:
- **Structured** — Label + Description rows (current behavior)
- **Freeform** — A single large text field (like Story Premise)

For Freeform sections, no "Add Item" button is shown — just the title and a single textarea.

**Implementation:**
- Add a `type` field to `WorldCustomSection` in `src/types.ts`: `type?: 'structured' | 'freeform'` (optional, defaults to 'structured' for backward compat)
- Add a `freeformValue` field: `freeformValue?: string`
- Create a new modal component or reuse the pattern from `EnhanceModeModal` — a simple 2-option picker
- Update `WorldTab.tsx`:
  - Wire the "+ Add Custom Content" button to open the picker instead of directly adding
  - Render freeform sections as title + single textarea (no items, no "Add Item" button)
- Update `StoryCardView.tsx` to render freeform sections appropriately

### Files to update
1. `src/components/chronicle/PersonalitySection.tsx` — label styling
2. `src/components/chronicle/WorldTab.tsx` — location label styling, custom section banner removal, content type picker
3. `src/components/chronicle/CharactersTab.tsx` — custom section header color
4. `src/types.ts` — add `type` and `freeformValue` to `WorldCustomSection`
5. `src/components/chronicle/StoryCardView.tsx` — render freeform sections
6. New file: `src/components/chronicle/CustomContentTypeModal.tsx` — 2-option picker modal

