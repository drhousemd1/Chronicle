import React from 'react';
import { ArcBranch, ArcStep, StepStatus, GoalFlexibility } from '@/types';
import { Plus, X, Check, Trash2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

// Auto-resizing textarea
const AutoResizeTextarea: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  readOnly?: boolean;
  style?: React.CSSProperties;
}> = ({ value, onChange, placeholder, className = '', rows = 1, readOnly, style }) => {
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
      readOnly={readOnly}
      spellCheck={true}
      style={style}
      className={cn("w-full min-w-0 resize-none overflow-hidden whitespace-pre-wrap break-words", className)}
    />
  );
};

interface ArcBranchLaneProps {
  branch: ArcBranch;
  type: 'fail' | 'success';
  flexibility: GoalFlexibility;
  isSimpleMode: boolean;
  onUpdateTrigger: (description: string) => void;
  onAddStep: () => void;
  onUpdateStep: (stepId: string, patch: Partial<ArcStep>) => void;
  onDeleteStep: (stepId: string) => void;
  onToggleStatus: (stepId: string, status: StepStatus) => void;
}

export const ArcBranchLane: React.FC<ArcBranchLaneProps> = ({
  branch,
  type,
  flexibility,
  isSimpleMode,
  onUpdateTrigger,
  onAddStep,
  onUpdateStep,
  onDeleteStep,
  onToggleStatus,
}) => {
  const isFail = type === 'fail';
  const isRigid = flexibility === 'rigid';
  const isPassive = isFail && isSimpleMode;

  const stepLabel = isFail ? 'RECOVERY STEP' : 'PROGRESSION STEP';
  const triggerLabel = isFail ? 'RESISTANCE TRIGGER' : 'SUCCESS TRIGGER';

  const stripBg = isFail ? 'rgba(240,74,95,0.28)' : 'rgba(34,197,127,0.28)';
  const borderColor = isFail ? 'rgba(240,74,95,0.52)' : 'rgba(34,197,127,0.52)';
  const stepCardBg = isFail ? 'rgba(78,58,68,0.78)' : 'rgba(51,75,66,0.78)';
  const addStepBg = isFail ? 'rgba(88,60,70,0.78)' : 'rgba(58,86,76,0.78)';

  return (
    <div
      className="flex-1 space-y-3"
      style={{
        borderRadius: '24px',
        border: `1px dotted ${borderColor}`,
        padding: '10px',
        background: 'rgba(13,17,25,0.26)',
      }}
    >
      {/* Header cluster */}
      <div style={{
        borderRadius: '18px',
        background: 'rgba(43,47,57,0.9)',
        boxShadow: '0 14px 26px rgba(0,0,0,0.4)',
        overflow: 'hidden',
      }}>
        {/* Strip (title bar) */}
        <div style={{
          background: stripBg,
          padding: '12px 16px',
        }}>
          <span style={{
            fontSize: '12px',
            letterSpacing: '0.22em',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.72)',
            textTransform: 'uppercase',
          }}>
            {isFail ? 'FAIL PATH' : 'SUCCEED PATH'}
          </span>
        </div>

        {/* Body (trigger) */}
        <div style={{ padding: '13px' }}>
          <label style={{
            fontSize: '10px',
            letterSpacing: '0.2em',
            color: 'rgba(214,227,248,0.72)',
            fontWeight: 700,
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: '6px',
          }}>
            {triggerLabel}
          </label>
          <AutoResizeTextarea
            value={isPassive ? 'AI will handle dynamically' : branch.triggerDescription}
            onChange={onUpdateTrigger}
            readOnly={isPassive}
            placeholder={isFail ? "What causes failure..." : "What triggers success..."}
            style={{
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(0,0,0,0.25)',
              fontSize: '15px',
              padding: '12px 14px',
              border: 'none',
              color: isPassive ? 'rgba(198,213,238,0.5)' : '#FFFFFF',
              fontStyle: isPassive ? 'italic' : 'normal',
            }}
            className="focus:outline-none"
          />
        </div>
      </div>

      {/* Steps */}
      {!isPassive && (
        <div className="space-y-2">
          {branch.steps.map((step, idx) => (
            <div
              key={step.id}
              style={{
                padding: '10px 12px 12px',
                borderRadius: '18px',
                background: stepCardBg,
                border: '1px solid rgba(255,255,255,0.14)',
              }}
            >
              {/* Step header row */}
              <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                <span style={{
                  fontSize: '11px',
                  letterSpacing: '0.16em',
                  fontWeight: 700,
                  color: 'rgba(190,207,232,0.72)',
                  textTransform: 'uppercase',
                }}>
                  {stepLabel} {idx + 1}
                </span>
                <div className="flex items-center gap-1.5">
                  {/* Failed button - hidden on success branch when rigid */}
                  {!((!isFail) && isRigid) && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(step.id, 'failed')}
                        title="Mark as Failed"
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '9px',
                          border: step.status === 'failed'
                            ? '1px solid rgba(239,68,68,0.6)'
                            : '1px solid rgba(255,255,255,0.22)',
                          background: step.status === 'failed'
                            ? 'rgba(239,68,68,0.2)'
                            : 'rgba(255,255,255,0.06)',
                          color: step.status === 'failed' ? '#fca5a5' : 'rgba(255,255,255,0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        <X size={14} />
                      </button>
                      <span style={{
                        fontSize: '10px',
                        letterSpacing: '0.08em',
                        color: 'rgba(205,219,242,0.78)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}>
                        FAILED
                      </span>
                    </div>
                  )}

                  {/* Succeeded button */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onToggleStatus(step.id, 'succeeded')}
                      title={(!isFail && isRigid) ? "Mark as Completed" : "Mark as Succeeded"}
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '9px',
                        border: step.status === 'succeeded'
                          ? '1px solid rgba(16,185,129,0.6)'
                          : '1px solid rgba(255,255,255,0.22)',
                        background: step.status === 'succeeded'
                          ? 'rgba(16,185,129,0.2)'
                          : 'rgba(255,255,255,0.06)',
                        color: step.status === 'succeeded' ? '#a7f3d0' : 'rgba(255,255,255,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <Check size={14} />
                    </button>
                    <span style={{
                      fontSize: '10px',
                      letterSpacing: '0.08em',
                      color: 'rgba(205,219,242,0.78)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}>
                      {(!isFail && isRigid) ? 'COMPLETED' : 'SUCCEEDED'}
                    </span>
                  </div>

                  {/* Delete step */}
                  <button
                    type="button"
                    onClick={() => onDeleteStep(step.id)}
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
                      marginLeft: '4px',
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Step description input */}
              <AutoResizeTextarea
                value={step.description}
                onChange={(v) => onUpdateStep(step.id, { description: v })}
                placeholder="Describe this step..."
                style={{
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(0,0,0,0.25)',
                  fontSize: '15px',
                  padding: '8px 12px',
                  border: 'none',
                  color: '#FFFFFF',
                  textDecoration: step.status === 'succeeded' || step.status === 'failed' ? 'line-through' : 'none',
                  opacity: step.status !== 'pending' ? 0.6 : 1,
                }}
                className="focus:outline-none"
              />

              {/* Completion meta */}
              <div className="flex items-center gap-1" style={{
                marginTop: '8px',
                fontSize: '11px',
                letterSpacing: '0.04em',
                color: 'rgba(202,214,236,0.72)',
              }}>
                <Clock size={11} />
                <span>{step.completedAt ? `Completed on Day ${step.completedAt}` : 'Completed on (Day #)'}</span>
              </div>
            </div>
          ))}

          {/* Add Step button */}
          <button
            type="button"
            onClick={onAddStep}
            className="w-full flex items-center justify-center gap-2"
            style={{
              height: '50px',
              borderRadius: '18px',
              letterSpacing: '0.16em',
              fontSize: '12px',
              fontWeight: 700,
              border: '1px solid rgba(255,255,255,0.16)',
              background: addStepBg,
              color: '#FFFFFF',
              cursor: 'pointer',
              textTransform: 'uppercase',
              transition: 'opacity 0.15s',
            }}
          >
            <Plus size={14} />
            ADD STEP
          </button>
        </div>
      )}
    </div>
  );
};
