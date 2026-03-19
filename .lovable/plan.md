

# Add Story Arc Spec Sheet (Card 3) to Style Guide

## Summary
Append a third `.card` block to `public/style-guide-component-example.html` documenting the Story Arc (ArcPhaseCard) component with a 1:1 pixel-accurate static HTML preview and collapsible details.

## Preview Section — What Gets Rendered
A full ArcPhaseCard replica showing:

1. **Phase label row** — "PHASE 1" (blue-500, 10px/900/uppercase/tracking-widest) + red delete button (30x30, rounded-[10px], border red-500/50)
2. **Goal Name row** — label (10px/900/zinc-400/uppercase) + textarea (bg #1c1c1f, border black/35, rounded-lg) + **Progress Ring** (80x80, 8px border rgba(51,80,125,0.85), "33%" text in slate-300)
3. **Desired Outcome** — label + sparkle enhance button + textarea
4. **Guidance Strength Slider** — label "Guidance Strength", subtitle text, track bar (h:12px, rounded-full, bg rgba(21,25,34,0.95)), blue gradient fill (linear-gradient(90deg, #2b4e8d, #4b79d8 60%, #7dadf5)), white thumb (24x24, border-[3px] blue-500), three clickable labels (Rigid/Normal/Flexible), description box (bg zinc-900, rounded-xl, inset shadow stack)
5. **Steps section** — "STEPS" heading with CheckSquare icon (blue-500) + Simple/Advanced mode toggle (bg #3c3e47, rounded-xl, active pill #3b82f6)
6. **ArcConnectors split** — SVG fork (vertical stem fading down, horizontal bar at y=64, two drops at x=25% and x=75%)
7. **Two-column branch lanes** (grid-cols-2 gap-4):
   - **Fail Path** — Header cluster: rounded-[18px] bg rgba(43,47,57,0.9), shadow 0 14px 26px rgba(0,0,0,0.4). Strip: bg rgba(240,74,95,0.28), "FAIL PATH" text. Body: "RESISTANCE TRIGGER" label + textarea. Below: step card (rounded-[18px], border white/15, bg rgba(78,58,68,0.78)) with FAILED/SUCCEEDED buttons (26x26 rounded-[8px]), description textarea, + Dynamic Recovery sentinel card with Lock icon. 
   - **Success Path** — Same structure but strip bg rgba(34,197,127,0.28), step card bg rgba(51,75,66,0.78), "SUCCEED PATH" / "SUCCESS TRIGGER" / "PROGRESSION STEP", + "Add Step" button (bg #3c3e47, rounded-xl, shadow stack, blue text)

All colors, sizes, shadows, and border-radius values taken directly from the source components.

## Details Section (Collapsible)

### Spec Blocks
- **Phase Label Row** — 10px/900/blue-500/uppercase/tracking-widest; delete button 30x30 rounded-[10px] border red-500/50
- **Progress Ring** — 80x80, border-[8px] rgba(51,80,125,0.85), text 18px/700/slate-300
- **Guidance Strength Slider** — track h:12px rounded-full bg rgba(21,25,34,0.95), fill gradient, thumb 24x24 white border-[3px] blue-500, description box bg zinc-900 with inset shadow
- **Mode Toggle** — bg #3c3e47, rounded-xl, shadow stack, active: #3b82f6 white, inactive: #3f3f46 #a1a1aa
- **Branch Header Cluster** — rounded-[18px], bg rgba(43,47,57,0.9), shadow 0 14px 26px rgba(0,0,0,0.4)
- **Branch Strip** — fail: rgba(240,74,95,0.28), success: rgba(34,197,127,0.28)
- **Step Card** — rounded-[18px], border white/15, fail bg rgba(78,58,68,0.78), success bg rgba(51,75,66,0.78), shadow 0 14px 26px -6px rgba(0,0,0,0.4)
- **Status Buttons** — 26x26 rounded-[8px]; active-failed: border red-500/60 bg red-500/20 text red-300; active-succeeded: border emerald-500/60 bg emerald-500/20 text emerald-200; inactive: border black/20 bg #3f3f46 text #a1a1aa
- **SVG Connector** — split: 100×88 viewBox, lines at rgba(232,238,248,0.82), fade gradient on stem

### Bottom 4-Column Grid
- **Col 1**: Branch header + step card layer specs
- **Col 2**: Status button + mode toggle + guidance slider specs
- **Col 3**: Colors table (all unique colors)
- **Col 4**: Typography + layout dimensions

## CSS Additions
New preview-specific classes prefixed with `arc-` for the static replica elements (branch strips, step cards, progress ring, slider track, connector SVG wrapper). Reuses existing shared classes (`.cs-pill`, `.cs-toggle`, etc.) where applicable.

## File Changed
**`public/style-guide-component-example.html`** — Append Card 3 after the Chat Settings card (after line 894).

