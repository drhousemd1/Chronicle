

# Shared Elements / Architecture -- Guide Content

## What This Does
Write the full markdown documentation for the "Shared Elements/Architecture (Structure Guide)" document (ID: `0436c716-da55-4b89-8fe4-8ce775f77412`). This is a cross-reference map showing where components, patterns, and UI elements appear across multiple pages/locations, designed as an at-a-glance guide for identifying all locations that need modification when a shared element changes.

## Structure

The document uses a hybrid approach:

1. **Quick-Reference Index Table** -- scannable summary with Element Name, Canonical Owner, Location Count, Usage Kind breakdown, and Risk Level (Low/Med/High based on duplication)
2. **Per-Element Sections** -- each shared element gets its own section with:
   - A mini usage table (File Path, Page/Context, Usage Kind, Notes)
   - Propagation rule: "When changing X, also update Y"
3. **Usage Kind Classification** -- controlled vocabulary:
   - **Imported**: true shared component, change once
   - **Duplicated**: copy-paste implementation, must change in each location independently
   - **Forked**: intentionally diverged variant, review but may not need matching changes

## Elements to Document (based on code review)

### High-Risk (Duplicated across multiple files)

- **AutoResizeTextarea** -- duplicated in 9 files (CharactersTab, PersonalitySection, StoryGoalsSection, WorldTab, CharacterEditModal, ScenarioCardView, ArcBranchLane, ArcPhaseCard, and more). Same implementation copy-pasted. Risk: High.
- **CollapsibleSection** -- duplicated in CharacterEditModal and ScenarioCardView. Same pattern, independently defined. Risk: Medium.
- **HardcodedRow / ExtraRow pattern** -- duplicated between CharactersTab (full-page editor) and CharacterEditModal (popup editor). Both implement the same row layout with label + sparkle + value + lock/delete. Risk: High.

### Medium-Risk (Imported but used in many contexts)

- **ImageLibraryPickerModal** -- single component imported into 6 locations: AvatarActionButtons, CoverImageActionButtons, SceneGalleryActionButtons, BackgroundPickerModal, SidebarThemeModal, UploadSourceMenu. Risk: Medium.
- **AvatarActionButtons** -- imported into 3 locations: CharactersTab, CharacterEditModal, PublicProfileTab. Risk: Medium.
- **AvatarGenerationModal** -- imported into 2 locations: CharactersTab, PublicProfileTab. Risk: Low-Medium.
- **GuidanceStrengthSlider** -- imported into 3 locations: CharacterGoalsSection, StoryGoalsSection, ArcPhaseCard. Risk: Medium.
- **PersonalitySection** -- imported into 2 locations: CharactersTab (full-page), CharacterEditModal (popup). Risk: Medium.
- **CharacterGoalsSection** -- imported into 2 locations: CharactersTab (full-page), CharacterEditModal (popup). Risk: Medium.
- **StoryGoalsSection** -- imported into 3 locations: WorldTab, CharacterEditModal (Scenario Card view), ScenarioCardView. Risk: Medium.
- **DeleteConfirmDialog** -- imported into 3 locations: Index.tsx (character deletion), ImageLibraryTab, ReviewModal. Risk: Low.
- **AIPromptModal** -- imported into 1 location (Index.tsx) but serves both AI Fill and AI Generate flows. Risk: Low.

### Cross-Page Character Editing System

- **Character editing fields** -- the full set of character trait sections (Physical Appearance, Currently Wearing, Preferred Clothing, Personality, Tone, Background, Key Life Events, Relationships, Secrets, Fears, Goals, Custom Sections) exists in two parallel implementations:
  - CharactersTab.tsx (full-page Character Builder)
  - CharacterEditModal.tsx (popup modal in Chat Interface)
  - Any new field added to one MUST be added to the other
  - Propagation rule covers field definitions, AI enhancement integration, and styling

### Shared Services / Backend Logic

- **character-ai.ts** -- `buildFullContext()` and `buildCharacterSelfContext()` used by both per-field sparkle enhancement and AI Fill/Generate flows. Single canonical source.
- **world-ai.ts** -- `aiEnhanceWorldField()` used by WorldTab and potentially ScenarioCardView.
- **llm.ts** -- character/world injection logic. Single canonical source but any new character field must be added to the injection mapping.

### UI Primitives from chronicle/UI.tsx

- **Button** (from UI.tsx) -- imported into CharactersTab, ChatInterfaceTab, PublicProfileTab, and other chronicle components. Distinct from `@/components/ui/button` (shadcn).
- **TextArea** (from UI.tsx) -- imported into CharactersTab, ChatInterfaceTab. Distinct from `@/components/ui/textarea` (shadcn).

### Arc System Components

- **ArcModeToggle, ArcBranchLane, ArcConnectors, ArcPhaseCard, ArcFlowConnector** -- imported by StoryGoalsSection and self-referencing (ArcPhaseCard uses ArcBranchLane, ArcModeToggle, ArcConnectors). Properly shared via imports. Risk: Low.

## Implementation
Single database update to write the markdown content to `guide_documents` row `0436c716-da55-4b89-8fe4-8ce775f77412`. No code file changes needed.

