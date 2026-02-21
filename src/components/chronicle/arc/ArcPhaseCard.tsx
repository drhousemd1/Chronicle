import React from 'react';
import { ArcPhase, ArcBranch, ArcStep, ArcMode, GoalFlexibility, StepStatus } from '@/types';
import { Trash2, Sparkles, CheckSquare } from 'lucide-react';
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
    <div className="relative">
      {/* Chain connector */}
      <div className="flex justify-center">
        <svg width="60" height="48" viewBox="0 0 60 48">
          <defs>
            <filter id={`chain-glow-${phase.id}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.8" result="blur" />
              <feFlood floodColor="#FFFFFF" floodOpacity="0.28" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <line x1="30" y1="0" x2="30" y2="48" stroke="rgba(232,238,248,0.82)" strokeWidth="1.8" filter={`url(#chain-glow-${phase.id})`} />
        </svg>
      </div>

      {/* Phase card */}
      <div style={{
        padding: '30px',
        borderRadius: '26px',
        background: 'rgba(46,49,60,0.98)',
        border: '1px solid rgba(80,111,157,0.5)',
        position: 'relative',
      }}>
        {/* Phase label + delete */}
        <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
          <span style={{
            fontSize: '11px',
            letterSpacing: '0.22em',
            fontWeight: 700,
            color: '#6ea1ff',
            textTransform: 'uppercase',
          }}>
            Phase {phaseNumber}
          </span>
          <button
            onClick={onDelete}
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
            }}
            title="Delete phase"
          >
            <Trash2 size={15} />
          </button>
        </div>

        {/* Row 1: Goal Name + Progress Ring */}
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
              value={phase.title}
              onChange={(v) => onUpdate({ title: v, updatedAt: now() })}
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
          value={phase.flexibility}
          onChange={(flexibility) => onUpdate({ flexibility, updatedAt: now() })}
        />

        {/* Steps / Branches - FULL WIDTH outside grid */}
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
            <ArcModeToggle mode={mode} onChange={(m) => onUpdate({ mode: m, updatedAt: now() })} />
          </div>

          <ArcConnectors type="split" />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px', marginTop: '12px' }}>
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

          {hasNextPhase && <ArcConnectors type="merge" />}
        </div>
      </div>
    </div>
  );
};
