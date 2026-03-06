

## Fix: Story Hub hover buttons to match standard button spec

**File:** `src/components/chronicle/StoryHub.tsx`, lines 82-99

The Edit/Delete/Play hover buttons on story cards use `px-4 py-2 text-xs rounded-xl` which makes them small and pill-shaped. They need the standard button spec so they match the rest of the app.

### Changes

Update all three buttons to use the standard button classes:

**Base classes (all three):** `h-10 px-6 rounded-xl text-[10px] font-bold leading-none uppercase tracking-wider shadow-2xl transition-colors`

| Button | Color classes |
|--------|-------------|
| Edit | `bg-white text-slate-900 hover:bg-slate-50` (unchanged) |
| Delete | `bg-[hsl(var(--destructive))] text-white hover:bg-[hsl(var(--destructive))]/90` (was `bg-rose-600`) |
| Play | `bg-blue-600 text-white hover:bg-blue-500` (unchanged) |

This gives them proper height, wider padding, correct typography, and consistent corner radius proportions. The delete button color also aligns with the destructive color token used in DeleteConfirmDialog.

