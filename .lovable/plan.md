

## Fix Plan — Custom Sections (3 issues)

### 1. Structured sections: seed one default row + Freeform X alignment

**File: `src/pages/Index.tsx`** — line 1628

The external `handleAddSection` creates structured sections with `items: []` (empty). Fix: seed one item like the internal handler does.

```
items: [{ id: uid('item'), label: '', value: '', createdAt: now(), updatedAt: now() }]
```

### 2. Auto-navigate to new custom section after creation

**File: `src/pages/Index.tsx`** — `handleAddSection` (line 1618-1634)

After creating the section, we need to tell `CharactersTab` to navigate to it. The tab uses `activeTraitSection` state with keys like `custom:{sectionId}`.

Options:
- Return the new section ID and pass a callback to `CharactersTab`
- Add an `onNavigateToSection` prop, or change `onAddSection` to return the ID

Simplest: Change the `onAddSection` prop signature to accept a callback that receives the new section ID. Then in `CharactersTab`, after calling `externalAddSection`, use the returned ID to call `setActiveTraitSection`.

Actually simpler: Move the navigation logic INTO `CharactersTab`. Instead of calling `externalAddSection` directly, have `CharactersTab` generate the section ID, call `externalAddSection` with it, then navigate. But that changes the API.

**Best approach**: Modify `handleAddSection` in `Index.tsx` to store the new section ID, and add a new prop `navigateToSection` or simply have `CharactersTab` track "latest section added" via a `useEffect` on `selected.sections.length` changes and auto-navigate to the last one.

**Chosen approach**: In `CharactersTab`, after calling `externalAddSection(type)`, use a ref/effect pattern: track previous section count, and when it increases, auto-navigate to the newest custom section.

### 3. Freeform: Fix X button position + textarea width

**File: `src/components/chronicle/CharactersTab.tsx`** — lines 1902-1925

Currently the X button is in its own `<div>` above the textarea (lines 1903-1913), creating the weird gap. Fix: move the X to be inline-right of the textarea, matching the structured layout pattern (textarea + X side by side).

### 4. Remove outer slate blue border from custom sections

**File: `src/components/chronicle/CharactersTab.tsx`** — line 1854

`border border-[#4a5f7f]` → remove it (use same borderless shadow pattern as other containers).

---

### Summary — 4 changes across 2 files

| # | File | Change |
|---|------|--------|
| 1 | `Index.tsx` line 1628 | Seed one default item for structured sections |
| 2 | `CharactersTab.tsx` | Auto-navigate to new custom section via useEffect on sections length |
| 3 | `CharactersTab.tsx` lines 1902-1925 | Move freeform X button inline-right of textarea |
| 4 | `CharactersTab.tsx` line 1854 | Remove `border border-[#4a5f7f]` from custom section outer shell |

