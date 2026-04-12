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
  labelTone?: "default" | "dark";
}

const LabeledToggle = React.forwardRef<HTMLButtonElement, LabeledToggleProps>(
  ({ checked, onCheckedChange, disabled = false, locked = false, className, offLabel = "Off", onLabel = "On", labelTone = "default" }, ref) => {
    const isDisabled = disabled || locked;
    const offInactiveClass = "text-zinc-500";
    const onInactiveClass = "text-zinc-500";
    const offActiveClass = labelTone === "dark" ? "text-zinc-900" : "text-zinc-200";
    const onActiveClass = labelTone === "dark" ? "text-[#4a5f7f]" : "text-blue-500";
    
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
          checked ? offInactiveClass : offActiveClass
        )}>
          {offLabel}
        </span>
        
        {/* Toggle track */}
        <div className={cn(
          "relative h-[22px] w-10 rounded-full transition-colors",
          locked ? "bg-zinc-500" : (checked ? "bg-blue-500 shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]" : "bg-[#1c1c1f] shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]")
        )}>
          {/* Toggle thumb */}
          <div className={cn(
            "absolute top-[3px] h-4 w-4 rounded-full bg-white shadow-md transition-transform",
            checked ? "translate-x-[21px]" : "translate-x-[3px]"
          )} />
        </div>
        
        {/* On label */}
        <span className={cn(
          "text-xs font-semibold transition-colors",
          checked ? onActiveClass : onInactiveClass
        )}>
          {onLabel}
        </span>
        
        {/* Lock icon for locked toggles */}
        {locked && (
          <Lock className="w-3 h-3 text-zinc-500" />
        )}
      </button>
    );
  }
);
LabeledToggle.displayName = "LabeledToggle";

export { LabeledToggle };
