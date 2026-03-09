

## Fix Chat Interface Buttons Section

### Current State (lines 1319-1355)
Three `EntryCard` entries that need converting to `ButtonCardV2`:
1. "Chat Settings / Generate Image Buttons"
2. "Chat Send Button (Active / Inactive)"  
3. "Chat Message Action Icons"

### Missing Buttons (from actual code)
4. **Sidebar Settings Cog** — icon-only Shadow Surface button (`rounded-xl px-3 py-2`, same tokens). Opens dropdown with "Set Theme".
5. **Exit Scenario** — text link button with chevron icon. Adaptive color: dark bg → `text-white hover:text-blue-300`, light bg → `text-black hover:text-blue-600`. `text-xs font-black uppercase tracking-widest`.
6. **Time of Day Selectors** — 4 icon buttons (Sunrise/Day/Sunset/Night). Active: `bg-blue-100 border-2 border-blue-400 text-blue-600 shadow-sm`. Inactive: `bg-white border border-black text-black hover:bg-slate-100`. `p-2 rounded-lg`.
7. **Day Counter +/− Arrows** — tiny stepper buttons inside white pill. `px-1.5 py-0.5 hover:bg-slate-100 text-black hover:text-blue-600`. Down disabled at day 1.
8. **Memory Quick Save** — per-message brain icon. Default: `text-slate-500 hover:text-purple-400 hover:bg-white/10`. Saved: `text-purple-400 hover:bg-purple-500/20`. `p-1.5 rounded-lg`.
9. **Timer Pause/Play** — micro button in auto-timer row. `p-0.5 rounded hover:bg-black/30`. Uses `getTimeTextColor()` for adaptive color.

### Plan

Replace the 3 `EntryCard` entries (lines 1321-1355) with 9 `ButtonCardV2` entries:

**1. Chat Settings / Generate Image** → `ButtonCardV2`
- buttonColor: `hsl(var(--ui-surface-2)) — bg-[hsl(var(--ui-surface-2))]`
- textColor: `hsl(var(--ui-text)) — text-[hsl(var(--ui-text))]`
- size: `rounded-xl px-4 py-2 — text-[10px] font-bold uppercase tracking-widest`
- purpose: `Open chat settings modal / trigger scene image generation`
- visualEffects: `border-[hsl(var(--ui-border))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:border-[hsl(var(--ui-border-hover))]`
- locations: `ChatInterfaceTab — quick actions bar above input`

**2. Chat Send Button** → `ButtonCardV2`
- Show both active and inactive states
- Active: `bg-[#4a5f7f] text-white border-[#4a5f7f]`
- Inactive: `bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text-muted))] opacity-50`

**3. Chat Message Action Icons** → `ButtonCardV2`
- `p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10`
- Include green (save) and red (cancel) variants

**4. Sidebar Settings Cog** (NEW)
- Icon-only Shadow Surface variant, `rounded-xl px-3 py-2`
- Same tokens as other Shadow Surface buttons

**5. Exit Scenario** (NEW)
- Adaptive text link: dark bg `text-white`, light bg `text-black`
- `text-xs font-black uppercase tracking-widest`

**6. Time of Day Selectors** (NEW)
- Active/inactive toggle states, `p-2 rounded-lg`
- Active: `bg-blue-100 border-2 border-blue-400 text-blue-600`

**7. Day Counter Arrows** (NEW)
- Stepper inside white pill, `px-1.5 py-0.5`

**8. Memory Quick Save** (NEW)
- Per-message brain icon with default/saved states
- Default: `text-slate-500`, Saved: `text-purple-400`

**9. Timer Pause/Play** (NEW)
- Micro control, `p-0.5 rounded`

All entries use `pageSpecific={true}`, `appWide={false}`. Entries 1-3 keep their existing preview styles. Entries 6-9 need dark preview wrappers since they render on dark/image backgrounds.

