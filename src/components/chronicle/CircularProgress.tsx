import React from 'react';
import { cn } from '@/lib/utils';

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  onClick?: () => void;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 40,
  strokeWidth = 3,
  className,
  onClick
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(100, Math.max(0, value));
  const offset = circumference - (clampedValue / 100) * circumference;

  const getColor = () => {
    if (clampedValue >= 100) return '#22c55e'; // green-500
    if (clampedValue > 0) return '#3b82f6';    // blue-500
    return '#94a3b8';                           // slate-400
  };

  const getTextColor = () => {
    if (clampedValue >= 100) return 'text-green-600';
    if (clampedValue > 0) return 'text-blue-600';
    return 'text-slate-400';
  };

  return (
    <div 
      className={cn(
        "relative inline-flex items-center justify-center",
        onClick && "cursor-pointer hover:opacity-80 transition-opacity",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-300 ease-out"
        />
      </svg>
      <span className={cn(
        "absolute text-[10px] font-bold",
        getTextColor()
      )}>
        {clampedValue}%
      </span>
    </div>
  );
};
