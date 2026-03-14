

## Update Enhance (Sparkles) Buttons to Iridescent AI Style in Physical Appearance Rows

The `HardcodedRow` component's enhance button currently uses a plain style (`text-zinc-400 hover:text-blue-500 hover:bg-blue-500/10`). Per the style guide document, these buttons in physical appearance rows should use the premium iridescent AI button treatment — matching the layered teal/purple gradient border from the "AI Generate" button pattern.

### Changes in `src/components/chronicle/CharactersTab.tsx`

**Update the enhance button in `HardcodedRow` (lines 461-475):**

Replace the simple `p-1.5 rounded-md` button with the layered iridescent design:
- Outer wrapper with `relative overflow-hidden rounded-lg p-[7px]`
- `::before`-equivalent span: iridescent gradient border (90deg, white→teal→white→purple→white)
- `::after`-equivalent span: dark base mask at `inset-[1.5px]` with teal/purple tint (`linear-gradient(90deg, rgba(34,184,200,0.22), rgba(109,94,247,0.22)), #2B2D33`)
- Sparkles icon: `text-cyan-200` with `drop-shadow(0 0 6px rgba(34,184,200,0.5))`, `relative z-10`
- Box shadow: `0 4px 12px rgba(0,0,0,0.40)`
- Hover: `brightness-125`

**Apply the same update to the enhance button in `ExtraRow` (lines 505-520)** so user-added rows match.

This brings both row types in line with the style guide's `.hrow .enhance-btn` specification.

