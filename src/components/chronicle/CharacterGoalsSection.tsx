import React from 'react';
import { CharacterGoal, GoalMilestone, TimeOfDay } from '@/types';
import { Button } from './UI';
import { Clock, Trash2, Plus, X } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { uid, now } from '@/utils';
import { cn } from '@/lib/utils';

interface CharacterGoalsSectionProps {
  goals: CharacterGoal[];
  onChange: (goals: CharacterGoal[]) => void;
  readOnly?: boolean;
  currentDay?: number;
  currentTimeOfDay?: TimeOfDay;
}

// Time of day styling helper
const getTimeOfDayStyle = (timeOfDay: TimeOfDay) => {
  switch (timeOfDay) {
    case 'sunrise':
      return 'bg-amber-500 text-white';
    case 'day':
      return 'bg-blue-500 text-white';
    case 'sunset':
      return 'bg-orange-500 text-white';
    case 'night':
      return 'bg-indigo-900 text-white';
    default:
      return 'bg-slate-600 text-white';
  }
};

const timeOfDayOptions: TimeOfDay[] = ['sunrise', 'day', 'sunset', 'night'];

const timeOfDayLabels: Record<TimeOfDay, string> = {
  sunrise: 'Sunrise',
  day: 'Day',
  sunset: 'Sunset',
  night: 'Night'
};

// Large circular progress for goals
const GoalProgressRing: React.FC<{
  value: number;
  size?: number;
}> = ({ value, size = 100 }) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(100, Math.max(0, value));
  const offset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#334155"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#3b82f6"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-300 ease-out"
        />
      </svg>
      <span className="absolute text-xl font-bold text-white">
        {clampedValue}%
      </span>
    </div>
  );
};

export const CharacterGoalsSection: React.FC<CharacterGoalsSectionProps> = ({
  goals,
  onChange,
  readOnly = false,
  currentDay = 1,
  currentTimeOfDay = 'day'
}) => {
  // Use readOnly prop to determine if we're in edit mode
  const isEditMode = !readOnly;

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

  // Sort goals by progress descending (completed goals at top)
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

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-xl overflow-hidden">
      {/* Section Header */}
      <div className="bg-slate-500/60 px-4 py-3">
        <span className="text-emerald-300 text-xs font-semibold uppercase tracking-wider">Section</span>
        <h3 className="text-white font-bold text-lg">Character Goals</h3>
      </div>

      {/* Goals Container */}
      <div className="p-4 space-y-4">
        {sortedGoals.map((goal) => (
          <div
            key={goal.id}
            className={cn(
              "bg-slate-700 rounded-xl border p-4 relative",
              isEditMode ? "border-blue-500" : "border-slate-600"
            )}
          >
            {/* Delete Goal Button (Edit Mode) */}
            {isEditMode && (
              <button
                onClick={() => deleteGoal(goal.id)}
                className="absolute top-3 right-3 text-slate-400 hover:text-rose-400 transition-colors"
                title="Delete goal"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}

            <div className="flex gap-6">
              {/* Left Side - Goal Details */}
              <div className="flex-1 space-y-4">
                {/* Goal Name */}
                <div className={cn(
                  "rounded-lg p-3",
                  isEditMode ? "border border-blue-500 bg-slate-800" : ""
                )}>
                  <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Goal Name</span>
                  {isEditMode ? (
                    <Input
                      value={goal.title}
                      onChange={(e) => updateGoal(goal.id, { title: e.target.value })}
                      placeholder="Enter goal name..."
                      className="mt-1 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  ) : (
                    <p className="text-white text-base mt-1">{goal.title || 'No goal name set'}</p>
                  )}
                </div>

                {/* Desired Outcome */}
                <div className={cn(
                  "rounded-lg p-3",
                  isEditMode ? "border border-blue-500 bg-slate-800" : ""
                )}>
                  <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Desired Outcome</span>
                  {isEditMode ? (
                    <Textarea
                      value={goal.desiredOutcome}
                      onChange={(e) => updateGoal(goal.id, { desiredOutcome: e.target.value })}
                      placeholder="What success looks like..."
                      className="mt-1 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 min-h-[60px]"
                    />
                  ) : (
                    <p className="text-slate-200 text-sm mt-1">{goal.desiredOutcome || 'No outcome defined'}</p>
                  )}
                </div>

                {/* Current Status Summary */}
                <div className={cn(
                  "rounded-lg p-3",
                  isEditMode ? "border border-blue-500 bg-slate-800" : ""
                )}>
                  <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Current Status Summary</span>
                  {isEditMode ? (
                    <Textarea
                      value={goal.currentStatus}
                      onChange={(e) => updateGoal(goal.id, { currentStatus: e.target.value })}
                      placeholder="Progress so far..."
                      className="mt-1 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 min-h-[60px]"
                    />
                  ) : (
                    <p className="text-slate-200 text-sm mt-1">{goal.currentStatus || 'No status update'}</p>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-slate-600 my-4" />

                {/* Milestone History */}
                <div className={cn(
                  "rounded-lg p-3",
                  isEditMode ? "border border-blue-500 bg-slate-800" : ""
                )}>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Milestone History</span>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-0">
                    {(goal.milestones || []).map((milestone, index) => (
                      <div key={milestone.id} className="flex items-start gap-3 relative">
                        {/* Timeline dot and line */}
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-blue-400 z-10" />
                          {index < (goal.milestones?.length || 0) - 1 && (
                            <div className="w-0.5 h-full bg-blue-500/50 absolute top-3 left-1.5" style={{ height: 'calc(100% + 0.5rem)' }} />
                          )}
                        </div>

                        {/* Milestone content */}
                        <div className="flex-1 pb-4">
                          {isEditMode ? (
                            <div className="flex items-start gap-2">
                              <Input
                                value={milestone.description}
                                onChange={(e) => updateMilestone(goal.id, milestone.id, { description: e.target.value })}
                                placeholder="Describe this milestone..."
                                className="flex-1 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 text-sm"
                              />
                              <button
                                onClick={() => deleteMilestone(goal.id, milestone.id)}
                                className="text-slate-400 hover:text-rose-400 transition-colors p-1"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <p className="text-slate-200 text-sm">{milestone.description || 'No description'}</p>
                          )}

                          {/* Day/Time chips */}
                          <div className="flex items-center gap-2 mt-2">
                            {isEditMode ? (
                              <>
                                {/* Day input */}
                                <div className="flex items-center gap-1">
                                  <span className="text-slate-400 text-xs">Day</span>
                                  <Input
                                    type="number"
                                    value={milestone.day}
                                    onChange={(e) => updateMilestone(goal.id, milestone.id, { day: parseInt(e.target.value) || 1 })}
                                    className="w-16 h-7 bg-slate-900 border-slate-600 text-white text-xs text-center"
                                    min={1}
                                  />
                                </div>
                                {/* Time of day buttons */}
                                <div className="flex gap-1">
                                  {timeOfDayOptions.map((tod) => (
                                    <button
                                      key={tod}
                                      onClick={() => updateMilestone(goal.id, milestone.id, { timeOfDay: tod })}
                                      className={cn(
                                        "px-2 py-1 rounded text-xs font-medium transition-all",
                                        milestone.timeOfDay === tod
                                          ? getTimeOfDayStyle(tod)
                                          : "bg-slate-600 text-slate-300 hover:bg-slate-500"
                                      )}
                                    >
                                      {timeOfDayLabels[tod]}
                                    </button>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <>
                                <span className="px-2 py-1 bg-slate-800 text-white text-xs rounded font-medium">
                                  Day {milestone.day}
                                </span>
                                <span className={cn(
                                  "px-2 py-1 rounded text-xs font-medium",
                                  getTimeOfDayStyle(milestone.timeOfDay)
                                )}>
                                  {timeOfDayLabels[milestone.timeOfDay]}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Empty state */}
                  {(!goal.milestones || goal.milestones.length === 0) && (
                    <p className="text-slate-500 text-sm italic">No milestones recorded yet</p>
                  )}

                  {/* Add Milestone Button */}
                  {isEditMode && (
                    <button
                      onClick={() => addMilestone(goal.id)}
                      className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm mt-3 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Milestone Step</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Right Side - Progress Ring */}
              <div className="flex flex-col items-center justify-start w-[140px] pt-4">
                <GoalProgressRing value={goal.progress} size={100} />
                <span className="text-slate-400 text-xs uppercase tracking-wider mt-2 text-center">
                  Overall Progress
                </span>

                {/* Progress Slider (Edit Mode) */}
                {isEditMode && (
                  <div className="w-full mt-4 px-2">
                    <Slider
                      value={[goal.progress]}
                      onValueChange={([value]) => updateGoal(goal.id, { progress: value })}
                      max={100}
                      step={1}
                      className="w-full"
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
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add New Goal
          </button>
        )}
      </div>
    </div>
  );
};
