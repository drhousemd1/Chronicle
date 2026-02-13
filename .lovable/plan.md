

# Content Themes Container Polish

## Changes

### 1. Add subtle gradient to all tag containers

Replace the flat `bg-zinc-900` on every tag container with `bg-gradient-to-br from-zinc-800 to-zinc-900` -- the same gradient used on the cover image placeholder. This adds a faint top-left-to-bottom-right light-to-dark sweep that gives depth without being distracting.

Affected containers (all in `src/components/chronicle/ContentThemesSection.tsx`):
- CategorySelector (line 78) -- used by Character Types, Genre, Origin, Trigger Warnings
- StoryTypeSelector (line 171)
- CustomTagsSection (line 232)

### 2. Shrink the Story Type container to fit its content

Change the Story Type container from full-width to inline/shrink-to-fit by adding `w-fit` so it hugs the SFW/NSFW buttons instead of stretching across the entire row.

## Technical Details

### File: `src/components/chronicle/ContentThemesSection.tsx`

**All three container divs** -- replace:
```
bg-zinc-900 rounded-xl p-4 border border-white/5
```
with:
```
bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl p-4 border border-white/5
```

**StoryTypeSelector container (line 171)** -- additionally add `w-fit`:
```
bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl p-4 border border-white/5 w-fit
```

Single-file change, no logic changes.
