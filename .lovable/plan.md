

# Fix Public Profile Avatar Buttons and Remove Toasts

## Problem 1: Toasts

Multiple toast notifications fire on save and avatar upload. The user has asked repeatedly to not use toasts.

## Problem 2: Button Layout

The `[&>div]:flex-col` CSS override on the `AvatarActionButtons` wrapper is forcing the "Upload Image" and "AI Generate" buttons to stack vertically. The character builder uses them **side-by-side** (the component's default `flex gap-2` row layout), and shows a "Reposition" button below only when an avatar image exists. The profile page should match this pattern exactly.

## Changes

### File: `src/components/account/PublicProfileTab.tsx`

**1. Remove all toast calls**

- Line 50: Remove `const { toast } = useToast();`
- Line 3: Remove the `useToast` import
- Line 134: Remove `toast({ title: 'Profile saved', ... })`
- Line 136: Remove `toast({ title: 'Save failed', ... })`
- Line 155: Remove `toast({ title: 'Avatar updated' })`
- Line 157: Remove `toast({ title: 'Upload failed', ... })`
- Line 182: Remove `toast({ title: 'Avatar updated' })`
- Line 184: Remove `toast({ title: 'Upload failed', ... })`
- Line 191: Remove `toast({ title: 'Upload failed', ... })`

**2. Fix button layout -- remove the `[&>div]:flex-col` override**

Line 250: Change:
```tsx
<div className="w-48 [&>div]:flex-col">
```
To:
```tsx
<div className="flex flex-col gap-2 w-full">
```

This matches the character builder pattern (CharactersTab.tsx line 662) where the buttons sit inside `flex flex-col gap-2 w-full` -- the `AvatarActionButtons` renders its own inner `flex gap-2` row, and the outer column wrapper just stacks additional items (like Reposition) below.

**3. Add a "Reposition" button below the action buttons (when avatar exists)**

After the `AvatarActionButtons` component, add a Reposition button that only shows when `profile.avatar_url` exists -- matching the character builder pattern (CharactersTab.tsx lines 678-686). This requires adding `isRepositioning` state and drag-to-reposition functionality for the avatar, plus storing `avatar_position` in the profile.

However, since the profile avatar doesn't currently support repositioning (no `avatar_position` field in the profiles table), we will skip the Reposition button for now and just fix the layout to be side-by-side.

**4. Update the avatar column width**

The `w-48` wrapper is fine for the avatar square, but the buttons wrapper should just be `w-full` within the column so buttons get the full width of the avatar column.

## Summary of final layout

```text
[  Avatar Image (w-48 h-48)  ]
[ Upload Image | AI Generate ]  <-- side by side, matching character builder
```

No stacking, no `flex-col` override, no toasts.
