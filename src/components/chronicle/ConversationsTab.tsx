import React from "react";
import { ConversationMetadata } from "@/types";
import { Pencil, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

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
    <TooltipProvider>
    <div className="max-w-4xl mx-auto py-4">
      {sortedRegistry.length === 0 ? (
        <div className="py-20 text-center opacity-50">
          <div className="text-6xl mb-4">💬</div>
          <p className="font-bold text-slate-600">No saved sessions found.</p>
          <p className="text-sm text-slate-500 mt-1">Start playing a scenario to create your first save.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.15)] ring-1 ring-slate-900/5">
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
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRename(entry.scenarioId, entry.conversationId);
                          }}
                          className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Rename</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(entry.scenarioId, entry.conversationId);
                          }}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
    </TooltipProvider>
  );
}
