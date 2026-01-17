
import React, { useState, useMemo } from "react";
import { ConversationMetadata } from "@/types";
import { Button } from "./UI";

export function ConversationsTab({
  globalRegistry,
  onResumeConversation,
  onDeleteConversation,
  onRenameConversation,
}: {
  globalRegistry: ConversationMetadata[];
  onResumeConversation: (scenarioId: string, conversationId: string) => void;
  onDeleteConversation: (scenarioId: string, conversationId: string) => void;
  onRenameConversation: (scenarioId: string, conversationId: string, newTitle: string) => void;
}) {
  const [selectedEntry, setSelectedEntry] = useState<ConversationMetadata | null>(null);

  // Group conversations by scenario for display
  const groupedByScenario = useMemo(() => {
    const groups: Record<string, ConversationMetadata[]> = {};
    globalRegistry.forEach(entry => {
      if (!groups[entry.scenarioId]) {
        groups[entry.scenarioId] = [];
      }
      groups[entry.scenarioId].push(entry);
    });
    return groups;
  }, [globalRegistry]);

  if (!selectedEntry) {
    return (
      <div className="max-w-4xl mx-auto py-4">
        {globalRegistry.length === 0 ? (
          <div className="py-20 text-center opacity-50">
            <div className="text-6xl mb-4">💬</div>
            <p className="font-bold text-slate-600">No saved sessions found.</p>
            <p className="text-sm text-slate-500 mt-1">Start playing a scenario to create your first save.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByScenario).map(([scenarioId, conversations]) => {
              const scenarioTitle = conversations[0]?.scenarioTitle || "Untitled Scenario";
              return (
                <div key={scenarioId} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                    <h2 className="font-black text-slate-700 text-sm uppercase tracking-widest">{scenarioTitle}</h2>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {conversations.map((entry) => {
                      const dateStr = new Date(entry.updatedAt).toLocaleDateString([], { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <button
                          key={entry.conversationId}
                          onClick={() => setSelectedEntry(entry)}
                          className="w-full flex items-center gap-5 p-4 hover:bg-slate-50 transition-all group text-left"
                        >
                          <div className="w-12 h-12 rounded-full bg-blue-600 overflow-hidden flex-shrink-0 border-2 border-blue-100 shadow-md flex items-center justify-center">
                            <span className="font-black text-white text-lg">{entry.messageCount}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-bold text-slate-900 truncate">{entry.conversationTitle}</h3>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{dateStr}</span>
                                <div className="w-2 h-2 rounded-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                            <p className="text-sm text-slate-500 truncate leading-relaxed">
                              {entry.lastMessage || "Empty session."}
                            </p>
                          </div>
                          <div className="text-slate-300 group-hover:text-slate-900 px-2 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Selected conversation detail view
  return (
    <div className="max-w-4xl mx-auto py-4">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white/50 backdrop-blur rounded-t-3xl mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedEntry(null)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div>
            <h2 className="font-black text-slate-900 tracking-tight">{selectedEntry.conversationTitle}</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              {selectedEntry.scenarioTitle} • {selectedEntry.messageCount} messages
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="brand" 
            onClick={() => onResumeConversation(selectedEntry.scenarioId, selectedEntry.conversationId)} 
            className="px-6 bg-blue-600 hover:bg-blue-500"
          >
            ▶ Resume
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => {
              const title = prompt("Rename session:", selectedEntry.conversationTitle)?.trim();
              if (title) {
                onRenameConversation(selectedEntry.scenarioId, selectedEntry.conversationId, title);
                setSelectedEntry({ ...selectedEntry, conversationTitle: title });
              }
            }}
          >
            Rename
          </Button>
          <Button 
            variant="danger" 
            onClick={() => {
              if (confirm("Delete this saved session forever?")) {
                onDeleteConversation(selectedEntry.scenarioId, selectedEntry.conversationId);
                setSelectedEntry(null);
              }
            }}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <div className="text-5xl mb-4 opacity-30">🎮</div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Ready to Continue?</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          Click "Resume" to jump back into this story session. The scenario will be loaded automatically.
        </p>
        <div className="flex items-center justify-center gap-4 text-sm text-slate-400">
          <span><strong className="text-slate-600">{selectedEntry.messageCount}</strong> messages</span>
          <span>•</span>
          <span>Last played: <strong className="text-slate-600">{new Date(selectedEntry.updatedAt).toLocaleDateString()}</strong></span>
        </div>
      </div>
    </div>
  );
}
