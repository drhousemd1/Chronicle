

## Remove Keep Badge on Click

Simple change: make the "Keep" pill clickable so clicking it removes the keep status.

### Change in `StyleGuideTool.tsx` (line ~38)

Turn the Keep pill `<span>` into a `<button>` that calls `ctx.onRemoveKeep(cardName)` on click, with a small "×" indicator or just click-to-remove behavior.

### Changes needed:

1. **`EditsContext`** — add `onRemoveKeep: (cardName: string) => void` to the context value
2. **`CardEditOverlay`** (line 38) — change the Keep pill from a `<span>` to a `<button>` that calls `ctx.onRemoveKeep(cardName)` with `e.stopPropagation()`. Add an `×` after the text and a hover:brightness effect so it's obvious it's interactive.
3. **Provider setup** — wherever the EditsContext.Provider is created, add the `onRemoveKeep` handler that calls `removeKeep(cardName)` and refreshes the keeps state.

