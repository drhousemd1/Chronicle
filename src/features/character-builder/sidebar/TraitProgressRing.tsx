import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionProgress } from '@/features/character-builder/types/character-builder.types';

interface TraitProgressRingProps {
  progress: SectionProgress;
  active: boolean;
  className?: string;
}

export const TraitProgressRing: React.FC<TraitProgressRingProps> = ({ progress, active, className }) => {
  const size = 32;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safePercent = Math.max(0, Math.min(100, progress.percent));
  const done = progress.total > 0 && progress.completed >= progress.total;
  const strokeDashoffset = done ? 0 : circumference - (safePercent / 100) * circumference;

  return (
    <span
      className={cn('relative inline-flex items-center justify-center w-8 h-8 shrink-0', className)}
      title={progress.total > 0 ? `${progress.percent}% complete (${progress.completed}/${progress.total})` : 'No fields yet'}
      aria-label={progress.total > 0 ? `${progress.percent}% complete` : 'No fields yet'}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(59,130,246,0.18)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">
        {done ? (
          <Check className="w-[14px] h-[14px] text-[#3b82f6]" />
        ) : (
          <span
            className={cn(
              'text-[10px] font-bold leading-none',
              active || safePercent > 0 ? 'text-[#eaedf1]' : 'text-[#71717a]'
            )}
          >
            {safePercent}%
          </span>
        )}
      </span>
    </span>
  );
};
