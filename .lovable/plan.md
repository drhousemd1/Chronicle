

# Update StoryDetailModal Heading & Subtext Colors

**File: `src/components/chronicle/StoryDetailModal.tsx`**

### Headings → Ghost White 100% (`text-[rgba(248,250,252,1)]`)
- **Line 475** — "Synopsis" heading: `text-white/40` → `text-[rgba(248,250,252,1)]`
- **Line 487** — "Genre" heading: same
- **Line 493** — "Character Types" heading: same
- **Line 499** — "Story Origin" heading: same
- **Line 508** — "Trigger Warnings" heading: same
- **Line 518** — "Custom Tags" heading: same
- **Line 528** — "Characters" heading: same
- **Line 581** — "Reviews" heading: same

### Subtext → Ghost White 80% (`text-[rgba(248,250,252,0.8)]`)
- **Line 476** — Synopsis body: `text-[#e2e8f0]` → `text-[rgba(248,250,252,0.8)]`
- **Line 488** — Genre values: `text-white` → `text-[rgba(248,250,252,0.8)]`
- **Line 494** — Character Types values: same
- **Line 500** — Story Origin values: same
- **Line 519** — Custom Tags values: same

**Note:** Trigger Warnings subtext stays `text-red-500` (intentionally red). Character names (line 565) already at 70% — will bump to 80% for consistency.

