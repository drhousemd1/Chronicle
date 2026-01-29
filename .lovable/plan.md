
## What’s actually broken (root cause)

All the “Upload Image” / “Upload Scene” dropdown buttons use Radix UI’s `DropdownMenuTrigger` with `asChild`.

When `asChild` is used, Radix injects important props into the child element (things like `onPointerDown`, `onKeyDown`, `aria-expanded`, etc.) so it can open/close the menu.

Your custom `Button` component in `src/components/chronicle/UI.tsx` currently **does not forward unknown props to the underlying `<button>`**, because it only accepts `children/onClick/variant/disabled/className` and ignores everything else.

So Radix is trying to pass “open the menu” handlers into `<Button />`, but `<Button />` drops them, which makes the dropdown appear completely unresponsive (no menu, no errors).

This matches your symptom perfectly: “nothing happens when clicking any of them on any page”.

---

## Fix strategy

### Goal
Make the custom `Button` behave like a real HTML `<button>` from Radix’s perspective:

- supports `ref` (already done)
- supports “all normal button props” and **spreads them onto the real `<button>`**
- keeps your existing `variant` styling

---

## Changes to implement

### 1) Update `ButtonProps` to accept native button props
**File:** `src/components/chronicle/UI.tsx`

- Change `ButtonProps` so it extends `React.ButtonHTMLAttributes<HTMLButtonElement>`
- Keep your custom `variant?: ButtonVariant` prop

This ensures `Button` can receive Radix-injected props like `onPointerDown`, `onKeyDown`, `aria-*`, `data-*`, etc.

### 2) Spread the remaining props onto the `<button>`
**File:** `src/components/chronicle/UI.tsx`

- In the `forwardRef` component, destructure:
  - `variant`, `className`, `disabled`, `type`, `children`
  - and collect the rest into `...props`
- Render:
  - `<button ref={ref} {...props} disabled={disabled} type={type ?? "button"} className={...}>`

Key detail: **the spread must actually reach the DOM `<button>`**, not be swallowed by the component.

### 3) (Optional but recommended) Restore `Button.displayName`
**File:** `src/components/chronicle/UI.tsx`

- Add `Button.displayName = "Button";`
This helps debugging and avoids some confusing stack traces.

---

## Why this will fix all 3 broken upload areas at once

Once `Button` correctly forwards Radix’s injected event handlers:

- `UploadSourceMenu` will open its dropdown again (Cover Image, Scene Gallery, Character Builder)
- Any other Radix “asChild + Button” usage (like BackgroundPickerModal, SidebarThemeModal) will also work reliably

No changes should be needed inside `UploadSourceMenu`, `WorldTab`, or `CharactersTab` beyond this (unless we uncover a second issue after the dropdowns work again).

---

## Testing checklist (end-to-end)

After implementing the above, verify in the UI:

1. Scenario Builder → Cover Image → click “Upload Image” → dropdown opens
2. Choose “From Device” → file picker opens
3. Choose “From Library” → ImageLibraryPickerModal opens
4. Scenario Builder → Scene Gallery → “+ Upload Scene” → dropdown opens → both options work
5. Character Builder → Avatar → “Upload Image” → dropdown opens → both options work

---

## Files involved

- **Modify:** `src/components/chronicle/UI.tsx` (primary fix)
- **No changes expected:** `src/components/chronicle/UploadSourceMenu.tsx`, `src/components/chronicle/WorldTab.tsx`, `src/components/chronicle/CharactersTab.tsx` (unless testing shows an additional issue)

---

## Notes / edge cases to watch for

- If any place relies on the Button always being `type="button"`, keeping the default `type="button"` is important to avoid accidental form submits.
- If any buttons pass `className` via props, we must merge it (not overwrite).
- If something still “does nothing” after this, the next likely culprit would be a parent overlay with `pointer-events: none/auto` or a disabled state always being true—but first we should restore Radix triggers properly, because right now they can’t work by design.
