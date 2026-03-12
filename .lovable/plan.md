

# Chat Interface Swatches — Full Audit + View Screenshots

## Current State (7 swatches, lines 1353-1359)
1. **Ink Blue** (#1c1f26) — "Chat message bubble, transparent mode OFF"
2. **Half Black** (rgba(0,0,0,0.5)) — "Chat message bubble, transparent mode ON"
3. **Muted Slate** (#94a3b8) — "Italic action text in chat (*actions*)"
4. **Soft Indigo** (rgba(199,210,254,0.9)) — "Thought text in chat (parenthetical)"
5. **True Blue** (#3b82f6) — "User message bubble border"
6. **Milky White** (rgba(255,255,255,0.3)) — "SideCharacterCard when sidebar bg is dark"
7. **Smoke Black** (rgba(0,0,0,0.3)) — "SideCharacterCard when sidebar bg is light"

## Audit: What's Missing (from ChatInterfaceTab.tsx source)

### Message Bubble Area
| Color | Name | Location | Line(s) |
|---|---|---|---|
| rgb(203,213,225) / text-slate-300 | Slate 300 | Plain narrative text in messages | 115, 206 |
| text-white | White | Dialog/speech text `"..."` in messages | 166, 172, 180 |
| border-white/5 | Ghost White | AI message bubble border (default) | 3555 |
| border-white/20 | — | AI message bubble border (hover) | 3555 |
| border-blue-500 | True Blue | User message bubble border — **already listed** | 3555 |
| text-slate-400 | Muted Slate | Action icons (regen, menu, continue) default state | 3587, 3599, 3609 |
| text-green-400 | Green 400 | Inline edit save (checkmark) icon | 3567 |
| text-red-500 | Bright Red | Inline edit cancel (X) icon, Delete menu item | 3574, 3624 |
| text-slate-500 | Stone Gray | Speaker name label (AI messages) | 3730, 3848 |
| text-blue-300 | Light Blue | Speaker name label (User messages) | 3730 |
| text-blue-500/50 | — | User avatar fallback initial letter | 3725 |
| text-white/30 | — | AI avatar fallback initial letter | 3725 |
| bg-slate-800 | Dark Zinc | Avatar fallback background | 3719 |
| border-white/10 | Faint White | Avatar border, image overlay border, scene badge bg | 3719, 3642, 3655 |
| text-slate-400 | Muted Slate | Day/Time badge at bottom of messages | 3775 |

### Sidebar
| Color | Name | Location | Line(s) |
|---|---|---|---|
| bg-white / bg-white/90 | White | Sidebar background (no bg / with bg) | 3279 |
| border-slate-200 | — | Sidebar border-right | 3279 |
| border-slate-100 | — | Sidebar header divider | 3294 |
| bg-[#4a5f7f] | Slate Blue | "Main Characters" / "Side Characters" pill headers | 3425, 3477 |
| bg-blue-500 | True Blue | User-controlled badge bg | 3218, 75 |
| bg-slate-500 | — | AI-controlled badge bg | 3219, 76 |
| text-slate-800 | — | Character name (dark bg sidebar) | 3225 |
| text-white | White | Character name (light bg sidebar) | 3225 |
| bg-purple-50 / border-purple-100 | — | Side char avatar (dark bg mode) | SideCharacterCard:58 |
| bg-zinc-800 / border-white/20 | — | Side char avatar (light bg mode) | SideCharacterCard:58 |
| bg-slate-50 / border-slate-100 | — | Main char avatar (dark bg mode) | 3205 |
| bg-zinc-800 / border-white/20 | — | Main char avatar (light bg mode) | 3205 |

### Day/Time Panel
| Color | Name | Location | Line(s) |
|---|---|---|---|
| bg-black/20 | — | Sky panel overlay | 3338 |
| bg-white / border-black | White/Black | Day counter stepper | 3376-3380 |
| bg-blue-100 / border-blue-500 / text-blue-500 | — | Active time icon button | 3408 |
| bg-white / border-black / text-black | — | Inactive time icon button | 3409 |
| bg-black/50 | Half Black | Timer countdown badge bg | 3366 |

### Input Bar
| Color | Name | Location | Line(s) |
|---|---|---|---|
| bg-[hsl(var(--ui-surface))] | UI Surface | Input bar background | 3867 |
| bg-[hsl(var(--ui-surface-2))] | UI Surface 2 | Action buttons, input wrapper | 3873, 3908 |
| border-[hsl(var(--ui-border))] | UI Border | Input bar top border, button borders | 3867, 3873 |
| bg-[#4a5f7f] / text-white | Slate Blue | Send button (active state) | 3901 |
| bg-white / text-black | White | Text input field | 3916 |

### Chat Settings Modal
| Color | Name | Location | Line(s) |
|---|---|---|---|
| bg-zinc-900 | — | Settings modal background | 3971 |
| border-white/10 | — | Settings modal border, dividers | 3971, 4040 |
| bg-zinc-800/50 | — | Settings row container bg | 3989, 4010, etc. |
| text-zinc-200 | — | Settings label text | 3990, 4011 |
| text-zinc-400 | — | Settings description text | 4053, 4068, etc. |
| bg-blue-500 / text-white | True Blue | Active POV/Verbosity pill | 4092, 4103, 4143 |
| bg-zinc-700 / text-zinc-300 | — | Inactive POV/Verbosity pill | 4093, 4104, 4144 |
| text-blue-500 | True Blue | Info tooltip icon color | 3995 |

### Character Card Dropdown
| Color | Name | Location | Line(s) |
|---|---|---|---|
| bg-zinc-800 / border-white/10 / text-zinc-200 | — | Dropdown menu bg/border/text | 3236, 3314 |
| text-red-600 | — | Delete character menu item | 3243 |

### Empty State
| Color | Name | Location | Line(s) |
|---|---|---|---|
| bg-white/10 / border-white/10 | — | Empty state circle | 3526 |
| text-slate-300 | — | "The stage is set" text | 3528 |
| text-slate-500 | — | Empty state description | 3529 |

### Loading State
| Color | Name | Location | Line(s) |
|---|---|---|---|
| bg-zinc-800 | Dark Zinc | Loading spinner background | 1133 |
| border-blue-500 | True Blue | Spinner ring | 1135 |
| text-slate-400 | Muted Slate | "Loading your story..." text | 1136 |

## Summary of Missing Swatches to Add

Based on the audit, the current 7 swatches cover message bubble bg and text styling only. These significant colors are missing:

1. **Slate 300** (rgb(203,213,225) / #cbd5e1) — Plain narrative text in messages
2. **White** (#ffffff) — Dialog/speech text, sidebar bg, input field bg, day counter
3. **Slate Blue** (#4a5f7f) — Character section pill headers, Send button active state (already in other sections but needs Chat Interface location)
4. **Blue 500** (#3b82f6) — User/controlled badge, active time icon, active settings pills, info icon (partially covered as "True Blue" but only mentions border)
5. **Slate 500** (#64748b) — AI-controlled badge bg
6. **Blue 100** (bg-blue-100 / #dbeafe) — Active time icon button bg
7. **Blue 300** (#93c5fd / text-blue-300) — User speaker name label
8. **Green 400** (#4ade80 / text-green-400) — Inline edit save icon
9. **Bright Red** (#ef4444) — Inline edit cancel, Delete menu item (already exists in other sections, needs Chat Interface location)
10. **UI Surface** (hsl(240,7%,16%) / #272730) — Input bar background
11. **UI Surface 2** (hsl(228,7%,20%) / #2e3038) — Action buttons, input wrapper, settings cog
12. **Zinc 900** (#18181b) — Chat Settings modal bg
13. **Zinc 800/50** (rgba(39,39,42,0.5)) — Settings row containers
14. **Zinc 700** (#3f3f46) — Inactive POV/verbosity pill bg
15. **Zinc 200** (#e4e4e7 / text-zinc-200) — Settings label text
16. **Zinc 400** (#a1a1aa / text-zinc-400) — Settings description text
17. **Black** (#000000) — Chat main area bg (darkMode OFF), day counter border
18. **Slate 900** (#0f172a) — Chat main area bg (darkMode ON)
19. **Purple 400** (#c084fc) — Avatar generating spinner color (Loader2)
20. **Black/20** (rgba(0,0,0,0.2)) — Sky panel overlay, scene bg overlay

## Plan

### Step 1: Expand Chat Interface swatch section
Update `StyleGuideTool.tsx` lines 1353-1359 to include all ~20 missing colors identified above. Each swatch gets a `locationImages` array.

### Step 2: Capture real screenshots
Navigate to the Chat Interface in the live app and capture real, localized screenshots for each distinct UI location:

| Screenshot | Target |
|---|---|
| chat-message-bubble.png | Message bubble showing speech, action, thought, narrative text |
| chat-user-bubble.png | User message with blue border, speaker name in blue-300 |
| chat-message-actions.png | Hover state showing regen, menu, continue icons |
| chat-inline-edit.png | Inline edit mode with green check / red X |
| chat-sidebar-chars.png | Sidebar showing character cards with #4a5f7f pill headers |
| chat-sidebar-card-dark.png | Character card on dark sidebar bg (white/30 variant) |
| chat-sidebar-card-light.png | Character card on light sidebar bg (black/30 variant) |
| chat-day-time-panel.png | Day/Time panel with sky bg, day counter, time icons |
| chat-input-bar.png | Input area with action buttons, textarea, Send button |
| chat-settings-modal.png | Chat Settings modal showing toggles and pills |
| chat-settings-behavior.png | AI Behavior section with POV/Verbosity pills |
| chat-empty-state.png | Empty conversation "The stage is set" |
| chat-loading-state.png | Loading spinner |

### Step 3: Update existing swatches in other sections
Add "Chat Interface" as a location to swatches that already exist in other sections (Slate Blue, True Blue, Bright Red, etc.)

### Step 4: Update ALL_SWATCHES
Add new entries: Blue 100 (#dbeafe), Blue 300 (#93c5fd), Green 400 (#4ade80), Slate 300 (#cbd5e1), Slate 500 (#64748b), Slate 900 (#0f172a), Zinc 900 (#18181b), Zinc 200 (#e4e4e7), Purple 400 (already exists).

### Step 5: Update locationImages on existing swatches
True Blue currently says "User message bubble border" — expand to include all Chat Interface locations (badge, time icon, settings pills, spinner, info icon).

## Files Changed
- `src/components/admin/styleguide/StyleGuideTool.tsx` — expand Chat Interface section from 7 to ~25 swatches, add locationImages, update ALL_SWATCHES
- ~13 new screenshot assets captured from live app and uploaded to `guide_images/chat-interface/`

