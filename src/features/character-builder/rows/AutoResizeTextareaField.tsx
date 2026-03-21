import React from 'react';
import { cn } from '@/lib/utils';

interface AutoResizeTextareaFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}

export const AutoResizeTextareaField: React.FC<AutoResizeTextareaFieldProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  rows = 1,
}) => {
  const ref = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = 'auto';
    ref.current.style.height = `${ref.current.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      spellCheck={true}
      className={cn('w-full min-w-0 resize-none overflow-hidden whitespace-pre-wrap break-words', className)}
    />
  );
};
