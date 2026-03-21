import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CharacterExtraRow } from '@/types';
import { AutoResizeTextareaField } from '@/features/character-builder/rows/AutoResizeTextareaField';

interface ExtraRowProps {
  extra: CharacterExtraRow;
  onUpdate: (patch: Partial<CharacterExtraRow>) => void;
  onDelete: () => void;
  onEnhance?: () => void;
  isEnhancing?: boolean;
}

export const ExtraRow: React.FC<ExtraRowProps> = ({
  extra,
  onUpdate,
  onDelete,
  onEnhance,
  isEnhancing,
}) => (
  <div className="flex flex-col gap-2 md:flex-row md:items-start">
    <div className="w-full md:w-2/5 flex items-center gap-1.5 min-w-0">
      <AutoResizeTextareaField
        value={extra.label}
        onChange={(value) => onUpdate({ label: value })}
        placeholder="LABEL"
        className="flex-1 px-3 py-2 text-xs font-bold bg-[#1c1c1f] border border-black/35 text-zinc-400 uppercase tracking-widest placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-w-0"
      />
      {onEnhance && (
        <button
          tabIndex={-1}
          type="button"
          onClick={onEnhance}
          disabled={isEnhancing}
          title="Enhance with AI"
          className={cn(
            'relative flex items-center justify-center flex-shrink-0 rounded-lg p-[6px] overflow-hidden text-cyan-200 transition-all',
            isEnhancing ? 'animate-pulse cursor-wait' : 'hover:brightness-125'
          )}
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.40)' }}
        >
          <span
            aria-hidden
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, rgba(255,255,255,0.34) 0%, rgba(34,184,200,0.62) 18%, rgba(255,255,255,0.22) 44%, rgba(109,94,247,0.64) 78%, rgba(255,255,255,0.28) 100%)',
            }}
          />
          <span
            aria-hidden
            className="absolute rounded-[6px] pointer-events-none"
            style={{
              inset: '1.5px',
              background: 'linear-gradient(90deg, rgba(34,184,200,0.22), rgba(109,94,247,0.22)), #2B2D33',
            }}
          />
          <Sparkles size={13} className="relative z-10" style={{ filter: 'drop-shadow(0 0 6px rgba(34,184,200,0.50))' }} />
        </button>
      )}
    </div>
    <AutoResizeTextareaField
      value={extra.value}
      onChange={(value) => onUpdate({ value })}
      placeholder="Description"
      className="w-full md:flex-1 px-3 py-2 text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-w-0"
    />
    <button
      type="button"
      tabIndex={-1}
      onClick={onDelete}
      className="self-end text-red-500 hover:text-red-400 p-1.5 rounded-md hover:bg-red-900/30 md:mt-1 flex-shrink-0"
    >
      <X className="w-4 h-4" />
    </button>
  </div>
);
