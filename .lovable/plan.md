

## Add Drop Shadow to Character Section Headers

### Change

**File: `src/components/chronicle/ChatInterfaceTab.tsx`**

Add `shadow-lg` to both the "Main Characters" and "Side Characters" `<h3>` banner elements:

**Line 3367** (Main Characters):
```tsx
// Before
className="flex-shrink-0 text-[11px] font-bold text-white bg-[#4a5f7f] px-4 py-1.5 rounded-lg mb-3 tracking-tight uppercase flex items-center justify-between cursor-pointer select-none"

// After — add shadow-lg
className="flex-shrink-0 text-[11px] font-bold text-white bg-[#4a5f7f] px-4 py-1.5 rounded-lg mb-3 tracking-tight uppercase flex items-center justify-between cursor-pointer select-none shadow-lg"
```

**Line 3419** (Side Characters):
```tsx
// Same change — add shadow-lg
className="flex-shrink-0 text-[11px] font-bold text-white bg-[#4a5f7f] px-4 py-1.5 rounded-lg mb-3 tracking-tight uppercase flex items-center justify-between cursor-pointer select-none shadow-lg"
```

