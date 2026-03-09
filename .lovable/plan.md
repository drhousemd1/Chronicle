

## Fix AI Generate Button — Use Actual App Styling

The current style guide entry is completely wrong. It uses a simple Tailwind gradient (`bg-gradient-to-r from-purple-600...`) which doesn't exist anywhere in the app. The real button in `AvatarActionButtons.tsx` (and identical in `CoverImageActionButtons.tsx`, `SceneGalleryActionButtons.tsx`) is a premium multi-layered design.

### What the real button actually is

A `relative overflow-hidden` button with **8 stacked layers**:
1. **Iridescent outer border ring** — `linear-gradient(90deg)` with teal/purple/white stops
2. **2px border mask** — `inset-[2px]` with `#2B2D33` background
3. **Surface gradient** — teal/purple at 22% opacity over `#2B2D33`
4. **Top sheen** — white-to-transparent vertical gradient
5. **Diagonal sheen** — 135deg white gradient with `mix-blend-mode: screen`
6. **Teal bloom** — radial gradient, top-left, blurred
7. **Purple bloom** — radial gradient, bottom-right, blurred
8. **Inner edge shadows** — inset box-shadows

Plus a Sparkles icon (cyan-200 with teal glow) and text with drop-shadow.

### Changes to `StyleGuideTool.tsx` lines 1053-1065

1. **Preview**: Replace the simple `<button>` with a replica of the real multi-layered button from `AvatarActionButtons.tsx`, including all 8 layers, the Sparkles icon, and proper sizing
2. **buttonColor**: Update to `#2B2D33 base surface with teal (rgba(34,184,200)) and purple (rgba(109,94,247)) gradient overlays`
3. **textColor**: Update to `#ffffff — text-white, text-[10px] font-bold uppercase. Sparkles icon: text-cyan-200`
4. **size**: Update to `h-10 × px-4 — rounded-xl (12px), overflow-hidden`
5. **visualEffects**: Update to describe the layered construction: iridescent border ring, teal/purple blooms, top sheen, diagonal sheen, inset edge shadows, outer shadow `shadow-[0_12px_40px_rgba(0,0,0,0.45)]`
6. **locations**: Update to `Avatar AI Generate, Cover Image AI Generate, Scene Gallery AI Generate — all action button groups`
7. **pageSpecific**: Change to `false`, **appWide**: Change to `true` (used across multiple pages)

