import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FolderOpen, Image as ImageIcon, Loader2, Check, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import type { ImageFolder, LibraryImage } from './image-library-types';
import { getSignedMediaUrl, getSignedMediaUrls } from '@/services/persistence/signed-media';
import {
  copyLibraryImageTo,
  type DestinationBucket,
  type LibraryPickerSelection,
} from '@/services/persistence/library-copy';

interface ImageLibraryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Destination bucket the selected image should be copied into. Required so the
   * picker can copy bytes from the private image_library into a consumer-owned
   * bucket before invoking onSelect.
   */
  destBucket?: DestinationBucket;
  /**
   * Legacy single-arg callback: receives the long-lived destination URL
   * (or storage:// sentinel for private buckets like `scenes`). Most existing
   * consumers use this — destBucket defaults to 'avatars' for backwards
   * compatibility but callers SHOULD pass an explicit destBucket.
   */
  onSelect: (imageUrl: string) => void;
  /**
   * Advanced callback that also receives the destination imagePath. Use this
   * when persisting alongside an image_path column (e.g. scenes).
   */
  onSelectWithPath?: (result: { url: string; imagePath: string; bucket: DestinationBucket }) => void;
}

export const ImageLibraryPickerModal: React.FC<ImageLibraryPickerModalProps> = ({
  isOpen,
  onClose,
  destBucket = 'avatars',
  onSelect,
  onSelectWithPath,
}) => {
  const { user } = useAuth();
  const [folders, setFolders] = useState<ImageFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<ImageFolder | null>(null);
  const [folderImages, setFolderImages] = useState<LibraryImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<LibraryImage | null>(null);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [foldersError, setFoldersError] = useState<string | null>(null);
  const [imagesError, setImagesError] = useState<string | null>(null);
  const [thumbSignedUrls, setThumbSignedUrls] = useState<Record<string, string>>({});
  const [folderThumbSignedUrls, setFolderThumbSignedUrls] = useState<Record<string, string>>({});

  const loadFolders = useCallback(async () => {
    if (!user) return;
    setIsLoadingFolders(true);
    setFoldersError(null);
    try {
      const { data, error } = await (supabase.rpc as any)('get_folders_with_details');

      if (error) throw error;

      const rows = (data || []) as any[];
      const foldersWithDetails: ImageFolder[] = rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        description: row.description || '',
        thumbnailImageId: row.thumbnail_image_id,
        thumbnailUrl: row.thumbnail_url,
        thumbnailPath: row.thumbnail_path || null,
        imageCount: Number(row.image_count) || 0,
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.updated_at).getTime(),
      } as ImageFolder));

      setFolders(foldersWithDetails);

      // Resolve signed URLs for folder thumbnails (image_library is private).
      const thumbPaths = foldersWithDetails
        .map((f) => f.thumbnailPath)
        .filter((p): p is string => !!p);
      if (thumbPaths.length) {
        const map = await getSignedMediaUrls('image_library', thumbPaths);
        setFolderThumbSignedUrls(map);
      } else {
        setFolderThumbSignedUrls({});
      }
    } catch (e) {
      console.error('Failed to load folders:', e);
      const message = e instanceof Error ? e.message : 'Could not load folders.';
      setFoldersError(message);
      toast.error('Failed to load folders. Please retry.');
    } finally {
      setIsLoadingFolders(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedFolder(null);
    setSelectedImage(null);
    setFolderImages([]);
    setThumbSignedUrls({});
    void loadFolders();
  }, [isOpen, loadFolders]);

  const loadFolderImages = async (folderId: string) => {
    setIsLoadingImages(true);
    setImagesError(null);
    try {
      const { data, error } = await supabase
        .from('library_images')
        .select('*')
        .eq('folder_id', folderId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const images: LibraryImage[] = (data || []).map((img: any) => ({
        id: img.id,
        userId: img.user_id,
        folderId: img.folder_id,
        imageUrl: img.image_url,
        imagePath: img.image_path || null,
        filename: img.filename || '',
        title: img.title || '',
        isThumbnail: img.is_thumbnail || false,
        tags: img.tags || [],
        createdAt: new Date(img.created_at).getTime(),
      }));
      setFolderImages(images);

      // Resolve signed URLs for thumbnail rendering (image_library private).
      const paths = images.map((i) => i.imagePath).filter((p): p is string => !!p);
      const map = await getSignedMediaUrls('image_library', paths);
      setThumbSignedUrls(map);
    } catch (e) {
      console.error('Failed to load images:', e);
      const message = e instanceof Error ? e.message : 'Could not load folder images.';
      setImagesError(message);
      toast.error('Failed to load folder images. Please retry.');
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleSelectFolder = (folder: ImageFolder) => {
    setSelectedFolder(folder);
    setSelectedImage(null);
    loadFolderImages(folder.id);
  };

  const handleConfirmSelection = async () => {
    if (!selectedImage || !user) return;
    if (!selectedImage.imagePath) {
      // Legacy row missing image_path — fall back to stored URL.
      onSelect(selectedImage.imageUrl);
      onClose();
      return;
    }
    setIsCopying(true);
    try {
      const previewUrl = thumbSignedUrls[selectedImage.imagePath]
        || (await getSignedMediaUrl('image_library', selectedImage.imagePath));
      const selection: LibraryPickerSelection = {
        imageId: selectedImage.id,
        imagePath: selectedImage.imagePath,
        previewUrl,
        filename: selectedImage.filename,
        contentType: 'image/jpeg',
      };
      const copied = await copyLibraryImageTo(selection, destBucket, user.id);
      onSelect(copied.publicOrSentinelUrl);
      onSelectWithPath?.({ url: copied.publicOrSentinelUrl, imagePath: copied.destPath, bucket: copied.destBucket });
      onClose();
    } catch (e) {
      console.error('[ImageLibraryPickerModal] copy failed', e);
      toast.error('Could not use that image. Please try again.');
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-ghost-white">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            {selectedFolder && (
              <button
                onClick={() => {
                  setSelectedFolder(null);
                  setFolderImages([]);
                  setSelectedImage(null);
                }}
                className="p-1 hover:bg-slate-200 rounded-lg transition-colors mr-1"
                aria-label="Back to folder list"
                title="Back to folder list"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <ImageIcon className="w-5 h-5" />
            {selectedFolder ? selectedFolder.name : 'Select from Image Library'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[60vh]">
          <div className="p-6">
            {!selectedFolder ? (
              // Folder list view
              <>
                {foldersError && (
                  <div className="mb-4 rounded-lg border border-red-500/40 bg-red-950/20 px-3 py-2 text-sm text-red-300">
                    <div className="flex items-center justify-between gap-3">
                      <span>Folder load failed: {foldersError}</span>
                      <Button size="sm" variant="outline" onClick={() => void loadFolders()}>
                        Retry
                      </Button>
                    </div>
                  </div>
                )}
                {isLoadingFolders ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : folders.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold">No folders yet</p>
                    <p className="text-sm">Create folders in the Image Library first</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                    {folders.map((folder) => {
                      const thumb = folder.thumbnailPath
                        ? folderThumbSignedUrls[folder.thumbnailPath] || ''
                        : folder.thumbnailUrl || '';
                      return (
                      <button
                        key={folder.id}
                        onClick={() => handleSelectFolder(folder)}
                        className="group relative aspect-[2/3] rounded-[2rem] overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)] transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer text-left"
                      >
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={folder.name}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-800">
                            <FolderOpen className="w-12 h-12 text-slate-500" />
                          </div>
                        )}
                        
                        <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col gap-1" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.7), 0 0 1px rgba(0,0,0,0.9)' }}>
                          <span className="inline-flex self-start items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/90 text-white text-[11px] font-semibold tracking-wide shadow">
                            <ImageIcon className="w-3 h-3" />
                            {folder.imageCount}
                          </span>
                          <h3 className="text-lg font-extrabold text-white leading-tight line-clamp-2 drop-shadow-md">
                            {folder.name}
                          </h3>
                          {folder.description && (
                            <p className="text-xs text-white/70 line-clamp-2">{folder.description}</p>
                          )}
                        </div>
                      </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              // Images in folder view
              <>
                {imagesError && (
                  <div className="mb-4 rounded-lg border border-red-500/40 bg-red-950/20 px-3 py-2 text-sm text-red-300">
                    <div className="flex items-center justify-between gap-3">
                      <span>Image load failed: {imagesError}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => selectedFolder && void loadFolderImages(selectedFolder.id)}
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                )}
                {isLoadingImages ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : folderImages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold">No images in this folder</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {folderImages.map((image) => {
                      const src = image.imagePath
                        ? thumbSignedUrls[image.imagePath] || ''
                        : image.imageUrl;
                      const isSelected = selectedImage?.id === image.id;
                      return (
                      <button
                        key={image.id}
                        onClick={() => setSelectedImage(image)}
                        className={`relative aspect-square rounded-lg overflow-hidden bg-slate-100 border-2 transition-all ${
                          isSelected
                            ? 'border-blue-500 ring-2 ring-blue-500/30'
                            : 'border-transparent hover:border-slate-300'
                        }`}
                      >
                        <img
                          src={src}
                          alt={image.filename}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t bg-ghost-white flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isCopying}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSelection}
            disabled={!selectedImage || isCopying}
            className="bg-slate-900 hover:bg-slate-800 text-white"
          >
            {isCopying ? 'Copying…' : 'Select Image'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
