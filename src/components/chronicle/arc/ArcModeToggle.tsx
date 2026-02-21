import React from 'react';
import { ArcMode } from '@/types';
import { cn } from '@/lib/utils';

interface ArcModeToggleProps {
  mode: ArcMode;
  onChange: (mode: ArcMode) => void;
}

export const ArcModeToggle: React.FC<ArcModeToggleProps> = ({ mode, onChange }) => {
  return (
    <div className="flex items-center bg-zinc-800/80 rounded-lg border border-white/10 overflow-hidden">
      <button
        type="button"
        onClick={() => onChange('simple')}
        className={cn(
          "px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-colors",
          mode === 'simple'
            ? "bg-blue-500/20 text-blue-400"
            : "text-zinc-500 hover:text-zinc-300"
        )}
      >
        Simple
      </button>
      <button
        type="button"
        onClick={() => onChange('advanced')}
        className={cn(
          "px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-colors",
          mode === 'advanced'
            ? "bg-blue-500/20 text-blue-400"
            : "text-zinc-500 hover:text-zinc-300"
        )}
      >
        Advanced
      </button>
    </div>
  );
};
