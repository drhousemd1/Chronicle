import React from 'react';
import { Sparkles, AlignLeft } from 'lucide-react';
import { ChooserModal, type ChooserOption } from '@/components/chronicle/ChooserModal';

export type EnhanceMode = 'precise' | 'detailed';

interface EnhanceModeModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (mode: EnhanceMode) => void;
}

const OPTIONS: ChooserOption[] = [
  {
    key: 'precise',
    icon: <Sparkles className="w-5 h-5 text-white" />,
    label: 'Precise',
    description: 'Short, semicolon-separated tags focusing on key attributes',
    hoverColor: 'blue-500',
  },
  {
    key: 'detailed',
    icon: <AlignLeft className="w-5 h-5 text-white" />,
    label: 'Detailed',
    description: '1-2 sentence vivid description for immersive roleplay',
    hoverColor: 'purple-500',
  },
];

export const EnhanceModeModal: React.FC<EnhanceModeModalProps> = ({
  open,
  onClose,
  onSelect,
}) => {
  return (
    <ChooserModal
      open={open}
      onClose={onClose}
      title="Enhancement Style"
      options={OPTIONS}
      onSelect={(key) => onSelect(key as EnhanceMode)}
    />
  );
};
