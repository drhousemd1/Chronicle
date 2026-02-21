import React from 'react';
import { ArcMode } from '@/types';
import { cn } from '@/lib/utils';

interface ArcModeToggleProps {
  mode: ArcMode;
  onChange: (mode: ArcMode) => void;
}

export const ArcModeToggle: React.FC<ArcModeToggleProps> = ({ mode, onChange }) => {
  return (
    <div className="flex p-1 bg-zinc-900/50 rounded-lg border border-white/10">
      <button
        type="button"
        onClick={() => onChange('simple')}
        className={cn(
          "flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded border-none cursor-pointer transition-all",
          mode === 'simple'
            ? "bg-zinc-700 text-blue-400 shadow-sm"
            : "bg-transparent text-zinc-500 hover:text-zinc-300"
        )}
      >
        Simple
      </button>
      <button
        type="button"
        onClick={() => onChange('advanced')}
        className={cn(
          "flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded border-none cursor-pointer transition-all",
          mode === 'advanced'
            ? "bg-zinc-700 text-blue-400 shadow-sm"
            : "bg-transparent text-zinc-500 hover:text-zinc-300"
        )}
      >
        Advanced
      </button>
    </div>
  );
};
