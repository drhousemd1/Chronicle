

# Fix Plan: Standardize All AI Generation Modals

## Problem Summary

The application has **3 AI image generation modals**, but they have inconsistent styling:

1. **CoverImageGenerationModal** - Correct styling (the gold standard)
2. **AvatarGenerationModal** - Correct styling (matches Cover)
3. **SceneImageGenerationModal** - Incorrect styling (inconsistent with the others)

Additionally, the **BackgroundPickerModal** has a "+ Upload Background" button that uses light blue text instead of the dark button style used throughout the app.

---

## Fix #1: Upload Background Button Styling

**File:** `src/components/chronicle/BackgroundPickerModal.tsx`

**Current (line 70):**
```tsx
<Button variant="ghost" className="text-blue-600 font-black text-xs tracking-widest uppercase h-9 gap-1" disabled={isUploading}>
```

**Fixed:**
```tsx
<Button variant="ghost" className="bg-slate-900 text-white hover:bg-slate-800 font-black text-xs tracking-widest uppercase h-9 gap-1 px-3" disabled={isUploading}>
```

---

## Fix #2: Standardize SceneImageGenerationModal

**File:** `src/components/chronicle/SceneImageGenerationModal.tsx`

This modal needs to be updated to match the exact styling of CoverImageGenerationModal and AvatarGenerationModal.

### Changes Required:

#### 2a. Update Dialog Header
Add the Wand2 icon and border styling like the other modals:
```tsx
<DialogHeader className="pb-4 border-b border-border">
  <DialogTitle className="flex items-center gap-2 text-lg font-bold">
    <Wand2 className="w-5 h-5" />
    Generate Scene Image
  </DialogTitle>
</DialogHeader>
```

Move the description text into the prompt section as a tip.

#### 2b. Update Textarea Styling
Add the blue focus ring and slate background:
```tsx
<Textarea
  value={prompt}
  onChange={(e) => setPrompt(e.target.value)}
  placeholder="..."
  className="min-h-[100px] resize-none bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus-visible:ring-0 focus-visible:ring-offset-0"
  disabled={isGenerating}
/>
```

#### 2c. Update Label Styling
Change from `text-slate-500` to `text-muted-foreground` to match:
```tsx
<Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
```

#### 2d. Restructure Style Selection Buttons
Replace the current border-based styling with ring-based styling that includes checkmarks:

**Current structure (causes clipping issues):**
```tsx
<button
  className={cn(
    "relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200",
    selectedStyle === style.id
      ? "border-blue-500 ring-2 ring-blue-500/30 scale-105"
      : "border-slate-200 hover:border-slate-300"
  )}
>
  <img ... />
  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 ...">
    <span>...</span>
  </div>
</button>
```

**New structure (matches Cover & Avatar modals):**
```tsx
<button
  className={cn(
    "relative rounded-xl p-2 transition-all duration-200 cursor-pointer outline-none",
    "bg-card hover:bg-accent/50",
    selectedStyle === style.id
      ? "ring-2 ring-blue-400 shadow-md"
      : "ring-1 ring-border hover:ring-slate-300",
    "focus:ring-2 focus:ring-blue-100 focus:ring-offset-0"
  )}
>
  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
    <img src={style.thumbnailUrl} alt={style.displayName} className="w-full h-full object-cover" />
  </div>
  <p className="text-xs font-semibold text-center mt-2 text-foreground">
    {style.displayName}
  </p>
  {selectedStyle === style.id && (
    <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
      <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  )}
</button>
```

#### 2e. Update Grid Layout
Change from `grid-cols-3 sm:grid-cols-5` to `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` for consistency.

#### 2f. Add Separator and Spacing
Add the separator div and proper spacing between sections like the other modals.

#### 2g. Update Footer Styling
Add border-top and use consistent button styling.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/BackgroundPickerModal.tsx` | Dark button styling for "+ Upload Background" |
| `src/components/chronicle/SceneImageGenerationModal.tsx` | Complete restyling to match CoverImageGenerationModal |

---

## Why This Fixes Everything

By standardizing SceneImageGenerationModal to match CoverImageGenerationModal and AvatarGenerationModal, all 3 AI generation modals will have:

- Consistent blue focus rings on text inputs
- Consistent ring-based selection (not border-based) that doesn't clip
- Checkmark indicators on selected styles
- Proper padding that prevents edge clipping
- Same typography and spacing
- Same header/footer styling

This is a complete fix for all AI generation interfaces in the application.

