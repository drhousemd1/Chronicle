

# Replace All Remaining `border-ghost-white` with Slate Blue `#4a5f7f`

Three files still have `border-ghost-white` on internal elements. Total: ~85 in CharactersTab, ~37 in CharacterGoalsSection, ~36 in PersonalitySection. Also need to fix `bg-[#3a3a3f]/30` backgrounds to solid `bg-[#2e2e33]` so borders render at full opacity.

---

## File 1: `src/components/chronicle/CharactersTab.tsx` (~85 replacements)

### Avatar Section (lines 667-903)
- **Line 667**: Outer container `border border-ghost-white` → `border border-[#4a5f7f]`
- **Line 669**: Header `border-b border-ghost-white` → `border-b border-[#4a5f7f]`
- **Line 680**: Inner card `border border-ghost-white` + `bg-[#3a3a3f]/30` → `border border-[#4a5f7f]` + `bg-[#2e2e33]`
- **Line 686**: Avatar image border `border-2 border-ghost-white` → `border-2 border-[#4a5f7f]`
- **Lines 805, 809, 814, 819, 823, 827, 831, 895**: All text input fields `border border-ghost-white` → `border border-[#4a5f7f]`
- **Line 903**: Collapsed avatar thumbnail `border border-ghost-white` → `border border-[#4a5f7f]`

### Custom Sections (lines 1206-1367)
- **Line 1206**: Outer container `border border-ghost-white` → `border border-[#4a5f7f]`
- **Line 1208**: Header `border-b border-ghost-white` → `border-b border-[#4a5f7f]`
- **Line 1237**: Inner card `border border-ghost-white` + `bg-[#3a3a3f]/30` → `border border-[#4a5f7f]` + `bg-[#2e2e33]`
- **Line 1246**: Freeform textarea `border border-ghost-white` → `border border-[#4a5f7f]`
- **Line 1264**: Structured label input `border border-ghost-white` → `border border-[#4a5f7f]`
- **Line 1313**: Structured value input `border border-ghost-white` → `border border-[#4a5f7f]`

**Approach**: Global find-and-replace `border-ghost-white` → `border-[#4a5f7f]` and `bg-[#3a3a3f]/30` → `bg-[#2e2e33]` within the Avatar section and Custom Sections only (the HardcodedSection/HardcodedRow/ExtraRow components were already fixed).

---

## File 2: `src/components/chronicle/CharacterGoalsSection.tsx` (~37 replacements)

Global replace all `border-ghost-white` → `border-[#4a5f7f]` and all `bg-[#3a3a3f]/30` → `bg-[#2e2e33]`:
- **Line 206**: Outer container
- **Line 208**: Header divider
- **Line 220**: Collapsed inner card
- **Line 232**: Expanded goal card (read-only state)
- **Lines 245, 268**: Goal name + desired outcome textareas
- **Line 283**: Steps section divider
- **Line 305**: Step description textarea

---

## File 3: `src/components/chronicle/PersonalitySection.tsx` (~36 replacements)

Global replace all `border-ghost-white` → `border-[#4a5f7f]` and all `bg-[#3a3a3f]/30` → `bg-[#2e2e33]`:
- **Line 100**: Trait name input
- **Line 123**: Trait description input
- **Line 130**: Flexibility dropdown
- **Line 159**: Sub-heading divider
- **Line 265**: Outer container
- **Line 266**: Header divider
- **Line 276**: Inner card
- **Line 283**: Split toggle container

