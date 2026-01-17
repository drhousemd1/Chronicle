
import React from "react";
import { ScenarioHub } from "./ScenarioHub";

// Placeholder - full app migration in progress
export default function ChronicleApp() {
  return (
    <div className="h-screen flex bg-white overflow-hidden">
      <aside className="w-[280px] flex-shrink-0 bg-[#1a1a1a] flex flex-col border-r border-black shadow-2xl z-50">
        <div className="p-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-2xl italic shadow-xl shadow-blue-500/30">C</div>
            <div className="font-black uppercase tracking-tighter text-2xl leading-none text-white">Chronicle</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 pb-4 mt-4 space-y-1">
          <div className="text-slate-400 text-sm p-4">
            App migration in progress...
          </div>
        </nav>
      </aside>
      <main className="flex-1 overflow-hidden">
        <ScenarioHub 
          registry={[]}
          onPlay={() => {}}
          onEdit={() => {}}
          onDelete={() => {}}
          onCreate={() => {}}
          onOpenBackgroundSettings={() => {}}
        />
      </main>
    </div>
  );
}
