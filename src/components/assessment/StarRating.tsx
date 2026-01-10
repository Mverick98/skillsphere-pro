import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  level: number;
  maxLevel?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const StarRating = ({
  level,
  maxLevel = 5,
  size = 'md',
  showLabel = true
}: StarRatingProps) => {
  const sizes = {
    xs: { star: 'h-3 w-3', gap: 'gap-0.5', label: 'text-xs' },
    sm: { star: 'h-4 w-4', gap: 'gap-1', label: 'text-sm' },
    md: { star: 'h-6 w-6', gap: 'gap-1', label: 'text-base' },
    lg: { star: 'h-8 w-8', gap: 'gap-1.5', label: 'text-lg' },
  };

  const levelLabels = ['Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];
  const { star, gap, label } = sizes[size];

  return (
    <div className="flex flex-col items-center">
      <div className={cn('flex', gap)}>
        {Array.from({ length: maxLevel }, (_, i) => (
          <Star
            key={i}
            className={cn(
              star,
              i < level
                ? 'fill-amber-400 text-amber-400'
                : 'text-muted-foreground/30'
            )}
          />
        ))}
      </div>
      {showLabel && level > 0 && level <= levelLabels.length && (
        <span className={cn('mt-1 font-medium text-amber-600', label)}>
          {levelLabels[level - 1]}
        </span>
      )}
    </div>
  );
};

export default StarRating;
