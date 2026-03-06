
## Plan: Fix tooltip clipping correctly (root-cause fix, not another side flip)

### What I found (critical-thinking diagnosis)
- The issue is not the `side` value (`top/right/bottom`) by itself.
- The shared tooltip component (`src/components/ui/tooltip.tsx`) renders `TooltipPrimitive.Content` **without** a portal.
- In chat, that means the tooltip stays inside local stacking/overflow contexts:
  - Global left nav in `src/pages/Index.tsx` has `z-50` and sits above main content.
  - Chat sidebar in `src/components/chronicle/ChatInterfaceTab.tsx` uses `overflow-hidden`.
- So repositioning only moves the tooltip to a different clipped/overlapped location.

### Implementation changes

1) **Fix the shared tooltip primitive (real solution)**
- File: `src/components/ui/tooltip.tsx`
- Wrap `TooltipPrimitive.Content` in `TooltipPrimitive.Portal`.
- Keep existing animation classes, but raise stacking safety slightly (e.g. `z-[80]`) so tooltips consistently appear above nav/surfaces.
- Add collision safety defaults (`collisionPadding`) so near-edge tooltips auto-shift cleanly.

2) **Stabilize this specific chat tooltip placement**
- File: `src/components/chronicle/ChatInterfaceTab.tsx` (mode hint tooltip near line ~3239)
- Keep `side="bottom"` and add `align="start"` so the bubble grows to the right from the icon instead of centering into crowded left space.
- Keep constrained width, but align with your tooltip style pattern (`max-w-[300px]`, `text-xs`, `font-semibold`, `leading-relaxed`, `normal-case`, `tracking-normal`) for consistency.

3) **Documentation sync (required by project guide rules)**
- File: `docs/guides/chat-interface-page-structure-guide.md`
- Update relevant sections to reflect:
  - Mode hint now uses robust tooltip behavior via shared portalized tooltip component.
  - Known issue entry updated/resolved for clipping behind left nav/background layers.

### Manual inspection checklist (explicitly requested)
After implementing, manually verify in preview:
1. Open **My Stories → Play** to enter chat interface.
2. Hover mode info icon in day/time panel:
   - Tooltip is fully visible.
   - Not clipped by sidebar/background image.
   - Not hidden behind global left nav.
3. Repeat with global nav **expanded and collapsed**.
4. Repeat at two viewport sizes (desktop + narrower desktop).
5. Spot-check one other tooltip (e.g. chat settings) to confirm no regression from shared tooltip portal change.

### Why this will work
- Portal moves tooltip rendering to top-level DOM, escaping local overflow and sibling stacking traps.
- `align="start"` + collision padding prevents awkward edge placement.
- This addresses the actual rendering layer problem instead of repeatedly changing direction.
