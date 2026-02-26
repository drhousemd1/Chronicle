

# Rename "Breast Size" to "Breasts" with Updated Placeholder

## Changes

Update the label from "Breast Size" to "Breasts" and the placeholder to "Size, description" across all 4 files where it appears:

1. **`src/components/chronicle/CharactersTab.tsx`**
   - Line 457: Collapsed view label "Breast Size" -> "Breasts"
   - Line 893: HardcodedRow label "Breast Size" -> "Breasts", placeholder "C-cup / N/A" -> "Size, description"

2. **`src/components/chronicle/ChatInterfaceTab.tsx`**
   - Line 2539: Label "Breast Size" -> "Breasts"

3. **`src/components/chronicle/CharacterEditModal.tsx`**
   - Line 1432: Summary label "Breast Size" -> "Breasts"
   - Find the HardcodedRow for breastSize and update label + placeholder

4. **`src/services/character-ai.ts`**
   - Line 213: AI field label "Breast Size" -> "Breasts"

