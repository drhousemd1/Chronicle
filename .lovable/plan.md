

# Add "View" + Location Screenshots for All Story Builder Swatches

## Scope
Extend the working Slate Blue pattern (locationImages + View link + LocationViewerModal) to the remaining 21 color swatches in the "Story Builder Page" section. Each swatch gets 1-3 targeted screenshots showing exactly where that color appears.

## Screenshot Capture Strategy

I'll navigate the Story Builder page, capture screenshots, and crop them to isolate specific elements. Screenshots will be uploaded to the `guide_images` storage bucket, organized by color name (e.g., `guide_images/dark-charcoal/panel-containers.png`).

**Capture groups** (to minimize navigation):

| View | Swatches Covered |
|------|-----------------|
| Story Builder main view (header + panels visible) | Graphite (heading text), Cool Gray (subtitle), Ghost White (header bg, labels), Light Steel (header border), Pale Silver (button text) |
| Left icon sidebar | Soft Black (sidebar bg) |
| Panel containers (Story Card, World Core) | Dark Charcoal (panel bg), Faint White (panel borders), Dim White (header bar bottom border) |
| Form inputs (title, description fields) | Smoke Black (input bg), Mid Charcoal (input borders) |
| Tag chips (genre/origin) | Dark Zinc (chip bg), Silver Gray (chip text), Mid Charcoal (chip border) |
| Character Roster sidebar | Dark Charcoal (sidebar), character cards |
| Buttons (Save, Add, Open) | True Blue (multiple locations), Stone Gray (dashed border), Graphite (button text) |
| Story Arc section | Muted Charcoal (guidance box), True Blue (arc connectors) |
| World Codex dialog | Light Zinc (bullet list text) |

## Per-Swatch Breakdown (21 swatches)

1. **Dark Charcoal** (#2a2a2f) — 2 shots: panel container bg, Character Roster sidebar
2. **Soft Black** (#1a1a1a) — 1 shot: left icon nav sidebar
3. **Graphite** (hsl 228 7% 20%) — 2 shots: Story Setup heading, header action buttons (DRAFTS/SAVE)
4. **Ghost White** (rgba 248,250,252,0.3) — 2 shots: header bar bg, form labels/checkbox labels
5. **Cool Gray** (#64748b) — 1 shot: subtitle below page heading
6. **Smoke Black** (rgba 24,24,27,0.5) — 1 shot: text input field
7. **Mid Charcoal** (#3f3f46) — 1 shot: input/textarea border
8. **True Blue** (#3b82f6) — 3 shots: checkmark badge on art style, tag badges/Open buttons, dashed add button text
9. **Silver Gray** (#a1a1aa) — 1 shot: tag chip text + trash icon
10. **Stone Gray** (#71717a) — 1 shot: dashed add button border
11. **Dark Zinc** (#27272a) — 2 shots: genre tag chips, art style card bg
12. **Pale Silver** (hsl 210 20% 93%) — 1 shot: Shadow Surface button text
13. **Light Steel** (#e2e8f0) — 1 shot: header bar bottom border (cropped tight)
14. **Muted Charcoal** (rgba 58,58,63,0.3) — 1 shot: Story Arc guidance description box
15. **Light Zinc** (#d4d4d8) — 1 shot: bullet list text in World Codex
16. **Faint White** (rgba 255,255,255,0.1) — 1 shot: panel outer border / character card border
17. **Dim White** (rgba 255,255,255,0.2) — 1 shot: panel header bar bottom border

**Total: ~25-30 screenshots**

## Code Changes

**Single file:** `src/components/admin/styleguide/StyleGuideTool.tsx`

For each of the 21 `SwatchCardV2` entries (lines 1046-1062), add a `locationImages` prop with the appropriate screenshot URLs and metadata, following the exact same pattern as the existing Slate Blue entry:

```tsx
<SwatchCardV2 color="#2a2a2f" name="Dark Charcoal" 
  locations="Panel containers, Character Roster sidebar, character cards" 
  value="#2a2a2f" token="bg-[#2a2a2f]" 
  pageSpecific={false} appWide={true}
  locationImages={[
    { url: '...bucket-url.../dark-charcoal/panel-containers.png', 
      location: 'Panel containers', 
      function: 'Background for collapsible section containers...' },
    { url: '...bucket-url.../dark-charcoal/character-roster.png', 
      location: 'Character Roster sidebar', 
      function: 'Background for the character roster sidebar panel' },
  ]} 
/>
```

No new components needed — `LocationViewerModal`, the `locationImages` prop on `SwatchCardV2`, and the "View" link in `CollapsibleCardBody` are all already implemented from the Slate Blue work.

## Execution Order
1. Navigate to Story Builder, capture all needed views
2. Crop each screenshot to isolate the specific element/area
3. Upload all images to `guide_images` bucket
4. Add `locationImages` arrays to all 21 swatch entries

