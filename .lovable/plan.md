
# Plan: Per-Field AI Enhancement for Character Editor

## Overview

This plan adds per-field AI enhancement icons (the same ✨ Sparkles icon we just added to World Core) to the Character Editor in the Scenario Builder. Users will see a black sparkle icon next to each field label (Hair Color, Eye Color, Build, etc.) that, when clicked, uses AI to enhance just that specific field using **Structured Expansion**.

The existing global "AI Fill" and "AI Generate" buttons in the header remain unchanged - this feature provides granular control for users who only want help with specific fields.

---

## Architecture

### Files to Modify/Create

| File | Purpose |
|------|---------|
| `src/services/character-ai.ts` | Add new `aiEnhanceCharacterField` function for per-field enhancement |
| `src/components/chronicle/CharactersTab.tsx` | Add sparkle icons to `HardcodedInput` component and custom section items |

---

## Implementation Details

### 1. Create New Service Function in `character-ai.ts`

Add a new exported function `aiEnhanceCharacterField` that handles single-field enhancement using the same **Structured Expansion** pattern from the World AI:

```typescript
// Field-specific prompts for character fields (structured expansion)
const CHARACTER_FIELD_PROMPTS: Record<string, { instruction: string; maxSentences: number }> = {
  // Physical Appearance
  hairColor: { instruction: "Describe hair color, style, and length concisely. Format: Color + Style + Notable features.", maxSentences: 2 },
  eyeColor: { instruction: "Describe eye color and any notable characteristics. Format: Color + Quality/Expression.", maxSentences: 1 },
  build: { instruction: "Describe body type and physique. Format: Type + Defining features.", maxSentences: 2 },
  height: { instruction: "Provide height (with measurement) and how they carry themselves.", maxSentences: 1 },
  skinTone: { instruction: "Describe skin tone and any notable texture or qualities.", maxSentences: 1 },
  // ... more fields
  
  // Currently Wearing
  top: { instruction: "Describe the top/shirt being worn. Include style, color, fit.", maxSentences: 2 },
  bottom: { instruction: "Describe pants/skirt/shorts being worn. Include style, color, fit.", maxSentences: 2 },
  // ... more fields
  
  // Custom fields
  custom: { instruction: "Provide relevant details for this character trait. Be concise and story-relevant.", maxSentences: 3 }
};

export async function aiEnhanceCharacterField(
  fieldName: string,
  currentValue: string,
  characterContext: Partial<Character>,
  worldContext: string,
  modelId: string
): Promise<string>
```

The function will:
- Build context from existing character data (name, age, sex, role, etc.)
- Use field-specific prompts to ensure structured output
- Call the chat edge function with structured expansion rules
- Return the enhanced text

### 2. Update `CharactersTab.tsx`

#### Add State for Tracking Enhancement

```typescript
const [enhancingField, setEnhancingField] = useState<string | null>(null);
```

#### Modify `HardcodedInput` Component

Add an optional `onEnhance` prop and sparkle icon:

```typescript
const HardcodedInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fieldKey?: string;
  onEnhance?: () => void;
  isEnhancing?: boolean;
}> = ({ label, value, onChange, placeholder, onEnhance, isEnhancing }) => (
  <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-start">
    <div className="w-full md:w-1/3 shrink-0">
      <div className="flex items-center gap-2 mb-1">
        <label className="block text-xs font-bold uppercase text-slate-500">{label}</label>
        {onEnhance && (
          <button
            type="button"
            onClick={onEnhance}
            disabled={isEnhancing}
            title="Enhance with AI"
            className={cn(
              "p-1 rounded-md transition-all",
              isEnhancing
                ? "text-blue-500 animate-pulse cursor-wait"
                : "text-black hover:text-blue-500 hover:bg-blue-50"
            )}
          >
            <Sparkles size={14} />
          </button>
        )}
      </div>
    </div>
    <div className="w-full md:flex-1">
      <input ... />
    </div>
  </div>
);
```

#### Add Handler Function

```typescript
const handleEnhanceField = async (
  fieldKey: string, 
  section: 'physicalAppearance' | 'currentlyWearing' | 'preferredClothing' | 'custom',
  sectionId?: string,
  itemId?: string
) => {
  if (!selected || enhancingField) return;
  
  setEnhancingField(fieldKey);
  try {
    const currentValue = /* get value based on section type */;
    const worldContext = buildWorldContext(appData);
    
    const enhanced = await aiEnhanceCharacterField(
      fieldKey,
      currentValue,
      selected,
      worldContext,
      appData.selectedModel || 'google/gemini-3-flash-preview'
    );
    
    // Update the appropriate field
    if (section === 'physicalAppearance') {
      handlePhysicalAppearanceChange(fieldKey as keyof PhysicalAppearance, enhanced);
    } else if (section === 'currentlyWearing') {
      handleCurrentlyWearingChange(fieldKey as keyof CurrentlyWearing, enhanced);
    } // ... etc
    
    toast.success(`${fieldKey} enhanced`);
  } catch (error) {
    toast.error('Enhancement failed');
  } finally {
    setEnhancingField(null);
  }
};
```

#### Update Field Renderings

Update each `HardcodedInput` call to include the enhance props:

```typescript
<HardcodedInput 
  label="Hair Color" 
  value={selected.physicalAppearance?.hairColor || ''} 
  onChange={(v) => handlePhysicalAppearanceChange('hairColor', v)} 
  placeholder="e.g., Brunette, Blonde, Black"
  onEnhance={() => handleEnhanceField('hairColor', 'physicalAppearance')}
  isEnhancing={enhancingField === 'hairColor'}
/>
```

#### Add Enhancement to Custom Section Items

For user-created custom sections, add the sparkle icon next to each item's label:

```typescript
{section.items.map(item => (
  <div key={item.id} className="group relative flex flex-col md:flex-row gap-4 items-start pt-2">
    <div className="w-full md:w-1/3 shrink-0">
      <div className="flex items-center gap-2">
        <Input 
          value={item.label} 
          onChange={...} 
          placeholder="Label (e.g. Bio)" 
        />
        {item.label && (
          <button
            type="button"
            onClick={() => handleEnhanceField(item.id, 'custom', section.id, item.id)}
            disabled={enhancingField !== null}
            title="Enhance with AI"
            className={cn(
              "p-1 rounded-md transition-all flex-shrink-0",
              enhancingField === item.id
                ? "text-blue-500 animate-pulse cursor-wait"
                : "text-black hover:text-blue-500 hover:bg-blue-50"
            )}
          >
            <Sparkles size={14} />
          </button>
        )}
      </div>
    </div>
    ...
  </div>
))}
```

---

## Structured Expansion Prompts for Character Fields

Each field type will have a specific prompt to ensure concise, fact-based output:

| Field | Instruction | Max Sentences |
|-------|-------------|---------------|
| hairColor | "Color + Style + Length/Texture" | 2 |
| eyeColor | "Color + Quality/Expression" | 1 |
| build | "Body type + Defining physical features" | 2 |
| height | "Height measurement + Posture/Presence" | 1 |
| skinTone | "Tone + Texture/Quality" | 1 |
| bodyHair | "Amount/Pattern + Location" | 1 |
| breastSize | "Size + Description if relevant" | 1 |
| makeup | "Style + Colors + Intensity" | 2 |
| bodyMarkings | "Type + Location + Significance" | 2 |
| temporaryConditions | "Condition + Visibility + Duration" | 2 |
| top | "Garment type + Color + Fit + Style" | 2 |
| bottom | "Garment type + Color + Fit + Style" | 2 |
| custom | "Relevant details for this trait" | 3 |

---

## Visual Mockup

```text
Physical Appearance
┌─────────────────────────────────────────────────────────────┐
│ HAIR COLOR ✨                 │ [Brunette with auburn...]   │
├─────────────────────────────────────────────────────────────┤
│ EYE COLOR ✨                  │ [Deep blue with...]         │
├─────────────────────────────────────────────────────────────┤
│ BUILD ✨                      │ [Athletic with broad...]    │
└─────────────────────────────────────────────────────────────┘

Custom Section: Background
┌─────────────────────────────────────────────────────────────┐
│ [Job/Occupation] ✨           │ [Detective at the...]       │
├─────────────────────────────────────────────────────────────┤
│ [Hobbies] ✨                  │ [Enjoys rock climbing...]   │
└─────────────────────────────────────────────────────────────┘

✨ = Black sparkle icon (turns blue on hover, pulses when loading)
```

---

## Technical Notes

1. **Model Selection**: Uses `appData.selectedModel` (or default) from the scenario settings
2. **Context Awareness**: Each field prompt includes character basics (name, age, role) for coherent generation
3. **Existing Buttons Unchanged**: The global "AI Fill" and "AI Generate" buttons in the header remain as-is
4. **Loading State**: Per-field loading prevents clicking other enhance buttons while one is in progress
5. **Custom Sections**: The sparkle icon only appears next to items that have a label (to avoid enhancing empty placeholder items)
6. **Icon Color**: Solid black (`text-black`) matching the World Core implementation
7. **Dynamic Sections**: When users add new categories and items, the sparkle icons automatically appear once the item has a label

---

## Dependencies

- Imports needed: `Sparkles` from `lucide-react`, `cn` from `@/lib/utils`, `toast` from `sonner`
- The new `aiEnhanceCharacterField` function will use the existing `chat` edge function

