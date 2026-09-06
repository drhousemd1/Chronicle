import type { ReactNode } from "react";
import type { ChronicleCapabilityId } from "@/data/chronicle-knowledge-base/capability-ids";
import type { AdminToolSectionId } from "@/data/chronicle-knowledge-base/admin-tool-ids";

import { RepositoryGraphView } from "./RepositoryGraphView";

type CapabilityArchitectureProps = {
  capabilityId: ChronicleCapabilityId | AdminToolSectionId;
  capabilityLabel: string;
  preferredSourcePath?: string;
  sourceOwner: string;
  children: ReactNode;
};

/**
 * One shared presentation boundary for capability architecture. The graph is
 * an extracted reading aid; the Markdown child remains the factual authority.
 */
export function CapabilityArchitecture({
  capabilityId,
  capabilityLabel,
  preferredSourcePath,
  sourceOwner,
  children,
}: CapabilityArchitectureProps) {
  return (
    <div className="knowledge-architecture-source" data-source-owner={sourceOwner}>
      <RepositoryGraphView
        mode="capability"
        capabilityId={capabilityId}
        capabilityLabel={capabilityLabel}
        preferredSourcePath={preferredSourcePath}
      />
      <div className="knowledge-architecture-source__manual">{children}</div>
    </div>
  );
}
