import React from 'react';
import { ArcPhase, ArcBranch, ArcStep, ArcMode, GoalFlexibility, StepStatus } from '@/types';
import { Trash2, Sparkles, CheckSquare } from 'lucide-react';
import { GuidanceStrengthSlider } from '../GuidanceStrengthSlider';
import { ArcBranchLane } from './ArcBranchLane';
import { ArcModeToggle } from './ArcModeToggle';
import { ArcConnectors } from './ArcConnectors';
import { uid, now } from '@/utils';
import { cn } from '@/lib/utils';

/** Compute the single active flow connector between branches */
function computeActiveFlow(
  failBranch: ArcBranch,
  successBranch: ArcBranch
): { failActiveId?: string; successActiveId?: string } | null {
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
  if (latest.step.status === 'failed') {
    const opposite = latest.branch === 'fail' ? successBranch : failBranch;
    const nextPending = opposite.steps.find(s => s.status === 'pending');
    if (!nextPending) return null;
    return latest.branch === 'fail'
      ? { failActiveId: latest.step.id, successActiveId: nextPending.id }
      : { failActiveId: nextPending.id, successActiveId: latest.step.id };
  }
  if (latest.step.status === 'succeeded' && latest.branch === 'fail') {
    const nextPending = successBranch.steps.find(s => s.status === 'pending');
    if (!nextPending) return null;
    return { failActiveId: latest.step.id, successActiveId: nextPending.id };
  }
  return null;
}

// Auto-resizing textarea
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

interface ArcPhaseCardProps {
  phase: ArcPhase;
  phaseNumber: number;
  onUpdate: (patch: Partial<ArcPhase>) => void;
  onDelete: () => void;
  onEnhanceField?: (fieldKey: string, getCurrentValue: () => string, setValue: (value: string) => void, customLabel?: string) => void;
  enhancingField?: string | null;
  hasNextPhase?: boolean;
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
  hasNextPhase = false,
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
    <div className="mt-4 pt-5 border-t border-white/10">
      {/* Phase label + delete */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
          Phase {phaseNumber}
        </span>
        <button
          onClick={onDelete}
          className="w-[30px] h-[30px] rounded-[10px] border border-red-400/50 bg-transparent text-red-300 flex items-center justify-center cursor-pointer"
          title="Delete phase"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Row 1: Goal Name + Progress Ring */}
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Goal Name</label>
          <AutoResizeTextarea
            value={phase.title}
            onChange={(v) => onUpdate({ title: v, updatedAt: now() })}
            placeholder="Enter goal name..."
            className="mt-1 px-3 py-2 text-sm bg-zinc-900/50 border border-zinc-700 text-white placeholder:text-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

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
          rows={2}
          className="mt-1 px-3 py-2 text-sm bg-zinc-900/50 border border-zinc-700 text-white placeholder:text-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
      </div>

      {/* Full width: Guidance Strength */}
      <GuidanceStrengthSlider
        value={phase.flexibility}
        onChange={(flexibility) => onUpdate({ flexibility, updatedAt: now() })}
      />

      {/* Steps / Branches */}
      <div className="mt-4 pt-5 border-t border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckSquare size={14} className="text-blue-400" />
            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] m-0">Steps</h4>
          </div>
          <ArcModeToggle mode={mode} onChange={(m) => {
            onUpdate({ mode: m, updatedAt: now() });
            if (m === 'advanced') {
              if (failBranch.steps.length === 0) addStep('fail');
              if (successBranch.steps.length === 0) addStep('success');
            }
          }} />
        </div>

        <ArcConnectors type="split" />

        <div className="relative mt-3">
          {(() => {
            const flow = computeActiveFlow(failBranch, successBranch);
            return (
              <div className="grid grid-cols-2 gap-4">
                <ArcBranchLane
                  branch={failBranch}
                  type="fail"
                  flexibility={phase.flexibility}
                  isSimpleMode={mode === 'simple'}
                  activeFlowStepId={flow?.failActiveId}
                  flowDirection="right"
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
                  activeFlowStepId={flow?.successActiveId}
                  flowDirection="left"
                  onUpdateTrigger={(d) => updateBranch('success', { triggerDescription: d })}
                  onAddStep={() => addStep('success')}
                  onUpdateStep={(id, patch) => updateStep('success', id, patch)}
                  onDeleteStep={(id) => deleteStep('success', id)}
                  onToggleStatus={(id, status) => toggleStatus('success', id, status)}
                />
              </div>
            );
          })()}
        </div>

        {hasNextPhase && <ArcConnectors type="merge" />}
      </div>
    </div>
  );
};
