import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

/* ═══════════════════════ TYPES ═══════════════════════ */

export interface ChooserOption {
  key: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  /** Tailwind border-color on hover, e.g. "blue-500" */
  hoverColor?: string;
}

export interface ChooserModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  options: ChooserOption[];
  onSelect: (key: string) => void;
  /** Grid columns — 2 (default) or 3 */
  columns?: 2 | 3;
}

/* ═══════════════════════ HOVER COLOR MAP ═══════════════════════ */

const hoverBorderMap: Record<string, string> = {
  'blue-500': 'hover:border-blue-500',
  'purple-500': 'hover:border-purple-500',
  'rose-500': 'hover:border-rose-500',
  'emerald-500': 'hover:border-emerald-500',
  'indigo-500': 'hover:border-indigo-500',
  'amber-500': 'hover:border-amber-500',
};

/* ═══════════════════════ COMPONENT ═══════════════════════ */

export const ChooserModal: React.FC<ChooserModalProps> = ({
  open,
  onClose,
  title,
  options,
  onSelect,
  columns = 2,
}) => {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className={`${columns === 3 ? 'sm:max-w-[680px]' : 'sm:max-w-[520px]'} bg-[#2a2a2f] border-0 rounded-[24px] p-0 gap-0 shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)] overflow-hidden [&>button]:hidden`}
      >
        {/* ── Slate-blue header (exact builder-container spec) ── */}
        <div className="relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-3 flex items-center gap-3 shadow-lg">
          <div
            className="absolute inset-0 z-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40 pointer-events-none"
            style={{ height: '60%' }}
          />
          <h3 className="text-white text-xl font-bold tracking-[-0.015em] relative z-[1]">
            {title}
          </h3>
        </div>

        {/* ── Option cards ── */}
        <div className={`p-4 grid ${columns === 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
          {options.map((opt) => {
            const hoverCls = hoverBorderMap[opt.hoverColor ?? 'blue-500'] ?? 'hover:border-blue-500';
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  onSelect(opt.key);
                  onClose();
                }}
                className={`group flex flex-col items-center text-center rounded-2xl bg-[#2e2e33] border-2 border-transparent py-5 px-4 gap-3 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)] ${hoverCls} transition-all cursor-pointer`}
              >
                <div className="w-12 h-12 rounded-[14px] bg-[#1c1c1f] border-t border-black/35 shadow-[inset_0_2px_6px_rgba(0,0,0,0.40)] flex items-center justify-center">
                  {opt.icon}
                </div>
                <div className="text-white text-sm font-extrabold">{opt.label}</div>
                <p className="text-zinc-400 text-xs leading-relaxed">{opt.description}</p>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
