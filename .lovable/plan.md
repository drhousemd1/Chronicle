

## Plan: Match Add Character buttons exactly to Add Location button

The Add Location button (line 854) has this exact styling:

```
className="w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
```

The current Add Character buttons (line 601-614) differ in three ways:
1. Text color is `text-white/90` instead of `text-blue-500 hover:text-blue-300`
2. No `gap-1.5` for icon spacing
3. No `<Plus size={16} />` icon — just literal string `"(+)"`

**Fix** — Replace `AddCharacterPlaceholder` (lines 601-615) with an exact copy of the Add Location styling, plus restore the `Plus` icon:

```tsx
const AddCharacterPlaceholder: React.FC<{ label: string; hasError?: boolean }> = ({ label, hasError }) => (
  <button
    type="button"
    onClick={() => setIsCharacterCreationOpen(true)}
    className={cn(
      "w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all flex items-center justify-center gap-1.5",
      hasError && "border border-red-500 ring-2 ring-red-500"
    )}
  >
    <Plus size={16} />
    <span>{label}</span>
  </button>
);
```

Update call sites (lines 631, 643):
- `label="Main Character"` (remove the literal `(+)` — the icon handles it)
- `label="Side Character"`

This is a character-for-character match of the Add Location button's className string plus the same `<Plus size={16} />` + `<span>` markup pattern.

