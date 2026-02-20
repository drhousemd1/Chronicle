
import React from 'react';
import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  size = 16,
  interactive = false,
  onChange,
  className,
}) => {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);
  const displayRating = hoverRating ?? rating;

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: maxStars }, (_, i) => {
        const starIndex = i + 1;
        const isFull = displayRating >= starIndex;
        const isHalf = !isFull && displayRating >= starIndex - 0.5;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(starIndex)}
            onMouseEnter={() => interactive && setHoverRating(starIndex)}
            onMouseLeave={() => interactive && setHoverRating(null)}
            className={cn(
              'p-0 border-0 bg-transparent',
              interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'
            )}
          >
            {isHalf ? (
              <div className="relative" style={{ width: size, height: size }}>
                <Star style={{ width: size, height: size }} className="text-white/20 absolute inset-0" />
                <StarHalf style={{ width: size, height: size }} className="text-amber-400 fill-amber-400 absolute inset-0" />
              </div>
            ) : (
              <Star
                style={{ width: size, height: size }}
                className={cn(
                  isFull ? 'text-amber-400 fill-amber-400' : 'text-white/20'
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
