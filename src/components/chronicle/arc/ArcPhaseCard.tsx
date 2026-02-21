import React from 'react';
import { ArcPhase, ArcBranch, ArcStep, ArcMode, GoalFlexibility, StepStatus } from '@/types';
import { Trash2, Sparkles } from 'lucide-react';
import { CircularProgress } from '../CircularProgress';
import { GuidanceStrengthSlider } from '../GuidanceStrengthSlider';
import { ArcBranchLane } from './ArcBranchLane';
import { ArcModeToggle } from './ArcModeToggle';
import { ArcConnectors } from './ArcConnectors';
import { uid, now } from '@/utils';
import { cn } from '@/lib/utils';

// Auto-resizing textarea
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

interface ArcPhaseCardProps {
  phase: ArcPhase;
  phaseNumber: number;
  onUpdate: (patch: Partial<ArcPhase>) => void;
  onDelete: () => void;
  onEnhanceField?: (fieldKey: string, getCurrentValue: () => string, setValue: (value: string) => void, customLabel?: string) => void;
  enhancingField?: string | null;
}

const calculateArcProgress = (branches?: { fail?: ArcBranch; success?: ArcBranch }): number => {
  const successSteps = branches?.success?.steps || [];
  if (successSteps.length === 0) return 0;
  return Math.round((successSteps.filter(s => s.status === 'succeeded').length / successSteps.length) * 100);
};

const ensureBranch = (branch: ArcBranch | undefined, type: 'fail' | 'success'): ArcBranch => {
  return branch || { id: uid('branch'), type, triggerDescription: '', steps: [] };
};

export const ArcPhaseCard: React.FC<ArcPhaseCardProps> = ({
  phase,
  phaseNumber,
  onUpdate,
  onDelete,
  onEnhanceField,
  enhancingField,
}) => {
  const mode = phase.mode || 'simple';
  const branches = phase.branches || {};
  const failBranch = ensureBranch(branches.fail, 'fail');
  const successBranch = ensureBranch(branches.success, 'success');
  const progress = calculateArcProgress(branches);

  const getNextEventOrder = (): number => {
    const counter = (phase.statusEventCounter || 0) + 1;
    onUpdate({ statusEventCounter: counter });
    return counter;
  };

  const updateBranch = (type: 'fail' | 'success', patch: Partial<ArcBranch>) => {
    const current = type === 'fail' ? failBranch : successBranch;
    onUpdate({
      branches: {
        ...branches,
        [type]: { ...current, ...patch },
      },
      updatedAt: now(),
    });
  };

  const addStep = (type: 'fail' | 'success') => {
    const branch = type === 'fail' ? failBranch : successBranch;
    const newStep: ArcStep = { id: uid('astep'), description: '', status: 'pending', statusEventOrder: 0 };
    updateBranch(type, { steps: [...branch.steps, newStep] });
  };

  const updateStep = (type: 'fail' | 'success', stepId: string, patch: Partial<ArcStep>) => {
    const branch = type === 'fail' ? failBranch : successBranch;
    updateBranch(type, {
      steps: branch.steps.map(s => s.id === stepId ? { ...s, ...patch } : s),
    });
  };

  const deleteStep = (type: 'fail' | 'success', stepId: string) => {
    const branch = type === 'fail' ? failBranch : successBranch;
    updateBranch(type, { steps: branch.steps.filter(s => s.id !== stepId) });
  };

  const toggleStatus = (type: 'fail' | 'success', stepId: string, targetStatus: StepStatus) => {
    const branch = type === 'fail' ? failBranch : successBranch;
    const step = branch.steps.find(s => s.id === stepId);
    if (!step) return;
    const newStatus = step.status === targetStatus ? 'pending' : targetStatus;
    const eventOrder = newStatus !== 'pending' ? getNextEventOrder() : 0;
    updateStep(type, stepId, {
      status: newStatus,
      statusEventOrder: eventOrder,
      completedAt: newStatus === 'succeeded' ? now() : undefined,
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
    <div className="relative">
      {/* Phase connector line */}
      {phaseNumber > 1 && (
        <div className="flex justify-center -mt-1 mb-2">
          <div className="w-px h-8 bg-blue-500/30" />
        </div>
      )}

      <div className="p-5 pb-6 bg-[#3a3a3f]/30 rounded-2xl border border-blue-500/20 relative">
        {/* Phase label */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">
            Phase {phaseNumber}
          </span>
          <button onClick={onDelete} className="text-zinc-500 hover:text-rose-400 transition-colors" title="Delete phase">
            <Trash2 className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-9 space-y-4">
            {/* Phase Title */}
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Goal Name</label>
              <AutoResizeTextarea
                value={phase.title}
                onChange={(v) => onUpdate({ title: v, updatedAt: now() })}
                placeholder="Enter goal name..."
                className="mt-1 px-3 py-2 text-sm bg-zinc-900/50 border border-white/10 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Desired Outcome */}
            <div>
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Desired Outcome</label>
                <SparkleButton
                  fieldKey={`phase_outcome_${phase.id}`}
                  onClick={() => onEnhanceField?.(
                    `phase_outcome_${phase.id}`,
                    () => phase.desiredOutcome,
                    (v) => onUpdate({ desiredOutcome: v, updatedAt: now() }),
                    `Desired Outcome for phase: ${phase.title || 'Untitled'}`
                  )}
                />
              </div>
              <AutoResizeTextarea
                value={phase.desiredOutcome}
                onChange={(v) => onUpdate({ desiredOutcome: v, updatedAt: now() })}
                placeholder="What success looks like..."
                className="mt-1 px-3 py-2 text-sm bg-zinc-900/50 border border-white/10 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                rows={2}
              />
            </div>

            {/* Guidance Strength */}
            <GuidanceStrengthSlider
              value={phase.flexibility}
              onChange={(flexibility) => onUpdate({ flexibility, updatedAt: now() })}
            />

            {/* Steps / Branches */}
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Steps</h4>
                <ArcModeToggle mode={mode} onChange={(m) => onUpdate({ mode: m, updatedAt: now() })} />
              </div>

              <ArcConnectors type="split" />

              <div className="flex gap-3 mt-3">
                <ArcBranchLane
                  branch={failBranch}
                  type="fail"
                  flexibility={phase.flexibility}
                  isSimpleMode={mode === 'simple'}
                  onUpdateTrigger={(d) => updateBranch('fail', { triggerDescription: d })}
                  onAddStep={() => addStep('fail')}
                  onUpdateStep={(id, patch) => updateStep('fail', id, patch)}
                  onDeleteStep={(id) => deleteStep('fail', id)}
                  onToggleStatus={(id, status) => toggleStatus('fail', id, status)}
                />
                <ArcBranchLane
                  branch={successBranch}
                  type="success"
                  flexibility={phase.flexibility}
                  isSimpleMode={false}
                  onUpdateTrigger={(d) => updateBranch('success', { triggerDescription: d })}
                  onAddStep={() => addStep('success')}
                  onUpdateStep={(id, patch) => updateStep('success', id, patch)}
                  onDeleteStep={(id) => deleteStep('success', id)}
                  onToggleStatus={(id, status) => toggleStatus('success', id, status)}
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
      </div>
    </div>
  );
};
