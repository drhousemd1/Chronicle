

## Fix: Sequential GitHub Sync to Prevent 409 Conflicts

### Problem
The "Sync All" button fires all GitHub sync requests in parallel. The GitHub Contents API commits sequentially -- each commit changes the repo HEAD, so concurrent requests see a stale SHA and fail with `409 Conflict`. Only the first 1-2 documents succeed.

### Solution
Change the edge function invocations from parallel (fire-and-forget) to sequential (await each before starting the next).

### Changes

**`src/components/admin/guide/AppGuideTool.tsx`**
- Replace the fire-and-forget loop in `syncAllFn` with a sequential `for...of` loop that `await`s each `syncToGitHub` call
- Change `syncToGitHub` to return a Promise (currently it's fire-and-forget with `.then()`) so it can be awaited
- Add a new `syncToGitHubAsync` helper (or refactor the existing one) that returns the Promise directly instead of using `.then()`

### Technical Detail

Current code (parallel, broken):
```typescript
for (const doc of data) {
  syncToGitHub('upsert', doc.title, doc.markdown || '');
}
```

Fixed code (sequential):
```typescript
for (const doc of data) {
  await syncToGitHubAsync('upsert', doc.title, doc.markdown || '');
}
```

The existing `syncToGitHub` fire-and-forget helper will remain for single-document saves. A new awaitable version will be used by the bulk sync path.

