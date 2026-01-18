
import React, { useState } from "react";
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

  // Sort by recency (already sorted server-side, but ensure consistency)
  const sortedRegistry = [...globalRegistry].sort((a, b) => b.updatedAt - a.updatedAt);

  if (!selectedEntry) {
    return (
      <div className="max-w-4xl mx-auto py-4">
        {sortedRegistry.length === 0 ? (
          <div className="py-20 text-center opacity-50">
            <div className="text-6xl mb-4">💬</div>
            <p className="font-bold text-slate-600">No saved sessions found.</p>
            <p className="text-sm text-slate-500 mt-1">Start playing a scenario to create your first save.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100">
              {sortedRegistry.map((entry) => {
                const dateStr = new Date(entry.updatedAt).toLocaleDateString([], { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                });

                return (
                  <button
                    key={entry.conversationId}
                    onClick={() => setSelectedEntry(entry)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-all group text-left"
                  >
                    {/* Scenario thumbnail */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200 border border-slate-200">
                      {entry.scenarioImageUrl ? (
                        <img 
                          src={entry.scenarioImageUrl} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xl">
                          📖
                        </div>
                      )}
                    </div>

                    {/* Title + Preview */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">
                        {entry.scenarioTitle}
                      </h3>
                      <p className="text-sm text-slate-500 truncate leading-relaxed">
                        {entry.lastMessage || "No messages yet"}
                      </p>
                    </div>

                    {/* Message count + Date (right side) */}
                    <div className="flex items-center gap-3 text-sm text-slate-400 whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        💬 {entry.messageCount}
                      </span>
                      <span>•</span>
                      <span>{dateStr}</span>
                    </div>

                    {/* Chevron */}
                    <div className="text-slate-300 group-hover:text-slate-600 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </div>
                  </button>
                );
              })}
            </div>
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
            <h2 className="font-black text-slate-900 tracking-tight">{selectedEntry.scenarioTitle}</h2>
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
        {/* Scenario thumbnail */}
        {selectedEntry.scenarioImageUrl && (
          <div className="w-24 h-24 mx-auto mb-4 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            <img 
              src={selectedEntry.scenarioImageUrl} 
              alt="" 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        {!selectedEntry.scenarioImageUrl && (
          <div className="text-5xl mb-4 opacity-30">🎮</div>
        )}
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
