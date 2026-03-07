

# Plan: Pass 4 — Remaining Modals, Arc System, and Undocumented Components

## What's Still Missing

After 3 passes, these components have zero Style Guide coverage:

### Modals Not Yet Documented

| Modal | Theme | Container Classes | Inconsistency |
|-------|-------|-------------------|---------------|
| **ChangeNameModal** | Light (default DialogContent) | `max-w-md`, no dark overrides | Uses `bg-slate-100`, `text-slate-700` buttons — light theme like Image Gen modals |
| **AIPromptModal** | Dark with colored header | `bg-[hsl(var(--ui-surface))]`, header `bg-[#4a5f7f]` | Only modal with a **colored header bar** (`bg-[#4a5f7f] -mx-6 -mt-6 px-6 py-4 rounded-t-lg`) |
| **DeleteConfirmDialog** | Dark (AlertDialog) | `bg-[hsl(240_6%_10%)] rounded-2xl border-white/10` | Uses AlertDialog instead of Dialog — different component |
| **DraftsModal** | Dark | `bg-zinc-900 border-white/10 rounded-xl` | Correct dark standard |
| **SceneTagEditorModal** | Dark (custom overlay) | `bg-zinc-900 rounded-xl border-[#4a5f7f]` | Uses custom `fixed inset-0` overlay instead of Dialog component |
| **FolderEditModal** | Dark | `bg-zinc-900 border-[#4a5f7f]` | Uses `border-[#4a5f7f]` instead of standard `border-white/10` |
| **BackgroundPickerModal** | Dark | Chronicle `Card` component | Uses custom Card/Button from `UI.tsx` — different component system |
| **SidebarThemeModal** | Dark | `bg-zinc-900 border-white/10` with full-width `w-[min(96vw,1280px)]` | Correct but wide layout variant |
| **ImageLibraryPickerModal** | Dark | `bg-zinc-900 border-white/10` | Standard |

### Interactive Components Not Yet Documented
- **GuidanceStrengthSlider** — Custom 3-point slider with gradient fill (`linear-gradient(90deg, #2b4e8d, #4b79d8 60%, #7dadf5)`), white knob, labels
- **CircularProgress** — SVG ring with light/dark variants, color states (green-500 complete, blue-500 in-progress, slate empty)
- **TagInput** — Tag chips `bg-blue-500/20 text-blue-300 rounded-full border-blue-500/30` with X remove button

### Arc System (arc/ directory) — Entirely Undocumented
- **ArcPhaseCard** — Phase container with progress ring, branch lanes, sparkle enhance buttons
- **ArcBranchLane** — Success/Fail lanes with colored strips (`rgba(240,74,95,0.28)` fail, `rgba(34,197,127,0.28)` success), step cards (`rgba(78,58,68,0.78)` / `rgba(51,75,66,0.78)`)
- **ArcConnectors/ArcFlowConnector** — SVG connection lines between branches
- Phase delete button: `w-[30px] h-[30px] rounded-[10px] border-red-400/50` — non-standard size

### Key Inconsistencies to Catalog
1. **ChangeNameModal** uses light theme (default DialogContent) — same issue as Image Gen modals
2. **AIPromptModal** has a unique colored header pattern not used anywhere else
3. **SceneTagEditorModal** uses manual overlay (`fixed inset-0 bg-black/85`) instead of Dialog component
4. **FolderEditModal** uses `border-[#4a5f7f]` accent border while most modals use `border-white/10`
5. **Arc system** uses `rgba()` inline colors instead of Tailwind tokens — unique to this component
6. **Phase delete button** `rounded-[10px]` vs standard `rounded-xl` (12px)
7. **TagInput** tag chips use different styling than content theme chips (blue-500/20 vs category-specific colors)

## Implementation

Add ~18 new entries across existing sections in `StyleGuideTool.tsx`:

**Modals section** — Add:
- ChangeNameModal (light theme — inconsistency note)
- AIPromptModal (colored header pattern — inconsistency note)
- DeleteConfirmDialog (AlertDialog variant)
- SceneTagEditorModal (custom overlay — inconsistency note)
- BackgroundPicker / SidebarTheme (Chronicle UI Card pattern)

**Buttons section** — Add:
- Arc phase delete button (`rounded-[10px]` — inconsistency)
- Tag chip remove button (X on blue chip)

**Form Inputs section** — Add:
- GuidanceStrengthSlider (custom 3-point slider)
- TagInput component (enter-to-add pattern)
- SceneTagEditor input (`bg-zinc-800 border-zinc-700`)

**Badges section** — Add:
- CircularProgress (SVG ring, light/dark variants)
- Tag chips (`bg-blue-500/20 rounded-full`)

**Panels section** — Add:
- Arc Phase Card container
- Arc Branch Lane (fail/success color-coded lanes)
- Arc step cards (rgba inline colors — inconsistency note)

**Inconsistency notes** — Add:
- ChangeNameModal: light theme default
- AIPromptModal: unique colored header
- SceneTagEditorModal: custom overlay instead of Dialog
- FolderEditModal: accent border `border-[#4a5f7f]` vs standard `border-white/10`
- Arc system: inline `rgba()` instead of Tailwind tokens
- Arc delete button: `rounded-[10px]` vs standard `rounded-xl`

## File Changes

| File | Change |
|------|--------|
| `src/components/admin/styleguide/StyleGuideTool.tsx` | Add ~18 new entries + 6 new InconsistencyNote blocks |

