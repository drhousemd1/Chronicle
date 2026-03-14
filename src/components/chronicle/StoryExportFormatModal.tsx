import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { FileJson2, FileText, FileType2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StoryExportFormat = 'markdown' | 'json' | 'word';

interface StoryExportFormatModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (format: StoryExportFormat) => void;
}

const OPTIONS: Array<{
  id: StoryExportFormat;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}> = [
  {
    id: 'markdown',
    title: 'Markdown',
    description: 'Readable text with heading + bullet structure.',
    icon: FileText,
    tone: 'text-sky-300 bg-sky-500/20 group-hover:bg-sky-500/30',
  },
  {
    id: 'json',
    title: 'JSON',
    description: 'Structured machine-friendly format for pipelines.',
    icon: FileJson2,
    tone: 'text-emerald-300 bg-emerald-500/20 group-hover:bg-emerald-500/30',
  },
  {
    id: 'word',
    title: 'Word Document',
    description: 'Word-compatible RTF with real headers and bullet lists.',
    icon: FileType2,
    tone: 'text-indigo-300 bg-indigo-500/20 group-hover:bg-indigo-500/30',
  },
];

export const StoryExportFormatModal: React.FC<StoryExportFormatModalProps> = ({
  open,
  onClose,
  onSelect,
}) => {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-zinc-900 border-ghost-white p-0 gap-0 [&>button]:hidden">
        <div className="px-8 pt-7 pb-4">
          <h3 className="text-white text-4xl leading-none tracking-tight font-black">Export Story</h3>
          <p className="text-zinc-400 text-lg mt-3">Select a format for this export.</p>
        </div>
        <div className="px-8 pb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onSelect(option.id);
                  onClose();
                }}
                className={cn(
                  'group flex flex-col items-center text-center rounded-[28px] border border-ghost-white bg-zinc-800/45 px-6 py-7 transition-all',
                  'hover:border-blue-500/60 hover:shadow-[0_12px_28px_rgba(0,0,0,0.45)]'
                )}
              >
                <span className={cn('w-14 h-14 rounded-3xl flex items-center justify-center transition-colors', option.tone)}>
                  <Icon className="w-6 h-6" />
                </span>
                <span className="mt-5 text-white text-2xl leading-none font-black tracking-tight">{option.title}</span>
                <span className="mt-3 text-zinc-400 text-sm leading-relaxed">{option.description}</span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
