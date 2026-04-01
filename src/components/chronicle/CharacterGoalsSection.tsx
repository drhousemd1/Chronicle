import React, { useRef, useEffect } from 'react';
import { CharacterGoal, GoalStep, GoalFlexibility, TimeOfDay } from '@/types';
import { Trash2, Plus, Lock, ChevronDown, ChevronUp, CheckSquare, Sparkles } from 'lucide-react';
import { GuidanceStrengthSlider } from './GuidanceStrengthSlider';
import { CircularProgress } from './CircularProgress';
import { Checkbox } from '@/components/ui/checkbox';
import { uid, now } from '@/utils';
import { cn } from '@/lib/utils';
import { AutoResizeTextarea } from './AutoResizeTextarea';




interface CharacterGoalsSectionProps {
  goals: CharacterGoal[];
  onChange: (goals: CharacterGoal[]) => void;
  readOnly?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  currentDay?: number;
  currentTimeOfDay?: TimeOfDay;
  onEnhanceField?: (fieldKey: string, getCurrentValue: () => string, setValue: (value: string) => void, customLabel?: string) => void;
  enhancingField?: string | null;
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
  currentTimeOfDay = 'day',
  onEnhanceField,
  enhancingField,
}) => {
  const seededDefaultGoalsRef = useRef<CharacterGoal[] | null>(null);
  if (!seededDefaultGoalsRef.current) {
    seededDefaultGoalsRef.current = [{
      id: uid('goal'),
      title: '',
      desiredOutcome: '',
      currentStatus: '',
      progress: 0,
      steps: [],
      createdAt: now(),
      updatedAt: now()
    }];
  }
  const displayGoals = goals.length === 0 ? seededDefaultGoalsRef.current : goals;

  const sortedGoals = [...displayGoals].sort((a, b) => calculateProgress(b) - calculateProgress(a));

  React.useEffect(() => {
    if (goals.length === 0 && displayGoals.length === 1) {
      onChange(displayGoals);
    }
  }, [displayGoals, goals.length, onChange]);

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

  const SparkleButton: React.FC<{ fieldKey: string; onClick: () => void }> = ({ fieldKey, onClick }) => {
    if (!onEnhanceField) return null;
    return (
      <button
        type="button"
        tabIndex={-1}
        onClick={onClick}
        disabled={enhancingField !== null}
        title="Enhance with AI"
        className={cn(
          "relative flex items-center justify-center flex-shrink-0 rounded-lg p-[6px] overflow-hidden text-cyan-200 transition-all",
          enhancingField === fieldKey ? "animate-pulse cursor-wait" : "hover:brightness-125"
        )}
        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.40)' }}
      >
        <span aria-hidden className="absolute inset-0 rounded-lg pointer-events-none" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.34) 0%, rgba(34,184,200,0.62) 18%, rgba(255,255,255,0.22) 44%, rgba(109,94,247,0.64) 78%, rgba(255,255,255,0.28) 100%)' }} />
        <span aria-hidden className="absolute rounded-[6px] pointer-events-none" style={{ inset: '1.5px', background: 'linear-gradient(90deg, rgba(34,184,200,0.22), rgba(109,94,247,0.22)), #2B2D33' }} />
        <Sparkles size={13} className="relative z-10" style={{ filter: 'drop-shadow(0 0 6px rgba(34,184,200,0.50))' }} />
      </button>
    );
  };

  return (
    <div className="w-full bg-[#2a2a2f] rounded-[24px] overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]">
      {/* Section Header */}
      <div className="relative bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-3 flex items-center justify-between shadow-lg overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[60%] bg-gradient-to-b from-white/[0.12] to-transparent pointer-events-none" />
        <h2 className="text-white text-xl font-bold tracking-[-0.015em] relative z-[1]">Goals and Desires</h2>
        {onToggle && (
          <button onClick={onToggle} className="relative z-[1] text-white/70 hover:text-white transition-colors p-1 rounded-md hover:bg-ghost-white">
            {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          </button>
        )}
      </div>

      {/* Collapsed view */}
      {!isExpanded && (
        <div className="p-5">
          <div className="p-5 pb-6 bg-[#2e2e33] rounded-2xl shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
            <CollapsedGoalsView />
          </div>
        </div>
      )}

      {/* Expanded Goals */}
      {isExpanded && (
        <div className="p-5 space-y-4">
          {sortedGoals.map((goal, goalIdx) => {
            const progress = calculateProgress(goal);
            return (
              <div key={goal.id} className={cn("p-5 pb-6 bg-[#2e2e33] rounded-2xl relative shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]")}>

                {/* Row 1: Goal Name + Progress Ring */}
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Goal Name</label>
                      {isEditMode && goalIdx === 0 && (
                        <Lock className="w-3.5 h-3.5 text-zinc-400" />
                      )}
                      {isEditMode && goalIdx > 0 && (
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => deleteGoal(goal.id)}
                          className="text-zinc-500 hover:text-rose-400 transition-colors p-0.5"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    {isEditMode ? (
                      <AutoResizeTextarea value={goal.title} onChange={(v) => updateGoal(goal.id, { title: v })} placeholder="Enter goal name..." className="px-3 py-2 text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    ) : (
                      <h3 className="text-lg font-bold text-white mt-0.5">{goal.title || 'No goal name set'}</h3>
                    )}
                  </div>

                  {/* Progress Ring */}
                  <div className="flex flex-col items-center shrink-0 mt-1">
                    <div className="w-20 h-20 rounded-full border-[8px] border-[rgba(51,80,125,0.85)] flex items-center justify-center">
                      <span className="text-lg font-bold text-slate-300">
                        {progress}%
                      </span>
                    </div>
                    <p className="mt-2 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                      {(goal.steps?.length || 0) > 0 ? `${goal.steps!.filter(s => s.completed).length}/${goal.steps!.length} Steps` : 'Progress'}
                    </p>
                  </div>
                </div>

                {/* Full width: Desired Outcome */}
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Desired Outcome</label>
                    {isEditMode && (
                      <SparkleButton
                        fieldKey={`goal_outcome_${goal.id}`}
                        onClick={() => onEnhanceField?.(
                          `goal_outcome_${goal.id}`,
                          () => goal.desiredOutcome,
                          (v) => updateGoal(goal.id, { desiredOutcome: v }),
                          `Desired Outcome for goal: ${goal.title || 'Untitled'}`
                        )}
                      />
                    )}
                  </div>
                  {isEditMode ? (
                    <AutoResizeTextarea value={goal.desiredOutcome} onChange={(v) => updateGoal(goal.id, { desiredOutcome: v })} placeholder="What success looks like..." className="px-3 py-2 text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" rows={2} />
                  ) : (
                    <p className="text-sm text-zinc-300 mt-0.5">{goal.desiredOutcome || 'No outcome defined'}</p>
                  )}
                </div>

                {/* Full width: Guidance Strength Slider */}
                {isEditMode && (
                  <GuidanceStrengthSlider
                    value={goal.flexibility || 'normal'}
                    onChange={(flexibility) => updateGoal(goal.id, { flexibility })}
                  />
                )}

                {/* Full width: Steps Section */}
                <div className="mt-4 pt-4 border-t border-black/35">
                  <h4 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-blue-500" />
                    Steps
                  </h4>

                  {(goal.steps && goal.steps.length > 0) ? (
                    <div className="space-y-2">
                      {goal.steps.map((step, stepIdx) => (
                        <div key={step.id} className="flex items-center gap-3">
                          <Checkbox
                            checked={step.completed}
                            onCheckedChange={() => isEditMode ? toggleStep(goal.id, step.id) : undefined}
                            disabled={!isEditMode}
                            className="border-zinc-600 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                          />
                          {isEditMode ? (
                            <>
                              <AutoResizeTextarea
                                value={step.description}
                                onChange={(v) => updateStep(goal.id, step.id, { description: v })}
                                placeholder={`Step ${stepIdx + 1}: Describe this step...`}
                                className={cn("flex-1 px-3 py-2 bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500", step.completed && "line-through text-zinc-500")}
                              />
                              <SparkleButton
                                fieldKey={`goal_step_${step.id}`}
                                onClick={() => onEnhanceField?.(
                                  `goal_step_${step.id}`,
                                  () => step.description,
                                  (v) => updateStep(goal.id, step.id, { description: v }),
                                  `Step for goal "${goal.title || 'Untitled'}"`
                                )}
                              />
                            </>
                          ) : (
                            <span className={cn("text-sm text-zinc-200", step.completed && "line-through text-zinc-500")}>
                              {step.description || 'No description'}
                            </span>
                          )}
                          {isEditMode && (
                            <button tabIndex={-1} onClick={() => deleteStep(goal.id, step.id)} className="text-zinc-500 hover:text-rose-400 transition-colors p-1">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-500 text-sm italic">No steps defined yet</p>
                  )}

                  {isEditMode && (
                    <button onClick={() => addStep(goal.id)} className="w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all flex items-center justify-center gap-1.5 mt-3">
                      <Plus className="h-4 w-4" />
                      Add Step
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {isEditMode && (
            <button onClick={addGoal} className="w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all flex items-center justify-center gap-1.5">
              <Plus className="w-4 h-4" />
              Add New Goal
            </button>
          )}
        </div>
      )}
    </div>
  );
};
