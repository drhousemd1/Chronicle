
Implementation plan to fix the clipping correctly (without just scaling everything up):

1) Rework modal width so “wider” does not inflate thumbnail size
- File: `src/components/chronicle/SidebarThemeModal.tsx`
- Change `DialogContent` from fixed `sm:max-w-6xl` behavior to an explicit viewport-capped width:
  - Use `w-[min(96vw,1280px)] max-w-none ...`
- Keep 7 thumbnails per row on desktop (`md:grid-cols-7`) exactly as requested.

2) Fix the real clipping cause: selection halo is outside the tile box
- Current selected tiles use `ring-offset-2 ring-offset-zinc-900`, which renders outside and gets clipped.
- Update selected tile styles (both default tile and uploaded tiles) to use an inset selection style:
  - Replace offset ring with `ring-2 ring-blue-400 ring-inset` (and keep border accent).
- This keeps the blue selection visible without requiring extra overflow space.

3) Prevent scrollbar from sitting on top of thumbnails
- Current scroll container only has `pr-1`, so right-side content collides with scrollbar.
- Split scroll region into outer scroll + inner padded content:
  - Outer: `max-h-[460px] overflow-y-auto [scrollbar-gutter:stable]`
  - Inner wrapper around grid: `px-2 py-2 pr-6`
- Result: stable right gutter and no scrollbar overlap on thumbnails.

4) Keep thumbnails fitting cleanly at 7 columns
- Keep `aspect-[1/3]` and `object-cover` (portrait fit).
- Slightly tighten spacing if needed (`gap-3` → `gap-2.5`) only if rightmost column still feels crowded at common desktop widths.

5) Clean up visible copy artifact
- Fix the corrupted helper text line:
  - `Recommended: 300px × 1080px (portrait orientation)`

Validation checklist after implementation
- Open Sidebar Theme modal at desktop width.
- Confirm exactly 7 thumbnails per row.
- Select first and last thumbnails: blue selection ring is fully visible (no side clipping).
- Scroll: scrollbar never overlays the thumbnail content.
- Confirm upload button label sizing remains `text-[10px]`.
