

# Match Creator Profile to Public Profile Tab -- Exact Layout Duplication

## Problem

The Creator Profile page currently uses different card styles, layouts, and data from the Public Profile tab. The Published Works cards are especially different -- wrong aspect ratio, wrong border, wrong gradient, missing description, missing stats, missing badges.

## Detailed Differences Found

### Profile Info Section (minor fixes)
- CreatorProfile uses `flex flex-col md:flex-row gap-8` -- should be `flex gap-6` (PublicProfileTab line 296)
- Avatar column in PublicProfileTab uses `flex-shrink-0 flex flex-col items-center gap-3 w-72` wrapper -- CreatorProfile just has the bare `w-72 h-72` div

### Published Works Section (major overhaul needed)
Current CreatorProfile cards vs PublicProfileTab cards:

| Property | CreatorProfile (wrong) | PublicProfileTab (correct) |
|---|---|---|
| Wrapper | Bare heading, no card | Wrapped in `bg-[#1e1e22] rounded-2xl border border-white/10 p-6` card |
| Heading | `text-xs font-bold text-white/40 uppercase tracking-widest` | `text-sm font-black text-white uppercase tracking-wider` |
| Aspect ratio | `aspect-[3/4]` | `aspect-[2/3]` |
| Border radius | `rounded-xl` | `rounded-[2rem]` |
| Border | none | `border border-[#4a5f7f]` |
| Shadow | none | `shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]` |
| Hover effect | `scale-105` on image | `-translate-y-3` on card, `scale-110` on image, `shadow-2xl` |
| Gradient | `from-black/80 to-transparent` | `from-slate-950 via-slate-900/60 to-transparent` (full overlay div) |
| Title | `text-sm font-bold truncate` | `text-lg font-black tracking-tight truncate` |
| Description | missing | `text-xs italic line-clamp-2 min-h-[2.5rem]` |
| Stats | Only Heart + Play | Eye, Heart, Bookmark, Play |
| "Written by" | missing | `text-[11px] text-white/50` |
| SFW/NSFW badge | missing | Top-right badge |
| Remix badge | missing | Top-left pencil icon |

### Data Fetch Gaps
- CreatorProfile query only fetches `like_count, play_count` -- needs `view_count, save_count, allow_remix` too
- Missing `storyType` from `content_themes` table lookup
- `PublishedWork` interface needs `view_count`, `save_count`, `allow_remix`, `storyType`

## Changes

### `src/pages/CreatorProfile.tsx`

1. **Update `PublishedWork` interface** -- add `view_count`, `save_count`, `allow_remix`, `storyType` fields

2. **Update data fetch query** (line 61-64):
   - Add `view_count, save_count, allow_remix` to the select
   - After fetching works, query `content_themes` for `storyType` (same pattern as PublicProfileTab lines 114-123)

3. **Add missing imports**: `cn` from `@/lib/utils`, `Pencil` icon

4. **Profile info card** (line 170): Change `flex flex-col md:flex-row gap-8` to `flex gap-6` to match PublicProfileTab line 296

5. **Published Works section** (lines 256-293): Replace entirely with the exact card markup from PublicProfileTab lines 424-535, minus the edit-only elements (Hide checkbox, Save button). Specifically:
   - Wrap in `bg-[#1e1e22] rounded-2xl border border-white/10 p-6` card
   - Use `text-sm font-black text-white uppercase tracking-wider` heading
   - Each card: `aspect-[2/3]`, `rounded-[2rem]`, `border border-[#4a5f7f]`, full shadow, hover lift, proper gradient overlay
   - Include SFW/NSFW badge, remix badge, description, all 4 stat icons, "Written by" line

