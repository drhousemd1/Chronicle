import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import type { ChronicleCapabilityId } from "@/data/chronicle-knowledge-base/capability-ids";
import {
  loadChronicleChangelogRegistry,
  type ChangelogRegistryLoader,
} from "@/data/chronicle-knowledge-base/changelog-record-sources";
import {
  deriveRepositoryGraphHistory,
  searchRepositoryGraphHistory,
  type RepositoryGraphHistoryEntry,
} from "@/data/chronicle-knowledge-base/repository-graph-historian";

import { buildChangelogRecordHref } from "./changelog-record-route";

type HistorianState =
  | Readonly<{ status: "loading" }>
  | Readonly<{ status: "error"; message: string }>
  | Readonly<{ status: "ready"; entries: readonly RepositoryGraphHistoryEntry[] }>;

type ChangelogHistorianViewProps = Readonly<{
  capabilityId: ChronicleCapabilityId | null;
  capabilityLabel: string;
  loader?: ChangelogRegistryLoader;
}>;

function RecordedField({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || "Not recorded in this historical record."}</dd>
    </div>
  );
}

function HistoryArticle({
  entry,
  capabilityId,
}: {
  entry: RepositoryGraphHistoryEntry;
  capabilityId: ChronicleCapabilityId | null;
}) {
  const historical = entry.recordType === "Historical Quality Hub record";
  const detailScope = capabilityId ?? "global";
  return (
    <article className="repository-graph-history-record" data-history-id={entry.id}>
      <header>
        <div>
          <p>{entry.dateLabel}: <time dateTime={entry.meaningfulDate}>{entry.meaningfulDate}</time></p>
          <h4>{entry.title}</h4>
        </div>
        <div>
          <strong>{entry.recordType}</strong>
          <code>{entry.id}</code>
        </div>
      </header>

      <dl>
        {historical ? (
          <RecordedField label="What was broken and why the work was needed" value={entry.problem} />
        ) : (
          <>
            <RecordedField label="What was broken" value={entry.problem} />
            <RecordedField label="Why the change was needed" value={entry.whyChangeWasNeeded} />
          </>
        )}
        {entry.planRecordedAtTheTime ? <RecordedField label="Plan recorded at the time" value={entry.planRecordedAtTheTime} /> : null}
        <RecordedField label="What changed" value={entry.changes} />
        <RecordedField label="Result" value={entry.outcome} />
        <RecordedField label="Evidence" value={entry.evidenceSummary} />
        <RecordedField label="Evidence limits" value={entry.evidenceLimits} />
      </dl>

      <div className="repository-graph-history-record__details">
        <p><strong>Affected capabilities:</strong> {entry.affectedCapabilities.join(", ") || "None recorded"}</p>
        <p><strong>Canonical record source:</strong> {entry.sourcePath}</p>
        <p><strong>Recorded source paths:</strong> {entry.recordedSourcePaths.length ? entry.recordedSourcePaths.join(", ") : "No source paths were recorded."}</p>
        {entry.acceptedBy ? (
          <p>
            <strong>Acceptance provenance:</strong> accepted by {entry.acceptedBy} on {entry.acceptedOn}
            {entry.acceptanceReference ? ` under ${entry.acceptanceReference}` : ""}
            {entry.reviewMethod ? ` through ${entry.reviewMethod}` : ""}. Accepted source state: {entry.sourceRevision}.
          </p>
        ) : null}
        {historical ? (
          <p>
            <strong>Historical provenance:</strong> source lineage {entry.legacySourceLineage.join(", ") || "not recorded"}; migration receipt {entry.legacyMigrationReceipt ?? "not recorded"}. {entry.legacyProvenanceLimit}
          </p>
        ) : null}
        {entry.corrections.length ? (
          <div>
            <p><strong>Corrections applied:</strong> Original history date: {entry.originalDate}.</p>
            <ul>
              {entry.corrections.map((correction) => (
                <li key={correction.id}>
                  {correction.id}, recorded {correction.correctedOn} by {correction.authority}: {correction.reason} Source state: {correction.sourceRevision}.
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {entry.resolvedIssueIds.length || entry.remainingIssueIds.length ? (
          <p><strong>Issue disposition:</strong> resolved {entry.resolvedIssueIds.join(", ") || "none"}; remaining {entry.remainingIssueIds.join(", ") || "none"}.</p>
        ) : null}
        {entry.archiveRoute ? <p><Link to={entry.archiveRoute}>Read the complete accepted Current Work archive</Link></p> : null}
      </div>

      <Link to={buildChangelogRecordHref(entry.id, detailScope, capabilityId ? "knowledge-base" : "quality-hub")}>Read the complete canonical Changelog record</Link>
    </article>
  );
}

export function ChangelogHistorianView({
  capabilityId,
  capabilityLabel,
  loader = loadChronicleChangelogRegistry,
}: ChangelogHistorianViewProps) {
  const [state, setState] = useState<HistorianState>({ status: "loading" });
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });
    void loader()
      .then((result) => {
        if (!active) return;
        if (result.status === "error") {
          setState({ status: "error", message: result.errors[0] ?? "The canonical Changelog failed validation." });
          return;
        }
        setState({
          status: "ready",
          entries: deriveRepositoryGraphHistory(result.registry, capabilityId ?? undefined),
        });
      })
      .catch((error) => {
        if (active) setState({ status: "error", message: error instanceof Error ? error.message : String(error) });
      });
    return () => {
      active = false;
    };
  }, [capabilityId, loader]);

  const visibleEntries = useMemo(
    () => state.status === "ready" ? searchRepositoryGraphHistory(state.entries, query) : [],
    [query, state],
  );

  return (
    <div className="repository-graph-historian">
      <h3>Canonical change history</h3>
      <p>
        This is a read-only lookup over Chronicle&apos;s existing Changelog{capabilityId ? `, filtered to ${capabilityLabel}` : ""}. It does not use Graphify memory, infer history from Git, or create another history source.
      </p>
      <label>
        <span>Find a prior change, reason, or recorded source path</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search canonical Changelog history" />
      </label>

      {state.status === "loading" ? <p role="status">Loading canonical Changelog history…</p> : null}
      {state.status === "error" ? <p role="alert">Canonical Changelog history could not be loaded: {state.message}</p> : null}
      {state.status === "ready" ? <p>{visibleEntries.length} of {state.entries.length} records shown, newest meaningful history date first.</p> : null}
      {state.status === "ready" && visibleEntries.length === 0 ? <p>No canonical Changelog record matches this search.</p> : null}
      {visibleEntries.map((entry) => <HistoryArticle key={entry.id} entry={entry} capabilityId={capabilityId} />)}
    </div>
  );
}
