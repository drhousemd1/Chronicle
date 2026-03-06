

## Plan: Adaptive Character Card Theming Based on Sidebar Background Brightness

### Problem
The character tile cards in the sidebar use a fixed light frosted glass style (`bg-white/30`, dark text, light hover states). This looks great on dark backgrounds but gets lost on light ones, as shown in the screenshots.

### Approach
The `sidebarBgIsLight` state already exists and drives the "Exit Scenario" text color. We'll extend it to the character cards, scroll indicators, and the `SideCharacterCard` component.

### Changes

**1. `src/components/chronicle/ChatInterfaceTab.tsx` — `renderCharacterCard` (~line 3095)**

Pass `sidebarBgIsLight` into the card styling:

- **Card container**: `bg-white/30 hover:bg-white` → when dark bg: `bg-black/30 hover:bg-black/50`
- **Name text**: `text-slate-800` → when dark bg: `text-white`
- **Menu dots button**: `hover:bg-slate-200 text-slate-700` → when dark bg: `hover:bg-white/20 text-white/70 hover:text-white`
- **Dropdown menu**: `bg-white border-slate-200` → when dark bg: `bg-zinc-800 border-white/10` with light text items
- **Avatar fallback**: `bg-slate-50 border-slate-100 text-slate-300` → when dark bg: `bg-zinc-800 border-white/20 text-zinc-500`
- **Scroll overflow indicator** (~line 3362): `bg-white/30 text-black/80` → when dark bg: `bg-black/30 text-white/80`

**2. `src/components/chronicle/SideCharacterCard.tsx`**

Add an `isDarkBg` prop to the component and apply the same adaptive styling:
- Card: `bg-white/30 hover:bg-white` ↔ `bg-black/30 hover:bg-black/50`
- Name: `text-slate-800` ↔ `text-white`
- Menu button: dark ↔ light variants
- Avatar circle: `bg-purple-50 border-purple-100` ↔ `bg-zinc-800 border-white/20`
- Avatar fallback text: `text-purple-300` ↔ `text-zinc-400`

**3. Pass prop through to `SideCharacterCard`** (~lines 3346, 3388)

Add `isDarkBg={!sidebarBgIsLight}` to all `<SideCharacterCard>` usages.

### What stays the same
- The frosted `backdrop-blur-sm` effect remains on all cards regardless of theme
- The blue/slate `Badge` for AI/User control stays unchanged (works on both)
- The `ring-2 ring-blue-400` updating indicator stays the same
- The section headers (`MAIN CHARACTERS`, `SIDE CHARACTERS`) remain unchanged

### Result
Cards will smoothly transition between a light frosted glass (on dark backgrounds) and a dark frosted glass (on light backgrounds), keeping text, icons, and menus legible in both cases — same adaptive behavior already used for the "Exit Scenario" header.

