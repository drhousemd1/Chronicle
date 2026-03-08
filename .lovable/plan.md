

# Plan: Add "App Style Restructuring Project" Admin Tool

## File: `src/pages/Admin.tsx`

### 1. Add new tool to `DEFAULT_TOOLS` array
Add a new entry after `style_guide`:
```ts
{
  id: 'style_restructuring',
  title: 'App Style Restructuring Project',
  description: 'Style restructuring workspace',
}
```

### 2. Add conditional render for the new tool
Before the hub return, add a block like the existing tool renders:
```tsx
if (activeTool === 'style_restructuring') {
  return <div className="w-full h-full bg-white" />;
}
```

This gives it a clickable card on the admin hub grid and renders a blank white page when opened.

