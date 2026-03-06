

## Plan: Replace Opening Dialog HintBox with Info Icon + Tooltip

### Changes to `src/components/chronicle/WorldTab.tsx`

**1. Add imports (line 14)**
- Add `Info` to the lucide-react import
- Add `Tooltip, TooltipTrigger, TooltipContent, TooltipProvider` from `@/components/ui/tooltip`

**2. Replace the HintBox at lines 880-886 with an Info icon on the label (line 888)**
- Remove the `<HintBox>` block containing the 5 opening dialog hints
- Move the hint text into a tooltip on an `Info` icon placed next to the "Opening Dialog" label
- The label line (888) becomes:
  ```tsx
  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
    Opening Dialog
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="w-3.5 h-3.5 text-blue-500 cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px] text-xs">
          Opening dialog will display at the start of every new session. This should set the scene for where the story begins. Start dialog blocks with the character name followed by ":" (e.g., "James:"). Enclose spoken dialogue in " ", physical actions in * *, and internal thoughts in ( ).
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </label>
  ```
- The tooltip condenses all 5 hint bullet points into a single readable paragraph
- Icon uses `text-blue-500` matching the color we just tested in Chat Settings

**Scope**: Only the first HintBox in the Opening Dialog section is replaced — other HintBoxes remain untouched for now. This is the test location to confirm the pattern works on a different background.

