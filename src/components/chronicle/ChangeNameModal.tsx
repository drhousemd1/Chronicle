// ChangeNameModal - Popup for safely changing a character's primary name
// Automatically adds the old name as a nickname to preserve avatar linkage

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
  currentNicknames: string;
  onSave: (newName: string, updatedNicknames: string) => void;
}

export const ChangeNameModal: React.FC<ChangeNameModalProps> = ({
  open,
  onOpenChange,
  currentName,
  currentNicknames,
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
    
    // Add old name to nicknames (if not already there)
    const existingNicknames = currentNicknames
      .split(',')
      .map(n => n.trim())
      .filter(n => n.length > 0);
    
    const oldNameLower = currentName.toLowerCase().trim();
    const alreadyHasOldName = existingNicknames.some(n => n.toLowerCase() === oldNameLower);
    
    let updatedNicknames = currentNicknames;
    if (!alreadyHasOldName && currentName.trim()) {
      updatedNicknames = existingNicknames.length > 0
        ? `${currentNicknames}, ${currentName}`
        : currentName;
    }
    
    onSave(trimmedName, updatedNicknames);
    onOpenChange(false);
  };

  const isValid = newName.trim().length > 0 && newName.trim() !== currentName;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Change Character Name</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            The previous name will be added as a nickname to maintain avatar linkage and dialogue history.
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

          {currentNicknames && (
            <div className="text-xs text-slate-400">
              <span className="font-medium">Existing nicknames:</span> {currentNicknames}
            </div>
          )}
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
