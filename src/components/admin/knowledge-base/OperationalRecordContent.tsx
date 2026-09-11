import type { ReactNode } from "react";

import type { ChronicleCapabilityId } from "@/data/chronicle-knowledge-base/capability-ids";
import {
  compareIssueRecords,
  type IssueRecord,
  type OperationalRecordRegistry,
} from "@/data/chronicle-knowledge-base/operational-record-contract";
import {
  buildArchivedCurrentWorkHref,
  buildQualityHubChangelogHref,
} from "@/data/chronicle-knowledge-base/knowledge-routes";
import {
  CHRONICLE_CHANGELOG_RECORDS_CHECKED_ON,
  type ChangelogRegistryLoader,
} from "@/data/chronicle-knowledge-base/changelog-record-sources";

import ChangelogRecordList from "./ChangelogRecordList";

type OperationalRecordContentProps = {
  kind: "issues" | "changelog";
  capabilityId: ChronicleCapabilityId;
  capabilityLabel: string;
  renderMarkdown: (source: string) => ReactNode;
  registry: OperationalRecordRegistry;
  changelogLoader?: ChangelogRegistryLoader;
};

function OperationalRecordsCheckedDate({ asOf }: { asOf: string }) {
  return (
    <p>
      <strong>Operational records checked:</strong>{" "}
      <time dateTime={asOf}>{asOf}</time>
    </p>
  );
}

function ChangelogFilesCheckedDate({ asOf }: { asOf: string }) {
  return (
    <div className="knowledge-changelog-check">
      <p>
        <strong>Changelog files structurally checked:</strong>{" "}
        <time dateTime={asOf}>{asOf}</time>
      </p>
      <p>
        This date records when the repository Changelog files passed structural
        validation. It is not a change date and does not prove that every
        historical record was factually reverified.
      </p>
    </div>
  );
}

function IssueWorkRelationship({
  issue,
  registry,
}: {
  issue: IssueRecord;
  registry: OperationalRecordRegistry;
}) {
  const archivedProjects = registry.archivedProjects.filter((project) =>
    project.linkedIssueIds.includes(issue.id),
  );

  if (archivedProjects.length > 0) {
    return (
      <span className="knowledge-issue-record__work-links">
        {archivedProjects.map((project, index) => (
          <span key={project.id}>
            {index > 0 ? ", " : ""}
            <a
              href={buildArchivedCurrentWorkHref(project.id)}
            >
              Historical work record: {project.id}
            </a>
          </span>
        ))}
      </span>
    );
  }
  return null;
}

function IssueRecordArticle({
  issue,
  registry,
  renderMarkdown,
}: {
  issue: IssueRecord;
  registry: OperationalRecordRegistry;
  renderMarkdown: (source: string) => ReactNode;
}) {
  const titleId = `issue-${issue.id}-title`;
  return (
    <article
      className="knowledge-issue-record"
      aria-labelledby={titleId}
      data-source-record={issue.sourcePath}
      data-issue-id={issue.id}
    >
      <header className="knowledge-issue-record__header">
        <p className="knowledge-issue-record__id">{issue.id}</p>
        <h3 id={titleId}>{issue.title}</h3>
        <dl className="knowledge-issue-record__metadata">
          <div>
            <dt>Status</dt>
            <dd>{issue.status === "open" ? "Open" : "Resolved"}</dd>
          </div>
          <div>
            <dt>Identified</dt>
            <dd>
              <time dateTime={issue.discoveredOn}>{issue.discoveredOn}</time>
            </dd>
          </div>
          <div>
            <dt>Last verified</dt>
            <dd>
              <time dateTime={issue.lastVerifiedOn}>{issue.lastVerifiedOn}</time>
            </dd>
          </div>
          {registry.archivedProjects.some((project) => project.linkedIssueIds.includes(issue.id)) && <div>
            <dt>Related history</dt>
            <dd>
              <IssueWorkRelationship
                issue={issue}
                registry={registry}
              />
            </dd>
          </div>}
        </dl>
      </header>

      <section className="knowledge-issue-record__section">
        <h4>Expected Behavior</h4>
        {renderMarkdown(issue.content.expectedBehavior)}
      </section>

      <section className="knowledge-issue-record__section">
        <h4>Problem</h4>
        <div className="knowledge-issue-record__subsection">
          <h5>Current Behavior</h5>
          {renderMarkdown(issue.content.currentBehavior)}
        </div>
        <div className="knowledge-issue-record__subsection">
          <h5>Why This Is a Problem</h5>
          {renderMarkdown(issue.content.whyThisIsAProblem)}
        </div>
      </section>

      <section className="knowledge-issue-record__section">
        <h4>Evidence and Verification</h4>
        <div className="knowledge-issue-record__subsection">
          <h5>Supporting Evidence</h5>
          {renderMarkdown(issue.content.supportingEvidence)}
        </div>
        <div className="knowledge-issue-record__subsection">
          <h5>What This Evidence Establishes</h5>
          {renderMarkdown(issue.content.whatThisEvidenceEstablishes)}
        </div>
        <div className="knowledge-issue-record__subsection">
          <h5>What Remains Unverified</h5>
          {renderMarkdown(issue.content.whatRemainsUnverified)}
        </div>
      </section>

      {issue.content.resolution ? (
        <section className="knowledge-issue-record__section">
          <h4>Resolution</h4>
          {renderMarkdown(issue.content.resolution)}
        </section>
      ) : null}
    </article>
  );
}

export function OperationalRecordContent({
  kind,
  capabilityId,
  capabilityLabel,
  renderMarkdown,
  registry,
  changelogLoader,
}: OperationalRecordContentProps) {
  if (kind === "issues") {
    const openIssues = registry.issues
      .filter((issue) => issue.status === "open")
      .sort(compareIssueRecords);
    if (openIssues.length === 0) return null;
    return (
      <>
        <h1>Identified Issues</h1>
        <div className="knowledge-issue-group__records">
          {openIssues.map((issue) => (
            <IssueRecordArticle
              key={issue.id}
              issue={issue}
              registry={registry}
              renderMarkdown={renderMarkdown}
            />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <h1>{capabilityLabel} Changelog</h1>
      <ChangelogFilesCheckedDate asOf={CHRONICLE_CHANGELOG_RECORDS_CHECKED_ON} />
      <p>
        This history is filtered from Chronicle&apos;s one repository-owned
        Changelog. It includes only records positively verified to affect{" "}
        {capabilityLabel}; historical Quality Hub status is not presented as
        modern product acceptance.
      </p>
      <p>
        Each record explains what was broken, why the work was needed, what
        changed, and what result or verification limit was recorded. The linked
        complete record preserves the deeper technical history.
      </p>
      <p>
        <a href={buildQualityHubChangelogHref(capabilityId)}>
          Open the same {capabilityLabel} history in Quality Hub
        </a>
      </p>
      <ChangelogRecordList
        capability={capabilityId}
        detailScope={capabilityId}
        detailOrigin="knowledge-base"
        loader={changelogLoader}
        operationalRegistry={registry}
        scopeLabel={`${capabilityLabel} records from the canonical Chronicle Changelog.`}
        emptyMessage={`No canonical Changelog records are currently verified as affecting ${capabilityLabel}.`}
      />
    </>
  );
}
