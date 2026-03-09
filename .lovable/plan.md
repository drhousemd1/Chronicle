

## Fix KeepOrEditModal — Use Two-Option Card Pattern

The KeepOrEditModal currently uses small action buttons. It should use the **Two-Option Selection Modal** pattern from `CharacterCreationModal.tsx` — borderless container, 2-column grid of large `rounded-2xl` option cards with `w-10 h-10` icon containers, titles, and short descriptions.

### Reference (CharacterCreationModal)
- Container: `bg-zinc-900 border-white/10 p-0 gap-0 [&>button]:hidden`
- Title: `text-white text-lg font-bold tracking-tight`
- Subtitle: `text-zinc-400 text-sm`
- Cards: `rounded-2xl border border-white/10 bg-zinc-800/50` with hover: `hover:border-blue-500/50 hover:bg-blue-500/10`
- Icon containers: `w-10 h-10 rounded-xl` with colored backgrounds (`bg-blue-500/20`, `bg-purple-500/20`)
- Card text: `text-white font-bold text-sm` title, `text-zinc-400 text-xs` description

### Changes to `StyleGuideEditsModal.tsx` — KeepOrEditModal

Replace the current two-button layout with:

- **Container**: `sm:max-w-md bg-zinc-900 border-white/10 p-0 gap-0 [&>button]:hidden`
- **Header**: `px-6 pt-5 pb-3` with card name as `text-white text-lg font-bold` and subtitle "Select an option below to continue." as `text-zinc-400 text-sm`
- **Grid**: `px-6 pb-6 grid grid-cols-2 gap-3`
- **Keep card**: `rounded-2xl border border-white/10 bg-zinc-800/50` with `hover:border-blue-500/50 hover:bg-blue-500/10`. Blue icon container (`bg-blue-500/20`) with `Check` icon (`text-blue-400`). Title "Keep As-Is", description "Mark this element as verified and correct"
- **Edit card**: Same base with `hover:border-purple-500/50 hover:bg-purple-500/10`. Purple icon container (`bg-purple-500/20`) with `Pencil` icon (`text-purple-400`). Title "Flag for Edit", description "Add notes on what needs to change"

This matches the exact pattern shown in Image 2 (CharacterCreationModal).

