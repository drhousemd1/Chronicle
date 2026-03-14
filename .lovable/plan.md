

## Update PersonalitySection Container Styling

The Personality container uses older flat styling while the other containers (Basics, Physical Appearance, etc.) use the updated `HardcodedSection` pattern with gradient headers, gloss sheens, and inset shadows. Here are the specific differences to fix in `PersonalitySection.tsx`:

### 1. Outer container (line 266)
- **Current**: `shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]`
- **Target**: Add inset edge highlights: `shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]`

### 2. Header bar (line 267)
- **Current**: Flat `bg-[#4a5f7f]` with bottom border
- **Target**: Gradient `bg-gradient-to-b from-[#5a7292] to-[#4a5f7f]` with `border-t border-white/20` and a gloss sheen overlay div (same as `HardcodedSection`)

### 3. Header title (line 268)
- **Current**: `font-semibold tracking-tight`
- **Target**: `font-bold tracking-[-0.015em]` with `relative z-[1]`

### 4. Toggle button (line 270)
- Add `relative z-[1]` so it sits above the gloss overlay

### 5. Inner card (line 277)
- **Current**: `border border-[#4a5f7f]`
- **Target**: Remove border, add inset shadows: `shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]`

### 6. Input fields (lines 100, 124, 131)
- **Current**: `bg-zinc-900/50 border border-[#4a5f7f]`
- **Target**: `bg-[#1c1c1f] border-t border-black/35`

All changes are in `src/components/chronicle/PersonalitySection.tsx` only.

