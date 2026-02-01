import React, { useState } from 'react';
import { CharacterGoal } from '@/types';
import { Card, Button } from './UI';
import { Icons } from '@/constants';
import { CircularProgress } from './CircularProgress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { uid, now } from '@/utils';

interface CharacterGoalsSectionProps {
  goals: CharacterGoal[];
  onChange: (goals: CharacterGoal[]) => void;
  readOnly?: boolean;
}

export const CharacterGoalsSection: React.FC<CharacterGoalsSectionProps> = ({
  goals,
  onChange,
  readOnly = false
}) => {
  const [editingProgressId, setEditingProgressId] = useState<string | null>(null);
  const [tempProgress, setTempProgress] = useState<string>('');

  // Ensure there's always at least one goal row displayed
  const displayGoals = goals.length === 0 ? [{
    id: uid('goal'),
    title: '',
    desiredOutcome: '',
    currentStatus: '',
    progress: 0,
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

  const handleProgressClick = (goal: CharacterGoal) => {
    if (readOnly) return;
    setEditingProgressId(goal.id);
    setTempProgress(goal.progress.toString());
  };

  const handleProgressSubmit = (goalId: string) => {
    const value = Math.min(100, Math.max(0, parseInt(tempProgress) || 0));
    updateGoal(goalId, { progress: value });
    setEditingProgressId(null);
    setTempProgress('');
  };

  return (
    <Card className="p-6 space-y-4 !shadow-[0_12px_32px_-2px_rgba(0,0,0,0.15)] !bg-slate-100 border-2 border-slate-800">
      {/* Header - matching HardcodedSection styling */}
      <div className="flex justify-between items-center bg-emerald-100 rounded-xl px-3 py-2">
        <span className="text-emerald-900 font-bold text-base">Character Goals</span>
      </div>

      {/* Goals Table */}
      <div className="space-y-0">
          {/* Column Headers */}
          <div className="grid grid-cols-12 gap-2 px-2 pb-2 border-b border-slate-200">
            <div className="col-span-3">
              <span className="text-xs font-bold uppercase text-slate-500">Goal</span>
            </div>
            <div className="col-span-3">
              <span className="text-xs font-bold uppercase text-slate-500">Desired Outcome</span>
            </div>
            <div className="col-span-4">
              <span className="text-xs font-bold uppercase text-slate-500">Current Status</span>
            </div>
            <div className="col-span-2 text-center">
              <span className="text-xs font-bold uppercase text-slate-500">Progress</span>
            </div>
          </div>

          {/* Goal Rows */}
          {sortedGoals.map((goal) => (
            <div
              key={goal.id}
              className={`group grid grid-cols-12 gap-2 px-2 py-3 rounded-lg transition-colors ${
                goal.progress >= 100 ? 'bg-emerald-50/50' : 'hover:bg-slate-50'
              }`}
            >
              {/* Goal Title */}
              <div className="col-span-3">
                <textarea
                  value={goal.title}
                  onChange={(e) => updateGoal(goal.id, { title: e.target.value })}
                  placeholder="Goal name..."
                  rows={1}
                  disabled={readOnly}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 focus:border-blue-500 rounded-lg resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${target.scrollHeight}px`;
                  }}
                />
              </div>

              {/* Desired Outcome */}
              <div className="col-span-3">
                <textarea
                  value={goal.desiredOutcome}
                  onChange={(e) => updateGoal(goal.id, { desiredOutcome: e.target.value })}
                  placeholder="What success looks like..."
                  rows={1}
                  disabled={readOnly}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 focus:border-blue-500 rounded-lg resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${target.scrollHeight}px`;
                  }}
                />
              </div>

              {/* Current Status */}
              <div className="col-span-4 relative">
                <textarea
                  value={goal.currentStatus}
                  onChange={(e) => updateGoal(goal.id, { currentStatus: e.target.value })}
                  placeholder="Progress so far..."
                  rows={1}
                  disabled={readOnly}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 focus:border-blue-500 rounded-lg resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500/20 pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${target.scrollHeight}px`;
                  }}
                />
                {/* Delete button */}
                {!readOnly && (
                  <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Button
                      variant="ghost"
                      className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-50 rounded-lg"
                      onClick={() => deleteGoal(goal.id)}
                    >
                      <Icons.Trash />
                    </Button>
                  </div>
                )}
              </div>

              {/* Progress */}
              <div className="col-span-2 flex items-center justify-center">
                <Popover 
                  open={editingProgressId === goal.id} 
                  onOpenChange={(open) => {
                    if (!open) {
                      setEditingProgressId(null);
                      setTempProgress('');
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <div>
                      <CircularProgress
                        value={goal.progress}
                        size={40}
                        onClick={() => handleProgressClick(goal)}
                      />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-32 p-2" align="center">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={tempProgress}
                        onChange={(e) => setTempProgress(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleProgressSubmit(goal.id);
                          }
                        }}
                        className="w-16 px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        autoFocus
                      />
                      <span className="text-sm text-slate-500">%</span>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full mt-1 text-xs"
                      onClick={() => handleProgressSubmit(goal.id)}
                    >
                      Set
                    </Button>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
        ))}
      </div>

      {/* Add Goal Button - at bottom like custom sections */}
      {!readOnly && (
        <Button
          variant="ghost"
          className="w-full py-3 border-2 border-dashed border-slate-500 bg-slate-50/50 text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all mt-4"
          onClick={addGoal}
        >
          + Add Goal
        </Button>
      )}
    </Card>
  );
};