import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddCharacterPlaceholderCardProps {
  label: string;
  hasError?: boolean;
  onClick: () => void;
}

export const AddCharacterPlaceholderCard: React.FC<AddCharacterPlaceholderCardProps> = ({
  label,
  hasError,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all flex items-center justify-center gap-1.5',
      hasError && 'border border-red-500 ring-2 ring-red-500'
    )}
  >
    <Plus size={16} />
    <span>{label}</span>
  </button>
);
