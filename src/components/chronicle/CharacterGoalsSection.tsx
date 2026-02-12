import React from 'react';
import { CharacterGoal, GoalStep, GoalFlexibility, TimeOfDay } from '@/types';
import { Trash2, Plus, X, ChevronDown, ChevronUp, CheckSquare } from 'lucide-react';
import { GuidanceStrengthSlider } from './GuidanceStrengthSlider';
import { CircularProgress } from './CircularProgress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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

const calculateProgress = (goal: CharacterGoal): number => {
  if (goal.steps && goal.steps.length > 0) {
    return Math.round((goal.steps.filter(s => s.completed).length / goal.steps.length) * 100);
  }
  return goal.progress;
};

export const CharacterGoalsSection: React.FC<CharacterGoalsSectionProps> = ({
  goals,
  onChange,
  readOnly = false,
  isExpanded = true,
  onToggle,
  currentDay = 1,
  currentTimeOfDay = 'day'
}) => {
  const displayGoals = goals.length === 0 ? [{
    id: uid('goal'),
    title: '',
    desiredOutcome: '',
    currentStatus: '',
    progress: 0,
    steps: [],
    createdAt: now(),
    updatedAt: now()
  }] : goals;

  const sortedGoals = [...displayGoals].sort((a, b) => calculateProgress(b) - calculateProgress(a));

  React.useEffect(() => {
    if (goals.length === 0 && displayGoals.length === 1) {
      onChange(displayGoals);
    }
  }, []);

  const isViewMode = !isExpanded || readOnly;
  const isEditMode = isExpanded && !readOnly;

  const addGoal = () => {
    const newGoal: CharacterGoal = {
      id: uid('goal'),
      title: '',
      desiredOutcome: '',
      progress: 0,
      flexibility: 'normal',
      steps: [],
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

  const addStep = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const newStep: GoalStep = { id: uid('step'), description: '', completed: false };
    updateGoal(goalId, { steps: [...(goal.steps || []), newStep] });
  };

  const updateStep = (goalId: string, stepId: string, patch: Partial<GoalStep>) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    updateGoal(goalId, {
      steps: (goal.steps || []).map(s => s.id === stepId ? { ...s, ...patch } : s)
    });
  };

  const deleteStep = (goalId: string, stepId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    updateGoal(goalId, { steps: (goal.steps || []).filter(s => s.id !== stepId) });
  };

  const toggleStep = (goalId: string, stepId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const step = (goal.steps || []).find(s => s.id === stepId);
    if (!step) return;
    updateStep(goalId, stepId, {
      completed: !step.completed,
      completedAt: !step.completed ? now() : undefined
    });
  };

  // Collapsed view
  const CollapsedGoalsView = () => {
    if (goals.length === 0) {
      return <p className="text-zinc-500 text-sm italic">No goals defined</p>;
    }
    return (
      <div className="space-y-6">
        {goals.map((goal) => {
          const progress = calculateProgress(goal);
          return (
            <div key={goal.id} className="grid grid-cols-12 gap-4">
              <div className="col-span-9 space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Goal Name</span>
                  <p className="text-sm text-zinc-400">{goal.title || 'Untitled goal'}</p>
                </div>
                {goal.desiredOutcome && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Desired Outcome</span>
                    <p className="text-sm text-zinc-400">{goal.desiredOutcome}</p>
                  </div>
                )}
                {(goal.steps?.length || 0) > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Steps</span>
                    <p className="text-sm text-zinc-400">
                      {goal.steps!.filter(s => s.completed).length}/{goal.steps!.length} completed
                    </p>
                  </div>
                )}
              </div>
              <div className="col-span-3 flex items-start justify-center pt-2">
                <CircularProgress value={progress} size={64} strokeWidth={5} variant="dark" />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]">
      {/* Section Header */}
      <div className="bg-[#4a5f7f] border-b border-white/20 px-5 py-3 flex items-center justify-between shadow-lg">
        <h2 className="text-white text-xl font-bold tracking-tight">Character Goals</h2>
        {onToggle && (
          <button onClick={onToggle} className="text-white/70 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10">
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

      {/* Expanded Goals */}
      {isExpanded && (
        <div className="p-5 space-y-4">
          {sortedGoals.map((goal) => {
            const progress = calculateProgress(goal);
            return (
              <div key={goal.id} className={cn("p-5 pb-6 bg-[#3a3a3f]/30 rounded-2xl border relative", isEditMode ? "border-blue-500/20" : "border-white/5")}>
                {isEditMode && (
                  <button onClick={() => deleteGoal(goal.id)} className="absolute top-4 right-4 text-zinc-500 hover:text-rose-400 transition-colors" title="Delete goal">
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-9 space-y-4">
                    {/* Goal Name */}
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Goal Name</label>
                      {isEditMode ? (
                        <Input value={goal.title} onChange={(e) => updateGoal(goal.id, { title: e.target.value })} placeholder="Enter goal name..." className="mt-1 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600" />
                      ) : (
                        <h3 className="text-lg font-bold text-white mt-0.5">{goal.title || 'No goal name set'}</h3>
                      )}
                    </div>

                    {/* Desired Outcome */}
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Desired Outcome</label>
                      {isEditMode ? (
                        <Textarea value={goal.desiredOutcome} onChange={(e) => updateGoal(goal.id, { desiredOutcome: e.target.value })} placeholder="What success looks like..." className="mt-1 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 min-h-[60px]" />
                      ) : (
                        <p className="text-sm text-zinc-300 mt-0.5">{goal.desiredOutcome || 'No outcome defined'}</p>
                      )}
                    </div>

                    {/* Guidance Strength Slider */}
                    {isEditMode && (
                      <GuidanceStrengthSlider
                        value={goal.flexibility || 'normal'}
                        onChange={(flexibility) => updateGoal(goal.id, { flexibility })}
                      />
                    )}

                    {/* Steps Section */}
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <h4 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-blue-400" />
                        Steps
                      </h4>

                      {(goal.steps && goal.steps.length > 0) ? (
                        <div className="space-y-2">
                          {goal.steps.map((step, stepIdx) => (
                            <div key={step.id} className="flex items-start gap-3">
                              <Checkbox
                                checked={step.completed}
                                onCheckedChange={() => isEditMode ? toggleStep(goal.id, step.id) : undefined}
                                disabled={!isEditMode}
                                className="mt-2.5 border-zinc-600 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                              />
                              {isEditMode ? (
                                <Textarea
                                  value={step.description}
                                  onChange={(e) => updateStep(goal.id, step.id, { description: e.target.value })}
                                  placeholder={`Step ${stepIdx + 1}: Describe this step...`}
                                  className={cn("flex-1 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 min-h-[40px] text-sm", step.completed && "line-through text-zinc-500")}
                                />
                              ) : (
                                <span className={cn("text-sm text-zinc-200 pt-2", step.completed && "line-through text-zinc-500")}>
                                  {step.description || 'No description'}
                                </span>
                              )}
                              {isEditMode && (
                                <button onClick={() => deleteStep(goal.id, step.id)} className="mt-2 text-zinc-500 hover:text-rose-400 transition-colors p-1">
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-zinc-500 text-sm italic">No steps defined yet</p>
                      )}

                      {isEditMode && (
                        <button onClick={() => addStep(goal.id)} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm mt-3 transition-colors">
                          <Plus className="h-4 w-4" />
                          <span>Add Step</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Ring */}
                  <div className="md:col-span-3 flex flex-col items-center justify-start pt-4">
                    <CircularProgress value={progress} size={96} strokeWidth={8} variant="dark" />
                    <p className="mt-2 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                      {(goal.steps?.length || 0) > 0 ? `${goal.steps!.filter(s => s.completed).length}/${goal.steps!.length} Steps` : `${progress}%`}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {isEditMode && (
            <button onClick={addGoal} className="w-full py-3 bg-transparent border-2 border-dashed border-zinc-500 text-blue-400 hover:border-blue-400 hover:bg-blue-500/5 font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Goal
            </button>
          )}
        </div>
      )}
    </div>
  );
};
