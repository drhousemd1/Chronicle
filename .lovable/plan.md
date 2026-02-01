
# Dynamic Exit Scenario Text Color Based on Background Brightness

## Summary

Add automatic text color switching for the "Exit Scenario" button based on whether the uploaded sidebar background is light or dark. Simple binary choice: black text for light backgrounds, white text for dark backgrounds.

---

## Implementation

### 1. Add State for Background Brightness

Add a new state variable near the other sidebar-related state (around line 360):

```typescript
const [sidebarBgIsLight, setSidebarBgIsLight] = useState<boolean>(true);
```

Default to `true` (black text) since no background = white sidebar = needs black text.

---

### 2. Add Brightness Analysis Function

Add a `useCallback` function that samples an image and determines if it's light or dark:

```typescript
const analyzeImageBrightness = useCallback((imageUrl: string) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Sample at small size for speed
    const sampleSize = 50;
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    
    ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
    const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
    const data = imageData.data;
    
    // Calculate average luminosity
    let totalLuminosity = 0;
    const pixelCount = data.length / 4;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Standard luminosity formula
      totalLuminosity += (0.299 * r + 0.587 * g + 0.114 * b);
    }
    
    const avgLuminosity = totalLuminosity / pixelCount;
    // 128 is midpoint - above = light, below = dark
    setSidebarBgIsLight(avgLuminosity > 128);
  };
  img.src = imageUrl;
}, []);
```

---

### 3. Add Effect to Trigger Analysis

Add a `useEffect` that runs when the sidebar background URL changes:

```typescript
useEffect(() => {
  if (selectedSidebarBgUrl) {
    analyzeImageBrightness(selectedSidebarBgUrl);
  } else {
    // No background = white sidebar = needs black text
    setSidebarBgIsLight(true);
  }
}, [selectedSidebarBgUrl, analyzeImageBrightness]);
```

---

### 4. Update Exit Scenario Button

Change the button from static slate color to dynamic black/white:

**Current (line 2201-2207):**
```tsx
<button
  onClick={onBack}
  className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest hover:text-blue-600 transition-colors"
>
```

**Updated:**
```tsx
<button
  onClick={onBack}
  className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors ${
    sidebarBgIsLight 
      ? 'text-black hover:text-blue-600' 
      : 'text-white hover:text-blue-300'
  }`}
>
```

---

## How It Works

1. User uploads a sidebar background image
2. `selectedSidebarBgUrl` updates, triggering the `useEffect`
3. Image is drawn to a tiny hidden canvas (50x50 pixels)
4. We calculate the average brightness of all pixels
5. If average > 128 (midpoint), it's a light image → black text
6. If average <= 128, it's a dark image → white text
7. The Exit Scenario button updates accordingly

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/chronicle/ChatInterfaceTab.tsx` | Add state, brightness analyzer, effect, and dynamic button class |

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| No background | Black text (default) |
| Very light image | Black text |
| Very dark image | White text |
| Mixed image | Uses average brightness |

As you said - it won't be perfect 100% of the time, but it'll work for the vast majority of cases. Users can always pick a different image if the contrast doesn't work well.
