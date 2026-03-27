import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';

import { STANDARD_RATIOS, getClosestRatio, AspectRatioIcon } from './AspectRatioUtils';
import { Icons } from '@/constants';
import { Star, ArrowLeft, Trash2, Pencil, FolderOpen, Plus, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { FolderEditModal } from './FolderEditModal';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

import { supabase } from '@/integrations/supabase/client';
import { resizeImage, uuid } from '@/utils';

import type { ImageFolder, LibraryImage } from './image-library-types';
export type { ImageFolder, LibraryImage } from './image-library-types';

interface ImageLibraryTabProps {
  userId: string | null;
  onFolderChange?: (inFolder: boolean, exitFn?: () => void) => void;
  searchQuery?: string;
  uploadRef?: React.MutableRefObject<(() => void) | null>;
}

export const ImageLibraryTab: React.FC<ImageLibraryTabProps> = ({ userId, onFolderChange, searchQuery = '', uploadRef }) => {
  const toTimestamp = (value: string | number | Date | null | undefined): number =>
    value ? new Date(value).getTime() : Date.now();

  const [folders, setFolders] = useState<ImageFolder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<ImageFolder | null>(null);
  const [folderImages, setFolderImages] = useState<LibraryImage[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [editingFolder, setEditingFolder] = useState<ImageFolder | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [aspectRatios, setAspectRatios] = useState<Record<string, { label: string; orientation: 'portrait' | 'landscape' | 'square' }>>({});

  // Fetch guards
  const hasLoadedRef = useRef(false);
  const fetchInProgressRef = useRef(false);

  // Detect aspect ratios when folder images change
  useEffect(() => {
    if (!folderImages.length) { setAspectRatios({}); return; }
    const pending = new Map<string, { label: string; orientation: 'portrait' | 'landscape' | 'square' }>();
    let cancelled = false;
    let loaded = 0;
    folderImages.forEach((img) => {
      const el = new window.Image();
      el.crossOrigin = 'anonymous';
      el.onload = () => {
        if (cancelled) return;
        pending.set(img.id, getClosestRatio(el.naturalWidth, el.naturalHeight));
        loaded++;
        if (loaded === folderImages.length) {
          setAspectRatios(Object.fromEntries(pending));
        }
      };
      el.onerror = () => { loaded++; };
      el.src = img.imageUrl;
    });
    return () => { cancelled = true; };
  }, [folderImages]);
  const [lightboxImage, setLightboxImage] = useState<LibraryImage | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'folder' | 'image'; id: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Expose upload trigger via ref
  useEffect(() => {
    if (uploadRef) {
      uploadRef.current = () => fileInputRef.current?.click();
    }
    return () => {
      if (uploadRef) uploadRef.current = null;
    };
  }, [uploadRef]);

  // Escape key handler for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightboxImage) {
        setLightboxImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage]);

  const loadFolders = useCallback(async () => {
    if (!userId) return;
    if (fetchInProgressRef.current) return;
    fetchInProgressRef.current = true;
    
    try {
      const { data, error } = await (supabase.rpc as any)('get_folders_with_details');

      if (error) throw error;

      const foldersWithDetails = (data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        description: row.description || '',
        thumbnailImageId: row.thumbnail_image_id,
        thumbnailUrl: row.thumbnail_url,
        imageCount: Number(row.image_count) || 0,
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.updated_at).getTime(),
      } as ImageFolder));

      setFolders(foldersWithDetails);
      hasLoadedRef.current = true;
    } catch (e: any) {
      console.error('Failed to load folders:', e);
    } finally {
      setIsLoading(false);
      fetchInProgressRef.current = false;
    }
  }, [userId]);

  // Fetch folders on mount (once per userId)
  useEffect(() => {
    if (!userId) return;
    if (hasLoadedRef.current) return;
    loadFolders();
  }, [userId, loadFolders]);

  const loadFolderImages = async (folderId: string) => {
    setIsLoadingImages(true);
    try {
      const { data, error } = await supabase
        .from('library_images')
        .select('*')
        .eq('folder_id', folderId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFolderImages(
        (data || []).map((img: any) => ({
          id: img.id,
          userId: img.user_id,
          folderId: img.folder_id,
          imageUrl: img.image_url,
          filename: img.filename || '',
          title: img.title || '',
          isThumbnail: img.is_thumbnail || false,
          tags: img.tags || [],
          createdAt: new Date(img.created_at).getTime(),
        }))
      );
    } catch (e: any) {
      console.error('Failed to load images:', e);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('image_folders')
        .insert({
          user_id: userId,
          name: 'New Folder',
          description: '',
        })
        .select()
        .single();

      if (error) throw error;

      const newFolder: ImageFolder = {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        description: data.description || '',
        thumbnailImageId: null,
        thumbnailUrl: null,
        imageCount: 0,
        createdAt: toTimestamp(data.created_at),
        updatedAt: toTimestamp(data.updated_at),
      };

      setFolders((prev) => [newFolder, ...prev]);
      setEditingFolder(newFolder);
    } catch (e: any) {
      console.error('Failed to create folder:', e);
    }
  };

  const handleUpdateFolder = async (id: string, patch: { name?: string; description?: string }) => {
    try {
      const { error } = await supabase
        .from('image_folders')
        .update(patch)
        .eq('id', id);

      if (error) throw error;

      setFolders((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...patch, updatedAt: Date.now() } : f))
      );
      
      if (selectedFolder?.id === id) {
        setSelectedFolder((prev) => (prev ? { ...prev, ...patch } : null));
      }
    } catch (e: any) {
      console.error('Failed to update folder:', e);
    }
  };

  const handleDeleteFolder = async (id: string) => {
    setDeleteTarget({ type: 'folder', id });
  };

  const executeDeleteFolder = async (id: string) => {
    try {
      const { data: images } = await supabase
        .from('library_images')
        .select('image_url')
        .eq('folder_id', id);

      if (images && images.length > 0) {
        const filePaths = images.map((img) => {
          try {
            const url = new URL(img.image_url);
            const marker = '/object/public/image_library/';
            const idx = url.pathname.indexOf(marker);
            if (idx === -1) {
              console.warn('Could not extract storage path from:', img.image_url);
              return '';
            }
            return url.pathname.substring(idx + marker.length);
          } catch {
            console.warn('Invalid image URL:', img.image_url);
            return '';
          }
        }).filter(Boolean);

        if (filePaths.length > 0) {
          await supabase.storage.from('image_library').remove(filePaths);
        }
      }

      const { error } = await supabase
        .from('image_folders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFolders((prev) => prev.filter((f) => f.id !== id));
      if (selectedFolder?.id === id) {
        setSelectedFolder(null);
      }
    } catch (e: any) {
      console.error('Failed to delete folder:', e);
    }
  };

  const exitFolder = () => {
    setSelectedFolder(null);
    setFolderImages([]);
    loadFolders();
    onFolderChange?.(false);
  };

  const handleOpenFolder = (folder: ImageFolder) => {
    setSelectedFolder(folder);
    loadFolderImages(folder.id);
    onFolderChange?.(true, () => {
      setSelectedFolder(null);
      setFolderImages([]);
      loadFolders();
      onFolderChange?.(false);
    });
  };

  const handleUploadImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !userId || !selectedFolder) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const reader = new FileReader();
        await new Promise<void>((resolve, reject) => {
          reader.onload = async () => {
            try {
              const dataUrl = reader.result as string;
              const optimized = await resizeImage(dataUrl, 1920, 1080, 0.85);
              
              const response = await fetch(optimized);
              const blob = await response.blob();
              
              const filename = `${uuid()}-${Date.now()}.jpg`;
              const path = `${userId}/${selectedFolder.id}/${filename}`;
              
              const { error: uploadError } = await supabase.storage
                .from('image_library')
                .upload(path, blob, { contentType: 'image/jpeg' });

              if (uploadError) throw uploadError;

              const { data: { publicUrl } } = supabase.storage
                .from('image_library')
                .getPublicUrl(path);

              const { data: imgData, error: insertError } = await supabase
                .from('library_images')
                .insert({
                  user_id: userId,
                  folder_id: selectedFolder.id,
                  image_url: publicUrl,
                  filename: file.name,
                })
                .select()
                .single();

              if (insertError) throw insertError;

              setFolderImages((prev) => [
                {
                  id: imgData.id,
                  userId: imgData.user_id,
                  folderId: imgData.folder_id,
                  imageUrl: imgData.image_url,
                  filename: imgData.filename || '',
                  title: (imgData as any).title || '',
                  isThumbnail: false,
                  tags: imgData.tags || [],
                  createdAt: toTimestamp(imgData.created_at),
                },
                ...prev,
              ]);

              setFolders((prev) =>
                prev.map((f) =>
                  f.id === selectedFolder.id ? { ...f, imageCount: f.imageCount + 1 } : f
                )
              );

              resolve();
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
    } catch (e: any) {
      console.error('Failed to upload images:', e);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteImage = async (image: LibraryImage) => {
    setDeleteTarget({ type: 'image', id: image.id });
  };

  const executeDeleteImage = async (image: LibraryImage) => {
    try {
      const url = new URL(image.imageUrl);
      const marker = '/object/public/image_library/';
      const idx = url.pathname.indexOf(marker);
      const filePath = idx !== -1 ? url.pathname.substring(idx + marker.length) : null;
      if (!filePath) {
        console.warn('Could not extract storage path from:', image.imageUrl);
      }
      
      if (filePath) {
        await supabase.storage.from('image_library').remove([filePath]);
      }

      const { error } = await supabase
        .from('library_images')
        .delete()
        .eq('id', image.id);

      if (error) throw error;

      setFolderImages((prev) => prev.filter((img) => img.id !== image.id));
      
      if (selectedFolder) {
        setFolders((prev) =>
          prev.map((f) =>
            f.id === selectedFolder.id ? { ...f, imageCount: Math.max(0, f.imageCount - 1) } : f
          )
        );
      }
    } catch (e: any) {
      console.error('Failed to delete image:', e);
    }
  };

  const handleSetThumbnail = async (image: LibraryImage) => {
    if (!selectedFolder) return;

    try {
      const { error } = await supabase
        .from('image_folders')
        .update({ thumbnail_image_id: image.id })
        .eq('id', selectedFolder.id);

      if (error) throw error;

      setFolders((prev) =>
        prev.map((f) =>
          f.id === selectedFolder.id
            ? { ...f, thumbnailImageId: image.id, thumbnailUrl: image.imageUrl }
            : f
        )
      );
      setSelectedFolder((prev) =>
        prev ? { ...prev, thumbnailImageId: image.id, thumbnailUrl: image.imageUrl } : null
      );
    } catch (e: any) {
      console.error('Failed to set thumbnail:', e);
    }
  };

  // Folder Grid View
  if (!selectedFolder) {
    return (
      <div className="w-full h-full p-4 lg:p-10 flex flex-col overflow-y-auto">
        <div className="w-full">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-8">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="group relative cursor-pointer transition-all duration-300 group-hover:-translate-y-3"
                  >
                    <div className="aspect-[2/3] w-full overflow-hidden rounded-[2rem] bg-slate-200 shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)] transition-shadow duration-300 group-hover:shadow-2xl border border-[#4a5f7f] relative">
                      {folder.thumbnailUrl ? (
                        <img
                          src={folder.thumbnailUrl}
                          alt={folder.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-900 p-10 text-center">
                          <FolderOpen className="w-16 h-16 text-ghost-white" />
                        </div>
                      )}

                      {/* Always-visible bottom gradient for text readability */}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70 pointer-events-none z-[1]" />

                      <div className="absolute inset-x-0 bottom-0 p-6 z-[2]" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.7), 0 0 1px rgba(0,0,0,0.9)' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-blue-500 text-[9px] font-black text-white px-2 py-1 rounded-md uppercase tracking-widest shadow-lg">
                            {folder.imageCount} {folder.imageCount === 1 ? 'image' : 'images'}
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-white leading-tight mb-1 tracking-tight group-hover:text-blue-300 transition-colors truncate">
                          {folder.name}
                        </h3>
                        {folder.description && (
                          <p className="text-xs text-white line-clamp-2 leading-relaxed italic">
                            {folder.description}
                          </p>
                        )}
                      </div>

                      {/* Hover actions */}
                      <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 scale-90 group-hover:scale-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingFolder(folder);
                          }}
                          className="px-4 py-2 bg-white text-[hsl(var(--ui-surface-2))] font-bold text-xs uppercase tracking-wider rounded-xl shadow-xl hover:bg-slate-100 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenFolder(folder);
                          }}
                          className="px-4 py-2 bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xl hover:bg-blue-600 transition-colors"
                        >
                          Open
                        </button>
                      </div>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(folder.id);
                        }}
                        className="absolute top-4 right-4 p-3 bg-black/40 text-white hover:text-rose-400 hover:bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 z-20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Create new folder card */}
                <button
                  type="button"
                  onClick={handleCreateFolder}
                  className="group aspect-[2/3] w-full overflow-hidden rounded-[2rem] border-2 border-dashed border-zinc-600 bg-gradient-to-br from-zinc-800 to-zinc-900 transition-all duration-300 hover:border-blue-500 flex flex-col items-center justify-center gap-4 cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-full bg-zinc-700/50 flex items-center justify-center group-hover:bg-blue-900/30 transition-colors">
                    <Plus className="w-8 h-8 text-zinc-500 group-hover:text-blue-500" />
                  </div>
                  <span className="text-sm font-black text-zinc-500 group-hover:text-blue-500 uppercase tracking-widest">
                    New Folder
                  </span>
                </button>
              </div>

              {folders.length === 0 && (
                <div className="py-20 text-center text-slate-400 select-none">
                  <FolderOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="font-bold text-lg text-slate-500">Image Library</p>
                  <p className="text-sm">Create folders to organize your images</p>
                </div>
              )}
            </>
          )}
        </div>

        <FolderEditModal
          isOpen={!!editingFolder}
          onClose={() => setEditingFolder(null)}
          folder={editingFolder}
          onSave={(patch) => {
            if (editingFolder) {
              handleUpdateFolder(editingFolder.id, patch);
            }
            setEditingFolder(null);
          }}
        />
      </div>
    );
  }

  // Tag update handler
  const handleUpdateImageTags = async (imageId: string, newTags: string[]) => {
    try {
      const { error } = await supabase
        .from('library_images')
        .update({ tags: newTags } as any)
        .eq('id', imageId);
      if (error) throw error;
      setFolderImages((prev) =>
        prev.map((img) => (img.id === imageId ? { ...img, tags: newTags } : img))
      );
      if (lightboxImage?.id === imageId) {
        setLightboxImage((prev) => prev ? { ...prev, tags: newTags } : null);
      }
    } catch (e: any) {
      console.error('Failed to update tags:', e);
      console.error('Failed to update tags:', e);
    }
  };

  // Filter images by search query (matches against tags, title, filename)
  const filteredImages = searchQuery
    ? folderImages.filter((img) => {
        const q = searchQuery.toLowerCase();
        const displayTitle = (img.title || img.filename || '').toLowerCase();
        const filename = (img.filename || '').toLowerCase();
        return img.tags.some((tag) => tag.toLowerCase().includes(q)) || displayTitle.includes(q) || filename.includes(q);
      })
    : folderImages;

  // Folder Detail View
  return (
    <div className="h-full overflow-y-auto p-4 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-3">
              <h1 className="text-2xl font-black text-white">{selectedFolder.name}</h1>
              {selectedFolder.description && (
                <p className="text-sm text-[rgba(248,250,252,0.7)]">{selectedFolder.description}</p>
              )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleUploadImages}
          />
        </div>

        {/* Image Grid */}
        {isLoadingImages ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className="group relative"
              >
                <div className="rounded-xl overflow-hidden border border-[#4a5f7f] shadow-sm group-hover:shadow-lg transition-shadow">
                {/* Image container */}
                <div className="relative aspect-square bg-slate-100 overflow-hidden">
                  <img
                    src={image.imageUrl}
                    alt={image.title || image.filename}
                    className="w-full h-full object-cover cursor-pointer transition-transform duration-700 group-hover:scale-110"
                    onClick={() => {
                      setLightboxImage(image);
                      setEditTitle(image.title || image.filename || '');
                    }}
                  />

                  {/* Set as thumbnail button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetThumbnail(image);
                    }}
                    className={`absolute top-2 left-2 p-2 rounded-lg transition-all z-10 ${
                      selectedFolder.thumbnailImageId === image.id
                        ? 'bg-amber-500 text-white'
                        : 'bg-white/80 text-slate-600 opacity-0 group-hover:opacity-100 hover:bg-amber-500 hover:text-white'
                    }`}
                  >
                    <Star className="w-4 h-4" fill={selectedFolder.thumbnailImageId === image.id ? 'currentColor' : 'none'} />
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteImage(image);
                    }}
                    className="absolute top-2 right-2 p-2 bg-black/40 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:text-rose-400 hover:bg-black/60 z-10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Gray footer bar with title + aspect ratio */}
                <div className="bg-zinc-700 px-3 py-2">
                  <p className="text-xs text-white truncate font-medium">{image.title || image.filename}</p>
                  {aspectRatios[image.id] && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <AspectRatioIcon orientation={aspectRatios[image.id].orientation} />
                      <span className="text-[10px] text-zinc-400">{aspectRatios[image.id].label}</span>
                    </div>
                  )}
                </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {folderImages.length === 0 && !isLoadingImages && (
          <div className="py-20 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-bold text-lg text-slate-500">No images yet</p>
            <p className="text-sm">Upload images to this folder</p>
          </div>
        )}
      </div>

      {/* Click-based lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/85"
          onClick={() => {
            setEditTitle('');
            setLightboxImage(null);
          }}
        >
          <div 
            className="relative bg-zinc-900 rounded-xl shadow-2xl border border-[#4a5f7f] p-3 w-[600px] max-w-[95vw] animate-in fade-in zoom-in-95 duration-150 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage.imageUrl}
              alt={lightboxImage.title || lightboxImage.filename}
              className="w-full h-[50vh] object-contain rounded-lg"
            />

            {/* Editable Title */}
            <div className="mt-3 px-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 block">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#4a5f7f]"
                placeholder="Enter image title..."
              />
            </div>

            {/* Tag Editor */}
            <div className="mt-3 px-2 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {(lightboxImage.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium border border-blue-500/30"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleUpdateImageTags(lightboxImage.id, lightboxImage.tags.filter((t) => t !== tag))}
                      className="hover:bg-blue-500/30 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add tag and press Enter..."
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#4a5f7f]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value.trim().toLowerCase();
                    if (val && !lightboxImage.tags.includes(val)) {
                      handleUpdateImageTags(lightboxImage.id, [...lightboxImage.tags, val]);
                    }
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
              <p className="text-[10px] text-zinc-500">{lightboxImage.tags.length}/10 tags • Press Enter to add</p>
            </div>

            {/* Save / Cancel footer */}
            <div className="mt-4 px-2 pb-1 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditTitle('');
                  setLightboxImage(null);
                }}
                className="rounded-xl bg-[hsl(var(--ui-surface-2))] border border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] h-10 px-6 text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const { error } = await supabase
                      .from('library_images')
                      .update({ title: editTitle } as any)
                      .eq('id', lightboxImage.id);
                    if (error) throw error;
                    setFolderImages((prev) =>
                      prev.map((img) => (img.id === lightboxImage.id ? { ...img, title: editTitle } : img))
                    );
                  } catch (e: any) {
                    console.error('Failed to save title:', e);
                  }
                  setEditTitle('');
                  setLightboxImage(null);
                }}
                className="rounded-xl bg-[hsl(var(--ui-surface-2))] border border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] h-10 px-6 text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <FolderEditModal
        isOpen={!!editingFolder}
        onClose={() => setEditingFolder(null)}
        folder={editingFolder}
        onSave={(patch) => {
          if (editingFolder) {
            handleUpdateFolder(editingFolder.id, patch);
          }
          setEditingFolder(null);
        }}
      />

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget?.type === 'folder') {
            executeDeleteFolder(deleteTarget.id);
          } else if (deleteTarget?.type === 'image') {
            const img = folderImages.find((i) => i.id === deleteTarget.id);
            if (img) executeDeleteImage(img);
          }
          setDeleteTarget(null);
        }}
        message={
          deleteTarget?.type === 'folder'
            ? 'This will permanently delete this folder and all its images.'
            : 'This will permanently delete this image.'
        }
      />
    </div>
  );
};
