

# Fix Badges & Tags Section to V2 Standard

## Problem

The Badges & Tags section (lines 2566-2801) uses legacy `EntryCard` components with raw HTML specs, inconsistent grouping, and preview approximations (e.g., emoji `🔥` instead of actual Lucide `Flame` icons, text `★` instead of Lucide `Star`). Several entries also duplicate content already covered elsewhere, and the section doesn't use the grid layout or V2 card pattern from the other sections.

## Approach

Create a `BadgeCardV2` component following the same exact pattern as `ButtonCardV2` / `InputCardV2`, then replace all `EntryCard` instances with properly structured `BadgeCardV2` cards using the **actual component code** verified from the source files.

## 1. Create `BadgeCardV2` component (~after `InputCardV2`, line 423)

**Props:**
- `badgeName` (string) — human-readable name
- `preview` (ReactNode) — live preview using real classes from the actual components
- `previewBg` (string, default `'#1a1a2e'`) — dark bg since all badges live on dark surfaces
- `background` (string) — e.g. `bg-[#2a2a2f]`
- `textColor` (string) — e.g. `text-blue-400`
- `size` (string) — e.g. `text-xs font-bold` or `text-[8px] font-bold`
- `borderRadius` (string) — e.g. `rounded-lg`
- `padding` (string) — e.g. `px-2.5 py-1`
- `purpose` (string)
- `locations` (string)
- `pageSpecific` / `appWide` (boolean)
- `notes` (string, optional)
- `states` (string, optional) — for multi-state badges like Connected/Checking/Unlinked

Same card shell, `CardEditOverlay`, hover lift, labeled fields as `ButtonCardV2`.

## 2. Entries to create (verified from source code)

Each entry verified against the actual component source file. Grouped by page using `fullSpan` + `PageSubheading`.

### Story Builder — Content Theme Chips
From `ContentThemesSection.tsx` lines 86-98:
- **Unselected**: `bg-zinc-800 text-zinc-400 border-zinc-700 px-3 py-1.5 rounded-lg text-xs font-medium`
- **Selected**: `bg-blue-500/20 text-blue-300 border-blue-500/30 px-3 py-1.5 rounded-lg text-xs font-medium`
- **Custom tag (removable)**: Same as selected + X button
- **"+ Add custom" dashed button**: `border-2 border-dashed border-zinc-600 text-blue-400`
- Show all 4 states in preview

### Story Cards — SFW / NSFW Badge
From `GalleryStoryCard.tsx` line 88-95 and `StoryHub.tsx` line 55-60:
- `px-2.5 py-1 backdrop-blur-sm rounded-lg text-xs font-bold shadow-lg bg-[#2a2a2f]`
- SFW: `text-blue-400`, NSFW: `text-red-400`
- Some cards add `uppercase tracking-wide`

### Story Cards — Published Badge
From `StoryHub.tsx` line 40:
- `px-2.5 py-1 backdrop-blur-sm rounded-lg text-xs font-bold shadow-lg bg-[#2a2a2f] text-emerald-400 uppercase tracking-wide`

### Story Cards — Editable Badge (Pencil Icon)
From `GalleryStoryCard.tsx` line 100-102 and `StoryHub.tsx` line 47-49:
- `p-1.5 backdrop-blur-sm rounded-lg shadow-lg bg-[#2a2a2f]`
- Contains `Pencil` icon `w-4 h-4 text-purple-400`

### Story Detail Modal — Status Badges (Published + Editable)
From `StoryDetailModal.tsx` lines 471-481:
- Published: `px-2.5 py-1 bg-emerald-500/20 rounded-lg text-xs font-bold text-emerald-400`
- Editable: `px-2.5 py-1 bg-purple-500/20 rounded-lg text-xs font-bold text-purple-400`
- These are inline text badges (no backdrop-blur), different from the card overlay versions

### Community Gallery — Active Filter Chips
From `GalleryHub.tsx` lines 413-466:
- Search text: `px-2 py-1 bg-white/20 text-white rounded-full text-xs font-medium`
- Story Type: `px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium`
- Genre: `px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium`
- Origin: `px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium`
- Trigger Warnings: `px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium`
- Each has an X dismiss button

### Chat Interface — Side Character Control Badge
From `SideCharacterCard.tsx` lines 71-80 (uses shadcn `Badge` component):
- `text-[8px] px-1.5 py-0.5 shadow-sm border-0`
- User: `bg-blue-500 hover:bg-blue-500 text-white`
- AI: `bg-slate-500 hover:bg-slate-500 text-white`
- Positioned `absolute -bottom-1 -right-1` on avatar

### Image Library — Folder Image Count Badge
From `ImageLibraryTab.tsx` line 480:
- `bg-blue-600 text-[9px] font-black text-white px-2 py-1 rounded-md uppercase tracking-widest shadow-lg`

### Account Page — Subscription Tier Badges
From `SubscriptionTab.tsx` lines 76-85:
- Current Plan: `px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider`
- Coming Soon: `px-3 py-1 bg-[#4a5f7f] text-white rounded-full text-[10px] font-bold uppercase tracking-wider`

### Model Settings — Connection Status Badge (Animated)
From `ModelSettingsTab.tsx` lines 127-139:
- `px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest`
- Connected: `bg-emerald-50 text-emerald-600 border border-emerald-100` + `animate-pulse` dot
- Checking: `bg-amber-50 text-amber-600 border border-amber-100` + `animate-bounce` dot
- Unlinked: `bg-slate-100 text-slate-500 border border-slate-200`

### Scene Tags — Blue Tag Chips
From `TagInput.tsx` and `SceneTagEditorModal.tsx`:
- `px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-medium`
- TagInput variant: `px-3 py-1.5` (slightly larger)

### Interactive Components — StarRating
From `StarRating.tsx`:
- Uses Lucide `Star` / `StarHalf` icons
- Filled: `text-amber-400 fill-amber-400`, Empty: `text-white/20`
- Also has `slate` color variant: filled `text-[hsl(215,25%,40%)] fill-[hsl(215,25%,40%)]`
- Interactive: `hover:scale-110 transition-transform`
- **Preview should import and render the actual `StarRating` component**

### Interactive Components — SpiceRating
From `SpiceRating.tsx`:
- Uses Lucide `Flame` icon
- Filled: `text-red-500 fill-red-500`, Empty: `text-white/20`
- Interactive: `hover:scale-110 transition-transform`
- **Preview should import and render the actual `SpiceRating` component**

### Interactive Components — CircularProgress
From `CircularProgress.tsx`:
- SVG ring with dark variant: bg stroke `#334155`, progress `#3b82f6` (in-progress) / `#22c55e` (complete)
- Center text: `font-bold text-[10px]` (or `text-lg` for size≥80)
- **Preview should import and render actual `CircularProgress` component** with 0%, 50%, 100% states

### Character Builder — Lock Icon Indicator
Keep this entry, convert to `BadgeCardV2`. It's a Lucide `Lock` icon `w-3.5 h-3.5 text-zinc-400` indicating read-only rows.

## 3. Layout

Use the same responsive grid as the other V2 sections:
```
gridTemplateColumns: repeat(auto-fit, minmax(280px, 1fr))
gap: 14px
```
With `fullSpan` `PageSubheading` dividers between groups.

## 4. Key differences from current implementation

- **Real component imports**: `StarRating`, `SpiceRating`, `CircularProgress` rendered in previews instead of emoji/Unicode approximations
- **Split combined entries**: The current "SFW / NSFW Badges" entry lumps SFW, NSFW, and Published together — split Published into its own card since it has different styling (`uppercase tracking-wide`)
- **Add missing entries**: Editable (Pencil icon) badge, Story Detail inline status badges, Subscription tier badges (Current Plan + Coming Soon), content theme unselected state
- **Remove duplicate**: "Character Control Badge" appears twice (line 2620 and line 2787) — consolidate into one
- **Accurate classes**: All styling values pulled directly from source files, not approximated

## 5. No other changes

Only the Badges & Tags section (lines 2566-2801) is modified. No changes to other sections, V2 components, or page files.

