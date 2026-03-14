

## Fix Basics Container — Upload Button + Segmented Toggles

You're right — I missed two elements in the Basics container that need to match the HTML reference styling.

### Issue 1: Upload Image Button (AvatarActionButtons.tsx)

The Upload Image button currently uses `bg-[hsl(var(--ui-surface-2))]` with a `border border-[hsl(var(--ui-border))]`. The HTML reference shows it should use the **Raised Button** treatment: `bg-[#3c3e47]`, no border, with the shared raised shadow.

**Current** (line 41-47 in AvatarActionButtons.tsx):
```
bg-[hsl(var(--ui-surface-2))] border border-[hsl(var(--ui-border))]
shadow-[0_10px_30px_rgba(0,0,0,0.35)]
```

**Target** (from HTML `.btn-upload`):
```
bg-[#3c3e47] border-none
shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]
hover:bg-[#44464f]
```

### Issue 2: "Controlled By" and "Character Role" Segmented Toggles

These toggles (lines 1397-1431 in CharactersTab.tsx) currently use `bg-zinc-800` container with `bg-zinc-700` active state. The HTML reference shows segmented button groups should use:

- **Container**: `bg-[#3c3e47]` raised tile with shared shadow stack (same as chat settings button groups)
- **Inactive button**: `bg-[#3f3f46]`, `color: #a1a1aa`
- **Active button**: `bg-[#3b82f6]`, `color: #fff`, `box-shadow: 0 2px 8px rgba(59,130,246,0.35)`

The current active state colors (blue-500 for AI, amber-400 for User, indigo-400 for Main) should all become blue-500 (`#3b82f6`) when active, matching the reference's unified blue active state.

### Changes

**File: `src/components/chronicle/AvatarActionButtons.tsx`**
- Lines 41-47: Replace `bg-[hsl(var(--ui-surface-2))] border border-[hsl(var(--ui-border))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]` with `bg-[#3c3e47] border-0 shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]`
- Update hover from `hover:bg-ghost-white` to `hover:bg-[#44464f]`
- Update text color from `text-[hsl(var(--ui-text))]` to `text-[#eaedf1]`
- Change font size from `text-[10px]` to `text-xs` (12px) per reference

**File: `src/components/chronicle/CharactersTab.tsx`**
- Lines 1397-1431: Replace both "Controlled By" and "Character Role" segmented toggle groups:
  - Outer container: `bg-[#3c3e47] rounded-xl p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]`
  - Inactive buttons: `bg-[#3f3f46] text-[#a1a1aa]`
  - Active buttons: `bg-[#3b82f6] text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)]`

