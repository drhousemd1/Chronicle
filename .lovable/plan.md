

# Match Story Arc Container to Other Containers + Remove Lane Padding

## What's Wrong

The Story Arc container uses completely different styling (inline styles) compared to the other containers on the scenario builder page (like "Goals and Desires") which use Tailwind classes. The branch lanes also have an unnecessary padding/border wrapper.

## Reference Style (from CharacterGoalsSection)

```text
Outer:    bg-[#2a2a2f] rounded-[24px] border border-white/10 shadow
Header:   bg-[#4a5f7f] px-5 py-3 border-b border-white/20
Content:  p-5 space-y-4
Cards:    p-5 pb-6 bg-[#3a3a3f]/30 rounded-2xl border border-blue-500/20
```

## Changes

### 1. StoryGoalsSection.tsx -- Match outer container + header + content padding

| Element | Current | New |
|---------|---------|-----|
| Outer wrapper | `borderRadius: '38px'`, inline rgba bg/border/shadow | `className="bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]"` |
| Header | `padding: '18px 30px'`, `minHeight: '56px'`, inline styles | `className="bg-[#4a5f7f] border-b border-white/20 px-5 py-3 flex items-center gap-3"` |
| Header text | `fontSize: '18px'` inline | `className="text-white text-xl font-bold tracking-tight"` |
| Content area | `padding: '20px 16px'` | `className="p-5 space-y-4"` |
| Goal cards | `padding: '30px'`, `borderRadius: '26px'`, inline bg/border | `className="p-5 pb-6 bg-[#3a3a3f]/30 rounded-2xl border border-blue-500/20 relative"` |

### 2. ArcBranchLane.tsx -- Remove padding container

Currently each lane has a wrapper div with `padding: '10px'`, `borderRadius: '24px'`, `border: 1px dotted`, and a dark background. This creates an unnecessary nested container that wastes space.

**Remove**: The outer wrapper's padding, border-radius, dotted border, and background. The lane content (header cluster + steps) will sit directly in the grid cell without extra padding/chrome.

### 3. ArcPhaseCard.tsx -- Match card styling

Same container style changes as StoryGoalsSection for phase cards so they're consistent.

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/StoryGoalsSection.tsx` | Replace all inline styles on outer shell, header, content area, and goal cards with Tailwind classes matching CharacterGoalsSection |
| `src/components/chronicle/arc/ArcBranchLane.tsx` | Remove outer padding container (dotted border, padding, border-radius, background) |
| `src/components/chronicle/arc/ArcPhaseCard.tsx` | Match card styling to use same Tailwind classes as the updated StoryGoalsSection |

