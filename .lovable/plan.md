

# Merge Panels + Modals into "Panels & Modals" V2 Section

## Current State

The Panels section (lines 3124-3937) uses legacy `EntryCard` components in a vertical stack layout. The Modals section (lines 3942-4347) also uses `EntryCard`. Both need to be merged into one section using a new `PanelCardV2` component in the responsive grid layout matching Colors, Typography, Buttons, Form Inputs, and Badges & Tags.

## New V2 Card Component: `PanelCardV2`

Create after `BadgeCardV2` (~line 530). Same card shell pattern (white `sg.surface` bg, black 2px border, rounded-10, hover lift, `CardEditOverlay`).

**Props:**
- `panelName` (string) — human-readable name
- `preview` (ReactNode) — live preview of the panel/modal
- `background` (string) — e.g. `bg-zinc-900`
- `border` (string) — e.g. `border-white/10`
- `borderRadius` (string) — e.g. `rounded-lg`
- `shadow` (string, optional) — e.g. `0 10px 30px rgba(0,0,0,0.5)`
- `purpose` (string)
- `locations` (string)
- `pageSpecific` / `appWide` (boolean)
- `notes` (string, optional)

Preview strip: white bg (`#fff`), same as other V2 cards.

## Section Structure

Merge `panels` and `modals` nav entries into single `{ id: 'panels', label: 'Panels & Modals' }`. Remove the separate `modals` entry from `SECTIONS`. The section title becomes "Panels & Modals".

Use responsive grid: `repeat(auto-fit, minmax(280px, 1fr))`, gap 14px. Group with `fullSpan` `PageSubheading` dividers.

## Entries — Panels (verified from source code)

### Story Builder Page
1. **Panel Container** — `bg-[#2a2a2f] rounded-[24px] border border-white/10 shadow-[0_12px_32px_-2px_rgba(0,0,0,0.5)]` (CharactersTab.tsx)
2. **Panel Header Bar** — `bg-[#4a5f7f] px-5 py-3 border-b border-white/20 shadow-lg` (CharactersTab.tsx)
3. **Story Card** — `aspect-[2/3] rounded-[2rem] border border-[#4a5f7f] shadow-[0_12px_32px_-2px_rgba(0,0,0,0.5)]` gradient overlay (StoryHub.tsx, GalleryStoryCard.tsx)

### Chat Interface
4. **Chat Message Bubble (AI/User/Transparent)** — AI: `bg-[#1c1f26] rounded-[2rem] border border-white/5 p-8 pt-14 pb-12`, User: `border-2 border-blue-400`, Transparent: `bg-black/50` (ChatInterfaceTab.tsx)
5. **Frosted Glass Character Card** — isDarkBg: `bg-white/30 text-slate-800`, light: `bg-black/30 text-white`, `rounded-2xl backdrop-blur-sm` (SideCharacterCard.tsx)
6. **Chat Input Bar** — `bg-[hsl(var(--ui-surface))] border-t border-[hsl(var(--ui-border))] shadow-[0_-4px_12px_rgba(0,0,0,0.15)]` (ChatInterfaceTab.tsx)
7. **Chat Sidebar (White)** — `bg-white shadow-[inset_-4px_0_12px_rgba(0,0,0,0.02)]`, section headers `bg-[#4a5f7f] rounded-lg` (ChatInterfaceTab.tsx)
8. **Chat Sidebar Collapsible Info** — labels `text-[9px] font-bold text-slate-400 uppercase`, values `text-[11px] font-bold text-slate-700` (ChatInterfaceTab.tsx)
9. **Side Character Card (Dual Mode)** — frosted glass, `w-20 h-20 rounded-full` avatar (SideCharacterCard.tsx)
10. **Day/Time Sky Panel** — stacked imgs with crossfade, `bg-black/20` overlay, `shadow-lg` (ChatInterfaceTab.tsx)

### Chat History
11. **Session Card (Double-nested)** — outer `bg-[#2a2a2f] rounded-2xl border border-[#4a5f7f] p-4`, inner `bg-[#3a3a3f]/30 rounded-2xl border border-white/5 p-4` (ConversationsTab.tsx)

### Community Gallery
12. **Category Sidebar** — `bg-[#18181b] w-72 border-r border-white/10`, yellow accent `h-0.5 bg-yellow-400` (GalleryCategorySidebar.tsx)

### Image Library
13. **Folder Grid Card** — same card pattern as Story Card (ImageLibraryTab.tsx)

### Account Page
14. **Settings Card** — `bg-[#1e1e22] rounded-2xl border-white/10 p-6` (AccountSettingsTab.tsx)
15. **Subscription Tier Cards** — Free: `bg-white/5 border-white/10`, Pro: `bg-[#4a5f7f]/10 border-[#4a5f7f]/30`, Premium: `bg-amber-500/10 border-amber-500/20` (SubscriptionTab.tsx)

### Auth Page
16. **Auth Card** — `bg-slate-800/50 border-slate-700 backdrop-blur-sm max-w-md` (Auth.tsx)

### Global
17. **Global Sidebar** — `bg-[#1a1a1a] border-r border-black shadow-2xl`, expanded w-[280px], collapsed w-[72px] (ChronicleApp.tsx)
18. **Dropdown Menu** — `bg-zinc-800 border-white/10 rounded-md`, items `hover:bg-zinc-700`, destructive `text-red-600` (global pattern)

### World Tab
19. **HintBox** — `bg-zinc-900 rounded-xl p-4 border border-white/5`, diamond bullets (WorldTab.tsx)
20. **CharacterButton** — `bg-black/80 rounded-2xl border-[#4a5f7f] hover:border-[#6b82a8]`, error: `border-2 border-red-500` (WorldTab.tsx)
21. **World Tab Two-Pane Layout** — sidebar `w-[260px] bg-[#2a2a2f] border-r border-white/10`, right uses Chronicle UI Cards (WorldTab.tsx)

### Character Builder
22. **Builder Collapsible Section** — `bg-[#2a2a2f] rounded-[24px]`, header `bg-[#4a5f7f] border-b border-white/20`, inner `bg-[#3a3a3f]/30 rounded-2xl` (CharactersTab.tsx)

### Story Detail
23. **Story Detail Character Card** — `bg-white/5 rounded-xl p-3` (StoryDetailModal.tsx)
24. **Review Card** — `bg-white/5 rounded-xl p-4` (StoryDetailModal.tsx)

### Share Story
25. **Blue Info Callout** — `bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-blue-300` (ShareStoryModal.tsx)

### Art Style Selection
26. **Art Style Selection Card** — `rounded-xl bg-card ring-1 ring-border p-2`, selected: `ring-2 ring-blue-400 shadow-md` (AvatarGenerationModal, CoverImageGenerationModal, SceneImageGenerationModal)

### CharacterPicker
27. **CharacterPicker Overlay** — `bg-zinc-900 rounded-3xl border-white/10`, overlay `bg-slate-900/50 backdrop-blur-sm` (CharacterPicker.tsx)

### ScrollableSection
28. **ScrollableSection Fade** — `from-white via-white/80 to-transparent h-8` (ScrollableSection.tsx)

### Chronicle UI System
29. **Chronicle UI Card** — `rounded-3xl border-slate-200 bg-white p-4 shadow-sm` (UI.tsx)

### Arc System
30. **Arc Phase Card** — `bg-[#2a2a2f] rounded-2xl border-white/10`, progress ring, success/fail branch lanes (ArcPhaseCard.tsx)
31. **Arc Branch Lane** — success `rgba(34,197,127,0.28)`, fail `rgba(240,74,95,0.28)`, step cards with colored border-left (ArcBranchLane.tsx)

### Creator Profile
32. **Creator Profile Card** — `bg-[#1e1e22] rounded-2xl border-white/10 p-6` (CreatorProfile.tsx)

## Entries — Modals (verified from source code)

### Global Patterns
33. **Modal Backdrop** — Standard: `bg-black/80` (DialogOverlay). Variants: bg-black/90 backdrop-blur-sm (ReviewModal), bg-black/85 (SceneTagEditorModal)
34. **Modal Footer / Button Row** — `h-10 px-6 rounded-xl text-[10px] font-bold uppercase tracking-wider`, standard/cancel/destructive variants

### Specific Modals
35. **DeleteConfirmDialog** — AlertDialog, `bg-[hsl(240_6%_10%)] rounded-2xl border-[hsl(0_0%_100%_/_0.10)] shadow-[0_10px_30px_hsl(0_0%_0%_/_0.5)]` (DeleteConfirmDialog.tsx)
36. **Chat Settings Modal** — `max-w-2xl bg-zinc-900 border-white/10 shadow-[0_12px_32px_-2px_rgba(0,0,0,0.5)]`, toggle grid 2-col (ChatInterfaceTab.tsx)
37. **Two-Option Selection Modal** — `bg-zinc-900 border-white/10 p-0 gap-0 [&>button]:hidden`, 2-col grid, blue/purple option cards (CharacterCreationModal, EnhanceModeModal, CustomContentTypeModal)
38. **AIPromptModal** — `bg-[hsl(var(--ui-surface))] border-[hsl(var(--ui-border))]`, colored header `bg-[#4a5f7f] -mx-6 -mt-6 px-6 py-4 rounded-t-lg` (AIPromptModal.tsx)
39. **CharacterEditModal** — `max-w-6xl bg-[#2a2a2f] border-white/10`, header `bg-black` (CharacterEditModal.tsx)
40. **ShareStoryModal** — `bg-[#2a2a2f] border-white/10 max-w-lg`, !important button overrides (ShareStoryModal.tsx)
41. **StoryDetailModal** — `bg-[#121214] rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)]`, custom overlay (StoryDetailModal.tsx)
42. **ReviewModal** — `bg-[#121214] rounded-2xl`, custom overlay `bg-black/90 backdrop-blur-sm`, buttons `h-11 text-sm` (ReviewModal.tsx)
43. **DraftsModal** — `rounded-xl bg-zinc-900 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] max-w-md p-0` (DraftsModal.tsx)
44. **FolderEditModal** — `bg-zinc-900 border-[#4a5f7f] [&>button]:hidden` (FolderEditModal.tsx)
45. **SidebarThemeModal** — `w-[min(96vw,1280px)] bg-zinc-900 border-white/10 shadow-[0_12px_32px_-2px_rgba(0,0,0,0.5)] [&>button]:hidden` (SidebarThemeModal.tsx)
46. **SceneTagEditorModal** — Custom `fixed inset-0` overlay, `bg-zinc-900 rounded-xl border-[#4a5f7f]` (SceneTagEditorModal.tsx)
47. **Image Generation Modals** — Default shadcn DialogContent (light bg), `bg-slate-50 border-slate-200` inputs (AvatarGenerationModal, CoverImageGenerationModal, SceneImageGenerationModal)
48. **ChangeNameModal** — Default DialogContent (light), `bg-slate-100 text-slate-700` cancel, `bg-slate-900 text-white` save (ChangeNameModal.tsx)
49. **BackgroundPickerModal** — `bg-transparent shadow-none [&>button]:hidden`, wraps Chronicle UI `Card` (BackgroundPickerModal.tsx)
50. **ImageLibraryPickerModal** — Default DialogContent, header `bg-slate-50` (ImageLibraryPickerModal.tsx)
51. **MemoriesModal** — `bg-slate-900 border-slate-700` (MemoriesModal.tsx — still exists in code even though backend-handled)

## Implementation Notes

- Each entry gets its own `PanelCardV2` with source-accurate preview and labeled metadata fields
- Previews show miniaturized versions of the actual panels/modals using their real Tailwind classes
- For dark-themed elements shown on white preview strip, wrap in a dark container for contrast visibility (per the style guide data standards memory)
- Remove both the existing `panels` and `modals` sections entirely and replace with the merged section
- Keep all relevant `InconsistencyNote` entries, converting them to sit within the grid properly
- Update `SECTIONS` array: replace `{ id: 'panels', label: 'Panels' }` with `{ id: 'panels', label: 'Panels & Modals' }` and remove `{ id: 'modals', label: 'Modals' }`

