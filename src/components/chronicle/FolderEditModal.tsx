import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { ImageFolder } from './image-library-types';

interface FolderEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: ImageFolder | null;
  onSave: (patch: { name?: string; description?: string }) => void;
}

export const FolderEditModal = React.forwardRef<HTMLDivElement, FolderEditModalProps>(
  ({
    isOpen,
    onClose,
    folder,
    onSave,
  }, ref) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
      if (folder && isOpen) {
        setName(folder.name);
        setDescription(folder.description || '');
      }
    }, [folder, isOpen]);

    const handleSave = () => {
      onSave({ name: name.trim() || 'Untitled Folder', description: description.trim() });
      onClose();
    };

    if (!folder) return null;

    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent ref={ref} className="sm:max-w-md bg-zinc-900 border-[#4a5f7f] text-white [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Edit Folder</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name" className="text-xs font-bold uppercase text-slate-500">
                Folder Name
              </Label>
              <Input
                id="folder-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter folder name"
                className="h-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="folder-description" className="text-xs font-bold uppercase text-slate-500">
                Description (optional)
              </Label>
              <Textarea
                id="folder-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter a description for this folder"
                rows={3}
                className="resize-none bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[hsl(var(--ui-surface-2))] border border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] h-10 px-6 text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-[hsl(var(--ui-surface-2))] border border-[hsl(var(--ui-border))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] h-10 px-6 text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              Save
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  },
);

FolderEditModal.displayName = "FolderEditModal";
