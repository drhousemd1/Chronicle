import React from "react";

interface AppShellHeaderProps {
  visible: boolean;
  leftContent: React.ReactNode;
  rightContent?: React.ReactNode;
}

export function AppShellHeader({ visible, leftContent, rightContent }: AppShellHeaderProps) {
  if (!visible) return null;

  return (
    <header className="flex flex-shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-[rgba(248,250,252,0.3)] px-4 py-3 shadow-sm lg:px-8">
      <div className="flex min-w-0 flex-wrap items-center gap-4">
        {leftContent}
      </div>
      <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
        {rightContent}
      </div>
    </header>
  );
}
