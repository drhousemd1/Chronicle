

# Add Focus Highlight to AI Generation Modal Textareas

The builder inputs use `focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500` (file: `CharacterEditModal.tsx` line 211, `PersonalitySection.tsx` line 125, etc.). The modal textareas explicitly suppress this with `focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0`.

## Changes

In all 4 modals, replace `focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0` with `focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500` on every `<Textarea>`:

| File | Textareas |
|------|-----------|
| `CoverImageGenerationModal.tsx` | Prompt (line 129), Negative prompt (line 155) |
| `AvatarGenerationModal.tsx` | Prompt (line 176), Negative prompt (line 202) |
| `SceneImageGenerationModal.tsx` | Prompt (line 85) |
| `AIPromptModal.tsx` | Prompt (line 87) |

No other changes needed.

