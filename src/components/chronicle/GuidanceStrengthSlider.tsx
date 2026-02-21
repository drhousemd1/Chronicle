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
      <div style={{ margin: '14px 0 6px' }}>
        <span style={{
          fontSize: '11px',
          letterSpacing: '0.22em',
          color: 'rgba(198,212,236,0.84)',
          fontWeight: 700,
          textTransform: 'uppercase',
        }}>
          Guidance Strength
        </span>
      </div>
      {/* Subtitle */}
      <p style={{
        fontSize: '16px',
        color: 'rgba(171,185,208,0.86)',
        margin: '0 0 10px',
      }}>
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
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${fillPercent}%`,
            borderRadius: '999px',
            background: 'linear-gradient(90deg, #2b4e8d, #4b79d8 60%, #7dadf5)',
            transition: 'width 0.2s ease',
          }}
        />
        {/* Knob */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: `${fillPercent}%`,
            transform: 'translate(-50%, -50%)',
            width: '24px',
            height: '24px',
            borderRadius: '999px',
            background: '#FFFFFF',
            border: '3px solid #4b79d8',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            transition: 'left 0.2s ease',
          }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between" style={{ marginTop: '8px' }}>
        {LEVELS.map((level) => (
          <span
            key={level.value}
            onClick={() => onChange(level.value)}
            className="cursor-pointer"
            style={{
              fontSize: '11px',
              letterSpacing: '0.16em',
              fontWeight: 700,
              textTransform: 'uppercase' as const,
              color: value === level.value ? '#6ea1ff' : 'rgba(198,213,238,0.5)',
              transition: 'color 0.15s',
            }}
          >
            {level.label}
          </span>
        ))}
      </div>

      {/* Description body */}
      <div style={{
        marginTop: '12px',
        borderRadius: '16px',
        background: 'rgba(37,40,50,0.92)',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '18px',
      }}>
        <p style={{
          fontSize: '15px',
          color: 'rgba(206,216,233,0.88)',
          lineHeight: 1.45,
          margin: 0,
        }}>
          {DESCRIPTIONS[value]}
        </p>
      </div>
    </div>
  );
};
