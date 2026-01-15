
import React, { useState, useEffect } from "react";
import { ScenarioData } from "@/types";
import { Button, Card, TextArea, SectionTitle } from "./UI";
import { safeJsonParse, normalizeScenarioData } from "@/utils";

export function ImportExportTab({ data, onReplaceAll, onReset }: { data: ScenarioData; onReplaceAll: (next: ScenarioData) => void; onReset: () => void }) {
  const [text, setText] = useState<string>(JSON.stringify(data, null, 2));
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setText(JSON.stringify(data, null, 2));
  }, [data]);

  return (
    <div className="max-w-5xl space-y-4">
      <SectionTitle title="Import / Export" subtitle="Export your current data or import a JSON backup." />

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Data JSON</div>
            <div className="text-xs text-slate-500 mt-1">Import replaces everything.</div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigator.clipboard.writeText(text)}>Copy</Button>
            <Button
              variant="secondary"
              onClick={() => {
                const blob = new Blob([text], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "rpg_campaign_studio.json";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <TextArea value={text} onChange={setText} rows={16} />
        </div>

        {error ? <div className="mt-3 text-sm text-rose-600">{error}</div> : null}

        <div className="mt-4 flex gap-2 flex-wrap">
          <Button
            onClick={() => {
              const parsed = safeJsonParse(text);
              if (parsed.ok === false) {
                setError(parsed.error);
                return;
              }
              setError("");
              const next = normalizeScenarioData(parsed.value);
              onReplaceAll(next);
            }}
          >
            Import (Replace All)
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              const ok = confirm("Reset all data to defaults? This cannot be undone.");
              if (!ok) return;
              onReset();
            }}
          >
            Reset
          </Button>
        </div>
      </Card>
    </div>
  );
}
