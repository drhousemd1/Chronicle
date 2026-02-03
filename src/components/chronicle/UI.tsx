import React, { forwardRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "brand" | "outlineDark" | "gradient";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ children, variant = "primary", className = "", disabled, type = "button", ...props }, ref) {
    const base = "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all border active:scale-95 cursor-pointer duration-200";
    const styles: Record<ButtonVariant, string> = {
      primary: "bg-slate-900 text-white border-slate-900 hover:bg-slate-800 shadow-md hover:shadow-lg",
      secondary: "bg-white text-slate-900 border-slate-200 hover:bg-slate-50 shadow-sm",
      danger: "bg-rose-600 text-white border-rose-600 hover:bg-rose-500 shadow-md",
      ghost: "bg-transparent text-slate-500 border-transparent hover:bg-slate-100 hover:text-slate-900",
      brand: "bg-[#6b8aae] text-white border-[#6b8aae] hover:bg-[#7d9abc] shadow-md hover:shadow-lg",
      outlineDark: "bg-zinc-900/80 text-white border border-zinc-600 hover:bg-zinc-800 hover:border-zinc-500",
      gradient: "bg-gradient-to-r from-purple-600 via-violet-500 to-blue-500 text-white border-0 hover:from-purple-500 hover:via-violet-400 hover:to-blue-400 shadow-lg",
    };
    const dis = disabled ? "opacity-50 pointer-events-none" : "";
    return (
      <button 
        ref={ref}
        type={type}
        disabled={disabled}
        className={`${base} ${styles[variant]} ${dis} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export function SmallButton({
  children,
  onClick,
  variant = "secondary",
  disabled,
}: {
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: ButtonVariant;
  disabled?: boolean;
}) {
  return (
    <Button variant={variant} onClick={onClick} disabled={disabled} className="px-2 py-1 text-xs">
      {children}
    </Button>
  );
}

export function Card({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>{children}</div>;
}

export function Label({ children }: { children?: React.ReactNode }) {
  return <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{children}</div>;
}

export function Input({
  value,
  onChange,
  placeholder,
  label,
  labelClassName = "text-slate-500",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
  labelClassName?: string;
  className?: string;
}) {
  return (
    <div className="w-full">
      {label && <label className={`block text-xs font-bold uppercase mb-1 ${labelClassName}`}>{label}</label>}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={true}
        className={`w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all ${className}`}
      />
    </div>
  );
}

export function TextArea({
  value,
  onChange,
  onKeyDown,
  placeholder,
  label,
  rows = 4,
  labelClassName = "text-slate-500",
  className = "",
  autoResize = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  label?: string;
  rows?: number;
  labelClassName?: string;
  className?: string;
  autoResize?: boolean;
}) {
  const ref = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (autoResize && ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value, autoResize]);

  return (
    <div className="w-full">
      {label && <label className={`block text-xs font-bold uppercase mb-1 ${labelClassName}`}>{label}</label>}
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        rows={rows}
        spellCheck={true}
        className={`w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all ${autoResize ? 'resize-none overflow-hidden' : 'resize-none'} ${className}`}
      />
    </div>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <div className="text-3xl font-black text-slate-900 tracking-tight">{title}</div>
      {subtitle ? <div className="text-sm font-medium text-slate-500 mt-1">{subtitle}</div> : null}
    </div>
  );
}

export function Avatar({ src, name }: { src: string; name: string }) {
  if (src) {
    return <img src={src} alt={name} className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-sm" />;
  }
  const letter = (name || "?").trim().slice(0, 1).toUpperCase();
  return (
    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-lg font-black italic text-white/30">
      {letter}
    </div>
  );
}
