import React from 'react';
import { StoryGoal, ArcBranch, ArcStep, ArcMode, ArcPhase, GoalFlexibility, GoalStep, StepStatus } from '@/types';
import { Trash2, Plus, Sparkles, Target } from 'lucide-react';
import { CircularProgress } from './CircularProgress';
import { GuidanceStrengthSlider } from './GuidanceStrengthSlider';
import { ArcBranchLane } from './arc/ArcBranchLane';
import { ArcModeToggle } from './arc/ArcModeToggle';
import { ArcConnectors } from './arc/ArcConnectors';
import { ArcPhaseCard } from './arc/ArcPhaseCard';
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
  const ref = React.useRef<HTMLTextAreaElement>(null);
  React.useEffect(() => {
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
}

// ── Helpers ──

const ensureBranch = (branch: ArcBranch | undefined, type: 'fail' | 'success'): ArcBranch =>
  branch || { id: uid('branch'), type, triggerDescription: '', steps: [] };

/** Runtime migration: convert legacy GoalStep[] → success branch ArcSteps */
function migrateGoalToBranches(goal: StoryGoal): StoryGoal {
  if (goal.branches) return goal; // already migrated
  if (!goal.steps || goal.steps.length === 0) return { ...goal, mode: goal.mode || 'simple', branches: {}, statusEventCounter: goal.statusEventCounter || 0 };
  const arcSteps: ArcStep[] = goal.steps.map((s, i) => ({
    id: s.id,
    description: s.description,
    status: s.completed ? 'succeeded' as const : 'pending' as const,
    statusEventOrder: s.completed ? i + 1 : 0,
    completedAt: s.completedAt,
  }));
  return {
    ...goal,
    mode: goal.mode || 'simple',
    branches: {
      success: { id: uid('branch'), type: 'success', triggerDescription: '', steps: arcSteps },
    },
    statusEventCounter: goal.statusEventCounter || arcSteps.length,
  };
}

const calculateArcProgress = (branches?: { fail?: ArcBranch; success?: ArcBranch }): number => {
  const successSteps = branches?.success?.steps || [];
  if (successSteps.length === 0) return 0;
  return Math.round((successSteps.filter(s => s.status === 'succeeded').length / successSteps.length) * 100);
};

// ── Component ──

export const StoryGoalsSection: React.FC<StoryGoalsSectionProps> = ({ goals, onChange, onEnhanceField, enhancingField }) => {
  // Migrate all goals on first render
  const migratedGoals = React.useMemo(() => goals.map(migrateGoalToBranches), [goals]);

  const addGoal = () => {
    const newGoal: StoryGoal = {
      id: uid('sgoal'),
      title: '',
      desiredOutcome: '',
      steps: [],
      flexibility: 'normal',
      mode: 'simple',
      branches: {},
      linkedPhases: [],
      statusEventCounter: 0,
      createdAt: now(),
      updatedAt: now(),
    };
    onChange([...goals, newGoal]);
  };

  const updateGoal = (id: string, patch: Partial<StoryGoal>) => {
    onChange(migratedGoals.map(g => g.id === id ? { ...g, ...patch, updatedAt: now() } : g));
  };

  const deleteGoal = (id: string) => {
    onChange(migratedGoals.filter(g => g.id !== id));
  };

  // Branch operations for root phase
  const updateBranch = (goalId: string, type: 'fail' | 'success', patch: Partial<ArcBranch>) => {
    const goal = migratedGoals.find(g => g.id === goalId);
    if (!goal) return;
    const branches = goal.branches || {};
    const current = ensureBranch(branches[type], type);
    updateGoal(goalId, {
      branches: { ...branches, [type]: { ...current, ...patch } },
    });
  };

  const addStep = (goalId: string, type: 'fail' | 'success') => {
    const goal = migratedGoals.find(g => g.id === goalId);
    if (!goal) return;
    const branch = ensureBranch(goal.branches?.[type], type);
    const newStep: ArcStep = { id: uid('astep'), description: '', status: 'pending', statusEventOrder: 0 };
    updateBranch(goalId, type, { steps: [...branch.steps, newStep] });
  };

  const updateStep = (goalId: string, type: 'fail' | 'success', stepId: string, patch: Partial<ArcStep>) => {
    const goal = migratedGoals.find(g => g.id === goalId);
    if (!goal) return;
    const branch = ensureBranch(goal.branches?.[type], type);
    updateBranch(goalId, type, {
      steps: branch.steps.map(s => s.id === stepId ? { ...s, ...patch } : s),
    });
  };

  const deleteStep = (goalId: string, type: 'fail' | 'success', stepId: string) => {
    const goal = migratedGoals.find(g => g.id === goalId);
    if (!goal) return;
    const branch = ensureBranch(goal.branches?.[type], type);
    updateBranch(goalId, type, { steps: branch.steps.filter(s => s.id !== stepId) });
  };

  const toggleStatus = (goalId: string, type: 'fail' | 'success', stepId: string, targetStatus: StepStatus) => {
    const goal = migratedGoals.find(g => g.id === goalId);
    if (!goal) return;
    const branch = ensureBranch(goal.branches?.[type], type);
    const step = branch.steps.find(s => s.id === stepId);
    if (!step) return;
    const newStatus = step.status === targetStatus ? 'pending' : targetStatus;
    const counter = (goal.statusEventCounter || 0) + 1;
    updateGoal(goalId, { statusEventCounter: counter });
    updateStep(goalId, type, stepId, {
      status: newStatus,
      statusEventOrder: newStatus !== 'pending' ? counter : 0,
      completedAt: newStatus === 'succeeded' ? now() : undefined,
    });
  };

  // Phase operations
  const addPhase = (goalId: string) => {
    const goal = migratedGoals.find(g => g.id === goalId);
    if (!goal) return;
    const newPhase: ArcPhase = {
      id: uid('phase'),
      title: '',
      desiredOutcome: '',
      flexibility: 'normal',
      mode: 'simple',
      branches: {},
      statusEventCounter: 0,
      createdAt: now(),
      updatedAt: now(),
    };
    updateGoal(goalId, { linkedPhases: [...(goal.linkedPhases || []), newPhase] });
  };

  const updatePhase = (goalId: string, phaseId: string, patch: Partial<ArcPhase>) => {
    const goal = migratedGoals.find(g => g.id === goalId);
    if (!goal) return;
    updateGoal(goalId, {
      linkedPhases: (goal.linkedPhases || []).map(p => p.id === phaseId ? { ...p, ...patch, updatedAt: now() } : p),
    });
  };

  const deletePhase = (goalId: string, phaseId: string) => {
    const goal = migratedGoals.find(g => g.id === goalId);
    if (!goal) return;
    updateGoal(goalId, {
      linkedPhases: (goal.linkedPhases || []).filter(p => p.id !== phaseId),
    });
  };

  const SparkleButton: React.FC<{ fieldKey: string; onClick: () => void }> = ({ fieldKey, onClick }) => {
    if (!onEnhanceField) return null;
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={enhancingField !== null}
        title="Enhance with AI"
        className={cn(
          "p-1 rounded-md transition-all",
          enhancingField === fieldKey
            ? "text-blue-500 animate-pulse cursor-wait"
            : "text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10"
        )}
      >
        <Sparkles size={14} />
      </button>
    );
  };

  return (
    <section>
      <div className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]">
        <div className="bg-[#4a5f7f] border-b border-white/20 px-6 py-4 flex items-center gap-3 shadow-lg">
          <Target className="w-[18px] h-[18px] text-white" />
          <h2 className="text-white text-xl font-bold tracking-tight">Story Arcs</h2>
        </div>
        <div className="p-6 space-y-4">
          {migratedGoals.map((goal) => {
            const mode = goal.mode || 'simple';
            const branches = goal.branches || {};
            const failBranch = ensureBranch(branches.fail, 'fail');
            const successBranch = ensureBranch(branches.success, 'success');
            const progress = calculateArcProgress(branches);

            return (
              <div key={goal.id} className="space-y-0">
                {/* Root phase card */}
                <div className="p-5 pb-6 bg-[#3a3a3f]/30 rounded-2xl border border-blue-500/20 relative">
                  {/* Delete Goal */}
                  <button onClick={() => deleteGoal(goal.id)} className="absolute top-4 right-4 text-zinc-500 hover:text-rose-400 transition-colors" title="Delete arc">
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
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Desired Outcome</label>
                          <SparkleButton
                            fieldKey={`story_outcome_${goal.id}`}
                            onClick={() => onEnhanceField?.(
                              `story_outcome_${goal.id}`,
                              () => goal.desiredOutcome,
                              (v) => updateGoal(goal.id, { desiredOutcome: v }),
                              `Desired Outcome for story arc: ${goal.title || 'Untitled'}`
                            )}
                          />
                        </div>
                        <AutoResizeTextarea value={goal.desiredOutcome} onChange={(v) => updateGoal(goal.id, { desiredOutcome: v })} placeholder="What success looks like..." className="mt-1 px-3 py-2 text-sm bg-zinc-900/50 border border-white/10 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20" rows={2} />
                      </div>

                      {/* Guidance Strength Slider */}
                      <GuidanceStrengthSlider
                        value={goal.flexibility}
                        onChange={(flexibility) => updateGoal(goal.id, { flexibility })}
                      />

                      {/* Branching Steps */}
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Steps</h4>
                          <ArcModeToggle mode={mode} onChange={(m) => updateGoal(goal.id, { mode: m })} />
                        </div>

                        <ArcConnectors type="split" />

                        <div className="flex gap-3 mt-3">
                          <ArcBranchLane
                            branch={failBranch}
                            type="fail"
                            flexibility={goal.flexibility}
                            isSimpleMode={mode === 'simple'}
                            onUpdateTrigger={(d) => updateBranch(goal.id, 'fail', { triggerDescription: d })}
                            onAddStep={() => addStep(goal.id, 'fail')}
                            onUpdateStep={(id, patch) => updateStep(goal.id, 'fail', id, patch)}
                            onDeleteStep={(id) => deleteStep(goal.id, 'fail', id)}
                            onToggleStatus={(id, status) => toggleStatus(goal.id, 'fail', id, status)}
                          />
                          <ArcBranchLane
                            branch={successBranch}
                            type="success"
                            flexibility={goal.flexibility}
                            isSimpleMode={false}
                            onUpdateTrigger={(d) => updateBranch(goal.id, 'success', { triggerDescription: d })}
                            onAddStep={() => addStep(goal.id, 'success')}
                            onUpdateStep={(id, patch) => updateStep(goal.id, 'success', id, patch)}
                            onDeleteStep={(id) => deleteStep(goal.id, 'success', id)}
                            onToggleStatus={(id, status) => toggleStatus(goal.id, 'success', id, status)}
                          />
                        </div>

                        <ArcConnectors type="merge" />
                      </div>
                    </div>

                    {/* Progress Ring */}
                    <div className="md:col-span-3 flex flex-col items-center justify-start pt-4">
                      <CircularProgress value={progress} size={96} strokeWidth={8} variant="dark" />
                      <p className="mt-2 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                        {successBranch.steps.length > 0
                          ? `${successBranch.steps.filter(s => s.status === 'succeeded').length}/${successBranch.steps.length} Steps`
                          : 'No Steps'}
                      </p>
                    </div>
                  </div>

                  {/* Add Next Phase button */}
                  <div className="flex justify-end mt-4">
                    <button
                      type="button"
                      onClick={() => addPhase(goal.id)}
                      className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      Add Next Phase
                    </button>
                  </div>
                </div>

                {/* Linked Phases */}
                {(goal.linkedPhases || []).map((phase, idx) => (
                  <ArcPhaseCard
                    key={phase.id}
                    phase={phase}
                    phaseNumber={idx + 2}
                    onUpdate={(patch) => updatePhase(goal.id, phase.id, patch)}
                    onDelete={() => deletePhase(goal.id, phase.id)}
                    onEnhanceField={onEnhanceField}
                    enhancingField={enhancingField}
                  />
                ))}
              </div>
            );
          })}

          {/* Add Story Arc */}
          <button
            onClick={addGoal}
            className="w-full py-2.5 text-sm bg-transparent border-2 border-dashed border-zinc-500 text-blue-400 hover:border-blue-400 hover:bg-blue-500/5 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Story Arc
          </button>
        </div>
      </div>
    </section>
  );
};
