

## Plan: Move Drafts Button to Story Builder Header

### Problem
The "Drafts" button was placed on the **Hub** tab (line 1852) instead of on the **Story Builder** page next to "Save and Close" and "Save Draft."

### Fix

**File: `src/pages/Index.tsx`**

1. **Remove** the Drafts button from the Hub tab block (lines 1852-1865 area — the `{tab === "hub" && ...}` wrapper containing the Drafts button).

2. **Add** the Drafts button inside the `{tab === "world" && <>...</>}` block (line 1776), between "Save and Close" and "Save Draft" — or to the left of "Save and Close." Insert it as:

```tsx
{tab === "world" && (
  <>
    {draftCount > 0 && (
      <button
        type="button"
        onClick={() => setDraftsModalOpen(true)}
        className="relative inline-flex items-center justify-center h-10 px-5 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:brightness-125 active:brightness-150 transition-all active:scale-95 text-[10px] font-bold leading-none uppercase tracking-wider"
      >
        Drafts
        <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-[16px] rounded-full bg-white/15 text-[9px] font-bold px-1">
          {draftCount}
        </span>
      </button>
    )}
    {/* existing Save and Close button */}
    {/* existing Save Draft button */}
  </>
)}
```

### Files to Change
- `src/pages/Index.tsx` — move Drafts button from Hub section into the World/story-builder header section

