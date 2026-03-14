

## Update Story Builder Containers to Match Character Builder

### Problem
The Story Builder page (WorldTab) and its child components use an older container style with flat headers and explicit borders, while the Character Builder now uses gradient headers with gloss sheens, inset shadows instead of borders, and updated typography.

### Canonical Style (from Character Builder)

```text
┌─ Outer container ──────────────────────────────┐
│  bg-[#2a2a2f] rounded-[24px]                   │
│  NO border — uses inset shadow edges:           │
│  shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),    │
│    inset_1px_1px_0_rgba(255,255,255,0.09),      │
│    inset_-1px_-1px_0_rgba(0,0,0,0.35)]          │
│                                                  │
│ ┌─ Header ────────────────────────────────────┐ │
│ │ relative overflow-hidden                     │ │
│ │ bg-gradient-to-b from-[#5a7292] to-[#4a5f7f]│ │
│ │ border-t border-white/20  (top highlight)    │ │
│ │ px-5 py-3                                    │ │
│ │ + gloss sheen overlay div                    │ │
│ │ Title: font-bold tracking-[-0.015em] z-[1]   │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ ┌─ Inner card (where applicable) ─────────────┐ │
│ │ bg-[#2e2e33] rounded-2xl                     │ │
│ │ NO border — uses inset shadows:              │ │
│ │ shadow-[inset_1px_1px_0_rgba(255,255,255,    │ │
│ │   0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30), │ │
│ │   0_4px_12px_rgba(0,0,0,0.25)]               │ │
│ └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### Changes by File

#### 1. `src/components/chronicle/WorldTab.tsx` — 7 section containers

All section outer containers (Story Card, World Core, Opening Dialog, Scene Gallery, Art Style, World Codex, Share) get:
- **Outer**: Remove `border border-[#4a5f7f]` / `border border-zinc-500`, add full inset shadow stack
- **Header**: Replace flat `bg-[#4a5f7f] border-b border-[#4a5f7f] px-6 py-4` with gradient header: `relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-3 shadow-lg` + gloss sheen overlay div
- **Title**: Change `font-semibold tracking-tight` to `font-bold tracking-[-0.015em] relative z-[1]`
- **Inner cards**: Replace `border border-[#4a5f7f]` / `border border-zinc-500` with inset shadow stack, change `p-6` padding to `p-5 pb-6`

Also fix the freeform section creation (line ~1611) to seed with an item instead of empty array (matching Character Builder fix).

#### 2. `src/components/chronicle/ContentThemesSection.tsx` — 1 container

Same outer/header/title updates as above.

#### 3. `src/components/chronicle/StoryGoalsSection.tsx` — 1 container

Same outer/header/title updates (preserving the conditional red border for validation errors).

#### 4. `src/components/chronicle/StoryCardView.tsx` — CollapsibleSection component

Update the local `CollapsibleSection` to match the Character Builder's version with gradient header, gloss sheen, inset shadows, and updated typography.

### What stays the same
- All content inside the containers (form fields, buttons, art style grid, scene gallery grid, etc.)
- Sidebar styling (Character Roster pane)
- Section-specific icons in headers are preserved
- Validation error borders/rings on StoryGoalsSection

