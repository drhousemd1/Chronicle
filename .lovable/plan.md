
# Restyle HardcodedSection to Match CharacterGoalsSection

## Overview

Update the `HardcodedSection` and `HardcodedInput` components in `CharactersTab.tsx` to use the same dark charcoal theme as `CharacterGoalsSection`, with full-width text inputs and labels positioned above them to the left.

---

## Current vs. Target Styling

| Element | Current (Light) | Target (Dark - like Character Goals) |
|---------|-----------------|--------------------------------------|
| Container bg | `bg-slate-100` | `bg-[#2a2a2f]` |
| Container border | `border-slate-300` | `border-white/10` |
| Container radius | default rounded | `rounded-[24px]` |
| Container shadow | default | `shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]` |
| Header bg | `bg-emerald-100` | `bg-[#4a5f7f]` with `border-b border-white/20` |
| Header "Section" label | (none) | `text-[#a5d6a7]` |
| Header title | `text-emerald-900` | `text-[#e8f5e9]` |
| Field labels | `text-slate-500` inline | `text-zinc-400` above input |
| Inputs | White bg, side-by-side | `bg-zinc-900/50`, full-width stacked |
| Content padding | `p-6` | `p-5` |

---

## Layout Changes

### Current Layout
```
[Label + Sparkle] -------- [Input field (2/3 width)]
```

### Target Layout (matching Character Goals)
```
[Label] [Sparkle icon]
[Input field ---------------------------------- full width]
```

This matches the Character Goals pattern where:
- Label is `text-[10px] font-bold text-zinc-400 uppercase tracking-widest`
- Input is below with `mt-1` spacing
- Input stretches full width with `bg-zinc-900/50 border-white/10 text-white`

---

## Technical Changes

### 1. HardcodedSection Component (lines 26-38)

**From:**
```tsx
const HardcodedSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <Card className="p-6 space-y-4 !shadow-[0_12px_32px_-2px_rgba(0,0,0,0.15)] !bg-slate-100 border border-slate-300">
    <div className="flex justify-between items-center bg-emerald-100 rounded-xl px-3 py-2">
      <span className="text-emerald-900 font-bold text-base">{title}</span>
    </div>
    <div className="space-y-4">
      {children}
    </div>
  </Card>
);
```

**To:**
```tsx
const HardcodedSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]">
    {/* Section Header */}
    <div className="bg-[#4a5f7f] border-b border-white/20 px-5 py-3 flex items-center gap-3 shadow-lg">
      <span className="text-[#a5d6a7] font-bold tracking-wide uppercase text-xs">Section</span>
      <h2 className="text-[#e8f5e9] text-xl font-bold tracking-tight">{title}</h2>
    </div>
    {/* Content */}
    <div className="p-5 space-y-4">
      {children}
    </div>
  </div>
);
```

### 2. HardcodedInput Component (lines 41-81)

**From:** Label and input side-by-side with white background

**To:** Label above input, full-width, dark styling

```tsx
const HardcodedInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onEnhance?: () => void;
  isEnhancing?: boolean;
}> = ({ label, value, onChange, placeholder, onEnhance, isEnhancing }) => (
  <div>
    {/* Label row with AI enhance button */}
    <div className="flex items-center gap-1.5 mb-1">
      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</label>
      {onEnhance && (
        <button
          type="button"
          onClick={onEnhance}
          disabled={isEnhancing}
          title="Enhance with AI"
          className={cn(
            "p-1 rounded-md transition-all",
            isEnhancing
              ? "text-blue-500 animate-pulse cursor-wait"
              : "text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10"
          )}
        >
          <Sparkles size={14} />
        </button>
      )}
    </div>
    {/* Full-width input */}
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm bg-zinc-900/50 border border-white/10 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
    />
  </div>
);
```

---

## Key Styling Details

### Container
- `bg-[#2a2a2f]` - Dark charcoal background
- `rounded-[24px]` - Large border radius matching Character Goals
- `border-white/10` - Subtle white border
- `shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]` - Prominent drop shadow

### Header
- `bg-[#4a5f7f]` - Steel blue header
- `border-b border-white/20` - White bottom border
- `text-[#a5d6a7]` - Soft green "Section" label
- `text-[#e8f5e9]` - Light green title

### Labels
- `text-[10px] font-bold text-zinc-400 uppercase tracking-widest`
- Positioned above input, not inline

### Inputs
- `bg-zinc-900/50` - Dark semi-transparent background
- `border-white/10` - Subtle border
- `text-white` - White text
- `placeholder:text-zinc-600` - Muted placeholder
- Full width (no more 1/3 + 2/3 split)

### AI Enhance Button
- `text-zinc-400` default (instead of black)
- `hover:text-blue-400 hover:bg-blue-500/10` for hover state
- Same position next to label

---

## Files to Modify

| File | Lines | Change |
|------|-------|--------|
| `src/components/chronicle/CharactersTab.tsx` | 26-38 | Rewrite HardcodedSection component |
| `src/components/chronicle/CharactersTab.tsx` | 41-81 | Rewrite HardcodedInput component |

---

## Visual Result

After these changes, "Preferred Clothing", "Physical Appearance", and "Currently Wearing" sections will all have:
- Dark charcoal container with rounded-[24px] corners
- Steel blue header with "Section" label + title
- Stacked layout: label above full-width input
- Dark input fields with subtle borders
- Zinc-colored labels and AI enhance buttons
- Same drop shadow as Character Goals
