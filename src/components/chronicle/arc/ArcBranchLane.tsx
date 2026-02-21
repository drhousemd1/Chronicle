import React from 'react';
import { ArcBranch, ArcStep, StepStatus, GoalFlexibility } from '@/types';
import { Plus, X, Check, Trash2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uid, now } from '@/utils';

// Auto-resizing textarea
const AutoResizeTextarea: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  readOnly?: boolean;
}> = ({ value, onChange, placeholder, className = '', rows = 1, readOnly }) => {
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

  // In simple mode, fail lane is passive
  const isPassive = isFail && isSimpleMode;

  const stepLabel = isFail ? 'RECOVERY STEP' : 'PROGRESSION STEP';
  const triggerLabel = isFail ? 'RESISTANCE TRIGGER' : 'SUCCESS TRIGGER';

  return (
    <div className={cn(
      "flex-1 rounded-xl border p-4 space-y-3",
      isFail ? "border-red-500/20 bg-red-500/5" : "border-green-500/20 bg-green-500/5"
    )}>
      {/* Header */}
      <div className={cn(
        "rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-[0.15em]",
        isFail ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
      )}>
        {isFail ? 'FAIL PATH' : 'SUCCEED PATH'}
      </div>

      {/* Trigger */}
      <div>
        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{triggerLabel}</label>
        <AutoResizeTextarea
          value={isPassive ? 'AI will handle dynamically' : branch.triggerDescription}
          onChange={onUpdateTrigger}
          readOnly={isPassive}
          placeholder={isFail ? "What causes failure..." : "What triggers success..."}
          className={cn(
            "mt-1 px-3 py-2 text-xs bg-zinc-900/50 border border-white/10 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2",
            isFail ? "focus:ring-red-500/20" : "focus:ring-green-500/20",
            isPassive && "text-zinc-500 italic cursor-default"
          )}
        />
      </div>

      {/* Steps */}
      {!isPassive && (
        <div className="space-y-2">
          {branch.steps.map((step, idx) => (
            <div key={step.id} className="bg-zinc-900/40 rounded-lg p-3 border border-white/5 space-y-2">
              {/* Step header */}
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-widest",
                  isFail ? "text-red-400/70" : "text-green-400/70"
                )}>
                  {stepLabel} {idx + 1}
                </span>
                <div className="flex items-center gap-1">
                  {/* Failed button - hidden on success branch when rigid */}
                  {!((!isFail) && isRigid) && (
                    <button
                      type="button"
                      onClick={() => onToggleStatus(step.id, 'failed')}
                      title="Mark as Failed"
                      className={cn(
                        "p-1 rounded transition-colors",
                        step.status === 'failed'
                          ? "bg-red-500/20 text-red-400"
                          : "text-zinc-600 hover:text-red-400 hover:bg-red-500/10"
                      )}
                    >
                      <X size={14} />
                    </button>
                  )}
                  {/* Succeeded button */}
                  <button
                    type="button"
                    onClick={() => onToggleStatus(step.id, 'succeeded')}
                    title={(!isFail && isRigid) ? "Mark as Completed" : "Mark as Succeeded"}
                    className={cn(
                      "p-1 rounded transition-colors",
                      step.status === 'succeeded'
                        ? "bg-green-500/20 text-green-400"
                        : "text-zinc-600 hover:text-green-400 hover:bg-green-500/10"
                    )}
                  >
                    <Check size={14} />
                  </button>
                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => onDeleteStep(step.id)}
                    className="p-1 text-zinc-600 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Step description */}
              <AutoResizeTextarea
                value={step.description}
                onChange={(v) => onUpdateStep(step.id, { description: v })}
                placeholder={`Describe this step...`}
                className={cn(
                  "px-3 py-2 text-xs bg-zinc-800/50 border border-white/5 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-1",
                  isFail ? "focus:ring-red-500/20" : "focus:ring-green-500/20",
                  step.status === 'succeeded' && "line-through text-zinc-500",
                  step.status === 'failed' && "line-through text-red-400/50"
                )}
              />

              {/* Timestamp placeholder */}
              <div className="flex items-center gap-1 text-[9px] text-zinc-600">
                <Clock size={10} />
                <span>{step.completedAt ? `Completed on Day ${step.completedAt}` : 'Completed on (Day #)'}</span>
              </div>
            </div>
          ))}

          {/* Add Step */}
          <button
            type="button"
            onClick={onAddStep}
            className={cn(
              "flex items-center gap-2 text-xs mt-2 transition-colors",
              isFail ? "text-red-400 hover:text-red-300" : "text-green-400 hover:text-green-300"
            )}
          >
            <Plus size={14} />
            <span>Add Step</span>
          </button>
        </div>
      )}
    </div>
  );
};
