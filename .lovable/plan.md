
You’re right — the previous pass missed the actual Character Builder file.

## What I found
A code search shows the remaining bad border styling is still present in:
- `src/components/chronicle/CharactersTab.tsx` — this is the main Character Builder page and still contains the old top-only border pattern throughout the editable fields
- `src/components/chronicle/CharacterEditModal.tsx` — one shared row component still uses the old border style

The specific problem is still the same:
- `border-t border-black/35` creates a top-only border
- `border-x-0 border-b-0` explicitly removes the other sides
- so `focus:border-blue-500` can never render as a clean, constant 4-sided focus state

## Implementation plan
1. Update every editable text field in `CharactersTab.tsx`
   - change `border-t border-black/35` to `border border-black/35`
   - remove every `border-x-0 border-b-0`
   - apply this to all `AutoResizeTextarea` fields and editable extra-row fields in the Character Builder

2. Update the remaining shared row in `CharacterEditModal.tsx`
   - replace its leftover `border-t border-black/35` with `border border-black/35`

3. Do not touch non-input decorative elements unless they are editable fields
   - some read-only label blocks also use the old border pattern; I’ll leave those alone unless you want those visually normalized too
   - the focus bug specifically affects editable inputs/textareas

## Expected result
All editable text inputs on the Character Builder page will match the AI modal styling you approved:
- constant dark 4-sided border at rest
- full, even blue focus border/ring on all sides
- no stronger top edge / fade downward effect

## Scope of the next fix
This pass should specifically finish the Character Builder page properly, instead of only partially updating neighboring files.