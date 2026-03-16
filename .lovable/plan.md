

# Restyle Chat History to Match Mockup

## What Changed in the Mockup

The mockup (lines 938-1017 of uploaded HTML) replaces all `border border-[#4a5f7f]` patterns with borderless premium shadow stacks, matching the design language used across all other restyled components.

## Changes — `src/components/chronicle/ConversationsTab.tsx`

### 1. Outer card (line 54)
**Current:** `bg-[#2a2a2f] rounded-2xl border border-[#4a5f7f] overflow-hidden`
**Mockup:** `bg-[#2a2a2f] rounded-2xl overflow-hidden` + shadow stack `0 12px 32px -2px rgba(0,0,0,0.50), inset 1px 1px 0 rgba(255,255,255,0.09), inset -1px -1px 0 rgba(0,0,0,0.35)` — no border.

### 2. Inner card (line 57)
**Current:** `bg-[#3a3a3f]/30 rounded-2xl border border-[#4a5f7f] p-4`
**Mockup:** `bg-[#2e2e33] rounded-xl p-4` + inset shadow `inset 1px 1px 0 rgba(255,255,255,0.07), inset -1px -1px 0 rgba(0,0,0,0.30), 0 4px 12px rgba(0,0,0,0.25)` — no border.

### 3. Delete button (line 109)
**Current:** `bg-red-500 border border-red-500 text-white hover:bg-red-600 hover:border-red-600`
**Mockup:** `bg-[hsl(0,72%,51%)] text-white` with premium shadow `0 8px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.09), inset 0 -1px 0 rgba(0,0,0,0.20)` — no border, 40x40 size, rounded-xl.

### 4. Last message preview (line 124)
**Current:** `bg-zinc-900/50 border border-[#4a5f7f] rounded-lg px-3 py-1.5`
**Mockup:** `bg-[#1c1c1f] border-t border-black/35 rounded-lg px-3 py-1.5` — no full border, just top bevel.

### 5. Preview text color (line 125)
**Current:** `text-zinc-400`
**Mockup:** `text-zinc-500` (#71717a)

### 6. Empty state (line 36)
**Current:** `bg-[#2a2a2f] rounded-2xl border border-[#4a5f7f]`
**Mockup pattern:** Same outer card shadow stack, no border.

### Files Changed
- `src/components/chronicle/ConversationsTab.tsx`

