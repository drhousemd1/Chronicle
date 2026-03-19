

# Restyle Chat Settings Modal to Match HTML Design Document

## Summary
Replace the current Chat Settings modal styling (lines 4739-4988 of `ChatInterfaceTab.tsx`) with the exact design from the HTML document (lines 1019-1207). All existing functionality and wiring remains unchanged — this is a pure visual overhaul.

## Design Spec (from HTML document, line-by-line)

### Modal Shell
- Use `DialogContentBare` instead of `DialogContent` to avoid Radix default radius overrides
- Outer: `bg-[#2a2a2f] rounded-[24px] overflow-hidden` with premium shadow stack (`0 20px 50px rgba(0,0,0,0.55), inset 1px 1px 0 rgba(255,255,255,0.09), inset -1px -1px 0 rgba(0,0,0,0.35)`)
- Remove all default DialogHeader/DialogTitle — replace with custom header

### Header
- Slate blue gradient: `bg-gradient-to-b from-[#5a7292] to-[#4a5f7f]`
- Gloss sheen overlay (absolute pseudo-element: `from-white/[0.07] to-transparent` at 30%)
- Drop shadow: `shadow-[0_6px_16px_rgba(0,0,0,0.35)]`
- Icon: broadcast/radio icon (matching HTML SVG), `stroke-white/90`
- Title: `text-[16px] font-black text-white uppercase tracking-[0.08em]` — "CHAT SETTINGS"
- Close button: `w-7 h-7 rounded-lg bg-black/25` with X icon, positioned `ml-auto`

### Body
- Single inner card wrapper: `bg-[#2e2e33] rounded-2xl p-4` with inner shadow stack (`inset 1px 1px 0 rgba(255,255,255,0.07), inset -1px -1px 0 rgba(0,0,0,0.30), 0 4px 12px rgba(0,0,0,0.25)`)
- All content lives inside this card

### Section Labels
- `text-[12px] font-black text-[#a1a1aa] uppercase tracking-[0.12em]` — e.g. "INTERFACE SETTINGS", "AI BEHAVIOR"

### Toggle Rows (Interface Settings — 2x2 grid)
- Each row: `bg-[#3c3e47] rounded-[10px] p-[12px_14px]` with premium shadow (`0 8px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.09), inset 0 -1px 0 rgba(0,0,0,0.20)`)
- Label: `text-[13px] font-semibold text-[#eaedf1]`
- Uses existing `LabeledToggle` component (already matches the Off/toggle/On pattern)
- Grid: `grid grid-cols-2 gap-2`

### AI Behavior Section
- Divider between sections: `h-px bg-white/5`
- Character Discovery + Proactive AI Mode: 2-col grid, same row style but with subtitle: `text-[12px] text-[#a1a1aa] mt-0.5`
- Narrative POV: same row style, with pill buttons: active = `bg-[#3b82f6] text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)]`, inactive = `bg-[#3f3f46] text-[#a1a1aa]`, `rounded-lg px-3 py-1.5 text-[12px] font-bold`
- NSFW Intensity: same row style with LabeledToggle (offLabel="Normal", onLabel="High")
- Response Detail: same row style with 3-pill selector (Concise/Balanced/Detailed), same pill styling as POV
- Realism Mode: same row style with LabeledToggle

### Time Progression Section
- Keep existing Time Progression section but apply same row styling (`bg-[#3c3e47] rounded-[10px]` etc.) for consistency

## Files Changed

### `src/components/chronicle/ChatInterfaceTab.tsx`
- Lines 4739-4988: Replace the entire Chat Settings Dialog block
- Import `DialogContentBare` (add to existing dialog import)
- All `handleUpdateUiSettings`, `handleTimeProgressionChange`, toggle state reads, and LabeledToggle bindings remain exactly the same — only the JSX structure and class names change

### No other files need changes
- `LabeledToggle` component already matches the design's toggle pattern
- No new components needed

