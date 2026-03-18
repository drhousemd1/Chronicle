import React from "react";
import { useNavigate } from "react-router-dom";

const ApiInspectorPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen">
      <header className="flex-shrink-0 h-16 border-b border-slate-200 bg-white flex items-center px-4 lg:px-8 shadow-sm">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/?tab=admin&adminTool=style_guide')} className="p-2 text-[hsl(var(--ui-surface-2))] hover:bg-slate-100 rounded-full transition-colors" aria-label="Go back" title="Go back">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1 className="text-lg font-black text-[hsl(var(--ui-surface-2))] uppercase tracking-tight">API Call Inspector</h1>
        </div>
      </header>
      <iframe
        title="API Call Inspector"
        src="/api-call-inspector-chronicle.html"
        className="flex-1 w-full border-none block"
      />
    </div>
  );
};

export default ApiInspectorPage;
