import React from 'react';
import { FileText, FileJson2, FileType2 } from 'lucide-react';
import { ChooserModal, type ChooserOption } from '@/components/chronicle/ChooserModal';

export type StoryExportFormat = 'markdown' | 'json' | 'word';

interface StoryExportFormatModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (format: StoryExportFormat) => void;
}

const OPTIONS: ChooserOption[] = [
  {
    key: 'markdown',
    icon: <FileText className="w-5 h-5 text-white" />,
    label: 'Markdown',
    description: 'Readable export with embedded restore data.',
    hoverColor: 'blue-500',
  },
  {
    key: 'json',
    icon: <FileJson2 className="w-5 h-5 text-white" />,
    label: 'JSON',
    description: 'Full-fidelity backup for exact re-import.',
    hoverColor: 'emerald-500',
  },
  {
    key: 'word',
    icon: <FileType2 className="w-5 h-5 text-white" />,
    label: 'Word Document',
    description: 'Readable Word export with embedded restore data.',
    hoverColor: 'indigo-500',
  },
];

export const StoryExportFormatModal: React.FC<StoryExportFormatModalProps> = ({
  open,
  onClose,
  onSelect,
}) => {
  return (
    <ChooserModal
      open={open}
      onClose={onClose}
      title="Export Story"
      options={OPTIONS}
      onSelect={(key) => onSelect(key as StoryExportFormat)}
      columns={3}
    />
  );
};
