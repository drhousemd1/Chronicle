

# Change Container Header Font Weight from 700 to 600

Replace `font-bold` (700) with `font-semibold` (600) on all container header `<h2>` elements across the Story Builder and Character Builder pages. The Story Card header already uses `font-semibold` — this makes everything else match.

## Files and Changes

### 1. `src/components/chronicle/WorldTab.tsx` — 6 headers
Change `font-bold` → `font-semibold` on the `<h2>` elements for:
- **World Core** (line 641)
- **Opening Dialog** (line 891)
- **Scene Gallery** (line 1075)
- **Art Style Preference** (line 1203)
- **World Codex** (line 1263)
- **Share Your Story** (line 1342)

### 2. `src/components/chronicle/StoryGoalsSection.tsx` — 1 header
- **Story Arcs** (line 297)

### 3. `src/components/chronicle/ContentThemesSection.tsx` — 1 header
- **Content Themes** (line 311)

### 4. `src/components/chronicle/CharactersTab.tsx` — 3 locations
- **Reusable `SectionCard` component** header (line 73) — this controls: Physical Appearance, Currently Wearing, Preferred Clothing, Tone, Background, Key Life Events, Relationships, Secrets, Fears, and all extras-only sections
- **Avatar** section header (line 670)
- **Custom section title input** (line 1213) — the editable title field for user-created sections

### 5. `src/components/chronicle/PersonalitySection.tsx` — 1 header
- **Personality** (line 267)

### 6. `src/components/chronicle/CharacterGoalsSection.tsx` — 1 header
- **Goals and Desires** (line 209)

**Total**: 13 `font-bold` → `font-semibold` replacements across 6 files. No other properties changed.

