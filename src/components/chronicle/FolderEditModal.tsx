import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { ImageFolder } from './ImageLibraryTab';

interface FolderEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: ImageFolder | null;
  onSave: (patch: { name?: string; description?: string }) => void;
}

export const FolderEditModal: React.FC<FolderEditModalProps> = ({
  isOpen,
  onClose,
  folder,
  onSave,
}) => {
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Edit Folder</DialogTitle>
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
              className="h-10"
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
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-slate-900 hover:bg-slate-800 text-white">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
