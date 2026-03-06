

## Plan: Fix Corrupted CSS Classes + Proper Tile Sizing

The file has **three corrupted CSS class strings** from previous edits that broke the entire modal. Here are the exact fixes:

### File: `src/components/chronicle/SidebarThemeModal.tsx`

**1. Fix button class (line 68)**
`text-[10px]0px]0px]` → `text-[10px]`

**2. Fix scroll container class (line 94)**
`overflow-y-a pt-2uto  pt-2pr-1` → `overflow-y-auto pt-2 pr-1`

**3. Fix grid class (line 95)**
`grid g5 md:grid-cols-7id-cols-5 gap-3` → `grid grid-cols-5 md:grid-cols-7 gap-3`

These three corrupted strings explain all visible bugs: no grid layout, no scrolling, oversized button text, and the big gray box.

