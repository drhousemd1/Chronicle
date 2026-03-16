

# Fix CharacterEditModal Toggle Pill to Match Other Pages

## Problem
The toggle pill container in CharacterEditModal uses a light background (`bg-ghost-white border-ghost-white`) while every other page (My Stories, Gallery) uses a dark container (`bg-[#2b2b2e] border-[#2b2b2e]`). The inactive text colors are also wrong — using light-theme values (`text-zinc-500 hover:text-zinc-700`) instead of dark-theme values (`text-[#a1a1aa] hover:text-[#e4e4e7]`).

## Exact Code Comparison

**My Stories pills (Index.tsx line 1916)** — correct:
```
bg-[#2b2b2e] rounded-full p-1 gap-0.5 border border-[#2b2b2e]
```
Inactive: `border-transparent text-[#a1a1aa] hover:text-[#e4e4e7]`

**CharacterEditModal (line 1066)** — wrong:
```
bg-ghost-white rounded-full p-1 gap-0.5 border border-ghost-white
```
Inactive: `border-t border-transparent text-zinc-500 hover:text-zinc-700`

## Changes — `src/components/chronicle/CharacterEditModal.tsx`

### Line 1066 — Container
Change `bg-ghost-white ... border border-ghost-white` → `bg-[#2b2b2e] ... border border-[#2b2b2e]`

### Lines 1074, 1089 — Inactive pill text
Change `text-zinc-500 hover:text-zinc-700` → `text-[#a1a1aa] hover:text-[#e4e4e7]`

### Files Changed
- `src/components/chronicle/CharacterEditModal.tsx`

