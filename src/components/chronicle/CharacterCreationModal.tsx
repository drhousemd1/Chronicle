import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Users, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CharacterCreationModalProps {
  open: boolean;
  onClose: () => void;
  onImportFromLibrary: () => void;
  onCreateNew: () => void;
}

export const CharacterCreationModal: React.FC<CharacterCreationModalProps> = ({ open, onClose, onImportFromLibrary, onCreateNew }) => {
  const handleImport = () => {
    onImportFromLibrary();
    onClose();
  };

  const handleCreate = () => {
    onCreateNew();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-white/10 p-0 gap-0 [&>button]:hidden">
        <div className="px-6 pt-5 pb-3">
          <h3 className="text-white text-lg font-bold tracking-tight">Character Creation</h3>
          <p className="text-zinc-400 text-sm mt-1">Select an option below to continue.</p>
        </div>
        <div className="px-6 pb-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleImport}
            className={cn(
              "group flex flex-col items-center gap-3 p-5 rounded-2xl border border-white/10 bg-zinc-800/50",
              "hover:border-blue-500/50 hover:bg-blue-500/10 transition-all cursor-pointer text-center"
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">Import from Library</div>
              <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                Browse and import an existing character
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleCreate}
            className={cn(
              "group flex flex-col items-center gap-3 p-5 rounded-2xl border border-white/10 bg-zinc-800/50",
              "hover:border-purple-500/50 hover:bg-purple-500/10 transition-all cursor-pointer text-center"
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
              <Plus className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">+ New Character</div>
              <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                Create a brand new character from scratch
              </p>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
