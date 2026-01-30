

# Fix: Make World Core AI Enhancement Icon Black

## Change

Update the sparkle icon color from `text-slate-300` to `text-black` for maximum visibility.

## File to Modify

**`src/components/chronicle/WorldTab.tsx`** - Line 156

**Before:**
```tsx
: "text-slate-300 hover:text-blue-500 hover:bg-blue-50"
```

**After:**
```tsx
: "text-black hover:text-blue-500 hover:bg-blue-50"
```

## Result

The sparkle icon will be solid black, clearly visible against the white background, and turn blue on hover.

