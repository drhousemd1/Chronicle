

## Missed Items — Full Inventory

Here is every remaining inconsistency on the Story Builder page, with exact file, line, current code, and what needs to change.

### 1. `ArcBranchLane.tsx` line 271 — "ADD STEP" still ALL CAPS

**Current:** `<span>ADD STEP</span>`
**Fix:** `<span>Add Step</span>`

---

### 2. `ArcModeToggle.tsx` lines 17 and 29 — Simple/Advanced toggle still ALL CAPS

**Current (both buttons):** `text-[10px] font-black uppercase tracking-widest`
**Fix:** Remove `uppercase tracking-widest` → `text-[10px] font-black`

---

### 3. `WorldTab.tsx` line 1011 — "Day" label still ALL CAPS

**Current:** `<span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Day</span>`
**Fix:** Remove `uppercase tracking-wider` → `text-[10px] font-bold text-zinc-400`

---

### 4. `WorldTab.tsx` lines 1089 and 1101 — Manual/Automatic toggle still ALL CAPS

**Current (both buttons):** `text-[10px] font-black uppercase tracking-widest`
**Fix:** Remove `uppercase tracking-widest` → `text-[10px] font-black`

---

### 5. `Index.tsx` line 2235 — Header AI Fill button has `uppercase tracking-wider` but Scene Gallery and Cover Image AI Generate buttons do NOT

The three AI-type iridescent buttons are inconsistent with each other:
- **Header AI Fill** (`Index.tsx:2235`): `text-[10px] font-bold uppercase tracking-wider` — has uppercase
- **Scene Gallery AI Generate** (`SceneGalleryActionButtons.tsx:78`): `text-[10px] font-bold` — no uppercase
- **Cover Image AI Generate** (`CoverImageActionButtons.tsx:78`): `text-[10px] font-bold` — no uppercase

**Fix:** Remove `uppercase tracking-wider` from `Index.tsx` line 2235 so all three AI buttons match.

---

### 6. `StoryGoalsSection.tsx` lines 482 and 495 — "Add Next Phase" / "Add New Story Arc" bold check

These currently have `text-xs font-bold` which is identical to every other "Add" button (Add Location, Add Row, Add Text Field, Add Custom Content). The weight IS `font-bold` (700). If the user sees them as visually lighter, it may be a rendering difference. No code change needed here unless the user wants them changed to `font-black` (900).

---

### Summary — 7 code changes across 4 files

| # | File | Line | Change |
|---|------|------|--------|
| 1 | `ArcBranchLane.tsx` | 271 | `ADD STEP` → `Add Step` |
| 2 | `ArcModeToggle.tsx` | 17 | Remove `uppercase tracking-widest` |
| 3 | `ArcModeToggle.tsx` | 29 | Remove `uppercase tracking-widest` |
| 4 | `WorldTab.tsx` | 1011 | Remove `uppercase tracking-wider` from "Day" |
| 5 | `WorldTab.tsx` | 1089 | Remove `uppercase tracking-widest` from Manual |
| 6 | `WorldTab.tsx` | 1101 | Remove `uppercase tracking-widest` from Automatic |
| 7 | `Index.tsx` | 2235 | Remove `uppercase tracking-wider` from AI Fill button |

