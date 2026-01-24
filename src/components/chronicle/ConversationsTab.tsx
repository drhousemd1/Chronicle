
import React from "react";
import { ConversationMetadata } from "@/types";
import { Button } from "@/components/chronicle/UI";

export function ConversationsTab({
  globalRegistry,
  onResume,
  onRename,
  onDelete,
}: {
  globalRegistry: ConversationMetadata[];
  onResume: (scenarioId: string, conversationId: string) => void;
  onRename: (scenarioId: string, conversationId: string) => void;
  onDelete: (scenarioId: string, conversationId: string) => void;
}) {
  // Sort by recency (already sorted server-side, but ensure consistency)
  const sortedRegistry = [...globalRegistry].sort((a, b) => b.updatedAt - a.updatedAt);

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
                <div
                  key={entry.conversationId}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-all group"
                >
                  {/* Scenario thumbnail - clickable */}
                  <button
                    onClick={() => onResume(entry.scenarioId, entry.conversationId)}
                    className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200 border border-slate-200 hover:ring-2 hover:ring-blue-500 transition-all"
                  >
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
                  </button>

                  {/* Title + Preview - clickable to resume */}
                  <button
                    onClick={() => onResume(entry.scenarioId, entry.conversationId)}
                    className="flex-1 min-w-0 text-left"
                  >
                    {/* Title row with message count and date */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 truncate">
                        {entry.scenarioTitle}
                      </h3>
                      <span className="flex items-center gap-1 text-sm text-slate-400">
                        💬 {entry.messageCount}
                      </span>
                      <span className="text-sm text-slate-400">•</span>
                      <span className="text-sm text-slate-400">{dateStr}</span>
                    </div>
                    <p className="text-sm text-slate-500 truncate leading-relaxed">
                      {entry.lastMessage || "No messages yet"}
                    </p>
                  </button>

                  {/* Action buttons - right side */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRename(entry.scenarioId, entry.conversationId);
                      }}
                    >
                      Rename
                    </Button>
                    <Button
                      variant="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(entry.scenarioId, entry.conversationId);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
