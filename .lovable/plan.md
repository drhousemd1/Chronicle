

# Fix: Rounder Option Cards in Chooser Modals

## Problem
The 4 recently restyled chooser modals use `rounded-2xl` (16px) on option cards, making them look too square compared to every other modal in the app. The Export and Import modals use `rounded-[28px]` — matching the app's design language.

## Fix
Update the option card `rounded-2xl` → `rounded-[28px]` and increase padding from `p-5` → `px-6 py-7` across all 4 chooser modals to match the rounder, more spacious feel used elsewhere.

## Affected Files

| File | Component |
|------|-----------|
| `CharacterCreationModal.tsx` | Import / New Character cards |
| `CustomContentTypeModal.tsx` | Structured / Freeform cards |
| `EnhanceModeModal.tsx` | Precise / Detailed cards |
| `StyleGuideEditsModal.tsx` | Keep / Edit cards (KeepOrEditModal) |

## Changes Per File
- Option button class: `rounded-2xl` → `rounded-[28px]`, `p-5` → `px-6 py-7`
- Icon container: `w-12 h-12 rounded-[14px]` → `w-14 h-14 rounded-3xl` (matches Export/Import)
- Icon size: `w-5 h-5` → `w-6 h-6`
- Title text: `text-sm` → `text-base` or keep as-is depending on visual balance
- Spacing between icon and text: `gap-3` → taller vertical spacing via `mt-5` / `mt-3` pattern (like Export modal)

This makes all chooser modals visually identical in card shape and proportion to the Export/Import modals.

