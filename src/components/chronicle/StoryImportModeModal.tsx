import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { GitMerge, Replace } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StoryImportMode } from '@/lib/story-transfer';

interface StoryImportModeModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (mode: StoryImportMode) => void;
}

const OPTIONS: Array<{
  id: StoryImportMode;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}> = [
  {
    id: 'merge',
    title: 'Merge',
    description: 'Preserve existing content and blend in imported values.',
    icon: GitMerge,
    tone: 'text-sky-300 bg-sky-500/20 group-hover:bg-sky-500/30',
  },
  {
    id: 'rewrite',
    title: 'Rewrite',
    description: 'Prefer imported values when a field already has content.',
    icon: Replace,
    tone: 'text-rose-300 bg-rose-500/20 group-hover:bg-rose-500/30',
  },
];

export const StoryImportModeModal: React.FC<StoryImportModeModalProps> = ({
  open,
  onClose,
  onSelect,
}) => {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-xl bg-zinc-900 border-ghost-white p-0 gap-0 [&>button]:hidden">
        <div className="px-8 pt-7 pb-4">
          <h3 className="text-white text-4xl leading-none tracking-tight font-black">Import Mode</h3>
          <p className="text-zinc-400 text-lg mt-3">Choose how imported values should apply.</p>
        </div>
        <div className="px-8 pb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
