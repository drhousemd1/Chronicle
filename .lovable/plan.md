

# Plan: Pass 5 — Dual Component Systems, Page-Level Patterns, and Final Coverage Sweep

## What's Still Missing

After 4 passes (2620 lines), these significant patterns remain undocumented:

### 1. The `UI.tsx` Component System — A Parallel Design Language
The app has **two completely separate component systems** that have never been documented or reconciled:
- **System A**: shadcn/Radix (`@/components/ui/*`) — used by Auth page, some modals
- **System B**: Chronicle `UI.tsx` — custom `Button` (7 variants), `Card`, `Input`, `TextArea`, `Label`, `Avatar`, `SectionTitle`

The Chronicle `UI.tsx` system uses fundamentally different styling:
- `Button`: `rounded-xl px-4 py-2 text-sm font-semibold` with `active:scale-95` — different from both shadcn Button AND Shadow Surface standard
- `Card`: `rounded-3xl border-slate-200 bg-white` — **light theme** card in a dark-themed app
- `Input`: `rounded-2xl bg-slate-50 border-slate-200` — light theme
- `Avatar`: `w-12 h-12 rounded-2xl` — different size/radius from shadcn Avatar

This is used by: StoryHub, CharactersTab, ChatInterface, WorldTab, ShareStoryModal, BackgroundPickerModal, CharacterPicker, ModelSettings, UploadSourceMenu, PublicProfileTab — essentially half the app.

**Inconsistency**: Two button systems, two card systems, two input systems coexisting. Chronicle UI uses light-theme defaults while the app is dark-themed.

### 2. Auth Page Patterns
- Login card: `bg-slate-800/50 border-slate-700 backdrop-blur-sm` on `from-slate-900 via-purple-900` gradient
- Inputs: `bg-slate-700/50 border-slate-600 text-white` — unique dark input variant
- Submit button: `bg-purple-600 hover:bg-purple-700` — unique purple, uses shadcn Button
- Toggle link: `text-purple-400 hover:text-purple-300 text-sm` — unstyled button
- **Inconsistency**: Auth uses purple accent; rest of app uses blue `#4a5f7f` accent

### 3. Creator Profile Page
- Full page: `bg-[#121214]` — same as StoryDetailModal
- Header bar: `bg-white border-slate-200` — light-themed header on dark page
- Profile card: `bg-[#1e1e22] rounded-2xl border-white/10` — yet another dark surface color
- Follow button: `bg-[#4a5f7f]` (follow) / `bg-white/10` (unfollow) — brand accent toggle
- Stats pills: `bg-white/5 rounded-xl` with icon + count
- **Inconsistency**: Header is `bg-white` (light) on a `bg-[#121214]` (dark) page — jarring contrast. `#1e1e22` is yet another surface color not matching `#2a2a2f` or `bg-zinc-900`.

### 4. Account Page Patterns
- Profile tab: `bg-[#1e1e22] rounded-2xl border-white/10` — same as CreatorProfile
- Uses Chronicle `UI.tsx` Button — light-theme buttons on dark page
- Avatar drag-to-position with dashed border container

### 5. Story Card Patterns (StoryHub + GalleryStoryCard)
- Card container: `aspect-[2/3] rounded-[2rem] border-[#4a5f7f]` with `shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]`
- Gradient overlay: `from-slate-950 via-slate-900/60 to-transparent opacity-90`
- Badge pills: `backdrop-blur-sm rounded-lg bg-[#2a2a2f]` — Published (emerald), SFW/NSFW (blue/red)
- Hover image zoom: `group-hover:scale-110 duration-700` + card lift `group-hover:-translate-y-3`
- **Not documented**: The 2:3 aspect ratio card with rounded-[2rem] is a major UI pattern

### 6. Side Character Card
- Dark/Light dual mode: `isDarkBg` prop switches between `bg-white/30` and `bg-black/30`
- Updating state: blue vignette overlay with `animate-vignette-pulse`
- Control badge: `bg-blue-500` (User) / `bg-slate-500` (AI) — `text-[8px]` micro badge
- Avatar: `w-20 h-20 rounded-full` — only circular avatar in app (everything else is `rounded-2xl`)

### 7. CharacterPicker (Full-screen overlay)
- Uses `fixed inset-0 bg-slate-900/50 backdrop-blur-sm` — third overlay implementation
- Inner container: `bg-zinc-900 rounded-3xl border-white/10` — `rounded-3xl` is unique
- Uses Chronicle `UI.tsx` Input with `!important` overrides for dark theme
- Character cards inside: `bg-black/30 rounded-2xl border-transparent hover:bg-black/50`

### 8. ScrollableSection
- Fade indicators: `bg-gradient-to-b from-white via-white/80 to-transparent` — **white** gradient fade on a presumably dark background
- **Inconsistency**: Uses `from-white` which assumes light theme container

### 9. UploadSourceMenu Dropdown
- Uses Chronicle `UI.tsx` Button as trigger
- Dropdown content: `bg-white border-slate-200 shadow-lg` — light-theme dropdown
- **Inconsistency**: Light dropdown appearing over dark-themed modals

## Implementation

Add ~20 new entries + a dedicated "Dual Component System" inconsistency section:

**New: Component Systems section** (top of guide or in Panels):
- Chronicle `UI.tsx` Button (7 variants) vs shadcn Button comparison
- Chronicle `UI.tsx` Card/Input/TextArea — light-theme primitives
- Master inconsistency note: two parallel component systems

**Colors section** — Add:
- Creator Profile: `#1e1e22`, `#121214` page bg
- Auth Page: purple accent (`purple-600`, `purple-400`)

**Buttons section** — Add:
- Chronicle `UI.tsx` Button variants (brand, gradient, outlineDark, ghost, danger)
- Auth submit button (purple-600)
- Follow/Unfollow toggle button
- UploadSourceMenu trigger pattern

**Panels section** — Add:
- Story Card (2:3 aspect, rounded-[2rem], gradient overlay, hover effects)
- Side Character Card (dual dark/light mode, updating vignette)
- Creator Profile card (`#1e1e22`)
- CharacterPicker overlay (`rounded-3xl`)

**Form Inputs section** — Add:
- Chronicle `UI.tsx` Input (light-theme, rounded-2xl)
- Auth dark inputs (`bg-slate-700/50`)
- CharacterPicker search with `!important` overrides

**Inconsistency notes** — Add:
- Two parallel component systems (Chronicle UI vs shadcn)
- Three different overlay implementations (Dialog, AlertDialog, custom fixed)
- ScrollableSection white fade on dark backgrounds
- UploadSourceMenu light dropdown on dark modals
- Auth purple accent vs app-wide blue `#4a5f7f` accent
- Creator Profile `#1e1e22` vs standard `#2a2a2f` surface
- SideCharacter `rounded-full` avatar vs app-wide `rounded-2xl`
- CharacterPicker `rounded-3xl` vs standard `rounded-2xl` containers

## File Changes

| File | Change |
|------|--------|
| `src/components/admin/styleguide/StyleGuideTool.tsx` | Add ~20 new entries + 8 new InconsistencyNote blocks |

