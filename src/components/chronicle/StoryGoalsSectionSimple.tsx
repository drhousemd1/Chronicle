import React, { useRef, useEffect } from 'react';
import { StoryGoal, GoalStep, GoalFlexibility } from '@/types';
import { Trash2, Plus, X, CheckSquare, Sparkles, Target } from 'lucide-react';
import { GuidanceStrengthSlider } from './GuidanceStrengthSlider';
import { CircularProgress } from './CircularProgress';
import { Checkbox } from '@/components/ui/checkbox';
import { uid, now } from '@/utils';
import { cn } from '@/lib/utils';

const AutoResizeTextarea: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}> = ({ value, onChange, placeholder, className = '', rows = 1 }) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      spellCheck={true}
      className={cn("w-full min-w-0 resize-none overflow-hidden whitespace-pre-wrap break-words", className)}
    />
  );
};

interface StoryGoalsSectionProps {
  goals: StoryGoal[];
  onChange: (goals: StoryGoal[]) => void;
  onEnhanceField?: (fieldKey: string, getCurrentValue: () => string, setValue: (value: string) => void, customLabel?: string) => void;
  enhancingField?: string | null;
  hasError?: boolean;
  readOnly?: boolean;
}

const calculateProgress = (goal: StoryGoal): number => {
  if (goal.steps && goal.steps.length > 0) {
    return Math.round((goal.steps.filter(s => s.completed).length / goal.steps.length) * 100);
  }
  return 0;
};

export const StoryGoalsSectionSimple: React.FC<StoryGoalsSectionProps> = ({
  goals,
  onChange,
  onEnhanceField,
  enhancingField,
  hasError,
  readOnly = false,
}) => {
  React.useEffect(() => {
    if (goals.length === 0) {
      onChange([{
        id: uid('sgoal'),
        title: '',
        desiredOutcome: '',
        steps: [],
        flexibility: 'normal',
        createdAt: now(),
        updatedAt: now(),
      }]);
    }
  }, []);

  const sortedGoals = [...goals].sort((a, b) => calculateProgress(b) - calculateProgress(a));

  const addGoal = () => {
    const newGoal: StoryGoal = {
      id: uid('sgoal'),
      title: '',
      desiredOutcome: '',
      steps: [],
      flexibility: 'normal',
      createdAt: now(),
      updatedAt: now(),
    };
    onChange([...goals, newGoal]);
  };

  const updateGoal = (id: string, patch: Partial<StoryGoal>) => {
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

  const isEditMode = !readOnly;

  return (
    <section data-publish-error={hasError || undefined}>
      <div className={cn("bg-[#2a2a2f] rounded-[24px] overflow-hidden", hasError ? 'border border-red-500 ring-2 ring-red-500 shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]' : 'shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]')}>
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-3 flex items-center gap-3 shadow-lg">
          <div className="absolute inset-0 z-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40" style={{ height: '60%' }} />
          <Target className="w-4 h-4 text-white relative z-[1]" />
          <h2 className="text-white text-xl font-bold tracking-[-0.015em] relative z-[1] m-0">
            Story Goals
          </h2>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {sortedGoals.map((goal) => {
            const progress = calculateProgress(goal);
            return (
              <div key={goal.id} className={cn("p-5 pb-6 bg-[#2e2e33] rounded-2xl relative shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]")}>

                {/* Row 1: Goal Name + Progress Ring */}
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <label className={cn("text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1", hasError && !goal.title.trim() && 'text-red-500')}>Goal Name</label>
                    {isEditMode ? (
                      <AutoResizeTextarea value={goal.title} onChange={(v) => updateGoal(goal.id, { title: v })} placeholder="Enter goal name..." className={cn("px-3 py-2 text-sm bg-[#1c1c1f] text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500", hasError && !goal.title.trim() ? 'border border-red-500 ring-2 ring-red-500' : 'border border-black/35')} />
                    ) : (
                      <h3 className="text-lg font-bold text-white mt-0.5">{goal.title || 'No goal name set'}</h3>
                    )}
                    {hasError && !goal.title.trim() && (
                      <p className="text-sm text-red-500 font-medium mt-1">Story goal title is required</p>
                    )}
                  </div>

                  {/* Delete button */}
                  {isEditMode && (
                    <button
                      tabIndex={-1}
                      onClick={() => deleteGoal(goal.id)}
                      className="w-[30px] h-[30px] rounded-[10px] border border-red-500/50 bg-transparent text-red-300 flex items-center justify-center cursor-pointer mt-7 shrink-0"
                      title="Delete goal"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}

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

                {/* Desired Outcome */}
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <label className={cn("text-[10px] font-bold text-zinc-400 uppercase tracking-widest", hasError && !goal.desiredOutcome.trim() && 'text-red-500')}>Desired Outcome</label>
                    {isEditMode && (
                      <SparkleButton
                        fieldKey={`story_outcome_${goal.id}`}
                        onClick={() => onEnhanceField?.(
                          `story_outcome_${goal.id}`,
                          () => goal.desiredOutcome,
                          (v) => updateGoal(goal.id, { desiredOutcome: v }),
                          `Desired Outcome for story goal: ${goal.title || 'Untitled'}`
                        )}
                      />
                    )}
                  </div>
                  {isEditMode ? (
                    <AutoResizeTextarea value={goal.desiredOutcome} onChange={(v) => updateGoal(goal.id, { desiredOutcome: v })} placeholder="What success looks like..." className={cn("px-3 py-2 text-sm bg-[#1c1c1f] text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500", hasError && !goal.desiredOutcome.trim() ? 'border border-red-500 ring-2 ring-red-500' : 'border border-black/35')} rows={2} />
                  ) : (
                    <p className="text-sm text-zinc-300 mt-0.5">{goal.desiredOutcome || 'No outcome defined'}</p>
                  )}
                  {hasError && !goal.desiredOutcome.trim() && (
                    <p className="text-sm text-red-500 font-medium mt-1">Desired outcome is required</p>
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
                <div className="mt-4 pt-4 border-t border-black/35">
                  <h4 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-blue-500" />
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
                            <span className={cn("text-sm text-zinc-200 pt-2", step.completed && "line-through text-zinc-500")}>
                              {step.description || 'No description'}
                            </span>
                          )}
                          {isEditMode && (
                            <button tabIndex={-1} onClick={() => deleteStep(goal.id, step.id)} className="mt-2 text-red-500 hover:text-red-400 transition-colors p-1">
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
      </div>
    </section>
  );
};
