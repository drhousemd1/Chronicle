

# Increase Lock Icon Visibility

## Problem
The lock icons use `text-zinc-600` which is too faint against the dark background, making them hard to see.

## Solution
Change the lock icon color from `text-zinc-600` to `text-zinc-400` in both files. This matches the visibility intensity of the X delete button (`text-red-400`) and the hard-coded label text, making the locks clearly recognizable without being overpowering.

## Changes

### `src/components/chronicle/CharactersTab.tsx`
Line ~131: Change `text-zinc-600` to `text-zinc-400` on the Lock icon.

### `src/components/chronicle/CharacterEditModal.tsx`
Line ~136: Same change — `text-zinc-600` to `text-zinc-400` on the Lock icon.

Two one-word changes total.
