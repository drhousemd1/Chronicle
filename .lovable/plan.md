
Goal: fix the Quality Hub so it reflects the real app structure you listed, and stop stale persisted data from hiding newer page coverage.

What I found

1. Your app absolutely does include the pages you called out
- Community Gallery: `tab === "gallery"` in `src/pages/Index.tsx`
- My Stories / Your Stories: `tab === "hub"`
- Character Library: `tab === "library"`
- Image Library: `tab === "image_library"`
- Chat History: `tab === "conversations"`
- Story Builder: `tab === "world"` and `tab === "characters"` as a builder flow
- Admin: `tab === "admin"`
- Plus other real surfaces already in the app:
  - Chat Interface: `tab === "chat_interface"`
  - Account: `tab === "account"`
  - Creator Profile: `/creator/:userId`
  - Quality Hub: `/style-guide/ui-audit`
  - API Inspector: `/style-guide/api-inspector`

2. The reason only a few pages are showing is not that the seed is missing
- `src/data/ui-audit-findings.ts` already contains 12 `reviewUnits`
- But the persisted backend row currently has only 4 review units
- I confirmed that with the database:
  - latest `quality_hub_registries.registry.reviewUnits` count = 4
- So the UI is loading stale saved data and overriding the newer seeded list

3. The current “App Pages” inventory is still not modeled the way you want
Right now it’s a mixed audit-unit list, not a strict “every page/surface in the app” inventory. That’s why it feels wrong.

Implementation plan

1. Replace the current review-unit seed with a true app-page inventory
Update `src/data/ui-audit-findings.ts` so the App Pages section is explicitly built around the actual app surfaces, starting with the ones you named:

Core app pages/surfaces to include
- Community Gallery
- Your Stories
- Character Library
- Image Library
- Chat History
- Story Builder
- Character Builder
- Chat Interface
- Admin
- Account
- Creator Profile
- Quality Hub
- API Inspector

For each item I’ll keep:
- name
- route/tab
- primary files
- status
- notes
- lastRunId when applicable

Naming changes
- Rename “My Stories” to “Your Stories” if you want the UI label to match your wording
- Keep Story Builder and Character Builder as separate entries rather than collapsing them

2. Add a schema/version invalidation so stale saved registries cannot override new structure
Current issue:
- staleness check only looks at `lastRunId`
- saved data can still be structurally outdated while having the same run id

Fix:
- add a dedicated registry structure version in the Quality Hub meta
- compare saved registry version against code seed version
- if mismatch, discard persisted reviewUnits/findings seed and load fresh data

Files to update
- `src/lib/ui-audit-schema.ts`
- `src/data/ui-audit-findings.ts`
- `src/pages/style-guide/ui-audit.tsx`

3. Add merge logic so saved user edits survive while seeded app pages expand
Instead of simply replacing everything, I’ll make the load path smarter:
- load persisted registry
- if persisted version is older, merge in missing seeded app pages by `id`
- preserve any user-edited statuses/notes for ids that still exist
- preserve findings/runs where safe
- upgrade old registries forward automatically

This is better than a blunt reset because it prevents data loss while still fixing missing pages.

4. Add timestamps under completed page/module badges
You asked for timestamps under completed badges.
I’ll add that in both places where it matters:
- Scan Modules
- App Pages

Behavior
- if item has `status === "completed"` and a `lastRunId`
- resolve the matching run from `registry.runs`
- show `finishedAt` under the badge
- if no run exists, no timestamp is shown

5. Make the App Pages panel easier to verify visually
To avoid this happening again, I’ll also improve the App Pages card so each entry clearly shows:
- page name
- route/tab
- status badge
- completed date when present
- key files and notes

Optional but recommended:
- sort app pages in a predictable product order matching the sidebar/navigation

Concrete page inventory I will seed

```text
1. Community Gallery     -> / (gallery tab)
2. Your Stories          -> / (hub tab)
3. Character Library     -> / (library tab)
4. Image Library         -> / (image_library tab)
5. Chat History          -> / (conversations tab)
6. Story Builder         -> / (world tab)
7. Character Builder     -> / (characters tab)
8. Chat Interface        -> / (chat_interface tab)
9. Admin                 -> / (admin tab)
10. Account              -> / (account tab)
11. Creator Profile      -> /creator/:userId
12. Quality Hub          -> /style-guide/ui-audit
13. API Inspector        -> /style-guide/api-inspector
```

Technical details

Files to change
- `src/data/ui-audit-findings.ts`
  - replace current review unit list with the full app page inventory above
  - bump registry structure version
- `src/lib/ui-audit-schema.ts`
  - add a `registryVersion` or similar meta field
- `src/pages/style-guide/ui-audit.tsx`
  - upgrade stale saved registries
  - merge missing seeded app pages into saved registries
  - show timestamps under completed badges in App Pages as well as Scan Modules

Data/persistence impact
- keep backend persistence
- continue using local cache as a convenience layer
- make backend/cache upgrade-safe so old saved rows stop suppressing new seeded structure

Why this fixes your exact complaint
- it stops showing the old 4-page saved registry
- it explicitly models the real app pages you listed
- it separates Story Builder and Character Builder
- it adds timestamps to completed badges
- it prevents future seed updates from being hidden by stale persisted state
