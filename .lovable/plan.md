

# Avatar Styling + AI Generate + Move Account Button to Sidebar

## Overview

Three changes in one pass:

1. **Replace the circular avatar** on the Public Profile tab with the square `rounded-2xl` dashed-border style used in the character builder
2. **Add "Upload Image" and "AI Generate" buttons** below the avatar using the existing `AvatarActionButtons` and `AvatarGenerationModal` components
3. **Move the AccountButton from the header to the bottom of the left sidebar**, removing header clutter

---

## Change 1: Avatar Styling on Public Profile

**File: `src/components/account/PublicProfileTab.tsx`**

Replace the circular `Avatar`/`AvatarFallback` (lines 184-194) with a square container:

- `w-36 h-36 rounded-2xl` with `bg-zinc-800 border-2 border-dashed border-zinc-600` when empty (shows initials in muted text)
- When avatar exists: full `object-cover` image display
- Remove the simple hover camera overlay -- the action buttons below handle uploads instead
- Remove the `Avatar`, `AvatarImage`, `AvatarFallback`, and `Camera` imports (no longer needed)

## Change 2: Add AvatarActionButtons + AvatarGenerationModal

**File: `src/components/account/PublicProfileTab.tsx`**

Below the avatar container, render the existing `AvatarActionButtons` component (Upload Image dropdown + AI Generate button), and the `AvatarGenerationModal`.

- Import `AvatarActionButtons` and `AvatarGenerationModal`
- Add a hidden file input ref for the "From Device" path
- Wire `onUploadFromDevice` to trigger the hidden file input (reuses existing `handleAvatarUpload`)
- Wire `onSelectFromLibrary` to upload the selected library image URL to the `avatars` bucket and update the profile
- Wire `onGenerateClick` to open the `AvatarGenerationModal`
- Wire `onGenerated` callback to upload the generated image to the `avatars` bucket and update the profile
- Pass `characterName={profile.display_name || 'User'}` and `modelId=""` (uses default)
- The buttons container width matches the avatar width (`w-36`)

## Change 3: Move Account Button to Sidebar

**File: `src/pages/Index.tsx`**

### Remove from header (line ~1505-1514)
Delete the `AccountButton` component from the header's right-side button group. This eliminates the clutter visible in the screenshot.

### Add to sidebar bottom (line ~1318-1322)
Replace the current email-only display at the sidebar bottom with a clickable account button:

- **Expanded sidebar**: Shows a small avatar circle (28px) + display name, with a dropdown menu containing "Public Profile", "Account Settings", and "Sign Out"
- **Collapsed sidebar**: Shows just the small avatar circle, same dropdown on click
- Reuse the `AccountButton` component directly (it already renders an avatar + dropdown menu) -- just place it in the sidebar bottom section instead of the header
- Remove the plain `user?.email` text display since AccountButton already shows the user info

### Fetch profile data
The `AccountButton` component already fetches the user's profile (display_name, avatar_url) internally, so no additional data fetching is needed in Index.tsx.

---

## Files Modified

| File | Change |
|---|---|
| `src/components/account/PublicProfileTab.tsx` | Replace circular avatar with square dashed-border style; add AvatarActionButtons + AvatarGenerationModal below avatar |
| `src/pages/Index.tsx` | Remove AccountButton from header; add it to sidebar bottom section; remove email text display |

No database changes needed.

