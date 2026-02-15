

# Fixes: Button Styling, Sparkle Visibility, Library Loading Performance, and Button Placement

---

## 1. Fix Button Text Styling on Scenario Builder Header

The "Save and Close" and "Save" buttons on the Scenario Builder page use `text-sm font-bold` while the Character Builder buttons correctly use `text-[10px] font-bold uppercase tracking-wider`. Update both Scenario Builder header buttons to match.

**File: `src/pages/Index.tsx` (lines 1517-1532)**

Change both buttons' className from:
`text-sm font-bold` to `h-10 px-6 text-[10px] font-bold leading-none uppercase tracking-wider`

Also restrict these buttons to `tab === "world"` only (remove the `tab === "characters" && !selectedCharacterId` condition) since the character interim page needs different buttons.

---

## 2. Fix Button Placement on Character Interim Page

Currently Save and Close + Save buttons appear on the character selection interim page alongside Import from Library and + New Character. Fix: only show Save/Save and Close on the World tab. On the characters tab with no selection, show:

**Cancel** | **Import from Library** | **+ New Character**

Add a Cancel button before Import from Library that navigates back (e.g., sets tab to "world"). All three use the standard button style: `h-10 px-6 text-[10px] font-bold leading-none uppercase tracking-wider`.

**File: `src/pages/Index.tsx` (lines 1515, 1689-1709)**

---

## 3. Fix Sparkle Icons Not Showing on Custom-Added Rows

Three places have a `label` guard preventing the sparkle from rendering on newly added rows:

- **`src/components/chronicle/CharactersTab.tsx` line 153**: `{onEnhance && extra.label && (` -- remove `extra.label` guard
- **`src/components/chronicle/WorldTab.tsx` line 628**: `{item.label && (` -- remove `item.label` guard
- **`src/components/chronicle/PersonalitySection.tsx` line 101**: `{onEnhance && trait.label && (` -- remove `trait.label` guard

Change all three to just `{onEnhance && (` so sparkles always appear on every row.

---

## 4. Optimize "Import from Library" Loading Performance

Currently `fetchCharacterLibrary()` calls `select('*')` which loads ALL character data (physical appearance, clothing, background, personality, goals, sections, etc.) for every library character. The picker modal only needs name, tags, avatar URL, and ID to display tiles.

### Changes:

**A. New lightweight fetch function in `src/services/supabase-data.ts`:**

Add `fetchCharacterLibrarySummaries()` that only selects: `id, name, tags, avatar_url, avatar_position`

Returns a lightweight type (just enough for tile display).

**B. Update `CharacterPickerWithRefresh` in `src/components/chronicle/CharacterPicker.tsx`:**

- On mount, call the new lightweight fetch to instantly populate tiles (name, avatar, tags only)
- When user clicks a tile to select/import, THEN call the full `fetchCharacterById(id)` or equivalent to load all data
- This means the modal opens fast with tiles visible immediately, and full data loads only on selection

**C. Update `src/pages/Index.tsx`:**

- Pass a `fetchFullCharacter` callback to the picker so it can load full data on selection
- The `onSelect` handler receives the full character data after the single-character fetch completes

### Technical Details:

```text
// New in supabase-data.ts
type CharacterSummary = { id: string; name: string; tags: string; avatarUrl: string; avatarPosition: {x:number,y:number} };

async function fetchCharacterLibrarySummaries(): Promise<CharacterSummary[]> {
  const { data } = await supabase
    .from('characters')
    .select('id, name, tags, avatar_url, avatar_position')
    .eq('is_library', true)
    .order('updated_at', { ascending: false });
  return (data || []).map(d => ({
    id: d.id, name: d.name || '', tags: d.tags || '',
    avatarUrl: d.avatar_url || '', avatarPosition: d.avatar_position || {x:50,y:50}
  }));
}

async function fetchCharacterById(id: string): Promise<Character | null> {
  const { data } = await supabase
    .from('characters').select('*').eq('id', id).maybeSingle();
  return data ? dbToCharacter(data) : null;
}
```

The `CharacterPickerWithRefresh` component changes:
- Uses summaries for display (loads fast)
- On tile click, shows a brief loading indicator on the selected tile, fetches full data, then calls `onSelect` with the complete character

---

## Files Modified

1. **`src/pages/Index.tsx`** -- Button styling fix, condition fix, add Cancel button to interim page
2. **`src/components/chronicle/CharactersTab.tsx`** -- Remove `extra.label` guard on sparkle (line 153)
3. **`src/components/chronicle/WorldTab.tsx`** -- Remove `item.label` guard on sparkle (line 628)
4. **`src/components/chronicle/PersonalitySection.tsx`** -- Remove `trait.label` guard on sparkle (line 101)
5. **`src/services/supabase-data.ts`** -- Add `fetchCharacterLibrarySummaries()` and `fetchCharacterById()`
6. **`src/components/chronicle/CharacterPicker.tsx`** -- Refactor to use lightweight summaries for tiles, full fetch only on selection

