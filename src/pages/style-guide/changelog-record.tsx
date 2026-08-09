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
import type { EffectiveChangelogEntry } from "@/data/chronicle-knowledge-base/changelog-record-contract";
import {
  loadChronicleChangelogRegistry,
  type ChangelogRegistryLoader,
} from "@/data/chronicle-knowledge-base/changelog-record-sources";
import type { OperationalRecordRegistry } from "@/data/chronicle-knowledge-base/operational-record-contract";
import { galleryOperationalRecordRegistry } from "@/data/chronicle-knowledge-base/operational-record-sources";

type DetailState =
  | Readonly<{ status: "loading" }>
  | Readonly<{ status: "error"; message: string }>
  | Readonly<{ status: "missing" }>
  | Readonly<{ status: "excluded"; entry: EffectiveChangelogEntry }>
  | Readonly<{ status: "ready"; entry: EffectiveChangelogEntry }>;

const VALID_SCOPES = new Set<ChangelogRecordScope>([
  "global",
  "community-gallery",
]);
function parseScope(value: string | null): ChangelogRecordScope | null {
  return value && VALID_SCOPES.has(value as ChangelogRecordScope)
    ? (value as ChangelogRecordScope)
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
  const hash = entry ? `#changelog-${encodeURIComponent(entry.id)}` : "";
  if (origin === "archive" && verifiedArchiveRoute) {
    return {
      to: verifiedArchiveRoute,
      label: "Back to archived Current Work",
    } as const;
  }
  if (origin === "quality-hub-overview") {
    return {
      to: `/style-guide/ui-audit${hash}`,
      label: "Back to Quality Hub overview",
    } as const;
  }
  if (origin === "quality-hub") {
    return scope === "community-gallery"
      ? {
          to: `/style-guide/ui-audit?view=changelog&capability=community-gallery${hash}`,
          label: "Back to Community Gallery history in Quality Hub",
        } as const
      : {
          to: `/style-guide/ui-audit?view=changelog${hash}`,
          label: "Back to Quality Hub Changelog",
        } as const;
  }
  return {
    to: `/style-guide/chronicle-knowledge-base?section=community-gallery&tab=changelog${hash}`,
    label: "Back to Community Gallery Changelog",
  } as const;
}

export type ChangelogRecordPageProps = Readonly<{
  loader?: ChangelogRegistryLoader;
  operationalRegistry?: OperationalRecordRegistry;
}>;

export function ChangelogRecordPage({
  loader = loadChronicleChangelogRegistry,
  operationalRegistry = galleryOperationalRecordRegistry,
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
        if (
          scope === "community-gallery" &&
          !entry.affectedCapabilities.includes("community-gallery")
        ) {
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
          to={backDestination.to}
          aria-label={backDestination.label}
          title={backDestination.label}
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
            Community Gallery and Quality Hub Changelog views. It adds the complete
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
              is not positively verified as affecting Community Gallery. The
              Gallery-scoped address will not silently widen to global history.
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
