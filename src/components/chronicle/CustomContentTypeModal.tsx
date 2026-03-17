import React from 'react';
import { List, AlignLeft } from 'lucide-react';
import { ChooserModal, type ChooserOption } from '@/components/chronicle/ChooserModal';
import type { WorldCustomSectionType } from '@/types';

interface CustomContentTypeModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: WorldCustomSectionType) => void;
}

const OPTIONS: ChooserOption[] = [
  {
    key: 'structured',
    icon: <List className="w-5 h-5 text-white" />,
    label: 'Structured',
    description: 'Label + description rows for organized entries',
    hoverColor: 'blue-500',
  },
  {
    key: 'freeform',
    icon: <AlignLeft className="w-5 h-5 text-white" />,
    label: 'Freeform',
    description: 'A single open text field like Story Premise',
    hoverColor: 'purple-500',
  },
];

export const CustomContentTypeModal: React.FC<CustomContentTypeModalProps> = ({
  open,
  onClose,
  onSelect,
}) => {
  return (
    <ChooserModal
      open={open}
      onClose={onClose}
      title="Content Type"
      options={OPTIONS}
      onSelect={(key) => onSelect(key as WorldCustomSectionType)}
    />
  );
};
