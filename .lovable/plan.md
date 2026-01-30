

# Plan: Per-Field AI Enhancement for World Core (Structured Expansion)

## Overview

This plan adds per-field AI enhancement icons to the World Core section in the Scenario Builder, allowing users to selectively enhance individual fields with AI assistance. The AI will use **Structured Expansion** - concise, factual enhancements that focus on narrative-relevant implications rather than flowery prose.

---

## Architecture Decision: Per-Field vs Global Button

**Chosen Approach: Per-Field Icons**

| Approach | Pros | Cons |
|----------|------|------|
| Global "AI Fill" button | Simple to implement | May overwrite fields user doesn't want changed |
| Per-field icons ✓ | Granular control, user picks what to enhance | Slightly more complex UI |

The per-field approach gives users precise control and matches the pattern of users wanting to enhance specific areas rather than everything at once.

---

## Expansion Style: Structured (Not Organic)

**Why Structured?**

1. **Token Efficiency**: Concise facts use fewer tokens in the AI's context window during roleplay
2. **AI Comprehension**: Clear, actionable facts are easier for the roleplay AI to reference
3. **User Control**: Less "fluff" means the user's intent isn't buried in prose
4. **Consistency**: Predictable output format across all fields

**Structured Format Rule:**
```
Fact → Implication for story
```

Example:
- Input: "Medieval fantasy kingdom"
- Output: "A feudal kingdom governed by hereditary nobility and sworn fealty. Political tensions between regional lords create opportunities for intrigue and shifting alliances."

---

## Files to Modify/Create

| File | Purpose |
|------|---------|
| `src/services/world-ai.ts` | **NEW** - AI enhancement service for World Core fields |
| `src/components/chronicle/WorldTab.tsx` | Add sparkle icons next to field labels |

---

## Implementation Details

### 1. Create World AI Service

**File:** `src/services/world-ai.ts`

This service handles AI enhancement for individual World Core fields using structured expansion prompts.

```typescript
// Field-specific prompts that enforce structured expansion
const FIELD_PROMPTS: Record<string, { instruction: string; maxSentences: number }> = {
  scenarioName: {
    instruction: "Generate a compelling scenario/story name. Be evocative but concise (2-5 words).",
    maxSentences: 1
  },
  briefDescription: {
    instruction: "Write a 1-2 sentence summary suitable for a story card. Focus on the hook.",
    maxSentences: 2
  },
  storyPremise: {
    instruction: "Describe the central conflict and stakes. Format: Situation + Tension + Stakes. 2-4 sentences.",
    maxSentences: 4
  },
  settingOverview: {
    instruction: "Describe the physical and cultural landscape. Format: Geography + Culture + Atmosphere. Be factual and concise.",
    maxSentences: 5
  },
  rulesOfMagicTech: {
    instruction: "List the rules governing supernatural or technological systems. Format: What exists + How it works + Limitations.",
    maxSentences: 4
  },
  locations: {
    instruction: "List key locations with their narrative significance. Format: 'Location Name - Brief description and story relevance'",
    maxSentences: 6
  },
  toneThemes: {
    instruction: "Define the emotional tone and thematic elements. Format: Tone keywords + Central themes + Content notes if applicable.",
    maxSentences: 3
  }
};
```

**Core Function:**
```typescript
export async function aiEnhanceWorldField(
  fieldName: keyof WorldCore,
  currentValue: string,
  worldContext: Partial<WorldCore>,
  modelId: string
): Promise<string>
```

**Prompt Strategy:**
- If field is empty: Generate appropriate content from scratch using other fields as context
- If field has content: Expand/enhance it while preserving the user's original intent
- Always enforce structured format rules (no purple prose)

### 2. Update WorldTab.tsx

**Changes:**
1. Import the new `aiEnhanceWorldField` function
2. Import a sparkle/wand icon from Lucide (`Sparkles` or `Wand2`)
3. Add state to track which field is currently being enhanced
4. Create a reusable `FieldLabel` component with the AI icon

**New FieldLabel Component:**
```tsx
const FieldLabel: React.FC<{
  label: string;
  fieldName: keyof WorldCore;
  onEnhance: () => void;
  isLoading: boolean;
}> = ({ label, fieldName, onEnhance, isLoading }) => (
  <div className="flex items-center gap-2 mb-1">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
      {label}
    </label>
    <button
      type="button"
      onClick={onEnhance}
      disabled={isLoading}
      title="Enhance with AI"
      className={cn(
        "p-1 rounded-md transition-all",
        isLoading 
          ? "text-blue-400 animate-pulse cursor-wait" 
          : "text-slate-300 hover:text-blue-500 hover:bg-blue-50"
      )}
    >
      <Sparkles size={14} />
    </button>
  </div>
);
```

**Handler Function:**
```tsx
const [enhancingField, setEnhancingField] = useState<keyof WorldCore | null>(null);

const handleEnhanceField = async (fieldName: keyof WorldCore) => {
  if (!modelId) {
    toast.error("No model selected");
    return;
  }
  
  setEnhancingField(fieldName);
  try {
    const enhanced = await aiEnhanceWorldField(
      fieldName,
      world.core[fieldName] || '',
      world.core,
      modelId
    );
    updateCore({ [fieldName]: enhanced });
    toast.success(`${fieldName} enhanced`);
  } catch (error) {
    toast.error("Enhancement failed");
  } finally {
    setEnhancingField(null);
  }
};
```

**UI Changes (before/after):**

Before:
```tsx
<Input 
  label="Scenario Name" 
  value={world.core.scenarioName} 
  onChange={(v) => updateCore({ scenarioName: v })} 
/>
```

After:
```tsx
<div>
  <FieldLabel 
    label="Scenario Name" 
    fieldName="scenarioName"
    onEnhance={() => handleEnhanceField('scenarioName')}
    isLoading={enhancingField === 'scenarioName'}
  />
  <Input 
    value={world.core.scenarioName} 
    onChange={(v) => updateCore({ scenarioName: v })} 
    placeholder="e.g. Chronicles of Eldoria"
  />
</div>
```

---

## Structured Expansion Prompt Template

The core prompt sent to the AI for each field:

```
You are enhancing a story/scenario field. Use STRUCTURED EXPANSION:

RULES:
1. Be concise and factual (max {maxSentences} sentences)
2. Focus on narrative-relevant implications
3. No purple prose or flowery language
4. Format: Fact → Story implication
5. Preserve any existing content's intent if provided

FIELD: {fieldLabel}
CURRENT VALUE: {currentValue || "Empty - generate from context"}

CONTEXT FROM OTHER FIELDS:
- Scenario: {scenarioName}
- Setting: {settingOverview}
- Tone: {toneThemes}

{fieldSpecificInstruction}

Return ONLY the enhanced text. No explanations.
```

---

## Expected User Experience

1. User sees a small ✨ sparkle icon next to each World Core field label
2. Clicking the icon triggers AI enhancement for just that field
3. The icon pulses/animates while loading (no button text changes)
4. The field updates with structured, concise content
5. A toast confirms success

---

## Visual Mockup (ASCII)

```text
┌─────────────────────────────────────────────────┐
│ 🌍 World Core                                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  SCENARIO NAME ✨                               │
│  ┌───────────────────────────────────────────┐ │
│  │ Chronicles of Eldoria                      │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  BRIEF DESCRIPTION ✨                           │
│  ┌───────────────────────────────────────────┐ │
│  │ A young mage discovers...                  │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  STORY PREMISE ✨                               │
│  ┌───────────────────────────────────────────┐ │
│  │                                            │ │
│  │ (click ✨ to generate)                     │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘

✨ = clickable AI enhance button (Sparkles icon)
```

---

## Technical Notes

1. **Model Selection**: The enhancement uses the globally selected model from `ModelSettingsContext`
2. **Context Awareness**: Each field prompt includes other World Core fields for coherent generation
3. **No Overwrites**: If field has content, AI enhances rather than replaces
4. **Error Handling**: Failed enhancements show a toast; field value unchanged
5. **Loading State**: Per-field loading prevents multiple simultaneous enhancements

---

## Future Considerations

- **Optional Global Button**: Could add "AI Fill All Empty" at the top for users who want batch filling
- **Undo Support**: Could store previous value before enhancement for quick revert
- **Custom Instructions**: Could allow users to provide hints for what they want in each field

