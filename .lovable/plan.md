
Objective: enforce the global no-toast policy by removing every toast system and every toast callsite across the app, then replacing user feedback with inline UI state and console logging.

What I found in the codebase
- There are two parallel toast systems active at once:
  1) Sonner (`import { toast } from 'sonner'`, plus `<Sonner />` in `App.tsx`)
  2) shadcn hook toasts (`useToast` / `toast` from `@/hooks/use-toast`, plus `<Toaster />` in `App.tsx`)
- Toast usage currently exists in 20+ source files, including core flow files (`Index.tsx`, `ChatInterfaceTab.tsx`, `CharactersTab.tsx`, `WorldTab.tsx`, `CharacterEditModal.tsx`, auth/account/admin/gallery/memory files).
- There is also toast infrastructure code (`src/components/ui/toast.tsx`, `src/components/ui/toaster.tsx`, `src/components/ui/sonner.tsx`, `src/hooks/use-toast.ts`, `src/components/ui/use-toast.ts`) that should be removed or detached to prevent reintroduction.
- This matches your reported regression: toasts were reintroduced in multiple areas after prior cleanup.

Implementation plan

1) Remove global toast renderers and kill the entry points
- File: `src/App.tsx`
  - Remove:
    - `import { Toaster } from "@/components/ui/toaster";`
    - `import { Toaster as Sonner } from "@/components/ui/sonner";`
    - `<Toaster />`
    - `<Sonner />`
- Result: no toast container mounted anywhere in the app.

2) Remove all toast infrastructure files/usages
- Files to neutralize/remove from active graph:
  - `src/components/ui/sonner.tsx`
  - `src/components/ui/toaster.tsx`
  - `src/components/ui/toast.tsx`
  - `src/hooks/use-toast.ts`
  - `src/components/ui/use-toast.ts`
- Approach:
  - Remove imports/usages first across app files.
  - Then either delete the files or leave unused (prefer delete if no references remain).
- Guardrail: final search should return zero references to:
  - `from 'sonner'`
  - `useToast`
  - `hooks/use-toast`
  - `components/ui/toast`
  - `components/ui/toaster`
  - `toast.` and `toast(`

3) Replace callsite behavior with policy-compliant feedback patterns
The replacement strategy is intentionally consistent:
- Success feedback: rely on immediate UI state changes already visible in the interface (updated lists, counts, modal close, changed button label, spinner stop).
- Error feedback: keep `console.error(...)` and show inline/local message where needed.
- Progress feedback: use existing loading flags (`isSaving`, `isUploading`, `isPublishing`, etc.) and button label/state changes.
- Validation feedback: inline field error text next to inputs instead of toast popups.

4) File-by-file remediation map

A) Hook-toast consumers
- `src/pages/Auth.tsx`
  - Remove `useToast`.
  - Keep and expand existing inline `errors` object for auth failures (already present for validation).
  - For backend/auth failures, set form-level error message under submit button.
- `src/pages/Index.tsx`
  - Remove `useToast`.
  - Add lightweight scoped status state per major action cluster (background upload/select/delete, play/edit/clone/save, conversation ops).
  - Show inline error text in relevant panels/dialogs instead of popups.
  - Keep console logging for diagnostics.
- `src/pages/CreatorProfile.tsx`
  - Remove `useToast`.
  - Keep optimistic follow/unfollow UI updates; on failure revert optimistic state and show inline small status near follow button.
- `src/components/account/AccountSettingsTab.tsx`
  - Remove `useToast`.
  - Add inline password form status:
    - validation error text under fields
    - success text after save
    - failure text under submit button
- `src/components/admin/guide/AppGuideTool.tsx`
  - Remove hook toast import.
  - For save/delete/rename failures, surface inline status in header/sidebar area.
  - For save success, use transient inline “Saved” label near save control rather than toast.

B) Sonner consumers
- `src/components/chronicle/ChatInterfaceTab.tsx`
  - Remove all `toast.success/error`.
  - Use existing loading flags and existing visual state transitions as primary UX feedback.
  - For hard errors (e.g., continue/regenerate/generate image), set component-level error banner/message region in chat panel.
- `src/components/chronicle/CharactersTab.tsx`
  - Remove toasts for enhance/upload/generate.
  - Use existing per-field loading (`enhancingField`, `isUploading`, `isGeneratingImg`) and inline helper/error text near the affected field/avatar panel.
- `src/components/chronicle/WorldTab.tsx`
  - Remove toasts for enhance/upload/generate.
  - Use inline status text inside section cards (world core, cover, scenes) plus existing loading indicators.
- `src/components/chronicle/CharacterEditModal.tsx`
  - Remove toasts from deep scan, avatar upload/generation, name-change notices.
  - Add modal-local status area:
    - info (“No messages to analyze”, “No updates found”) as inline muted text
    - errors in red text
    - success as subtle inline confirmation text.
- `src/components/chronicle/ImageLibraryTab.tsx`
  - Remove toasts for folder/image/tag/title actions.
  - Add section-level inline status strip in folder grid/detail views and modal footer feedback.
- `src/components/chronicle/MemoriesModal.tsx`
  - Replace toast validation with inline validation text directly under input/editor.
  - Replace success/failure toasts with small status text in modal footer.
- `src/components/chronicle/GalleryHub.tsx`
  - Remove toasts for like/save/unpublish.
  - Keep optimistic updates; on error show inline message in toolbar/detail modal.
- `src/components/chronicle/ScenarioHub.tsx`
  - Remove unpublish toasts; show inline modal status/error.
- `src/components/chronicle/ShareScenarioModal.tsx`
  - Remove toasts for publish/unpublish.
  - Use existing `isPublishing` and add inline success/error text below action buttons.
- `src/components/admin/ImageGenerationTool.tsx`
  - Remove toasts for save/upload.
  - Add per-card inline status (saved/error) tied to each style draft row.

5) Prevent regressions by adding a strict lint/policy checkpoint
- Add a simple repository-level check (or documented grep rule) used before merge:
  - no `toast` imports/usages in `src/`
  - no `useToast` usage
- Optional: eslint restricted-imports rule to block:
  - `'sonner'`
  - `'@/hooks/use-toast'`
  - `'@/components/ui/use-toast'`
  - `'@/components/ui/toast'`
  - `'@/components/ui/toaster'`
This makes “never add toasts” enforceable, not just convention.

6) Validation checklist after implementation
- Code-level:
  - Search returns zero matches for toast infrastructure/imports/usages.
- UX-level:
  - Critical flows still show actionable feedback:
    - Auth failures and success transitions
    - Save/publish/upload errors
    - AI enhance/deep-scan outcomes
    - Image library CRUD and metadata edits
- Stability:
  - No unresolved imports after removing toast files.
  - App root renders without toaster components.

Risk and mitigation
- Risk: removing toasts can hide feedback in some flows.
- Mitigation: every removed toast call gets one of:
  - explicit inline status message
  - existing loading/disabled state confirmation
  - visible data-state mutation confirmation
  - console.error for debugging.

No backend migration needed
- This request is frontend feedback-policy cleanup only; no database/auth schema changes are required.

Execution order
1. Remove app-level toasters.
2. Remove all toast imports/calls in feature files with inline replacements.
3. Remove toast infra files once references are gone.
4. Run final project-wide toast search + fix stragglers.
5. Verify main user flows for feedback visibility and no popup notifications.
