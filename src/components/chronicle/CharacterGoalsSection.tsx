import React from 'react';
import { CharacterGoal, GoalMilestone, TimeOfDay } from '@/types';
import { Trash2, Plus, X, History, Sun, Sunrise, Sunset, Moon, ChevronDown, ChevronUp } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { uid, now } from '@/utils';
import { cn } from '@/lib/utils';

interface CharacterGoalsSectionProps {
  goals: CharacterGoal[];
  onChange: (goals: CharacterGoal[]) => void;
  readOnly?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  currentDay?: number;
  currentTimeOfDay?: TimeOfDay;
}

// Time of day chip styling helper
const getTimeChipStyle = (timeOfDay: TimeOfDay) => {
  switch (timeOfDay) {
    case 'sunrise':
      return {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        text: 'text-amber-400',
        icon: Sunrise,
        label: 'Sunrise'
      };
    case 'day':
      return {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        text: 'text-blue-400',
        icon: Sun,
        label: 'Midday'
      };
    case 'sunset':
      return {
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20',
        text: 'text-orange-400',
        icon: Sunset,
        label: 'Sunset'
      };
    case 'night':
      return {
        bg: 'bg-indigo-500/10',
        border: 'border-indigo-500/20',
        text: 'text-indigo-400',
        icon: Moon,
        label: 'Night'
      };
    default:
      return {
        bg: 'bg-zinc-500/10',
        border: 'border-zinc-500/20',
        text: 'text-zinc-400',
        icon: Sun,
        label: 'Unknown'
      };
  }
};

const timeOfDayOptions: TimeOfDay[] = ['sunrise', 'day', 'sunset', 'night'];

// Progress Ring Component (96x96, r=38)
const GoalProgressRing: React.FC<{ value: number }> = ({ value }) => {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(100, Math.max(0, value));
  const offset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-24 w-24 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-zinc-800/40"
          />
          {/* Progress circle */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-blue-500 transition-all duration-300 ease-out"
          />
        </svg>
        <span className="absolute text-white font-extrabold text-lg">
          {clampedValue}%
        </span>
      </div>
      <p className="mt-3 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">
        Overall Progress
      </p>
    </div>
  );
};

// Time Chip Component
const TimeChip: React.FC<{ timeOfDay: TimeOfDay }> = ({ timeOfDay }) => {
  const style = getTimeChipStyle(timeOfDay);
  const Icon = style.icon;
  
  return (
    <div className={cn(
      "flex items-center rounded-md px-2 py-1 border",
      style.bg,
      style.border,
      style.text
    )}>
      <Icon className="h-3 w-3" />
      <span className="text-[10px] font-bold ml-1 uppercase">{style.label}</span>
    </div>
  );
};

// Day Chip Component
const DayChip: React.FC<{ day: number }> = ({ day }) => (
  <div className="flex items-center bg-zinc-800/50 rounded-md px-2 py-1 border border-white/5">
    <span className="text-[10px] font-bold text-zinc-400 mr-2">DAY</span>
    <span className="text-[11px] font-bold text-white">{day}</span>
  </div>
);

export const CharacterGoalsSection: React.FC<CharacterGoalsSectionProps> = ({
  goals,
  onChange,
  readOnly = false,
  isExpanded = true,
  onToggle,
  currentDay = 1,
  currentTimeOfDay = 'day'
}) => {
  // Note: isEditMode is recalculated after CollapsedGoalsView is defined

  // Ensure there's always at least one goal row displayed
  const displayGoals = goals.length === 0 ? [{
    id: uid('goal'),
    title: '',
    desiredOutcome: '',
    currentStatus: '',
    progress: 0,
    milestones: [],
    createdAt: now(),
    updatedAt: now()
  }] : goals;

  // Sort goals by progress descending
  const sortedGoals = [...displayGoals].sort((a, b) => b.progress - a.progress);

  // Auto-save the default goal if it was just created
  React.useEffect(() => {
    if (goals.length === 0 && displayGoals.length === 1) {
      onChange(displayGoals);
    }
  }, []);

  const addGoal = () => {
    const newGoal: CharacterGoal = {
      id: uid('goal'),
      title: '',
      desiredOutcome: '',
      currentStatus: '',
      progress: 0,
      milestones: [],
      createdAt: now(),
      updatedAt: now()
    };
    onChange([...goals, newGoal]);
  };

  const updateGoal = (id: string, patch: Partial<CharacterGoal>) => {
    onChange(goals.map(g => g.id === id ? { ...g, ...patch, updatedAt: now() } : g));
  };

  const deleteGoal = (id: string) => {
    onChange(goals.filter(g => g.id !== id));
  };

  const addMilestone = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const newMilestone: GoalMilestone = {
      id: uid('milestone'),
      description: '',
      day: currentDay,
      timeOfDay: currentTimeOfDay,
      createdAt: now()
    };

    updateGoal(goalId, {
      milestones: [...(goal.milestones || []), newMilestone]
    });
  };

  const updateMilestone = (goalId: string, milestoneId: string, patch: Partial<GoalMilestone>) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    updateGoal(goalId, {
      milestones: (goal.milestones || []).map(m =>
        m.id === milestoneId ? { ...m, ...patch } : m
      )
    });
  };

  const deleteMilestone = (goalId: string, milestoneId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    updateGoal(goalId, {
      milestones: (goal.milestones || []).filter(m => m.id !== milestoneId)
    });
  };

  // Determine if we're in view mode (collapsed or explicitly readOnly)
  const isViewMode = !isExpanded || readOnly;
  const isEditMode = isExpanded && !readOnly;

  // Condensed view for collapsed state - matching other sections' format
  const CollapsedGoalsView = () => {
    if (goals.length === 0) {
      return <p className="text-zinc-500 text-sm italic">No goals defined</p>;
    }
    return (
      <div className="space-y-6">
        {goals.map((goal) => (
          <div key={goal.id} className="space-y-4">
            {/* Goal Name */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
                Goal Name
              </span>
              <p className="text-sm text-zinc-400">
                {goal.title || 'Untitled goal'}
              </p>
            </div>
            
            {/* Desired Outcome - only show if has value */}
            {goal.desiredOutcome && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
                  Desired Outcome
                </span>
                <p className="text-sm text-zinc-400">
                  {goal.desiredOutcome}
                </p>
              </div>
            )}
            
            {/* Current Status Summary - show "None" if empty */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
                Current Status Summary
              </span>
              <p className="text-sm text-zinc-400">
                {goal.currentStatus || 'None'}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]">
      {/* Section Header */}
      <div className="bg-[#4a5f7f] border-b border-white/20 px-5 py-3 flex items-center justify-between shadow-lg">
        <h2 className="text-white text-xl font-bold tracking-tight">Character Goals</h2>
        {onToggle && (
          <button 
            onClick={onToggle} 
            className="text-white/70 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
          >
            {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          </button>
        )}
      </div>

      {/* Collapsed view */}
      {!isExpanded && (
        <div className="p-5">
          <div className="p-5 pb-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5">
            <CollapsedGoalsView />
          </div>
        </div>
      )}

      {/* Expanded Goals Container */}
      {isExpanded && (
        <div className="p-5 space-y-4">
          {sortedGoals.map((goal) => (
            <div
              key={goal.id}
              className={cn(
                "p-5 pb-6 bg-[#3a3a3f]/30 rounded-2xl border relative",
                isEditMode ? "border-blue-500/20" : "border-white/5"
              )}
            >
              {/* Delete Goal Button (Edit Mode) */}
              {isEditMode && (
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="absolute top-4 right-4 text-zinc-500 hover:text-rose-400 transition-colors"
                  title="Delete goal"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left Side - Goal Details (col-span-9) */}
                <div className="md:col-span-9 space-y-4">
                  {/* Goal Name */}
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      Goal Name
                    </label>
                    {isEditMode ? (
                      <Input
                        value={goal.title}
                        onChange={(e) => updateGoal(goal.id, { title: e.target.value })}
                        placeholder="Enter goal name..."
                        className="mt-1 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600"
                      />
                    ) : (
                      <h3 className="text-lg font-bold text-white mt-0.5">
                        {goal.title || 'No goal name set'}
                      </h3>
                    )}
                  </div>

                  {/* Desired Outcome */}
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      Desired Outcome
                    </label>
                    {isEditMode ? (
                      <Textarea
                        value={goal.desiredOutcome}
                        onChange={(e) => updateGoal(goal.id, { desiredOutcome: e.target.value })}
                        placeholder="What success looks like..."
                        className="mt-1 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 min-h-[60px]"
                      />
                    ) : (
                      <p className="text-sm text-zinc-300 mt-0.5">
                        {goal.desiredOutcome || 'No outcome defined'}
                      </p>
                    )}
                  </div>

                  {/* Current Status Summary */}
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      Current Status Summary
                    </label>
                    {isEditMode ? (
                      <Textarea
                        value={goal.currentStatus}
                        onChange={(e) => updateGoal(goal.id, { currentStatus: e.target.value })}
                        placeholder="Progress so far..."
                        className="mt-1 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 min-h-[60px]"
                      />
                    ) : (
                      <p className="text-sm text-zinc-300 mt-0.5">
                        {goal.currentStatus || 'No status update'}
                      </p>
                    )}
                  </div>

                  {/* Milestone History */}
                  <div className="mt-6 pt-6 border-t border-white/5">
                    <h4 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <History className="h-4 w-4 text-blue-400" />
                      Milestone History
                    </h4>

                    {(goal.milestones && goal.milestones.length > 0) ? (
                      <div className="space-y-3 pl-2 relative">
                        {/* Vertical timeline line */}
                        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-zinc-700/50" />

                        {goal.milestones.map((milestone) => (
                          <div key={milestone.id} className="relative flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              {/* Timeline dot */}
                              <div className="h-3.5 w-3.5 rounded-full bg-blue-500/80 ring-2 ring-blue-500/10 z-10 flex-shrink-0" />
                              
                              {isEditMode ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <Input
                                    value={milestone.description}
                                    onChange={(e) => updateMilestone(goal.id, milestone.id, { description: e.target.value })}
                                    placeholder="Describe this milestone..."
                                    className="bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 text-sm h-8"
                                  />
                                  <button
                                    onClick={() => deleteMilestone(goal.id, milestone.id)}
                                    className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-sm text-zinc-200">
                                  {milestone.description || 'No description'}
                                </span>
                              )}
                            </div>

                            {/* Day/Time chips */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {isEditMode ? (
                                <>
                                  <div className="flex items-center gap-1">
                                    <span className="text-zinc-500 text-[10px]">Day</span>
                                    <Input
                                      type="number"
                                      value={milestone.day}
                                      onChange={(e) => updateMilestone(goal.id, milestone.id, { day: parseInt(e.target.value) || 1 })}
                                      className="w-14 h-7 bg-zinc-900/50 border-white/10 text-white text-xs text-center"
                                      min={1}
                                    />
                                  </div>
                                  <div className="flex gap-1">
                                    {timeOfDayOptions.map((tod) => {
                                      const style = getTimeChipStyle(tod);
                                      return (
                                        <button
                                          key={tod}
                                          onClick={() => updateMilestone(goal.id, milestone.id, { timeOfDay: tod })}
                                          className={cn(
                                            "px-1.5 py-0.5 rounded text-[10px] font-medium transition-all border",
                                            milestone.timeOfDay === tod
                                              ? cn(style.bg, style.border, style.text)
                                              : "bg-zinc-800/30 border-white/5 text-zinc-500 hover:text-zinc-300"
                                          )}
                                        >
                                          {style.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <DayChip day={milestone.day} />
                                  <TimeChip timeOfDay={milestone.timeOfDay} />
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-zinc-500 text-sm italic pl-2">No milestones recorded yet</p>
                    )}

                    {/* Add Milestone Button */}
                    {isEditMode && (
                      <button
                        onClick={() => addMilestone(goal.id)}
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm mt-4 ml-2 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Milestone Step</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Side - Progress Ring (col-span-3) */}
                <div className="md:col-span-3 flex flex-col items-center justify-start pt-4">
                  <GoalProgressRing value={goal.progress} />

                  {/* Progress Slider (Edit Mode) */}
                  {isEditMode && (
                    <div className="w-full mt-4 px-2">
                      <Slider
                        value={[goal.progress]}
                        onValueChange={([value]) => updateGoal(goal.id, { progress: value })}
                        max={100}
                        step={1}
                        className="w-full [&>span:first-child]:bg-zinc-700 [&>span:first-child>span]:bg-blue-500 [&_[role=slider]]:border-blue-500 [&_[role=slider]]:bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Add New Goal Button */}
          {isEditMode && (
            <button
              onClick={addGoal}
              className="w-full py-3 bg-transparent border-2 border-dashed border-zinc-500 text-blue-400 hover:border-blue-400 hover:bg-blue-500/5 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add New Goal
            </button>
          )}
        </div>
      )}
    </div>
  );
};
