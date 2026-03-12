

# Fix Reposition & Remove Button Styles

## Problem
The cover image **Reposition** button (line 603-612 in `WorldTab.tsx`) uses a custom `bg-zinc-700` style that looks strange — it should match the standard Shadow Surface button spec. The **Remove** button (line 613-618) is near-invisible faint rose text — it should look like the standard destructive DELETE button.

## Changes

**File**: `src/components/chronicle/WorldTab.tsx`

### 1. Reposition button (lines 605-609)
Replace the custom inline styles with the standard Shadow Surface button spec:

**From:**
```
bg-zinc-700 text-zinc-200 hover:bg-zinc-600 border border-zinc-600
```

**To:**
```
bg-[hsl(240_6%_18%)] border-[hsl(0_0%_100%_/_0.10)] text-[hsl(var(--ui-text))] hover:bg-[hsl(240_6%_22%)] shadow-[0_10px_30px_hsl(0_0%_0%_/_0.35)] uppercase tracking-wider
```

### 2. Remove button (lines 613-618)
Replace the faint rose text-only style with the standard destructive button:

**From:**
```
text-rose-400 hover:text-rose-300 hover:bg-rose-500/10
```

**To:**
```
bg-[hsl(var(--destructive))] hover:brightness-110 text-[hsl(var(--destructive-foreground))] border-0 shadow-[0_10px_30px_hsl(0_0%_0%_/_0.35)] uppercase tracking-wider
```

Both buttons keep existing `h-10 px-5 rounded-xl text-[10px] font-bold` sizing.

