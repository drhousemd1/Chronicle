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
  const stepCardBg = isFail ? 'rgba(78,58,68,0.78)' : 'rgba(51,75,66,0.78)';
  const addStepBg = isFail ? 'rgba(88,60,70,0.78)' : 'rgba(58,86,76,0.78)';

  return (
    <div className="space-y-3">
      {/* Header cluster */}
      <div className="rounded-[18px] bg-[rgba(43,47,57,0.9)] shadow-[0_14px_26px_rgba(0,0,0,0.4)] overflow-hidden">
        {/* Strip (title bar) */}
        <div style={{ background: stripBg }} className="px-4 py-3">
          <span className="text-xs font-bold text-white/70 uppercase tracking-widest">
            {isFail ? 'FAIL PATH' : 'SUCCEED PATH'}
          </span>
        </div>

        {/* Body (trigger) */}
        <div className="p-3.5">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1.5">
            {triggerLabel}
          </label>
          <AutoResizeTextarea
            value={isPassive ? 'AI will handle dynamically' : branch.triggerDescription}
            onChange={onUpdateTrigger}
            readOnly={isPassive}
            placeholder={isFail ? "What causes failure..." : "What triggers success..."}
            className={cn(
              "px-3 py-2 text-sm bg-zinc-900/50 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20",
              isPassive ? "text-zinc-500 italic" : "text-white"
            )}
          />
        </div>
      </div>

      {/* Steps */}
      {!isPassive && (
        <div className="space-y-2">
          {branch.steps.map((step, idx) => (
            <div
              key={step.id}
              className="p-2.5 pb-3 rounded-[18px] border border-white/15"
              style={{ background: stepCardBg }}
            >
              {/* Step header row */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
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
                        className={cn(
                          "w-[30px] h-[30px] rounded-[9px] flex items-center justify-center cursor-pointer transition-all",
                          step.status === 'failed'
                            ? "border border-red-500/60 bg-red-500/20 text-red-300"
                            : "border border-white/20 bg-white/5 text-white/40"
                        )}
                      >
                        <X size={14} />
                      </button>
                      <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
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
                      className={cn(
                        "w-[30px] h-[30px] rounded-[9px] flex items-center justify-center cursor-pointer transition-all",
                        step.status === 'succeeded'
                          ? "border border-emerald-500/60 bg-emerald-500/20 text-emerald-200"
                          : "border border-white/20 bg-white/5 text-white/40"
                      )}
                    >
                      <Check size={14} />
                    </button>
                    <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                      {(!isFail && isRigid) ? 'COMPLETED' : 'SUCCEEDED'}
                    </span>
                  </div>

                  {/* Delete step */}
                  <button
                    type="button"
                    onClick={() => onDeleteStep(step.id)}
                    className="w-[30px] h-[30px] rounded-[10px] border border-red-400/50 bg-transparent text-red-300 flex items-center justify-center cursor-pointer ml-1"
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
                className={cn(
                  "px-3 py-2 text-sm bg-zinc-900/50 border border-white/10 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                  (step.status === 'succeeded' || step.status === 'failed') && "line-through opacity-60"
                )}
              />

              {/* Completion meta */}
              <div className="flex items-center gap-1 mt-2 text-xs text-zinc-400">
                <Clock size={11} />
                <span>{step.completedAt ? `Completed on Day ${step.completedAt}` : 'Completed on (Day #)'}</span>
              </div>
            </div>
          ))}

          {/* Add Step button */}
          <button
            type="button"
            onClick={onAddStep}
            className="w-full flex items-center justify-center gap-2 h-[50px] rounded-[18px] text-sm font-bold text-white uppercase tracking-widest border border-white/15 cursor-pointer transition-opacity hover:opacity-80"
            style={{ background: addStepBg }}
          >
            <Plus size={14} />
            ADD STEP
          </button>
        </div>
      )}
    </div>
  );
};
