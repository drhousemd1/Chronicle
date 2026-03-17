

# Rebuild All Chooser Modals from Scratch with Shared Component

## The Problem
The 6 chooser modals have been patched repeatedly but still don't match the builder container system used everywhere else in the app. Instead of continuing to patch, we delete all 6 and replace them with one shared reusable component.

## Source of Truth: Builder Container Pattern
From `StoryGoalsSection.tsx`, `CharacterGoalsSection.tsx`, and `WorldTab.tsx`:

- **Outer shell**: `bg-[#2a2a2f] rounded-[24px] overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]`
- **Header**: `relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-3 flex items-center gap-3 shadow-lg`
- **Header gloss**: `absolute inset-0 z-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40` with `style={{ height: '60%' }}`
- **Header title**: `text-white text-xl font-bold tracking-[-0.015em] relative z-[1]`
- **Inner card**: `p-5 pb-6 bg-[#2e2e33] rounded-2xl shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]`

## What's Actually Wrong Right Now
The modals use a **different shadow** on the outer shell (`0_20px_50px` instead of `0_12px_32px_-2px`), a **different gloss** (`bg-gradient-to-b from-white/[0.08] h-1/2` instead of `bg-gradient-to-tr from-white/10 opacity-40 height:60%`), and **missing `overflow-hidden`** on the header. These are the visual discrepancies causing the "wrong corners" look.

## Plan

### Step 1: Create shared `ChooserModal` component
New file: `src/components/chronicle/ChooserModal.tsx`

```typescript
interface ChooserOption {
  key: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  hoverColor?: string; // e.g. 'blue-500', 'purple-500'
}

interface ChooserModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  options: ChooserOption[];
  onSelect: (key: string) => void;
  columns?: 2 | 3;
}
```

The component uses `Dialog` + `DialogContent` with the **exact** builder container classes listed above. No bespoke styling. Copy-paste from the builder sections.

### Step 2: Rewrite all 6 modal files
Each file becomes a thin wrapper that imports `ChooserModal` and passes its specific options array:

1. **`CharacterCreationModal.tsx`** - 2 options (Import / New), calls `onImportFromLibrary` or `onCreateNew`
2. **`CustomContentTypeModal.tsx`** - 2 options (Structured / Freeform), calls `onSelect(type)`
3. **`EnhanceModeModal.tsx`** - 2 options (Precise / Detailed), calls `onSelect(mode)`
4. **`StoryImportModeModal.tsx`** - 2 options (Merge / Rewrite), calls `onSelect(mode)`
5. **`StoryExportFormatModal.tsx`** - 3 options (Markdown / JSON / Word), `columns={3}`
6. **`KeepOrEditModal`** in `StyleGuideEditsModal.tsx` - 2 options (Keep / Edit), uses `onOpenChange`

All exported interfaces and types stay the same so no consumer code changes are needed.

### Step 3: Verify no imports break
All existing imports (`CharacterCreationModal`, `EnhanceModeModal`, etc.) continue to work because each file still exports the same named component with the same props interface.

