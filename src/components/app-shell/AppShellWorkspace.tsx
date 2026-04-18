import React from "react";

interface AppShellWorkspaceProps {
  children: React.ReactNode;
}

export function AppShellWorkspace({ children }: AppShellWorkspaceProps) {
  return (
    <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
      {children}
    </div>
  );
}
