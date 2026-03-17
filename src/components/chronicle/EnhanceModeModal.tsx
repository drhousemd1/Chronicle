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
      <DialogContent className="sm:max-w-[520px] bg-[#2a2a2f] border-0 rounded-3xl p-0 gap-0 shadow-[0_20px_50px_rgba(0,0,0,0.55),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)] overflow-hidden [&>button]:hidden">
        {/* Slate blue gradient header */}
        <div className="relative bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] px-5 py-3 border-t border-white/20">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent h-1/2 pointer-events-none" />
          <h3 className="relative z-[1] text-white text-[13px] font-black uppercase tracking-widest">Enhancement Style</h3>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleSelect('precise')}
            className={cn(
              "group flex flex-col items-center text-center rounded-[28px] bg-[#2e2e33] border-2 border-transparent px-6 py-7",
              "shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]",
              "hover:border-blue-500 transition-all cursor-pointer"
            )}
          >
            <div className="w-14 h-14 rounded-3xl bg-[#1c1c1f] border-t border-black/35 shadow-[inset_0_2px_6px_rgba(0,0,0,0.40)] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="text-white text-base font-bold mt-5">Precise</div>
            <p className="text-zinc-400 text-xs mt-2 leading-relaxed">
              Short, semicolon-separated tags focusing on key attributes
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleSelect('detailed')}
            className={cn(
              "group flex flex-col items-center text-center rounded-[28px] bg-[#2e2e33] border-2 border-transparent px-6 py-7",
              "shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]",
              "hover:border-purple-500 transition-all cursor-pointer"
            )}
          >
            <div className="w-14 h-14 rounded-3xl bg-[#1c1c1f] border-t border-black/35 shadow-[inset_0_2px_6px_rgba(0,0,0,0.40)] flex items-center justify-center">
              <AlignLeft className="w-6 h-6 text-white" />
            </div>
            <div className="text-white text-base font-bold mt-5">Detailed</div>
            <p className="text-zinc-400 text-xs mt-2 leading-relaxed">
              1-2 sentence vivid description for immersive roleplay
            </p>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
