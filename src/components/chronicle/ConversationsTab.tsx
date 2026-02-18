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
  const sortedRegistry = [...globalRegistry].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <TooltipProvider>
    <div className="max-w-4xl mx-auto py-4">
      {sortedRegistry.length === 0 ? (
        <div className="py-20 text-center opacity-50">
          <div className="text-6xl mb-4">💬</div>
          <p className="font-bold text-zinc-500">No saved sessions found.</p>
          <p className="text-sm text-zinc-600 mt-1">Start playing a scenario to create your first save.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden">
          <div className="divide-y divide-white/10">
            {sortedRegistry.map((entry) => {
              const dateStr = new Date(entry.updatedAt).toLocaleDateString([], { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              });

              return (
                <div
                  key={entry.conversationId}
                  className="flex items-center gap-4 p-4 hover:bg-white/5 transition-all group"
                >
                  {/* Scenario thumbnail - clickable */}
                  <button
                    onClick={() => onResume(entry.scenarioId, entry.conversationId)}
                    className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800 border border-[#4a5f7f] hover:ring-2 hover:ring-[#4a5f7f] transition-all"
                  >
                    {entry.scenarioImageUrl ? (
                      <img 
                        src={entry.scenarioImageUrl} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xl">
                        📖
                      </div>
                    )}
                  </button>

                  {/* Title + Preview - clickable to resume */}
                  <button
                    onClick={() => onResume(entry.scenarioId, entry.conversationId)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white truncate">
                        {entry.scenarioTitle}
                      </h3>
                      <span className="flex items-center gap-1 text-sm text-zinc-500">
                        💬 {entry.messageCount}
                      </span>
                      <span className="text-sm text-zinc-500">•</span>
                      <span className="text-sm text-zinc-500">{dateStr}</span>
                    </div>
                    <p className="text-sm text-zinc-400 truncate leading-relaxed">
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
                          className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/10 transition-colors"
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
                          className="p-2 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
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
