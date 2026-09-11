import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import {
  ChangelogRecordNarrative,
} from "@/components/admin/knowledge-base/ChangelogRecordNarrative";
import {
  buildChangelogRecordHref,
  normalizeChangelogRecordOrigin,
  type ChangelogRecordOrigin,
  type ChangelogRecordScope,
} from "@/components/admin/knowledge-base/changelog-record-route";
import { resolveVerifiedChangelogArchiveRoute } from "@/data/chronicle-knowledge-base/changelog-archive-route";
import { isChronicleCapabilityId } from "@/data/chronicle-knowledge-base/capability-ids";
import type { EffectiveChangelogEntry } from "@/data/chronicle-knowledge-base/changelog-record-contract";
import {
  loadChronicleChangelogRegistry,
  type ChangelogRegistryLoader,
} from "@/data/chronicle-knowledge-base/changelog-record-sources";
import {
  buildKnowledgeBaseTabHref,
  buildQualityHubChangelogHref,
  buildQualityHubOverviewHref,
} from "@/data/chronicle-knowledge-base/knowledge-routes";
import type { OperationalRecordRegistry } from "@/data/chronicle-knowledge-base/operational-record-contract";
import { getOperationalCapability } from "@/data/chronicle-knowledge-base/operational-capability-registry";
import { chronicleOperationalRecordRegistry } from "@/data/chronicle-knowledge-base/operational-record-sources";

type DetailState =
  | Readonly<{ status: "loading" }>
  | Readonly<{ status: "error"; message: string }>
  | Readonly<{ status: "missing" }>
  | Readonly<{ status: "excluded"; entry: EffectiveChangelogEntry }>
  | Readonly<{ status: "ready"; entry: EffectiveChangelogEntry }>;

function parseScope(value: string | null): ChangelogRecordScope | null {
  if (value === "global") return value;
  return value && isChronicleCapabilityId(value) && getOperationalCapability(value)
    ? value
    : null;
}

function parseOrigin(
  value: string | null,
  scope: ChangelogRecordScope,
): ChangelogRecordOrigin {
  return normalizeChangelogRecordOrigin(scope, value);
}

function returnDestination(
  entry: EffectiveChangelogEntry | null,
  scope: ChangelogRecordScope,
  origin: ChangelogRecordOrigin,
  verifiedArchiveRoute: string | null,
) {
  const capabilityLabel =
    scope === "global"
      ? "Chronicle"
      : (getOperationalCapability(scope)?.displayName ?? scope);
  if (origin === "archive" && verifiedArchiveRoute) {
    return {
      to: verifiedArchiveRoute,
      label: "Back to archived Current Work",
    } as const;
  }
  if (origin === "quality-hub-overview") {
    return {
      to: buildQualityHubOverviewHref(entry?.id),
      label: "Back to Quality Hub overview",
    } as const;
  }
  if (origin === "quality-hub") {
    return scope !== "global"
      ? {
          to: buildQualityHubChangelogHref(scope, entry?.id),
          label: `Back to ${capabilityLabel} history in Quality Hub`,
        } as const
      : {
          to: buildQualityHubChangelogHref(undefined, entry?.id),
          label: "Back to Quality Hub Changelog",
        } as const;
  }
  return {
    to: buildKnowledgeBaseTabHref(
      scope === "global" ? "community-gallery" : scope,
      "changelog",
      entry?.id,
    ),
    label:
      scope === "global"
        ? "Back to Community Gallery Changelog"
        : `Back to ${capabilityLabel} Changelog`,
  } as const;
}

export type ChangelogRecordPageProps = Readonly<{
  loader?: ChangelogRegistryLoader;
  operationalRegistry?: OperationalRecordRegistry;
}>;

export function ChangelogRecordPage({
  loader = loadChronicleChangelogRegistry,
  operationalRegistry = chronicleOperationalRecordRegistry,
}: ChangelogRecordPageProps = {}) {
  const { recordId } = useParams<{ recordId?: string }>();
  const location = useLocation();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const search = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const scope = parseScope(search.get("scope"));
  const origin = scope ? parseOrigin(search.get("from"), scope) : null;
  const [state, setState] = useState<DetailState>({ status: "loading" });

  useEffect(() => {
    if (!recordId || !scope) {
      setState({
        status: "error",
        message: !recordId
          ? "This Changelog address does not identify a record."
          : "This Changelog address has an invalid or missing scope.",
      });
      return;
    }

    let active = true;
    setState({ status: "loading" });
    void loader()
      .then((result) => {
        if (!active) return;
        if (result.status === "error") {
          setState({
            status: "error",
            message: result.errors[0] ?? "The canonical Changelog could not be loaded.",
          });
          return;
        }
        const entry = result.registry.effectiveEntries.find(
          (candidate) => candidate.id === recordId,
        );
        if (!entry) {
          setState({ status: "missing" });
          return;
        }
        if (scope !== "global" && !entry.affectedCapabilities.includes(scope)) {
          setState({ status: "excluded", entry });
          return;
        }
        setState({ status: "ready", entry });
      })
      .catch((error) => {
        if (!active) return;
        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "The canonical Changelog could not be loaded.",
        });
      });
    return () => {
      active = false;
    };
  }, [loader, recordId, scope]);

  useEffect(() => {
    if (state.status !== "loading") {
      headingRef.current?.focus({ preventScroll: true });
    }
  }, [state.status]);

  const knownEntry = state.status === "ready" ? state.entry : null;
  const safeScope = scope ?? "global";
  const safeScopeLabel =
    safeScope === "global"
      ? "Chronicle"
      : (getOperationalCapability(safeScope)?.displayName ?? safeScope);
  const safeOrigin = origin ?? normalizeChangelogRecordOrigin(safeScope, null);
  const verifiedArchiveRoute = knownEntry
    ? resolveVerifiedChangelogArchiveRoute(knownEntry, operationalRegistry)
    : null;
  const backDestination = returnDestination(
    knownEntry,
    safeScope,
    safeOrigin,
    verifiedArchiveRoute,
  );
  const stateReturnLabel = backDestination.label.replace(
    /^Back to /,
    "Return to ",
  );

  return (
    <div className="changelog-record-page">
      <header className="changelog-record-page__header">
        <Link
          className="changelog-record-page__back"
          to="/?tab=admin"
          aria-label="Back to Admin Panel"
          title="Back to Admin Panel"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <h1>Chronicle Changelog Record</h1>
      </header>
      <main className="changelog-record-page__main">
        <div className="changelog-record-page__introduction">
          <h2 ref={headingRef} tabIndex={-1}>Complete Changelog record</h2>
          <p>
            This page reads the same canonical repository record used by the
            capability Knowledge Base and Quality Hub Changelog views. It adds the complete
            preserved history without creating another editable copy.
          </p>
        </div>

        {state.status === "loading" ? (
          <section className="changelog-record-page__state" role="status">
            <p>Loading the canonical Changelog record…</p>
          </section>
        ) : null}

        {state.status === "error" ? (
          <section
            className="changelog-record-page__state changelog-record-page__state--error"
            role="alert"
          >
            <h3>Changelog record could not be loaded</h3>
            <p>{state.message}</p>
            <p><Link to={backDestination.to}>{stateReturnLabel}</Link></p>
          </section>
        ) : null}

        {state.status === "missing" ? (
          <section className="changelog-record-page__state">
            <h3>Changelog record not found</h3>
            <p>
              No canonical record matches <code>{recordId}</code>. Nothing was
              inferred from a similar ID or an older history source.
            </p>
            <p><Link to={backDestination.to}>{stateReturnLabel}</Link></p>
          </section>
        ) : null}

        {state.status === "excluded" ? (
          <section className="changelog-record-page__state">
            <h3>Record is outside the requested scope</h3>
            <p>
              {state.entry.id} exists in the canonical Chronicle Changelog, but it
              is not positively verified as affecting {safeScopeLabel}. The
              capability-scoped address will not silently widen to global history.
            </p>
            <p><Link to={backDestination.to}>{stateReturnLabel}</Link></p>
          </section>
        ) : null}

        {state.status === "ready" ? (
          <article
            className="changelog-record-page__record"
            data-changelog-id={state.entry.id}
            data-source-record={state.entry.sourcePath}
          >
            <ChangelogRecordNarrative
              entry={state.entry}
              mode="detail"
              verifiedArchiveRoute={verifiedArchiveRoute}
              detailHref={buildChangelogRecordHref(
                state.entry.id,
                safeScope,
                safeOrigin,
              )}
            />
          </article>
        ) : null}
      </main>
    </div>
  );
}

export default ChangelogRecordPage;
