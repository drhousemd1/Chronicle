

# Plan: Pass 6 — Shared Modal Patterns, Layout Structures, and Final Undocumented Components

## What's Still Missing

After 5 passes (2944 lines), these patterns remain undocumented:

### 1. Shared "Two-Option Selection Modal" Pattern
Three modals use the exact same layout — `CharacterCreationModal`, `EnhanceModeModal`, `CustomContentTypeModal` — but only EnhanceModeModal has an entry. All three share:
- Container: `bg-zinc-900 border-white/10 p-0 gap-0 [&>button]:hidden`
- Header: `px-6 pt-5 pb-3` with `text-white text-lg font-bold tracking-tight`
- Grid: `px-6 pb-6 grid grid-cols-2 gap-3`
- Option cards: `p-5 rounded-2xl border border-white/10 bg-zinc-800/50` with blue/purple hover variants
- Icon containers: `w-10 h-10 rounded-xl bg-blue-500/20` (left) / `bg-purple-500/20` (right)

This is a reusable **design pattern** that should be documented as a shared template.

### 2. Chat Interface White Sidebar
The chat view has a unique white sidebar (`bg-white`, `shadow-[inset_-4px_0_12px_rgba(0,0,0,0.02)]`) with optional background image overlay (`bg-white/90 backdrop-blur-md`). Contains:
- `#4a5f7f` section headers (`MAIN CHARACTERS`, `SIDE CHARACTERS`) as `rounded-lg` pills
- Collapsible sections with chevron toggles
- SideCharacterCards with dual dark/light mode
- **Inconsistency**: White sidebar in an otherwise dark-themed app

### 3. World Tab Sidebar & Layout
The World Tab has a distinct two-pane layout:
- Left sidebar: `w-[260px] bg-[#2a2a2f] border-r border-white/10` with `#4a5f7f` header
- "Add Character" dashed button: `bg-[#3a3a3f]/30 hover:bg-[#3a3a3f]/50` with `w-14 h-14 rounded-xl bg-[#1a1a1f] border-2 border-dashed border-zinc-600`
- Right content area uses Chronicle `UI.tsx` components (Cards, Inputs) — light theme on dark background

### 4. Character Builder Collapsible Sections (CharactersTab)
The CharactersTab uses a unique collapsible section pattern:
- Container: `bg-[#2a2a2f] rounded-[24px] border border-white/10 shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]`
- Header bar: `bg-[#4a5f7f] border-b border-white/20 px-5 py-3 shadow-lg`
- Inner card: `bg-[#3a3a3f]/30 rounded-2xl border border-white/5`
- Form rows: label `w-2/5 bg-zinc-900/50 border-white/10 rounded-lg` + value input `bg-zinc-900/50 border-white/10 rounded-lg`
- Lock icons: `w-3.5 h-3.5 text-zinc-400` — no docs on this pattern

### 5. Chat Interface Sidebar Collapsible Sections
Within the chat sidebar, info sections use:
- Header: `text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]` with rotate-180 chevron
- Items: `text-[9px] font-bold text-slate-400 uppercase tracking-wider` labels + `text-[11px] font-bold text-slate-700` values
- **Inconsistency**: Uses `text-slate-700` (light theme) in a sidebar that's `bg-white`

### 6. Account Page — Undocumented Tab Patterns
- Profile tab: Chronicle `UI.tsx` Card/Input on dark `#1e1e22` background
- Avatar upload area with dashed border container
- Subscription tab patterns

### 7. Image Library Tab Layout
- Folder grid with `rounded-[2rem] aspect-[2/3]` cards
- Image grid within folders with star/favorite toggle
- Drag-and-drop upload zone pattern

## Implementation

Add ~14 new entries:

**Modals section** — Add:
- "Two-Option Selection Modal" shared pattern (covering CharacterCreation, EnhanceMode, CustomContentType)

**Panels section** — Add:
- Chat Interface White Sidebar layout
- World Tab two-pane layout with sidebar
- Character Builder Collapsible Section pattern
- Chat sidebar info section (collapsible light-theme)
- World Tab "Add Character" dashed button
- Character Builder form row (label + value + lock)

**Form Inputs section** — Add:
- Character Builder inline inputs (`bg-zinc-900/50 border-white/10 rounded-lg`)

**Inconsistency notes** — Add:
- Three identical modal patterns (CharacterCreation, EnhanceMode, CustomContentType) not sharing a component
- Chat sidebar uses white/light theme inside a dark-themed page
- Character Builder section uses `rounded-[24px]` — yet another radius variant
- World Tab mixes Chronicle UI light-theme components on dark sidebar background

## File Changes

| File | Change |
|------|--------|
| `src/components/admin/styleguide/StyleGuideTool.tsx` | Add ~14 new entries + 4 InconsistencyNote blocks |

