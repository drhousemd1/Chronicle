

## Plan: Add info tooltips to labels, remove HintBox

### Changes in `src/components/chronicle/WorldTab.tsx`

**1. Add info tooltip to "Starting Day & Time" label (line 915)**

Replace the plain label with a flex row containing the label + Info icon with tooltip:
```tsx
<div className="flex items-center gap-1.5 mb-1">
  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Starting Day & Time</label>
  <Tooltip>
    <TooltipTrigger asChild>
      <Info className="w-3.5 h-3.5 text-blue-500 cursor-help" />
    </TooltipTrigger>
    <TooltipContent side="top" className="max-w-[300px] text-xs font-semibold leading-relaxed normal-case tracking-normal">
      Set when your story begins. The AI will use this context for time-appropriate responses.
    </TooltipContent>
  </Tooltip>
</div>
```

**2. Add info tooltip to "Mode" label (line 977)**

Same pattern, with bullet-point content:
```tsx
<div className="flex items-center gap-1.5 mb-1">
  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Mode</label>
  <Tooltip>
    <TooltipTrigger asChild>
      <Info className="w-3.5 h-3.5 text-blue-500 cursor-help" />
    </TooltipTrigger>
    <TooltipContent side="top" className="max-w-[300px] text-xs font-semibold leading-relaxed normal-case tracking-normal">
      <ul className="list-outside pl-4 space-y-1">
        <li><strong>Manual:</strong> User will update the day and time counters manually when they want the day/time to advance.</li>
        <li><strong>Automatic:</strong> Time/day will progress by set intervals.</li>
      </ul>
      <p className="mt-1.5">Users can adjust these settings during their playthrough in the chat settings tab.</p>
    </TooltipContent>
  </Tooltip>
</div>
```

**3. Remove the HintBox (lines 1024-1027)**

Delete the entire `<HintBox hints={[...]} />` block. The two hints are now covered by the info tooltips above (and the second hint is removed entirely per request).

