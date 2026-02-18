

# Additional Fixes: Clean Up Placeholder Text Across the App

These two small fixes will be bundled into the sexual orientation plan implementation.

## 1. Change Nicknames placeholder to "Nicknames"

Currently says `"e.g., Mom, Mother (comma-separated)"` in three files. Change to just `"Nicknames"`.

## 2. Remove "e.g.," from ALL placeholder text in UI components

Strip the `"e.g., "` prefix from every placeholder, keeping just the example values. This applies across 6 files with UI-facing placeholders (edge function prompts are left unchanged since those are AI instructions, not user-facing ghost text).

### Placeholder changes by file

**CharactersTab.tsx** (Scenario Builder character card):
| Field | Before | After |
|---|---|---|
| Nicknames | `e.g., Mom, Mother (comma-separated)` | `Nicknames` |
| Age | `e.g., 25` | `25` |
| Sex / Identity | `e.g., Female, Male, Non-binary` | `Female, Male, Non-binary` |
| Current Mood | `e.g., Happy, Tired` | `Happy, Tired` |
| Hair Color | `e.g., Brunette, Blonde, Black` | `Brunette, Blonde, Black` |
| Eye Color | `e.g., Blue, Brown, Green` | `Blue, Brown, Green` |
| Build | `e.g., Athletic, Slim, Curvy` | `Athletic, Slim, Curvy` |
| Body Hair | `e.g., Smooth, Light, Natural` | `Smooth, Light, Natural` |
| Height | `e.g., 5 foot 8` | `5 foot 8` |
| Breast Size | `e.g., C-cup / N/A` | `C-cup / N/A` |
| Genitalia | `e.g., Male, Female / N/A` | `Male, Female / N/A` |
| Skin Tone | `e.g., Fair, Olive, Dark` | `Fair, Olive, Dark` |
| Makeup | `e.g., Light, Heavy, None` | `Light, Heavy, None` |
| Shirt/Top | `e.g., White blouse, T-shirt` | `White blouse, T-shirt` |
| Pants/Bottoms | `e.g., Jeans, Skirt, Shorts` | `Jeans, Skirt, Shorts` |
| Casual | `e.g., Jeans and t-shirts` | `Jeans and t-shirts` |
| Work | `e.g., Business casual, Uniform` | `Business casual, Uniform` |
| Sleep | `e.g., Pajamas, Nightgown` | `Pajamas, Nightgown` |
| Undergarments (pref) | `e.g., Cotton basics, Lace` | `Cotton basics, Lace` |
| Job / Occupation | `e.g., Software Engineer, Teacher` | `Software Engineer, Teacher` |
| Education Level | `e.g., Bachelor's, High School` | `Bachelor's, High School` |
| Residence | `e.g., Downtown apartment, Suburban house` | `Downtown apartment, Suburban house` |
| Hobbies | `e.g., Reading, Hiking, Gaming` | `Reading, Hiking, Gaming` |
| Financial Status | `e.g., Middle class, Wealthy` | `Middle class, Wealthy` |

**CharacterEditModal.tsx** (full edit modal):
| Field | Before | After |
|---|---|---|
| Nicknames | `e.g., Mom, Mother (comma-separated)` | `Nicknames` |
| Age | `e.g., 25` | `25` |
| Sex / Identity | `e.g., Female` | `Female` |
| Current Mood | `e.g., Happy` | `Happy` |
| Hair Color | `e.g., Brown` | `Brown` |
| Eye Color | `e.g., Blue` | `Blue` |
| Build | `e.g., Athletic` | `Athletic` |
| Body Hair | `e.g., Light` | `Light` |
| Height | `e.g., 5ft 8in` | `5ft 8in` |
| Breast Size | `e.g., Medium` | `Medium` |
| Skin Tone | `e.g., Fair` | `Fair` |
| Makeup | `e.g., Natural` | `Natural` |
| Shirt / Top | `e.g., White blouse` | `White blouse` |
| Pants / Bottoms | `e.g., Blue jeans` | `Blue jeans` |
| Job / Occupation | `e.g., Software Engineer` | `Software Engineer` |
| Education Level | `e.g., Bachelor's` | `Bachelor's` |
| Residence | `e.g., Downtown apartment` | `Downtown apartment` |
| Hobbies | `e.g., Reading, Hiking` | `Reading, Hiking` |
| Financial Status | `e.g., Middle class` | `Middle class` |

**CharacterEditForm.tsx** (inline session edit form):
| Field | Before | After |
|---|---|---|
| Nicknames | `e.g., Mom, Mother (comma-separated)` | `Nicknames` |

**CoverImageGenerationModal.tsx**:
| Before | After |
|---|---|
| `Describe your cover image... (e.g., A mystical forest at twilight with ancient ruins)` | `Describe your cover image...` |

**SceneImageGenerationModal.tsx**:
| Before | After |
|---|---|
| `e.g., A cozy medieval tavern with warm candlelight...` | `A cozy medieval tavern with warm candlelight...` |

**SceneTagEditorModal.tsx**:
| Before | After |
|---|---|
| `Enter keyword (e.g., home, forest)...` | `Enter keyword...` |

## Files Modified
| File | Change |
|---|---|
| `src/components/chronicle/CharactersTab.tsx` | Remove `e.g.,` from ~23 placeholders, change Nicknames placeholder |
| `src/components/chronicle/CharacterEditModal.tsx` | Remove `e.g.,` from ~19 placeholders, change Nicknames placeholder |
| `src/components/chronicle/CharacterEditForm.tsx` | Change Nicknames placeholder |
| `src/components/chronicle/CoverImageGenerationModal.tsx` | Clean placeholder |
| `src/components/chronicle/SceneImageGenerationModal.tsx` | Clean placeholder |
| `src/components/chronicle/SceneTagEditorModal.tsx` | Clean placeholder |
