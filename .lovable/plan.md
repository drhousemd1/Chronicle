

## Fix: Convert Community Gallery Button Entries to ButtonCardV2 Format

Lines 1255-1294 contain four `EntryCard` entries for the Community Gallery buttons section. Convert all four to `ButtonCardV2`.

### Changes to `StyleGuideTool.tsx` (lines 1255-1294)

Replace the four `EntryCard` entries with `ButtonCardV2`:

**1. "Gallery Icon Buttons — Like / Save"** (lines 1255-1266)
- `buttonName`: "Gallery Icon Buttons — Like / Save"
- `buttonColor`: "Default: rgba(255,255,255,0.9) — bg-white/90. Liked: #f43f5e — bg-rose-500. Saved: #f59e0b — bg-amber-500"
- `textColor`: "Default: #334155 — text-slate-700. Liked/Saved: #ffffff — text-white"
- `size`: "h-8 w-8 — rounded-xl (12px)"
- `purpose`: "Icon toggle buttons for liking and saving gallery stories on card hover"
- `visualEffects`: "shadow-2xl"
- `locations`: "GalleryStoryCard — hover overlay"
- `pageSpecific={true}`, `appWide={false}`
- Preview: same 3 buttons, keep as-is

**2. "Gallery PLAY Button"** (lines 1267-1274)
- `buttonName`: "Gallery PLAY Button"
- `buttonColor`: "#3b82f6 — bg-blue-600"
- `textColor`: "#ffffff — text-white"
- `size`: "h-8 px-4 — rounded-xl (12px)"
- `purpose`: "Compact play action on gallery story card hover overlay"
- `visualEffects`: "shadow-2xl · text-[10px] font-bold leading-none uppercase tracking-wider"
- `locations`: "GalleryStoryCard — hover overlay"
- `pageSpecific={true}`, `appWide={false}`
- Preview: same PLAY button

**3. "Gallery Search Button"** (lines 1275-1282)
- `buttonName`: "Gallery Search Button"
- `buttonColor`: "#4a5f7f — bg-[#4a5f7f]"
- `textColor`: "#ffffff — text-white"
- `size`: "px-4 py-1.5 — rounded-lg (8px)"
- `purpose`: "Submit search inside the gallery search input"
- `visualEffects`: "text-sm font-semibold. Hover: bg-[#5a6f8f]. Positioned absolute inside search input"
- `locations`: "GalleryHub — search header"
- `pageSpecific={true}`, `appWide={false}`
- Preview: same Search button

**4. "Browse Categories Button"** (lines 1283-1294)
- `buttonName`: "Browse Categories Button"
- `buttonColor`: "#4a5f7f — bg-[#4a5f7f]"
- `textColor`: "#ffffff — text-white"
- `size`: "px-4 py-3 — rounded-lg (8px)"
- `purpose`: "Toggle the category filter sidebar open/close"
- `visualEffects`: "text-sm font-semibold. Hover: bg-[#5a6f8f]. Filter count badge: px-1.5 py-0.5 bg-white/20 rounded-full text-xs"
- `locations`: "GalleryHub — search header, right side"
- `pageSpecific={true}`, `appWide={false}`
- Preview: same button with badge

