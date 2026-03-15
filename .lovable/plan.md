

## Button Text Case & Styling Audit — Story Builder + Character Builder

### Summary of Findings

The **Character Builder** buttons consistently use **title case** (e.g., "Add Row", "Add Trait"). The **Story Builder** (WorldTab + StoryGoalsSection) buttons consistently use **ALL CAPS** (e.g., "ADD LOCATION", "ADD ROW", "ADD NEW STORY ARC"). The fix is to make the Story Builder match the Character Builder's title case convention.

---

### Complete Button Inventory

#### CONSISTENT — Character Builder (No changes needed)

| File | Line | Button Text | Case | Size/Weight |
|------|------|-------------|------|-------------|
| `CharactersTab.tsx` | 1556 | `Add Row` | Title ✓ | `text-xs font-bold` |
| `CharactersTab.tsx` | 1579 | `Add Row` | Title ✓ | `text-xs font-bold` |
| `CharactersTab.tsx` | 1603 | `Add Row` | Title ✓ | `text-xs font-bold` |
| `CharactersTab.tsx` | 1643 | `Add Row` | Title ✓ | `text-xs font-bold` |
| `CharactersTab.tsx` | 1685 | `Add Row` | Title ✓ | `text-xs font-bold` |
| `CharactersTab.tsx` | 1713 | `Add Row` | Title ✓ | `text-xs font-bold` |
| `CharactersTab.tsx` | 1741 | `Add Row` | Title ✓ | `text-xs font-bold` |
| `CharactersTab.tsx` | 1769 | `Add Row` | Title ✓ | `text-xs font-bold` |
| `CharactersTab.tsx` | 1797 | `Add Row` | Title ✓ | `text-xs font-bold` |
| `PersonalitySection.tsx` | 185 | `Add Trait` | Title ✓ | `text-xs font-bold` |
| `CharacterGoalsSection.tsx` | 345 | `Add Step` | Title ✓ | `text-sm` |
| `CharacterGoalsSection.tsx` | 356 | `Add New Goal` | Title ✓ | `text-sm font-medium` |

#### INCONSISTENT — Story Builder (Need ALL CAPS → Title Case)

| File | Line | Current Text | Fix To | Size/Weight |
|------|------|-------------|--------|-------------|
| `WorldTab.tsx` | 709 | `ADD LOCATION` | `Add Location` | `text-xs font-bold` |
| `WorldTab.tsx` | 835 | `ADD ROW` | `Add Row` | `text-xs font-bold` |
| `WorldTab.tsx` | 906 | `ADD TEXT FIELD` | `Add Text Field` | `text-xs font-bold` |
| `WorldTab.tsx` | 920 | `ADD CUSTOM CONTENT` | `Add Custom Content` | `text-xs font-bold` |
| `StoryGoalsSection.tsx` | 485 | `ADD NEXT PHASE` | `Add Next Phase` | `text-xs font-bold` |
| `StoryGoalsSection.tsx` | 498 | `ADD NEW STORY ARC` | `Add New Story Arc` | `text-xs font-bold` |

#### INCONSISTENT — Story Builder Cover Image Buttons (Need uppercase removed + restyle)

| File | Line | Current Text | Fix To | Current Style Issue |
|------|------|-------------|--------|-------------------|
| `WorldTab.tsx` | 607 | `Reposition` / `Done` | Keep text, remove `uppercase tracking-wider` | Uses OLD style: `bg-[hsl(240_6%_18%)] border border-[hsl(var(--ui-border))]` — should use reference `bg-[#303035]` style |
| `WorldTab.tsx` | 617 | `Remove` | Keep text, remove `uppercase tracking-wider` | Destructive button — keep `bg-[hsl(var(--destructive))]` but remove `uppercase tracking-wider` |

#### INCONSISTENT — Character Builder Reposition Overlay Button

| File | Line | Current Text | Fix To | Current Style Issue |
|------|------|-------------|--------|-------------------|
| `CharactersTab.tsx` | 1321 | `Done` | Keep text, remove `uppercase tracking-wider` | Uses `text-[9px] font-bold uppercase tracking-wider` |

#### INCONSISTENT — Custom Section "ADD ROW" / "ADD TEXT FIELD" in CharactersTab

| File | Line | Current Text | Fix To |
|------|------|-------------|--------|
| `CharactersTab.tsx` | 1910 | `ADD TEXT FIELD` | `Add Text Field` |
| `CharactersTab.tsx` | 2000 | `ADD ROW` | `Add Row` |

---

### Plan

**Step 1: WorldTab.tsx** — 6 text changes + 1 button restyle

1. Line 709: `ADD LOCATION` → `Add Location`
2. Line 835: `ADD ROW` → `Add Row`
3. Line 906: `ADD TEXT FIELD` → `Add Text Field`
4. Line 920: `ADD CUSTOM CONTENT` → `Add Custom Content`
5. Line 607: Remove `uppercase tracking-wider` from Reposition/Done button className. Replace OLD bg/border with reference style: `bg-[#303035] hover:bg-[#343439] border-0 shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]`. Keep the blue-500 active state for when repositioning is active.
6. Line 617: Remove `uppercase tracking-wider` from Remove button. Keep destructive color. Replace shadow with reference shadow.

**Step 2: StoryGoalsSection.tsx** — 2 text changes

1. Line 485: `ADD NEXT PHASE` → `Add Next Phase`
2. Line 498: `ADD NEW STORY ARC` → `Add New Story Arc`

**Step 3: CharactersTab.tsx** — 3 changes

1. Line 1321: Remove `uppercase tracking-wider` from Done overlay button
2. Line 1910: `ADD TEXT FIELD` → `Add Text Field`
3. Line 2000: `ADD ROW` → `Add Row`

Total: 11 text/style changes across 3 files.

