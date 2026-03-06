

## Plan: Fix Opening Dialog Tooltip Text Styling + Restore Bullet Points

### Problem
The tooltip inherits `uppercase tracking-widest` from its parent `<label>`, causing ALL CAPS with wide letter spacing. The Dynamic Backgrounds tooltip doesn't have this issue because its parent doesn't apply those transforms. Additionally, the content was flattened into one paragraph instead of keeping the original bullet points.

### Fix in `src/components/chronicle/WorldTab.tsx` (lines 889-891)

Add `normal-case tracking-normal` to `TooltipContent` to reset inherited text transforms, and restructure the content as a `<ul>` list:

```tsx
<TooltipContent side="top" className="max-w-[260px] text-xs normal-case tracking-normal">
  <ul className="space-y-1 list-disc list-inside">
    <li>Opening dialog displays at the start of every new session — set the scene for where the story begins.</li>
    <li>Start dialog blocks with the character name followed by ":" (e.g., "James:").</li>
    <li>Enclose spoken dialogue in " ".</li>
    <li>Enclose physical actions in * *.</li>
    <li>Enclose internal thoughts in ( ).</li>
  </ul>
</TooltipContent>
```

Two changes, one location:
1. **`normal-case tracking-normal`** — resets inherited uppercase/tracking so text renders identically to the Chat Settings tooltip
2. **`<ul>` with bullet points** — restores the structured format from the original HintBox

