
Goal: make `TestAMockup` match your uploaded reference (`image-45.png`) exactly for borders and input fields, while keeping fields editable.

What I found (root cause)
1. The current `src/components/chronicle/TestAMockup.tsx` is the “Lovable-safe” inline-style version (large typography, 52px fields, 20px radius, maxWidth 1120).
2. Your uploaded “try this” reference (`Untitled_document_1-2.md`) is a different visual system:
   - shadcn-scale card sizing (`rounded-xl`, `text-2xl`, `text-sm`)
   - tighter rows (`h-9`, `rounded-md`, `gap-3`)
   - token-based borders/inputs (`border-input`, `dark:bg-input/30`)
3. That reference also depends on local dark-token context (`.dark` + specific token values). This app does not globally enforce that same token set for this section, which is why previous versions drifted visually.

Implementation approach
1. Rebuild `TestAMockup.tsx` from the uploaded reference structure (not the current inline-style file):
   - card/header/content/footer hierarchy
   - row grid: `minmax(180px,220px) 24px minmax(0,1fr) 24px`
   - same label/value/icon arrangement as the reference
2. Keep editable behavior:
   - preserve `useState` values map
   - render value column as `<input>` (not static `<div>`) with reference-equivalent classes
3. Lock in visual fidelity without relying on global app theme:
   - add a local `.dark` scope wrapper inside this component
   - provide local CSS variable overrides on the wrapper (the exact reference values for `--card`, `--border`, `--input`, `--muted-foreground`, etc.)
   - this ensures borders and input backgrounds render exactly like your reference even if the rest of the app theme differs
4. Remove conflicting old styling:
   - delete current `styles` object-based large sizing system
   - remove `maxWidth: 1120`, large 54/26 typography, and 52px field heights
5. Keep icons and semantics aligned:
   - keep the same sparkle/lock/plus icon shapes
   - set icon sizing/color to match the reference classes (`h-4/h-5`, muted foreground)
6. Keep row scrolling behavior consistent:
   - use reference-equivalent scroll container sizing and spacing
   - keep clean overflow behavior so long values still look right

File changes (planned)
- `src/components/chronicle/TestAMockup.tsx` only.

Validation checklist after implementation
1. Card shell:
   - correct corner radius (rounded-xl-like), border tone, and dark card fill
2. Header:
   - title/subtitle scale matches screenshot (smaller than current oversized variant)
3. Rows:
   - label and input height/rounding match (`h-9` / `rounded-md` feel)
   - border contrast matches screenshot (not too bright, not too faint)
4. Inputs:
   - editable, full width, no layout shift
   - text color and placeholder tone match reference
5. Add Row button:
   - dashed border and muted text match screenshot
6. Regressions:
   - no white fallback card in this section
   - component still renders correctly inside `CharactersTab`

Technical notes
- I will convert the uploaded markdown-style HTML reference into clean React/Tailwind JSX (the upload includes escaped markdown formatting that cannot be pasted directly as-is).
- I will scope dark tokens locally to this component so it is deterministic and does not depend on app-wide dark mode toggles.
- No backend/database/auth changes are needed.
