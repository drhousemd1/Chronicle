

# Standardize Trash Button Styling in Image Library

## Problem
Two trash buttons in `ImageLibraryTab.tsx` are inconsistent with the app's current icon button pattern:

1. **Folder-level trash** (line 526): `rounded-full bg-black/40 text-[rgba(248,250,252,0.3)]` — circular, muted icon
2. **Image-level trash** (line 675): `bg-rose-500 text-white rounded-lg` — solid red background

Both should match the pencil-icon pattern (image 1): a square-padded `rounded-xl` shape with a semi-transparent `bg-black/40` background and a vibrant white icon.

## Changes — `src/components/chronicle/ImageLibraryTab.tsx`

### Line 526 — Folder delete button
Change from:
`rounded-full bg-black/40 text-[rgba(248,250,252,0.3)] hover:text-rose-500 hover:bg-black/60 ... hover:rotate-12`

To:
`rounded-xl bg-black/40 text-white hover:text-rose-400 hover:bg-black/60 ... transition-all duration-300`
(Remove `hover:rotate-12`, change `rounded-full` → `rounded-xl`, change icon color to `text-white`)

### Line 675 — Image delete button (inside folder)
Change from:
`bg-rose-500 text-white rounded-lg hover:bg-rose-600`

To:
`bg-black/40 text-white rounded-xl hover:text-rose-400 hover:bg-black/60`
(Remove solid red background, match the transparent pattern)

Two line changes in one file.

