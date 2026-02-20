

# Fix Profile Avatar Buttons Layout

## Problem

The avatar and its action buttons are locked inside a `w-36` (144px) column. Two buttons side-by-side in 144px leaves roughly 72px each, causing text to truncate to "U.." and "A.." -- completely unreadable.

## Changes

### File: `src/components/account/PublicProfileTab.tsx`

1. **Widen the avatar column** from `w-36` to `w-48` (192px) for both the avatar square and the button container. This gives each button ~96px minus gaps, which is enough for the text.

2. **Increase the avatar square** from `w-36 h-36` to `w-48 h-48` to match the wider column and look proportional.

3. **Stack buttons vertically** by changing the `AvatarActionButtons` wrapper or the component's internal flex direction. Since we shouldn't modify the shared component (used by character builder too), we wrap it in a container that forces vertical stacking via CSS:
   - Add a wrapper `div` with class `[&>div]:flex-col` around `AvatarActionButtons` to override the internal `flex gap-2` row layout to a column layout.

This way each button gets the full 192px width instead of splitting it, and both "Upload Image" and "AI Generate" text will display fully.

### No other files change

The `AvatarActionButtons` component itself stays untouched since it's shared with the character builder where the current layout works fine.

