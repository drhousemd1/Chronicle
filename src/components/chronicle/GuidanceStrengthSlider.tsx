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
    <div className="space-y-3">
      {/* Header */}
      <div>
        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Guidance Strength</h4>
        <p className="text-[10px] text-zinc-500 mt-0.5">How strongly the AI should steer toward this goal.</p>
      </div>

      {/* Slider track */}
      <div className="relative pt-2 pb-6">
        {/* Track background - gradient blue */}
        <div className="h-2.5 rounded-full overflow-hidden"
          style={{ background: 'linear-gradient(to right, #1a2a4a, #2563eb, #60a5fa)' }}
        />

        {/* Thumb positions at 0%, 50%, 100% */}
        {LEVELS.map((level, idx) => {
          const leftPercent = idx === 0 ? '0%' : idx === 1 ? '50%' : '100%';
          const isActive = activeIdx === idx;
          return (
            <button
              key={level.value}
              type="button"
              onClick={() => onChange(level.value)}
              className="absolute top-[17px]"
              style={{ left: leftPercent, transform: 'translateX(-50%) translateY(-50%)' }}
              aria-label={level.label}
            >
              {isActive ? (
                <div className="w-5 h-5 rounded-full bg-white border-2 border-blue-500 shadow-lg shadow-blue-500/30" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-500 bg-zinc-800" />
              )}
            </button>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex justify-between px-1">
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
      <div className="bg-zinc-800/60 border border-white/5 rounded-xl px-4 py-3">
        <p className="text-xs text-zinc-400 leading-relaxed">{DESCRIPTIONS[value]}</p>
      </div>
    </div>
  );
};
