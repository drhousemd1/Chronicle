import React from 'react';
import { ArcMode } from '@/types';
import { cn } from '@/lib/utils';

interface ArcModeToggleProps {
  mode: ArcMode;
  onChange: (mode: ArcMode) => void;
}

export const ArcModeToggle: React.FC<ArcModeToggleProps> = ({ mode, onChange }) => {
  return (
    <div
      className="flex items-center overflow-hidden rounded-full border border-blue-400/40 bg-[rgba(21,25,35,0.86)]"
    >
      <button
        type="button"
        onClick={() => onChange('simple')}
        className={cn(
          "px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full border-none cursor-pointer transition-all",
          mode === 'simple'
            ? "bg-[rgba(99,135,194,0.58)] text-blue-50"
            : "bg-transparent text-zinc-400"
        )}
      >
        Simple
      </button>
      <button
        type="button"
        onClick={() => onChange('advanced')}
        className={cn(
          "px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full border-none cursor-pointer transition-all",
          mode === 'advanced'
            ? "bg-[rgba(99,135,194,0.58)] text-blue-50"
            : "bg-transparent text-zinc-400"
        )}
      >
        Advanced
      </button>
    </div>
  );
};
