

# Plan: Add Download Button to Style Guide Tool

## What

Add a download button to the Style Guide's white sticky header (top-right). Clicking it opens a modal with format selection (HTML, Markdown, JSON), then generates and downloads the full style guide content in the chosen format.

## Why These Formats

- **HTML** — Preserves all visual styling (colors, swatches, layout). Best for visual review by humans or multimodal LLMs.
- **Markdown** — Clean text-based format. Best for pasting into LLM chat contexts (Claude, GPT). Lightweight, token-efficient.
- **JSON** — Structured machine-readable format. Best for programmatic consumption or feeding into automated tooling.

PDF is excluded — it requires a heavy library (jsPDF/html2pdf) and offers no advantage over HTML for LLM consumption.

## UI Design

- **Button**: Placed in the sticky header, right-aligned. Uses the Shadow Surface button standard (`h-10 px-6 rounded-xl`, `bg-[hsl(var(--ui-surface-2))]` tokens — but since this header is white/light, use the `sg.primary` (#4a5f7f) with white text to match the guide's own visual language).
- **Icon**: `Download` from lucide-react.
- **Modal**: Dark-themed (`bg-zinc-900 border-white/10`) matching the app's modal standard. Three format cards in a row, click one to generate + download immediately.

## Implementation

### 1. Add download modal + generator (~150 lines in StyleGuideTool.tsx)

- Import `Download` from lucide-react
- Add `showDownloadModal` state
- Add button to header div (flex row, justify-between)
- Add modal overlay with 3 format option cards (HTML / Markdown / JSON)
- Each card click triggers a generator function → creates a Blob → triggers `URL.createObjectURL` download

### 2. Generator functions

**HTML**: Clone the content div's innerHTML, wrap in a standalone HTML document with inlined styles (the guide already uses inline styles, so this works naturally). Include a `<style>` block for any missing base styles.

**Markdown**: Walk through the data structures (SECTIONS, swatches, tiles, entries) and serialize to structured markdown with headers, tables, and code blocks. This produces a clean, LLM-friendly document.

**JSON**: Serialize the same data into a structured JSON object with sections → entries → specs/tokens/locations.

### File Changes

| File | Change |
|------|--------|
| `src/components/admin/styleguide/StyleGuideTool.tsx` | Add download button to header, download modal, 3 generator functions |

