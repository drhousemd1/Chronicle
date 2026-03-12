
Goal: stop the hover dark panel exactly at the real title position (not a guessed %), so it darkens the image behind the text instead of sitting above/over the text block.

Plan

1) Remove the percentage-based overlay height
- File: `src/components/chronicle/StoryHub.tsx` (`ScenarioCard`)
- Replace the current `h-[25%]` slide-up overlay approach with a position driven by the actual title element location.

2) Measure real title position in the card
- Add refs:
  - `cardRef` on the card container (`relative` card wrapper)
  - `titleRef` on the `<h3>` title
- Add state: `overlayTopPx`
- Use `useLayoutEffect` + `ResizeObserver` (and window resize fallback) to compute:
  - `overlayTopPx = titleTopInCard - smallOffset`
- This makes the overlay top boundary lock to the true rendered title position across screen sizes, font changes, and line wrapping.

3) Render overlay using top+bottom (no hardcoded height)
- Keep overlay absolute at bottom, but set inline `top` from measured value:
  - `style={{ top: overlayTopPx }}`
- Keep animation behavior:
  - default hidden below (`translate-y-full`)
  - on hover slide up (`group-hover:translate-y-0`)
- Keep opacity at `bg-black/70`.

4) Fix layering so text stays readable
- Ensure stacking order is explicit:
  - base full-card readability overlay stays as-is (`bg-black/40`)
  - animated dark panel above image/base overlay
  - bottom text container above animated panel (`z-[2]`)
  - hover action buttons remain topmost (`z-10`)
- Result: panel darkens only the background region behind title/meta, not the text itself.

5) Validation checklist
- Hover: dark panel rises and stops just above title.
- Not hovered: panel slides back down out of view.
- Buttons remain unaffected and visible.
- Works at your current viewport and responsive breakpoints without retuning percentages.

Technical details (implementation scope)
- `src/components/chronicle/StoryHub.tsx` only.
- Add: `useLayoutEffect`, refs, `ResizeObserver` logic, overlay style driven by measured `top`.
- Remove dependence on `h-[25%]`/`h-[45%]` guessing entirely.
