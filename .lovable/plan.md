

# Replace Browser `confirm()` with Themed Delete Confirmation Dialog

## Problem
Character deletion uses the browser's native `window.confirm()` dialog, which shows an ugly default popup with the project URL visible.

## Solution
Create a reusable themed confirmation dialog component and replace both `confirm()` calls in `handleDeleteCharacterFromList`.

## Changes

### 1. New Component: `src/components/chronicle/DeleteConfirmDialog.tsx`
- Uses the existing `AlertDialog` from `@/components/ui/alert-dialog`
- Dark-themed to match the app (using the `--ui-surface`, `--ui-border`, `--ui-text` design tokens)
- Title: **"Are you sure you want to Delete this character?"**
- Subtitle: **"This cannot be undone."**
- Two buttons styled with the app's Shadow Surface pattern:
  - **Cancel** -- outline/ghost style
  - **Delete** -- destructive red accent
- Props: `open`, `onOpenChange`, `onConfirm`, and optional `message` for reuse (library vs scenario context)

### 2. Update: `src/pages/Index.tsx`
- Import the new `DeleteConfirmDialog`
- Add state: `deleteConfirmId` (string | null) to track which character is pending deletion
- Replace the two `confirm()` calls with setting `deleteConfirmId` to the character ID
- On dialog confirm, execute the existing delete logic
- On cancel/close, clear `deleteConfirmId`
- Render `DeleteConfirmDialog` once in the component tree

### Visual Spec
- Background: dark panel (`hsl(var(--ui-surface))`) with `hsl(var(--ui-border))` border
- Text: `hsl(var(--ui-text))` for title, muted for subtitle
- Cancel button: Shadow Surface style (`bg-[hsl(var(--ui-surface-2))]`)
- Delete button: red/destructive variant
- Rounded corners: `rounded-xl` to match app aesthetic

