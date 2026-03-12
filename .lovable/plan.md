

# Vertically Center "Created by" Text & Unify to Ghost White 70%

## Problem
The "Created by: Dr. House" text sits top-aligned (`items-start`) next to the avatar circle, and uses mixed colors (`#94a3b8` for label, `#4a5f7f` for name). It should be vertically centered with the avatar, and all text should be ghost white at 70% opacity.

## Changes

**File: `src/components/chronicle/StoryDetailModal.tsx`**

1. **Line 429** — Change `items-start` to `items-center` on the button flex container
2. **Lines 445-447** — Change both text colors to `rgba(248,250,252,0.7)`:
   ```tsx
   <p className="text-sm text-[rgba(248,250,252,0.7)] group-hover:text-white transition-colors">
     Created by: <span className="text-[rgba(248,250,252,0.7)] font-medium">{publisher.display_name || publisher.username || 'Anonymous'}</span>
   </p>
   ```

Two small edits in one file.

