

# Hide Drafts from "My Stories", Keep in "Drafts" & "All"

**File**: `src/pages/Index.tsx`, line 377

Change the `"my"` case to exclude drafts:

```tsx
case "my":
  return registry.filter(s => !s.isDraft);
```

The `"all"` and `"drafts"` cases remain unchanged.

