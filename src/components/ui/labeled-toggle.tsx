import * as React from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface LabeledToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  locked?: boolean;
  className?: string;
  offLabel?: string;  // Custom label for off state (default: "Off")
  onLabel?: string;   // Custom label for on state (default: "On")
}

const LabeledToggle = React.forwardRef<HTMLButtonElement, LabeledToggleProps>(
  ({ checked, onCheckedChange, disabled = false, locked = false, className, offLabel = "Off", onLabel = "On" }, ref) => {
    const isDisabled = disabled || locked;
    
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={isDisabled}
        onClick={() => !isDisabled && onCheckedChange(!checked)}
        className={cn(
          "inline-flex items-center gap-1.5 select-none flex-shrink-0",
          isDisabled && "cursor-not-allowed opacity-70",
          className
        )}
      >
        {/* Off label */}
        <span className={cn(
          "text-xs font-semibold transition-colors",
          checked ? "text-slate-400" : "text-slate-900"
        )}>
          {offLabel}
        </span>
        
        {/* Toggle track */}
        <div className={cn(
          "relative h-5 w-9 rounded-full transition-colors",
          locked ? "bg-slate-400" : (checked ? "bg-blue-500" : "bg-slate-300")
        )}>
          {/* Toggle thumb */}
          <div className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-md transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5"
          )} />
        </div>
        
        {/* On label */}
        <span className={cn(
          "text-xs font-semibold transition-colors",
          checked ? "text-blue-500" : "text-slate-400"
        )}>
          {onLabel}
        </span>
        
        {/* Lock icon for locked toggles */}
        {locked && (
          <Lock className="w-3 h-3 text-slate-400" />
        )}
      </button>
    );
  }
);
LabeledToggle.displayName = "LabeledToggle";

export { LabeledToggle };
