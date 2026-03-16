

# Restyle AI Generation Modals to Match Dark Premium Mockup

## Modals Affected
1. **CoverImageGenerationModal** (`src/components/chronicle/CoverImageGenerationModal.tsx`)
2. **AvatarGenerationModal** (`src/components/chronicle/AvatarGenerationModal.tsx`)
3. **SceneImageGenerationModal** (`src/components/chronicle/SceneImageGenerationModal.tsx`)
4. **AIPromptModal** (`src/components/chronicle/AIPromptModal.tsx`) — already partially dark-styled but needs alignment

## Design from Mockup (HTML lines 1927-2019)

### Structure
```text
┌──────────────────────────────────────────────┐
│ Outer: bg-[#2a2a2f] rounded-3xl             │
│ shadow-stack (no border)                      │
│ ┌──────────────────────────────────────────┐ │
│ │ Header: gradient #5a7292→#4a5f7f        │ │
│ │ + gloss sheen overlay                    │ │
│ │ icon + TITLE (uppercase, 13px, bold 900) │ │
│ │ NO close X button                        │ │
│ └──────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────┐ │
│ │ Body padding: 14px                       │ │
│ │ ┌──────────────────────────────────────┐ │ │
│ │ │ Inner: bg-[#2e2e33] rounded-2xl     │ │ │
│ │ │ inset shadow stack (no border)       │ │ │
│ │ │                                      │ │ │
│ │ │ PROMPT label (zinc-400, uppercase)   │ │ │
│ │ │ textarea: bg-[#1c1c1f] no border     │ │ │
│ │ │   border-t border-black/35           │ │ │
│ │ │   inset shadow                       │ │ │
│ │ │ tip text (zinc-500)                  │ │ │
│ │ │                                      │ │ │
│ │ │ divider: rgba(255,255,255,0.05)      │ │ │
│ │ │                                      │ │ │
│ │ │ STYLE label                          │ │ │
│ │ │ 5-col grid of style tiles            │ │ │
│ │ │ tiles: bg-[#1c1c1f] p-[5px]         │ │ │
│ │ │   rounded-[10px]                     │ │ │
│ │ │   selected: border-2 blue-500        │ │ │
│ │ │   unselected: border-2 transparent   │ │ │
│ │ │   text: selected=#eaedf1             │ │ │
│ │ │         unselected=#a1a1aa           │ │ │
│ │ │                                      │ │ │
│ │ │ Footer buttons (right-aligned):      │ │ │
│ │ │   Cancel: bg-[#3c3e47] text-white    │ │ │
│ │ │   Generate: bg-[#3b5ca8] text-white  │ │ │
│ │ │   both: rounded-[10px] uppercase     │ │ │
│ │ │   premium shadow stack               │ │ │
│ │ └──────────────────────────────────────┘ │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

## Changes per Modal

### All 3 generation modals (Cover, Avatar, Scene):

**1. DialogContent** — Remove default padding/border, apply outer card styling:
- `className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-[#2a2a2f] rounded-3xl border-none p-0"`
- `style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.55), inset 1px 1px 0 rgba(255,255,255,0.09), inset -1px -1px 0 rgba(0,0,0,0.35)' }}`

**2. Hide default X close button** — Add `[&>button:last-child]:hidden` to DialogContent className (since we have Cancel button)

**3. DialogHeader** — Replace `pb-4 border-b border-border` with gradient header:
- `bg-gradient-to-b from-[#5a7292] to-[#4a5f7f]` with gloss overlay
- `border-top: 1px solid rgba(255,255,255,0.20)`
- Shadow: `0 6px 16px rgba(0,0,0,0.35)`
- Title: white, uppercase, `text-[13px] font-black tracking-[0.08em]`

**4. Body wrapper** — `p-3.5` (14px)

**5. Inner card** — `bg-[#2e2e33] rounded-2xl p-4` with inset shadow stack

**6. Textareas** — `bg-[#1c1c1f] border-none border-t border-black/35 rounded-lg text-[#eaedf1]` with `inset 0 2px 6px rgba(0,0,0,0.40)` shadow

**7. Labels** — `text-[11px] font-black text-zinc-400 uppercase tracking-[0.1em]`

**8. Tip text** — `text-zinc-500` (was `text-muted-foreground`)

**9. Divider** — `bg-white/5` height 1px (was `border-t border-border`)

**10. Style tiles** — `bg-[#1c1c1f] rounded-[10px] p-[5px]` with:
- Selected: `border-2 border-blue-500` + `boxShadow: 0 2px 8px rgba(59,130,246,0.35)` + text `#eaedf1`
- Unselected: `border-2 border-transparent` + text `#a1a1aa`
- Checkmark badge: `bg-blue-500` 14px circle (smaller, top-1 right-1)

**11. Footer buttons** — Inside the inner card, right-aligned:
- Cancel: `bg-[#3c3e47] text-[#eaedf1] rounded-[10px] uppercase text-[11px] font-black tracking-[0.05em]` + standard shadow stack
- Generate: `bg-[#3b5ca8] text-white` same shape + blue shadow stack

**12. Negative prompt chevron/label** — `text-zinc-400` to match mockup

### AIPromptModal
Already has its own dark styling with iridescent buttons. Will update to match the same outer/header/inner card pattern for consistency, keeping its iridescent submit button.

## Files Changed
- `src/components/chronicle/CoverImageGenerationModal.tsx`
- `src/components/chronicle/AvatarGenerationModal.tsx`
- `src/components/chronicle/SceneImageGenerationModal.tsx`
- `src/components/chronicle/AIPromptModal.tsx`

