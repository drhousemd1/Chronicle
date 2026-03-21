
## Fix the API Inspector so every AI Enhance page shows the full exact request, not just the field-specific fragment

### What’s wrong now
The inspector is incomplete in exactly the way you described:

- The per-section pages like Preferred Clothing only show the field label/instruction/max-sentence config.
- The shared overview page shows the generic template, but the individual API-call pages do **not** repeat the rest of what is actually sent.
- That means each page is omitting a large part of the real request:
  - exact system message
  - full `messages` payload shape
  - full `WORLD & SCENARIO CONTEXT` assembly
  - full `THIS CHARACTER'S EXISTING DATA` assembly
  - `CURRENT VALUE` branching
  - generate-both section guidance
  - model fallback behavior
  - response parsing/cleanup

So the inspector is currently not accurate enough for debugging.

## Plan

### 1. Make each AI Enhance page self-contained
For every Character Builder and Story Builder AI Enhance section, replace the current “instruction-only” block with a **full exact payload block** that includes everything that is part of that call.

Each section page will show, verbatim:

- exact system message
- exact request body structure
- exact user prompt template for:
  - detailed mode
  - precise mode
  - generate-both mode where applicable
- exact field label / instruction / max sentence values for that section
- exact resolver mapping for that section’s field keys
- exact model fallback order
- exact response post-processing for that mode

No more “uses shared template from Overview page” shortcuts.

### 2. Inline the full shared context builders inside every relevant page
For every Character Builder AI Enhance page, include the exact content assembly for:

- `buildFullContext(appData, targetCharacterId)`
- `buildCharacterSelfContext(character)`

That means the page will explicitly show the real ordered/conditional pieces that can be included, such as:

- scenario name / description / premise
- structured locations / legacy locations
- factions / tone themes / plot hooks / history / dialog formatting
- content themes
- custom world sections
- story goals
- other character summaries
- current character basics
- physical appearance
- currently wearing
- preferred clothing
- background
- personality
- extras-only sections
- goals
- custom sections

These should be shown as the exact assembly logic, not summarized prose.

### 3. Inline the full world-field context builders inside every Story Builder page
For Story Builder AI Enhance pages, include the exact `buildPrompt()` assembly:

- `CONTEXT FROM OTHER FIELDS`
- `CURRENT VALUE` vs empty-state branch
- exact field label/instruction/max sentence data
- exact system message
- exact request body with `stream: false`
- exact cleanup logic for precise mode

### 4. Keep the overview page, but downgrade it to summary only
The overview page can stay as a shared reference, but it should no longer be the only place where the omitted payload pieces live.

Every individual API-call page must be independently accurate.

### 5. Refactor the inspector content so it cannot omit shared payload text again
Inside `public/api-call-inspector-chronicle.html`, centralize the repeated exact strings used by the inspector pages:

- system messages
- detailed/precise/generate-both templates
- shared context-builder blocks
- fallback/request-body block
- response parsing block

Then render those into each page instead of hand-writing partial summaries page by page.

This keeps the inspector consistent and prevents drift.

## Exact scope
### File to update
- `public/api-call-inspector-chronicle.html`

## What each page should contain after this change
For example, **Preferred Clothing — AI Enhance** should show all of this on the same page:

1. exact `messages` payload shape  
2. exact system message  
3. exact detailed-mode prompt template  
4. exact precise-mode prompt template  
5. exact generate-both template for `preferredClothingExtra`  
6. exact `WORLD & SCENARIO CONTEXT` builder contents  
7. exact `THIS CHARACTER'S EXISTING DATA` builder contents  
8. exact current-value branching  
9. exact field-specific label/instruction/max-sentences for `casual`, `work`, `sleep`, `preferredClothingExtra`  
10. exact resolver mapping (`extra_pc_* → preferredClothingExtra`)  
11. exact fallback model order  
12. exact post-response cleanup/parsing rules

That same completeness standard should be applied to every other AI Enhance page.

## Verification
After implementation, I would verify page-by-page that the inspector now matches source code exactly and that no block relies on a separate page for missing payload pieces:

- Preferred Clothing
- Background
- Personality
- Tone
- Relationships
- Secrets
- Fears
- Key Life Events
- Story Builder pages

The success condition is simple: if you open any single AI Enhance page in the inspector, you can see the complete exact request construction for that API call without needing to cross-reference another page.