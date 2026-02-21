import React from 'react';
import { GoalFlexibility } from '@/types';
import { cn } from '@/lib/utils';

interface GuidanceStrengthSliderProps {
  value: GoalFlexibility;
  onChange: (value: GoalFlexibility) => void;
}

const LEVELS: { value: GoalFlexibility; label: string }[] = [
  { value: 'rigid', label: 'RIGID' },
  { value: 'normal', label: 'NORMAL' },
  { value: 'flexible', label: 'FLEXIBLE' },
];

const DESCRIPTIONS: Record<GoalFlexibility, string> = {
  rigid: "Treat the goal as the primary story arc and ultimate focus. Allow organic deviations, subplots, and temporary shifts based on user inputs, but always keep the goal in mind and steer the narrative back naturally over time through character actions, events, or motivations. Do not abandon or diminish the goal's importance, integrating it seamlessly as the story progresses toward resolution.",
  normal: "Steer towards the goal by weaving it in naturally when opportunities arise. Make persistent attempts to incorporate and advance it throughout the story, even in the face of initial user resistance, but allow gradual adaptation if the user's inputs show sustained and consistent conflict with the goal, treating it as a recurring influence until deviation becomes clearly dominant.",
  flexible: "Steer towards the goal with light guidance. Make a few subtle attempts (e.g., 2-3 opportunities) to incorporate it, but prioritize flexibility and adapt fully to story deviations if the user's inputs continue to conflict, letting the narrative evolve based on player choices.",
};

const VALUE_PERCENT: Record<GoalFlexibility, number> = {
  rigid: 0,
  normal: 50,
  flexible: 100,
};

export const GuidanceStrengthSlider: React.FC<GuidanceStrengthSliderProps> = ({ value, onChange }) => {
  const fillPercent = VALUE_PERCENT[value];

  return (
    <div>
      {/* Title */}
      <div className="mt-3.5 mb-1.5">
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
          Guidance Strength
        </span>
      </div>
      {/* Subtitle */}
      <p className="text-sm text-zinc-400 mb-2.5">
        How strongly the AI should steer toward this goal.
      </p>

      {/* Slider track */}
      <div
        className="relative w-full cursor-pointer"
        style={{ height: '12px', borderRadius: '999px', background: 'rgba(21,25,34,0.95)' }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = ((e.clientX - rect.left) / rect.width) * 100;
          if (pct < 33) onChange('rigid');
          else if (pct < 67) onChange('normal');
          else onChange('flexible');
        }}
      >
        {/* Fill */}
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-[width] duration-200 ease-out"
          style={{
            width: `${fillPercent}%`,
            background: 'linear-gradient(90deg, #2b4e8d, #4b79d8 60%, #7dadf5)',
          }}
        />
        {/* Knob */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-[3px] border-blue-500 shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-[left] duration-200 ease-out"
          style={{ left: `${fillPercent}%`, transform: `translate(-50%, -50%)` }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-2">
        {LEVELS.map((level) => (
          <span
            key={level.value}
            onClick={() => onChange(level.value)}
            className={cn(
              "cursor-pointer text-[10px] font-black uppercase tracking-widest transition-colors",
              value === level.value ? "text-blue-400" : "text-zinc-500"
            )}
          >
            {level.label}
          </span>
        ))}
      </div>

      {/* Description body */}
      <div className="mt-3 bg-zinc-900 rounded-xl p-4 border border-white/5">
        <p className="text-sm text-zinc-400 leading-relaxed m-0">
          {DESCRIPTIONS[value]}
        </p>
      </div>
    </div>
  );
};
