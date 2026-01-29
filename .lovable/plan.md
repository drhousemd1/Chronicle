
# Update Image Library Picker Modal - Folder Card Styling

## Problem

When clicking "Upload from Library", the popup modal displays folder cards using a simple, cropped thumbnail style that doesn't match the premium card design used in the actual Image Library page.

## Current vs Target

| Current (Picker Modal) | Target (Image Library Page) |
|------------------------|----------------------------|
| Cropped 4:3 aspect ratio | Tall 2:3 portrait cards |
| Small rounded corners | Large `rounded-[2rem]` corners |
| Minimal shadow | Premium shadow effect |
| Simple gradient overlay | Rich gradient from bottom |
| Small plain text | Bold typography with blue badge |
| No hover effects | Lift animation on hover |

## Solution

Update the folder card rendering in `ImageLibraryPickerModal.tsx` to match the card style from `ImageLibraryTab.tsx`.

## Changes to Implement

**File: `src/components/chronicle/ImageLibraryPickerModal.tsx`**

Replace the folder grid (lines 183-208) with the premium card design:

### Key styling changes:
- Change `aspect-[4/3]` to `aspect-[2/3]` for portrait orientation
- Change `rounded-xl` to `rounded-[2rem]` for larger corners
- Add premium shadow: `shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]`
- Add hover lift animation: `group-hover:-translate-y-2 group-hover:shadow-2xl`
- Update gradient overlay: `bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent`
- Add blue image count badge
- Use larger, bolder typography for folder name
- Show folder description if available

### Grid layout adjustment:
- Change from `grid-cols-2 sm:grid-cols-3` to `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`
- Add appropriate gap: `gap-6`

### Empty folder state:
- Match the dark background with centered icon style

## Summary

This change ensures visual consistency between the Image Library Picker modal and the main Image Library page, providing users with the same premium folder card experience in both places.
