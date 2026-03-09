

## Convert My Stories Buttons to ButtonCardV2 Format

The three new My Stories button entries (lines 1131-1172) currently use the `EntryCard` component format, but all buttons in the Style Guide should use the `ButtonCardV2` component — the same structured format used in the Story Builder section (with `buttonColor`, `textColor`, `size`, `purpose`, `visualEffects`, `locations`, `pageSpecific`, `appWide` fields).

### Changes to `StyleGuideTool.tsx`

Replace the three `EntryCard` entries (lines 1131-1172) with `ButtonCardV2` equivalents:

1. **Settings Gear Icon Button** → `ButtonCardV2`
   - `buttonName`: "Settings Gear"
   - `buttonColor`: "hsl(228 7% 20%) — bg-[hsl(var(--ui-surface-2))]"
   - `textColor`: "hsl(210 20% 93%) — text-[hsl(var(--ui-text))]"
   - `size`: "px-3 py-2 icon-only — rounded-xl (12px)"
   - `purpose`: "Opens background customization settings"
   - `visualEffects`: "shadow: 0 10px 30px rgba(0,0,0,0.35) · border: 1px solid hsl(var(--ui-border))"
   - `locations`: "My Stories hub header — gear icon for background picker"
   - Same preview (the gear button)

2. **New Story Card Button** → `ButtonCardV2`
   - `buttonName`: "New Story Card"
   - `buttonColor`: "transparent to zinc-800/zinc-900 gradient — bg-gradient-to-br from-zinc-800 to-zinc-900"
   - `textColor`: "#71717a — text-zinc-500"
   - `size`: "aspect-[2/3] full card — rounded-[2rem]"
   - `purpose`: "Creates a new story — card-sized button in story grid"
   - `visualEffects`: "border: 2px dashed #52525b (zinc-600). Hover: border-blue-400"
   - `locations`: "My Stories hub — first card in story grid"
   - Same preview (the dashed card)

3. **Story Detail Modal — Edit / Play / Remove** → `ButtonCardV2`
   - `buttonName`: "Story Detail Modal Actions"
   - `buttonColor`: "Edit: rgba(255,255,255,0.05) — bg-white/5. Play: #3b82f6 — bg-[#3b82f6]. Remove: rgba(255,255,255,0.05)"
   - `textColor`: "Edit/Play: #ffffff — text-white. Remove: rgba(255,255,255,0.6) — text-white/60"
   - `size`: "Edit/Play: flex-1 h-12 — rounded-xl. Remove: w-full h-10 — rounded-xl"
   - `purpose`: "Story detail modal actions — edit, play, or remove from gallery"
   - `visualEffects`: "Edit: border 1px white/10. Play: shadow-md. Remove: border 1px white/10"
   - `locations`: "StoryDetailModal — owned story actions and gallery removal"
   - Same preview (the three buttons stacked)

All three entries get `pageSpecific={true}` and `appWide={false}`.

