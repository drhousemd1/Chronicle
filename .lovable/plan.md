

## Split "Story Detail Modal Actions" into 5 Individual ButtonCardV2 Entries

The current single "Story Detail Modal Actions" entry (lines 1170-1189) jams Edit, Play, and Remove into one card and completely omits Like and Save. Each button gets its own `ButtonCardV2`.

### Replace lines 1170-1189 with 5 entries:

**1. "Story Detail — Edit"**
- buttonColor: `rgba(255,255,255,0.05) — bg-white/5`
- textColor: `#ffffff — text-white`
- size: `flex-1 h-12 — rounded-xl`
- purpose: `Edit owned story from detail modal`
- visualEffects: `border: 1px solid rgba(255,255,255,0.1) — border-white/10. Hover: bg-white/10`
- locations: `StoryDetailModal — owned mode only`
- preview: single Edit button with pencil icon

**2. "Story Detail — Play"**
- buttonColor: `#3b82f6 — bg-[#3b82f6]`
- textColor: `#ffffff — text-white`
- size: `flex-1 h-12 — rounded-xl`
- purpose: `Play/resume story from detail modal`
- visualEffects: `shadow-md. Hover: bg-[#2563eb]`
- locations: `StoryDetailModal — both owned and gallery modes`
- preview: single Play button

**3. "Story Detail — Like"**
- buttonColor: `Default: rgba(255,255,255,0.05) — bg-white/5. Active: rgba(244,63,94,0.2) — bg-rose-500/20`
- textColor: `Default: #ffffff — text-white. Active: #fb7185 — text-rose-400`
- size: `flex-1 h-12 — rounded-xl`
- purpose: `Like a story — toggle button with filled heart when active`
- visualEffects: `Default: border-white/10. Active: border-rose-500/50. fill-current on icon when active`
- locations: `StoryDetailModal — gallery mode (non-owned)`
- preview: both default and active states side by side

**4. "Story Detail — Save"**
- buttonColor: `Default: rgba(255,255,255,0.05) — bg-white/5. Active: rgba(245,158,11,0.2) — bg-amber-500/20`
- textColor: `Default: #ffffff — text-white. Active: #fbbf24 — text-amber-400`
- size: `flex-1 h-12 — rounded-xl`
- purpose: `Save/bookmark a story — toggle button with filled bookmark when active`
- visualEffects: `Default: border-white/10. Active: border-amber-500/50. fill-current on icon when active`
- locations: `StoryDetailModal — gallery mode (non-owned)`
- preview: both default and active states side by side

**5. "Story Detail — Remove from Gallery"**
- buttonColor: `rgba(255,255,255,0.05) — bg-white/5`
- textColor: `rgba(255,255,255,0.6) — text-white/60`
- size: `w-full h-10 — rounded-xl`
- purpose: `Unpublish owned story from community gallery`
- visualEffects: `border: 1px solid rgba(255,255,255,0.1) — border-white/10`
- locations: `StoryDetailModal — owned + published stories only`
- preview: full-width button with globe icon

All 5: `pageSpecific={true}`, `appWide={false}`

