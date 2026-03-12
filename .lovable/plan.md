

# Chat History Swatches — Audit + Real Screenshots Plan

## Current State
12 swatches at lines 1548-1559. All 12 are verified correct against `ConversationsTab.tsx` source code. No removals needed.

## Missing Swatches (7 new entries)

Derived directly from `ConversationsTab.tsx` and `Index.tsx`:

| # | Color | Name | Location | Source |
|---|---|---|---|---|
| 1 | #000000 | Black | Page background wrapper | Index.tsx:2254 `bg-black` |
| 2 | #ffffff | White | Session title text, loading overlay text | ConversationsTab:86 `text-white`, Index:2258 |
| 3 | hsl(228,7%,20%) | Graphite (UI Surface 2) | Delete All button bg, Load More button bg | Index:1881, ConversationsTab:144 |
| 4 | hsl(var(--ui-border)) | UI Border | Delete All/Load More button border | Index:1881, ConversationsTab:144 |
| 5 | hsl(var(--ui-text)) | UI Text | Delete All/Load More button text | Index:1881, ConversationsTab:144 |
| 6 | rgba(0,0,0,0.4) | Shadow Black | Thumbnail card drop shadow | ConversationsTab:62 |
| 7 | rgba(0,0,0,0.7) | Near Black Glass | Loading overlay background | Index:2256 `bg-black/70` |

**Total after update: 19 swatches**

## Screenshot Capture Plan

Navigate to the live Chat History page and capture real screenshots for every swatch location:

| Screenshot | What It Shows |
|---|---|
| `chat-history-full.png` | Full page: bg-black wrapper, session cards, header |
| `chat-history-card.png` | Single session card close-up: outer #2a2a2f, inner #3a3a3f/30, borders, thumbnail, title, preview box |
| `chat-history-header.png` | Header bar with "Chat History" title + Delete All button |
| `chat-history-empty.png` | Empty state with #2a2a2f bg, #4a5f7f border, emoji |
| `chat-history-loading.png` | Loading overlay (bg-black/70 + spinner) — if capturable, otherwise omit |
| `chat-history-load-more.png` | Load More pagination button |

Each swatch (existing 12 + new 7) gets `locationImages` arrays pointing to the relevant screenshot.

## ALL_SWATCHES Update

Only one genuinely new color entry: **Shadow Black** `rgba(0,0,0,0.4)`. The rest (Black, White, Graphite, Near Black Glass, UI Border, UI Text) already exist in ALL_SWATCHES or are CSS variable references that don't belong in the color dropdown.

Actually UI Border and UI Text are CSS variable tokens — they resolve to existing colors already in the registry, so they won't get separate ALL_SWATCHES entries. Only **Shadow Black** is added.

## Implementation Steps

1. Navigate to Chat History in the live preview, capture 4-6 real screenshots
2. Upload screenshots to `guide_images/chat-history/` bucket
3. Expand Chat History swatch section from 12 → 19 entries, add `locationImages` on every swatch
4. Add Shadow Black (`rgba(0,0,0,0.4)`) to `ALL_SWATCHES`

## Files Changed
- `src/components/admin/styleguide/StyleGuideTool.tsx` — expand Chat History section, add locationImages to all 19 swatches, add Shadow Black to ALL_SWATCHES

