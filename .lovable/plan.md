

# Full Spacing & Sizing Consistency Audit — All Sections

## Reference Standard
**Primary Locations** (WorldTab line 823) uses:
- `space-y-3` between rows
- Button sits naturally after the last row (inside the same `space-y-3` container, so it gets a 12px gap)
- Label inputs: `w-2/5`, `px-3 py-2`, `text-xs font-bold`
- Description inputs: `flex-1`, `px-3 py-2`, `text-sm`

All sections should match this pattern.

---

## Findings by File

### WorldTab.tsx (Story Builder)

| Section | Current Spacing | Issue |
|---|---|---|
| **Primary Locations** (L823) | `space-y-3` | Correct — this is the reference |
| **Custom Structured** (L889) | `space-y-1` on outer container; no spacing wrapper around items | Rows are cramped; "Add Row" button collides with last row |
| **Custom Freeform** (L1016) | `space-y-1` per item div | Same cramped spacing |
| **Opening Dialog** (L1099) | `space-y-6` | Fine (single textarea, different layout) |
| **Custom AI Rules** (L1476) | `space-y-8` | Fine (single textarea sections) |
| **Additional Entries** (L1509) | `gap-6` grid | Fine |

### CharactersTab.tsx (Character Builder)

| Section | Current Spacing | Issue |
|---|---|---|
| **HardcodedSection** expanded (L476) | `space-y-4` | Slightly wider than reference `space-y-3`; rows are HardcodedRow/ExtraRow which look fine but inconsistent with WorldTab |
| **Basics profile** fields (L1550) | `gap-4` in flex-col | Fine for single-field stacks |
| **Below-grid fields** (L1613) | `space-y-4` | Consistent with HardcodedSection |
| **Custom sections** outer (L2043) | `space-y-4` | Slightly wider than reference |
| **Custom sections** per-item (L2057) | `space-y-2` | Tighter than HardcodedSection rows |
| **Label width** in custom structured (L2100) | `w-1/3` | Inconsistent with `w-2/5` everywhere else |

### StoryCardView.tsx (Scenario Card in CharacterEditModal)

| Section | Current Spacing | Issue |
|---|---|---|
| **Locations** (L143) | `space-y-3` | Correct |
| **Custom sections** inner (L209) | `space-y-3` on container | Correct |
| **Freeform items** (L303) | `space-y-2` | Tighter than reference |
| **Scenario** (L114) | `space-y-1.5` | Fine (single field) |

---

## Changes to Apply

### 1. WorldTab.tsx — Custom sections spacing

**Line 889**: Change `space-y-1` to `space-y-3` on custom section outer container.

**Lines 915-987** (structured items): These items render directly inside the `space-y-1` container with no spacing wrapper. After changing the outer to `space-y-3`, row spacing will be correct.

**Line 1016**: Change `space-y-1` to `space-y-3` on freeform item divs.

**Lines 988, 1033** (Add Row buttons): Add `mt-1` class so the button has a small visual break from the last row (the `space-y-3` parent already provides 12px, but `mt-1` gives a slight extra nudge matching the Primary Locations feel).

### 2. CharactersTab.tsx — Standardize all spacing

**Line 476** (HardcodedSection expanded): Change `space-y-4` to `space-y-3` to match WorldTab reference.

**Line 1613** (below-grid fields): Change `space-y-4` to `space-y-3`.

**Line 2043** (custom sections expanded): Change `space-y-4` to `space-y-3`.

**Line 2057** (custom per-item wrapper): Change `space-y-2` to `space-y-3`.

**Line 2100** (custom structured label width): Change `w-1/3` to `w-2/5` to match all other label/description rows.

### 3. StoryCardView.tsx — Freeform items spacing

**Line 303**: Change `space-y-2` to `space-y-3` on freeform item divs.

---

## Summary

**3 files modified:**
- `src/components/chronicle/WorldTab.tsx` — Fix custom section spacing from `space-y-1` to `space-y-3`
- `src/components/chronicle/CharactersTab.tsx` — Standardize all expanded containers and per-item wrappers to `space-y-3`; fix custom label width from `w-1/3` to `w-2/5`
- `src/components/chronicle/StoryCardView.tsx` — Fix freeform item spacing to `space-y-3`

