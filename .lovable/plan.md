

# Fix Focus Border on AI Modal Textareas

## Problem
Modal textareas include `border-b-0 border-x-0`, which removes bottom and side borders. When `focus:border-blue-500` activates, it only appears on top (image 1). Builder inputs (image 2) omit those zero-border classes, so focus applies a full blue border on all four sides.

## Fix
Remove `border-b-0 border-x-0` from every `<Textarea>` className in these files:

| File | Lines |
|------|-------|
| `CoverImageGenerationModal.tsx` | 129, 155 |
| `AvatarGenerationModal.tsx` | 176, 202 |
| `SceneImageGenerationModal.tsx` | 85 |
| `AIPromptModal.tsx` | 87 |

No other changes needed. The existing `focus:border-blue-500` will then paint all four sides on focus, matching the builder inputs exactly.

