

## Fix AI Generate Button Card

The current entry uses completely wrong styling — inline `style` with wrong gradient direction (`135deg`) and wrong hex colors (`#6366f1, #8b5cf6, #a855f7`). The actual button from `UI.tsx` uses Tailwind classes: `bg-gradient-to-r from-purple-600 via-violet-500 to-blue-500 text-white border-0 shadow-lg` with `rounded-xl px-4 py-2 text-sm font-semibold`.

### Changes (lines 1053-1065)

1. **Name**: `"AI Generate Gradient"` → `"AI Generate"`
2. **Preview**: Replace inline `style` with actual Tailwind classes matching the real `UI.tsx` gradient variant, plus a drop shadow
3. **Button Color**: Fix to `bg-gradient-to-r from-purple-600 via-violet-500 to-blue-500` (left-to-right, not 135deg)
4. **Size**: Fix to `h-auto × px-4 py-2 — rounded-xl (12px)` matching actual `text-sm font-semibold` (not `text-[10px] font-bold uppercase`)
5. **Visual Effects**: Update to include `shadow-lg` (it does have a box-shadow)
6. **Preview button**: Use Tailwind classes directly instead of inline styles, add drop shadow

