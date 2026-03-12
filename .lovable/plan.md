

# Fix My Stories Page Swatches — Accuracy Audit + Complete Location Coverage

## Audit Findings (from source code)

### 1. Frosted White — WRONG location
Current: "Full page background" — **Incorrect**. The My Stories hub renders inside a `bg-black` wrapper (`Index.tsx` line 2133). The `bg-slate-50/50` is on the `<main>` element but is fully covered by the black wrapper. Frosted White is NOT visible on the My Stories page.

**Fix:** Either remove this swatch from the My Stories section entirely (it belongs in the app-wide/header section since `bg-slate-50/50` is only visible as the main element behind other pages), or replace it with `bg-black` which is the actual My Stories page background.

### 2. Slate Blue (#4a5f7f) — Correct but incomplete
- ✅ Story card border (`border-[#4a5f7f]`, StoryHub.tsx line 35)
- ✅ Active tab pill (`bg-[#4a5f7f]`, Index.tsx lines 1664, 1675, 1686, 1697)
- **Needs 2 separate screenshots:** one for the tab pills, one for a card border close-up

### 3. Dark Charcoal (#2a2a2f) — Correct but incomplete
Used in 3 distinct locations on story cards:
- Published badge bg (line 40)
- Pencil/remix badge bg (line 47)
- SFW/NSFW badge bg (line 56)
- **Needs a screenshot showing all 3 badge types**

### 4. Bright Red — Only 2 of 5+ locations covered
Actual red locations on My Stories page + its sub-modals:
1. **NSFW badge text** on story cards (`text-red-500`, StoryHub.tsx line 57)
2. **Delete button** on card hover (`bg-[hsl(var(--destructive))]`, StoryHub.tsx line 90)
3. **"Delete" word** in confirmation dialog title (`text-[hsl(var(--destructive))]`, DeleteConfirmDialog.tsx line 33)
4. **Delete confirm button** in dialog (`bg-[hsl(var(--destructive))]`, DeleteConfirmDialog.tsx line 45)
5. **Trigger Warnings text** in Story Detail Modal (`text-red-500`, StoryDetailModal.tsx line 522)
6. **NSFW badge text** in Story Detail Modal (`text-red-500`, StoryDetailModal.tsx line 279)

**Needs a screenshot for each distinct visual appearance** (at least 4-5 screenshots: NSFW badge on card, Delete button on hover, Delete confirm dialog, Trigger Warnings in detail modal, NSFW badge in detail modal)

### 5. Ash Gray (#52525b / zinc-600) — Correct
- ✅ New Story dashed card border (`border-zinc-600`, StoryHub.tsx line 263)
- Also: `text-zinc-500` on "+" icon and "New Story" text (lines 265, 268) — same family, could note

### 6. Half Black — Correct
- ✅ Card drop shadow (`shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]`, StoryHub.tsx line 35)

### Missing colors that should be in this section
- **Black (#000000)** — The actual My Stories page background (`bg-black`, Index.tsx line 2133)
- **#2b2b2e** — Tab pill container/track background (`bg-[#2b2b2e]`, Index.tsx line 1658)
- **#a1a1aa** — Inactive tab pill text color (Index.tsx line 1665)
- **Emerald-400 (text-emerald-400)** — Published badge text color (StoryHub.tsx line 40)
- **Purple-400 (text-purple-400)** — Remix/Pencil badge icon color (StoryHub.tsx line 49)
- **Blue-500 (#3b82f6)** — SFW badge text, Play button bg, hover states (StoryHub.tsx lines 57, 96, 104)
- **White (#fff)** — Edit button bg, card title text, stats text (multiple lines)

## Plan

### Step 1: Capture localized screenshots (5-6 new images)
Using small viewports + scrolling to isolate each element:

| Image | Viewport | Target |
|---|---|---|
| `my-stories-tab-pills.png` | 800×200 | Header with tab pills — shows #4a5f7f active pill, #2b2b2e track |
| `my-stories-nsfw-badge.png` | 414×600 | Single card showing NSFW badge (red text on #2a2a2f bg) |
| `my-stories-card-hover.png` | 414×600 | Single card hover showing DELETE button in red |
| `my-stories-delete-dialog.png` | 414×600 | DeleteConfirmDialog open — shows red "Delete" text + red button |
| `my-stories-new-story.png` | 414×600 | New Story skeleton card — dashed zinc-600 border |
| `my-stories-detail-warnings.png` | 414×600 | StoryDetailModal showing Trigger Warnings in red text |

### Step 2: Fix swatch data accuracy
In `StyleGuideTool.tsx` lines 1112-1135:

1. **Frosted White** — Remove from My Stories section (it's not visible on this page; bg is black)
2. **Slate Blue** — Keep, update screenshots to `my-stories-tab-pills.png` (for active pill) and a card close-up (for border)
3. **Dark Charcoal** — Keep, update to show all 3 badge types (Published, Remix, SFW/NSFW)
4. **Bright Red** — Add `locationImages` entries for ALL 5-6 locations with individual screenshots
5. **Ash Gray** — Keep, update screenshot
6. **Half Black** — Keep, update screenshot

### Step 3: Add missing swatches
Add new `SwatchCardV2` entries for colors actually used on this page:
- **Black** (#000000) — page background
- **Dark Track** (#2b2b2e) — tab pill container background
- **Muted Zinc** (#a1a1aa) — inactive tab text
- **Emerald** (text-emerald-400) — Published badge text
- **Blue-500** (#3b82f6) — SFW badge text, Play button, hover highlight

## Files Changed
- `src/components/admin/styleguide/StyleGuideTool.tsx` — fix swatch data, add missing swatches, update all locationImages
- New screenshot assets uploaded to Supabase storage `guide_images/my-stories/`

