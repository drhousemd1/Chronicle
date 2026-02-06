

# Scenario Builder Character Page Header Updates

## Summary

Major overhaul of the character builder header in the Scenario Builder:
1. Move "+ Category" button from header to below character trait sections
2. Update "AI Fill" and "AI Generate" buttons to premium iridescent styling with tooltips
3. Add an AI prompt modal for both AI Fill and AI Generate with user guidance
4. Update Cancel button to match the standardized dark surface style
5. Transform Save button into "+ Character Library" with state-aware behavior

---

## Files to Modify

### Primary Files:
- `src/pages/Index.tsx` - Header buttons, handlers
- `src/components/chronicle/CharactersTab.tsx` - Add Category placement
- `src/services/character-ai.ts` - Update AI functions to accept user prompt

### New Component:
- `src/components/chronicle/AIPromptModal.tsx` - New modal for AI assistance guidance

---

## Technical Changes

### 1. Move "+ Category" from Header to Character Traits Area

**Location:** `src/pages/Index.tsx` (lines 1367) and `src/components/chronicle/CharactersTab.tsx` (after line 883)

**In Index.tsx - Remove from header:**
```tsx
// Remove this line from the header buttons:
<Button variant="primary" onClick={handleAddSection}>+ Category</Button>
```

**In CharactersTab.tsx - Add after custom sections (before closing div of trait sections):**

Add the elongated "+ Add Category" button at the bottom of the character traits column, matching the styling from CharacterEditModal:

```tsx
{/* Add Category Button - positioned below all trait sections */}
<button
  type="button"
  onClick={handleAddSection}
  className="w-full flex h-10 px-6 items-center justify-center gap-2
    rounded-xl border border-[hsl(var(--ui-border))] 
    bg-[hsl(var(--ui-surface-2))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]
    text-[hsl(var(--ui-text))] text-[10px] font-bold leading-none uppercase tracking-wider
    hover:bg-white/5 active:bg-white/10
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20
    transition-colors"
>
  <Plus className="w-4 h-4" /> Add Category
</button>
```

---

### 2. Create AI Prompt Modal Component

**New File:** `src/components/chronicle/AIPromptModal.tsx`

A modal that appears when clicking AI Fill or AI Generate:
- Text prompt input area for character guidance
- Checkbox: "Use all details currently in character card" (checked by default)
- Submit and Cancel buttons
- Pass user prompt and checkbox state to the AI functions

```tsx
interface AIPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string, useExistingDetails: boolean) => void;
  mode: 'fill' | 'generate';
  isProcessing: boolean;
}
```

The modal includes:
- DialogTitle with appropriate text based on mode
- Textarea for user prompt describing the character
- Checkbox for "Use all details currently in character card"
- Submit button matching premium styling

---

### 3. Update AI Fill and AI Generate Button Styling

**Location:** `src/pages/Index.tsx` (lines 1368-1369)

Replace the plain Button components with the premium iridescent 9-layer button design from AvatarActionButtons. Wrap each in a Tooltip for hover hints.

```tsx
{/* AI Fill Button with tooltip */}
<Tooltip>
  <TooltipTrigger asChild>
    <button
      type="button"
      onClick={() => setShowAIPromptModal({ mode: 'fill' })}
      disabled={isAiFilling}
      className="group relative flex h-10 px-4 rounded-xl overflow-hidden
        text-white text-[10px] font-bold leading-none
        shadow-[0_12px_40px_rgba(0,0,0,0.45)]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/45
        disabled:opacity-50"
    >
      {/* 9 iridescent layers copied from AvatarActionButtons */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 shrink-0 text-cyan-200" 
          style={{ filter: "drop-shadow(0 0 10px rgba(34,184,200,0.35))" }}
        />
        <span className="min-w-0 truncate drop-shadow-[0_1px_0_rgba(0,0,0,0.35)]">
          {isAiFilling ? "Filling..." : "AI Fill"}
        </span>
      </span>
    </button>
  </TooltipTrigger>
  <TooltipContent>Have AI generate text for empty fields</TooltipContent>
</Tooltip>

{/* AI Generate Button with tooltip */}
<Tooltip>
  <TooltipTrigger asChild>
    <button
      type="button"
      onClick={() => setShowAIPromptModal({ mode: 'generate' })}
      disabled={isAiGenerating}
      className="group relative flex h-10 px-4 rounded-xl overflow-hidden
        text-white text-[10px] font-bold leading-none
        shadow-[0_12px_40px_rgba(0,0,0,0.45)]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/45
        disabled:opacity-50"
    >
      {/* Same 9 iridescent layers */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 shrink-0 text-cyan-200" 
          style={{ filter: "drop-shadow(0 0 10px rgba(34,184,200,0.35))" }}
        />
        <span className="min-w-0 truncate drop-shadow-[0_1px_0_rgba(0,0,0,0.35)]">
          {isAiGenerating ? "Generating..." : "AI Generate"}
        </span>
      </span>
    </button>
  </TooltipTrigger>
  <TooltipContent>Have AI add new categories and fill all empty text fields</TooltipContent>
</Tooltip>
```

---

### 4. Update AI Functions to Accept User Prompt

**Location:** `src/services/character-ai.ts`

Modify `aiFillCharacter` and `aiGenerateCharacter` to accept:
- `userPrompt?: string` - User-provided guidance text
- `useExistingDetails?: boolean` - Whether to heavily weight existing character details

Update the prompt building functions to incorporate user guidance:

```typescript
export async function aiFillCharacter(
  character: Character,
  appData: ScenarioData,
  modelId: string,
  userPrompt?: string,
  useExistingDetails: boolean = true
): Promise<Partial<Character>> {
  // Existing logic plus:
  // If userPrompt provided, prepend to the prompt
  // If useExistingDetails is true, emphasize existing character info
  // If useExistingDetails is false, weight more heavily on userPrompt
}

export async function aiGenerateCharacter(
  character: Character,
  appData: ScenarioData,
  modelId: string,
  userPrompt?: string,
  useExistingDetails: boolean = true
): Promise<Partial<Character>> {
  // Same approach - incorporate user guidance
}
```

---

### 5. Update Cancel Button Styling

**Location:** `src/pages/Index.tsx` (line 1370)

Replace with the standardized dark surface button matching Upload Image and Cancel buttons:

```tsx
<button
  type="button"
  onClick={handleCancelCharacterEdit}
  className="flex h-10 px-6 items-center justify-center gap-2
    rounded-xl border border-[hsl(var(--ui-border))] 
    bg-[hsl(var(--ui-surface-2))] shadow-[0_10px_30px_rgba(0,0,0,0.35)]
    text-[hsl(var(--ui-text))] text-[10px] font-bold leading-none uppercase tracking-wider
    hover:bg-white/5 active:bg-white/10
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20
    transition-colors"
>
  Cancel
</button>
```

---

### 6. Transform Save Button to "+ Character Library" with State Management

**Location:** `src/pages/Index.tsx` (line 1371) and handlers

**State to track:**
- `characterInLibrary: Record<string, boolean>` - Track which characters are already saved to library

**Button logic:**
- If character NOT in library: Show "+ Character Library" button
- If character IS in library: Show "Update Character" button with tooltip "Update character profile in library"

```tsx
{/* Character Library Button with tooltip */}
<Tooltip>
  <TooltipTrigger asChild>
    <button
      type="button"
      onClick={handleSaveToLibrary}
      disabled={isSaving}
      className="flex h-10 px-6 items-center justify-center gap-2
        rounded-xl border border-[#5a6f8f] 
        bg-[#4a5f7f] shadow-[0_10px_30px_rgba(0,0,0,0.35)]
        text-white text-[10px] font-bold leading-none uppercase tracking-wider
        hover:bg-[#5a6f8f] active:bg-[#6a7f9f] disabled:opacity-50
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a6f8f]/40
        transition-colors"
    >
      {isSaving ? 'Saving...' : isInLibrary ? 'Update Character' : '+ Character Library'}
    </button>
  </TooltipTrigger>
  <TooltipContent>
    {isInLibrary ? 'Update character profile in library' : 'Add character to library'}
  </TooltipContent>
</Tooltip>
```

**Handler Update:**
- When saving, check if character exists in library (by unique ID, not name)
- If exists: update existing record
- If new: create new record with unique ID
- After save: update `characterInLibrary` state to reflect saved status

---

## Implementation Order

1. Create `AIPromptModal.tsx` component
2. Update `character-ai.ts` to accept user prompt parameters
3. Update `CharactersTab.tsx` to add the "+ Add Category" button below sections
4. Update `Index.tsx`:
   - Remove "+ Category" from header
   - Replace AI Fill/Generate buttons with iridescent styling + tooltips
   - Add AIPromptModal state and handlers
   - Replace Cancel button with standardized styling
   - Replace Save with "+ Character Library" / "Update Character" logic
5. Add character library tracking state

---

## Summary of Visual Changes

| Element | Current | Updated |
|---------|---------|---------|
| + Category | In header | Below trait sections (elongated dark button) |
| AI Fill | Plain primary button | Premium iridescent 9-layer button with tooltip |
| AI Generate | Plain primary button | Premium iridescent 9-layer button with tooltip |
| AI Buttons Click | Direct action | Opens prompt modal for user guidance |
| Cancel | Plain primary button | Dark surface button with shadow |
| Save | Plain "Save" button | "+ Character Library" / "Update Character" with tooltip |

