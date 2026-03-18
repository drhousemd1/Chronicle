import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const ApiInspectorPage: React.FC = () => {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const [inspectorReady, setInspectorReady] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [canSave, setCanSave] = useState(false);

  const syncInspectorState = useCallback(() => {
    const doc = iframeRef.current?.contentWindow?.document;
    if (!doc) return;

    const saveBtn = doc.getElementById("saveBtn") as HTMLButtonElement | null;
    setInspectorReady(true);
    setIsEditMode(doc.body.classList.contains("edit-mode"));
    setCanSave(Boolean(saveBtn && !saveBtn.disabled));
  }, []);

  const clickInspectorButton = useCallback(
    (id: "addBlockBtn" | "saveBtn" | "editToggle" | "viewBtn") => {
      const doc = iframeRef.current?.contentWindow?.document;
      if (!doc) return;
      const button = doc.getElementById(id) as HTMLButtonElement | null;
      if (!button) return;
      button.click();
      window.setTimeout(syncInspectorState, 0);
    },
    [syncInspectorState],
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      syncInspectorState();
    }, 350);
    return () => window.clearInterval(interval);
  }, [syncInspectorState]);

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-ghost-white">
      <header className="flex-shrink-0 h-16 border-b border-slate-200 bg-[rgba(248,250,252,0.3)] flex items-center justify-between px-4 lg:px-8 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/?tab=admin&adminTool=style_guide')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Go back"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-black text-[hsl(var(--ui-surface-2))] uppercase tracking-tight">
            API Inspector
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => clickInspectorButton("addBlockBtn")}
            disabled={!inspectorReady || !isEditMode}
            className="inline-flex items-center gap-2 justify-center h-10 px-5 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] enabled:hover:brightness-125 enabled:active:brightness-150 transition-all enabled:active:scale-95 text-[10px] font-bold leading-none uppercase tracking-wider disabled:opacity-45 disabled:cursor-not-allowed"
          >
            + Add Block
          </button>
          <button
            type="button"
            onClick={() => clickInspectorButton("saveBtn")}
            disabled={!inspectorReady || !canSave}
            className="inline-flex items-center gap-2 justify-center h-10 px-5 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] enabled:hover:brightness-125 enabled:active:brightness-150 transition-all enabled:active:scale-95 text-[10px] font-bold leading-none uppercase tracking-wider disabled:opacity-45 disabled:cursor-not-allowed"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => clickInspectorButton("editToggle")}
            disabled={!inspectorReady}
            className={`inline-flex items-center gap-2 justify-center h-10 px-5 rounded-xl border shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition-all text-[10px] font-bold leading-none uppercase tracking-wider ${
              isEditMode
                ? "border-[#4a5f7f] bg-[#4a5f7f] text-white"
                : "border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] enabled:hover:brightness-125"
            } disabled:opacity-45 disabled:cursor-not-allowed`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => clickInspectorButton("viewBtn")}
            disabled={!inspectorReady}
            className="inline-flex items-center gap-2 justify-center h-10 px-5 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] enabled:hover:brightness-125 enabled:active:brightness-150 transition-all enabled:active:scale-95 text-[10px] font-bold leading-none uppercase tracking-wider disabled:opacity-45 disabled:cursor-not-allowed"
          >
            View
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 w-full">
        <iframe
          ref={iframeRef}
          title="API Call Inspector"
          src="/api-call-inspector-chronicle.html?v=20260317-2"
          onLoad={syncInspectorState}
          style={{ width: "100%", height: "100%", border: "none", display: "block", background: "transparent" }}
        />
      </div>
    </div>
  );
};

export default ApiInspectorPage;
