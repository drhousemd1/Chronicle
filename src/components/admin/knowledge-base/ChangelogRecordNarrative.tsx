import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import type {
  CorrectionChangelogRecord,
  EffectiveChangelogEntry,
  LegacyImportChangelogRecord,
} from "@/data/chronicle-knowledge-base/changelog-record-contract";

import "./changelog-record-list.css";

export type ChangelogNarrativeMode = "primary" | "preview" | "detail";

function recordedOrFallback(value: string, fallback: string) {
  return value.trim() ? value : fallback;
}

function listOrFallback(values: readonly string[], fallback: string) {
  return values.length > 0 ? values : [fallback];
}

const CLARIFIED_FIELD_LABELS: Readonly<Record<string, string>> = {
  title: "Title",
  changeDate: "History date",
  problem: "What was broken",
  whyChangeWasNeeded: "Why the change was needed",
  changes: "What changed",
  outcome: "Accepted result",
  acceptedEvidenceSummary: "Accepted evidence summary",
  acceptedEvidenceLimits: "Accepted evidence limits",
  affectedCapabilities: "Affected capabilities",
  acceptedOn: "Acceptance date",
  acceptedBy: "Acceptance reviewer",
  reviewMethod: "Review method",
  acceptanceRef: "Acceptance proof",
  sourceRevision: "Source revision",
  archivedProjectId: "Archived project",
  archiveRecord: "Archive source",
  archiveRoute: "Archive link",
  resolvedIssueIds: "Resolved Issues",
  remainingIssueIds: "Remaining Issues",
  originalRecord: "Preserved Quality Hub record",
  sourceHash: "Historical source hash",
  preservedRecordHash: "Privacy-safe record hash",
  privacyRedactions: "Privacy redactions",
  migrationSnapshotHash: "Migration snapshot hash",
  importedOn: "Import date",
  sourceLineage: "Source lineage",
  migrationReceipt: "Migration receipt",
  applicabilityEvidence: "Applicability evidence",
  applicabilityStatus: "Applicability review status",
  galleryApplicability: "Community Gallery applicability",
};

function clarifiedFieldLabel(
  field: string,
  variant: EffectiveChangelogEntry["variant"],
) {
  if (variant === "legacy_import") {
    if (field === "title") return "Preserved Quality Hub title";
    if (field === "outcome") return "Preserved Quality Hub summary";
    if (field === "originalRecord") return "Preserved Quality Hub payload";
  }
  return CLARIFIED_FIELD_LABELS[field] ?? field;
}

function underlyingRecordType(entry: EffectiveChangelogEntry) {
  if (entry.rootRecord.variant === "accepted_closeout") {
    return "Accepted Chronicle closeout";
  }
  if (entry.rootRecord.variant === "accepted_update") {
    return "Accepted Chronicle update";
  }
  return "Historical Quality Hub record";
}

function originalHistoryDate(entry: EffectiveChangelogEntry) {
  return entry.rootRecord.variant !== "legacy_import"
    ? entry.rootRecord.acceptedOn
    : entry.rootRecord.originalRecord.updatedAt.slice(0, 10);
}

function HistoryDate({ entry }: { entry: EffectiveChangelogEntry }) {
  const corrected = entry.appliedCorrections.length > 0;
  const accepted = entry.rootRecord.variant !== "legacy_import";
  return (
    <div className="changelog-narrative__history-date">
      <span>{corrected ? "Corrected" : accepted ? "Accepted" : "Last updated in Quality Hub"}</span>
      <time dateTime={entry.changeDate}>{entry.changeDate}</time>
      {corrected ? (
        <small>
          {accepted ? "Originally accepted" : "Originally last updated in Quality Hub"}: {" "}
          <time dateTime={originalHistoryDate(entry)}>{originalHistoryDate(entry)}</time>
        </small>
      ) : null}
    </div>
  );
}

function RecordIdentity({ entry }: { entry: EffectiveChangelogEntry }) {
  const corrected = entry.appliedCorrections.length > 0;
  return (
    <dl className="changelog-narrative__metadata">
      <div>
        <dt>Record type</dt>
        <dd>{underlyingRecordType(entry)}</dd>
      </div>
      <div>
        <dt>Stable ID</dt>
        <dd className="changelog-narrative__stable-id">{entry.id}</dd>
      </div>
      {corrected ? (
        <div>
          <dt>Correction status</dt>
          <dd className="changelog-narrative__correction-marker">Correction applied</dd>
        </div>
      ) : null}
    </dl>
  );
}

function NarrativeSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="changelog-narrative__section">
      <h4>{heading}</h4>
      {children}
    </section>
  );
}

function NarrativeText({ children }: { children: string }) {
  return <p className="changelog-narrative__preserved-text">{children}</p>;
}

function AcceptedIssueDisposition({
  entry,
}: {
  entry: EffectiveChangelogEntry;
}) {
  if (entry.effectiveRecord.variant !== "accepted_closeout") return null;
  const record = entry.effectiveRecord;
  if (record.resolvedIssueIds.length === 0 && record.remainingIssueIds.length === 0) {
    return <p>No Chronicle Issues were linked to this accepted change.</p>;
  }
  return (
    <dl className="changelog-narrative__disposition">
      <div>
        <dt>Resolved by this change</dt>
        <dd>{record.resolvedIssueIds.length > 0 ? record.resolvedIssueIds.join(", ") : "None"}</dd>
      </div>
      <div>
        <dt>Still open after acceptance</dt>
        <dd>{record.remainingIssueIds.length > 0 ? record.remainingIssueIds.join(", ") : "None"}</dd>
      </div>
    </dl>
  );
}

function formatClarifiedValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.length > 0
      ? value.map((item) => (typeof item === "string" ? item : JSON.stringify(item))).join("\n")
      : "Empty list";
  }
  if (value && typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function ResultAndVerification({ entry }: { entry: EffectiveChangelogEntry }) {
  const record = entry.effectiveRecord;
  if (record.variant !== "legacy_import") {
    return (
      <dl className="changelog-narrative__verification">
        <div>
          <dt>Accepted result</dt>
          <dd><NarrativeText>{record.outcome}</NarrativeText></dd>
        </div>
        <div>
          <dt>Evidence supporting that result</dt>
          <dd><NarrativeText>{record.acceptedEvidenceSummary}</NarrativeText></dd>
        </div>
        <div>
          <dt>What that evidence does not establish</dt>
          <dd><NarrativeText>{record.acceptedEvidenceLimits}</NarrativeText></dd>
        </div>
      </dl>
    );
  }
  return (
    <dl className="changelog-narrative__verification">
      <div>
        <dt>Preserved Quality Hub summary</dt>
        <dd><NarrativeText>{record.outcome}</NarrativeText></dd>
      </div>
      <div>
        <dt>Verification limits</dt>
        <dd>
          <p>
            Modern acceptance was not assessed, and this preserved Quality Hub
            summary was not reverified during migration. It reproduces what Quality
            Hub recorded; it does not establish current product behavior or a modern
            accepted result.
          </p>
        </dd>
      </div>
    </dl>
  );
}

function PrimaryNarrative({
  entry,
  detailHref,
  showDetailLink,
  verifiedArchiveRoute,
}: {
  entry: EffectiveChangelogEntry;
  detailHref: string;
  showDetailLink: boolean;
  verifiedArchiveRoute: string | null;
}) {
  const record = entry.effectiveRecord;
  const legacy = record.variant === "legacy_import" ? record : null;
  const closeout = record.variant === "accepted_closeout" ? record : null;
  const update = record.variant === "accepted_update" ? record : null;
  const historicalMissing = "Not recorded in the original Quality Hub entry.";
  return (
    <div className="changelog-narrative__body">
      {legacy ? (
        <NarrativeSection heading="Problem and impact recorded in Quality Hub">
          <NarrativeText>
            {recordedOrFallback(legacy.originalRecord.problem, historicalMissing)}
          </NarrativeText>
          <p>
            Quality Hub did not store a separate why-needed field, so no rationale
            is inferred.
          </p>
        </NarrativeSection>
      ) : closeout ? (
        <>
          <NarrativeSection heading="What was broken">
            <NarrativeText>{closeout.problem}</NarrativeText>
          </NarrativeSection>
          <NarrativeSection heading="Why the change was needed">
            <NarrativeText>{closeout.whyChangeWasNeeded}</NarrativeText>
          </NarrativeSection>
        </>
      ) : (
        <NarrativeSection heading="Why the change was needed">
          <NarrativeText>{update?.whyChangeWasNeeded ?? ""}</NarrativeText>
        </NarrativeSection>
      )}

      {legacy ? (
        <NarrativeSection heading="Plan recorded at the time">
          <NarrativeText>
            {recordedOrFallback(legacy.originalRecord.plan, historicalMissing)}
          </NarrativeText>
        </NarrativeSection>
      ) : null}

      <NarrativeSection heading="What changed">
        <NarrativeText>
          {legacy
            ? recordedOrFallback(legacy.originalRecord.changes, historicalMissing)
            : closeout?.changes ?? update?.changes ?? ""}
        </NarrativeText>
      </NarrativeSection>

      <NarrativeSection
        heading={legacy ? "Preserved Quality Hub summary and verification limits" : "Result and verification"}
      >
        <ResultAndVerification entry={entry} />
      </NarrativeSection>

      <NarrativeSection heading="Issue disposition">
        {legacy ? (
          <p>
            No modern Chronicle Issue disposition is available for this historical
            Quality Hub record.
          </p>
        ) : closeout ? (
          <AcceptedIssueDisposition entry={entry} />
        ) : (
          <p>
            No Chronicle Issue was required or created for this bounded accepted update.
          </p>
        )}
      </NarrativeSection>

      {record.variant === "accepted_closeout" ? (
        <NarrativeSection heading="Related history">
          {verifiedArchiveRoute ? (
            <p>
              <Link to={verifiedArchiveRoute}>Open the historical work record</Link>
            </p>
          ) : (
            <p>
              Historical work record link unavailable — the accepted record and
              reciprocal archive were not verified together.
            </p>
          )}
        </NarrativeSection>
      ) : null}
      {showDetailLink ? (
        <p className="changelog-narrative__detail-link">
          <Link to={detailHref}>Read complete Changelog record</Link>
        </p>
      ) : null}
    </div>
  );
}

function CorrectionHistory({
  corrections,
  rootVariant,
}: {
  corrections: readonly CorrectionChangelogRecord[];
  rootVariant: EffectiveChangelogEntry["variant"];
}) {
  if (corrections.length === 0) {
    return <p>No corrections have been applied to this record.</p>;
  }
  return (
    <ol className="changelog-narrative__corrections">
      {corrections.map((correction) => (
        <li key={correction.id}>
          <h4>{correction.id}</h4>
          <dl>
            <div><dt>Corrected</dt><dd>{correction.correctedOn}</dd></div>
            <div><dt>Authority</dt><dd>{correction.correctionAuthority}</dd></div>
            <div><dt>Reason</dt><dd>{correction.correctionReason}</dd></div>
            <div><dt>Source revision</dt><dd>{correction.sourceRevision}</dd></div>
            <div>
              <dt>Fields clarified</dt>
              <dd>
                {Object.keys(correction.clarifiedFields)
                  .map((field) => clarifiedFieldLabel(field, rootVariant))
                  .join(", ")}
              </dd>
            </div>
            <div>
              <dt>Correction source</dt>
              <dd>{correction.sourcePath}</dd>
            </div>
          </dl>
          <dl className="changelog-narrative__clarifications">
            {Object.entries(correction.clarifiedFields).map(([field, value]) => (
              <div key={field}>
                <dt>{clarifiedFieldLabel(field, rootVariant)}</dt>
                <dd><NarrativeText>{formatClarifiedValue(value)}</NarrativeText></dd>
              </div>
            ))}
          </dl>
        </li>
      ))}
    </ol>
  );
}

function OriginalRecordBeforeCorrections({
  entry,
}: {
  entry: EffectiveChangelogEntry;
}) {
  if (entry.appliedCorrections.length === 0) return null;
  const root = entry.rootRecord;
  if (root.variant === "accepted_closeout") {
    return (
      <NarrativeSection heading="Immutable original narrative">
        <dl className="changelog-narrative__detail-fields">
          <div><dt>Original title</dt><dd><NarrativeText>{root.title}</NarrativeText></dd></div>
          <div><dt>Original history date</dt><dd>{root.changeDate}</dd></div>
          <div><dt>What was broken</dt><dd><NarrativeText>{root.problem}</NarrativeText></dd></div>
          <div><dt>Why the change was needed</dt><dd><NarrativeText>{root.whyChangeWasNeeded}</NarrativeText></dd></div>
          <div><dt>What changed</dt><dd><NarrativeText>{root.changes}</NarrativeText></dd></div>
          <div><dt>Original accepted result</dt><dd><NarrativeText>{root.outcome}</NarrativeText></dd></div>
          <div><dt>Original evidence summary</dt><dd><NarrativeText>{root.acceptedEvidenceSummary}</NarrativeText></dd></div>
          <div><dt>Original evidence limits</dt><dd><NarrativeText>{root.acceptedEvidenceLimits}</NarrativeText></dd></div>
          <div><dt>Original affected capabilities</dt><dd>{root.affectedCapabilities.join(", ")}</dd></div>
          <div><dt>Original owning capability</dt><dd>{root.owningCapability}</dd></div>
          <div><dt>Originally accepted on</dt><dd>{root.acceptedOn}</dd></div>
          <div><dt>Original acceptance reviewer</dt><dd>{root.acceptedBy}</dd></div>
          <div><dt>Original acceptance proof</dt><dd>{root.acceptanceRef}</dd></div>
          <div><dt>Original source revision</dt><dd>{root.sourceRevision}</dd></div>
          <div><dt>Original archived project</dt><dd>{root.archivedProjectId}</dd></div>
          <div><dt>Original archive source</dt><dd>{root.archiveRecord}</dd></div>
          <div><dt>Original archive route</dt><dd>{root.archiveRoute}</dd></div>
          <div><dt>Originally resolved Issues</dt><dd>{root.resolvedIssueIds.length > 0 ? root.resolvedIssueIds.join(", ") : "None"}</dd></div>
          <div><dt>Originally remaining Issues</dt><dd>{root.remainingIssueIds.length > 0 ? root.remainingIssueIds.join(", ") : "None"}</dd></div>
          <div><dt>Original canonical source</dt><dd>{root.sourcePath}</dd></div>
        </dl>
      </NarrativeSection>
    );
  }
  if (root.variant === "accepted_update") {
    return (
      <NarrativeSection heading="Immutable original narrative">
        <dl className="changelog-narrative__detail-fields">
          <div><dt>Original title</dt><dd><NarrativeText>{root.title}</NarrativeText></dd></div>
          <div><dt>Original history date</dt><dd>{root.changeDate}</dd></div>
          <div><dt>Why the change was needed</dt><dd><NarrativeText>{root.whyChangeWasNeeded}</NarrativeText></dd></div>
          <div><dt>What changed</dt><dd><NarrativeText>{root.changes}</NarrativeText></dd></div>
          <div><dt>Original accepted result</dt><dd><NarrativeText>{root.outcome}</NarrativeText></dd></div>
          <div><dt>Original evidence summary</dt><dd><NarrativeText>{root.acceptedEvidenceSummary}</NarrativeText></dd></div>
          <div><dt>Original evidence limits</dt><dd><NarrativeText>{root.acceptedEvidenceLimits}</NarrativeText></dd></div>
          <div><dt>Original review method</dt><dd><NarrativeText>{root.reviewMethod}</NarrativeText></dd></div>
          <div><dt>Original affected capabilities</dt><dd>{root.affectedCapabilities.join(", ")}</dd></div>
          <div><dt>Original owning capability</dt><dd>{root.owningCapability}</dd></div>
          <div><dt>Originally accepted on</dt><dd>{root.acceptedOn}</dd></div>
          <div><dt>Original acceptance reviewer</dt><dd>{root.acceptedBy}</dd></div>
          <div><dt>Original source revision</dt><dd>{root.sourceRevision}</dd></div>
          <div><dt>Original operational-record context</dt><dd>This change is recorded independently, without a linked work archive.</dd></div>
          <div><dt>Original canonical source</dt><dd>{root.sourcePath}</dd></div>
        </dl>
      </NarrativeSection>
    );
  }
  const original = root.originalRecord;
  return (
    <NarrativeSection heading="Immutable original Quality Hub record and migration metadata">
      <dl className="changelog-narrative__detail-fields">
        <div><dt>Original projected title</dt><dd><NarrativeText>{root.title}</NarrativeText></dd></div>
        <div><dt>Original projected Quality Hub summary</dt><dd><NarrativeText>{root.outcome}</NarrativeText></dd></div>
        <div><dt>Original history date</dt><dd>{root.changeDate}</dd></div>
        <div><dt>Original affected capabilities</dt><dd>{root.affectedCapabilities.length > 0 ? root.affectedCapabilities.join(", ") : "None"}</dd></div>
        <div><dt>Quality Hub ID</dt><dd>{original.id}</dd></div>
        <div><dt>Quality Hub title</dt><dd><NarrativeText>{original.title}</NarrativeText></dd></div>
        <div><dt>Preserved Quality Hub summary</dt><dd><NarrativeText>{original.summary}</NarrativeText></dd></div>
        <div><dt>Quality Hub severity</dt><dd>{original.severity}</dd></div>
        <div><dt>Quality Hub status</dt><dd>{original.status}</dd></div>
        <div><dt>Problem and impact</dt><dd><NarrativeText>{recordedOrFallback(original.problem, "Not recorded")}</NarrativeText></dd></div>
        <div><dt>Plan recorded at the time</dt><dd><NarrativeText>{recordedOrFallback(original.plan, "Not recorded")}</NarrativeText></dd></div>
        <div><dt>Detailed changes</dt><dd><NarrativeText>{recordedOrFallback(original.changes, "Not recorded")}</NarrativeText></dd></div>
        <div><dt>Files affected</dt><dd><NarrativeText>{listOrFallback(original.filesAffected, "None recorded").join("\n")}</NarrativeText></dd></div>
        <div><dt>Recorded agent</dt><dd>{recordedOrFallback(original.agent, "Not recorded")}</dd></div>
        <div><dt>Related Quality Hub findings</dt><dd>{original.relatedFindingIds.length > 0 ? original.relatedFindingIds.join(", ") : "None recorded"}</dd></div>
        <div><dt>Related Quality Hub runs</dt><dd>{(original.relatedRunIds ?? []).length > 0 ? original.relatedRunIds?.join(", ") : "None recorded"}</dd></div>
        <div><dt>Tags</dt><dd>{original.tags.length > 0 ? original.tags.join(", ") : "None recorded"}</dd></div>
        <div><dt>Comments</dt><dd><NarrativeText>{original.comments.length > 0 ? formatClarifiedValue(original.comments) : "None recorded"}</NarrativeText></dd></div>
        <div><dt>Created in Quality Hub</dt><dd>{original.createdAt}</dd></div>
        <div><dt>Last updated in Quality Hub</dt><dd>{original.updatedAt}</dd></div>
        <div><dt>Legacy source ID</dt><dd>{root.legacySourceId}</dd></div>
        <div><dt>Original source hash</dt><dd>{root.sourceHash}</dd></div>
        <div><dt>Original preserved record hash</dt><dd>{root.preservedRecordHash ?? "Not applicable"}</dd></div>
        <div><dt>Original privacy redactions</dt><dd><NarrativeText>{root.privacyRedactions.length > 0 ? formatClarifiedValue(root.privacyRedactions) : "None recorded"}</NarrativeText></dd></div>
        <div><dt>Original migration snapshot hash</dt><dd>{root.migrationSnapshotHash}</dd></div>
        <div><dt>Original import date</dt><dd>{root.importedOn}</dd></div>
        <div><dt>Original source lineage</dt><dd>{root.sourceLineage.join(", ")}</dd></div>
        <div><dt>Original migration receipt</dt><dd>{root.migrationReceipt}</dd></div>
        <div><dt>Original applicability evidence</dt><dd><NarrativeText>{root.applicabilityEvidence}</NarrativeText></dd></div>
        <div><dt>Original applicability review status</dt><dd>{root.applicabilityStatus}</dd></div>
        <div><dt>Original Community Gallery applicability</dt><dd>{root.galleryApplicability}</dd></div>
        <div><dt>Original provenance limit</dt><dd>{root.provenanceLimit}</dd></div>
        <div><dt>Original modern acceptance</dt><dd>{root.modernAcceptance}</dd></div>
        <div><dt>Original proof status</dt><dd>{root.proofStatus}</dd></div>
        <div><dt>Original canonical source</dt><dd>{root.sourcePath}</dd></div>
      </dl>
    </NarrativeSection>
  );
}

function LegacyDetail({ record }: { record: LegacyImportChangelogRecord }) {
  const original = record.originalRecord;
  const missing = "Not recorded in the original Quality Hub entry.";
  return (
    <div className="changelog-narrative__extended">
      <NarrativeSection heading="Plan recorded at the time">
        <NarrativeText>{recordedOrFallback(original.plan, missing)}</NarrativeText>
      </NarrativeSection>
      <NarrativeSection heading="Files affected">
        <ul className="changelog-narrative__value-list">
          {listOrFallback(original.filesAffected, "No affected files were recorded.").map((value) => (
            <li key={value}>{value}</li>
          ))}
        </ul>
      </NarrativeSection>
      <NarrativeSection heading="Historical references">
        <dl className="changelog-narrative__detail-fields">
          <div><dt>Quality Hub status</dt><dd>{original.status}</dd></div>
          <div><dt>Quality Hub severity</dt><dd>{original.severity}</dd></div>
          <div><dt>Recorded agent</dt><dd>{recordedOrFallback(original.agent, "Not recorded")}</dd></div>
          <div><dt>Related Quality Hub findings</dt><dd>{original.relatedFindingIds.length > 0 ? original.relatedFindingIds.join(", ") : "None recorded"}</dd></div>
          <div><dt>Related Quality Hub runs</dt><dd>{(original.relatedRunIds ?? []).length > 0 ? original.relatedRunIds?.join(", ") : "None recorded"}</dd></div>
          <div><dt>Tags</dt><dd>{original.tags.length > 0 ? original.tags.join(", ") : "None recorded"}</dd></div>
          <div><dt>Created in Quality Hub</dt><dd>{original.createdAt}</dd></div>
          <div><dt>Last updated in Quality Hub</dt><dd>{original.updatedAt}</dd></div>
        </dl>
      </NarrativeSection>
      <NarrativeSection heading="Historical comments">
        {original.comments.length > 0 ? (
          <ol className="changelog-narrative__comments">
            {original.comments.map((comment) => (
              <li key={comment.id}>
                <p><strong>{comment.author || "Author not recorded"}</strong> · {comment.timestamp}</p>
                <NarrativeText>{comment.text || "No comment text was recorded."}</NarrativeText>
              </li>
            ))}
          </ol>
        ) : (
          <p>No comments were recorded.</p>
        )}
      </NarrativeSection>
      <NarrativeSection heading="Provenance and migration">
        <dl className="changelog-narrative__detail-fields">
          <div><dt>Legacy source ID</dt><dd>{record.legacySourceId}</dd></div>
          <div><dt>Imported on</dt><dd>{record.importedOn}</dd></div>
          <div><dt>Source lineage</dt><dd>{record.sourceLineage.join(", ")}</dd></div>
          <div><dt>Migration receipt</dt><dd>{record.migrationReceipt}</dd></div>
          <div><dt>Applicability evidence</dt><dd>{record.applicabilityEvidence}</dd></div>
          <div><dt>Applicability review status</dt><dd>{record.applicabilityStatus}</dd></div>
          <div><dt>Community Gallery applicability</dt><dd>{record.galleryApplicability}</dd></div>
          <div><dt>Modern acceptance</dt><dd>Not assessed</dd></div>
          <div><dt>Historical proof</dt><dd>Not reverified</dd></div>
          <div><dt>Source hash</dt><dd>{record.sourceHash}</dd></div>
          <div><dt>Preserved record hash</dt><dd>{record.preservedRecordHash ?? "Not applicable — no privacy-safe replacement hash was required"}</dd></div>
          <div><dt>Migration snapshot hash</dt><dd>{record.migrationSnapshotHash}</dd></div>
          <div><dt>Provenance limit</dt><dd>{record.provenanceLimit}</dd></div>
          <div><dt>Canonical source record</dt><dd>{record.sourcePath}</dd></div>
          <div>
            <dt>Privacy redactions</dt>
            <dd>
              {record.privacyRedactions.length > 0
                ? record.privacyRedactions
                    .map((redaction) => `${redaction.field}: ${redaction.transformation}`)
                    .join("; ")
                : "None recorded"}
            </dd>
          </div>
        </dl>
      </NarrativeSection>
    </div>
  );
}

function AcceptedDetail({ entry }: { entry: EffectiveChangelogEntry }) {
  if (entry.effectiveRecord.variant === "legacy_import") return null;
  const record = entry.effectiveRecord;
  return (
    <div className="changelog-narrative__extended">
      <NarrativeSection heading="Acceptance and source state">
        <dl className="changelog-narrative__detail-fields">
          <div><dt>Accepted by</dt><dd>{record.acceptedBy}</dd></div>
          <div><dt>Accepted on</dt><dd>{record.acceptedOn}</dd></div>
          {record.variant === "accepted_closeout" ? (
            <div><dt>Acceptance proof</dt><dd>{record.acceptanceRef}</dd></div>
          ) : (
            <div><dt>Review method</dt><dd><NarrativeText>{record.reviewMethod}</NarrativeText></dd></div>
          )}
          <div><dt>Accepted source revision</dt><dd>{record.sourceRevision}</dd></div>
          <div><dt>Owning capability</dt><dd>{record.owningCapability}</dd></div>
          <div><dt>Affected capabilities</dt><dd>{record.affectedCapabilities.join(", ")}</dd></div>
          {record.variant === "accepted_closeout" ? (
            <>
              <div><dt>Archived project</dt><dd>{record.archivedProjectId}</dd></div>
              <div><dt>Archive source</dt><dd>{record.archiveRecord}</dd></div>
              <div><dt>Archive route</dt><dd>{record.archiveRoute}</dd></div>
            </>
          ) : (
            <div><dt>Operational record context</dt><dd>This change is recorded independently, without a linked work archive.</dd></div>
          )}
          <div><dt>Canonical source record</dt><dd>{record.sourcePath}</dd></div>
        </dl>
      </NarrativeSection>
    </div>
  );
}

export function ChangelogRecordNarrative({
  entry,
  mode,
  detailHref,
  verifiedArchiveRoute,
}: {
  entry: EffectiveChangelogEntry;
  mode: ChangelogNarrativeMode;
  detailHref: string;
  verifiedArchiveRoute: string | null;
}) {
  return (
    <>
      <header className="changelog-narrative__header">
        <HistoryDate entry={entry} />
        <h3>{entry.title}</h3>
        <RecordIdentity entry={entry} />
      </header>

      {mode === "preview" ? (
        <div className="changelog-narrative__preview">
          <h4>
            {entry.effectiveRecord.variant === "legacy_import"
              ? "Preserved Quality Hub summary preview"
              : "Accepted result preview"}
          </h4>
          <NarrativeText>{entry.outcome}</NarrativeText>
          <p className="changelog-narrative__detail-link">
            <Link to={detailHref}>Read complete record</Link>
          </p>
        </div>
      ) : (
        <>
          <PrimaryNarrative
            entry={entry}
            detailHref={detailHref}
            showDetailLink={mode === "primary"}
            verifiedArchiveRoute={verifiedArchiveRoute}
          />
          {mode === "detail" ? (
            <>
              {entry.effectiveRecord.variant !== "legacy_import" ? (
                <AcceptedDetail entry={entry} />
              ) : (
                <LegacyDetail record={entry.effectiveRecord} />
              )}
              <OriginalRecordBeforeCorrections entry={entry} />
              <NarrativeSection heading="Correction history">
                <CorrectionHistory
                  corrections={entry.appliedCorrections}
                  rootVariant={entry.variant}
                />
              </NarrativeSection>
            </>
          ) : null}
        </>
      )}
    </>
  );
}
