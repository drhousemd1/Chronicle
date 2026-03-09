

# Fix All Swatch Color Names to Be Actual Color Names

## The Problem
The `name` field across all SwatchCardV2 sections contains UI location names instead of color names. Examples: "Gallery Background", "Header Glass", "Sidebar BG", "Panel Body", "Shadow Surface", "Badge Dark", "Session Card BG", "Chat Bubble (Solid)", "Frosted Glass (Light BG)". These are locations, not colors. The `name` field is labeled **"Color Name:"** in the UI — it needs to be a human-readable description of the actual color.

## Naming Convention
Human-readable color names that describe what the color looks like. Examples:
- `#121214` → "Near Black"
- `rgba(18,18,20,0.8)` → "Glass Black"
- `#2a2a2f` → "Dark Charcoal"
- `#4a5f7f` → "Slate Blue"
- `#1c1f26` → "Ink Blue"

## All Sections to Fix

### Story Builder (lines 419-439) — 22 swatches
| Current Name | New Name |
|---|---|
| Chronicle Blue | Slate Blue |
| Panel Body | Dark Charcoal |
| Sidebar Black | Soft Black |
| Shadow Surface | Graphite |
| White | White |
| Slate 50 (30%) | Ghost White |
| Slate 900 | Deep Navy |
| Slate 500 | Cool Gray |
| Zinc 900 (50%) | Smoke Black |
| Zinc 700 | Mid Charcoal |
| Blue 400 | Sky Blue |
| Blue 500 | True Blue |
| Zinc 400 | Silver Gray |
| Zinc 500 | Stone Gray |
| Zinc 800 | Dark Zinc |
| UI Text | Pale Silver |
| Slate 200 | Light Steel |
| Guidance Surface | Muted Charcoal |
| Zinc 300 | Light Zinc |
| White 10% | Faint White |
| White 20% | Dim White |

### My Stories (lines 448-458) — 11 swatches
| Current Name | New Name |
|---|---|
| Slate 50 (50%) | Frosted White |
| Chronicle Blue | Slate Blue |
| Slate 950 | Near Black Blue |
| Badge Dark | Dark Charcoal |
| Red 400 | Coral Red |
| Red 500 | Bright Red |
| Blue 600 | Royal Blue |
| Zinc 600 | Ash Gray |
| White 60% | Hazy White |
| White 50% | Half White |
| Black 50% | Half Black |

### Community Gallery (lines 467-473) — 7 swatches
| Current Name | New Name |
|---|---|
| Gallery Background | Near Black |
| Header Glass | Glass Black |
| Search Input BG | Smoke Charcoal |
| Sidebar BG | Dark Zinc |
| Yellow 400 | Bright Yellow |
| Blue 500/20 | Faint Blue |
| Purple 500/20 | Faint Purple |

### Chat Interface (lines 482-488) — 7 swatches
| Current Name | New Name |
|---|---|
| Chat Bubble (Solid) | Ink Blue |
| Chat Bubble (Transparent) | Half Black |
| Action Text (Italic) | Muted Slate |
| Thought Text (Glowing) | Soft Indigo |
| User Bubble Border | Sky Blue |
| Frosted Glass (Light BG) | Milky White |
| Frosted Glass (Dark BG) | Smoke Black |

### Chat History (lines 497-503) — 7 existing + 5 new = 12 total

**Rename existing:**
| Current Name | New Name |
|---|---|
| Session Card BG | Dark Charcoal |
| Session Inner Card BG | Muted Charcoal |
| Inner Card Border | Ghost White |
| Delete Button BG | Faint White |
| Message Preview BG | Smoke Black |
| Meta Text | Stone Gray |
| Preview Text | Silver Gray |

**Add missing (exhaustive — including hover/interaction states):**
| New Name | Value | Token | Locations |
|---|---|---|---|
| Slate Blue | #4a5f7f | border-[#4a5f7f] | Session card border, empty state border, thumbnail border |
| Dark Zinc | #27272a | bg-zinc-800 | Thumbnail fallback background |
| Dim White | rgba(255,255,255,0.15) | bg-white/15 | Delete button hover background |
| Coral Red | #f87171 | text-red-400 | Delete button hover icon color |
| Faint Red | rgba(239,68,68,0.3) | border-red-500/30 | Delete button hover border |

## Scope
- Rename `name` prop on ~49 SwatchCardV2 calls
- Add 5 new SwatchCardV2 entries to Chat History
- No component changes needed

