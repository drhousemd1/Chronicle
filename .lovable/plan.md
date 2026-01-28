
# Enable Global Spell Check for All Text Inputs

## Overview

This plan enables browser spell checking globally across all text input fields in the application by updating the core UI components. This means any current and future text inputs will automatically have spell checking enabled.

## Components to Update

The application uses two sets of text input components:

| Component | Location | Usage |
|-----------|----------|-------|
| `Input` | `src/components/chronicle/UI.tsx` | Character names, scenario titles, custom inputs throughout the Chronicle app |
| `TextArea` | `src/components/chronicle/UI.tsx` | Chat input, character descriptions, backstories, world details |
| `Input` | `src/components/ui/input.tsx` | Auth forms, general form inputs |
| `Textarea` | `src/components/ui/textarea.tsx` | General multiline text inputs |

## Implementation

### File 1: `src/components/chronicle/UI.tsx`

**Input component** - Add `spellCheck={true}` to the native input element:

```typescript
<input
  value={value}
  onChange={(e) => onChange(e.target.value)}
  placeholder={placeholder}
  spellCheck={true}  // NEW
  className={...}
/>
```

**TextArea component** - Add `spellCheck={true}` to the native textarea element:

```typescript
<textarea
  ref={ref}
  value={value}
  onChange={(e) => onChange(e.target.value)}
  onKeyDown={onKeyDown}
  placeholder={placeholder}
  rows={rows}
  spellCheck={true}  // NEW
  className={...}
/>
```

### File 2: `src/components/ui/input.tsx`

Add `spellCheck={true}` to the native input element (before spreading props so it can be overridden if needed):

```typescript
<input
  type={type}
  spellCheck={true}  // NEW - default enabled
  className={cn(...)}
  ref={ref}
  {...props}
/>
```

### File 3: `src/components/ui/textarea.tsx`

Add `spellCheck={true}` to the native textarea element:

```typescript
<textarea
  spellCheck={true}  // NEW - default enabled
  className={cn(...)}
  ref={ref}
  {...props}
/>
```

## Why This Works

By adding `spellCheck={true}` directly in the component definitions:

- All existing usages automatically get spell checking
- Any new inputs added in the future will have spell checking by default
- No need to update individual component usages throughout the codebase
- For the shadcn components, placing it before `{...props}` allows override if ever needed

## Expected Result

All text input fields across the entire application will show:
- Red squiggly underline on misspelled words
- Right-click context menu with spelling suggestions
- Ability to add words to personal dictionary

This applies to:
- Chat input box
- Character name and description fields
- World/scenario text areas
- Auth form inputs
- Any other text fields in the app

## Files to Modify

| File | Change |
|------|--------|
| `src/components/chronicle/UI.tsx` | Add `spellCheck={true}` to Input and TextArea |
| `src/components/ui/input.tsx` | Add `spellCheck={true}` to Input |
| `src/components/ui/textarea.tsx` | Add `spellCheck={true}` to Textarea |
