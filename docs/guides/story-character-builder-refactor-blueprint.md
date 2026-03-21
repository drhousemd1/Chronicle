> **INSTRUCTIONS FOR LOVABLE / AI AGENTS**
>
> This document is the canonical blueprint for refactoring Story Builder + Character Builder architecture.
>
> Do not do this refactor as one giant replacement commit. Execute in phases with compatibility wrappers.
>
> Goal: make section ownership obvious, remove hidden coupling, and ensure every visible container has a clear source file.

# Story Builder + Character Builder Refactor Blueprint

## 1. Why this refactor is required

Current behavior is functional, but architecture discoverability is poor:

- Story Builder is implemented under tab key `"world"`, not a file called `StoryBuilderPage`.
- Character Builder is implemented under tab key `"characters"`, not a file called `CharacterBuilderPage`.
- Both are large monolithic files with inline subcomponents:
  - `src/components/chronicle/WorldTab.tsx`
  - `src/components/chronicle/CharactersTab.tsx`
- Multiple lookalike/parallel implementations exist (page vs modal vs chat), so agents often patch the wrong place.
- Several section keys are legacy/inconsistent (e.g., `profile` key displayed as `Basics`).

Result: audits/fixes from external agents frequently miss real owner files.

---

## 2. Refactor objectives

1. **File ownership clarity**
- Every major visible container on Story Builder and Character Builder gets its own source file.

2. **Naming clarity**
- Internal names align with UI labels (`story-builder`, `character-builder`, `basics`, etc.) with a controlled migration path.

3. **Separation of contexts**
- Page components and modal components stop sharing ambiguous names.

4. **Controlled deduplication**
- Shared primitives are extracted only at low-level (row frame, action button shell, tile frame), while context wrappers remain separate.

5. **Safe migration**
- Use compatibility wrappers + alias mapping so ongoing features do not break during migration.

---

## 3. Scope and non-scope

### In scope

- `Index.tsx` tab integration for Story Builder and Character Builder.
- `WorldTab.tsx` decomposition.
- `CharactersTab.tsx` decomposition.
- Shared builder-adjacent utilities that directly affect those pages.
- Naming migration for section keys and tab semantics.

### Out of scope (for this blueprint execution)

- Visual redesign.
- Functional behavior changes (AI logic, DB schema changes, business rules).
- Mobile redesign (app is desktop/tablet target).

---

## 4. Current ownership map (baseline)

### Story Builder (today)

- Entry from tab switch in `src/pages/Index.tsx` with `tab === "world"`.
- Main implementation in:
  - `src/components/chronicle/WorldTab.tsx`
- Inline major containers inside `WorldTab.tsx`:
  - Character roster sidebar
  - Character roster tile component
  - Story Card section
  - World Core section
  - Opening Dialog section
  - Scene Gallery section
  - Custom world section editors

### Character Builder (today)

- Entry from tab switch in `src/pages/Index.tsx` with `tab === "characters"`.
- Main implementation in:
  - `src/components/chronicle/CharactersTab.tsx`
- Inline major containers inside `CharactersTab.tsx`:
  - Sidebar + header tile + trait nav
  - Basics section
  - Physical Appearance section
  - Currently Wearing section
  - Preferred Clothing section
  - Tone, Background, Key Life Events, Relationships, Secrets, Fears
  - Custom sections

### Related parallel implementations causing confusion

- `src/components/chronicle/CharacterEditModal.tsx` (modal-based parallel editor)
- `src/components/chronicle/StoryCardView.tsx` (scenario card in modal context)
- `src/components/chronicle/ChatInterfaceTab.tsx` character tile renderer
- `src/components/chronicle/CharacterEditForm.tsx` (appears legacy/orphan)

---

## 5. Target folder architecture

Create a feature-based structure while preserving temporary compatibility exports.

```text
src/features/
  story-builder/
    StoryBuilderScreen.tsx
    StoryBuilderLayout.tsx
    sidebar/
      StoryRosterSidebar.tsx
      StoryRosterGroup.tsx
      StoryRosterCharacterTile.tsx
      AddCharacterPlaceholderCard.tsx
    sections/
      StoryCardSection.tsx
      WorldCoreSection.tsx
      OpeningDialogSection.tsx
      SceneGallerySection.tsx
      StoryGoalsSection.tsx
      WorldCustomContentSection.tsx
    controls/
      CoverImageActionControls.tsx
      SceneGalleryActionControls.tsx
    hooks/
      useCoverImagePosition.ts
      useRosterTileExpansion.ts
      useStoryBuilderValidation.ts
    utils/
      avatar-position-mapping.ts
      world-core-mappers.ts
    types/
      story-builder.types.ts

  character-builder/
    CharacterBuilderScreen.tsx
    CharacterBuilderLayout.tsx
    sidebar/
      CharacterBuilderSidebar.tsx
      CharacterHeaderTile.tsx
      TraitNavList.tsx
      TraitNavButton.tsx
      TraitProgressRing.tsx
      SidebarActionCard.tsx
    sections/
      BasicsSection.tsx
      PhysicalAppearanceSection.tsx
      CurrentlyWearingSection.tsx
      PreferredClothingSection.tsx
      PersonalitySection.tsx
      ToneSection.tsx
      BackgroundSection.tsx
      KeyLifeEventsSection.tsx
      RelationshipsSection.tsx
      SecretsSection.tsx
      FearsSection.tsx
      CharacterGoalsSection.tsx
      CustomTraitSection.tsx
    rows/
      LockedTraitRow.tsx
      EditableTraitRow.tsx
      AddRowButton.tsx
      CollapsedFieldSummary.tsx
    modals/
      NavButtonImageEditorModal.tsx
    hooks/
      useCharacterAvatarPosition.ts
      useTraitSectionProgress.ts
      useCharacterBuilderEnhance.ts
      useNavButtonImages.ts
    utils/
      character-section-registry.ts
      character-section-progress.ts
    types/
      character-builder.types.ts

  shared-builder/
    components/
      BuilderShellCard.tsx
      BuilderSectionHeader.tsx
      BuilderPanel.tsx
      ImageActionButtonsBase.tsx
      CharacterImageTileBase.tsx
      AutoResizeTextareaField.tsx
    utils/
      image-position.ts
```

---

## 6. Naming standards (mandatory)

### 6.1 Tab naming

Target semantic names:

- `story_builder` (current legacy: `world`)
- `character_builder` (current legacy: `characters`)

Migration strategy:

- Keep legacy keys as aliases first.
- Add mapping utility in one place.

Example:

```ts
const TAB_ALIASES = {
  world: 'story_builder',
  characters: 'character_builder',
} as const;
```

### 6.2 Section key naming

Standardize to visible labels and avoid `profile` ambiguity:

- `basics` (replace internal `profile`)
- `physicalAppearance`
- `currentlyWearing`
- `preferredClothing`
- `personality`
- `tone`
- `background`
- `keyLifeEvents`
- `relationships`
- `secrets`
- `fears`
- `characterGoals`

Add key migration map so old saves/imports still work.

### 6.3 File naming

- File names must reflect exact container purpose.
- No ambiguous "Tab" files for multi-section monoliths.
- Use context prefix when same concept appears in multiple contexts.

Examples:
- `StoryRosterCharacterTile.tsx` (story page context)
- `ChatCharacterTile.tsx` (chat context)
- `ModalCharacterBasicsSection.tsx` (modal context)

---

## 7. Duplicate handling policy

Do **not** force one giant shared component for everything that looks similar.

### Keep separate context wrappers

- Story roster tile
- Chat sidebar tile
- Character header tile

These stay separate wrappers so behavior differences remain explicit.

### Extract only low-level shared primitives

- Image crop/position math
- Base tile frame shell
- Base image action button shell
- Base auto-resize text field primitive

This gives consistency without hidden coupling.

---

## 8. Phased migration plan (safe, chain-aware)

### Phase 0: Baseline + guardrails

- Snapshot branch and baseline tests/build.
- Add temporary architecture map doc (this file).
- Add lint rule/grep check to detect accidental direct edits to legacy monolith files after cutover starts.

Exit criteria:
- Build passes.
- Baseline screenshots captured for Story/Character key views.

### Phase 1: Extract without renaming behavior

- Create new `src/features/story-builder` and `src/features/character-builder` trees.
- Move code by copy/extract from existing files into dedicated section files.
- Keep external API stable by using adapter/wrapper exports.

Compatibility wrappers (temporary):

- `src/components/chronicle/WorldTab.tsx` re-exports/hosts `StoryBuilderScreen`.
- `src/components/chronicle/CharactersTab.tsx` re-exports/hosts `CharacterBuilderScreen`.

Exit criteria:
- No visual behavior change.
- `Index.tsx` still compiles without broad downstream edits.

### Phase 2: Section key normalization

- Introduce canonical section keys (e.g., `basics`).
- Add key alias conversion layer for old data and import/export compatibility.
- Update progress calculators and nav mapping to canonical keys.

Exit criteria:
- Old saves still load.
- New saves write canonical keys.

### Phase 3: Tab semantic normalization

- Introduce semantic tab constants + alias layer.
- Gradually replace direct string checks (`"world"`, `"characters"`) with constants.
- Keep URL/deep-link support for legacy values during transition.

Exit criteria:
- No regressions in navigation/back behavior.
- Legacy tab links still open expected screens.

### Phase 4: Context split for modal/editor duplication

- Move modal-specific UI into `src/features/character-editor-modal` (or `src/features/character-builder/modal`).
- Rename modal section components with `Modal` prefix.
- Ensure Story Builder page sections and modal sections are not accidentally sharing top-level section files.

Exit criteria:
- Editing modal changes cannot inadvertently alter page rendering.

### Phase 5: Shared primitive extraction

- Extract low-level reusable primitives only:
  - image positioning utilities
  - base tile shell
  - base action button shell
  - base row field primitives
- Refactor wrappers to consume primitives.

Exit criteria:
- Duplicate logic reduced.
- Context ownership still explicit.

### Phase 6: Legacy file retirement

- Remove orphan/legacy modules no longer referenced (e.g., `CharacterEditForm.tsx` if confirmed unused).
- Remove deprecated adapters after all imports are migrated.

Exit criteria:
- No dead files for old builder architecture.
- Imports are feature-folder based.

---

## 9. Chain-impact map (what will break if unmanaged)

1. **Index-level integration**
- `Index.tsx` currently owns many handlers and passes dense prop sets.
- Mitigation: introduce page-level controller hooks first; keep prop contracts stable until final phase.

2. **Chat interface dependencies**
- Chat uses its own tile renderer + character edit modal.
- Mitigation: do not point chat to Story/Character page sections directly; use shared primitive only.

3. **Import/export pipelines**
- Story transfer parser and section key mapping can break on key rename.
- Mitigation: add migration maps and backward compatibility transforms.

4. **Supabase adapters**
- Functions tied to nav button images and avatar position persistence can break if key names shift.
- Mitigation: adapter layer with old/new key translation.

5. **Quality Hub references**
- Existing findings reference old file paths.
- Mitigation: maintain old->new path mapping registry and update findings metadata when files move.

---

## 10. Required old → new mapping registry

Maintain and commit a machine-readable mapping file:

- `docs/guides/mappings/story-character-refactor-path-map.json`

Minimum contents:

```json
{
  "src/components/chronicle/WorldTab.tsx": [
    "src/features/story-builder/StoryBuilderScreen.tsx",
    "src/features/story-builder/sidebar/StoryRosterSidebar.tsx",
    "src/features/story-builder/sections/StoryCardSection.tsx",
    "src/features/story-builder/sections/WorldCoreSection.tsx",
    "src/features/story-builder/sections/OpeningDialogSection.tsx",
    "src/features/story-builder/sections/SceneGallerySection.tsx"
  ],
  "src/components/chronicle/CharactersTab.tsx": [
    "src/features/character-builder/CharacterBuilderScreen.tsx",
    "src/features/character-builder/sidebar/CharacterBuilderSidebar.tsx",
    "src/features/character-builder/sections/BasicsSection.tsx",
    "src/features/character-builder/sections/PhysicalAppearanceSection.tsx",
    "src/features/character-builder/sections/CurrentlyWearingSection.tsx",
    "src/features/character-builder/sections/PreferredClothingSection.tsx"
  ]
}
```

This is essential for agent handoff and audit continuity.

---

## 11. Acceptance criteria (done definition)

Architecture is considered successful when all are true:

1. Story Builder and Character Builder no longer rely on giant monolithic files for primary section ownership.
2. Every visible container has exactly one obvious owner file.
3. `profile` ambiguity removed in canonical keys (`basics` used consistently).
4. Legacy aliases exist so old data/links still work during transition.
5. Page context and modal context are split with explicit naming.
6. Shared primitives are low-level only; no hidden cross-context behavior coupling.
7. Path mapping file is complete and current.
8. External agent can find section owner by filename in one pass.

---

## 12. Suggested execution order (work packets)

### Packet A (low-risk extraction)

- Extract Story Builder sidebar + each major section into dedicated files.
- Keep wrapper in `WorldTab.tsx`.

### Packet B (Character extraction)

- Extract Character sidebar + each hardcoded section into dedicated files.
- Keep wrapper in `CharactersTab.tsx`.

### Packet C (naming normalization)

- Add key aliases and canonical names.
- Update all nav/progress/import references.

### Packet D (modal separation)

- Pull modal-specific sections into dedicated modal namespace.

### Packet E (shared primitives + cleanup)

- Extract low-level shared building blocks.
- Remove confirmed dead files.

---

## 13. Immediate next step to start implementation

Start with **Packet A** and **Packet B** only, with strict “no behavior changes” policy.

Implementation rule for first pass:

- Move code into feature files.
- Keep all props and state behavior identical.
- Keep old entry files as wrappers.
- Do not rename keys yet.

This gives immediate architecture clarity while minimizing regression risk.
