

# Change "Main Characters" Header to Slate Blue

## Change

Update the "Main Characters" section header in the chat sidebar to use the slate blue brand color (`#4a5f7f`) with white text, leaving the "Side Characters" header unchanged for comparison.

## Technical Details

**File:** `src/components/chronicle/ChatInterfaceTab.tsx`, line 2688

Current:
```
bg-slate-100 ... text-slate-500
```

Replace with:
```
bg-[#4a5f7f] ... text-white
```

This is a single line change -- swapping the background from `bg-slate-100` to `bg-[#4a5f7f]` and text from `text-slate-500` to `text-white`.

