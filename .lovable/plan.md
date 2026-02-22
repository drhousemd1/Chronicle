
# Fix App Guide Loading: Remove Radix Dependencies from GuideSidebar

## The Real Problem
The editor code is tiny and not the issue. The problem is that `GuideSidebar.tsx` imports two Radix UI components (`ScrollArea` and `Separator`). When Vite tries to dynamically load the App Guide tool, it needs to pre-bundle these Radix packages and their deep dependency trees on the fly -- and that pre-bundling step times out (504 error), killing the dynamic import.

## The Fix
Replace the two Radix UI imports in `GuideSidebar.tsx` with plain HTML/CSS equivalents. No functionality is lost.

### File: `src/components/admin/guide/GuideSidebar.tsx`

1. **Remove imports**: Delete the imports of `ScrollArea` from `@/components/ui/scroll-area` and `Separator` from `@/components/ui/separator`
2. **Replace `<ScrollArea>`** with `<div className="flex-1 min-h-0 overflow-y-auto">` (identical behavior)
3. **Replace `<Separator>`** with `<div className="h-px w-full bg-[#333]" />` (identical appearance)

That's it. One file, three small replacements. No other files change.

## Technical Details

Current problematic imports in GuideSidebar.tsx:
```
import { ScrollArea } from '@/components/ui/scroll-area';   // pulls in @radix-ui/react-scroll-area
import { Separator } from '@/components/ui/separator';       // pulls in @radix-ui/react-separator
```

These get replaced with zero-dependency HTML equivalents:
- `<ScrollArea className="flex-1 min-h-0">` becomes `<div className="flex-1 min-h-0 overflow-y-auto">`
- `<Separator className="bg-[#333]" />` becomes `<div className="h-px w-full bg-[#333]" />`

This completely eliminates the Radix dependency chain from the lazy-loaded module, so the dynamic import will resolve instantly.
