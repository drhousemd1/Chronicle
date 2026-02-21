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
  activeFlowStepId?: string;
  flowDirection?: 'left' | 'right';
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
  activeFlowStepId,
  flowDirection,
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
          <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">
            {isFail ? 'FAIL PATH' : 'SUCCEED PATH'}
          </span>
        </div>

        {/* Body (trigger) */}
        <div className="p-3.5">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1.5">
            {triggerLabel}
          </label>
          <AutoResizeTextarea
            value={isPassive ? 'AI will handle dynamically' : branch.triggerDescription}
            onChange={onUpdateTrigger}
            readOnly={isPassive}
            placeholder={isFail ? "What causes failure..." : "What triggers success..."}
            className={cn(
              "px-3 py-2 text-sm bg-zinc-900/50 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-zinc-500",
              isPassive ? "text-zinc-500 italic" : "text-white"
            )}
          />
        </div>
      </div>

      {/* Steps */}
      {!isPassive && (
        <div className="space-y-2">
          {branch.steps.map((step, idx) => (
            <div key={step.id} className="relative">
              {/* Active flow dotted connector - only on the specific active step */}
              {activeFlowStepId === step.id && flowDirection && (
                <div className={cn(
                  "absolute top-1/2 border-t-2 border-dashed border-zinc-400/60 -translate-y-1/2 pointer-events-none z-10",
                  flowDirection === 'right' ? "-right-[16px] w-[16px]" : "-left-[16px] w-[16px]"
                )} />
              )}
              <div
                className={cn(
                  "p-2.5 pb-3 rounded-[18px] border",
                  step.status === 'failed' ? "border-red-500/50" :
                  step.status === 'succeeded' ? "border-blue-400/50" :
                  "border-white/15"
                )}
                style={{ background: stepCardBg }}
              >
              {/* Row 1: Step label + delete */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  {stepLabel} {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteStep(step.id)}
                  className="w-[26px] h-[26px] rounded-[8px] border border-red-400/50 bg-transparent text-red-300 flex items-center justify-center cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Row 2: Status buttons */}
              <div className="flex items-center gap-3 mb-2">
                {/* Failed button - hidden on success branch when rigid */}
                {!((!isFail) && isRigid) && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onToggleStatus(step.id, 'failed')}
                      title="Mark as Failed"
                      className={cn(
                        "w-[26px] h-[26px] rounded-[8px] flex items-center justify-center cursor-pointer transition-all",
                        step.status === 'failed'
                          ? "border border-red-500/60 bg-red-500/20 text-red-300"
                          : "border border-white/20 bg-white/5 text-white/40"
                      )}
                    >
                      <X size={13} />
                    </button>
                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-wider">
                      FAILED
                    </span>
                  </div>
                )}

                {/* Succeeded button */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onToggleStatus(step.id, 'succeeded')}
                    title={(!isFail && isRigid) ? "Mark as Completed" : "Mark as Succeeded"}
                    className={cn(
                      "w-[26px] h-[26px] rounded-[8px] flex items-center justify-center cursor-pointer transition-all",
                      step.status === 'succeeded'
                        ? "border border-emerald-500/60 bg-emerald-500/20 text-emerald-200"
                        : "border border-white/20 bg-white/5 text-white/40"
                    )}
                  >
                    <Check size={13} />
                  </button>
                  <span className="text-[10px] font-black text-zinc-300 uppercase tracking-wider">
                    {(!isFail && isRigid) ? 'COMPLETED' : 'SUCCEEDED'}
                  </span>
                </div>
              </div>

              {/* Row 3: Description input */}
              <AutoResizeTextarea
                value={step.description}
                onChange={(v) => onUpdateStep(step.id, { description: v })}
                placeholder="Describe this step..."
                className={cn(
                  "px-3 py-2 text-sm bg-zinc-900/50 border border-zinc-700 text-white placeholder:text-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                  (step.status === 'succeeded' || step.status === 'failed') && "line-through opacity-60"
                )}
              />

              {/* Row 4: Completion meta - ONLY when completed */}
              {step.completedAt && (
                <div className="flex items-center gap-1 mt-2 text-xs text-zinc-400">
                  <Clock size={12} />
                  <span>Completed on Day {step.completedAt}</span>
                </div>
              )}
            </div>
            </div>
          ))}

          {/* Add Step link */}
          <button
            type="button"
            onClick={onAddStep}
            className="flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300 text-sm mt-3 transition-colors w-full"
          >
            <Plus className="h-4 w-4" />
            <span>Add Step</span>
          </button>
        </div>
      )}
    </div>
  );
};
