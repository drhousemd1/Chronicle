
# Interface Settings Modal - Light Theme Implementation

## Overview

This plan implements the Interface Settings modal and Dynamic Text toggle as previously planned, but styles the modal to match the Scenario Builder's light, clean aesthetic rather than the dark/bluish theme of the Memories modal.

---

## Styling Comparison

### Memories Modal (current dark style - NOT using)
- Background: `bg-slate-900 border-slate-700`
- Text: `text-white`, `text-slate-400`
- Accents: `text-purple-400`, `bg-purple-600`
- Containers: `bg-slate-800/50`

### Scenario Builder (target style - USING)
- Background: `bg-white`
- Shadows: `shadow-[0_12px_32px_-2px_rgba(0,0,0,0.15)]`
- Borders: `ring-1 ring-slate-900/5`, `border-slate-100`
- Headings: `text-slate-900 font-black uppercase tracking-tight`
- Labels: `text-xs font-bold uppercase text-slate-500`
- Descriptions: `text-sm text-slate-500`
- Section dividers: `border-b border-slate-100`

---

## Visual Design

```text
+-------------------------------------------------------+
|  [Settings Icon] Interface Settings              [X]  |
+-------------------------------------------------------+
|                                                       |
|  DISPLAY                                              |
|  ---------------------------------------------------- |
|                                                       |
|  Show Backgrounds                              [ON]   |
|  Display scene images behind the chat.                |
|                                                       |
|  Transparent Bubbles                           [OFF]  |
|  Make message bubbles semi-transparent to see         |
|  backgrounds through them.                            |
|                                                       |
|  Dark Mode                                     [OFF]  |
|  Use a darker color scheme for the chat               |
|  interface.                                           |
|                                                       |
|  Offset Bubbles                                [OFF]  |
|  Align user messages to the right like a              |
|  messaging app.                                       |
|                                                       |
|  Dynamic Text                                  [ON]   |
|  Apply visual styling to different text types         |
|  (dialogue, actions, thoughts). When off, all text    |
|  appears in a consistent white style like a book.     |
|                                                       |
|  AI BEHAVIOR                                          |
|  ---------------------------------------------------- |
|                                                       |
|  Proactive Character Discovery                 [ON]   |
|  When enabled, the AI may introduce characters        |
|  from established media (books, movies) at            |
|  story-appropriate moments.                           |
|                                                       |
|  ---------------------------------------------------- |
|  Backgrounds will automatically change based on       |
|  the story context if scene images are tagged.        |
|                                                       |
+-------------------------------------------------------+
```

---

## Technical Implementation

### Step 1: Update Type Definitions

**File: `src/types.ts`**

Add `dynamicText` to the uiSettings type:

```typescript
uiSettings?: {
  showBackgrounds: boolean;
  transparentBubbles: boolean;
  darkMode: boolean;
  offsetBubbles?: boolean;
  proactiveCharacterDiscovery?: boolean;
  dynamicText?: boolean;  // NEW - defaults to true
};
```

### Step 2: Update Data Defaults

**File: `src/utils.ts`**

Add default value for `dynamicText` in both `createDefaultScenarioData` and `normalizeScenarioData`:

```typescript
uiSettings: {
  showBackgrounds: true,
  transparentBubbles: false,
  darkMode: false,
  proactiveCharacterDiscovery: true,
  dynamicText: true  // NEW - defaults to enabled
}
```

### Step 3: Create Interface Settings Modal

**File: `src/components/chronicle/ChatInterfaceTab.tsx`**

Replace the current popover with a Dialog modal using Scenario Builder styling:

**Modal Container:**
```typescript
<DialogContent className="sm:max-w-md bg-white border-slate-200 shadow-[0_12px_32px_-2px_rgba(0,0,0,0.15)]">
```

**Header:**
```typescript
<DialogHeader className="border-b border-slate-100 pb-4">
  <DialogTitle className="flex items-center gap-2 text-lg font-black text-slate-900 uppercase tracking-tight">
    <Settings className="w-5 h-5" />
    Interface Settings
  </DialogTitle>
</DialogHeader>
```

**Section Headers:**
```typescript
<h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Display</h3>
```

**Setting Rows:**
```typescript
<div className="flex items-start justify-between gap-4 py-3 border-b border-slate-50">
  <div className="flex-1">
    <p className="text-sm font-bold text-slate-900">Show Backgrounds</p>
    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
      Display scene images behind the chat.
    </p>
  </div>
  <input type="checkbox" className="accent-blue-500 w-4 h-4 mt-0.5" />
</div>
```

**Footer Note:**
```typescript
<p className="text-xs text-slate-400 border-t border-slate-100 pt-4 mt-4">
  Backgrounds will automatically change based on the story context if scene images are tagged in the gallery.
</p>
```

### Step 4: Update FormattedMessage Component

**File: `src/components/chronicle/ChatInterfaceTab.tsx`**

Update `FormattedMessage` to accept a `dynamicText` prop:

```typescript
const FormattedMessage: React.FC<{ text: string; dynamicText?: boolean }> = ({ 
  text, 
  dynamicText = true 
}) => {
  // ... existing token parsing logic ...

  return (
    <div className="whitespace-pre-wrap">
      {tokens.map((token, i) => {
        if (!dynamicText) {
          // Book-style: all white, consistent font, symbols hidden
          return (
            <span key={i} className="text-white font-medium">
              {token.content}
            </span>
          );
        }
        
        // Current dynamic styling behavior
        if (token.type === 'speech') {
          return <span key={i} className="text-white font-medium">"{token.content}"</span>;
        }
        if (token.type === 'action') {
          return <span key={i} className="text-slate-400 italic">{token.content}</span>;
        }
        if (token.type === 'thought') {
          return (
            <span key={i} className="text-indigo-200/90 text-sm italic font-light" 
              style={{ textShadow: '...' }}>
              {token.content}
            </span>
          );
        }
        return <span key={i} className="text-slate-300">{token.content}</span>;
      })}
    </div>
  );
};
```

### Step 5: Pass dynamicText Setting to FormattedMessage

Update all instances where `FormattedMessage` is called to pass the setting:

```typescript
<FormattedMessage 
  text={segment.content} 
  dynamicText={appData.uiSettings?.dynamicText !== false} 
/>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/types.ts` | Add `dynamicText?: boolean` to uiSettings |
| `src/utils.ts` | Add default value for `dynamicText` in both functions |
| `src/components/chronicle/ChatInterfaceTab.tsx` | Replace popover with light-themed modal, update FormattedMessage, update props interface |

---

## Color Palette Reference (Scenario Builder Style)

| Element | Class |
|---------|-------|
| Modal background | `bg-white` |
| Modal shadow | `shadow-[0_12px_32px_-2px_rgba(0,0,0,0.15)]` |
| Modal border | `border-slate-200` or `ring-1 ring-slate-900/5` |
| Section header | `text-xs font-black text-slate-400 uppercase tracking-widest` |
| Setting label | `text-sm font-bold text-slate-900` |
| Description text | `text-xs text-slate-500` |
| Divider lines | `border-slate-100` or `border-slate-50` |
| Checkbox accent | `accent-blue-500` |
| Footer note | `text-xs text-slate-400` |

---

## Expected Behavior

1. Clicking "Interface" opens a clean, light-themed modal matching the Scenario Builder aesthetic
2. All existing settings function identically
3. New "Dynamic Text" toggle defaults to ON (current styling preserved)
4. When Dynamic Text is OFF:
   - All text renders in white with consistent font weight
   - Symbols (asterisks, quotes, parentheses) are hidden
   - No color variation or glow effects
   - Clean, book-like reading experience
5. Settings persist to database with other uiSettings
