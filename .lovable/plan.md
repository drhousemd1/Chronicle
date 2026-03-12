

# Add Slate Blue Banner Behind Section Headings

**File: `src/components/chronicle/StoryDetailModal.tsx`**

Change all 6 section headings back to ghost white 90% and wrap each in a slate blue rectangular banner.

### Pattern
Each heading changes from:
```tsx
<h3 className="text-xs font-bold text-[#4a5f7f] uppercase tracking-widest mb-3">Synopsis</h3>
```
To:
```tsx
<div className="bg-[#4a5f7f]/30 rounded px-3 py-1.5 mb-3 inline-block">
  <h3 className="text-xs font-bold text-[rgba(248,250,252,0.9)] uppercase tracking-widest">Synopsis</h3>
</div>
```

The banner is a subtle slate blue rectangle (`bg-[#4a5f7f]/30`, rounded corners) with padding, making the heading text pop against a branded background.

### Lines to update
- **Line 475** — Synopsis heading
- **Line 487** — Genre heading
- **Line 493** — Character Types heading
- **Line 499** — Story Origin heading
- **Line 508** — Trigger Warnings heading
- **Line 528** — Characters heading

Reviews heading (line 581) not mentioned — will leave as-is.

