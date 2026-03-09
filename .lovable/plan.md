

## Fix My Stories Page Buttons in Style Guide

After reviewing `Index.tsx` (hub tab header, lines 1637-1890) and `StoryHub.tsx` (card grid), here are **all** buttons actually present on the My Stories page:

### Buttons currently in the style guide
1. **Card Hover Buttons — Edit / Delete / Play** (h-8 compact variant) ✅ correct
2. **Tab Pills — Active / Inactive** ✅ correct

### Buttons MISSING from the style guide

3. **Settings Gear Icon Button** (line 1875-1880) — `rounded-xl px-3 py-2 border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]` with a Settings icon. No text, just icon.

4. **New Story Card** (StoryHub.tsx line 261-269) — `aspect-[2/3] rounded-[2rem] border-2 border-dashed border-zinc-600 bg-gradient-to-br from-zinc-800 to-zinc-900` with a `+` icon in a circle and "New Story" label. This is a full card-sized button, not a standard button.

5. **Story Detail Modal buttons** (opened from My Stories cards via StoryDetailModal.tsx):
   - **Edit** (owned mode): `flex-1 h-12 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-semibold` with Edit icon
   - **Play** (both modes): `flex-1 h-12 bg-[#3b82f6] hover:bg-[#2563eb] rounded-xl text-white shadow-md text-sm font-semibold` with Play icon
   - **Remove from Gallery**: `w-full h-10 bg-white/5 border border-white/10 text-white/60 rounded-xl font-semibold text-sm` with Globe icon

### Changes to `StyleGuideTool.tsx`

After the existing "Tab Pills" entry (~line 1130), add three new `EntryCard` entries under the My Stories section:

1. **"Settings Gear Button"** — pageTag "My Stories", preview showing the gear icon button with the exact shadow-surface styling, specs noting it's a compact icon-only variant of the default button
2. **"New Story Card"** — pageTag "My Stories", preview showing the dashed-border card with + icon and "New Story" text, specs noting the gradient background and dashed border
3. **"Story Detail Modal Buttons — Edit / Play / Remove"** — pageTag "My Stories", preview showing all three button variants side by side, specs noting the h-12 size, bg-white/5 glass style for Edit, bg-[#3b82f6] for Play, and the full-width Remove from Gallery button

