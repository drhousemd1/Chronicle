

# Fix Public Profile Page Width (The Real Fix)

## What Went Wrong Last Time

The previous change edited `PublicProfileTab.tsx`, but the width constraint was never there -- it's in `src/pages/Index.tsx` at line 1924, where the entire account tab content is wrapped in `<div className="max-w-4xl mx-auto">`. That's the actual bottleneck squishing the avatar buttons and profile layout. The earlier edit did nothing because it targeted the wrong file.

## The Fix

**File: `src/pages/Index.tsx` (line 1924)**

Remove `max-w-4xl mx-auto` from the wrapper div that contains all account sub-tabs. The tab pill bar already centers itself, so removing the max-width won't break its alignment -- it will just let the content (Public Profile, Account Settings, Subscription) use the full available width.

Change:
```
<div className="max-w-4xl mx-auto">
```
To:
```
<div>
```

This is the single line that's been causing the layout to not fill the page. The Account Settings and Subscription tabs will also benefit from the extra space, and the tab pill bar will remain centered since it uses `justify-center` on its own flex container.

## Revert the no-op change

Also revert the unnecessary change previously made to `PublicProfileTab.tsx` -- that file never had `max-w-4xl` on it, but if the previous edit introduced any unintended changes, we will verify the file is clean. (Looking at it now, the file is fine -- the only change was removing a class that wasn't there to begin with in the current code, so no revert needed.)

