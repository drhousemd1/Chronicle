

# Fix Avatar Button Text Truncation

## Problem

The avatar column is `w-64` (256px). The two side-by-side buttons ("Upload Image" and "AI Generate") each get ~120px after accounting for gaps and padding, which truncates "Upload Image" to "Upload Ima...".

## Fix

Increase the avatar column and avatar container from `w-64` to `w-72` (288px). This gives each button ~136px -- enough room for both labels to display fully.

## Technical Changes

### `src/components/account/PublicProfileTab.tsx`

Three changes (all on existing lines):

1. **Line 298** -- Avatar column wrapper: `w-64` to `w-72`
2. **Line 302** -- Avatar container: `w-64 h-64` to `w-72 h-72`

That's it -- two class changes, no logic changes.
