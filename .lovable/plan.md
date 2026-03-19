

# Add Chat Settings Spec Sheet to Style Guide

## Summary
Add a second spec-sheet card below the existing Physical Appearance one in `public/style-guide-component-example.html`. It will follow the identical layout pattern (card header → top-section with spec on left + live preview on right → bottom-section with detail columns) but document the Chat Settings modal.

## Structure

### Card Header
- Title: **"Chat Settings"**
- Subtitle: `ChatInterfaceTab.tsx — Chat behavioral settings modal`

### Top Section — Left (Spec Blocks)

**Modal Shell Layers**
- Layer 1 — Base fill: `background: #2a2a2f`
- Layer 2 — Outer drop shadow: `0 20px 50px rgba(0,0,0,0.55)`
- Layer 3 — Top-left light bevel: `inset 1px 1px 0 rgba(255,255,255,0.09)`
- Layer 4 — Bottom-right dark bevel: `inset -1px -1px 0 rgba(0,0,0,0.35)`
- Corner radius: `rounded-[24px]` / `border-radius: 24px`

**Header Layers**
- Layer 1 — Base gradient: `linear-gradient(180deg, #5a7292 0%, #4a5f7f 100%)`
- Layer 2 — Gloss sheen (::after): `from rgba(255,255,255,0.07) to transparent at 30%`
- Layer 3 — Drop shadow: `0 6px 16px rgba(0,0,0,0.35)`
- Close button: `bg-black/25, w-7 h-7, rounded-lg`

**Inner Tray Layers**
- Layer 1 — Base fill: `background: #2e2e33`
- Layer 2–4 — Same inset bevel + ambient shadow as Physical Appearance

**Setting Row Layers**
- Layer 1 — Base fill: `background: #3c3e47`
- Layer 2 — Shadow stack: `0 8px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.09), inset 0 -1px 0 rgba(0,0,0,0.20)`
- Corner radius: `rounded-[10px]`

**Toggle Track (LabeledToggle)**
- Off-state: `background: #1c1c1f`, `shadow: inset 0 1px 3px rgba(0,0,0,0.4)`
- On-state: `background: #3b82f6`, `shadow: inset 0 1px 3px rgba(0,0,0,0.3)`
- Track: `40×22px`, Thumb: `16×16 white`, positioned `top: 3px`

**Pill Button Layers (POV / Response Detail)**
- Active: `background: #3b82f6`, `shadow: 0 2px 8px rgba(59,130,246,0.35)`, `text: white`
- Inactive: `background: #3f3f46`, `text: #a1a1aa`
- Sizing: `px-3 py-1.5 text-[12px] font-bold rounded-lg`

### Top Section — Right (Live Preview)
A static HTML replica of the Chat Settings modal showing:
- Header bar with broadcast icon, "CHAT SETTINGS" title, X close button
- Inner tray with 2×2 Interface Settings grid (Dynamic Backgrounds, Transparent Bubbles, Offset Bubbles, Dynamic Text) — each with a toggle
- AI Behavior section with Character Discovery + Proactive AI (2-col), Narrative POV (pill selector), NSFW Intensity (toggle), Response Detail (3-pill), Realism Mode (toggle)
- All toggles use the same CSS from the existing Physical Appearance card's styling conventions but adapted for the toggle/pill pattern

### Bottom Section — 4 columns

**Column 1: Toggle Track & Pill Button Specs**
- Toggle Track off/on layers
- Pill active/inactive layers

**Column 2: Setting Row & Section Label Specs**
- Row container layers (bg, shadows)
- Section label: `12px / 900 / #a1a1aa / uppercase / tracking 0.12em`
- Subtitle text: `12px / 400 / #a1a1aa`

**Column 3: Colors Table**
| Name | Hex | Role |
|------|-----|------|
| Modal Shell | #2a2a2f | Outer background |
| Inner Tray | #2e2e33 | Body container |
| Header | #5a7292→#4a5f7f | Header gradient |
| Setting Row | #3c3e47 | Row background |
| Toggle Off | #1c1c1f | Track off-state |
| Toggle On / Pill Active | #3b82f6 | Blue accent |
| Pill Inactive | #3f3f46 | Inactive pill |

**Column 4: Typography & Layout**
- Header title: `16px / 900 / #fff / uppercase / tracking 0.08em`
- Section label: `12px / 900 / #a1a1aa / uppercase / tracking 0.12em`
- Row label: `13px / 600 / #eaedf1`
- Row subtitle: `12px / 400 / #a1a1aa`
- Pill text: `12px / 700`
- Interface Settings grid: `grid-cols-2 gap-2`
- Close button: `w-7 h-7 bg-black/25 rounded-lg`

## File Changed
**`public/style-guide-component-example.html`** — Append a second `.card` block after the existing Physical Appearance card (after line 475, before `</body>`). Uses all existing CSS classes plus minimal new classes for toggle/pill elements.

