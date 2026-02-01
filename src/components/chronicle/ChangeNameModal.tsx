// ChangeNameModal - Simple popup for changing a character's primary name

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ChangeNameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  onSave: (newName: string) => void;
}

export const ChangeNameModal: React.FC<ChangeNameModalProps> = ({
  open,
  onOpenChange,
  currentName,
  onSave,
}) => {
  const [newName, setNewName] = useState('');

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setNewName('');
    }
  }, [open]);

  const handleSave = () => {
    const trimmedName = newName.trim();
    if (!trimmedName) return;
    
    onSave(trimmedName);
    onOpenChange(false);
  };

  const isValid = newName.trim().length > 0 && newName.trim() !== currentName;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Change Character Name</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Enter a new name for this character.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Current Name
            </Label>
            <div className="px-3 py-2 bg-slate-100 rounded-md text-sm text-slate-600 font-medium">
              {currentName}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              New Primary Name
            </Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new name..."
              autoFocus
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid}
            className="bg-slate-900 hover:bg-slate-800 text-white"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
