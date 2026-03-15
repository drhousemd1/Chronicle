

## Plan: Change Character Builder nav button labels to Title Case

**File**: `src/components/chronicle/CharactersTab.tsx`, line 370

**Change**: Remove the `uppercase` class from the label `<span>` so the labels render in their natural Title Case (as already defined in the `BUILT_IN_TRAIT_SECTIONS` array at lines 69-79).

```
// Before
<span className="truncate text-[12px] font-black tracking-[0.08em] leading-tight uppercase text-[#eaedf1]">

// After
<span className="truncate text-[12px] font-black tracking-[0.08em] leading-tight text-[#eaedf1]">
```

