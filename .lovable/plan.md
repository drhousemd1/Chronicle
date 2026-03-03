

# Replace TestAMockup with Codex's Exact Code

## What went wrong

Every previous attempt tried to mix Tailwind classes and theme tokens. The Codex-provided file (`OptionA.lovable.tsx`) uses **zero Tailwind classes** — it's entirely inline `style` objects with explicit hex colors, pixel sizes, and layout values. That's the only way to guarantee the exact look regardless of theme context.

## Plan

**Replace `src/components/chronicle/TestAMockup.tsx` entirely** with the contents of the uploaded `OptionA.lovable.tsx`, with two small adaptations:

1. Copy the file as-is (inline styles, inline SVG icons, explicit colors)
2. Rename the export from `OptionALovable` to `TestAMockup` (named export) so existing imports don't break
3. Make the value fields editable (`<input>` instead of static `<div>`) using the same `useState` pattern, but styled with the exact inline styles from the Codex file

### Key differences from current code

| Aspect | Current (broken) | Codex file (correct) |
|--------|------------------|----------------------|
| Styling method | Tailwind classes | Inline `style` objects |
| Card background | `bg-[#1c1c1e]` class | `background: "#15181e"` inline |
| Card border | `border-white/10` class | `border: "1px solid #2f3440"` inline |
| Border radius | `rounded-lg` (8px) | `borderRadius: 20` (20px) |
| Label height | auto (~36px) | `height: 52` (52px) |
| Label background | theme token | `background: "#232730"` inline |
| Label border | theme token | `border: "1px solid rgba(255,255,255,0.14)"` |
| Value field border | theme token | `border: "1px solid rgba(255,255,255,0.14)"` |
| Icon color | `text-muted-foreground` | `color: "#9da5b5"` inline |
| Title size | `text-2xl` (24px) | `fontSize: 54` (54px) |
| Row grid | `grid-cols-[160px_28px_1fr_28px]` | `gridTemplateColumns: "minmax(220px,360px) 24px minmax(0,1fr) 24px"` |
| Add button | Tailwind dashed border | Inline dashed border with explicit colors |

### What stays the same
- The field data array (same 11 rows)
- Sparkles / Lock / Plus icons (Codex uses inline SVGs instead of lucide-react)
- The editable input behavior (will add `useState` + `onChange` to value fields using the Codex inline styles)

No other files need to change.

