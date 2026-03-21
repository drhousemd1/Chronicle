import React from 'react';
import { Sparkles, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AutoResizeTextareaField } from '@/features/character-builder/rows/AutoResizeTextareaField';

interface HardcodedRowProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onEnhance?: () => void;
  isEnhancing?: boolean;
}

export const HardcodedRow: React.FC<HardcodedRowProps> = ({
  label,
  value,
  onChange,
  placeholder,
  onEnhance,
  isEnhancing,
}) => (
  <div className="flex flex-col gap-2 md:flex-row md:items-start">
    <div className="w-full md:w-2/5 flex items-center gap-1.5 min-w-0">
      <div className="flex-1 px-3 py-2 text-xs font-bold bg-[#1c1c1f] border border-black/35 text-zinc-400 rounded-lg uppercase tracking-widest min-w-0 break-words">
        {label}
      </div>
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
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full md:flex-1 px-3 py-2 text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-w-0"
    />
    <div className="flex w-full flex-shrink-0 items-center justify-end md:w-7 md:justify-center">
      <Lock className="w-3.5 h-3.5 text-zinc-400" />
    </div>
  </div>
);
