

# Revamp Drafts: localStorage to Database-Backed System

Your wife is right -- the current draft system has real UX and data-loss risks. Your proposed solution is solid. Here's the plan.

## How It Works Today (Problems)

- **Save Draft** serializes the entire story to `localStorage` under `draft_{id}` keys
- A separate `draft_registry` key tracks the list of drafts
- A modal (`DraftsModal`) lists drafts from localStorage for loading
- **Save and Close** runs full validation (title, characters, premise, tags, cover, etc.) before saving to the database
- Drafts live entirely outside the database -- incognito mode, clearing history, or switching browsers = data lost

## Proposed New Flow

**Save Draft** will save directly to the `stories` table in the database with an `is_draft = true` flag. No validation required -- save whatever the user has, even if incomplete. The story appears on the My Stories page with a "Draft" badge (same style as "Published" badge but amber/yellow). Draft cards show only **Edit** and **Delete** on hover (no Play button). Clicking Edit loads the story builder with all fields pre-populated.

**Save and Close** stays the same -- runs validation, saves with `is_draft = false`, and navigates to hub.

## Changes

### 1. Database Migration
- Add `is_draft boolean NOT NULL DEFAULT false` column to the `stories` table
- No RLS changes needed -- existing policies already scope to `user_id = auth.uid()`

### 2. Backend Service (`src/services/supabase-data.ts`)
- Update `saveScenario()` to accept an optional `isDraft` parameter that sets `is_draft` on the upsert
- When saving as draft: skip validation, save with `is_draft: true`
- When saving via "Save and Close": save with `is_draft: false` (current behavior)
- Update `fetchMyScenarios` / `fetchMyScenariosPaginated` to include the `is_draft` field in the returned `ScenarioMetadata`

### 3. Types (`src/types.ts`)
- Add `isDraft?: boolean` to `ScenarioMetadata`

### 4. Hub Filter Pills (`src/pages/Index.tsx`)
- Add `"drafts"` to the `HubFilter` type: `"my" | "bookmarked" | "published" | "drafts" | "all"`
- Add a "Drafts" pill button between "Published" and "All"
- Update `filteredRegistry` to filter by `isDraft === true` for the drafts filter
- The "My Stories" filter excludes drafts; "All" includes them; "Drafts" shows only drafts

### 5. Story Card (`src/components/chronicle/StoryHub.tsx`)
- Add `isDraft` prop to `ScenarioCard`
- Show amber "Draft" badge in top-left corner (same position/style as "Published" badge)
- When `isDraft` is true: hide the **Play** button from hover actions, show only **Edit** and **Delete**
- Pass `isDraft` through from `ScenarioHub` to each card

### 6. Save Draft Button (`src/pages/Index.tsx`)
- Replace the current localStorage-based Save Draft handler with a database save:
  - Call `saveScenario()` with `isDraft: true` (no validation gate)
  - On success, refresh the registry and show "Draft Saved!" feedback
- Remove the **Drafts** button from the story builder header (the one that opens `DraftsModal`)
- Remove the `DraftsModal` component render and all `draftCount` / `refreshDraftCount` / `draftsModalOpen` state

### 7. Detail Modal (`src/components/chronicle/StoryDetailModal.tsx`)
- When viewing a draft story detail, hide the Play button

### 8. Cleanup
- `DraftsModal.tsx` can be deleted entirely (or kept but unused for now)
- Remove `getDraftRegistry`, `upsertDraftRegistry`, `removeDraftFromRegistry` imports from `Index.tsx`
- Remove localStorage draft scanning logic in `refreshDraftCount`

## What Stays the Same
- "Save and Close" validation logic is unchanged
- Published badge, published data, bookmarked stories -- all unchanged
- Story builder edit flow is unchanged (clicking Edit on a draft opens it the same way)

## Concern Check
One thing to flag: currently when a user creates a brand new story and clicks "Save Draft," the story gets a new UUID but hasn't been saved to the DB yet. With the new system, **Save Draft will create a real DB row** immediately. This is actually better -- it means the story exists in the backend from the first save. When they later complete validation and click "Save and Close," it flips `is_draft` to `false` on the same row.

