import React, { useRef, useCallback } from 'react';

interface TabFieldNavigatorProps {
  children: React.ReactNode;
  className?: string;
}

export const TabFieldNavigator: React.FC<TabFieldNavigatorProps> = ({ children, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    const container = containerRef.current;
    if (!container) return;

    const fields = Array.from(
      container.querySelectorAll<HTMLElement>(
        'textarea, input:not([type=hidden]):not([type=file]):not([type=checkbox]):not([type=radio])'
      )
    ).filter(el => !el.closest('[aria-hidden="true"]') && el.offsetParent !== null);

    const currentIndex = fields.indexOf(document.activeElement as HTMLElement);
    if (currentIndex === -1) return;

    const nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= fields.length) return;

    e.preventDefault();
    fields[nextIndex].focus();
  }, []);

  return (
    <div ref={containerRef} onKeyDown={handleKeyDown} className={className}>
      {children}
    </div>
  );
};
