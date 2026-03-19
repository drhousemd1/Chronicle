import React from 'react';
import { GoalFlexibility } from '@/types';

type StepStatus = 'pending' | 'failed' | 'succeeded' | 'deviated';
type ArcStep = { id: string; description: string; status: StepStatus; statusEventOrder: number; completedAt?: number; retryOf?: string; retryCount?: number; failedOnDay?: number; permanentlyFailed?: boolean; resistanceScore?: number; resistanceEvents?: any[] };
type ArcBranch = { id: string; type: 'fail' | 'success'; triggerDescription: string; steps: ArcStep[] };
import { Plus, X, Check, Trash2, Clock, ArrowUpRight, RotateCcw, Ban, Lock } from 'lucide-react';
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

  const stepLabel = isFail ? 'RECOVERY STEP' : 'PROGRESSION STEP';
  const triggerLabel = isFail ? 'RESISTANCE TRIGGER' : 'SUCCESS TRIGGER';

  const sentinelText = isSimpleMode
    ? 'AI will handle recovery steps dynamically'
    : 'AI will handle ongoing recovery steps dynamically once predetermined recovery attempts have all been attempted.';

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
            value={branch.triggerDescription}
            onChange={onUpdateTrigger}
            placeholder={isFail ? "What causes failure..." : "What triggers success..."}
            className="px-3 py-2 text-sm bg-[#1c1c1f] border border-black/35 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-zinc-600 text-white"
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {!isSimpleMode && branch.steps.filter(s => !s.retryOf).map((step, idx) => {
          // Compute retry info from clones targeting this step
          const clones = branch.steps.filter(s => s.retryOf === step.id);
          const maxRetryCount = clones.length > 0 ? Math.max(...clones.map(c => c.retryCount || 1)) : 0;
          const hasRetries = maxRetryCount > 0;
          const isPermanentlyFailed = step.permanentlyFailed || clones.some(c => c.permanentlyFailed);

          return (
          <div key={step.id} className="relative" data-step-id={step.id}>
            <div
              className={cn(
                "p-2.5 pb-3 rounded-[18px] border shadow-[0_14px_26px_-6px_rgba(0,0,0,0.4)]",
                step.status === 'failed' ? "border-red-500/50" :
                step.status === 'deviated' ? "border-orange-500/50" :
                step.status === 'succeeded' ? "border-blue-500/50" :
                "border-white/15"
              )}
              style={{ background: stepCardBg }}
            >
            {/* Row 1: Step label + retry badge + delete */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  {stepLabel} {idx + 1}
                </span>
                {hasRetries && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-full px-1.5 py-0.5">
                    <RotateCcw size={9} />
                    Retry {maxRetryCount} of {flexibility === 'rigid' ? '∞' : flexibility === 'flexible' ? 2 : 4}
                  </span>
                )}
                {isPermanentlyFailed && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-500/80 bg-red-500/10 border border-red-500/20 rounded-full px-1.5 py-0.5">
                    <Ban size={9} />
                    Max retries
                  </span>
                )}
              </div>
              <button
                type="button"
                tabIndex={-1}
                onClick={() => onDeleteStep(step.id)}
                className="w-[26px] h-[26px] rounded-[8px] border border-red-500/50 bg-transparent text-red-300 flex items-center justify-center cursor-pointer"
              >
                <Trash2 size={13} />
              </button>
            </div>

            {/* Row 2: Status buttons */}
            <div className="flex items-center gap-3 mb-2">
              {/* Failed/Deviated button */}
              {!((!isFail) && isRigid) ? (
                /* Normal failed button for non-rigid or fail branch */
                <div className="flex items-center gap-1.5">
                 <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => onToggleStatus(step.id, 'failed')}
                    title="Mark as Failed"
                    className={cn(
                      "w-[26px] h-[26px] rounded-[8px] flex items-center justify-center cursor-pointer transition-all",
                      step.status === 'failed'
                        ? "border border-red-500/60 bg-red-500/20 text-red-300"
                        : "border border-black/20 bg-[#3f3f46] text-[#a1a1aa]"
                    )}
                  >
                    <X size={13} />
                  </button>
                  <span className="text-[10px] font-black text-zinc-300 uppercase tracking-wider">
                    FAILED
                  </span>
                </div>
              ) : (
                /* Deviated button for rigid success branch */
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => onToggleStatus(step.id, 'deviated')}
                    title="Mark as Deviated"
                    className={cn(
                      "w-[26px] h-[26px] rounded-[8px] flex items-center justify-center cursor-pointer transition-all",
                      step.status === 'deviated'
                        ? "border border-orange-500/60 bg-orange-500/20 text-orange-300"
                        : "border border-black/20 bg-[#3f3f46] text-[#a1a1aa]"
                    )}
                  >
                    <ArrowUpRight size={13} />
                  </button>
                  <span className="text-[10px] font-black text-zinc-300 uppercase tracking-wider">
                    DEVIATED
                  </span>
                </div>
              )}

              {/* Succeeded button */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => onToggleStatus(step.id, 'succeeded')}
                  title={(!isFail && isRigid) ? "Mark as Completed" : "Mark as Succeeded"}
                  className={cn(
                    "w-[26px] h-[26px] rounded-[8px] flex items-center justify-center cursor-pointer transition-all",
                    step.status === 'succeeded'
                      ? "border border-emerald-500/60 bg-emerald-500/20 text-emerald-200"
                      : "border border-black/20 bg-[#3f3f46] text-[#a1a1aa]"
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
                "px-3 py-2 text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                (step.status === 'succeeded' || step.status === 'failed' || step.status === 'deviated') && "line-through opacity-60"
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
          );
        })}

        {/* Sentinel card - fail branch only */}
        {isFail && (
          <div className="relative">
            <div
              className="p-2.5 pb-3 rounded-[18px] border border-white/15 shadow-[0_14px_26px_-6px_rgba(0,0,0,0.4)]"
              style={{ background: stepCardBg }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  DYNAMIC RECOVERY
                </span>
                <div className="w-[26px] h-[26px] rounded-[8px] border border-zinc-600 bg-transparent text-zinc-400 flex items-center justify-center">
                  <Lock size={13} />
                </div>
              </div>
              <AutoResizeTextarea
                value={sentinelText}
                onChange={() => {}}
                readOnly
                className="px-3 py-2 text-sm bg-[#1c1c1f] border border-black/35 text-zinc-400 italic rounded-lg cursor-default"
              />
            </div>
          </div>
        )}

        {/* Add Step button - advanced mode only */}
        {!isSimpleMode && (
          <button
            type="button"
            onClick={onAddStep}
            className="w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all flex items-center justify-center gap-1.5 mt-3"
          >
            <Plus className="h-4 w-4" />
            <span>Add Step</span>
          </button>
        )}
      </div>
    </div>
  );
};
