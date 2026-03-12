import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Sparkles, AlignLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export type EnhanceMode = 'precise' | 'detailed';

interface EnhanceModeModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (mode: EnhanceMode) => void;
}

export const EnhanceModeModal: React.FC<EnhanceModeModalProps> = ({ open, onClose, onSelect }) => {
  const handleSelect = (mode: EnhanceMode) => {
    onSelect(mode);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-ghost-white p-0 gap-0 [&>button]:hidden">
        <div className="px-6 pt-5 pb-3">
          <h3 className="text-white text-lg font-bold tracking-tight">Enhancement Style</h3>
          <p className="text-zinc-400 text-sm mt-1">Choose how the AI should expand this field.</p>
        </div>
        <div className="px-6 pb-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleSelect('precise')}
            className={cn(
              "group flex flex-col items-center gap-3 p-5 rounded-2xl border border-ghost-white bg-zinc-800/50",
              "hover:border-blue-500/50 hover:bg-blue-500/10 transition-all cursor-pointer text-center"
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
              <Sparkles className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">Precise</div>
              <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                Short, semicolon-separated tags focusing on key attributes
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelect('detailed')}
            className={cn(
              "group flex flex-col items-center gap-3 p-5 rounded-2xl border border-ghost-white bg-zinc-800/50",
              "hover:border-purple-500/50 hover:bg-purple-500/10 transition-all cursor-pointer text-center"
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
              <AlignLeft className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">Detailed</div>
              <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                1-2 sentence vivid description for immersive roleplay
              </p>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
