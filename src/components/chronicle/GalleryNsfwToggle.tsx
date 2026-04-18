import React from 'react';
import { LabeledToggle } from '@/components/ui/labeled-toggle';
import { cn } from '@/lib/utils';

interface GalleryNsfwToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export const GalleryNsfwToggle: React.FC<GalleryNsfwToggleProps> = ({
  checked,
  onCheckedChange,
  className,
}) => {
  return (
    <LabeledToggle
      checked={checked}
      onCheckedChange={onCheckedChange}
      offLabel="Hide NSFW"
      onLabel="Show NSFW"
      labelTone="dark"
      className={cn('gap-2.5', className)}
    />
  );
};
