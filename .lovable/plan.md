

# Always Show Stats Row on All Story Cards

## Problem
Cards without published data skip the stats row entirely, causing "Written by:" to shift up and create inconsistent vertical alignment across cards. The screenshot shows cards like "test2", "James's Story", and "Blackwood Institute" missing their counter rows.

## Solution
Always render the stats row on every card -- when there is no `publishedData`, show all counters as 0. This keeps every card's layout identical: Title, Description (fixed height), Stats, Written by.

## Technical Details

### File: `src/components/chronicle/ScenarioHub.tsx` (lines 110-128)

Remove the `{publishedData && (` conditional wrapper so the stats row always renders. Use optional chaining with fallback to 0 for the counts:

```tsx
// Before
{publishedData && (
  <div className="flex items-center gap-3 text-[10px] text-white/50 mt-1">
    ...{publishedData.view_count}...
  </div>
)}

// After
<div className="flex items-center gap-3 text-[10px] text-white/50 mt-1">
  <span>Eye {publishedData?.view_count ?? 0}</span>
  <span>Heart {publishedData?.like_count ?? 0}</span>
  <span>Bookmark {publishedData?.save_count ?? 0}</span>
  <span>Play {publishedData?.play_count ?? 0}</span>
</div>
```

This ensures all cards -- published, unpublished, and saved/bookmarked -- have the same 4-row layout and consistent vertical alignment.

## Files Modified
| File | Change |
|---|---|
| `src/components/chronicle/ScenarioHub.tsx` | Remove conditional on stats row, default counts to 0 |

