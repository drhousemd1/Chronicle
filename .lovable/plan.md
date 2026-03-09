

## Fix Style Guide Edits Modals — Use App-Standard Styling

The edits system introduced random colors (emerald, amber) and inconsistent modal styling instead of following the established patterns. Here is what needs to change in `StyleGuideEditsModal.tsx` and the overlay/pill code in `StyleGuideTool.tsx`.

### Problems Found

1. **Modal containers** use `bg-zinc-900 border border-white/10` — should use the HSL token standard from `DeleteConfirmDialog`: `bg-[hsl(240_6%_10%)] border border-[hsl(0_0%_100%_/_0.10)]`
2. **KeepOrEditModal buttons** use random `bg-emerald-500/20 text-emerald-300` and `bg-amber-500/20 text-amber-300` — should use the Shadow Surface standard: `bg-[hsl(var(--ui-surface-2))] border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))]` with `h-10 px-6 rounded-xl text-[10px] font-bold leading-none uppercase tracking-wider shadow-[0_10px_30px_rgba(0,0,0,0.35)]`
3. **EditDetailModal save button** — same amber issue, should be Shadow Surface
4. **"Keep" pill** uses emerald colors, **"Edit" pill** uses amber — should use the brand accent `#4a5f7f` for both or use the standard HSL surface tokens
5. **Hover overlay pencil button** — likely using off-brand colors too

### Changes

**File: `src/components/admin/styleguide/StyleGuideEditsModal.tsx`**

- All 3 `DialogContent` containers: replace `bg-zinc-900 border border-white/10` with `bg-[hsl(240_6%_10%)] border border-[hsl(0_0%_100%_/_0.10)]`
- KeepOrEditModal "Keep" button: Shadow Surface standard with a Check icon
- KeepOrEditModal "Edit" button: Shadow Surface standard with a Pencil icon
- EditDetailModal save button: Shadow Surface standard
- Detail section labels: keep `text-[10px] font-bold uppercase tracking-wider` but use `text-[hsl(var(--ui-text-muted))]` instead of `text-zinc-400`
- Detail container: `bg-[hsl(var(--ui-surface))] border border-[hsl(var(--ui-border))]` instead of `bg-zinc-800/60 border border-white/5`
- Textarea: `bg-[hsl(var(--ui-surface))] border border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))]` instead of `bg-zinc-800/60 border border-white/10 text-white`
- EditsListModal rows: same surface token treatment
- All `text-zinc-*` references replaced with the appropriate HSL token (`--ui-text`, `--ui-text-muted`)

**File: `src/components/admin/styleguide/StyleGuideTool.tsx`** (overlay + pills)

- "Keep" pill: `bg-[hsl(var(--ui-surface-2))] border border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))]` with Check icon
- "Edit" pill: same Surface token treatment with Pencil icon
- Hover overlay edit button: use `bg-[hsl(var(--ui-surface-2))]` instead of any random color

### Reference Pattern (from DeleteConfirmDialog)
```
Container:  bg-[hsl(240_6%_10%)] border border-[hsl(0_0%_100%_/_0.10)] shadow-[0_10px_30px_hsl(0_0%_0%_/_0.5)]
Title:      text-[hsl(var(--ui-text))] text-base font-bold
Body text:  text-[hsl(var(--ui-text-muted))] text-sm
Buttons:    rounded-xl bg-[hsl(240_6%_18%)] border-[hsl(0_0%_100%_/_0.10)] text-[hsl(var(--ui-text))] h-10 px-6 text-[10px] font-bold leading-none uppercase tracking-wider shadow-[0_10px_30px_hsl(0_0%_0%_/_0.35)]
```

