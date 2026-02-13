

# Add Lock Icon to Hard-Coded Rows

## What Changes
Replace the invisible spacer `div` in `HardcodedRow` with a small `Lock` icon from lucide-react. This serves two purposes: it fills the previously empty column space, and it gives users a clear visual cue that the label is not editable.

## Changes

### `src/components/chronicle/CharactersTab.tsx` (line ~128-129)

Replace:
```tsx
<div className="w-7 flex-shrink-0" />
```

With:
```tsx
<div className="w-7 flex-shrink-0 flex items-center justify-center">
  <Lock className="w-3.5 h-3.5 text-zinc-600" />
</div>
```

Add `Lock` to the existing lucide-react import.

### `src/components/chronicle/CharacterEditModal.tsx` (line ~134-135)

Same replacement -- swap the invisible spacer for the Lock icon. Add `Lock` to the lucide-react import.

---

Two lines changed per file. No other files affected.
