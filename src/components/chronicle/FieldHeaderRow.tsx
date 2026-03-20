import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Standardized header row for builder field labels.
 * Ensures a fixed minimum height (matching the tallest variant — the AI enhance button row)
 * so that the spacing between the header and the input below is visually consistent
 * regardless of whether the row contains plain text, AI buttons, tooltips, or trash icons.
 */
export const FieldHeaderRow: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn("flex items-center gap-2 min-h-[25px] mb-1.5", className)}>
    {children}
  </div>
);
