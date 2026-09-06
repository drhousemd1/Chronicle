import type { ReactNode } from "react";

import type { ChronicleCapabilityId } from "@/data/chronicle-knowledge-base/capability-ids";
import {
  compareIssueRecords,
  compareCurrentWorkProjects,
  getCurrentWorkBodyAfterResumeHere,
  type CurrentWorkRecord,
  type IssueRecord,
  type OperationalRecordRegistry,
} from "@/data/chronicle-knowledge-base/operational-record-contract";
import {
  buildArchivedCurrentWorkHref,
  buildKnowledgeBaseTabHref,
  buildQualityHubChangelogHref,
} from "@/data/chronicle-knowledge-base/knowledge-routes";
import {
  CHRONICLE_CHANGELOG_RECORDS_CHECKED_ON,
  type ChangelogRegistryLoader,
} from "@/data/chronicle-knowledge-base/changelog-record-sources";

import ChangelogRecordList from "./ChangelogRecordList";

type OperationalRecordContentProps = {
  kind: "issues" | "current-work" | "changelog";
  capabilityId: ChronicleCapabilityId;
  capabilityLabel: string;
  renderMarkdown: (source: string) => ReactNode;
  registry: OperationalRecordRegistry;
  changelogLoader?: ChangelogRegistryLoader;
};

const CURRENT_WORK_AUTHORITY =
  "This tab tracks active work for this capability. It does not define Chronicle’s intended behavior, replace the current architecture explanation, or prove that an issue is resolved. Read the stable capability documentation and the linked Issues or approved objective before acting.";

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
  capabilityId,
}: {
  issue: IssueRecord;
  registry: OperationalRecordRegistry;
  capabilityId: ChronicleCapabilityId;
}) {
  const activeProjects = registry.activeProjects.filter((project) =>
    project.linkedIssueIds.includes(issue.id),
  );
  const archivedProjects = registry.archivedProjects.filter((project) =>
    project.linkedIssueIds.includes(issue.id),
  );

  if (activeProjects.length > 0) {
    return (
      <a href={buildKnowledgeBaseTabHref(capabilityId, "current-work")}>
        Active Current Work: {activeProjects.map((project) => project.id).join(", ")}
      </a>
    );
  }
  if (archivedProjects.length > 0) {
    return (
      <span className="knowledge-issue-record__work-links">
        {archivedProjects.map((project, index) => (
          <span key={project.id}>
            {index > 0 ? ", " : ""}
            <a
              href={buildArchivedCurrentWorkHref(project.id)}
            >
              Archived Current Work: {project.id}
            </a>
          </span>
        ))}
      </span>
    );
  }
  return <>No Current Work record is linked.</>;
}

function IssueRecordArticle({
  issue,
  registry,
  capabilityId,
  renderMarkdown,
}: {
  issue: IssueRecord;
  registry: OperationalRecordRegistry;
  capabilityId: ChronicleCapabilityId;
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
          <div>
            <dt>Current Work relationship</dt>
            <dd>
              <IssueWorkRelationship
                issue={issue}
                registry={registry}
                capabilityId={capabilityId}
              />
            </dd>
          </div>
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

function ResumeField({
  label,
  value,
  renderMarkdown,
}: {
  label: string;
  value: string;
  renderMarkdown: (source: string) => ReactNode;
}) {
  return (
    <div className="knowledge-current-work__field">
      <dt>{label}</dt>
      <dd>{renderMarkdown(value)}</dd>
    </div>
  );
}

function CurrentWorkRecordArticle({
  project,
  renderMarkdown,
}: {
  project: CurrentWorkRecord;
  renderMarkdown: (source: string) => ReactNode;
}) {
  const titleId = `current-work-${project.id}-title`;
  const resume = project.resumeHere;
  return (
    <article
      className="knowledge-current-work"
      data-source-record={project.sourcePath}
      data-current-work-id={project.id}
      aria-labelledby={titleId}
    >
      <header className="knowledge-current-work__header">
        <p className="knowledge-current-work__id">{project.id}</p>
        <h2 id={titleId}>{project.title}</h2>
      </header>

      {project.needsStatusReview ? (
        <p className="knowledge-current-work__status-review">
          <strong>Needs status review:</strong> this project has no qualifying
          activity recorded within the review window. Its project status has
          not been changed automatically.
        </p>
      ) : null}

      <section className="knowledge-current-work__resume">
        <h3>Current State / Resume Here</h3>

        {project.currentWorkVersion === 2 && project.coreSummary ? (
          <section className="knowledge-current-work__group">
            <h4>Core resumable summary</h4>
            <dl>
              <ResumeField label="Purpose" value={project.coreSummary.purpose} renderMarkdown={renderMarkdown} />
              <ResumeField label="Objective and scope" value={project.coreSummary.objectiveAndScope} renderMarkdown={renderMarkdown} />
              <ResumeField label="Current status and coordinator" value={project.coreSummary.currentStatusAndCoordinator} renderMarkdown={renderMarkdown} />
              <ResumeField label="Latest verified result" value={project.coreSummary.latestVerifiedResult} renderMarkdown={renderMarkdown} />
              <ResumeField label="Exact next action" value={project.coreSummary.exactNextAction} renderMarkdown={renderMarkdown} />
              <ResumeField label="Blocker or decision" value={project.coreSummary.blockerOrDecision} renderMarkdown={renderMarkdown} />
              <ResumeField label="Strongest evidence and limits" value={project.coreSummary.strongestEvidenceAndLimits} renderMarkdown={renderMarkdown} />
              <ResumeField label="Source state and reading order" value={project.coreSummary.sourceStateAndReadingOrder} renderMarkdown={renderMarkdown} />
            </dl>
          </section>
        ) : (
          <>

        <section className="knowledge-current-work__group">
          <h4>Project and Status</h4>
          <dl>
            <ResumeField label="Project status" value={resume.projectStatus} renderMarkdown={renderMarkdown} />
            <ResumeField label="Status since" value={resume.statusSince} renderMarkdown={renderMarkdown} />
            <ResumeField label="Last recorded activity" value={resume.lastRecordedActivity} renderMarkdown={renderMarkdown} />
            <ResumeField label="Current coordinator/task" value={resume.currentCoordinatorTask} renderMarkdown={renderMarkdown} />
            <ResumeField label="Resume priority" value={resume.resumePriority} renderMarkdown={renderMarkdown} />
          </dl>
        </section>

        <section className="knowledge-current-work__group">
          <h4>Resume Point</h4>
          <dl>
            <ResumeField label="Latest completed result" value={resume.latestCompletedResult} renderMarkdown={renderMarkdown} />
            <ResumeField label="Where work stopped" value={resume.whereWorkStopped} renderMarkdown={renderMarkdown} />
            <ResumeField label="Remaining work" value={resume.remainingWork} renderMarkdown={renderMarkdown} />
            <ResumeField label="Next action" value={resume.nextAction} renderMarkdown={renderMarkdown} />
          </dl>
        </section>

        <section className="knowledge-current-work__group">
          <h4>Evidence and Uncertainty</h4>
          <dl>
            <ResumeField label="Best current evidence" value={resume.bestCurrentEvidence} renderMarkdown={renderMarkdown} />
            <ResumeField label="Not yet proven or needing re-check" value={resume.notYetProvenOrNeedingRecheck} renderMarkdown={renderMarkdown} />
          </dl>
        </section>

        <section className="knowledge-current-work__group">
          <h4>Ownership and Blockers</h4>
          <dl>
            <ResumeField label="Blocking condition" value={resume.blockingCondition} renderMarkdown={renderMarkdown} />
            <ResumeField label="Unblock condition" value={resume.unblockCondition} renderMarkdown={renderMarkdown} />
            <ResumeField label="External decision/action" value={resume.externalDecisionAction} renderMarkdown={renderMarkdown} />
            <ResumeField label="Status reason" value={resume.statusReason} renderMarkdown={renderMarkdown} />
            <ResumeField label="Controlling history entry" value={resume.controllingHistoryEntry} renderMarkdown={renderMarkdown} />
          </dl>
        </section>

        <section className="knowledge-current-work__group">
          <h4>Source and Reading Order</h4>
          <dl>
            <ResumeField label="Source state to re-check" value={resume.sourceStateToRecheck} renderMarkdown={renderMarkdown} />
            <ResumeField label="Read first" value={resume.readFirst} renderMarkdown={renderMarkdown} />
            <ResumeField label="Scope guard" value={resume.scopeGuard} renderMarkdown={renderMarkdown} />
          </dl>
        </section>
          </>
        )}
      </section>

      <div className="knowledge-current-work__history">
        {renderMarkdown(getCurrentWorkBodyAfterResumeHere(project.body))}
      </div>
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
    const issues = [...registry.issues].sort(compareIssueRecords);
    const openIssues = issues.filter((issue) => issue.status === "open");
    const resolvedIssues = issues.filter((issue) => issue.status === "resolved");
    const openIssuesHeadingId = `${capabilityId}-open-issues-heading`;
    const resolvedIssuesHeadingId = `${capabilityId}-resolved-issues-heading`;
    return (
      <>
        <h1>Identified Issues</h1>
        {issues.length === 0 ? (
          <p>
            No verified {capabilityLabel} Issue records are currently loaded.
            This empty state does not prove that the capability has no defects.
          </p>
        ) : (
          <div className="knowledge-issue-groups">
            {openIssues.length > 0 ? (
              <section
                className="knowledge-issue-group"
                aria-labelledby={openIssuesHeadingId}
              >
                <h2 id={openIssuesHeadingId}>Open Issues</h2>
                <div className="knowledge-issue-group__records">
                  {openIssues.map((issue) => (
                    <IssueRecordArticle
                      key={issue.id}
                      issue={issue}
                      registry={registry}
                      capabilityId={capabilityId}
                      renderMarkdown={renderMarkdown}
                    />
                  ))}
                </div>
              </section>
            ) : null}
            {resolvedIssues.length > 0 ? (
              <section
                className="knowledge-issue-group"
                aria-labelledby={resolvedIssuesHeadingId}
              >
                <h2 id={resolvedIssuesHeadingId}>Resolved Issues</h2>
                <div className="knowledge-issue-group__records">
                  {resolvedIssues.map((issue) => (
                    <IssueRecordArticle
                      key={issue.id}
                      issue={issue}
                      registry={registry}
                      capabilityId={capabilityId}
                      renderMarkdown={renderMarkdown}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </>
    );
  }

  if (kind === "current-work") {
    const activeProjects = [...registry.activeProjects].sort(
      compareCurrentWorkProjects,
    );

    return (
      <>
        <blockquote>
          <p>{CURRENT_WORK_AUTHORITY}</p>
        </blockquote>
        <h1>{capabilityLabel} Current Work</h1>
        <OperationalRecordsCheckedDate asOf={registry.asOf} />
        {activeProjects.length === 0 ? (
          <p>
            No active, paused, blocked, deferred, or closeout-pending work is
            recorded for {capabilityLabel} as of {registry.asOf}.
          </p>
        ) : (
          activeProjects.map((project) => (
            <CurrentWorkRecordArticle
              key={project.id}
              project={project}
              renderMarkdown={renderMarkdown}
            />
          ))
        )}
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
