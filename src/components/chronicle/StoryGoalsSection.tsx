import React from 'react';
import { StoryGoal, ArcBranch, ArcStep, ArcMode, ArcPhase, GoalFlexibility, GoalStep, StepStatus } from '@/types';
import { Trash2, Plus, Sparkles, GitBranch, CheckSquare } from 'lucide-react';
import { GuidanceStrengthSlider } from './GuidanceStrengthSlider';
import { ArcBranchLane } from './arc/ArcBranchLane';
import { ArcModeToggle } from './arc/ArcModeToggle';
import { ArcConnectors } from './arc/ArcConnectors';
import { ArcPhaseCard } from './arc/ArcPhaseCard';
import { ArcFlowConnector } from './arc/ArcFlowConnector';
import { uid, now } from '@/utils';
import { cn } from '@/lib/utils';

// Auto-resizing textarea for goals
const AutoResizeTextarea: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  style?: React.CSSProperties;
}> = ({ value, onChange, placeholder, className = '', rows = 1, style }) => {
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
      style={style}
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
  if (goal.branches) return goal;
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
  // Exclude failed steps that have a pending retry clone
  const retryTargets = new Set(successSteps.filter(s => s.retryOf && s.status === 'pending').map(s => s.retryOf));
  const countableSteps = successSteps.filter(s => !(retryTargets.has(s.id) && (s.status === 'failed' || s.status === 'deviated')));
  if (countableSteps.length === 0) return 0;
  return Math.round((countableSteps.filter(s => s.status === 'succeeded').length / countableSteps.length) * 100);
};

/** Compute the single active flow connector between branches */
function computeActiveFlow(
  failBranch: ArcBranch,
  successBranch: ArcBranch
): { sourceId: string; sourceBranch: 'fail' | 'success'; targetId: string; targetBranch: 'fail' | 'success' } | null {
  const resolved: Array<{ step: ArcStep; branch: 'fail' | 'success' }> = [];
  failBranch.steps.forEach(s => {
    if (s.statusEventOrder > 0) resolved.push({ step: s, branch: 'fail' });
  });
  successBranch.steps.forEach(s => {
    if (s.statusEventOrder > 0) resolved.push({ step: s, branch: 'success' });
  });
  if (resolved.length === 0) return null;
  resolved.sort((a, b) => b.step.statusEventOrder - a.step.statusEventOrder);
  const latest = resolved[0];

  if (latest.step.status === 'succeeded' && latest.branch === 'fail') {
    const target = successBranch.steps.find(s => s.statusEventOrder === 0);
    if (target) return { sourceId: latest.step.id, sourceBranch: 'fail', targetId: target.id, targetBranch: 'success' };
  }
  if ((latest.step.status === 'failed' || latest.step.status === 'deviated') && latest.branch === 'success') {
    const target = failBranch.steps.find(s => s.statusEventOrder === 0);
    if (target) return { sourceId: latest.step.id, sourceBranch: 'success', targetId: target.id, targetBranch: 'fail' };
  }
  return null;
}

// ── Component ──

export const StoryGoalsSection: React.FC<StoryGoalsSectionProps> = ({ goals, onChange, onEnhanceField, enhancingField }) => {
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
    const branches = goal.branches || {};
    const branch = ensureBranch(branches[type], type);
    const step = branch.steps.find(s => s.id === stepId);
    if (!step) return;
    const newStatus = step.status === targetStatus ? 'pending' : targetStatus;
    const counter = (goal.statusEventCounter || 0) + 1;
    const updatedSteps = branch.steps.map(s =>
      s.id === stepId
        ? { ...s, status: newStatus, statusEventOrder: newStatus !== 'pending' ? counter : 0, completedAt: newStatus === 'succeeded' ? now() : undefined }
        : s
    );
    
    let updatedBranches = { ...branches, [type]: { ...branch, steps: updatedSteps } };

    // Clone-on-recovery: when a recovery (fail branch) step succeeds, clone the failed/deviated success step
    if (type === 'fail' && newStatus === 'succeeded') {
      const successBranch = ensureBranch(updatedBranches.success, 'success');
      // Find the most recently failed/deviated success step
      const failedSuccessStep = [...successBranch.steps]
        .filter(s => s.status === 'failed' || s.status === 'deviated')
        .sort((a, b) => b.statusEventOrder - a.statusEventOrder)[0];
      
      if (failedSuccessStep && !failedSuccessStep.permanentlyFailed) {
        const currentDay = 0; // TODO: pass from conversation context
        const existingClone = successBranch.steps.find(s => s.retryOf === failedSuccessStep.id && s.failedOnDay === currentDay);
        
        if (!existingClone) {
          const currentRetryCount = failedSuccessStep.retryCount || 0;
          const maxRetries = goal.flexibility === 'rigid' ? Infinity : goal.flexibility === 'flexible' ? 2 : 4;
          
          if (currentRetryCount < maxRetries) {
            const clonedStep: ArcStep = {
              id: uid('astep'),
              description: failedSuccessStep.description,
              status: 'pending',
              statusEventOrder: 0,
              retryOf: failedSuccessStep.id,
              retryCount: currentRetryCount + 1,
              failedOnDay: currentDay,
            };
            const insertIdx = successBranch.steps.indexOf(failedSuccessStep) + 1;
            const newSuccessSteps = [...successBranch.steps];
            newSuccessSteps.splice(insertIdx, 0, clonedStep);
            updatedBranches = { ...updatedBranches, success: { ...successBranch, steps: newSuccessSteps } };
          } else {
            // Max retries reached - mark as permanently failed
            updatedBranches = {
              ...updatedBranches,
              success: {
                ...successBranch,
                steps: successBranch.steps.map(s => s.id === failedSuccessStep.id ? { ...s, permanentlyFailed: true } : s),
              },
            };
          }
        }
      }
    }

    updateGoal(goalId, {
      statusEventCounter: counter,
      branches: updatedBranches,
    });
  };

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
      {/* Outer shell */}
      <div className="bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]">
        {/* Header */}
        <div className="bg-[#4a5f7f] border-b border-white/20 px-5 py-3 flex items-center gap-3">
          <GitBranch className="w-4 h-4 text-white" />
          <h2 className="text-white text-xl font-bold tracking-tight m-0">
            Story Arcs
          </h2>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6">
          {migratedGoals.map((goal) => {
            const mode = goal.mode || 'simple';
            const branches = goal.branches || {};
            const failBranch = ensureBranch(branches.fail, 'fail');
            const successBranch = ensureBranch(branches.success, 'success');
            const progress = calculateArcProgress(branches);

            return (
              <div key={goal.id}>
                {/* Single arc container */}
                <div className="p-5 pb-6 bg-[#3a3a3f]/30 rounded-2xl border border-blue-500/20 relative">
                  {/* Row 1: Goal Name + Delete + Progress Ring */}
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Goal Name</label>
                      <AutoResizeTextarea
                        value={goal.title}
                        onChange={(v) => updateGoal(goal.id, { title: v })}
                        placeholder="Enter goal name..."
                        className="mt-1 px-3 py-2 text-sm bg-zinc-900/50 border border-zinc-700 text-white placeholder:text-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="w-[30px] h-[30px] rounded-[10px] border border-red-400/50 bg-transparent text-red-300 flex items-center justify-center cursor-pointer mt-7 shrink-0"
                      title="Delete arc"
                    >
                      <Trash2 size={15} />
                    </button>

                    {/* Progress ring */}
                    <div className="flex flex-col items-center shrink-0 mt-1">
                      <div className="w-20 h-20 rounded-full border-[8px] border-[rgba(51,80,125,0.85)] flex items-center justify-center">
                        <span className="text-lg font-bold text-slate-300">
                          {progress}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Full width: Desired Outcome */}
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Desired Outcome</label>
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
                    <AutoResizeTextarea
                      value={goal.desiredOutcome}
                      onChange={(v) => updateGoal(goal.id, { desiredOutcome: v })}
                      placeholder="What success looks like..."
                      rows={2}
                      className="mt-1 px-3 py-2 text-sm bg-zinc-900/50 border border-zinc-700 text-white placeholder:text-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  {/* Full width: Guidance Strength */}
                  <GuidanceStrengthSlider
                    value={goal.flexibility}
                    onChange={(flexibility) => updateGoal(goal.id, { flexibility })}
                  />

                  {/* Steps Section */}
                  <div className="mt-4 pt-5 border-t border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CheckSquare size={14} className="text-blue-400" />
                        <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] m-0">Steps</h4>
                      </div>
                      <ArcModeToggle mode={mode} onChange={(m) => {
                        const patch: Partial<StoryGoal> = { mode: m };
                        if (m === 'advanced') {
                          const fb = ensureBranch(branches.fail, 'fail');
                          const sb = ensureBranch(branches.success, 'success');
                          const newFail = fb.steps.length === 0
                            ? { ...fb, steps: [{ id: uid('astep'), description: '', status: 'pending' as const, statusEventOrder: 0 }] }
                            : fb;
                          const newSuccess = sb.steps.length === 0
                            ? { ...sb, steps: [{ id: uid('astep'), description: '', status: 'pending' as const, statusEventOrder: 0 }] }
                            : sb;
                          patch.branches = { ...branches, fail: newFail, success: newSuccess };
                        }
                        updateGoal(goal.id, patch);
                      }} />
                    </div>

                    <ArcConnectors type="split" />

                    {(() => {
                      const flow = computeActiveFlow(failBranch, successBranch);
                      const containerRef = React.createRef<HTMLDivElement>();
                      return (
                        <div ref={containerRef} className="relative mt-3">
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
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
                          {flow && (
                            <ArcFlowConnector
                              containerRef={containerRef}
                              sourceStepId={flow.sourceId}
                              targetStepId={flow.targetId}
                            />
                          )}
                        </div>
                      );
                    })()}

                    {(goal.linkedPhases || []).length > 0 && <ArcConnectors type="merge" />}
                  </div>

                  {/* Linked Phases - INSIDE the same container */}
                  {(goal.linkedPhases || []).map((phase, idx) => (
                    <ArcPhaseCard
                      key={phase.id}
                      phase={phase}
                      phaseNumber={idx + 2}
                      onUpdate={(patch) => updatePhase(goal.id, phase.id, patch)}
                      onDelete={() => deletePhase(goal.id, phase.id)}
                      onEnhanceField={onEnhanceField}
                      enhancingField={enhancingField}
                      hasNextPhase={idx < (goal.linkedPhases || []).length - 1}
                    />
                  ))}

                  {/* Add Next Phase button */}
                  <button
                    type="button"
                    onClick={() => addPhase(goal.id)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-sm bg-transparent border-2 border-dashed border-zinc-500 text-blue-400 hover:border-blue-400 hover:bg-blue-500/5 font-medium rounded-xl transition-colors cursor-pointer mt-5"
                  >
                    <Plus className="w-5 h-5" />
                    Add Next Phase
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add Story Arc */}
          <button
            onClick={addGoal}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm bg-transparent border-2 border-dashed border-zinc-500 text-blue-400 hover:border-blue-400 hover:bg-blue-500/5 font-medium rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Add New Story Arc
          </button>
        </div>
      </div>
    </section>
  );
};
