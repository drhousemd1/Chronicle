

## Plan: Fix Sidebar Theme Grid — 5 Columns, Scrollable, Constrained Height

### Changes (single file: `SidebarThemeModal.tsx`)

1. **Widen the modal** from `sm:max-w-2xl` to `sm:max-w-4xl` to fit 5 columns comfortably.
2. **Change grid to 5 columns**: `grid-cols-3 md:grid-cols-5` with smaller gap (`gap-3`).
3. **Make the grid area scrollable** with a fixed max-height (~two rows of portrait tiles). Wrap the grid content area in `overflow-y-auto` with `max-h-[460px]` so it shows roughly 2 rows and scrolls for more.
4. **Reduce tile aspect ratio slightly** to `aspect-[2/3]` so tiles aren't excessively tall at the narrower column width.

