import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { FileJson2, FileText, FileType2 } from 'lucide-react';

export type StoryExportFormat = 'markdown' | 'json' | 'word';

interface StoryExportFormatModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (format: StoryExportFormat) => void;
}

export const StoryExportFormatModal: React.FC<StoryExportFormatModalProps> = ({
  open,
  onClose,
  onSelect,
}) => {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-[680px] bg-[#2a2a2f] border-0 rounded-[24px] p-0 gap-0 shadow-[0_20px_50px_rgba(0,0,0,0.55),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)] overflow-hidden [&>button]:hidden">
        <div className="relative bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] px-5 py-4 border-t border-white/20 shadow-[0_6px_16px_rgba(0,0,0,0.35)]">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent h-1/2 pointer-events-none" />
          <h3 className="relative z-[1] text-white text-[16px] font-black uppercase tracking-[0.08em]">Export Story</h3>
        </div>
        <div className="p-4 grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => { onSelect('markdown'); onClose(); }}
            className="group flex flex-col items-center text-center rounded-2xl bg-[#2e2e33] border-2 border-transparent py-5 px-4 gap-3 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)] hover:border-blue-500 transition-all cursor-pointer"
          >
            <div className="w-12 h-12 rounded-[14px] bg-[#1c1c1f] border-t border-black/35 shadow-[inset_0_2px_6px_rgba(0,0,0,0.40)] flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="text-white text-sm font-extrabold">Markdown</div>
            <p className="text-zinc-400 text-xs leading-relaxed">Readable text with heading + bullet structure.</p>
          </button>

          <button
            type="button"
            onClick={() => { onSelect('json'); onClose(); }}
            className="group flex flex-col items-center text-center rounded-2xl bg-[#2e2e33] border-2 border-transparent py-5 px-4 gap-3 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)] hover:border-emerald-500 transition-all cursor-pointer"
          >
            <div className="w-12 h-12 rounded-[14px] bg-[#1c1c1f] border-t border-black/35 shadow-[inset_0_2px_6px_rgba(0,0,0,0.40)] flex items-center justify-center">
              <FileJson2 className="w-5 h-5 text-white" />
            </div>
            <div className="text-white text-sm font-extrabold">JSON</div>
            <p className="text-zinc-400 text-xs leading-relaxed">Structured machine-friendly format for pipelines.</p>
          </button>

          <button
            type="button"
            onClick={() => { onSelect('word'); onClose(); }}
            className="group flex flex-col items-center text-center rounded-2xl bg-[#2e2e33] border-2 border-transparent py-5 px-4 gap-3 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)] hover:border-indigo-500 transition-all cursor-pointer"
          >
            <div className="w-12 h-12 rounded-[14px] bg-[#1c1c1f] border-t border-black/35 shadow-[inset_0_2px_6px_rgba(0,0,0,0.40)] flex items-center justify-center">
              <FileType2 className="w-5 h-5 text-white" />
            </div>
            <div className="text-white text-sm font-extrabold">Word Document</div>
            <p className="text-zinc-400 text-xs leading-relaxed">Word-compatible RTF with real headers and bullet lists.</p>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
