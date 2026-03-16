

# Fix: Restore White Header & Toggle Background

## Issue
The rebuild changed the modal header from its original white background to dark `bg-[#2a2a2f]`, and the toggle tray background blends in.

## Current State (line 1565)
```
bg-[#2a2a2f] border-b border-black/35
```

## Changes — `src/components/chronicle/CharacterEditModal.tsx`

### 1. Restore white header (line 1565)
- `DialogHeader`: Change `bg-[#2a2a2f]` → `bg-white`
- Border: `border-black/35` → `border-slate-200`

### 2. Update header text color for white background (line 1569)
- Title: `text-[#eaedf1]` → `text-slate-900` (dark text on white)

### 3. Fix toggle tray background (line 1584)
- Container: `bg-[#2b2b2e] ... border-[#2b2b2e]` → `bg-zinc-800 border border-zinc-700` (visible dark pill on white header)
- Inactive text stays `text-[#a1a1aa]`

### 4. Update Cancel/Save button colors for white header context
- Keep existing dark button styling (`bg-[#303035]`) — these contrast well against white

### Files Changed
- `src/components/chronicle/CharacterEditModal.tsx`

