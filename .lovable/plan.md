

## Plan: Upload Original Quality Images to Storage

### Problem
`compressAndUpload` resizes images to 400x400 AND reduces JPEG quality. The user wants full quality preserved — just fast loading.

### Approach
Skip `compressAndUpload` entirely. Instead, upload the raw image blob directly to the `backgrounds` storage bucket (which is already CDN-served). This preserves 100% original quality while getting fast loading via CDN delivery (far faster than base64 embedded in JSON).

### Change

**File**: `src/components/chronicle/CharactersTab.tsx`, lines 746-761

Replace the `compressAndUpload` call with a direct upload to storage:

```tsx
// Upload original quality image to storage
if (imageToSave && imageToSave.src.startsWith('data:') && user) {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const response = await fetch(imageToSave.src);
    const blob = await response.blob();
    const filename = `${user.id}/nav-btn-${editingNavKey}-${Date.now()}.${blob.type.includes('png') ? 'png' : 'jpg'}`;
    const { error } = await supabase.storage
      .from('backgrounds')
      .upload(filename, blob, { upsert: true, contentType: blob.type });
    if (error) throw error;
    const { data } = supabase.storage.from('backgrounds').getPublicUrl(filename);
    imageToSave = { ...imageToSave, src: data.publicUrl };
  } catch (e) {
    console.error('Failed to upload nav button image:', e);
  }
}
```

This preserves the original image exactly as uploaded. The CDN handles fast delivery. No resizing, no quality reduction.

### Why this is fast
- Base64 in JSON = bloated DB reads, no caching
- CDN URL = browser caches it, served from edge nodes near the user
- That alone is the performance win — not lossy compression

