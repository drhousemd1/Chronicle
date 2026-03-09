

# Convert Chat Interface & Chat History Swatches to SwatchCardV2

## Scope
File: `src/components/admin/styleguide/StyleGuideTool.tsx`, lines 471-493

## Component Change — Add optional `effect` prop to SwatchCardV2

The Thought Text swatch has an "Effect" row (textShadow: indigo glow) that SwatchCardV2 doesn't support. Add an optional `effect?: string` prop to `SwatchV2Props` and render it between Token and the checkboxes when present.

## Chat Interface — 7 swatches converted (lines 475-481)

| # | Name | Locations | Value | Token | Effect | Page? | App? | Notes |
|---|---|---|---|---|---|:---:|:---:|---|
| 1 | Chat Bubble (Solid) | Chat message bubble, transparent mode OFF | #1c1f26 | bg-[#1c1f26] | — | ✓ | | |
| 2 | Chat Bubble (Transparent) | Chat message bubble, transparent mode ON | rgba(0,0,0,0.5) | bg-black/50 | — | ✓ | | dashed border |
| 3 | Action Text (Italic) | Italic action text in chat (*actions*) | #94a3b8 | text-slate-400 | — | ✓ | | |
| 4 | Thought Text (Glowing) | Thought text in chat (parenthetical) | rgba(199,210,254,0.9) | text-indigo-200/90 | textShadow: indigo glow | ✓ | | dashed border |
| 5 | User Bubble Border | User message bubble border | #60a5fa | border-blue-400 | — | ✓ | | Old had "border-2 border-blue-400" as Value — fix: Value = hex, Token = border-blue-400 |
| 6 | Frosted Glass (Light BG) | SideCharacterCard when sidebar bg is dark (isDarkBg=true) | rgba(255,255,255,0.3) | bg-white/30 | — | ✓ | | dashed border |
| 7 | Frosted Glass (Dark BG) | SideCharacterCard when sidebar bg is light (isDarkBg=false) | rgba(0,0,0,0.3) | bg-black/30 | — | ✓ | | |

**Key fix**: User Bubble Border had `border-2 border-blue-400` in Value field (that's a token, not a color value). Fixed to hex `#60a5fa` in Value, `border-blue-400` in Token.

## Chat History — expand from 3 to 7 swatches (lines 490-492)

Current 3 swatches + 4 missing colors found in `ConversationsTab.tsx`:

| # | Name | Locations | Value | Token | Page? | App? | Notes |
|---|---|---|---|---|:---:|:---:|---|
| 1 | Session Card BG | Session card outer background, empty state card | #2a2a2f | bg-[#2a2a2f] | | ✓ | **NEW** — the outer card bg wasn't listed |
| 2 | Session Inner Card BG | Inner nested card in session entries | rgba(58,58,63,0.3) | bg-[#3a3a3f]/30 | ✓ | | existing, clean |
| 3 | Inner Card Border | Inner card subtle border | rgba(255,255,255,0.05) | border-white/5 | ✓ | | **NEW** — dashed border preview |
| 4 | Delete Button BG | Session delete button background | rgba(255,255,255,0.1) | bg-white/10 | | ✓ | existing — clean location (remove old "border-white/10" from location) |
| 5 | Message Preview BG | Last message preview box in session cards | rgba(24,24,27,0.5) | bg-zinc-900/50 | ✓ | | existing, clean |
| 6 | Meta Text | Message count, date, "Created by" attribution | #71717a | text-zinc-500 | ✓ | | **NEW** |
| 7 | Preview Text | Last message preview text, delete icon default | #a1a1aa | text-zinc-400 | ✓ | | **NEW** |

## Summary
- Add optional `effect` prop to `SwatchV2Props` interface and component
- Convert 7 Chat Interface `SwatchCard` → `SwatchCardV2` (fix User Bubble Border value)
- Replace 3 Chat History `SwatchCard` with 7 `SwatchCardV2` (add 4 missing colors)

