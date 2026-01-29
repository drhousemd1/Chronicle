
# Fix Upload Image Functionality - Implementation Plan

## Problem Identified

The upload buttons across the application are broken because the custom `Button` component in `UI.tsx` does not support React refs. This is required by Radix UI's dropdown menu system.

When you click the "Upload Image" or "Change Image" buttons, the dropdown menu should appear with options for "From Device" and "From Library" - but nothing happens because the dropdown can't attach to the button properly.

## Affected Areas

1. **Cover Image** in Scenario Builder - dropdown doesn't open
2. **Character Avatar** on Character Builder page - dropdown doesn't open  
3. **Scene Gallery** - still using an old simple button (not the new upload menu)

## Solution

### Fix 1: Update the Button component to support refs

The custom `Button` component needs to be wrapped with `React.forwardRef` so that Radix UI dropdown triggers can attach to it properly.

**File**: `src/components/chronicle/UI.tsx`

Change from:
```tsx
export function Button({ ... }) {
  return <button ...>{children}</button>;
}
```

To:
```tsx
export const Button = React.forwardRef<
  HTMLButtonElement,
  { children?: React.ReactNode; onClick?: ...; variant?: ...; disabled?: boolean; className?: string }
>((props, ref) => {
  return <button ref={ref} ...>{children}</button>;
});
Button.displayName = 'Button';
```

### Fix 2: Add UploadSourceMenu to Scene Gallery

The Scene Gallery section in `WorldTab.tsx` is still using a plain button instead of the new `UploadSourceMenu` component. Update it to match the cover image and character avatar sections.

**File**: `src/components/chronicle/WorldTab.tsx`

Change from:
```tsx
<Button 
  variant="primary" 
  onClick={() => fileInputRef.current?.click()}
  disabled={isUploading}
>
  {isUploading ? "Uploading..." : "+ Upload Scene"}
</Button>
```

To:
```tsx
<UploadSourceMenu
  onUploadFromDevice={() => fileInputRef.current?.click()}
  onSelectFromLibrary={(imageUrl) => {
    // Create a new scene from the library image
    const newScene = {
      id: uuid(),
      url: imageUrl,
      tags: [],
      createdAt: now()
    };
    onUpdateScenes([newScene, ...scenes]);
    setEditingScene(newScene);
    toast.success('Scene added from library');
  }}
  disabled={isUploading}
  isUploading={isUploading}
  label="+ Upload Scene"
  variant="primary"
/>
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/UI.tsx` | Wrap `Button` component with `React.forwardRef` |
| `src/components/chronicle/WorldTab.tsx` | Replace Scene Gallery button with `UploadSourceMenu` |

## Why This Will Work

- Radix UI's `DropdownMenuTrigger` uses `asChild` to merge its props (including refs) with the child element
- When the child (our `Button`) can't accept refs, the dropdown fails silently
- By adding `forwardRef`, the ref is properly passed through, enabling the dropdown to function
- The Scene Gallery will also gain the "From Library" option, making it consistent with other upload areas

## Summary

This is a straightforward fix that requires updating the `Button` component to properly support refs, which is a React best practice for reusable components. Once fixed, all three upload locations will work correctly with the dropdown menu showing "From Device" and "From Library" options.
