

# Redesign Creator Profile to Match Public Profile Tab Layout

## Problem

The Creator Profile page (`/creator/:userId`) currently uses a compact horizontal layout with a small circular avatar next to the name. It should mirror the Public Profile tab's layout structure but as a read-only view -- same positioning, same visual hierarchy, just without edit controls.

## Changes

### `src/pages/CreatorProfile.tsx` -- Full layout overhaul

**Profile Info Section** -- Replace the current compact header with a card matching the Public Profile tab:

- Wrap in a `bg-[#1e1e22] rounded-2xl border border-white/10 p-6` card (same as PublicProfileTab line 295)
- Left column: Square `w-72 h-72 rounded-2xl` avatar container with `object-cover` and `objectPosition` from `avatar_position` -- no upload/reposition buttons
- Right column: Read-only fields styled identically to PublicProfileTab but without inputs:
  - **Creator** label (replacing "Display Name") with the display name as plain text
  - **About Me** label with the bio as plain text
  - **Preferred Genres** label with genre pills (read-only, no "x" remove buttons, no add input)
  - Follow/Unfollow button positioned after the creator name

**Data changes:**
- Add `avatar_position` to the profiles select query
- Parse and use `avatar_position` for `objectPosition` on the avatar image

**Stats and Published Works** -- Keep as-is (already match the desired layout).

### Specific layout details

```
+--Card (bg-[#1e1e22] rounded-2xl)------------------+
|  +--w-72 h-72--+   CREATOR: Dr. House [Follow]    |
|  |             |   ABOUT ME: Bio text here...       |
|  |   avatar    |   PREFERRED GENRES: [Fantasy] [RPG]|
|  |             |                                    |
|  +-------------+                                    |
+----------------------------------------------------+
```

- Labels use `text-xs font-bold text-white/40 uppercase tracking-wider w-28 shrink-0`
- Values use `text-white text-sm`
- Rows use `flex items-center gap-2` (same as PublicProfileTab)
- Avatar fallback: solid `bg-zinc-800` with large initials (no dashed border since there's no upload action)
