

# Phase 1: Chat Settings Modal Redesign

## Overview

This plan implements UI improvements to the chat interface settings:
1. Rename "Interface" button to "Chat Settings"
2. Expand the modal to a wider, more square layout
3. Add 2-column grid layout for toggles with section headings
4. Implement a custom `LabeledToggle` component with Off/On labels (reusable for future use)

The AI behavior fixes (5-7) will be addressed in Phase 2.

---

## Documentation Note (Previous Issue)

Before making changes, I'll add a note to `.lovable/plan.md` documenting the BYOK routing issue we investigated for future reference.

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `.lovable/plan.md` | Modify | Add documentation note about BYOK routing investigation |
| `src/components/ui/labeled-toggle.tsx` | Create | New reusable toggle component with Off/On labels |
| `src/components/chronicle/ChatInterfaceTab.tsx` | Modify | Rename button, update modal layout and toggles |

---

## Implementation Details

### 1. Documentation Note in `.lovable/plan.md`

Append a new section documenting the BYOK routing issue:

```markdown
---

# Investigation Notes

## BYOK Gateway Routing Issue (January 2026)

**Status**: Unresolved - Could not reproduce

**Symptoms**: 
- Chat interface failed to generate AI responses during NSFW testing
- Error toast/overlay appeared briefly (possibly with Lovable logo)
- User was using Grok model, not Gemini

**Suspected Cause**:
The `extract-memory-events` and `generate-cover-image` edge functions may be hardcoded to use Gemini/Lovable Gateway instead of routing through the user's selected model (Grok). When NSFW content is processed, Gemini's content policy would block it.

**Affected Files** (to review if issue recurs):
- `supabase/functions/extract-memory-events/index.ts` - Needs BYOK gateway routing
- `supabase/functions/generate-cover-image/index.ts` - Hardcodes Gemini image model

**Resolution**: If issue recurs, add `getGateway()` routing logic to these functions similar to `chat/index.ts` and `extract-character-updates/index.ts`.
```

---

### 2. Create `src/components/ui/labeled-toggle.tsx`

A new reusable toggle component matching the mockup design:

```typescript
import * as React from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface LabeledToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  locked?: boolean;
  className?: string;
}

const LabeledToggle = React.forwardRef<HTMLButtonElement, LabeledToggleProps>(
  ({ checked, onCheckedChange, disabled = false, locked = false, className }, ref) => {
    const isDisabled = disabled || locked;
    
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={isDisabled}
        onClick={() => !isDisabled && onCheckedChange(!checked)}
        className={cn(
          "inline-flex items-center gap-2 select-none",
          isDisabled && "cursor-not-allowed opacity-70",
          className
        )}
      >
        {/* Off label */}
        <span className={cn(
          "text-sm font-semibold transition-colors",
          checked ? "text-slate-400" : "text-slate-900"
        )}>
          Off
        </span>
        
        {/* Toggle track */}
        <div className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "bg-blue-500" : "bg-slate-300"
        )}>
          {/* Toggle thumb */}
          <div className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5"
          )} />
        </div>
        
        {/* On label */}
        <span className={cn(
          "text-sm font-semibold transition-colors",
          checked ? "text-blue-500" : "text-slate-400"
        )}>
          On
        </span>
        
        {/* Lock icon for locked toggles */}
        {locked && (
          <Lock className="w-3.5 h-3.5 text-slate-400" />
        )}
      </button>
    );
  }
);
LabeledToggle.displayName = "LabeledToggle";

export { LabeledToggle };
```

**Features:**
- `checked` / `onCheckedChange` - Standard toggle API
- `disabled` - Prevents interaction (grayed out)
- `locked` - Forced on with lock icon (for critical settings)
- Off text = black when off, gray when on
- On text = blue when on, gray when off
- Track = blue when on, gray when off

---

### 3. Update `ChatInterfaceTab.tsx`

#### 3.1 Rename Button (Line ~2484)

Change from:
```tsx
>
  Interface
</Button>
```

To:
```tsx
>
  <Settings className="w-4 h-4" />
  Chat Settings
</Button>
```

#### 3.2 Update Modal Layout (Lines ~2612-2733)

**Before**: Narrow modal (`sm:max-w-md`), single-column checkboxes

**After**: Wider modal (`max-w-2xl`), 2-column grid, section headings, LabeledToggle components

```tsx
{/* Chat Settings Modal */}
<Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
  <DialogContent className="max-w-2xl bg-white border-slate-200 shadow-[0_12px_32px_-2px_rgba(0,0,0,0.15)]">
    <DialogHeader className="border-b border-slate-100 pb-4">
      <DialogTitle className="flex items-center gap-2 text-lg font-black text-slate-900 uppercase tracking-tight">
        <Settings className="w-5 h-5" />
        Chat Settings
      </DialogTitle>
    </DialogHeader>
    
    <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto">
      {/* Interface Settings Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
          Interface Settings
        </h3>
        
        {/* 2-column grid for toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Show Backgrounds */}
          <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl">
            <span className="text-sm font-semibold text-slate-700">Show Background</span>
            <LabeledToggle
              checked={appData.uiSettings?.showBackgrounds ?? false}
              onCheckedChange={(v) => handleUpdateUiSettings({ showBackgrounds: v })}
            />
          </div>
          
          {/* Transparent Bubbles */}
          <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl">
            <span className="text-sm font-semibold text-slate-700">Transparent Bubbles</span>
            <LabeledToggle
              checked={bubblesTransparent}
              onCheckedChange={(v) => handleUpdateUiSettings({ transparentBubbles: v })}
            />
          </div>
          
          {/* Dark Mode */}
          <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl">
            <span className="text-sm font-semibold text-slate-700">Dark Mode</span>
            <LabeledToggle
              checked={appData.uiSettings?.darkMode ?? false}
              onCheckedChange={(v) => handleUpdateUiSettings({ darkMode: v })}
            />
          </div>
          
          {/* Offset Bubbles */}
          <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl">
            <span className="text-sm font-semibold text-slate-700">Offset Bubbles</span>
            <LabeledToggle
              checked={offsetBubbles}
              onCheckedChange={(v) => handleUpdateUiSettings({ offsetBubbles: v })}
            />
          </div>
          
          {/* Dynamic Text - spans full width for longer description */}
          <div className="md:col-span-2 flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl">
            <span className="text-sm font-semibold text-slate-700">Dynamic Text</span>
            <LabeledToggle
              checked={dynamicText}
              onCheckedChange={(v) => handleUpdateUiSettings({ dynamicText: v })}
            />
          </div>
        </div>
      </div>
      
      {/* Visual Divider */}
      <div className="border-t border-slate-200" />
      
      {/* AI Behavior Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
          AI Behavior
        </h3>
        
        <div className="grid grid-cols-1 gap-4">
          {/* Proactive Character Discovery */}
          <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl">
            <div className="flex-1">
              <span className="text-sm font-semibold text-slate-700">Proactive Character Discovery</span>
              <p className="text-xs text-slate-500 mt-0.5">
                AI may introduce characters from established media at story-appropriate moments.
              </p>
            </div>
            <LabeledToggle
              checked={appData.uiSettings?.proactiveCharacterDiscovery !== false}
              onCheckedChange={(v) => handleUpdateUiSettings({ proactiveCharacterDiscovery: v })}
            />
          </div>
        </div>
      </div>
      
      {/* Footer Note */}
      <p className="text-xs text-slate-400 border-t border-slate-100 pt-4">
        Backgrounds will automatically change based on the story context if scene images are tagged in the gallery.
      </p>
    </div>
  </DialogContent>
</Dialog>
```

---

## Visual Layout (ASCII Mockup)

```text
┌─────────────────────────────────────────────────────────────────┐
│  ⚙  CHAT SETTINGS                                          [X] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  INTERFACE SETTINGS                                             │
│  ┌──────────────────────────┐  ┌──────────────────────────┐     │
│  │ Show Background          │  │ Transparent Bubbles      │     │
│  │          Off ●━━━━ On    │  │          Off ━━━━● On    │     │
│  └──────────────────────────┘  └──────────────────────────┘     │
│  ┌──────────────────────────┐  ┌──────────────────────────┐     │
│  │ Dark Mode                │  │ Offset Bubbles           │     │
│  │          Off ━━━━● On    │  │          Off ━━━━● On    │     │
│  └──────────────────────────┘  └──────────────────────────┘     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Dynamic Text                                            │    │
│  │                                    Off ●━━━━ On         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ──────────────────────────────────────────────────────────     │
│                                                                 │
│  AI BEHAVIOR                                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Proactive Character Discovery                           │    │
│  │ AI may introduce characters from established media...   │    │
│  │                                    Off ━━━━● On         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ──────────────────────────────────────────────────────────     │
│  Backgrounds will automatically change based on story...        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Notes

1. **Scrollable Content**: Added `max-h-[70vh] overflow-y-auto` to support future additional options
2. **Responsive Grid**: Uses `grid-cols-1 md:grid-cols-2` so it collapses to single column on mobile
3. **Reusable Component**: `LabeledToggle` can be imported and used anywhere else in the app
4. **Locked State**: The `locked` prop on `LabeledToggle` is ready for critical settings that shouldn't be changed (like formatting rules)
5. **Button Icon**: Added Settings icon to "Chat Settings" button for visual consistency with other buttons

---

## Files Summary

| File | Lines Changed | Description |
|------|---------------|-------------|
| `.lovable/plan.md` | +30 | Add BYOK investigation notes |
| `src/components/ui/labeled-toggle.tsx` | New (~60 lines) | Reusable toggle component |
| `src/components/chronicle/ChatInterfaceTab.tsx` | ~100 lines | Button rename + modal redesign |

---

## Next Steps (Phase 2)

After this phase is complete, we'll address the AI behavior issues (passive dialogue, thought-reading, etc.) by:
1. Adding new toggles to the AI Behavior section
2. Modifying the system prompt in `llm.ts` based on toggle states

