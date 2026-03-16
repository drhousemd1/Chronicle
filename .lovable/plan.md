

# Fix: Remove ALL CAPS from Buttons and Headers in AI Generation Modals

Per the typography standard: **Buttons = Title Case**, **Small field labels = ALL CAPS**. The headers in the slate blue bar and the action buttons were incorrectly set to `uppercase`. Field labels (Prompt, Style, Negative Prompt) should remain ALL CAPS as they are micro-labels.

## Changes

### What gets `uppercase` REMOVED:
1. **DialogTitle** (header text) — remove `uppercase tracking-[0.08em]`, keep `text-[13px] font-black`
2. **Cancel / Generate buttons** — remove `uppercase tracking-[0.05em]`, keep `text-[11px] font-black`
3. **AIPromptModal iridescent submit button** — same removal

### What KEEPS `uppercase` (micro-labels, no change):
- `Prompt` label, `Style` label, `Negative Prompt` label — these are small field labels and correctly use `text-[11px] font-black uppercase tracking-[0.1em]`

## Files Changed (4 files, ~2 class tweaks each)
- `src/components/chronicle/CoverImageGenerationModal.tsx` — lines 108, 222, 231
- `src/components/chronicle/AvatarGenerationModal.tsx` — lines 143, 269, 278
- `src/components/chronicle/SceneImageGenerationModal.tsx` — lines 64, 151, 160
- `src/components/chronicle/AIPromptModal.tsx` — lines 63, 125, 136

