

# Fix Inconsistent Text Sizing in Sidebar User Menu

## Problem
The main sidebar items use `text-sm font-bold` (line 89), but the user identity block and its sub-items use a mix of `text-[10px]`, `text-[11px]`, and `text-[10px]` — making everything in the bottom section noticeably smaller and inconsistent.

## Fix (single file: `src/pages/Index.tsx`)

Normalize all text in the user block to match the sidebar standard (`text-sm font-bold`):

1. **Display name** (line 1627): `text-[11px] font-bold` → `text-sm font-bold`
2. **Email** (line 1628): `text-[10px]` → `text-xs` (slightly smaller is fine for secondary info, but not microscopic)
3. **Avatar fallback** (line 1620): `text-[10px]` → `text-xs`
4. **Sub-items** (Public Profile, Account Settings, Sign Out — lines 1640, 1650, 1662): `text-[11px]` → `text-sm font-bold` — same as every other sidebar item
5. **Sign In button** (line ~1685): match `text-sm font-bold` as well

This makes the entire sidebar use one consistent text size.

