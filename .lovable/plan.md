

## Fix: Convert Card Hover Buttons & Tab Pills to ButtonCardV2 Format

The two original My Stories entries (lines 1108-1130) are still using the old `EntryCard` component while everything else has been converted to `ButtonCardV2`. Convert both.

### Changes to `StyleGuideTool.tsx` (lines 1108-1130)

Replace the two `EntryCard` entries with `ButtonCardV2`:

**1. Card Hover Buttons — Edit / Delete / Play** (line 1108-1120)
- `buttonName`: "Card Hover Buttons — Edit / Delete / Play"
- `buttonColor`: "Edit: bg-white. Delete: bg-[hsl(var(--destructive))]. Play: bg-blue-600"
- `textColor`: "Edit: text-slate-900. Delete/Play: text-white"
- `size`: "h-8 px-4 — rounded-xl (12px)"
- `purpose`: "Compact card variant for story card hover overlay actions"
- `visualEffects`: "shadow-2xl · text-[10px] font-bold leading-none uppercase tracking-wider"
- `locations`: "StoryHub — story card hover overlay"
- `pageSpecific={true}`, `appWide={false}`
- Same preview (3 buttons)

**2. Tab Pills — Active / Inactive** (line 1121-1130)
- `buttonName`: "Tab Pills — Active / Inactive"
- `buttonColor`: "Active: bg-[#4a5f7f]. Inactive: bg-transparent"
- `textColor`: "Active: text-white. Inactive: text-[#a1a1aa]"
- `size`: "px-4 py-1.5 — rounded-full"
- `purpose`: "Filter pill bar for story list segmentation"
- `visualEffects`: "text-xs font-bold"
- `locations`: "My Stories hub header — filter pills"
- `pageSpecific={true}`, `appWide={false}`
- Same preview (2 pills)

