import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ScrollableSectionProps {
  children: React.ReactNode;
  maxHeight?: string;
  className?: string;
}

export const ScrollableSection: React.FC<ScrollableSectionProps> = ({
  children,
  maxHeight = '300px',
  className
}) => {
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    const hasOverflow = el.scrollHeight > el.clientHeight;
    setCanScrollUp(el.scrollTop > 2);
    setCanScrollDown(hasOverflow && el.scrollTop < el.scrollHeight - el.clientHeight - 2);
  }, []);

  useEffect(() => {
    checkScroll();
    
    // Re-check when window resizes
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll]);

  // Re-check when children change
  useEffect(() => {
    checkScroll();
  }, [children, checkScroll]);

  return (
    <div className="relative flex-1 min-h-0" style={{ maxHeight }}>
      {/* Top fade indicator */}
      <div 
        className={cn(
          "absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white via-white/80 to-transparent z-10 pointer-events-none transition-opacity duration-300 rounded-t-lg",
          canScrollUp ? "opacity-100" : "opacity-0"
        )} 
      />
      
      {/* Scrollable content */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className={cn(
          "overflow-y-auto h-full scrollbar-none",
          className
        )}
      >
        {children}
      </div>
      
      {/* Bottom fade indicator */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white via-white/80 to-transparent z-10 pointer-events-none transition-opacity duration-300 rounded-b-lg",
          canScrollDown ? "opacity-100" : "opacity-0"
        )} 
      />
    </div>
  );
};
