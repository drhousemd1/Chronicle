import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { List, AlignLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorldCustomSectionType } from '@/types';

interface CustomContentTypeModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: WorldCustomSectionType) => void;
}

export const CustomContentTypeModal: React.FC<CustomContentTypeModalProps> = ({ open, onClose, onSelect }) => {
  const handleSelect = (type: WorldCustomSectionType) => {
    onSelect(type);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[520px] bg-[#2a2a2f] border-0 rounded-3xl p-0 gap-0 shadow-[0_20px_50px_rgba(0,0,0,0.55),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)] overflow-hidden [&>button]:hidden">
        {/* Slate blue gradient header */}
        <div className="relative bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] px-5 py-3 border-t border-white/20">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent h-1/2 pointer-events-none" />
          <h3 className="relative z-[1] text-white text-[13px] font-black uppercase tracking-widest">Content Type</h3>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleSelect('structured')}
            className={cn(
              "group flex flex-col items-center gap-3 p-5 rounded-2xl bg-[#2e2e33] border-2 border-transparent",
              "shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]",
              "hover:border-blue-500 transition-all cursor-pointer text-center"
            )}
          >
            <div className="w-12 h-12 rounded-[14px] bg-[#1c1c1f] border-t border-black/35 shadow-[inset_0_2px_6px_rgba(0,0,0,0.40)] flex items-center justify-center">
              <List className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">Structured</div>
              <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                Label + description rows for organized entries
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelect('freeform')}
            className={cn(
              "group flex flex-col items-center gap-3 p-5 rounded-2xl bg-[#2e2e33] border-2 border-transparent",
              "shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]",
              "hover:border-purple-500 transition-all cursor-pointer text-center"
            )}
          >
            <div className="w-12 h-12 rounded-[14px] bg-[#1c1c1f] border-t border-black/35 shadow-[inset_0_2px_6px_rgba(0,0,0,0.40)] flex items-center justify-center">
              <AlignLeft className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">Freeform</div>
              <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                A single open text field like Story Premise
              </p>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
