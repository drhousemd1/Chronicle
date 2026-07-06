import { useMemo, useState } from "react";
import { ChevronLeft, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

type ValidationResult = "Pass" | "Fail" | "Partial" | "Not Run";

type ValidationEvidenceRow = {
  id: string;
  issue: string;
  validationPhase: string;
  proves: string;
  fixtureOrCommand: string;
  runs: number;
  lastResult: ValidationResult;
  failureSummary: string;
  evidenceFile: string;
  manualReview: string;
  report?: unknown;
};

const validationRows: ValidationEvidenceRow[] = [];

const styles = `
:root {
  color-scheme: dark;
}

body {
  background: #111113;
}

.validation-ledger-page {
  min-height: 100vh;
  background: #111113;
  color: #eaedf1;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", ui-sans-serif, system-ui, sans-serif;
}

.validation-ledger-header {
  position: sticky;
  top: 0;
  z-index: 20;
  min-height: 64px;
  border-bottom: 1px solid #e0e0e0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 14px 24px;
}

.validation-ledger-back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #202329;
  cursor: pointer;
}

.validation-ledger-header h1 {
  margin: 0;
  color: #202329;
  font-size: 18px;
  font-weight: 950;
  letter-spacing: .02em;
  line-height: 1.1;
  text-transform: uppercase;
  white-space: nowrap;
}

.validation-ledger-main {
  width: min(1480px, calc(100vw - 48px));
  margin: 0 auto;
  padding: 26px 0 44px;
}

.validation-ledger-panel {
  background: #2a2a2f;
  border-radius: 24px;
  box-shadow: 0 12px 32px -2px rgba(0,0,0,0.50), inset 1px 1px 0 rgba(255,255,255,0.09), inset -1px -1px 0 rgba(0,0,0,0.35);
  overflow: hidden;
}

.validation-ledger-panel + .validation-ledger-panel {
  margin-top: 18px;
}

.validation-ledger-panel-header {
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, #5a7292 0%, #4a5f7f 100%);
  border-top: 1px solid rgba(255,255,255,0.20);
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.30);
  padding: 14px 20px 13px;
}

.validation-ledger-panel-header::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 32%);
  pointer-events: none;
}

.validation-ledger-panel-header h2 {
  position: relative;
  z-index: 1;
  margin: 0;
  color: #ffffff;
  font-size: 21px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.validation-ledger-body {
  padding: 18px 20px 20px;
}

.validation-ledger-intro {
  max-width: 1120px;
  color: #a1a1aa;
  font-size: 14px;
  font-weight: 650;
  line-height: 1.55;
  margin: 0;
}

.validation-ledger-summary {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.validation-ledger-summary-cell,
.validation-ledger-empty,
.validation-ledger-report {
  background: #1c1c1f;
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 16px;
  box-shadow: inset 0 3px 10px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05);
}

.validation-ledger-summary-cell {
  padding: 13px 14px;
}

.validation-ledger-summary-cell strong {
  display: block;
  font-size: 27px;
  line-height: 1;
  letter-spacing: -0.05em;
  margin-bottom: 6px;
}

.validation-ledger-summary-cell span {
  color: #a1a1aa;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: .14em;
}

.validation-ledger-table-wrap {
  overflow-x: auto;
  background: #1c1c1f;
}

.validation-ledger-table {
  width: 100%;
  min-width: 1280px;
  border-collapse: collapse;
  table-layout: fixed;
}

.validation-ledger-table th,
.validation-ledger-table td {
  border-bottom: 1px solid rgba(255,255,255,.08);
  padding: 13px 14px;
  text-align: left;
  vertical-align: top;
}

.validation-ledger-table th {
  background: #2e2e33;
  color: #ffffff;
  font-size: 11px;
  font-weight: 950;
  letter-spacing: .08em;
  text-transform: uppercase;
  white-space: nowrap;
}

.validation-ledger-table td {
  color: #d4d4d8;
  font-size: 13px;
  font-weight: 650;
  line-height: 1.45;
}

.validation-ledger-table tbody tr:hover td {
  background: rgba(255,255,255,0.025);
}

.validation-ledger-result-pass {
  color: #86efac;
}

.validation-ledger-result-fail {
  color: #fca5a5;
}

.validation-ledger-result-partial {
  color: #fcd34d;
}

.validation-ledger-result-not-run {
  color: #a1a1aa;
}

.validation-ledger-view {
  border: 0;
  border-radius: 10px;
  background: #3c3e47;
  color: #eaedf1;
  cursor: pointer;
  font-size: 12px;
  font-weight: 850;
  padding: 8px 10px;
  transition: filter .15s ease;
}

.validation-ledger-view:hover {
  filter: brightness(1.12);
}

.validation-ledger-empty {
  margin: 18px;
  padding: 26px;
  text-align: center;
}

.validation-ledger-empty strong {
  display: block;
  color: #ffffff;
  font-size: 20px;
  line-height: 1.2;
  margin-bottom: 8px;
}

.validation-ledger-empty p {
  color: #a1a1aa;
  font-size: 14px;
  font-weight: 650;
  line-height: 1.55;
  margin: 0 auto;
  max-width: 760px;
}

.validation-ledger-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,.72);
  padding: 24px;
}

.validation-ledger-modal {
  width: min(1000px, 100%);
  max-height: min(780px, calc(100vh - 48px));
  overflow: hidden;
  border-radius: 24px;
  background: #2a2a2f;
  box-shadow: 0 24px 80px rgba(0,0,0,.68), inset 1px 1px 0 rgba(255,255,255,0.09);
}

.validation-ledger-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 22px 24px 16px;
  border-bottom: 1px solid rgba(255,255,255,.08);
}

.validation-ledger-modal-header h2 {
  margin: 0;
  color: #ffffff;
  font-size: 24px;
  font-weight: 900;
  letter-spacing: -0.03em;
}

.validation-ledger-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 999px;
  background: #1c1c1f;
  color: #ffffff;
  cursor: pointer;
}

.validation-ledger-report {
  margin: 20px 24px 24px;
  max-height: 560px;
  overflow: auto;
  padding: 18px;
}

.validation-ledger-report pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: #e4e4e7;
  font-size: 12px;
  line-height: 1.6;
}

@media (max-width: 820px) {
  .validation-ledger-main {
    width: min(100% - 24px, 1480px);
    padding-top: 16px;
  }

  .validation-ledger-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .validation-ledger-header h1 {
    white-space: normal;
  }
}
`;

function resultClass(result: ValidationResult) {
  if (result === "Pass") return "validation-ledger-result-pass";
  if (result === "Fail") return "validation-ledger-result-fail";
  if (result === "Partial") return "validation-ledger-result-partial";
  return "validation-ledger-result-not-run";
}

export default function ValidationEvidenceLedgerPage() {
  const navigate = useNavigate();
  const [selectedRow, setSelectedRow] = useState<ValidationEvidenceRow | null>(null);
  const summary = useMemo(() => {
    return validationRows.reduce(
      (acc, row) => {
        acc.totalRows += 1;
        acc.totalRuns += row.runs;
        if (row.lastResult === "Pass") acc.passed += 1;
        if (row.lastResult === "Fail") acc.failed += 1;
        if (row.lastResult === "Not Run") acc.notRun += 1;
        return acc;
      },
      { totalRows: 0, passed: 0, failed: 0, notRun: 0, totalRuns: 0 },
    );
  }, []);

  return (
    <div className="validation-ledger-page">
      <style>{styles}</style>
      <header className="validation-ledger-header">
        <button
          type="button"
          className="validation-ledger-back"
          aria-label="Back to Admin"
          onClick={() => navigate("/?tab=admin")}
        >
          <ChevronLeft size={26} strokeWidth={3} />
        </button>
        <h1>Validation Evidence Ledger</h1>
      </header>

      <main className="validation-ledger-main">
        <section className="validation-ledger-panel" aria-labelledby="validation-ledger-title">
          <div className="validation-ledger-panel-header">
            <h2 id="validation-ledger-title">Codebase Validation Evidence Ledger</h2>
          </div>
          <div className="validation-ledger-body">
            <p className="validation-ledger-intro">
              This admin tool is the evidence surface for deterministic validation runs. It should show which
              tests ran, what they proved, where the raw report lives, and why a failed row failed. Rows should
              come from real validation output only; this shell intentionally starts empty until the roleplay
              runtime proof commands and JSON artifacts exist.
            </p>

            <div className="validation-ledger-summary" aria-label="Validation evidence summary">
              <div className="validation-ledger-summary-cell">
                <strong>{summary.totalRows}</strong>
                <span>Evidence rows</span>
              </div>
              <div className="validation-ledger-summary-cell">
                <strong>{summary.passed}</strong>
                <span>Passing rows</span>
              </div>
              <div className="validation-ledger-summary-cell">
                <strong>{summary.failed}</strong>
                <span>Failing rows</span>
              </div>
              <div className="validation-ledger-summary-cell">
                <strong>{summary.notRun}</strong>
                <span>Not run</span>
              </div>
              <div className="validation-ledger-summary-cell">
                <strong>{summary.totalRuns}</strong>
                <span>Total runs</span>
              </div>
            </div>
          </div>
        </section>

        <section className="validation-ledger-panel" aria-labelledby="api-roleplay-ledger-title">
          <div className="validation-ledger-panel-header">
            <h2 id="api-roleplay-ledger-title">Validation Results: API Roleplay Pipeline</h2>
          </div>
          <div className="validation-ledger-table-wrap">
            <table className="validation-ledger-table" aria-label="API roleplay pipeline validation results">
              <colgroup>
                <col style={{ width: "170px" }} />
                <col style={{ width: "210px" }} />
                <col style={{ width: "260px" }} />
                <col style={{ width: "220px" }} />
                <col style={{ width: "76px" }} />
                <col style={{ width: "110px" }} />
                <col style={{ width: "260px" }} />
                <col style={{ width: "220px" }} />
                <col style={{ width: "220px" }} />
                <col style={{ width: "92px" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Issue</th>
                  <th>Validation Phase</th>
                  <th>What The Test Proves</th>
                  <th>Fixture / Command</th>
                  <th>Runs</th>
                  <th>Last Result</th>
                  <th>Failure Cause</th>
                  <th>Evidence File</th>
                  <th>Manual Review</th>
                  <th>Report</th>
                </tr>
              </thead>
              <tbody>
                {validationRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.issue}</td>
                    <td>{row.validationPhase}</td>
                    <td>{row.proves}</td>
                    <td>{row.fixtureOrCommand}</td>
                    <td>{row.runs}</td>
                    <td className={resultClass(row.lastResult)}>{row.lastResult}</td>
                    <td>{row.failureSummary}</td>
                    <td>{row.evidenceFile}</td>
                    <td>{row.manualReview}</td>
                    <td>
                      <button type="button" className="validation-ledger-view" onClick={() => setSelectedRow(row)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {validationRows.length === 0 ? (
              <div className="validation-ledger-empty" role="status">
                <strong>No validation evidence has been recorded yet.</strong>
                <p>
                  Future rows should be written from real validation JSON or report artifacts after the test
                  harness exists. Until then, this page is only the admin shell for the ledger, not proof that
                  any roleplay runtime validation command has run.
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </main>

      {selectedRow ? (
        <div className="validation-ledger-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="validation-ledger-modal-title">
          <div className="validation-ledger-modal">
            <div className="validation-ledger-modal-header">
              <h2 id="validation-ledger-modal-title">{selectedRow.issue} report</h2>
              <button
                type="button"
                className="validation-ledger-close"
                aria-label="Close report preview"
                onClick={() => setSelectedRow(null)}
              >
                <X size={22} strokeWidth={3} />
              </button>
            </div>
            <div className="validation-ledger-report">
              <pre>{JSON.stringify(selectedRow.report ?? selectedRow, null, 2)}</pre>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
