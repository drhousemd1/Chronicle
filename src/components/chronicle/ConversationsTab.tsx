
import React, { useState, useMemo } from "react";
import { Conversation, ScenarioData } from "@/types";
import { Button, Card, Label, TextArea, SectionTitle } from "./UI";

export function ConversationsTab({
  appData,
  onUpdate,
  onPlayConversation,
  modelId,
}: {
  appData: ScenarioData | null;
  onUpdate: (conversations: Conversation[]) => void;
  onPlayConversation: (id: string) => void;
  modelId: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const conversations = appData?.conversations || [];
  const selected = useMemo(() => conversations.find((c) => c.id === selectedId) || null, [conversations, selectedId]);

  if (!appData) return (
    <div className="flex flex-col items-center justify-center h-full text-center p-10 py-20 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
      <div className="text-5xl mb-6 opacity-30">💬</div>
      <h2 className="text-xl font-black text-slate-800 tracking-tight">No Active Scenario</h2>
      <p className="text-sm text-slate-500 mt-2 max-w-xs leading-relaxed">
        Select a story from the dashboard to view your chat history and resume your adventures.
      </p>
    </div>
  );

  if (!selectedId) {
    return (
      <div className="max-w-4xl mx-auto py-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Chat History</h1>
            <p className="text-slate-500">Pick up any story session where you left off.</p>
          </div>
        </div>

        <div className="space-y-1">
          {conversations.map((c) => {
            const lastMsg = c.messages[c.messages.length - 1];
            const dateStr = new Date(c.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' });

            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className="w-full flex items-center gap-5 p-4 rounded-2xl hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-xl transition-all group"
              >
                <div className="w-14 h-14 rounded-full bg-slate-900 overflow-hidden flex-shrink-0 border-2 border-slate-100 shadow-md">
                   <div className="w-full h-full flex items-center justify-center font-black text-white text-xl uppercase italic opacity-20">
                     {c.title.slice(0, 1)}
                   </div>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-black text-slate-900 truncate tracking-tight">{c.title}</h3>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{dateStr}</span>
                       <div className="w-2 h-2 rounded-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 truncate leading-relaxed">
                    {lastMsg ? lastMsg.text : "Empty session."}
                  </p>
                </div>
                <div className="text-slate-300 group-hover:text-slate-900 px-2 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </div>
              </button>
            );
          })}
          
          {conversations.length === 0 && (
            <div className="py-20 text-center opacity-50">
               <div className="text-6xl mb-4">💬</div>
               <p className="font-bold text-slate-600">No history found.</p>
               <p className="text-sm text-slate-500 mt-1">Start a scenario to see your sessions here.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white/50 backdrop-blur rounded-t-3xl mb-6">
        <div className="flex items-center gap-4">
           <button 
             onClick={() => setSelectedId(null)}
             className="p-2 hover:bg-slate-100 rounded-full transition-colors"
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
           </button>
           <div>
             <h2 className="font-black text-slate-900 tracking-tight">{selected?.title}</h2>
             <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Session Overview</p>
           </div>
        </div>
        <div className="flex gap-2">
           <Button variant="brand" onClick={() => selected && onPlayConversation(selected.id)} className="px-6 bg-blue-600 hover:bg-blue-500">
             Resume
           </Button>
           <Button variant="secondary" onClick={() => {
             if (!selected) return;
             const title = prompt("Rename session:", selected.title)?.trim();
             if (title) onUpdate(conversations.map(c => c.id === selected.id ? { ...c, title } : c));
           }}>Rename</Button>
           <Button variant="danger" onClick={() => {
             if (!selected) return;
             if (confirm("Delete this session forever?")) {
               const next = conversations.filter(c => c.id !== selected.id);
               onUpdate(next);
               setSelectedId(null);
             }
           }}>Delete</Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 px-2 pb-6">
        {selected && selected.messages.length === 0 && (
          <div className="py-12 text-center bg-white rounded-[2rem] border border-slate-100 shadow-sm">
             <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto">This session has no messages yet. Jump into the game to start roleplaying.</p>
          </div>
        )}
        
        {selected?.messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-3xl p-5 shadow-sm border ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none' 
                : 'bg-white text-slate-900 border-slate-100 rounded-tl-none'
            }`}>
              <div className="text-[10px] font-black uppercase tracking-widest mb-1.5 opacity-60">
                {m.role === 'user' ? 'You' : 'Narrator'}
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
