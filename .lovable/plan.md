

# Fix Duplicate Subheadings + Faint Placeholder Styling

## Issues

1. **WorldTab freeform items**: Two "SECTION TITLE..." placeholders appear — the section-level one (line 898, more visible) and a per-item one (line 1017-1029, fainter). Remove the per-item one for freeform items since the section-level title already serves this purpose.

2. **CharactersTab subheading placeholder too faint**: The per-item subheading (line 2067) uses `placeholder:text-zinc-600` which is too faint. Update to `placeholder:text-zinc-500` to match the WorldTab's section-level title visibility.

## Changes

### 1. `src/components/chronicle/WorldTab.tsx` — Remove freeform per-item subheading

**Lines 1017-1029**: Delete the per-item `<input>` with `placeholder="SECTION TITLE..."` from the freeform item rendering block. Freeform items should only show the textarea, not a duplicate subheading. The section-level title (line 898) already provides the section label.

### 2. `src/components/chronicle/CharactersTab.tsx` — Fix subheading placeholder visibility

**Line 2067**: Change `placeholder:text-zinc-600` to `placeholder:text-zinc-500` so the "SECTION TITLE..." placeholder matches the more visible style seen in the WorldTab section headers.

## Files Modified
- `src/components/chronicle/WorldTab.tsx` — Remove duplicate subheading input from freeform items
- `src/components/chronicle/CharactersTab.tsx` — Increase placeholder contrast on subheading inputs

