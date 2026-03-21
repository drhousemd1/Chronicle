import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavButtonImageConfig, SectionProgress } from '@/features/character-builder/types/character-builder.types';
import { TraitProgressRing } from '@/features/character-builder/sidebar/TraitProgressRing';

interface TraitNavButtonProps {
  label: string;
  progress: SectionProgress;
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  backgroundImage?: NavButtonImageConfig;
}

export const TraitNavButton: React.FC<TraitNavButtonProps> = ({
  label,
  progress,
  active,
  onClick,
  icon: Icon,
  backgroundImage,
}) => {
  const hasMeaningfulProgress = progress.total > 0 && progress.percent > 0;
  const isCompleted = progress.total > 0 && progress.completed >= progress.total;
  const highlightIcon = active || hasMeaningfulProgress || isCompleted;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative w-full min-h-[60px] px-[14px] rounded-xl border-2 border-transparent text-left select-none overflow-hidden',
        'flex items-center justify-between gap-3',
        'bg-[#3c3e47] text-[#eaedf1]',
        'shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]',
        'transition-[filter,transform,box-shadow,border-color] duration-150 ease-out',
        'hover:brightness-[1.12] hover:-translate-y-px active:brightness-95 active:translate-y-0 active:scale-[0.99]',
        active && 'border-[#3b82f6] shadow-[0_8px_24px_rgba(59,130,246,0.35),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]'
      )}
    >
      {backgroundImage && (
        <>
          <img
            src={backgroundImage.src}
            alt=""
            aria-hidden
            className="absolute top-0 left-0 pointer-events-none select-none max-w-none"
            style={{
              transformOrigin: '0 0',
              transform: `translate(${backgroundImage.x}px, ${backgroundImage.y}px) scale(${backgroundImage.scale})`,
            }}
          />
          <span
            className={cn(
              'absolute inset-0 pointer-events-none',
              active ? 'bg-black/[0.38]' : 'bg-black/[0.52]'
            )}
          />
        </>
      )}

      <span className="relative z-10 min-w-0 flex items-center gap-[10px]">
        <Icon
          className={cn(
            'w-[18px] h-[18px] shrink-0',
            highlightIcon ? 'text-[#60a5fa]' : 'text-[#6b7280]'
          )}
        />
        <span className="truncate text-[12px] font-black tracking-[0.08em] leading-tight text-[#eaedf1]">
          {label}
        </span>
      </span>

      <TraitProgressRing progress={progress} active={active} className="relative z-10" />
    </button>
  );
};
