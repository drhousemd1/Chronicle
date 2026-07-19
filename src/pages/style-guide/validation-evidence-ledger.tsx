import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
  ROLEPLAY_PIPELINE_LEDGER_DEV_PATH,
  ROLEPLAY_PIPELINE_REPORT_DEV_PATH,
  type DerivedValidationGate,
  type ValidationEvidenceLedgerSnapshot,
} from '@/features/validation-evidence/ledger';

type LedgerLoadState = 'loading' | 'ready' | 'missing' | 'error' | 'unavailable';

const styles = `
:root { color-scheme: dark; }
body { background: #111113; }
.validation-ledger-page { min-height: 100vh; background: #111113; color: #eaedf1; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", ui-sans-serif, system-ui, sans-serif; }
.validation-ledger-header { position: sticky; top: 0; z-index: 20; min-height: 64px; border-bottom: 1px solid #e0e0e0; background: rgba(255,255,255,.95); backdrop-filter: blur(10px); box-shadow: 0 2px 8px rgba(15,23,42,.04); display: flex; align-items: center; gap: 18px; padding: 14px 24px; }
.validation-ledger-back { display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; border: 0; border-radius: 999px; background: transparent; color: #202329; cursor: pointer; }
.validation-ledger-header h1 { margin: 0; color: #202329; font-size: 18px; font-weight: 950; letter-spacing: .02em; line-height: 1.1; text-transform: uppercase; }
.validation-ledger-main { width: min(1480px, calc(100vw - 48px)); margin: 0 auto; padding: 26px 0 44px; }
.validation-ledger-panel { background: #2a2a2f; border-radius: 24px; box-shadow: 0 12px 32px -2px rgba(0,0,0,.5), inset 1px 1px 0 rgba(255,255,255,.09); overflow: hidden; }
.validation-ledger-panel + .validation-ledger-panel { margin-top: 18px; }
.validation-ledger-panel-header { position: relative; overflow: hidden; background: linear-gradient(180deg,#5a7292 0%,#4a5f7f 100%); border-top: 1px solid rgba(255,255,255,.2); padding: 14px 20px 13px; }
.validation-ledger-panel-header h2 { margin: 0; color: #fff; font-size: 21px; font-weight: 800; letter-spacing: -.02em; line-height: 1.15; }
.validation-ledger-body { padding: 18px 20px 20px; }
.validation-ledger-intro { max-width: 1120px; color: #a1a1aa; font-size: 14px; font-weight: 650; line-height: 1.55; margin: 0; }
.validation-ledger-scope { margin-top: 12px; color: #d4d4d8; font-size: 13px; font-weight: 750; }
.validation-ledger-summary { display: grid; grid-template-columns: repeat(auto-fit,minmax(130px,1fr)); gap: 12px; margin-top: 14px; }
.validation-ledger-summary-cell,.validation-ledger-empty,.validation-ledger-report { background: #1c1c1f; border: 1px solid rgba(255,255,255,.05); border-radius: 16px; box-shadow: inset 0 3px 10px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.05); }
.validation-ledger-summary-cell { padding: 13px 14px; }
.validation-ledger-summary-cell strong { display: block; font-size: 27px; line-height: 1; letter-spacing: -.05em; margin-bottom: 6px; }
.validation-ledger-summary-cell span { color: #a1a1aa; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: .14em; }
.validation-ledger-table-wrap { overflow-x: auto; background: #1c1c1f; }
.validation-ledger-table { width: 100%; min-width: 1250px; border-collapse: collapse; table-layout: fixed; }
.validation-ledger-table th,.validation-ledger-table td { border-bottom: 1px solid rgba(255,255,255,.08); padding: 13px 14px; text-align: left; vertical-align: top; }
.validation-ledger-table th { background: #2e2e33; color: #fff; font-size: 11px; font-weight: 950; letter-spacing: .08em; text-transform: uppercase; white-space: nowrap; }
.validation-ledger-table td { color: #d4d4d8; font-size: 13px; font-weight: 650; line-height: 1.45; word-break: break-word; }
.validation-ledger-table tbody tr:hover td { background: rgba(255,255,255,.025); }
.validation-ledger-state-passing,.validation-ledger-state-manual_approved { color: #86efac; }
.validation-ledger-state-failing,.validation-ledger-state-error,.validation-ledger-state-manual_rejected,.validation-ledger-state-unexpected_pass { color: #fca5a5; }
.validation-ledger-state-expected_red_demonstrated,.validation-ledger-state-manual_pending { color: #fcd34d; }
.validation-ledger-state-not_run,.validation-ledger-state-blocked,.validation-ledger-state-superseded { color: #a1a1aa; }
.validation-ledger-view { border: 0; border-radius: 10px; background: #3c3e47; color: #eaedf1; cursor: pointer; font-size: 12px; font-weight: 850; padding: 8px 10px; }
.validation-ledger-view:disabled { cursor: not-allowed; opacity: .45; }
.validation-ledger-empty { margin: 18px; padding: 26px; text-align: center; }
.validation-ledger-empty strong { display: block; color: #fff; font-size: 20px; line-height: 1.2; margin-bottom: 8px; }
.validation-ledger-empty p { color: #a1a1aa; font-size: 14px; font-weight: 650; line-height: 1.55; margin: 0 auto; max-width: 760px; }
.validation-ledger-reconciliation-list { margin: 14px 0 0; padding-left: 20px; color: #d4d4d8; line-height: 1.55; }
.validation-ledger-modal-backdrop { position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.72); padding: 24px; }
.validation-ledger-modal { width: min(1000px,100%); max-height: min(780px,calc(100vh - 48px)); overflow: hidden; border-radius: 24px; background: #2a2a2f; box-shadow: 0 24px 80px rgba(0,0,0,.68), inset 1px 1px 0 rgba(255,255,255,.09); }
.validation-ledger-modal-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; padding: 22px 24px 16px; border-bottom: 1px solid rgba(255,255,255,.08); }
.validation-ledger-modal-header h2 { margin: 0; color: #fff; font-size: 24px; font-weight: 900; letter-spacing: -.03em; }
.validation-ledger-close { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; width: 40px; height: 40px; border: 0; border-radius: 999px; background: #1c1c1f; color: #fff; cursor: pointer; }
.validation-ledger-report { margin: 20px 24px 24px; max-height: 560px; overflow: auto; padding: 18px; }
.validation-ledger-report pre { margin: 0; white-space: pre-wrap; word-break: break-word; color: #e4e4e7; font-size: 12px; line-height: 1.6; }
@media (max-width:820px) { .validation-ledger-main { width:min(100% - 24px,1480px); padding-top:16px; } .validation-ledger-header h1 { white-space:normal; } }
`;

function sourceIdentity(snapshot: ValidationEvidenceLedgerSnapshot) {
  if (snapshot.sourceState !== 'clean' || !snapshot.sourceRevision) return `${snapshot.sourceState}; exact revision unavailable`;
  return snapshot.sourceRevision;
}

export default function ValidationEvidenceLedgerPage() {
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<ValidationEvidenceLedgerSnapshot | null>(null);
  const [loadState, setLoadState] = useState<LedgerLoadState>('loading');
  const [selectedGate, setSelectedGate] = useState<DerivedValidationGate | null>(null);
  const [selectedReport, setSelectedReport] = useState<unknown>(null);
  const gates = useMemo(() => snapshot?.gates ?? [], [snapshot]);

  useEffect(() => {
    let cancelled = false;
    if (!import.meta.env.DEV) {
      setLoadState('unavailable');
      return () => { cancelled = true; };
    }

    async function loadLedger() {
      try {
        const response = await fetch(ROLEPLAY_PIPELINE_LEDGER_DEV_PATH, { cache: 'no-store' });
        if (!response.ok) {
          if (!cancelled) setLoadState('missing');
          return;
        }
        const value = await response.json() as ValidationEvidenceLedgerSnapshot;
        if (!cancelled) {
          setSnapshot(value);
          setLoadState('ready');
        }
      } catch {
        if (!cancelled) setLoadState('error');
      }
    }
    void loadLedger();
    return () => { cancelled = true; };
  }, []);

  async function openGate(gate: DerivedValidationGate) {
    setSelectedGate(gate);
    setSelectedReport(null);
    const executionId = gate.latestExecution?.executionId;
    if (!executionId) return;
    try {
      const response = await fetch(`${ROLEPLAY_PIPELINE_REPORT_DEV_PATH}?executionId=${encodeURIComponent(executionId)}`, { cache: 'no-store' });
      if (response.ok) setSelectedReport(await response.json());
    } catch {
      setSelectedReport({ error: 'Raw report could not be loaded.' });
    }
  }

  const summary = snapshot?.summary;

  return (
    <div className="validation-ledger-page">
      <style>{styles}</style>
      <header className="validation-ledger-header">
        <button type="button" className="validation-ledger-back" aria-label="Back to Admin" onClick={() => navigate('/?tab=admin')}>
          <ChevronLeft size={26} strokeWidth={3} />
        </button>
        <h1>Validation Evidence Ledger</h1>
      </header>

      <main className="validation-ledger-main">
        <section className="validation-ledger-panel" aria-labelledby="validation-ledger-title">
          <div className="validation-ledger-panel-header"><h2 id="validation-ledger-title">Local Roleplay Validation Scope</h2></div>
          <div className="validation-ledger-body">
            <p className="validation-ledger-intro">
              This development-only surface derives current gate status from repository-owned definitions, append-only automated executions, and separate manual reviews. Missing executions appear as Not Run; expected-red remains a failed execution rather than a green pass.
            </p>
            {snapshot ? <p className="validation-ledger-scope">Scope: {snapshot.activeScopeId} · Source: {sourceIdentity(snapshot)}</p> : null}
            {summary ? (
              <div className="validation-ledger-summary" aria-label="Validation gate summary">
                {[
                  [summary.activeGates, 'Active gates'],
                  [summary.passing, 'Passing green'],
                  [summary.expectedRedDemonstrated, 'Expected red'],
                  [summary.failing, 'Unexpected failures'],
                  [summary.errors, 'Errors'],
                  [summary.notRun, 'Not run'],
                  [summary.manualPending, 'Manual pending'],
                  [summary.freshnessUnknown, 'Freshness unknown'],
                  [summary.orphanedLegacyEvidence, 'Legacy orphans'],
                ].map(([value, label]) => (
                  <div className="validation-ledger-summary-cell" key={label}><strong>{value}</strong><span>{label}</span></div>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="validation-ledger-panel" aria-labelledby="roleplay-gates-title">
          <div className="validation-ledger-panel-header"><h2 id="roleplay-gates-title">Validation Gates</h2></div>
          <div className="validation-ledger-table-wrap">
            <table className="validation-ledger-table" aria-label="Roleplay validation gates">
              <colgroup>
                <col style={{ width: '190px' }} /><col style={{ width: '255px' }} /><col style={{ width: '90px' }} />
                <col style={{ width: '165px' }} /><col style={{ width: '100px' }} /><col style={{ width: '215px' }} />
                <col style={{ width: '100px' }} /><col style={{ width: '90px' }} />
              </colgroup>
              <thead><tr><th>Issue</th><th>Validation phase</th><th>Kind</th><th>Derived status</th><th>Freshness</th><th>Latest execution</th><th>History</th><th>Evidence</th></tr></thead>
              <tbody>
                {gates.map((gate) => (
                  <tr key={gate.definition.gateId}>
                    <td>Issue #{gate.definition.issueNumber}: {gate.definition.issueTitle}</td>
                    <td>{gate.definition.validationPhase}</td>
                    <td>{gate.definition.evidenceKind}</td>
                    <td className={`validation-ledger-state-${gate.state}`}>{gate.stateLabel}</td>
                    <td>{gate.freshness}</td>
                    <td>{gate.latestExecution ? `${gate.latestExecution.result} · exit ${gate.latestExecution.processExitCode ?? 'unknown'}` : gate.latestManualReview?.outcome ?? 'No execution'}</td>
                    <td>{gate.executionHistory.length} automated · {gate.manualReviewHistory.length} manual</td>
                    <td><button type="button" className="validation-ledger-view" onClick={() => void openGate(gate)}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loadState === 'loading' ? <div className="validation-ledger-empty" role="status"><strong>Loading local validation evidence...</strong><p>Chronicle is deriving the current gate view from local append-only evidence.</p></div> : null}
            {loadState === 'unavailable' ? <div className="validation-ledger-empty" role="status"><strong>Validation evidence is available only in local development.</strong><p>No ledger or raw report is included in Chronicle production builds.</p></div> : null}
            {(loadState === 'missing' || loadState === 'error') ? <div className="validation-ledger-empty" role="status"><strong>Local validation evidence could not be loaded.</strong><p>Run the local development server and the approved evidence commands. This is not proof that any gate passed.</p></div> : null}
          </div>
        </section>

        {snapshot?.reconciliation ? (
          <section className="validation-ledger-panel" aria-labelledby="legacy-reconciliation-title">
            <div className="validation-ledger-panel-header"><h2 id="legacy-reconciliation-title">Legacy Reconciliation</h2></div>
            <div className="validation-ledger-body">
              <p className="validation-ledger-intro">Matched legacy rows retain unknown freshness unless an exact tested source revision is available. Unmatched rows remain orphaned rather than being forced into gate definitions.</p>
              <ul className="validation-ledger-reconciliation-list">
                <li>{snapshot.reconciliation.matched} matched of {snapshot.reconciliation.totalRows} legacy rows.</li>
                <li>{snapshot.reconciliation.orphaned} orphaned rows and {snapshot.reconciliation.malformed} malformed rows.</li>
                <li>{snapshot.reconciliation.missingReports.length} missing reports and {snapshot.reconciliation.orphanReports.length} orphan reports.</li>
              </ul>
            </div>
          </section>
        ) : null}
      </main>

      {selectedGate ? (
        <div className="validation-ledger-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="validation-ledger-modal-title">
          <div className="validation-ledger-modal">
            <div className="validation-ledger-modal-header">
              <h2 id="validation-ledger-modal-title">{selectedGate.definition.gateId}</h2>
              <button type="button" className="validation-ledger-close" aria-label="Close report preview" onClick={() => setSelectedGate(null)}><X size={22} strokeWidth={3} /></button>
            </div>
            <div className="validation-ledger-report">
              <pre>{JSON.stringify({ gate: selectedGate, rawReport: selectedReport }, null, 2)}</pre>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
