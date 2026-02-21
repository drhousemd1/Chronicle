

# Fix All Text Sizing and Styling in Story Arcs Section

## The Problem

The Story Arcs container has inline styles on every single text element -- labels, inputs, buttons, progress text -- while the reference containers (like "Goals and Desires") use consistent Tailwind classes. The sizes, colors, and input styling all mismatch.

## Reference Pattern (from CharacterGoalsSection)

These are the Tailwind classes used by the matching containers:

```text
Labels:           text-xs font-bold text-zinc-400 uppercase tracking-widest
Inputs (edit):    mt-1 px-3 py-2 text-sm bg-zinc-900/50 border border-white/10 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20
Steps header:     text-xs font-bold text-white uppercase tracking-[0.2em]
Progress %:       text-lg font-bold text-slate-300
Progress label:   text-xs font-black text-zinc-400 uppercase tracking-[0.2em]
Add buttons:      text-sm border-2 border-dashed border-zinc-500 text-blue-400 rounded-xl
```

Note: Per project accessibility rules, no text smaller than 12px (text-xs). Previous `text-[10px]` and `text-[9px]` labels will become `text-xs`.

## Every Element to Fix (exhaustive list)

### File 1: StoryGoalsSection.tsx

| Element | Current (inline) | New (Tailwind) |
|---------|------------------|----------------|
| "GOAL NAME" label (line 242-250) | fontSize: '11px', letterSpacing: '0.22em', color: 'rgba(198,213,238,0.86)', fontWeight: 700 | className="text-xs font-bold text-zinc-400 uppercase tracking-widest" |
| Goal Name textarea (line 255-264) | fontSize: '16px', height: '54px', borderRadius: '14px', background: 'rgba(24,28,37,0.92)', lineHeight: '54px' | className="mt-1 px-3 py-2 text-sm bg-zinc-900/50 border border-white/10 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" -- remove style prop |
| Delete button (line 270-289) | inline width/height/borderRadius/etc | className="text-zinc-500 hover:text-rose-400 transition-colors" with Trash2 icon |
| Progress % text (line 302-305) | fontSize: '20px', fontWeight: 700 | className="text-lg font-bold text-slate-300" |
| Progress "No Steps" text (line 310-316) | fontSize: '9px' (violates 12px min) | className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]" |
| "DESIRED OUTCOME" label (line 328-334) | fontSize: '11px' inline | className="text-xs font-bold text-zinc-400 uppercase tracking-widest" |
| Desired Outcome textarea (line 350-358) | fontSize: '16px', height: '84px', borderRadius: '14px' | Same Tailwind input classes as Goal Name, with rows=2 |
| "STEPS" h4 (line 378-385) | fontSize: '11px' inline | className="text-xs font-bold text-white uppercase tracking-[0.2em]" |
| "Add Next Phase" button (line 426-438) | fontSize: '11px', inline | className="text-sm text-blue-400 hover:text-blue-300 transition-colors" styled similarly to reference |
| "Add New Story Arc" button (line 467-477) | fontSize: '16px', height: '64px' inline | className="w-full py-2.5 text-sm bg-transparent border-2 border-dashed border-zinc-500 text-blue-400 hover:border-blue-400 hover:bg-blue-500/5 font-medium rounded-xl transition-colors" |

### File 2: ArcBranchLane.tsx

| Element | Current (inline) | New (Tailwind) |
|---------|------------------|----------------|
| "FAIL PATH" / "SUCCEED PATH" (line 87-94) | fontSize: '12px', letterSpacing: '0.22em' | className="text-xs font-bold text-white/70 uppercase tracking-widest" |
| Trigger label "RESISTANCE TRIGGER" (line 100-108) | fontSize: '10px' (violates 12px min) | className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1.5" |
| Trigger textarea (line 116-125) | fontSize: '15px', height: '48px' | Same Tailwind input classes as above |
| Step label "RECOVERY STEP 1" (line 146-152) | fontSize: '11px' | className="text-xs font-bold text-zinc-400 uppercase tracking-widest" |
| "FAILED" / "SUCCEEDED" / "COMPLETED" labels (line 183-191, 221-229) | fontSize: '10px' (violates 12px min) | className="text-xs font-bold text-zinc-300 uppercase tracking-wider" |
| Step description textarea (line 260-271) | fontSize: '15px' | Same Tailwind input classes |
| Completion meta text (line 275-280) | fontSize: '11px' | className="text-xs text-zinc-400" |
| "ADD STEP" button (line 288-308) | fontSize: '12px', inline | className="text-sm font-bold text-white uppercase tracking-widest" styled with appropriate bg |

### File 3: ArcPhaseCard.tsx

Same fixes as StoryGoalsSection since it duplicates the same inline styles for labels, inputs, progress text, etc.

| Element | Fix |
|---------|-----|
| "Phase N" label (line 168-174) | className="text-xs font-bold text-blue-400 uppercase tracking-widest" |
| "GOAL NAME" label (line 200-208) | Same as StoryGoalsSection |
| Goal Name textarea (line 213-222) | Same Tailwind input classes |
| Progress % (line 238-242) | className="text-lg font-bold text-slate-300" |
| Progress "No Steps" (line 246-252) | className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]" |
| "DESIRED OUTCOME" label (line 264-270) | Same as StoryGoalsSection |
| Desired Outcome textarea (line 286-294) | Same Tailwind input classes |
| "STEPS" h4 (line 314-321) | Same as StoryGoalsSection |

### File 4: GuidanceStrengthSlider.tsx

| Element | Current (inline) | New (Tailwind) |
|---------|------------------|----------------|
| "GUIDANCE STRENGTH" label (line 35-42) | fontSize: '11px' inline | className="text-xs font-bold text-zinc-400 uppercase tracking-widest" |
| Subtitle text (line 46-50) | fontSize: '16px' inline | className="text-sm text-zinc-400" |
| Slider labels RIGID/NORMAL/FLEXIBLE (line 104-110) | fontSize: '11px' inline | className="text-xs font-bold uppercase tracking-widest" with conditional color |
| Description body text (line 126-131) | fontSize: '15px' inline | className="text-sm text-zinc-300 leading-relaxed" |

### File 5: ArcModeToggle.tsx

| Element | Current (inline) | New (Tailwind) |
|---------|------------------|----------------|
| Simple/Advanced buttons (line 24-25, 42-43) | fontSize: '10px' (violates 12px min) | className="text-xs font-bold uppercase tracking-widest" |

## Summary of Changes

- Convert ALL inline styles on text elements, labels, and inputs to Tailwind classes
- Ensure no text is smaller than 12px (text-xs)
- Match the input field styling to use `bg-zinc-900/50 border border-white/10 rounded-lg text-sm` instead of custom rgba backgrounds with large font sizes
- Match button styling to the dashed border pattern used by CharacterGoalsSection
- 5 files modified total

