

# Fix: Bottom Padding on Text Input Area

## Problem

The textarea has `min-h-[96px]` which forces it taller than its actual content needs. Since the text content sits at the top of the textarea, the unused vertical space pools at the bottom, making it look like the outer wrapper has thicker bottom padding than top/left/right. The outer `p-2` is actually uniform -- the illusion comes from inside the textarea itself.

## Solution

Remove the `min-h-[96px]` constraint from the textarea. Instead, rely on `rows={3}` to set the default height. The auto-resize ref will expand it when the user types more. This way the textarea fits its content snugly and the `p-2` wrapper padding looks truly uniform on all sides.

## Technical Details

**File:** `src/components/chronicle/ChatInterfaceTab.tsx`, line 3147

**Change:** Remove `min-h-[96px]` from the textarea's className string.

Before:
```
className="w-full bg-[#1e2028] text-white ... resize-none overflow-hidden min-h-[96px] focus:ring-1 ..."
```

After:
```
className="w-full bg-[#1e2028] text-white ... resize-none overflow-hidden focus:ring-1 ..."
```

The `rows={3}` attribute on line 3144 will still provide a reasonable default height without forcing extra empty space at the bottom.

