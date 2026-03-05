

## Plan: Update App Guide Documents for Publish Validation System

The scenario builder guide (`docs/guides/scenario-builder-page-structure-guide.md`) has **no documentation** about the publish validation system — no mention of `validateForPublish`, `publishErrors`, live re-validation, field-level error styling, or the validation rules. This needs a substantial update.

---

### Changes to `docs/guides/scenario-builder-page-structure-guide.md`

#### 1. Section 3 (UI Elements) — Add Publish Validation Error States

Add a new subsection after the existing UI elements table documenting the validation error styling system:

- **Error input styling**: `border-red-500 ring-2 ring-red-500` applied to invalid fields (Story Name, Story Premise, Brief Description, Opening Dialog, Story Arc Title, Desired Outcome)
- **Error text**: `text-sm text-red-500 font-medium mt-1` below each invalid field
- **Error label styling**: Labels turn `text-red-500` when their field is invalid
- **Cover image error**: Red border/ring on the cover preview container + error text
- **Section-level error**: `border-red-500` on section containers (Story Arcs, Locations, Content Themes)
- **Bottom summary panel**: Lists all current validation errors with `data-publish-error` auto-scroll targeting

#### 2. Section 6 (Data Architecture) — Add Publish Validation Subsection

Document the validation data flow:

- **Validation source file**: `src/utils/publish-validation.ts`
- **Function**: `validateForPublish()` — accepts `{ scenarioTitle, world, characters, openingDialog, contentThemes, coverImage }`, returns `PublishValidationErrors`
- **Validation rules table**: All 11 checks (story title, story premise, opening dialog, 5+ tags, SFW/NSFW, 1+ character, character names, NSFW age 18+, 1+ location, 1+ story arc, cover image, brief description)
- **Live re-validation**: `useEffect` in `WorldTab.tsx` watches all validated inputs; when `publishErrors` is non-empty, re-runs `validateForPublish` on every state change so errors clear/update in real-time as the user types or selects
- **Error state type**: `PublishValidationErrors` interface with all fields
- **`hasError` prop propagation**: `StoryGoalsSection` and `ContentThemesSection` receive `hasError` boolean prop for field-level highlighting

#### 3. Section 8 (Custom Events/Callbacks) — Add validation-related callbacks

Add the publish validation trigger and the `hasError` prop pattern passed to child components.

#### 4. Section 12 (Known Issues) — Update

- Mark the "floating error text" and "stuck error states" bugs as **RESOLVED** with today's date
- Note the live re-validation fix

#### 5. Section 7 (Component Tree) — Minor update

Add `publish-validation.ts` as a utility dependency of `WorldTab.tsx` in the tree.

---

### Changes to `docs/guides/shared-elements-architecture-structure-guide.md`

No changes needed — the validation system is not a shared element (it's specific to WorldTab/publish flow).

---

### Summary

One file changed: `scenario-builder-page-structure-guide.md`. Adds ~60-80 lines documenting the complete publish validation system including all 11+ rules, error styling patterns, live re-validation behavior, and the `PublishValidationErrors` data type.

