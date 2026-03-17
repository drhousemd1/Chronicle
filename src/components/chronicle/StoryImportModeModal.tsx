import React from 'react';
import { GitMerge, Replace } from 'lucide-react';
import { ChooserModal, type ChooserOption } from '@/components/chronicle/ChooserModal';
import type { StoryImportMode } from '@/lib/story-transfer';

interface StoryImportModeModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (mode: StoryImportMode) => void;
}

const OPTIONS: ChooserOption[] = [
  {
    key: 'merge',
    icon: <GitMerge className="w-5 h-5 text-white" />,
    label: 'Merge',
    description: 'Preserve existing content and blend in imported values.',
    hoverColor: 'blue-500',
  },
  {
    key: 'rewrite',
    icon: <Replace className="w-5 h-5 text-white" />,
    label: 'Rewrite',
    description: 'Prefer imported values when a field already has content.',
    hoverColor: 'rose-500',
  },
];

export const StoryImportModeModal: React.FC<StoryImportModeModalProps> = ({
  open,
  onClose,
  onSelect,
}) => {
  return (
    <ChooserModal
      open={open}
      onClose={onClose}
      title="Import Mode"
      options={OPTIONS}
      onSelect={(key) => onSelect(key as StoryImportMode)}
    />
  );
};
