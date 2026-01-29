import React, { useState, useEffect } from 'react';
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
import type { ImageFolder, LibraryImage } from './ImageLibraryTab';

interface ImageLibraryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
}

export const ImageLibraryPickerModal: React.FC<ImageLibraryPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const { user } = useAuth();
  const [folders, setFolders] = useState<ImageFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<ImageFolder | null>(null);
  const [folderImages, setFolderImages] = useState<LibraryImage[]>([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadFolders();
      setSelectedFolder(null);
      setFolderImages([]);
      setSelectedImageUrl(null);
    }
  }, [isOpen, user]);

  const loadFolders = async () => {
    if (!user) return;
    setIsLoadingFolders(true);
    try {
      const { data: foldersData, error } = await supabase
        .from('image_folders')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

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
    } catch (e) {
      console.error('Failed to load folders:', e);
    } finally {
      setIsLoadingFolders(false);
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
    } catch (e) {
      console.error('Failed to load images:', e);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleSelectFolder = (folder: ImageFolder) => {
    setSelectedFolder(folder);
    setSelectedImageUrl(null);
    loadFolderImages(folder.id);
  };

  const handleConfirmSelection = () => {
    if (selectedImageUrl) {
      onSelect(selectedImageUrl);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-slate-50">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            {selectedFolder && (
              <button
                onClick={() => {
                  setSelectedFolder(null);
                  setFolderImages([]);
                  setSelectedImageUrl(null);
                }}
                className="p-1 hover:bg-slate-200 rounded-lg transition-colors mr-1"
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
                    {folders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => handleSelectFolder(folder)}
                        className="group relative aspect-[2/3] rounded-[2rem] overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)] transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer text-left"
                      >
                        {folder.thumbnailUrl ? (
                          <img
                            src={folder.thumbnailUrl}
                            alt={folder.name}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-800">
                            <FolderOpen className="w-12 h-12 text-slate-500" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col gap-1">
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
                    ))}
                  </div>
                )}
              </>
            ) : (
              // Images in folder view
              <>
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
                    {folderImages.map((image) => (
                      <button
                        key={image.id}
                        onClick={() => setSelectedImageUrl(image.imageUrl)}
                        className={`relative aspect-square rounded-lg overflow-hidden bg-slate-100 border-2 transition-all ${
                          selectedImageUrl === image.imageUrl
                            ? 'border-blue-500 ring-2 ring-blue-500/30'
                            : 'border-transparent hover:border-slate-300'
                        }`}
                      >
                        <img
                          src={image.imageUrl}
                          alt={image.filename}
                          className="w-full h-full object-cover"
                        />
                        {selectedImageUrl === image.imageUrl && (
                          <div className="absolute top-1 right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t bg-slate-50 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSelection}
            disabled={!selectedImageUrl}
            className="bg-slate-900 hover:bg-slate-800 text-white"
          >
            Select Image
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
