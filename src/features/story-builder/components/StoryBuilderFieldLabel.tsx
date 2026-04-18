import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type StoryBuilderFieldLabelProps = {
  label: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  onEnhance?: () => void;
};

export function StoryBuilderFieldLabel({
  label,
  isLoading = false,
  isDisabled = false,
  onEnhance,
}: StoryBuilderFieldLabelProps) {
  return (
    <div className="mb-1 flex items-center gap-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
        {label}
      </label>
      {onEnhance ? (
        <button
          type="button"
          tabIndex={-1}
          onClick={onEnhance}
          disabled={isLoading || isDisabled}
          title="Enhance with AI"
          className={cn(
            'relative flex flex-shrink-0 items-center justify-center overflow-hidden rounded-lg p-[6px] text-cyan-200 transition-all',
            isLoading
              ? 'animate-pulse cursor-wait'
              : isDisabled
                ? 'cursor-not-allowed opacity-50'
                : 'hover:brightness-125'
          )}
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.40)' }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-lg"
            style={{
              background:
                'linear-gradient(90deg, rgba(255,255,255,0.34) 0%, rgba(34,184,200,0.62) 18%, rgba(255,255,255,0.22) 44%, rgba(109,94,247,0.64) 78%, rgba(255,255,255,0.28) 100%)',
            }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute rounded-[6px]"
            style={{
              inset: '1.5px',
              background: 'linear-gradient(90deg, rgba(34,184,200,0.22), rgba(109,94,247,0.22)), #2B2D33',
            }}
          />
          <Sparkles
            size={13}
            className="relative z-10"
            style={{ filter: 'drop-shadow(0 0 6px rgba(34,184,200,0.50))' }}
          />
        </button>
      ) : null}
    </div>
  );
}
