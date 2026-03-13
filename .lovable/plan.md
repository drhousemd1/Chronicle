

# Update Story Card Input Field Borders to Zinc-500

## Summary
The Story Name and Brief Description text fields inside the Story Card container still use the old slate blue (`border-[#4a5f7f]`) for their non-error border state. These need to match the `border-zinc-500` applied in the previous change.

## Changes — Single File: `src/components/chronicle/WorldTab.tsx`

| Line | Field | Current (non-error) | New |
|------|-------|---------------------|-----|
| 590 | Story Name | `border-[#4a5f7f]` | `border-zinc-500` |
| 597 | Brief Description | `border-[#4a5f7f]` | `border-zinc-500` |

No other properties touched. Error states (`border-red-500`) unchanged. No other file modified.

