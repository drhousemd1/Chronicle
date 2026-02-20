
import React from 'react';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpiceRatingProps {
  rating: number;
  maxLevel?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

export const SpiceRating: React.FC<SpiceRatingProps> = ({
  rating,
  maxLevel = 5,
  size = 16,
  interactive = false,
  onChange,
  className,
}) => {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);
  const displayRating = hoverRating ?? rating;

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: maxLevel }, (_, i) => {
        const level = i + 1;
        const isFilled = displayRating >= level;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(level)}
            onMouseEnter={() => interactive && setHoverRating(level)}
            onMouseLeave={() => interactive && setHoverRating(null)}
            className={cn(
              'p-0 border-0 bg-transparent',
              interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'
            )}
          >
            <Flame
              style={{ width: size, height: size }}
              className={cn(
                isFilled ? 'text-red-500 fill-red-500' : 'text-white/20'
              )}
            />
          </button>
        );
      })}
    </div>
  );
};
