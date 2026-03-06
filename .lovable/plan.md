

## Plan: Update Guide Documents for Recent Changes

Based on reviewing the codebase and docs, here are the documents that need updates and what needs to change in each:

---

### 1. `docs/guides/ui-styling-theme-reference.md`

**Add new section: Adaptive / Brightness-Aware Patterns**
- Document the `sidebarBgIsLight` brightness detection system (luminosity > 128 threshold)
- Document the adaptive frosted glass card pattern: light bg uses `bg-black/30 hover:bg-black/50 text-white`, dark bg uses `bg-white/30 hover:bg-white text-slate-800`
- Document `SideCharacterCard` `isDarkBg` prop pattern

**Add new section: Info Tooltip Pattern**
- Document the standardized info tooltip styling: `text-xs font-semibold leading-relaxed normal-case tracking-normal`, icon `text-blue-500`, max-w `300px`, bullet lists use `list-outside pl-4`
- Document that `TooltipContent` uses `TooltipPrimitive.Portal` with `z-[80]` and `collisionPadding`

**Update Section 5 (Component Variants)**
- Add `SidebarThemeModal` dark theme pattern: `bg-zinc-900 border-white/10`, dark dropdown `bg-zinc-800`

**Update "Last updated" line**

---

### 2. `docs/guides/chat-interface-page-structure-guide.md`

**Update Section 9b (Chat Settings)**
- Add `timeProgressionMode` and `timeProgressionInterval` to the settings table
- Note the 5-minute interval option (values: 5, 10, 15, 30, 60)
- Document the dual persistence: UI settings → `stories.ui_settings`, time state → `conversations` table

**Update Section 8 (State Management)**
- Add `sidebarBgIsLight` state and its purpose (drives adaptive card theming)

**Update Section 9 (Styling Reference)**
- Add subsection for adaptive character card theming (frosted glass inversion based on sidebar brightness)

**Update Section 5 (Modals)**
- Update Sidebar Theme Modal entry to note dark theme styling (`bg-zinc-900 border-white/10`)

**Update "Last updated" line**

---

### 3. `docs/guides/scenario-builder-page-structure-guide.md`

**Update Section 3 (UI Elements)**
- Update Opening Dialog row to include MODE (Manual/Automatic) dropdown and TIME INTERVAL dropdown (5/10/15/30/60 minutes)

**Update Section 7 (Component Tree)**
- Add MODE and TIME INTERVAL controls under Opening Dialog section

**Update Bug Report Items (Section 12)**
- Mark Bugs #1, #4, #5, #6 as RESOLVED (they were already resolved in the chat interface guide but still listed as ACTIVE here)

**Update "Last updated" line**

---

### 4. `docs/guides/shared-elements-architecture-structure-guide.md`

**Add SideCharacterCard to the Quick-Reference Index**
- Now accepts `isDarkBg` prop, used in ChatInterfaceTab — note this as an imported component with adaptive theming

**Update "Last updated" line if one exists, or add note to Known Issues**

---

### Summary of recent changes to document:
1. **5-minute time interval** added to both Chat Interface and Story Builder dropdowns
2. **Sidebar Theme Modal** restyled to dark theme (`bg-zinc-900`)
3. **Adaptive character card theming** — cards switch between light/dark frosted glass based on sidebar background brightness via `sidebarBgIsLight` / `isDarkBg` prop
4. **Info tooltip standardization** — portal-based rendering, `z-[80]`, consistent styling
5. **Chat settings persistence** — UI settings to `stories.ui_settings`, time state to `conversations` table
6. **Time progression persistence** — mode, interval, and `time_remaining` now persisted to `conversations` table
7. **Scenario Builder bug items** — several listed as ACTIVE were already resolved

