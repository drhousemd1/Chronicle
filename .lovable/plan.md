

## Fix: Sidebar Character Cards Not Adapting to Background Brightness

### Root Cause
The `analyzeImageBrightness` function uses `canvas.getImageData()` which throws a silent `SecurityError` when the image is cross-origin (from storage). There's no `try/catch`, so the function crashes silently after `img.onload` fires, leaving `sidebarBgIsLight` stuck at its default value (`true`), which always applies dark card styling.

### Fix

**File: `src/components/chronicle/ChatInterfaceTab.tsx`** (lines 570-595)

Wrap the canvas pixel analysis in a `try/catch`. On CORS failure, fall back to analyzing the image URL or use a heuristic:

```ts
const analyzeImageBrightness = useCallback((imageUrl: string) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const sampleSize = 50;
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      
      ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
      const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
      const data = imageData.data;
      
      let totalLuminosity = 0;
      const pixelCount = data.length / 4;
      
      for (let i = 0; i < data.length; i += 4) {
        totalLuminosity += (0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]);
      }
      
      setSidebarBgIsLight((totalLuminosity / pixelCount) > 128);
    } catch (e) {
      // CORS tainted canvas — default to dark background assumption (light cards)
      console.warn('Could not analyze sidebar background brightness (CORS):', e);
      setSidebarBgIsLight(false);
    }
  };
  img.src = imageUrl;
}, []);
```

The key change is:
1. **`try/catch`** around the canvas pixel read to handle CORS `SecurityError`
2. **Fallback to `false`** (dark background assumption → light frosted cards) since most user-uploaded sidebar backgrounds tend to be dark/atmospheric

This is a one-line-scope fix — only the `analyzeImageBrightness` callback changes.

