

# Update CharacterEditModal Header, Toggle Pills, and AI Button

## Color Verification Protocol

**Header background (current)**:
- File: `src/components/chronicle/CharacterEditModal.tsx`, line 1050
- Value: `bg-black`
- Target: `bg-white` (matching standard light headers)

**Header text (current)**:
- Line 1054: `text-white` on DialogTitle
- Line 1057: `text-white/70` on subtitle
- Target: `text-black` / `text-black/70`

**Toggle active pill (current)**:
- Lines 1073, 1085: `bg-[#4a5f7f] text-white shadow-sm`
- Target: gradient + gloss treatment matching My Stories / Gallery pills

**Toggle inactive pill (current)**:
- Lines 1074, 1086: `text-zinc-400 hover:text-zinc-200`
- Target: needs `border-t border-transparent` for smooth transitions; text colors need updating for white banner context (`text-zinc-500 hover:text-zinc-700`)

**AI Update button text size (current)**:
- Line 1106: `text-[10px]`
- Standard AI Generate (AvatarActionButtons.tsx, line 80): `text-xs font-bold`
- Also missing: `hover:brightness-125 transition-all` (present in standard AI Generate buttons)

---

## Changes — `src/components/chronicle/CharacterEditModal.tsx`

### 1. Header banner: black → white (line 1050)
- Change `bg-black` to `bg-white`
- Line 1054: `text-white` → `text-black`
- Line 1057: `text-white/70` → `text-black/70`

### 2. Toggle pills: add gradient + gloss (lines 1070-1090)
Active state:
```
"relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 text-white shadow-sm"
```
Plus gloss sheen div and `<span className="relative z-[1]">` wrapper on label.

Inactive state (adjusted for white banner context):
```
"border-t border-transparent text-zinc-500 hover:text-zinc-700"
```

### 3. AI Update button: fix text size + add hover (line 1105-1106)
- Change `text-[10px]` → `text-xs`
- Confirm `font-bold` is present (it is)
- Add `hover:brightness-125 transition-all` to match standard AI Generate buttons

### Files Changed
- `src/components/chronicle/CharacterEditModal.tsx`

