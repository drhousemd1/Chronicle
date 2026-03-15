

## 5-Batch Fix Plan — Character Builder Page

### Batch 1: Remove `uppercase tracking-widest` from toggle buttons

These toggles still render ALL CAPS and need the same fix applied to Story Builder toggles:

| # | File | Lines | Toggle | Change |
|---|------|-------|--------|--------|
| 1 | `CharactersTab.tsx` | 1425 | AI button | Remove `uppercase tracking-widest` |
| 2 | `CharactersTab.tsx` | 1431 | User button | Remove `uppercase tracking-widest` |
| 3 | `CharactersTab.tsx` | 1442 | Main button | Remove `uppercase tracking-widest` |
| 4 | `CharactersTab.tsx` | 1448 | Side button | Remove `uppercase tracking-widest` |
| 5 | `PersonalitySection.tsx` | 290 | Standard button | Remove `uppercase tracking-widest` |
| 6 | `PersonalitySection.tsx` | 302 | Split button | Remove `uppercase tracking-widest` |
| 7 | `GuidanceStrengthSlider.tsx` | 11-13 | Labels `RIGID`/`NORMAL`/`FLEXIBLE` | Change to `Rigid`/`Normal`/`Flexible` |
| 8 | `GuidanceStrengthSlider.tsx` | 73 | Slider label spans | Remove `uppercase tracking-widest` |
| 9 | `GuidanceStrengthSlider.tsx` | 34 | "Guidance Strength" heading | Remove `uppercase tracking-widest` (this is a section label, but it's inside the goal card body, not a field micro-label) |

Note: The `uppercase tracking-widest` on small field labels like "Goal Name", "Name", "Nicknames", "Desired Outcome" etc. are **kept** per the typography standard (small field labels = ALL CAPS). Only buttons/toggles/interactive elements are being changed.

---

### Batch 2: Default row for Tone, Key Life Events, Relationships, Secrets, Fears

Currently these sections render empty — user must click "Add Row" to get the first entry. Fix: auto-seed one empty extra row when `_extras` is empty or undefined, so the Label + Description fields appear by default.

**File:** `CharactersTab.tsx` — lines 1638, 1708, 1736, 1764, 1792

For each of these 5 sections, wrap the extras rendering to use a "display items" list that defaults to one empty row if `_extras` is empty, and auto-persist via `handleAddExtra` on first render. Same pattern already used by the freeform custom sections (lines 1857-1864).

---

### Batch 3: Character Goals container fixes

**File:** `CharacterGoalsSection.tsx`

1. **Remove slate blue borders from inner tray and text inputs** (lines 221, 233, 240, 276, 291, 313):
   - Inner tray: `border border-[#4a5f7f]` → `border-0`
   - Text inputs: `border border-[#4a5f7f]` → `border-t border-black/35` (matching standard input style)
   - Steps divider: `border-t border-[#4a5f7f]` → `border-t border-black/35`

2. **"Add Step" is plain text, not a button** (line 343):
   - Currently: `<button ... className="flex items-center gap-2 text-blue-500 hover:text-blue-300 text-sm mt-3 transition-colors">`
   - Fix: Make it match the standard Add Row button style: `w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all flex items-center justify-center gap-1.5`

3. **"Add New Goal" button** (line 354):
   - Currently: `border-2 border-dashed border-zinc-500 text-blue-500 hover:border-blue-500 hover:bg-blue-500/5 font-medium rounded-xl`
   - Fix: Match the standard dashed add-new button used elsewhere but remove the zinc-500 border color — use `border-[#4a5f7f]` dashed. Actually wait — the user says "old Add New Goal button" and wants it fixed. Make it match the standard Add Row button style (solid, not dashed): `w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl shadow-[...] hover:brightness-110 transition-all flex items-center justify-center gap-1.5`

---

### Batch 4: Custom Freeform sections — remove slate blue borders and label field

**File:** `CharactersTab.tsx` — lines 1850, 1867-1898

1. **Inner tray border**: line 1850 `border border-[#4a5f7f]` → `border-0`
2. **Remove the LABEL text field entirely** from freeform sections (lines 1868-1887). Only keep the large textarea.
3. **Textarea border**: line 1896 `border border-[#4a5f7f]` → `border-t border-black/35` (standard input style, matching `bg-[#1c1c1f]`)
4. Also fix the textarea bg: line 1896 `bg-zinc-900/50` → `bg-[#1c1c1f]` to match standard input color.

---

### Batch 5: Custom Structured sections — remove slate blue borders, fix description color

**File:** `CharactersTab.tsx` — lines 1850, 1972-1979

1. The inner tray border is shared with freeform (same line 1850) — already fixed in Batch 4.
2. **Description field**: line 1979 `bg-zinc-900/50 border border-[#4a5f7f]` → `bg-[#1c1c1f] border-t border-black/35` (standard input style).

---

### Summary: ~20 changes across 4 files

| File | Changes |
|------|---------|
| `CharactersTab.tsx` | 4 toggle uppercase removals, 5 sections get default rows, 2 custom section border/color fixes, freeform label removal |
| `CharacterGoalsSection.tsx` | 6 border fixes, Add Step restyle, Add New Goal restyle |
| `PersonalitySection.tsx` | 2 toggle uppercase removals |
| `GuidanceStrengthSlider.tsx` | Label text to Title Case, 2 uppercase removals |

