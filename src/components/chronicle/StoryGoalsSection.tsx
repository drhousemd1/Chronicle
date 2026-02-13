import React, { useRef, useEffect } from 'react';
import { StoryGoal, GoalStep, GoalFlexibility } from '@/types';
import { Trash2, Plus, X, ChevronDown, ChevronUp, Target, CheckSquare } from 'lucide-react';
import { CircularProgress } from './CircularProgress';
import { GuidanceStrengthSlider } from './GuidanceStrengthSlider';
import { Checkbox } from '@/components/ui/checkbox';
import { uid, now } from '@/utils';
import { cn } from '@/lib/utils';

// Auto-resizing textarea for goals
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
}

// FLEXIBILITY_OPTIONS kept for reference but slider replaces the button UI

const calculateProgress = (steps: GoalStep[]): number => {
  if (steps.length === 0) return 0;
  return Math.round((steps.filter(s => s.completed).length / steps.length) * 100);
};

export const StoryGoalsSection: React.FC<StoryGoalsSectionProps> = ({ goals, onChange }) => {
  const addGoal = () => {
    const newGoal: StoryGoal = {
      id: uid('sgoal'),
      title: '',
      desiredOutcome: '',
      steps: [],
      flexibility: 'normal',
      createdAt: now(),
      updatedAt: now()
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
    updateGoal(goalId, { steps: [...goal.steps, newStep] });
  };

  const updateStep = (goalId: string, stepId: string, patch: Partial<GoalStep>) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    updateGoal(goalId, {
      steps: goal.steps.map(s => s.id === stepId ? { ...s, ...patch } : s)
    });
  };

  const deleteStep = (goalId: string, stepId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    updateGoal(goalId, { steps: goal.steps.filter(s => s.id !== stepId) });
  };

  const toggleStep = (goalId: string, stepId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const step = goal.steps.find(s => s.id === stepId);
    if (!step) return;
    updateStep(goalId, stepId, {
      completed: !step.completed,
      completedAt: !step.completed ? now() : undefined
    });
  };

  return (
    <section>
      <div className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]">
        <div className="bg-[#4a5f7f] border-b border-white/20 px-6 py-4 flex items-center gap-3 shadow-lg">
          <Target className="w-[18px] h-[18px] text-white" />
          <h2 className="text-white text-xl font-bold tracking-tight">Story Goals and Desires</h2>
        </div>
        <div className="p-6 space-y-4">
          {goals.map((goal) => {
            const progress = calculateProgress(goal.steps);
            return (
              <div key={goal.id} className="p-5 pb-6 bg-[#3a3a3f]/30 rounded-2xl border border-blue-500/20 relative">
                {/* Delete Goal */}
                <button onClick={() => deleteGoal(goal.id)} className="absolute top-4 right-4 text-zinc-500 hover:text-rose-400 transition-colors" title="Delete goal">
                  <Trash2 className="h-5 w-5" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-9 space-y-4">
                    {/* Goal Title */}
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Goal Name</label>
                      <AutoResizeTextarea value={goal.title} onChange={(v) => updateGoal(goal.id, { title: v })} placeholder="Enter goal name..." className="mt-1 px-3 py-2 text-sm bg-zinc-900/50 border border-white/10 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>

                    {/* Desired Outcome */}
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Desired Outcome</label>
                      <AutoResizeTextarea value={goal.desiredOutcome} onChange={(v) => updateGoal(goal.id, { desiredOutcome: v })} placeholder="What success looks like..." className="mt-1 px-3 py-2 text-sm bg-zinc-900/50 border border-white/10 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" rows={2} />
                    </div>

                    {/* Guidance Strength Slider */}
                    <GuidanceStrengthSlider
                      value={goal.flexibility}
                      onChange={(flexibility) => updateGoal(goal.id, { flexibility })}
                    />

                    {/* Steps */}
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <h4 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-blue-400" />
                        Steps
                      </h4>
                      {goal.steps.length > 0 ? (
                        <div className="space-y-2">
                          {goal.steps.map((step, stepIdx) => (
                            <div key={step.id} className="flex items-start gap-3">
                              <Checkbox
                                checked={step.completed}
                                onCheckedChange={() => toggleStep(goal.id, step.id)}
                                className="mt-2.5 border-zinc-600 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                              />
                              <AutoResizeTextarea
                                value={step.description}
                                onChange={(v) => updateStep(goal.id, step.id, { description: v })}
                                placeholder={`Step ${stepIdx + 1}: Describe this step...`}
                                className={cn(
                                  "flex-1 px-3 py-2 bg-zinc-900/50 border border-white/10 text-white placeholder:text-zinc-600 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                                  step.completed && "line-through text-zinc-500"
                                )}
                              />
                              <button onClick={() => deleteStep(goal.id, step.id)} className="mt-2 text-zinc-500 hover:text-rose-400 transition-colors p-1">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-zinc-500 text-sm italic">No steps defined yet</p>
                      )}
                      <button onClick={() => addStep(goal.id)} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm mt-3 transition-colors">
                        <Plus className="h-4 w-4" />
                        <span>Add Step</span>
                      </button>
                    </div>
                  </div>

                  {/* Progress Ring */}
                  <div className="md:col-span-3 flex flex-col items-center justify-start pt-4">
                    <CircularProgress value={progress} size={96} strokeWidth={8} variant="dark" />
                    <p className="mt-2 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                      {goal.steps.length > 0 ? `${goal.steps.filter(s => s.completed).length}/${goal.steps.length} Steps` : 'No Steps'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Story Goal */}
          <button
            onClick={addGoal}
            className="w-full py-2.5 text-sm bg-transparent border-2 border-dashed border-zinc-500 text-blue-400 hover:border-blue-400 hover:bg-blue-500/5 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Story Goal
          </button>
        </div>
      </div>
    </section>
  );
};
