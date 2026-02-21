import React from 'react';
import { StoryGoal, ArcBranch, ArcStep, ArcMode, ArcPhase, GoalFlexibility, GoalStep, StepStatus } from '@/types';
import { Trash2, Plus, Sparkles, Target, CheckSquare } from 'lucide-react';
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
  return Math.round((successSteps.filter(s => s.status === 'succeeded').length / successSteps.length) * 100);
};

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
      <div style={{
        background: 'rgba(39,43,54,0.98)',
        borderRadius: '38px',
        border: '1px solid rgba(104,129,171,0.28)',
        boxShadow: '0 28px 72px rgba(0,0,0,0.58)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div className="flex items-center gap-3" style={{
          background: '#4f6b95',
          minHeight: '80px',
          padding: '18px 30px',
          borderBottom: '1px solid rgba(201,214,238,0.18)',
        }}>
          <Target className="w-5 h-5" style={{ color: '#FFFFFF' }} />
          <h2 style={{
            color: '#FFFFFF',
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            margin: 0,
          }}>
            ▸ Story Arcs
          </h2>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 30px' }} className="space-y-6">
          {migratedGoals.map((goal) => {
            const mode = goal.mode || 'simple';
            const branches = goal.branches || {};
            const failBranch = ensureBranch(branches.fail, 'fail');
            const successBranch = ensureBranch(branches.success, 'success');
            const progress = calculateArcProgress(branches);

            return (
              <div key={goal.id} className="space-y-0">
                {/* Root phase card */}
                <div style={{
                  padding: '30px',
                  borderRadius: '26px',
                  background: 'rgba(46,49,60,0.98)',
                  border: '1px solid rgba(80,111,157,0.5)',
                  position: 'relative',
                }}>
                  {/* Row 1: Goal Name + Delete + Progress Ring */}
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <label style={{
                        fontSize: '11px',
                        letterSpacing: '0.22em',
                        color: 'rgba(198,213,238,0.86)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        display: 'block',
                        marginBottom: '8px',
                      }}>Goal Name</label>
                      <AutoResizeTextarea
                        value={goal.title}
                        onChange={(v) => updateGoal(goal.id, { title: v })}
                        placeholder="Enter goal name..."
                        style={{
                          borderRadius: '14px',
                          background: 'rgba(24,28,37,0.92)',
                          padding: '0 18px',
                          fontSize: '16px',
                          height: '54px',
                          border: 'none',
                          color: '#FFFFFF',
                          lineHeight: '54px',
                        }}
                        className="focus:outline-none placeholder:text-[rgba(151,160,180,0.82)]"
                      />
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '10px',
                        border: '1px solid rgba(248,113,113,0.5)',
                        background: 'transparent',
                        color: '#fca5a5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        marginTop: '28px',
                        flexShrink: 0,
                      }}
                      title="Delete arc"
                    >
                      <Trash2 size={15} />
                    </button>

                    {/* Progress ring */}
                    <div className="flex flex-col items-center" style={{ flexShrink: 0, marginTop: '4px' }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '999px',
                        border: '8px solid rgba(51,80,125,0.85)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <span style={{
                          fontSize: '20px',
                          fontWeight: 700,
                          color: 'rgba(195,211,237,0.94)',
                        }}>
                          {progress}%
                        </span>
                      </div>
                      <p style={{
                        marginTop: '6px',
                        fontSize: '9px',
                        fontWeight: 900,
                        color: 'rgba(198,213,238,0.6)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.2em',
                      }}>
                        {successBranch.steps.length > 0
                          ? `${successBranch.steps.filter(s => s.status === 'succeeded').length}/${successBranch.steps.length} Steps`
                          : 'No Steps'}
                      </p>
                    </div>
                  </div>

                  {/* Full width: Desired Outcome */}
                  <div style={{ marginTop: '16px' }}>
                    <div className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
                      <label style={{
                        fontSize: '11px',
                        letterSpacing: '0.22em',
                        color: 'rgba(198,213,238,0.86)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}>Desired Outcome</label>
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
                      style={{
                        borderRadius: '14px',
                        background: 'rgba(24,28,37,0.92)',
                        padding: '14px 18px',
                        fontSize: '16px',
                        height: '84px',
                        border: 'none',
                        color: '#FFFFFF',
                      }}
                      className="focus:outline-none placeholder:text-[rgba(151,160,180,0.82)]"
                    />
                  </div>

                  {/* Full width: Guidance Strength */}
                  <GuidanceStrengthSlider
                    value={goal.flexibility}
                    onChange={(flexibility) => updateGoal(goal.id, { flexibility })}
                  />

                  {/* Steps Section - FULL WIDTH outside grid */}
                  <div style={{
                    marginTop: '18px',
                    paddingTop: '20px',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                  }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                      <div className="flex items-center gap-2">
                        <CheckSquare size={14} style={{ color: '#67a6ff' }} />
                        <h4 style={{
                          fontSize: '11px',
                          letterSpacing: '0.2em',
                          fontWeight: 700,
                          color: 'rgba(226,234,247,0.95)',
                          textTransform: 'uppercase',
                          margin: 0,
                        }}>Steps</h4>
                      </div>
                      <ArcModeToggle mode={mode} onChange={(m) => updateGoal(goal.id, { mode: m })} />
                    </div>

                    <ArcConnectors type="split" />

                    <div className="flex gap-4" style={{ marginTop: '12px' }}>
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

                  {/* Add Next Phase button */}
                  <div className="flex justify-end" style={{ marginTop: '20px' }}>
                    <button
                      type="button"
                      onClick={() => addPhase(goal.id)}
                      className="flex items-center gap-2"
                      style={{
                        height: '42px',
                        padding: '0 16px',
                        borderRadius: '12px',
                        border: '1px solid rgba(110,161,255,0.38)',
                        background: 'rgba(79,106,145,0.42)',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '11px',
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}
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
            className="w-full flex items-center justify-center gap-2"
            style={{
              height: '64px',
              border: '2px dashed rgba(177,188,210,0.45)',
              borderRadius: '18px',
              background: 'transparent',
              color: '#67a6ff',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
          >
            <Plus className="w-5 h-5" />
            Add New Story Arc
          </button>
        </div>
      </div>
    </section>
  );
};
