import React from 'react';
import { Users, Plus } from 'lucide-react';
import { ChooserModal, type ChooserOption } from '@/components/chronicle/ChooserModal';

interface CharacterCreationModalProps {
  open: boolean;
  onClose: () => void;
  onImportFromLibrary: () => void;
  onCreateNew: () => void;
}

const OPTIONS: ChooserOption[] = [
  {
    key: 'import',
    icon: <Users className="w-5 h-5 text-white" />,
    label: 'Import from Library',
    description: 'Browse and import an existing character',
    hoverColor: 'blue-500',
  },
  {
    key: 'new',
    icon: <Plus className="w-5 h-5 text-white" />,
    label: '+ New Character',
    description: 'Create a brand new character from scratch',
    hoverColor: 'purple-500',
  },
];

export const CharacterCreationModal: React.FC<CharacterCreationModalProps> = ({
  open,
  onClose,
  onImportFromLibrary,
  onCreateNew,
}) => {
  const handleSelect = (key: string) => {
    if (key === 'import') onImportFromLibrary();
    else onCreateNew();
  };

  return (
    <ChooserModal
      open={open}
      onClose={onClose}
      title="Character Creation"
      options={OPTIONS}
      onSelect={handleSelect}
    />
  );
};
