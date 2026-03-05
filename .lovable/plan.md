

## Plan: Rename "Show Background" → "Dynamic Backgrounds" with Tooltip + Remove Footer

### Changes to `src/components/chronicle/ChatInterfaceTab.tsx`

**1. Update the toggle row (lines 3761-3768)**
- Rename label from "Show Background" to "Dynamic Backgrounds"
- Add an `Info` icon (from lucide-react) after the label text
- Wrap the icon in a `Tooltip` (from `@/components/ui/tooltip`) that shows: "Backgrounds will automatically change based on the story context if scene images are tagged in the gallery."
- Style the icon as `w-3.5 h-3.5 text-zinc-500` to keep it subtle

**2. Remove the footer note (lines 3930-3933)**
- Delete the `<p>` element containing the same helper text, since it's now on the tooltip

**3. Add imports**
- Add `Info` from `lucide-react` (if not already imported)
- Add `Tooltip, TooltipTrigger, TooltipContent, TooltipProvider` from `@/components/ui/tooltip` (if not already imported)

Two edits in one file.

