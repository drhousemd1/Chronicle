

# Update Character Builder Borders to Slate Blue

## Problem
The `border-ghost-white` color is `hsl(210 33% 98% / 0.30)` — a semi-transparent white. On dark backgrounds it renders as a dim, barely-visible border. The user wants all borders inside the character builder sections (label pills, text fields, inner containers, outer containers, section headers) to use solid slate blue `#4a5f7f`.

## Scope
File: `src/components/chronicle/CharactersTab.tsx` only (the character builder page).

## Changes

### 1. `HardcodedSection` component (lines 70-84) — 3 border replacements
- **Line 70**: Outer container `border-ghost-white` → `border-[#4a5f7f]`
- **Line 72**: Header bottom `border-b border-ghost-white` → `border-b border-[#4a5f7f]`
- **Line 84**: Inner card `border border-ghost-white` → `border border-[#4a5f7f]`, also change `bg-[#3a3a3f]/30` to solid `bg-[#2e2e33]` (same fix as the Story Card to prevent border dimming)

### 2. `HardcodedRow` component (lines 108, 132) — 2 border replacements
- **Line 108**: Label pill `border-ghost-white` → `border-[#4a5f7f]`
- **Line 132**: Value text field `border-ghost-white` → `border-[#4a5f7f]`

### 3. `ExtraRow` component (lines 154, 177) — 2 border replacements
- **Line 154**: Editable label `border-ghost-white` → `border-[#4a5f7f]`
- **Line 177**: Editable value `border-ghost-white` → `border-[#4a5f7f]`

**Total**: 7 `border-ghost-white` → `border-[#4a5f7f]` replacements, plus 1 background opacity fix, all within `CharactersTab.tsx`.

