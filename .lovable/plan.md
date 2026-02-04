
# Restyle Containers to Dark Theme

## Overview

Restyle the following containers to match the Cover Image section's dark theme:
1. **World Core** - Currently white Card with slate styling
2. **Opening Dialog** - Currently white Card with slate styling
3. **Scene Gallery** - Currently white Card with slate styling + mismatched buttons
4. **Art Style Preference** - Currently white Card with slate styling
5. **World Codex** - Currently white Card with slate styling

---

## Current vs Target Styling

### Container Structure (Current Light Theme)
```tsx
<Card className="p-8 !shadow-[0_12px_32px_-2px_rgba(0,0,0,0.15)] border-transparent ring-1 ring-slate-900/5">
  <h2 className="text-lg font-black text-slate-900 ... border-b border-slate-100">
```

### Container Structure (Target Dark Theme)
```tsx
<div className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]">
  <div className="bg-[#4a5f7f] border-b border-white/20 px-6 py-4 flex items-center gap-3 shadow-lg">
    <h2 className="text-white text-xl font-bold tracking-tight">Title</h2>
  </div>
  <div className="p-6">
    <div className="p-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5">
      {/* Content */}
    </div>
  </div>
</div>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/WorldTab.tsx` | Restyle 5 containers + Scene Gallery buttons |
| `src/components/chronicle/SceneGalleryActionButtons.tsx` | **NEW FILE** - Create matching button pair for Scene Gallery |

---

## Detailed Changes

### 1. World Core Section (Lines 468-504)

**Current:**
```tsx
<Card className="p-8 !shadow-[0_12px_32px_-2px_rgba(0,0,0,0.15)] border-transparent ring-1 ring-slate-900/5">
  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight mb-8 pb-4 border-b border-slate-100">
    <Icons.Globe /> World Core
  </h2>
```

**Target:**
```tsx
<div className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]">
  <div className="bg-[#4a5f7f] border-b border-white/20 px-6 py-4 flex items-center gap-3 shadow-lg">
    <Icons.Globe className="text-white" />
    <h2 className="text-white text-xl font-bold tracking-tight">World Core</h2>
  </div>
  <div className="p-6">
    <div className="p-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5">
      {/* Field labels: text-zinc-400, inputs: dark theme */}
```

**Input/Label Styling Updates:**
- Field labels: `text-zinc-400` (instead of slate-500)
- Input backgrounds: `bg-zinc-900/50 border-zinc-700` with `text-white`
- Sparkles button: `text-zinc-400 hover:text-cyan-400`

---

### 2. Opening Dialog Section (Lines 506-595)

**Current:**
```tsx
<Card className="p-8 !shadow-[0_12px_32px_-2px_rgba(0,0,0,0.15)] border-transparent ring-1 ring-slate-900/5">
  <h2 className="text-lg font-black text-slate-900 ...">
    <Icons.MessageSquare /> Opening Dialog
  </h2>
```

**Target:** Same dark container pattern with:
- Day Counter: Dark styled (`bg-zinc-800` instead of `bg-slate-50`)
- Time of Day buttons: Dark styled (`bg-zinc-800`, active `bg-blue-500`)

---

### 3. Scene Gallery Section (Lines 597-717)

**Current:**
```tsx
<Card className="p-8 ...">
  <UploadSourceMenu ... label="+ Upload Scene" variant="primary" />
  <Button variant="primary">AI Generate</Button>
```

**Target:**
- Dark container styling
- **Replace UploadSourceMenu** with new `SceneGalleryActionButtons` component that matches `CoverImageActionButtons`
- Same premium "AI Generate" button design
- Same dark "Upload Scene" dropdown button

---

### 4. Art Style Preference Section (Lines 719-774)

**Current:**
```tsx
<Card className="p-8 ...">
  <h2 className="text-lg font-black text-slate-900 ...">Art Style Preference</h2>
  <button className="bg-white hover:bg-slate-50 ring-1 ring-slate-200">
```

**Target:**
- Dark container styling
- Style cards: `bg-zinc-800 hover:bg-zinc-700 ring-1 ring-zinc-600`
- Selected state: `ring-2 ring-blue-400`
- Style name text: `text-zinc-200`

---

### 5. World Codex Section (Lines 776-839)

**Current:**
```tsx
<Card className="p-8 ...">
  <h2 className="text-lg font-black text-slate-900 ...">
    <Icons.Database /> World Codex
```

**Target:**
- Dark container styling
- Entry cards: `bg-zinc-800/50 border-zinc-700` instead of `bg-slate-50`
- Label colors: `text-zinc-400`

---

## New Component: SceneGalleryActionButtons

Create a new component that mirrors `CoverImageActionButtons` for the Scene Gallery:

```tsx
// src/components/chronicle/SceneGalleryActionButtons.tsx
export function SceneGalleryActionButtons({
  onUploadFromDevice,
  onSelectFromLibrary,
  onGenerateClick,
  disabled,
  isGenerating,
  isUploading,
}: Props) {
  return (
    <div className="flex gap-2">
      {/* Upload Scene Button - Same dark style as Cover Image */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex h-10 px-4 rounded-xl border border-[hsl(var(--ui-border))] 
            bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] text-[10px] font-bold ...">
            <Upload /> Upload Scene
          </button>
        </DropdownMenuTrigger>
        ...
      </DropdownMenu>
      
      {/* AI Generate Button - Same 8-layer premium design */}
      <button className="group relative flex h-10 px-4 rounded-xl ...">
        {/* All 8 layers matching CoverImageActionButtons */}
      </button>
    </div>
  );
}
```

---

## Summary of Visual Changes

| Element | Light Theme | Dark Theme |
|---------|-------------|------------|
| Container bg | White | `#2a2a2f` |
| Header bg | None | Steel blue `#4a5f7f` |
| Header text | `slate-900` | `white` |
| Content wrapper | None | `#3a3a3f/30` |
| Labels | `slate-500` | `zinc-400` |
| Input bg | `slate-50` | `zinc-900/50` |
| Input text | `slate-900` | `white` |
| Borders | `slate-200` | `zinc-700` or `white/5` |
| HintBox | `zinc-900` (already done) | Keep as-is |
| Style cards | White | `zinc-800` |
| Upload buttons | Primary black | Dark outlined with UI tokens |
| AI Generate | Primary black | 8-layer premium gradient |
