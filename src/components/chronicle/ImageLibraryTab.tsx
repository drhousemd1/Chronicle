import React, { useState, useRef, useEffect } from 'react';
import { Button, Card } from './UI';
import { Icons } from '@/constants';
import { Star, ArrowLeft, Trash2, Pencil, FolderOpen, Plus, Image as ImageIcon, Loader2 } from 'lucide-react';
import { FolderEditModal } from './FolderEditModal';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { resizeImage, uuid } from '@/utils';

// Types
export type ImageFolder = {
  id: string;
  userId: string;
  name: string;
  description: string;
  thumbnailImageId: string | null;
  thumbnailUrl: string | null;
  imageCount: number;
  createdAt: number;
  updatedAt: number;
};

export type LibraryImage = {
  id: string;
  userId: string;
  folderId: string;
  imageUrl: string;
  filename: string;
  isThumbnail: boolean;
  createdAt: number;
};

export const ImageLibraryTab: React.FC = () => {
  const { user } = useAuth();
  const [folders, setFolders] = useState<ImageFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<ImageFolder | null>(null);
  const [folderImages, setFolderImages] = useState<LibraryImage[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [editingFolder, setEditingFolder] = useState<ImageFolder | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<LibraryImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch folders on mount
  useEffect(() => {
    if (!user) return;
    loadFolders();
  }, [user]);

  const loadFolders = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data: foldersData, error } = await supabase
        .from('image_folders')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Get image counts and thumbnails for each folder
      const foldersWithDetails = await Promise.all(
        (foldersData || []).map(async (folder) => {
          const { count } = await supabase
            .from('library_images')
            .select('*', { count: 'exact', head: true })
            .eq('folder_id', folder.id);

          let thumbnailUrl = null;
          if (folder.thumbnail_image_id) {
            const { data: thumbImg } = await supabase
              .from('library_images')
              .select('image_url')
              .eq('id', folder.thumbnail_image_id)
              .maybeSingle();
            thumbnailUrl = thumbImg?.image_url || null;
          } else {
            // Use first image as default thumbnail
            const { data: firstImg } = await supabase
              .from('library_images')
              .select('image_url')
              .eq('folder_id', folder.id)
              .order('created_at', { ascending: true })
              .limit(1)
              .maybeSingle();
            thumbnailUrl = firstImg?.image_url || null;
          }

          return {
            id: folder.id,
            userId: folder.user_id,
            name: folder.name,
            description: folder.description || '',
            thumbnailImageId: folder.thumbnail_image_id,
            thumbnailUrl,
            imageCount: count || 0,
            createdAt: new Date(folder.created_at).getTime(),
            updatedAt: new Date(folder.updated_at).getTime(),
          } as ImageFolder;
        })
      );

      setFolders(foldersWithDetails);
    } catch (e: any) {
      console.error('Failed to load folders:', e);
      toast.error('Failed to load folders');
    } finally {
      setIsLoading(false);
    }
  };

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
        (data || []).map((img) => ({
          id: img.id,
          userId: img.user_id,
          folderId: img.folder_id,
          imageUrl: img.image_url,
          filename: img.filename || '',
          isThumbnail: img.is_thumbnail || false,
          createdAt: new Date(img.created_at).getTime(),
        }))
      );
    } catch (e: any) {
      console.error('Failed to load images:', e);
      toast.error('Failed to load images');
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('image_folders')
        .insert({
          user_id: user.id,
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
        createdAt: new Date(data.created_at).getTime(),
        updatedAt: new Date(data.updated_at).getTime(),
      };

      setFolders((prev) => [newFolder, ...prev]);
      setEditingFolder(newFolder);
    } catch (e: any) {
      console.error('Failed to create folder:', e);
      toast.error('Failed to create folder');
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
      toast.error('Failed to update folder');
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('Delete this folder and all its images?')) return;
    
    try {
      // First delete all images in the folder from storage
      const { data: images } = await supabase
        .from('library_images')
        .select('image_url')
        .eq('folder_id', id);

      if (images && images.length > 0) {
        const filePaths = images.map((img) => {
          const url = new URL(img.image_url);
          const pathParts = url.pathname.split('/storage/v1/object/public/image_library/');
          return pathParts[1] || '';
        }).filter(Boolean);

        if (filePaths.length > 0) {
          await supabase.storage.from('image_library').remove(filePaths);
        }
      }

      // Delete folder (cascade will handle images in DB)
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
      toast.error('Failed to delete folder');
    }
  };

  const handleOpenFolder = (folder: ImageFolder) => {
    setSelectedFolder(folder);
    loadFolderImages(folder.id);
  };

  const handleUploadImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user || !selectedFolder) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const reader = new FileReader();
        await new Promise<void>((resolve, reject) => {
          reader.onload = async () => {
            try {
              const dataUrl = reader.result as string;
              const optimized = await resizeImage(dataUrl, 1920, 1080, 0.85);
              
              // Convert to blob
              const response = await fetch(optimized);
              const blob = await response.blob();
              
              const filename = `${uuid()}-${Date.now()}.jpg`;
              const path = `${user.id}/${selectedFolder.id}/${filename}`;
              
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
                  user_id: user.id,
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
                  isThumbnail: false,
                  createdAt: new Date(imgData.created_at).getTime(),
                },
                ...prev,
              ]);

              // Update folder image count
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
      toast.success('Images uploaded');
    } catch (e: any) {
      console.error('Failed to upload images:', e);
      toast.error('Failed to upload images');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteImage = async (image: LibraryImage) => {
    if (!confirm('Delete this image?')) return;

    try {
      // Delete from storage
      const url = new URL(image.imageUrl);
      const pathParts = url.pathname.split('/storage/v1/object/public/image_library/');
      const filePath = pathParts[1];
      
      if (filePath) {
        await supabase.storage.from('image_library').remove([filePath]);
      }

      // Delete from DB
      const { error } = await supabase
        .from('library_images')
        .delete()
        .eq('id', image.id);

      if (error) throw error;

      setFolderImages((prev) => prev.filter((img) => img.id !== image.id));
      
      // Update folder image count
      if (selectedFolder) {
        setFolders((prev) =>
          prev.map((f) =>
            f.id === selectedFolder.id ? { ...f, imageCount: Math.max(0, f.imageCount - 1) } : f
          )
        );
      }
    } catch (e: any) {
      console.error('Failed to delete image:', e);
      toast.error('Failed to delete image');
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
      toast.success('Thumbnail set');
    } catch (e: any) {
      console.error('Failed to set thumbnail:', e);
      toast.error('Failed to set thumbnail');
    }
  };

  // Folder Grid View
  if (!selectedFolder) {
    return (
      <div className="h-full overflow-y-auto p-10">
        <div className="max-w-6xl mx-auto space-y-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="group relative cursor-pointer"
                  >
                    <div className="aspect-[2/3] w-full overflow-hidden rounded-[2rem] bg-slate-200 shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)] transition-all duration-300 group-hover:-translate-y-3 group-hover:shadow-2xl border border-slate-200 relative">
                      {folder.thumbnailUrl ? (
                        <img
                          src={folder.thumbnailUrl}
                          alt={folder.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-900 p-10 text-center">
                          <FolderOpen className="w-16 h-16 text-white/10" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />

                      <div className="absolute inset-x-0 bottom-0 p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-blue-600 text-[9px] font-black text-white px-2 py-1 rounded-md uppercase tracking-widest shadow-lg">
                            {folder.imageCount} {folder.imageCount === 1 ? 'image' : 'images'}
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-white leading-tight mb-1 tracking-tight group-hover:text-blue-300 transition-colors truncate">
                          {folder.name}
                        </h3>
                        {folder.description && (
                          <p className="text-xs text-white/70 line-clamp-2 leading-relaxed italic">
                            {folder.description}
                          </p>
                        )}
                      </div>

                      {/* Hover actions */}
                      <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all bg-black/30">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingFolder(folder);
                          }}
                          className="px-4 py-2 bg-white text-slate-900 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xl hover:bg-slate-100 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenFolder(folder);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xl hover:bg-blue-700 transition-colors"
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
                        className="absolute top-4 right-4 p-3 bg-black/40 text-white/50 hover:text-rose-500 hover:bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:rotate-12 z-20"
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
                  className="group aspect-[2/3] w-full overflow-hidden rounded-[2rem] bg-slate-100 border-2 border-dashed border-slate-300 transition-all duration-300 hover:border-blue-400 hover:bg-blue-50 flex flex-col items-center justify-center gap-4 cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Plus className="w-8 h-8 text-slate-400 group-hover:text-blue-500" />
                  </div>
                  <span className="text-sm font-bold text-slate-400 group-hover:text-blue-600 uppercase tracking-wider">
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

  // Folder Detail View
  return (
    <div className="h-full overflow-y-auto p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setSelectedFolder(null);
                setFolderImages([]);
                loadFolders(); // Refresh folder thumbnails
              }}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900">{selectedFolder.name}</h1>
              {selectedFolder.description && (
                <p className="text-sm text-slate-500">{selectedFolder.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => setEditingFolder(selectedFolder)}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit Folder
            </Button>
            <Button
              variant="primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : '+ Upload Images'}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleUploadImages}
            />
          </div>
        </div>

        {/* Image Grid */}
        {isLoadingImages ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {folderImages.map((image) => (
              <div
                key={image.id}
                className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm hover:shadow-lg transition-all cursor-pointer"
                onMouseEnter={() => setPreviewImage(image)}
                onMouseLeave={() => setPreviewImage(null)}
              >
                <img
                  src={image.imageUrl}
                  alt={image.filename}
                  className="w-full h-full object-cover"
                />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Set as thumbnail button */}
                <button
                  type="button"
                  onClick={() => handleSetThumbnail(image)}
                  className={`absolute top-2 left-2 p-2 rounded-lg transition-all ${
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
                  onClick={() => handleDeleteImage(image)}
                  className="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Filename */}
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-white truncate">{image.filename}</p>
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

      {/* Viewport-centered preview overlay */}
      {previewImage && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-8">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-3 max-w-[500px] animate-in fade-in zoom-in-95 duration-150">
            <img
              src={previewImage.imageUrl}
              alt={previewImage.filename}
              className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
            />
            <p className="text-sm text-slate-500 text-center mt-2 truncate px-2">
              {previewImage.filename}
            </p>
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
    </div>
  );
};
