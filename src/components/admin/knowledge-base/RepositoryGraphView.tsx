import { useEffect, useId, useMemo, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Link } from "react-router-dom";

import type { ChronicleCapabilityId } from "@/data/chronicle-knowledge-base/capability-ids";
import type { AdminToolSectionId } from "@/data/chronicle-knowledge-base/admin-tool-ids";
import type { ChangelogRegistryLoader } from "@/data/chronicle-knowledge-base/changelog-record-sources";
import { buildKnowledgeBaseTabHref } from "@/data/chronicle-knowledge-base/knowledge-routes";
import {
  loadRepositoryGraphView,
  type RepositoryGraphViewPayload,
} from "@/data/chronicle-knowledge-base/repository-graph-client";
import {
  buildChronicleAreaCommunityPresentation,
  buildChronicleGraphPresentation,
  type ChronicleAreaCommunityConnection,
  type ChronicleAreaCommunityNode,
  type ChronicleGraphArea,
} from "@/data/chronicle-knowledge-base/repository-graph-presentation";

import { ChangelogHistorianView } from "./ChangelogHistorianView";

export type RepositoryGraphMode = "global" | "capability";
export type RepositoryGraphInitialView =
  | "chronicle-areas"
  | "repository-tree"
  | "dependency-graph"
  | "community-overview"
  | "recorded-history";

type RepositoryGraphViewProps = {
  mode?: RepositoryGraphMode;
  capabilityId: ChronicleCapabilityId | AdminToolSectionId | null;
  capabilityLabel: string;
  preferredSourcePath?: string;
  initialView?: RepositoryGraphInitialView;
  localGraphAvailable?: boolean;
  historianLoader?: ChangelogRegistryLoader;
};

type SourceSummary = {
  path: string;
  nodeIds: string[];
  communityIds: string[];
  core: boolean;
  context: boolean;
};

type SourceConnection = {
  path: string;
  incoming: number;
  outgoing: number;
  incomingRelations: string[];
  outgoingRelations: string[];
  core: boolean;
};

const relationshipTerms: Record<string, { label: string; meaning: string }> = {
  calls: { label: "Calls", meaning: "One code item invokes another." },
  contains: { label: "Contains", meaning: "A file or code item contains another extracted item." },
  imports: { label: "Imports", meaning: "One source loads exports from another source." },
  imports_from: { label: "Imports from", meaning: "One source names another source as the origin of an import." },
  references: { label: "References", meaning: "One code item refers to another without proving that it runs." },
  indirect_call: { label: "Calls indirectly", meaning: "The extractor found a call through an intermediate reference." },
  dynamic_import: { label: "Loads dynamically", meaning: "A source is loaded at runtime through a dynamic import." },
  re_exports: { label: "Re-exports", meaning: "One source makes another source's export available again." },
  method: { label: "Defines a method", meaning: "The extracted item is associated with a method definition." },
  extends: { label: "Extends", meaning: "One code definition builds on another definition." },
  reads_from: { label: "Reads from", meaning: "One source reads data supplied by another source or schema item." },
  rationale_for: { label: "Explains", meaning: "A documentation item records the reason for another item." },
  inherits: { label: "Inherits from", meaning: "One code definition receives behavior from another definition." },
  cites: { label: "Cites", meaning: "A documentation item points to another source as evidence or context." },
};

function relationshipTerm(raw: string) {
  const key = raw.trim().toLowerCase();
  const known = relationshipTerms[key];
  if (known) return { raw, ...known };
  const label = key
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (character: string) => character.toUpperCase());
  return {
    raw,
    label: label || "Extracted relationship",
    meaning: "Graphify extracted this structural relationship from the source.",
  };
}

function sourceSummaries(payload: RepositoryGraphViewPayload) {
  const coreIds = new Set(payload.capability?.coreNodeIds ?? payload.nodes.map((node) => node.id));
  const contextIds = new Set(payload.capability?.contextNodeIds ?? []);
  const byPath = new Map<string, SourceSummary>();
  for (const node of payload.nodes) {
    const summary = byPath.get(node.sourcePath) ?? {
      path: node.sourcePath,
      nodeIds: [],
      communityIds: [],
      core: false,
      context: false,
    };
    summary.nodeIds.push(node.id);
    summary.core ||= coreIds.has(node.id);
    summary.context ||= contextIds.has(node.id);
    summary.communityIds.push(...node.communityIds);
    byPath.set(node.sourcePath, summary);
  }
  return [...byPath.values()]
    .map((summary) => ({
      ...summary,
      nodeIds: [...new Set(summary.nodeIds)].sort(),
      communityIds: [...new Set(summary.communityIds)].sort(),
    }))
    .sort((left, right) => Number(right.core) - Number(left.core) || left.path.localeCompare(right.path));
}

function sourceConnections(payload: RepositoryGraphViewPayload, selectedPath: string) {
  const nodePath = new Map(payload.nodes.map((node) => [node.id, node.sourcePath]));
  const coreIds = new Set(payload.capability?.coreNodeIds ?? payload.nodes.map((node) => node.id));
  const summaries = new Map<string, SourceConnection>();
  for (const edge of payload.edges) {
    const sourcePath = nodePath.get(edge.source);
    const targetPath = nodePath.get(edge.target);
    if (!sourcePath || !targetPath || sourcePath === targetPath) continue;
    if (sourcePath !== selectedPath && targetPath !== selectedPath) continue;
    const otherPath = sourcePath === selectedPath ? targetPath : sourcePath;
    const summary = summaries.get(otherPath) ?? {
      path: otherPath,
      incoming: 0,
      outgoing: 0,
      incomingRelations: [],
      outgoingRelations: [],
      core: false,
    };
    if (sourcePath === selectedPath) {
      summary.outgoing += 1;
      summary.outgoingRelations.push(edge.relation);
    }
    if (targetPath === selectedPath) {
      summary.incoming += 1;
      summary.incomingRelations.push(edge.relation);
    }
    const otherNodeId = sourcePath === selectedPath ? edge.target : edge.source;
    summary.core ||= coreIds.has(otherNodeId);
    summaries.set(otherPath, summary);
  }
  return [...summaries.values()]
    .map((summary) => ({
      ...summary,
      incomingRelations: [...new Set(summary.incomingRelations)].sort(),
      outgoingRelations: [...new Set(summary.outgoingRelations)].sort(),
    }))
    .sort((left, right) =>
      Number(right.core) - Number(left.core) ||
      right.incoming + right.outgoing - (left.incoming + left.outgoing) ||
      left.path.localeCompare(right.path),
    );
}

function connectionDirection(connection: SourceConnection) {
  const outgoing = connection.outgoing === 1 ? "1 extracted relationship" : `${connection.outgoing} extracted relationships`;
  const incoming = connection.incoming === 1 ? "1 extracted relationship" : `${connection.incoming} extracted relationships`;
  const outgoingTypes = connection.outgoingRelations.map((relation) => relationshipTerm(relation).label).join(", ");
  const incomingTypes = connection.incomingRelations.map((relation) => relationshipTerm(relation).label).join(", ");
  if (connection.outgoing > 0 && connection.incoming > 0) {
    return `The selected source points here through ${outgoing}: ${outgoingTypes}. This source points back through ${incoming}: ${incomingTypes}.`;
  }
  if (connection.outgoing > 0) return `The selected source points here through ${outgoing}: ${outgoingTypes}.`;
  return `This source points into the selected source through ${incoming}: ${incomingTypes}.`;
}

function stateCopy(payload: RepositoryGraphViewPayload) {
  if (payload.state === "ready-current") return ["Current map", "This map matches the recorded Chronicle source state."] as const;
  if (payload.state === "ready-stale") {
    const knownReasons: Record<string, string> = {
      "source corpus changed": "source files changed",
      "corpus policy changed": "the list of files allowed into the map changed",
      "capability lens policy changed": "capability mapping instructions changed",
      "repository HEAD changed": "the checked-out revision changed",
      "source dirty state changed": "the checkout changed between clean and edited",
    };
    const reasons = payload.reasons.map((reason) => knownReasons[reason] ?? "a verified source condition changed");
    return ["Older map", `Chronicle changed after this map was built${reasons.length ? `: ${reasons.join(", ")}.` : "."} Relationship data stays hidden until the private map is refreshed.`] as const;
  }
  if (payload.state === "refreshing") return ["Map updating", "Chronicle is rebuilding the private map. It will appear automatically when ready."] as const;
  if (payload.state === "error") return ["Map needs attention", payload.reasons.length ? payload.reasons.join("; ") : "The local graph could not be prepared. Current relationship data is unavailable."] as const;
  return ["Map unavailable", "No private repository map has been generated for this checkout."] as const;
}

function SourceConnectionList({ connections, onSelect }: { connections: SourceConnection[]; onSelect: (path: string) => void }) {
  return (
    <div className="repository-graph-connections">
      <h4>All connected sources</h4>
      <p>This is the complete extracted connection list for the selected source, not a claim that every connection ran successfully.</p>
      {connections.length === 0 ? <p>No cross-file relationship was extracted for this source.</p> : (
        <ul>
          {connections.map((connection) => (
            <li key={connection.path}>
              <button type="button" onClick={() => onSelect(connection.path)}>{connection.path}</button>
              <span>{connectionDirection(connection)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RelationshipDiagram({
  selected,
  connections,
  onSelect,
}: {
  selected: string;
  connections: SourceConnection[];
  onSelect: (path: string) => void;
}) {
  const markerPrefix = useId().replace(/:/g, "");
  const outgoingMarkerId = `${markerPrefix}-outgoing`;
  const incomingMarkerId = `${markerPrefix}-incoming`;
  const visible = connections.slice(0, 8);
  const positions = visible.map((_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / Math.max(visible.length, 1);
    return { x: 50 + Math.cos(angle) * 39, y: 50 + Math.sin(angle) * 37 };
  });

  return (
    <>
      <div className="repository-graph-diagram" aria-label={`Files connected to ${selected}`}>
        <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
          <defs>
            <marker id={outgoingMarkerId} markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L5,2.5 L0,5 Z" className="repository-graph-diagram__arrow repository-graph-diagram__arrow--out" />
            </marker>
            <marker id={incomingMarkerId} markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L5,2.5 L0,5 Z" className="repository-graph-diagram__arrow repository-graph-diagram__arrow--in" />
            </marker>
          </defs>
          {positions.map((position, index) => (
            <g key={visible[index].path}>
              {visible[index].outgoing > 0 ? <line x1="50" y1="50" x2={position.x} y2={position.y} markerEnd={`url(#${outgoingMarkerId})`} className="repository-graph-diagram__line repository-graph-diagram__line--out" /> : null}
              {visible[index].incoming > 0 ? <line x1={position.x} y1={position.y} x2="50" y2="50" markerEnd={`url(#${incomingMarkerId})`} className="repository-graph-diagram__line repository-graph-diagram__line--in" /> : null}
            </g>
          ))}
        </svg>
        <button type="button" className="repository-graph-node repository-graph-node--selected" onClick={() => onSelect(selected)}>
          <span>Selected source</span>
          <strong>{selected}</strong>
        </button>
        {visible.map((connection, index) => (
          <button
            key={connection.path}
            type="button"
            className={`repository-graph-node${connection.core ? " repository-graph-node--core" : ""}`}
            style={{ left: `${positions[index].x}%`, top: `${positions[index].y}%` }}
            onClick={() => onSelect(connection.path)}
          >
            <span>{connection.outgoing > 0 && connection.incoming > 0 ? "Both directions" : connection.outgoing > 0 ? "Selected points here" : "Points to selected"}</span>
            <strong>{connection.path}</strong>
          </button>
        ))}
      </div>
      <p className="repository-graph-direction-key">
        <span><i className="repository-graph-direction-key__out" /> Solid blue points from the selected source to another source.</span>
        <span><i className="repository-graph-direction-key__in" /> Dashed purple points from another source into the selected source.</span>
      </p>
      <SourceConnectionList connections={connections} onSelect={onSelect} />
    </>
  );
}

const globalViewOptions: readonly [RepositoryGraphInitialView, string][] = [
  ["chronicle-areas", "Chronicle Areas"],
  ["repository-tree", "Repository Tree"],
  ["dependency-graph", "Dependency Graph"],
  ["community-overview", "Community Overview"],
  ["recorded-history", "Recorded History"],
];

function areaPositions(areas: readonly ChronicleGraphArea[]) {
  return new Map(areas.map((area, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / Math.max(areas.length, 1);
    const radius = index % 2 === 0 ? 38 : 30;
    return [area.id, { x: 50 + Math.cos(angle) * radius, y: 50 + Math.sin(angle) * radius }] as const;
  }));
}

function communityPositions(communities: readonly ChronicleAreaCommunityNode[]) {
  if (communities.length === 1) return new Map([[communities[0].id, { x: 50, y: 48 }]]);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  return new Map(communities.map((community, index) => {
    const radius = Math.min(40, 9 + Math.sqrt(index + 0.5) * 10.5);
    const angle = index * goldenAngle - Math.PI / 2;
    return [community.id, {
      x: Math.max(9, Math.min(91, 50 + Math.cos(angle) * radius)),
      y: Math.max(11, Math.min(89, 48 + Math.sin(angle) * radius * 0.84)),
    }] as const;
  }));
}

function connectedCommunityPreview(
  communities: readonly ChronicleAreaCommunityNode[],
  connections: readonly ChronicleAreaCommunityConnection[],
  limit = 12,
) {
  if (communities.length === 0 || limit <= 0) return [];

  const selected = [communities[0]];
  const selectedIds = new Set([communities[0].id]);

  while (selected.length < limit) {
    const next = communities.find((community) => {
      if (selectedIds.has(community.id)) return false;
      return connections.some((connection) => (
        (selectedIds.has(connection.sourceCommunityId) && connection.targetCommunityId === community.id)
        || (selectedIds.has(connection.targetCommunityId) && connection.sourceCommunityId === community.id)
      ));
    });
    if (!next) break;
    selected.push(next);
    selectedIds.add(next.id);
  }

  return selected;
}

function communityNodeSize(community: ChronicleAreaCommunityNode, maximum: number) {
  const ratio = Math.sqrt(community.areaNodeCount / Math.max(maximum, 1));
  return Math.round(30 + ratio * 35);
}

function readableSourceName(sourcePath: string | null | undefined) {
  if (!sourcePath) return "Not represented in the current graph";
  const filename = sourcePath.split("/").at(-1)?.replace(/\.[^./]+$/, "") ?? sourcePath;
  return filename
    .replace(/[-_]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function readableCommunityName(label: string) {
  return label
    .split("/")
    .map((part) => readableSourceName(part.trim()))
    .filter(Boolean)
    .join(" · ");
}

function moveNetworkFocus(event: ReactKeyboardEvent<HTMLButtonElement>) {
  const direction = event.key === "ArrowRight" || event.key === "ArrowDown"
    ? 1
    : event.key === "ArrowLeft" || event.key === "ArrowUp"
      ? -1
      : 0;
  const stage = event.currentTarget.closest('[data-map-stage="true"]');
  const items = stage ? [...stage.querySelectorAll<HTMLButtonElement>('[data-map-item="true"]')] : [];
  const currentIndex = items.indexOf(event.currentTarget);
  let nextIndex = currentIndex;
  if (event.key === "Home") nextIndex = 0;
  else if (event.key === "End") nextIndex = items.length - 1;
  else if (direction) nextIndex = (currentIndex + direction + items.length) % items.length;
  else return;
  event.preventDefault();
  items[nextIndex]?.focus();
}

function ChronicleAreasView({ payload }: { payload: RepositoryGraphViewPayload }) {
  const presentation = useMemo(
    () => buildChronicleGraphPresentation(payload.nodes, payload.edges, payload.communities),
    [payload],
  );
  const [selectedAreaId, setSelectedAreaId] = useState(
    presentation.areas.find((area) => area.id === "story-builder")?.id ?? presentation.areas[0]?.id ?? "",
  );
  const [areaQuery, setAreaQuery] = useState("");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedCommunityId, setSelectedCommunityId] = useState("");
  const selectedArea = presentation.areas.find((area) => area.id === selectedAreaId);
  const areaCommunityPresentation = useMemo(
    () => selectedArea
      ? buildChronicleAreaCommunityPresentation(
        selectedArea.id,
        payload.nodes,
        payload.edges,
        payload.communities,
        presentation.nodeAreaIds,
      )
      : { communities: [], connections: [] },
    [payload, presentation.nodeAreaIds, selectedArea],
  );
  const normalizedQuery = areaQuery.trim().toLowerCase();
  const filteredAreas = !selectedArea && normalizedQuery
    ? presentation.areas.filter((area) => `${area.label} ${area.description}`.toLowerCase().includes(normalizedQuery))
    : presentation.areas;
  const matchingCommunities = selectedArea
    ? areaCommunityPresentation.communities.filter((community) => !normalizedQuery || `${community.label} ${community.exampleSourcePaths.join(" ")}`.toLowerCase().includes(normalizedQuery))
    : [];
  const visibleCommunities = matchingCommunities.slice(0, 24);
  const selectedCommunity = areaCommunityPresentation.communities.find((community) => community.id === selectedCommunityId);
  const mapItems = selectedArea ? visibleCommunities : filteredAreas;
  const positions = useMemo(
    () => selectedArea ? communityPositions(visibleCommunities) : areaPositions(filteredAreas),
    [filteredAreas, selectedArea, visibleCommunities],
  );
  const visibleIds = new Set(mapItems.map((item) => item.id));
  const selectedConnections = presentation.connections.filter((connection) =>
    connection.sourceAreaId === selectedArea?.id || connection.targetAreaId === selectedArea?.id,
  );
  const areaConnections = presentation.connections.filter((connection) =>
    visibleIds.has(connection.sourceAreaId) && visibleIds.has(connection.targetAreaId),
  );
  const communityConnections = areaCommunityPresentation.connections.filter((connection) =>
    visibleIds.has(connection.sourceCommunityId) && visibleIds.has(connection.targetCommunityId),
  );
  const maximumCommunityNodeCount = Math.max(...visibleCommunities.map((community) => community.areaNodeCount), 1);

  const selectArea = (areaId: string) => {
    setSelectedAreaId(areaId);
    setSelectedCommunityId("");
    setAreaQuery("");
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="chronicle-area-explorer">
      <header className="chronicle-area-explorer__summary">
        <div>
          <h3>Chronicle Areas</h3>
          <p>Product-page ownership layered over Graphify's extracted structural communities.</p>
        </div>
        <dl>
          <div><dt>Chronicle areas</dt><dd>{presentation.areas.length.toLocaleString()}</dd></div>
          <div><dt>Extracted items</dt><dd>{payload.nodes.length.toLocaleString()}</dd></div>
          <div><dt>Directed links</dt><dd>{payload.edges.length.toLocaleString()}</dd></div>
          <div><dt>Graphify communities</dt><dd>{payload.communities.length.toLocaleString()}</dd></div>
        </dl>
      </header>

      <aside className="chronicle-area-explorer__list" aria-label="Chronicle product areas">
        <p className="chronicle-area-explorer__rail-heading">Chronicle areas</p>
        <button type="button" className={!selectedAreaId ? "is-selected" : ""} onClick={() => selectArea("")}>
          <i style={{ backgroundColor: "#f4f4f5" }} />
          <span>All Chronicle Areas</span>
          <strong>{presentation.areas.length}</strong>
        </button>
        {filteredAreas.map((area) => (
          <button
            key={area.id}
            type="button"
            className={selectedArea?.id === area.id ? "is-selected" : ""}
            aria-pressed={selectedArea?.id === area.id}
            onClick={() => selectArea(area.id)}
          >
            <i style={{ backgroundColor: area.color }} />
            <span>{area.label}</span>
            <strong>{area.coverageNote ? "Isolated" : area.nodeCount.toLocaleString()}</strong>
          </button>
        ))}
        {filteredAreas.length === 0 ? <p>No Chronicle area matches this search.</p> : null}
      </aside>

      <div className="chronicle-area-explorer__map-column">
        <div className="chronicle-area-explorer__map-toolbar">
          <button type="button" onClick={() => selectArea("")} disabled={!selectedArea}>← All areas</button>
          <input
            aria-label={selectedArea ? "Filter structural communities or source files" : "Filter Chronicle areas"}
            value={areaQuery}
            onChange={(event) => setAreaQuery(event.target.value)}
            placeholder={selectedArea ? "Filter communities or source files…" : "Filter Chronicle areas…"}
          />
          <span>{selectedArea ? `${selectedArea.label} · Graphify communities` : "Area relationships"}</span>
        </div>
        <div className="chronicle-area-explorer__map" aria-label="Chronicle area relationship map">
          <div className="chronicle-area-explorer__map-stage" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }} data-map-stage="true">
            <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
              {(selectedArea ? communityConnections : areaConnections).map((connection) => {
                const sourceId = "sourceCommunityId" in connection ? connection.sourceCommunityId : connection.sourceAreaId;
                const targetId = "targetCommunityId" in connection ? connection.targetCommunityId : connection.targetAreaId;
                const source = positions.get(sourceId);
                const target = positions.get(targetId);
                if (!source || !target) return null;
                const weight = Math.max(0.35, Math.min(1.55, 0.35 + Math.log2(connection.count + 1) * 0.22));
                return <line key={`${sourceId}-${targetId}`} x1={source.x} y1={source.y} x2={target.x} y2={target.y} className="is-active" style={{ strokeWidth: weight }} />;
              })}
            </svg>
            {selectedArea ? visibleCommunities.map((community) => {
              const position = positions.get(community.id);
              if (!position) return null;
              const nodeStyle = {
                left: `${position.x}%`,
                top: `${position.y}%`,
                "--chronicle-node-color": selectedArea.color,
                "--chronicle-node-size": `${communityNodeSize(community, maximumCommunityNodeCount)}px`,
              } as CSSProperties;
              return (
                <button
                  key={community.id}
                  type="button"
                  className={`chronicle-area-explorer__network-node${selectedCommunity?.id === community.id ? " is-selected" : ""}`}
                  aria-pressed={selectedCommunity?.id === community.id}
                  aria-label={`${community.label}, ${community.areaNodeCount} ${selectedArea.label} items, ${community.totalNodeCount} total items`}
                  data-node-kind="structural-community"
                  data-map-item="true"
                  style={nodeStyle}
                  onClick={() => setSelectedCommunityId(community.id)}
                  onKeyDown={moveNetworkFocus}
                >
                  <i />
                  <span>{community.label}</span>
                  <small>{community.areaNodeCount} area items · {community.totalNodeCount} total</small>
                </button>
              );
            }) : filteredAreas.map((area) => {
              const position = positions.get(area.id);
              if (!position) return null;
              const nodeStyle = {
                left: `${position.x}%`,
                top: `${position.y}%`,
                "--chronicle-node-color": area.color,
                "--chronicle-node-size": `${Math.max(42, Math.min(76, 42 + Math.sqrt(Math.max(area.nodeCount, 1)) * 1.1))}px`,
              } as CSSProperties;
              return (
                <button
                  key={area.id}
                  type="button"
                  className="chronicle-area-explorer__network-node"
                  aria-label={`${area.label}, ${area.nodeCount} extracted items`}
                  data-node-kind="chronicle-area"
                  data-map-item="true"
                  style={nodeStyle}
                  onClick={() => selectArea(area.id)}
                  onKeyDown={moveNetworkFocus}
                >
                  <i />
                  <span>{area.label}</span>
                  <small>{area.coverageNote ? "Preserved reference" : `${area.nodeCount} items`}</small>
                </button>
              );
            })}
            {mapItems.length === 0 ? <p className="chronicle-area-explorer__map-empty">No map item matches this search.</p> : null}
          </div>
          <div className="chronicle-area-explorer__map-controls" aria-label="Map navigation controls">
            <div>
              <button type="button" onClick={() => setPan((value) => ({ ...value, y: value.y - 28 }))} aria-label="Pan up">↑</button>
              <button type="button" onClick={() => setPan((value) => ({ ...value, x: value.x - 28 }))} aria-label="Pan left">←</button>
              <button type="button" onClick={() => setPan((value) => ({ ...value, y: value.y + 28 }))} aria-label="Pan down">↓</button>
              <button type="button" onClick={() => setPan((value) => ({ ...value, x: value.x + 28 }))} aria-label="Pan right">→</button>
            </div>
            <div>
              <button type="button" onClick={() => setZoom((value) => Math.max(0.72, Number((value - 0.12).toFixed(2))))} aria-label="Zoom out">−</button>
              <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} aria-label="Reset map">⌂</button>
              <button type="button" onClick={() => setZoom((value) => Math.min(1.45, Number((value + 0.12).toFixed(2))))} aria-label="Zoom in">+</button>
            </div>
          </div>
        </div>
        <p className="chronicle-area-explorer__map-note">
          {selectedArea
            ? `Showing ${visibleCommunities.length} of ${matchingCommunities.length} matching structural communities inside ${selectedArea.label}. Circle size reflects this area's extracted items; line weight reflects directed links between communities.`
            : "Chronicle-authored areas organize the view. Circle size reflects extracted items; line weight reflects directed relationships between areas."}
        </p>
      </div>

      <aside className="chronicle-area-explorer__details" aria-live="polite">
        {selectedArea && selectedCommunity ? (
          <>
            <button type="button" className="chronicle-area-explorer__details-back" onClick={() => setSelectedCommunityId("")}>← {selectedArea.label}</button>
            <p className="repository-graph-view__eyebrow">Graphify structural community</p>
            <h3 style={{ color: selectedArea.color }}>{selectedCommunity.label}</h3>
            <p>This source-backed cluster contains code that Graphify found to be densely connected. It is evidence inside the Chronicle-authored {selectedArea.label} area, not a product area of its own.</p>
            <p className="chronicle-area-explorer__graphify-label"><strong>Graphify cluster label:</strong> {selectedCommunity.graphifyLabel}</p>
            <dl>
              <div><dt>{selectedArea.label} items</dt><dd>{selectedCommunity.areaNodeCount.toLocaleString()}</dd></div>
              <div><dt>Total items</dt><dd>{selectedCommunity.totalNodeCount.toLocaleString()}</dd></div>
              <div><dt>Source files</dt><dd>{selectedCommunity.sourceCount.toLocaleString()}</dd></div>
            </dl>
            <h4>Example source files</h4>
            <ul>{selectedCommunity.exampleSourcePaths.map((path) => <li key={path}><code>{path}</code></li>)}</ul>
            <h4>Extracted relationship evidence</h4>
            {selectedCommunity.relationshipEvidence.length ? (
              <ul>
                {selectedCommunity.relationshipEvidence.map((evidence) => {
                  const relationship = relationshipTerms[evidence.relation.toLowerCase()];
                  return (
                    <li key={`${evidence.direction}-${evidence.relation}-${evidence.sourcePath}-${evidence.sourceLocation ?? ""}`}>
                      <code>{evidence.sourcePath}{evidence.sourceLocation ? ` ${evidence.sourceLocation}` : ""}</code>
                      <span>{evidence.direction} · {relationship?.label ?? evidence.relation} · origin {evidence.origin} · confidence {evidence.confidence} ({evidence.confidenceScore === null ? "not scored" : evidence.confidenceScore.toFixed(2)}) · {evidence.count} link{evidence.count === 1 ? "" : "s"}</span>
                    </li>
                  );
                })}
              </ul>
            ) : <p>No extracted edge touches this community in the current graph.</p>}
          </>
        ) : selectedArea ? (
          <>
            <p className="repository-graph-view__eyebrow">Chronicle-authored area</p>
            <h3 style={{ color: selectedArea.color }}>{selectedArea.label}</h3>
            <p>{selectedArea.description}</p>
            {selectedArea.coverageNote ? <p className="chronicle-area-explorer__coverage-note"><strong>Coverage boundary:</strong> {selectedArea.coverageNote}</p> : null}
            <dl>
              <div><dt>Extracted items</dt><dd>{selectedArea.coverageNote ? "Not included" : selectedArea.nodeCount.toLocaleString()}</dd></div>
              <div><dt>Source files</dt><dd>{selectedArea.coverageNote ? "Not included" : selectedArea.sourceCount.toLocaleString()}</dd></div>
              <div><dt>Structural groups</dt><dd>{selectedArea.coverageNote ? "Not included" : selectedArea.communityCount.toLocaleString()}</dd></div>
            </dl>
            <h4>Repository evidence</h4>
            <ul>{(selectedArea.coverageNote ? selectedArea.evidence : selectedArea.topSourcePaths).map((path) => <li key={path}><code>{path}</code></li>)}</ul>
            <h4>Matched Chronicle rules</h4>
            {selectedArea.matchedRules.length ? (
              <ul>{selectedArea.matchedRules.map((rule) => <li key={rule.label}>{rule.label}<span>{rule.count.toLocaleString()} extracted items</span></li>)}</ul>
            ) : <p>{selectedArea.coverageNote ? "This preserved area is intentionally outside the production graph corpus." : "No Chronicle area rule matched extracted items."}</p>}
            <h4>Strongest cross-area connections</h4>
            {selectedConnections.length ? (
              <ul>
                {selectedConnections.slice(0, 8).map((connection) => {
                  const otherId = connection.sourceAreaId === selectedArea.id ? connection.targetAreaId : connection.sourceAreaId;
                  const other = presentation.areas.find((area) => area.id === otherId);
                  const source = presentation.areas.find((area) => area.id === connection.sourceAreaId)?.label ?? connection.sourceAreaId;
                  const target = presentation.areas.find((area) => area.id === connection.targetAreaId)?.label ?? connection.targetAreaId;
                  return <li key={`${connection.sourceAreaId}-${connection.targetAreaId}`}><button type="button" onClick={() => setSelectedAreaId(otherId)}>{other?.label ?? otherId}</button><span>{source} → {target} · {connection.count} directed links</span></li>;
                })}
              </ul>
            ) : <p>No cross-area relationship was extracted.</p>}
          </>
        ) : (
          <>
            <p className="repository-graph-view__eyebrow">How to read this</p>
            <h3>Chronicle product areas</h3>
            <p>Each large node is a recognizable product or structural area. Choose an area to see its responsibility and the source-backed graph evidence underneath it.</p>
            <p>Graphify communities remain a separate structural signal. They are not treated as Chronicle's product taxonomy.</p>
          </>
        )}
      </aside>
    </div>
  );
}

function RepositoryTreeView({ sources, query, onQueryChange, onSelect }: {
  sources: SourceSummary[];
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (path: string) => void;
}) {
  const normalized = query.trim().toLowerCase();
  const filtered = normalized ? sources.filter((source) => source.path.toLowerCase().includes(normalized)) : sources;
  const groups = new Map<string, SourceSummary[]>();
  for (const source of filtered) {
    const parts = source.path.split("/");
    const label = parts.length > 1 ? `${parts[0]}/${parts[1]}` : parts[0];
    const entries = groups.get(label) ?? [];
    entries.push(source);
    groups.set(label, entries);
  }
  return (
    <div className="repository-graph-panel repository-graph-source-inventory">
      <h3>Complete mapped repository tree</h3>
      <p>Every source below comes from the same private current graph. Open a group, then choose a path to inspect its directed dependencies.</p>
      <label className="repository-graph-search">
        <span>Find a source file</span>
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search by repository path" />
      </label>
      {filtered.length === 0 ? <p>No source path matches this search.</p> : (
        <div className="repository-graph-tree">
          {[...groups.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([label, entries]) => (
            <details key={label} open={Boolean(normalized)}>
              <summary>{label}<span>{entries.length} source files</span></summary>
              <ul>{entries.map((source) => (
                <li key={source.path}>
                  <button type="button" onClick={() => onSelect(source.path)}>{source.path}</button>
                  <span>{source.nodeIds.length} extracted items</span>
                </li>
              ))}</ul>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

function CommunityOverview({ payload, sources }: { payload: RepositoryGraphViewPayload; sources: SourceSummary[] }) {
  return (
    <div className="repository-graph-panel repository-graph-groups">
      <h3>Graphify structural communities</h3>
      <p>Graphify groups densely connected code. These are source-backed navigation clusters, not Chronicle product-area definitions.</p>
      {payload.communities.map((community) => {
        const memberIds = new Set(community.nodeIds);
        const paths = sources.filter((source) => source.nodeIds.some((id) => memberIds.has(id))).map((source) => source.path);
        return (
          <article key={community.id}>
            <h4>{community.label}</h4>
            <p>{community.nodeIds.length} extracted items across {paths.length} source files.</p>
            <ul>{paths.map((sourcePath) => <li key={sourcePath}>{sourcePath}</li>)}</ul>
          </article>
        );
      })}
    </div>
  );
}

function CapabilityLens({
  payload,
  capabilityLabel,
  headingId,
}: {
  payload: RepositoryGraphViewPayload;
  capabilityLabel: string;
  headingId: string;
}) {
  const capabilityNodeAreaIds = useMemo(() => {
    const coreNodeIds = new Set(payload.capability?.coreNodeIds ?? payload.nodes.map((node) => node.id));
    return new Map(payload.nodes.filter((node) => coreNodeIds.has(node.id)).map((node) => [node.id, "capability"]));
  }, [payload]);
  const communityPresentation = useMemo(
    () => buildChronicleAreaCommunityPresentation(
      "capability",
      payload.nodes,
      payload.edges,
      payload.communities,
      capabilityNodeAreaIds,
    ),
    [capabilityNodeAreaIds, payload],
  );
  const visibleCommunities = connectedCommunityPreview(
    communityPresentation.communities,
    communityPresentation.connections,
  );
  const visibleCommunityIds = new Set(visibleCommunities.map((community) => community.id));
  const visibleConnections = communityPresentation.connections.filter((connection) =>
    visibleCommunityIds.has(connection.sourceCommunityId) && visibleCommunityIds.has(connection.targetCommunityId),
  );
  const positions = useMemo(() => communityPositions(visibleCommunities), [visibleCommunities]);
  const maximumCommunityNodeCount = Math.max(...visibleCommunities.map((community) => community.areaNodeCount), 1);
  const [selectedCommunityId, setSelectedCommunityId] = useState(visibleCommunities[0]?.id ?? "");
  const [mapZoom, setMapZoom] = useState(1);
  const selectedCommunity = visibleCommunities.find((community) => community.id === selectedCommunityId) ?? visibleCommunities[0];

  return (
    <div className="repository-capability-lens">
      <div className="repository-capability-lens__bar">
        <h2 id={headingId}>{capabilityLabel} architecture map</h2>
        <Link to={`${buildKnowledgeBaseTabHref("chronicle-overview", "overview")}#chronicle-repository-map`}>Open full map</Link>
      </div>

      <section className="repository-capability-map" aria-label={`${capabilityLabel} structural map`}>
          <div className="repository-capability-map__canvas">
            <div className="repository-capability-map__stage" style={{ transform: `scale(${mapZoom})` }} data-map-stage="true">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                {visibleConnections.map((connection) => {
                  const source = positions.get(connection.sourceCommunityId);
                  const target = positions.get(connection.targetCommunityId);
                  if (!source || !target) return null;
                  return <line key={`${connection.sourceCommunityId}-${connection.targetCommunityId}`} data-link-kind="capability-structural-community" data-source-community-id={connection.sourceCommunityId} data-target-community-id={connection.targetCommunityId} x1={source.x} y1={source.y} x2={target.x} y2={target.y} style={{ strokeWidth: Math.max(0.5, Math.min(1.8, 0.45 + Math.log2(connection.count + 1) * 0.28)) }} />;
                })}
              </svg>
              {visibleCommunities.map((community) => {
                const position = positions.get(community.id);
                if (!position) return null;
                const nodeStyle = {
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  "--capability-node-size": `${Math.max(38, communityNodeSize(community, maximumCommunityNodeCount))}px`,
                } as CSSProperties;
                const label = readableCommunityName(community.label);
                return (
                  <button
                    key={community.id}
                    type="button"
                    className={`repository-capability-map__node${selectedCommunity?.id === community.id ? " is-selected" : ""}`}
                    aria-pressed={selectedCommunity?.id === community.id}
                    aria-label={`${label}, ${community.areaNodeCount} capability items`}
                    data-map-item="true"
                    data-node-kind="capability-structural-community"
                    data-community-id={community.id}
                    style={nodeStyle}
                    onClick={() => setSelectedCommunityId(community.id)}
                    onKeyDown={moveNetworkFocus}
                  >
                    <i />
                    <span>{label}</span>
                  </button>
                );
              })}
              {!visibleCommunities.length ? <p className="repository-capability-map__empty">No structural group was represented in this capability lens.</p> : null}
            </div>
            <div className="repository-capability-map__controls" aria-label="Capability map zoom controls">
              <button type="button" onClick={() => setMapZoom((value) => Math.max(0.78, Number((value - 0.12).toFixed(2))))} aria-label="Zoom capability map out">−</button>
              <button type="button" onClick={() => setMapZoom(1)} aria-label="Reset capability map">⌂</button>
              <button type="button" onClick={() => setMapZoom((value) => Math.min(1.35, Number((value + 0.12).toFixed(2))))} aria-label="Zoom capability map in">+</button>
            </div>
          </div>
      </section>
    </div>
  );
}

export function RepositoryGraphView({
  mode: requestedMode,
  capabilityId,
  capabilityLabel,
  preferredSourcePath,
  initialView = "chronicle-areas",
  localGraphAvailable = import.meta.env.DEV,
  historianLoader,
}: RepositoryGraphViewProps) {
  const mode = requestedMode ?? (capabilityId ? "capability" : "global");
  const [payload, setPayload] = useState<RepositoryGraphViewPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<RepositoryGraphInitialView>(initialView);
  const [selectedPath, setSelectedPath] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    setPayload(null);
    setError(null);
    if (!localGraphAvailable) return undefined;
    let disposed = false;
    let controller: AbortController | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let requestTimeout: ReturnType<typeof setTimeout> | undefined;

    const refresh = async () => {
      if (disposed || controller) return;
      clearTimeout(timer);
      if (document.visibilityState === "hidden") return;
      const requestController = new AbortController();
      controller = requestController;
      requestTimeout = setTimeout(() => requestController.abort(), 15000);
      let nextCheck = 30000;
      try {
        const nextPayload = await loadRepositoryGraphView(
          mode === "capability" ? capabilityId : null,
          requestController.signal,
        );
        if (disposed) return;
        setError(null);
        setPayload((previous) => previous?.state === "ready-current"
          && nextPayload.state === "ready-current"
          && previous.graphId === nextPayload.graphId ? previous : nextPayload);
        if (["refreshing", "ready-stale", "unavailable"].includes(nextPayload.state)) {
          nextCheck = 2000;
        }
      } catch (caught) {
        if (!disposed) setError(requestController.signal.aborted
          ? "The local graph request timed out. It will reconnect automatically."
          : caught instanceof Error ? caught.message : String(caught));
      } finally {
        clearTimeout(requestTimeout);
        controller = null;
        if (!disposed) timer = setTimeout(() => void refresh(), nextCheck);
      }
    };

    const resume = () => { void refresh(); };
    window.addEventListener("focus", resume);
    document.addEventListener("visibilitychange", resume);
    void refresh();
    return () => {
      disposed = true;
      clearTimeout(timer);
      clearTimeout(requestTimeout);
      controller?.abort();
      window.removeEventListener("focus", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [capabilityId, localGraphAvailable, mode]);
  useEffect(() => setActiveView(initialView), [initialView, mode]);

  const graphReadable = payload?.state === "ready-current";
  const sources = useMemo(() => payload?.state === "ready-current" ? sourceSummaries(payload) : [], [payload]);
  const filteredSources = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? sources.filter((source) => source.path.toLowerCase().includes(normalized)) : sources;
  }, [query, sources]);
  const resolvedSelectedPath = filteredSources.some((source) => source.path === selectedPath)
    ? selectedPath
    : filteredSources.find((source) => source.path === preferredSourcePath)?.path ?? filteredSources[0]?.path ?? "";
  const connections = useMemo(() => payload && resolvedSelectedPath ? sourceConnections(payload, resolvedSelectedPath) : [], [payload, resolvedSelectedPath]);

  const headingId = `repository-graph-${capabilityId ?? "global"}`;
  if (!localGraphAvailable) {
    return <section className="repository-graph-view repository-graph-view--message" aria-labelledby={headingId}><h2 id={headingId}>Chronicle repository map</h2><h3>Available only in local development</h3><p>The private repository map is not included in Chronicle's production application. Open this page from the local development server to inspect the current checkout.</p><p>The source-backed architecture manuals remain available without the graph.</p></section>;
  }
  if (error) {
    return <section className="repository-graph-view repository-graph-view--message" aria-labelledby={headingId}><h2 id={headingId}>Chronicle repository map</h2><h3>Local map could not be loaded</h3><p>{error}</p><p>This does not affect the source-backed architecture content.</p></section>;
  }
  if (!payload) {
    return <section className="repository-graph-view repository-graph-view--message" aria-busy="true" aria-live="polite"><h2>Chronicle repository map</h2><p>Loading the private local map for {capabilityLabel}…</p></section>;
  }

  const [statusLabel, statusDescription] = stateCopy(payload);
  const hasGraph = graphReadable && payload.nodes.length > 0;
  if (mode === "capability" && hasGraph) {
    return (
      <section className="repository-graph-view repository-graph-view--capability" aria-labelledby={headingId}>
        <CapabilityLens payload={payload} capabilityLabel={capabilityLabel} headingId={headingId} />
      </section>
    );
  }
  return (
    <section className={`repository-graph-view repository-graph-view--${mode}`} id={mode === "global" ? "chronicle-repository-map" : undefined} aria-labelledby={headingId}>
      <header className="repository-graph-view__header">
        <div>
          <p className="repository-graph-view__eyebrow">Private local architecture aid</p>
          <h2 id={headingId}>{mode === "global" ? "Chronicle repository and system map" : `${capabilityLabel} architecture lens`}</h2>
          <p>{mode === "global" ? "Start with recognizable Chronicle areas, then move into repository, dependency, community, or recorded-history evidence when you need technical depth." : "This compact view shows where the capability enters the repository, its strongest source-backed owners and connections, and the evidence available for deeper inspection."}</p>
        </div>
        <div className={`repository-graph-status repository-graph-status--${payload.state}`} role="status"><strong>{statusLabel}</strong><span>{statusDescription}</span></div>
      </header>

      <dl className="repository-graph-metrics">
        <div><dt>Mapped source files</dt><dd>{graphReadable ? sources.length : "—"}</dd><span>{graphReadable && payload.capability ? `${sources.filter((source) => source.core).length} named in the manual` : graphReadable ? "complete allowlisted repository corpus" : "hidden until current"}</span></div>
        <div><dt>Extracted items</dt><dd>{graphReadable ? payload.nodes.length.toLocaleString() : "—"}</dd></div>
        <div><dt>Directed relationships</dt><dd>{graphReadable ? payload.edges.length.toLocaleString() : "—"}</dd></div>
        <div><dt>Structural groups</dt><dd>{graphReadable ? payload.communities.length.toLocaleString() : "—"}</dd></div>
      </dl>

      {!hasGraph && activeView !== "recorded-history" ? (
        <div className="repository-graph-empty"><h3>{graphReadable ? "No repository relationships are available" : "Repository relationships are hidden"}</h3><p>{graphReadable ? "The private graph is empty or this capability has not been mapped yet. The written architecture remains available." : payload.state === "error" ? "The automatic map update could not finish. The failure must be resolved before current relationships can be shown." : "Chronicle is preparing the current private map. It will appear here automatically when ready."}</p></div>
      ) : null}

      {mode === "global" ? (
        <>
          <div className="repository-graph-view-tabs" role="tablist" aria-label="Repository map views">
            {globalViewOptions.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={activeView === id} disabled={!graphReadable && id !== "recorded-history"} onClick={() => setActiveView(id)}>{label}</button>)}
          </div>
          {hasGraph && activeView === "chronicle-areas" ? <ChronicleAreasView payload={payload} /> : null}
          {hasGraph && activeView === "repository-tree" ? <RepositoryTreeView sources={sources} query={query} onQueryChange={setQuery} onSelect={(path) => { setSelectedPath(path); setQuery(""); setActiveView("dependency-graph"); }} /> : null}
          {hasGraph && activeView === "dependency-graph" ? (
            <div className="repository-graph-panel">
              <div className="repository-graph-toolbar">
                <label><span>Find a source file</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by repository path" /></label>
                <label><span>Selected source</span><select value={resolvedSelectedPath} disabled={filteredSources.length === 0} onChange={(event) => setSelectedPath(event.target.value)}>{filteredSources.length === 0 ? <option value="">No matching source</option> : null}{filteredSources.map((source) => <option key={source.path} value={source.path}>{source.path}</option>)}</select></label>
              </div>
              {filteredSources.length === 0 ? <p>No source path matches this search.</p> : <RelationshipDiagram selected={resolvedSelectedPath} connections={connections} onSelect={(path) => { setSelectedPath(path); setQuery(""); }} />}
            </div>
          ) : null}
          {hasGraph && activeView === "community-overview" ? <CommunityOverview payload={payload} sources={sources} /> : null}
          {activeView === "recorded-history" ? <div className="repository-graph-panel"><ChangelogHistorianView capabilityId={null} capabilityLabel="the complete Chronicle application" loader={historianLoader} /></div> : null}
        </>
      ) : null}

      <footer className="repository-graph-evidence-limits">
        <h3>How to read this evidence</h3>
        <p>Chronicle area names and responsibility descriptions are authored orientation. Nodes, arrows, counts, communities, confidence, and source locations are extracted repository evidence. Extracted evidence does not by itself prove runtime execution, live Supabase state, product ownership, user-visible behavior, or why the code exists.</p>
        <p>{mode === "capability" ? "The written capability manual below remains the authority for intended behavior. " : "The source-backed capability manuals remain the authority for intended behavior. "}Recorded History reads the canonical Chronicle Changelog; this map creates no second history source.</p>
        <p>Graph identity: <code>{graphReadable ? payload.graphId ?? "Not available" : "Not available"}</code>. Generated: {graphReadable && payload.generatedAt ? new Date(payload.generatedAt).toLocaleString() : "Not available"}.</p>
      </footer>
    </section>
  );
}
