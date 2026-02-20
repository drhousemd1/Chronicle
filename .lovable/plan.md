

# Fix Public Profile Page Width

## Problem

The Public Profile tab has a `max-w-4xl` (896px) container constraint that prevents it from filling the available space on widescreen displays. This causes the avatar action buttons ("Upload Image" and "AI Generate") to be cramped/squished.

## Solution

Remove the `max-w-4xl` width cap from the outer container in `PublicProfileTab.tsx` so the content fills the full width of the panel, matching how other tabs in the app behave.

## Change

**File: `src/components/account/PublicProfileTab.tsx`**

- Change the outer `div` class from `max-w-4xl mx-auto space-y-6` to just `space-y-6`
- This removes the artificial width ceiling and lets the profile section, published works grid, and buttons use the full available width

Single line change -- swap `max-w-4xl mx-auto` out of the container class.

