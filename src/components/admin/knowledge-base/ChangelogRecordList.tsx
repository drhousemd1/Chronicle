import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import type { EffectiveChangelogEntry } from "@/data/chronicle-knowledge-base/changelog-record-contract";
import type { ChronicleCapabilityId } from "@/data/chronicle-knowledge-base/capability-ids";
import { resolveVerifiedChangelogArchiveRoute } from "@/data/chronicle-knowledge-base/changelog-archive-route";
import {
  loadChronicleChangelogRegistry,
  selectLoadedChangelogEntries,
  type ChangelogRegistryLoader,
} from "@/data/chronicle-knowledge-base/changelog-record-sources";
import type { OperationalRecordRegistry } from "@/data/chronicle-knowledge-base/operational-record-contract";
import { chronicleOperationalRecordRegistry } from "@/data/chronicle-knowledge-base/operational-record-sources";

import {
  ChangelogRecordNarrative,
} from "./ChangelogRecordNarrative";
import {
  buildChangelogRecordHref,
  type ChangelogRecordOrigin,
  type ChangelogRecordScope,
} from "./changelog-record-route";
import "./changelog-record-list.css";

type ChangelogListState =
  | Readonly<{ status: "loading" }>
  | Readonly<{ status: "error"; errors: readonly string[] }>
  | Readonly<{
      status: "ready";
      entries: readonly EffectiveChangelogEntry[];
    }>;

export type ChangelogRecordListProps = Readonly<{
  capability?: ChronicleCapabilityId;
  scopeLabel: string;
  emptyMessage: string;
  limit?: number;
  mode?: "primary" | "preview";
  detailScope?: ChangelogRecordScope;
  detailOrigin?: ChangelogRecordOrigin;
  loader?: ChangelogRegistryLoader;
  operationalRegistry?: OperationalRecordRegistry;
}>;

export default function ChangelogRecordList({
  capability,
  scopeLabel,
  emptyMessage,
  limit,
  mode = "primary",
  detailScope = capability === "community-gallery" ? "community-gallery" : "global",
  detailOrigin = "knowledge-base",
  loader = loadChronicleChangelogRegistry,
  operationalRegistry = chronicleOperationalRecordRegistry,
}: ChangelogRecordListProps) {
  const location = useLocation();
  const listRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ChangelogListState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    void loader()
      .then((result) => {
        if (!active) return;
        if (result.status === "error") {
          setState({ status: "error", errors: result.errors });
          return;
        }
        setState({
          status: "ready",
          entries: selectLoadedChangelogEntries(result, capability),
        });
      })
      .catch((error) => {
        if (!active) return;
        setState({
          status: "error",
          errors: [
            error instanceof Error
              ? error.message
              : "The repository Changelog could not be loaded.",
          ],
        });
      });

    return () => {
      active = false;
    };
  }, [capability, loader]);

  useEffect(() => {
    if (state.status !== "ready" || !location.hash.startsWith("#changelog-")) {
      return;
    }

    let targetRecordId: string;
    try {
      targetRecordId = decodeURIComponent(
        location.hash.slice("#changelog-".length),
      );
    } catch {
      return;
    }

    const query = new URLSearchParams(location.search);
    const requestedScope = query.get("section") ?? query.get("capability");
    if (requestedScope && requestedScope !== detailScope) {
      return;
    }

    const target = [...(listRef.current?.querySelectorAll<HTMLElement>(
      "[data-changelog-id]",
    ) ?? [])].find(
      (candidate) => candidate.dataset.changelogId === targetRecordId,
    );
    if (!target) {
      return;
    }

    target.scrollIntoView?.({ block: "nearest" });
    target.focus({ preventScroll: true });
  }, [detailScope, location.hash, location.search, state]);

  const visibleEntries =
    state.status === "ready" && limit !== undefined
      ? state.entries.slice(0, limit)
      : state.status === "ready"
        ? state.entries
        : [];

  return (
    <div
      ref={listRef}
      className={`changelog-record-list changelog-record-list--${mode}`}
      data-changelog-status={state.status}
      data-changelog-mode={mode}
      data-changelog-scope={detailScope}
    >
      <div className="changelog-record-list__summary">
        <div className="changelog-record-list__scope">{scopeLabel}</div>
        {state.status === "ready" ? (
          <span className="changelog-record-list__count">
            {visibleEntries.length < state.entries.length
              ? `${visibleEntries.length} of ${state.entries.length} records`
              : `${state.entries.length} ${state.entries.length === 1 ? "record" : "records"}`}
          </span>
        ) : null}
      </div>

      {mode === "preview" ? (
        <p className="changelog-record-list__ordering">
          {limit === undefined
            ? "This preview links each record to its complete canonical record."
            : `This is a preview of the ${limit} newest ${limit === 1 ? "record" : "records"}. Each preview links to the complete canonical record.`}
        </p>
      ) : (
        <p className="changelog-record-list__ordering">
          Records are ordered by their latest meaningful history date, newest
          first; stable ID breaks ties on the same date. Imported Quality Hub
          records use their original last-updated date, accepted Chronicle changes
          use their acceptance date, and later corrections use the correction date.
        </p>
      )}

      {state.status === "loading" ? (
        <div className="changelog-record-list__state" role="status">
          Loading repository Changelog history…
        </div>
      ) : null}

      {state.status === "error" ? (
        <div
          className="changelog-record-list__state changelog-record-list__state--error"
          role="alert"
        >
          Repository Changelog history could not be loaded. This is a loading or
          validation failure, not an empty history.
          {state.errors[0] ? (
            <span className="changelog-record-list__state-detail">{state.errors[0]}</span>
          ) : null}
        </div>
      ) : null}

      {state.status === "ready" && state.entries.length === 0 ? (
        <div className="changelog-record-list__state">{emptyMessage}</div>
      ) : null}

      {state.status === "ready" && state.entries.length > 0 ? (
        <ol className="changelog-record-list__records" role="list">
          {visibleEntries.map((entry) => (
            <li
              className="changelog-record-list__record"
              id={`changelog-${detailScope}-${entry.id}`}
              data-changelog-id={entry.id}
              data-source-record={entry.sourcePath}
              key={entry.id}
              tabIndex={-1}
            >
              <article aria-label={`Changelog record ${entry.id}: ${entry.title}`}>
                <ChangelogRecordNarrative
                  entry={entry}
                  mode={mode}
                  verifiedArchiveRoute={resolveVerifiedChangelogArchiveRoute(
                    entry,
                    operationalRegistry,
                  )}
                  detailHref={buildChangelogRecordHref(
                    entry.id,
                    detailScope,
                    detailOrigin,
                  )}
                />
              </article>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
