import React from 'react';
import { ArcMode } from '@/types';
import { cn } from '@/lib/utils';

interface ArcModeToggleProps {
  mode: ArcMode;
  onChange: (mode: ArcMode) => void;
}

export const ArcModeToggle: React.FC<ArcModeToggleProps> = ({ mode, onChange }) => {
  return (
    <div className="flex p-1.5 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]">
      <button
        type="button"
        onClick={() => onChange('simple')}
        className={cn(
          "flex-1 px-3.5 py-1.5 text-[10px] font-black rounded-lg border-none cursor-pointer transition-all",
          mode === 'simple'
            ? "bg-[#3b82f6] text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)]"
            : "bg-[#3f3f46] text-[#a1a1aa] hover:text-zinc-300"
        )}
      >
        Simple
      </button>
      <button
        type="button"
        onClick={() => onChange('advanced')}
        className={cn(
          "flex-1 px-3.5 py-1.5 text-[10px] font-black rounded-lg border-none cursor-pointer transition-all",
          mode === 'advanced'
            ? "bg-[#3b82f6] text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)]"
            : "bg-[#3f3f46] text-[#a1a1aa] hover:text-zinc-300"
        )}
      >
        Advanced
      </button>
    </div>
  );
};