

# Replace Slate Blue with Zinc-500 on Story Card Borders Only

## Findings

**Add Custom button border color**: `border-zinc-500` which resolves to `#71717a`. This is standard Tailwind zinc-500 and was indeed the conventional border gray used for dashed/dotted borders before the slate blue (`#4a5f7f`) standardization.

**Confirmed match**: zinc-500 (`#71717a`) was the previous border color for these elements.

## Changes — Single File: `src/components/chronicle/WorldTab.tsx`

Four border color replacements, all within the Story Card section only. No other property changes.

| Line | Current | New | Border Type |
|------|---------|-----|-------------|
| 509 | `border border-[#4a5f7f]` | `border border-zinc-500` | Solid (outer container) |
| 518 | `border border-[#4a5f7f]` | `border border-zinc-500` | Solid (inner card) |
| 539 | `border-2 border-[#4a5f7f]` | `border-2 border-zinc-500` | Solid (cover with image) |
| 563 | `border-2 border-dashed border-[#4a5f7f]` | `border-2 border-dashed border-zinc-500` | Dashed (cover placeholder) |

**Not touched**: Header bar background (`bg-[#4a5f7f]` on line 511), text field borders, Character Builder, or anything else.

