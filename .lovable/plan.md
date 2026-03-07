

# Plan: Pass 3 — Image Generation Modals, Story Detail Modal, Interactive Components, and Remaining Inconsistencies

## What's Still Missing

After auditing the full 1948-line Style Guide against all source components, these significant UI patterns have no entries:

### Image Generation Modals (SceneImageGenerationModal, AvatarGenerationModal, CoverImageGenerationModal)
These modals use **shadcn light-theme defaults** — a major inconsistency with the rest of the app:
- **Container**: Uses default `DialogContent` (no dark overrides) — renders as light bg
- **Inputs**: `bg-slate-50 border-slate-200 focus:ring-blue-100 focus:border-blue-400` — light theme inputs, unique to these modals
- **Art Style Grid**: `rounded-xl ring-1 ring-border` (inactive), `ring-2 ring-blue-400 shadow-md` (active) — light-theme selection cards
- **Buttons**: Uses shadcn `<Button>` with default variant — not Shadow Surface pattern
- **Inconsistency**: These are the only modals using shadcn light-theme defaults while every other modal uses `bg-zinc-900 border-white/10`

### Story Detail Modal (StoryDetailModal.tsx — 681 lines)
The largest modal in the app with unique patterns:
- **Container**: `bg-[#121214] rounded-[32px]` — unique 32px radius, only modal using this
- **Action buttons**: `h-12 bg-white/5 border-white/10 rounded-xl` (inactive states), `bg-[#3b82f6]` (Play) — not Shadow Surface
- **Like/Save toggle states**: `bg-rose-500/20 border-rose-500/50 text-rose-400` (liked), `bg-amber-500/20 border-amber-500/50` (saved)
- **Content theme tags**: Category-colored chips using same pattern as gallery filters
- **Character cards**: `bg-white/5 rounded-xl p-3` with avatar and role description
- **Review section**: StarRating + SpiceRating inline components, review cards `bg-white/5 rounded-xl p-4`
- **Inconsistency**: Uses `rounded-[32px]` while standard modals use `rounded-lg`

### Review Modal (ReviewModal.tsx)
- **Container**: `bg-[#121214] rounded-2xl` — third different dark bg variant
- **Submit button**: `h-11 bg-[#4a5f7f] rounded-xl font-semibold text-sm` — non-standard (h-11 instead of h-10, text-sm instead of text-[10px])
- **Delete button**: `h-11 bg-red-600/20 border-red-500/30 text-red-400 rounded-xl` — semi-transparent destructive variant
- **Textarea**: `bg-white/5 border-white/10 text-white placeholder:text-white/30` — yet another input variant

### Share Story Modal (ShareStoryModal.tsx)
- **Container**: `bg-[#2a2a2f] border-white/10` — edit variant
- **Info card**: `p-4 bg-zinc-900/50 rounded-xl border-zinc-700` — data display card
- **Permission card**: `bg-blue-500/10 border-blue-500/20` — blue info callout (unique pattern)
- **Buttons**: Uses Chronicle UI `<Button>` with `!important` overrides (`!bg-blue-600`, `!bg-rose-500/20`) — inconsistent with Shadow Surface

### Memories Modal (MemoriesModal.tsx)
- **Container**: `bg-slate-900 border-slate-700` — yet another variant (slate instead of zinc)
- **Toggle row**: `p-3 bg-slate-800/50 rounded-lg border-slate-700` — uses slate palette
- **Add memory form**: `bg-slate-800/70 border-purple-500/30 animate-in slide-in-from-top-2` — unique animation
- **Select dropdowns**: `bg-slate-900 border-slate-600` trigger, `bg-slate-800 border-slate-600` content — slate instead of zinc
- **Inconsistency**: Uses `slate-*` colors throughout while app standard is `zinc-*`

### Interactive Components (not documented)
- **StarRating**: Amber stars (`text-amber-400 fill-amber-400`), empty `text-white/20`, interactive hover with `hover:scale-110`
- **SpiceRating**: Red flames (`text-red-500 fill-red-500`), same empty/hover pattern
- **GuidanceStrengthSlider**: Custom 3-point slider with gradient fill (`from-blue-400 to-cyan-300`), labels `text-[10px] font-black uppercase tracking-widest`
- **CircularProgress**: SVG circle progress ring — used in story setup

### Art Style Selection Grid (shared across Avatar, Scene, Cover Image modals)
- Card: `rounded-xl bg-card ring-1 ring-border` → selected: `ring-2 ring-blue-400 shadow-md`
- Checkmark: `w-5 h-5 bg-primary rounded-full` absolute top-right
- Label: `text-xs font-semibold text-foreground`

## Implementation

Add ~20 new entries across existing sections in `StyleGuideTool.tsx`:

**Modals section** — Add:
- Image Generation Modal (light-theme variant) + inconsistency note
- Story Detail Modal (unique rounded-[32px], action buttons, review section)
- Review Modal (non-standard button sizes) + inconsistency note
- Share Story Modal (blue info callout pattern) + inconsistency note
- Memories Modal (slate vs zinc) + inconsistency note

**Buttons section** — Add:
- Story Detail action buttons (h-12 toggle states)
- Review Modal submit/delete (h-11 non-standard)
- Share Modal `!important` override buttons

**Form Inputs section** — Add:
- Light-theme generation textarea (`bg-slate-50 border-slate-200`)
- Review Modal textarea (`bg-white/5 border-white/10`)
- Memories Modal textarea (`bg-slate-900 border-slate-600`)

**Badges section** — Add:
- StarRating component (amber stars)
- SpiceRating component (red flames)

**Panels section** — Add:
- Art Style Selection Grid card
- Story Detail character cards
- Share Modal info callout (`bg-blue-500/10`)
- Review cards (`bg-white/5 rounded-xl`)

**Inconsistency notes to add:**
- Image Generation Modals: shadcn light-theme defaults vs app-wide dark theme
- Story Detail Modal: `rounded-[32px]` vs standard `rounded-lg`
- Review Modal: `bg-[#121214]` and `h-11` buttons vs standard `h-10 text-[10px]`
- Memories Modal: `slate-*` palette vs app-wide `zinc-*`
- Share Modal: `!important` CSS overrides on buttons
- 5 different modal background colors across the app (`bg-zinc-900`, `bg-[#2a2a2f]`, `bg-[#121214]`, `bg-slate-900`, default light)

## File Changes

| File | Change |
|------|--------|
| `src/components/admin/styleguide/StyleGuideTool.tsx` | Add ~20 new entries + 6 new InconsistencyNote blocks |

