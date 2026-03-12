

# Standardize All AI Enhance (Sparkles) Buttons

## Problem
The Sparkles enhance buttons across the app have two different styles:
1. **Boxed variant** (CharactersTab custom sections): Has `w-7 h-7 bg-zinc-700/50 rounded-lg text-zinc-500` — visible dark background container
2. **Clean variant** (everywhere else): Just `p-1 rounded-md text-zinc-400` — no visible background, icon only

The user wants ALL to match the clean, brighter style (image 2) with no background container.

Additionally, there are minor inconsistencies in color (`text-zinc-400` vs `text-zinc-500`) and hover color (`hover:text-blue-500` vs `hover:text-cyan-400`).

## Standard Style (target)
```
"p-1.5 rounded-md transition-all flex-shrink-0"
// default: "text-zinc-400 hover:text-blue-500 hover:bg-blue-500/10"
// loading: "text-blue-500 animate-pulse cursor-wait"
```

## Changes

### 1. `src/components/chronicle/CharactersTab.tsx` (line 1296-1300)
**The boxed variant.** Replace:
```
"shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-200"
// active: "bg-yellow-500/20 text-yellow-400 animate-pulse"
// default: "bg-zinc-700/50 text-zinc-500 hover:bg-blue-500/20 hover:text-blue-300"
```
With:
```
"p-1.5 rounded-md transition-all flex-shrink-0"
// active: "text-blue-500 animate-pulse cursor-wait"
// default: "text-zinc-400 hover:text-blue-500 hover:bg-blue-500/10"
```

### 2. `src/components/chronicle/CharactersTab.tsx` (line 885-889)
Normalize `p-1` to `p-1.5` and add `flex-shrink-0` for consistency:
```
"p-1.5 rounded-md transition-all flex-shrink-0"
```

### 3. `src/components/chronicle/WorldTab.tsx` (line 258-264)
Normalize hover color from `hover:text-cyan-400 hover:bg-ghost-white` to `hover:text-blue-500 hover:bg-blue-500/10`, and add `p-1.5 flex-shrink-0`:
```
"p-1.5 rounded-md transition-all flex-shrink-0"
// loading: "text-cyan-400 animate-pulse cursor-wait" → "text-blue-500 animate-pulse cursor-wait"
// default: "text-zinc-400 hover:text-blue-500 hover:bg-blue-500/10"
```

### 4. `src/components/chronicle/CharacterGoalsSection.tsx` (line 193-197)
Normalize `p-1` to `p-1.5`, add `flex-shrink-0`.

### 5. `src/components/chronicle/StoryGoalsSection.tsx` (line 278-282)
Same: `p-1` → `p-1.5`, add `flex-shrink-0`.

### 6. `src/components/chronicle/arc/ArcPhaseCard.tsx` (line 168-172)
Same: `p-1` → `p-1.5`, add `flex-shrink-0`.

All six files, uniform style. No background containers, consistent `text-zinc-400` default color, consistent `hover:text-blue-500` hover color.

