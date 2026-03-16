

# Add Gradient + Gloss Effects to Sidebar Nav Items

## Current State
Line 88 in `src/pages/Index.tsx`: Active sidebar items use flat `bg-[#4a5f7f]`. No gradient, no gloss sheen, no top border highlight.

## Target State
Match the header container aesthetic from the builders: vertical gradient (`from-[#5a7292] to-[#4a5f7f]`), top border highlight (`border-t border-white/20`), and gloss sheen overlay.

## Changes — `src/pages/Index.tsx`

### 1. Update active state classes (line 88)
Change from:
```
bg-[#4a5f7f] shadow-lg shadow-black/40 text-white
```
To:
```
bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 shadow-lg shadow-black/40 text-white
```

### 2. Add gloss sheen overlay inside the button (line 92-106)
Add a `relative overflow-hidden` to the button element, then insert an absolute-positioned gloss sheen div (matching the builder pattern):
```html
<div className="absolute inset-0 bg-gradient-to-b from-white/[0.07] via-transparent to-transparent pointer-events-none" style={{ backgroundSize: '100% 60%', backgroundRepeat: 'no-repeat' }} />
```
Wrap existing content with `relative z-[1]` so it sits above the sheen.

### Files Changed
- `src/pages/Index.tsx` — `SidebarItem` component (lines 87-106)

