

# Multi-Page UI Updates

This plan covers 7 changes across multiple pages to fix visual issues and unify styling.

---

## 1. Story Card Description Clipping Fix (ScenarioHub.tsx)

The bottom info container uses `h-1/3` with `justify-start`, causing the description text to overflow into the footer stats row. Fix by making the description use `min-h-0 flex-shrink` properly and adding `overflow-hidden` to the parent so text never visually clips past the footer.

**File:** `src/components/chronicle/ScenarioHub.tsx`, lines 103-137

- Change the bottom info container from `h-1/3` to a taller `h-2/5` and use `overflow-hidden` on the container
- Add `flex-shrink min-h-0` to the description `<p>` so it shrinks before overlapping the footer
- Keep `mt-auto` on the footer so it stays pinned to the bottom

---

## 2. Image Library Background to Black (Index.tsx)

**File:** `src/pages/Index.tsx`, line 1709

- Add `bg-black` to the Image Library content wrapper div (currently `className="relative w-full h-full"`)

---

## 3. Image Library "New Folder" Skeleton Card (ImageLibraryTab.tsx)

**File:** `src/components/chronicle/ImageLibraryTab.tsx`, lines 494-505

Replace the current light-themed "New Folder" card with the dark gradient style matching ScenarioHub:
- `bg-gradient-to-br from-zinc-800 to-zinc-900`
- `border-2 border-dashed border-zinc-600`
- `bg-zinc-700/50` circle with `text-zinc-500`
- `text-zinc-500` label
- Blue hover states

---

## 4. Character Library Background to Black + Replace "New Character" Button with Skeleton Card

**File:** `src/pages/Index.tsx`, line 1724-1725
- Change the character library wrapper from `className="p-10 overflow-y-auto h-full"` to `className="p-10 overflow-y-auto h-full bg-black"`

**File:** `src/pages/Index.tsx`, lines 1665-1669
- Remove the `+ New Character` button that appears when `!selectedCharacterId` and `tab === "library"`
- Keep the `Import from Library` button for the `characters` tab

**File:** `src/components/chronicle/CharactersTab.tsx`, around lines 468-527
- After the character grid map, add a "New Character" skeleton placeholder card using the same dark gradient style:
  - `aspect-[2/3]`, `rounded-[2rem]`, `border-2 border-dashed border-zinc-600`, `bg-gradient-to-br from-zinc-800 to-zinc-900`
  - "+" icon in `bg-zinc-700/50` circle
  - "New Character" label in `text-zinc-500`
  - Calls `onAddNew` (a new prop to be added to `CharactersTabProps` for when no character is selected)

The `CharactersTab` will need a new `onAddNew` prop that triggers `handleCreateCharacter` from Index.tsx.

---

## 5. Chat History Background to Black (Index.tsx)

**File:** `src/pages/Index.tsx`, line 1784
- Change from `className="p-10 overflow-y-auto h-full"` to `className="p-10 overflow-y-auto h-full bg-black"`

The ConversationsTab itself uses white cards with `bg-white` and `border-slate-200`, which will look fine on a black background (card-based design).

---

## 6. Hub + Image Library Gear Buttons: Update to "Dew Falls" Style (Index.tsx)

**File:** `src/pages/Index.tsx`

Both gear buttons (lines 1495-1500 and 1513-1518) currently use:
```
bg-slate-900 text-white border border-slate-900 hover:bg-slate-800 shadow-md
```

Replace with the Dew Falls surface style:
```
rounded-xl border border-[hsl(var(--ui-border))]
bg-[hsl(var(--ui-surface-2))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]
text-[hsl(var(--ui-text))]
hover:bg-white/5 active:bg-white/10
```

---

## 7. Chat History "Delete All" Button: Update to "Dew Falls" Style (Index.tsx)

**File:** `src/pages/Index.tsx`, lines 1487-1490

The `Delete All` button uses `<Button variant="primary">` which renders as `bg-slate-900 text-white`. Replace with an inline-styled button using the Dew Falls surface classes (same as the gear buttons above), keeping the "Delete All" text.

---

## Regarding Missing Characters

This is a data issue, not a code bug. The character library loads from the database on mount. I'll investigate the database query and console logs during implementation to determine if there's a loading or filtering issue.

