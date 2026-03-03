

# Fix Test A: Editable Fields + Correct Styling

## Problem
1. Value fields are static `<span>` elements -- need to be editable `<input>` elements for testing
2. Styling uses hardcoded zinc colors instead of the shadcn tokens from your provided code (`border-input`, `dark:bg-input/30`, `text-muted-foreground`)
3. Default values should use the simpler placeholder text you provided

## Changes

**File:** `src/components/chronicle/CharactersTab.tsx` (lines 1191-1235)

### 1. Add local state for editable fields
Add a `useState` hook holding the 11 field values so typing updates them in real time. Initialized with your provided defaults:

```text
Hair Color -> "Brunette, Blonde, Black"
Eye Color -> "Blue, Brown, Green"
Build -> "Athletic, Slim, Curvy"
...etc
```

### 2. Replace static spans with input elements
Each value field becomes an `<input>` wired to the local state, so you can type freely to test the look.

### 3. Apply exact styling from your code

| Element | Classes (matching your code) |
|---------|------------------------------|
| Label cell | `rounded-md border border-input dark:bg-input/30 px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em]` |
| Sparkles icon | `text-muted-foreground` |
| Value input | `rounded-md border border-input dark:bg-input/30 bg-transparent h-9 w-full min-w-0 px-3 py-1 text-base text-muted-foreground shadow-xs` |
| Lock button | `text-muted-foreground` |
| Row container | `space-y-3` gap between rows |

### 4. Keep container hardcoded
The outer card shell, header, title, and "Add Row" button remain static (not wired to anything) -- only the text values are editable.

