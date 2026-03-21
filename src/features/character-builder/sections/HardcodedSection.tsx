import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface HardcodedSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  collapsedContent: React.ReactNode;
}

export const HardcodedSection: React.FC<HardcodedSectionProps> = ({
  title,
  isExpanded,
  onToggle,
  children,
  collapsedContent,
}) => (
  <div className="w-full bg-[#2a2a2f] rounded-[24px] overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]">
    <div className="relative bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-3 flex items-center justify-between shadow-lg">
      <div
        className="absolute inset-0 bg-gradient-to-b from-white/[0.07] via-transparent to-transparent pointer-events-none"
        style={{ backgroundSize: '100% 60%', backgroundRepeat: 'no-repeat' }}
      />
      <h2 className="text-white text-xl font-bold tracking-[-0.015em] relative z-[1]">{title}</h2>
      <button
        onClick={onToggle}
        className="text-white/70 hover:text-white transition-colors p-1 rounded-md hover:bg-ghost-white relative z-[1]"
      >
        {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
      </button>
    </div>
    <div className="p-5">
      <div className="p-5 pb-6 bg-[#2e2e33] rounded-2xl shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
        {isExpanded ? <div className="space-y-4">{children}</div> : collapsedContent}
      </div>
    </div>
  </div>
);
