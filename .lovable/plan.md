

# Plan: Pass 2 — Character Builder, Model Settings, Chat Deep Elements, and Missing Patterns

## What's Still Missing

After reviewing the current 1512-line Style Guide against all source components, these UI elements exist in code but have no Style Guide entries:

### Character Builder (CharactersTab.tsx, EnhanceModeModal.tsx)
- **HardcodedSection panel** — Same panel/header pattern as Story Builder but with inner card (`bg-[#3a3a3f]/30 rounded-2xl border-white/5`)
- **HardcodedRow** — 2-column layout: read-only label (`bg-zinc-900/50 border-white/10 text-zinc-400 uppercase tracking-widest`) + value textarea + Lock icon (`w-3.5 h-3.5 text-zinc-400`)
- **ExtraRow** — Same layout but editable label + red delete X button (`text-red-400 hover:text-red-300 hover:bg-red-900/30`)
- **AI Enhance sparkle button** — `p-1.5 rounded-md text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10`, uses `Sparkles size={14}`
- **EnhanceModeModal option cards** — `p-5 rounded-2xl border-white/10 bg-zinc-800/50` with `w-10 h-10 rounded-xl bg-blue-500/20` icon container
- **Inconsistency**: EnhanceModeModal uses `rounded-2xl` for option cards but similar option patterns in CharacterCreationModal use `rounded-xl`

### Model Settings (ModelSettingsTab.tsx) — LIGHT THEME
- **Model selection cards** — Active: `bg-slate-900 border-slate-900 shadow-xl scale-[1.02]`. Inactive: `bg-white border-slate-200 hover:border-blue-400`. This is the only page using light-theme cards with scale transitions.
- **Connection status badge** — `px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest` with animated dot (`w-2 h-2 rounded-full animate-pulse`)
- **Admin share toggle row** — `p-4 bg-purple-50 rounded-xl border-purple-200` — unique light purple treatment
- **Narrative Core card** — `bg-slate-900 text-white` Card with `text-[120px] font-black text-white/5 italic` watermark
- **Inconsistency**: Model Settings uses light-theme (`bg-white`, `text-slate-900`, `border-slate-200`) while every other page in the app uses dark theme. This is a significant design inconsistency.

### Chat Interface Deep Elements (ChatInterfaceTab.tsx)
- **Chat message bubble** — Not yet documented. AI: `bg-[#1c1f26] rounded-[2rem] border-white/5`. User: `border-2 border-blue-400`. Transparent mode variant.
- **Character sidebar card** — Frosted glass pattern, avatar + name + control badge
- **Day/Time sky panel** — Preloaded stacked images with crossfade, `bg-black/20` overlay, `shadow-lg`
- **Inconsistency**: Chat bubble bg `#1c1f26` is not the same as any panel token (`#2a2a2f` or `bg-zinc-900`)

### World Tab (WorldTab.tsx)
- **HintBox** — `bg-zinc-900 rounded-xl p-4 border-white/5` with `◆` bullet points in `text-zinc-400`
- **CharacterButton** — `bg-black/80 rounded-2xl border-[#4a5f7f] hover:border-[#6b82a8]` with error state `border-2 border-red-500`

### Dropdown Menus (standardized pattern)
- `bg-zinc-800 border-white/10`, items: `bg-zinc-700` hover, destructive: `text-red-600`
- Not documented anywhere in current guide

### LabeledToggle (labeled-toggle.tsx)
- Custom toggle with Off/On labels, track (`h-5 w-9`), thumb (`h-4 w-4`), locked state with Lock icon
- Used extensively in Chat Settings

### Image Library deeper elements
- **New Folder dashed card** — `border-2 border-dashed border-zinc-600 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-[2rem]` with hover `border-blue-400`
- **Folder delete button** — `p-3 bg-black/40 text-white/50 hover:text-rose-500 rounded-full` — circular, opacity transition
- **Image lightbox overlay** — full-screen overlay with image details

## Implementation

Add ~25 new entry cards across existing sections in `StyleGuideTool.tsx`:

**Colors section** — Add:
- Character Builder page: `#1c1f26` (chat bubble), inner card `#3a3a3f/30`
- Model Settings page: light theme swatches (`bg-white`, `bg-slate-900` active, `bg-purple-50` admin)

**Typography section** — Add:
- Character Builder: HardcodedRow label style, ExtraRow editable label
- Model Settings: model name (font-bold, dark/light variants), connection status text

**Buttons section** — Add:
- AI Enhance sparkle button
- EnhanceModeModal option cards
- Model selection cards (active/inactive)
- Folder delete circular button
- New Folder dashed card-button

**Form Inputs section** — Add:
- HardcodedRow textarea (no visible border, bg-zinc-900/50)
- LabeledToggle component

**Badges section** — Add:
- Connection status badge (animated dot)
- Lock icon indicator (HardcodedRow)

**Panels section** — Add:
- Chat message bubble (AI/User/Transparent variants)
- HintBox component
- CharacterButton (with error state)
- Day/Time sky panel
- Narrative Core dark info card
- Dropdown menu panel

**Modals section** — Add:
- EnhanceModeModal (option card grid pattern)

**Icons section** — Add:
- Sparkles enhance icon (animated pulse when active)

**Inconsistency notes** to add:
- Chat bubble `#1c1f26` vs panel `#2a2a2f` — different dark surfaces
- Model Settings light theme vs app-wide dark theme
- EnhanceModeModal `rounded-2xl` vs CharacterCreationModal `rounded-xl` for option cards
- Folder delete button uses `rounded-full` while all other action buttons use `rounded-xl`

## Execution
Single pass adding all entries, grouped by page under existing section structure.

