

# Fix: Stop Published Stories from Appearing in Other Users' "My Stories"

## Problem Identified

After the RLS policy change, the `fetchScenarios()` function returns **all scenarios visible to the user** instead of **only their own scenarios**. This causes published scenarios from other users to incorrectly appear in the "Your Stories" tab.

The root cause:
```typescript
// Current code - NO user_id filter
export async function fetchScenarios(): Promise<ScenarioMetadata[]> {
  const { data, error } = await supabase
    .from('scenarios')
    .select('...')
    .order('updated_at', { ascending: false });
  // Returns ALL scenarios the user can see (own + published)
}
```

---

## Solution

Add an explicit `user_id` filter to ensure only the authenticated user's own scenarios are returned:

```typescript
export async function fetchMyScenarios(userId: string): Promise<ScenarioMetadata[]> {
  const { data, error } = await supabase
    .from('scenarios')
    .select('id, title, description, cover_image_url, cover_image_position, tags, created_at, updated_at')
    .eq('user_id', userId)  // Only fetch MY scenarios
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(dbToScenarioMetadata);
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/services/supabase-data.ts` | Rename `fetchScenarios` to `fetchMyScenarios(userId)` and add `.eq('user_id', userId)` filter |
| `src/pages/Index.tsx` | Update the call to pass `user.id` to the new function |

---

## Technical Changes

### 1. supabase-data.ts (line ~220)

Replace the current function:

```typescript
export async function fetchMyScenarios(userId: string): Promise<ScenarioMetadata[]> {
  const { data, error } = await supabase
    .from('scenarios')
    .select('id, title, description, cover_image_url, cover_image_position, tags, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(dbToScenarioMetadata);
}
```

### 2. Index.tsx (line ~163)

Update the data loading:

```typescript
const [scenarios, characters, ...] = await Promise.all([
  supabaseData.fetchMyScenarios(user.id),  // Changed from fetchScenarios()
  supabaseData.fetchCharacterLibrary(),
  // ...rest
]);
```

---

## Security Confirmation

- RLS policy remains unchanged - it correctly allows viewing published scenarios (needed for Community Gallery)
- The client-side filter ensures "My Stories" only shows owned content
- This is defense-in-depth: RLS controls what CAN be accessed, client code controls what IS requested

---

## Result

After this fix:
- "Your Stories" tab will ONLY show scenarios you created
- Published scenarios from others will ONLY appear in the Community Gallery
- Bookmarked scenarios will only appear after explicit user action
- No data will "bleed" between accounts

