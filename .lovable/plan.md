

# Fix: Nested Width Classes Causing Tiny Input Bubbles

## Root Cause

The previous fix in `UI.tsx` applied `className` to both the wrapper `<div>` and the inner `<input>`/`<textarea>`. When a caller passes `className="w-1/3 bg-zinc-900/50 ..."`:

- **Wrapper div**: `cn("w-full", "w-1/3 ...")` resolves to `w-1/3` (correct -- controls the component's width)
- **Inner input**: `cn("w-full rounded-2xl ...", "w-1/3 ...")` resolves to `w-1/3` (WRONG -- input is now 1/3 of an already 1/3 container = tiny bubble)

The visual classes (bg, border, text, placeholder) need to reach the inner element, but width classes must NOT.

## Solution

Force `w-full` on the inner element by appending it LAST in the `cn()` call, so it always wins over any width class in `className`:

```tsx
// Inner element: visual classes from className apply, but width is always full
className={cn(baseClasses, className, "w-full")}
```

Tailwind Merge processes left-to-right, so the final `"w-full"` overrides any `w-1/3` or `w-2/5` from className.

## File Changed

| File | Change |
|------|--------|
| `src/components/chronicle/UI.tsx` | Add `"w-full"` as last argument in `cn()` for inner `<input>` and `<textarea>` elements, forcing them to always fill their wrapper |

This is a two-line fix in the `Input` and `TextArea` components.
