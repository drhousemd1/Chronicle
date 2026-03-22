import React, { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useModelSettings } from "@/contexts/ModelSettingsContext";

const ApiInspectorPage: React.FC = () => {
  const navigate = useNavigate();
  const { modelId } = useModelSettings();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [editActive, setEditActive] = useState(false);
  const [saveEnabled, setSaveEnabled] = useState(false);

  const postToIframe = useCallback((type: string, payload: Record<string, unknown> = {}) => {
    iframeRef.current?.contentWindow?.postMessage({ type, ...payload }, "*");
  }, []);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "inspectorState") {
        setEditActive(!!e.data.editActive);
        setSaveEnabled(!!e.data.saveEnabled);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    postToIframe("setModel", { modelId });
  }, [modelId, postToIframe]);

  const btnBase =
    "inline-flex items-center justify-center rounded-xl px-5 h-9 text-[10px] font-bold uppercase tracking-wide border transition-all cursor-pointer";
  const btnDefault =
    "bg-[#2d3440] text-[#e8ecf0] border-white/[0.08] hover:bg-[#3a4350] shadow-md";
  const btnActive =
    "bg-[hsl(var(--ui-surface-2))] text-white border-[hsl(var(--ui-surface-2))] shadow-md";

  return (
    <div className="flex flex-col h-screen">
      <header className="flex-shrink-0 h-14 border-b border-slate-200 bg-white flex items-center px-4 lg:px-8 shadow-sm gap-3">
        <button
          type="button"
          onClick={() => navigate("/?tab=admin&adminTool=style_guide")}
          className="p-2 text-[hsl(var(--ui-surface-2))] hover:bg-slate-100 rounded-full transition-colors"
          aria-label="Go back"
          title="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-lg font-black text-[hsl(var(--ui-surface-2))] uppercase tracking-tight">
          API Call Inspector
        </h1>

        {/* Action buttons moved from iframe topbar */}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className={`${btnBase} ${btnDefault} ${!editActive ? "opacity-40 pointer-events-none" : ""}`}
            onClick={() => postToIframe("addBlock")}
          >
            + Add Block
          </button>
          <button
            type="button"
            className={`${btnBase} ${btnDefault} ${!saveEnabled ? "opacity-40 pointer-events-none" : ""}`}
            onClick={() => postToIframe("save")}
          >
            Save
          </button>
          <button
            type="button"
            className={`${btnBase} ${editActive ? btnActive : btnDefault}`}
            onClick={() => postToIframe("editToggle")}
          >
            Edit
          </button>
          <button
            type="button"
            className={`${btnBase} ${btnDefault}`}
            onClick={() => postToIframe("view")}
          >
            View
          </button>
        </div>
      </header>
      <iframe
        ref={iframeRef}
        title="API Call Inspector"
        src="/api-call-inspector-chronicle.html"
        onLoad={() => postToIframe("setModel", { modelId })}
        className="flex-1 w-full border-none block"
      />
    </div>
  );
};

export default ApiInspectorPage;
