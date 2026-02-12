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

const valueToIndex = (v: GoalFlexibility) => LEVELS.findIndex(l => l.value === v);

export const GuidanceStrengthSlider: React.FC<GuidanceStrengthSliderProps> = ({ value, onChange }) => {
  const activeIdx = valueToIndex(value);

  return (
    <div className="space-y-2">
      {/* Header */}
      <div>
        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Guidance Strength</h4>
        <p className="text-[10px] text-zinc-500 mt-0.5">How strongly the AI should steer toward this goal.</p>
      </div>

      {/* Slider track */}
      <div className="relative flex items-center h-8">
        {/* Gradient track */}
        <div className="absolute w-full h-2.5 rounded-full"
          style={{ background: 'linear-gradient(to right, #1a2a4a, #2563eb, #60a5fa)' }}
        />
        {/* Dot positions */}
        <div className="absolute inset-0 flex items-center justify-between">
          {LEVELS.map((level, idx) => {
            const isActive = activeIdx === idx;
            return (
              <button
                key={level.value}
                type="button"
                onClick={() => onChange(level.value)}
                className="flex items-center justify-center"
                aria-label={level.label}
              >
                {isActive ? (
                  <div className="w-[18px] h-[18px] rounded-full bg-white border-2 border-blue-500 shadow-lg shadow-blue-500/30" />
                ) : (
                  <div className="w-[14px] h-[14px] rounded-full border-2 border-zinc-500 bg-zinc-800" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-1">
        {LEVELS.map((level) => (
          <span
            key={level.value}
            className={cn(
              "text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer",
              value === level.value ? "text-blue-400" : "text-zinc-600"
            )}
            onClick={() => onChange(level.value)}
          >
            {level.label}
          </span>
        ))}
      </div>

      {/* Hint text */}
      <div className="bg-zinc-800/60 border border-white/5 rounded-lg px-5 py-3 mt-2">
        <p className="text-xs text-zinc-400 leading-relaxed">{DESCRIPTIONS[value]}</p>
      </div>
    </div>
  );
};
