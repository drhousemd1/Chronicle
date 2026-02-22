import React, { useState, useMemo } from "react";
import { ConversationMetadata } from "@/types";
import { Pencil, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

const PAGE_SIZE = 30;

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
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const sortedRegistry = useMemo(
    () => [...globalRegistry].sort((a, b) => b.updatedAt - a.updatedAt),
    [globalRegistry]
  );

  const visibleItems = sortedRegistry.slice(0, visibleCount);
  const hasMore = visibleCount < sortedRegistry.length;

  return (
    <TooltipProvider>
    <div className="max-w-4xl mx-auto py-4">
      <div className="bg-[#2a2a2f] rounded-2xl border border-[#4a5f7f] overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]">
        {sortedRegistry.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-6xl mb-4">💬</div>
            <p className="font-bold text-zinc-400">No saved sessions found.</p>
            <p className="text-sm text-zinc-500 mt-1">Start playing a scenario to create your first save.</p>
          </div>
        ) : (
          <>
            <div className="p-3 space-y-3">
              {visibleItems.map((entry) => {
                const dateStr = new Date(entry.updatedAt).toLocaleDateString([], { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                });

                return (
                  <div
                    key={entry.conversationId}
                    className="bg-[#2a2a2f] rounded-2xl border border-[#4a5f7f] overflow-hidden group"
                  >
                    <div className="p-4">
                      <div className="bg-[#3a3a3f]/30 rounded-2xl border border-white/5 p-4">
                        <div className="flex items-center gap-4">
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

                          {/* Title + meta - clickable to resume */}
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
                          </button>

                          {/* Action buttons - right side (lighter/elevated) */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRename(entry.scenarioId, entry.conversationId);
                                  }}
                                  className="p-2 rounded-lg bg-white/10 border border-white/10 text-zinc-400 hover:bg-white/15 hover:text-blue-400 hover:border-blue-500/30 transition-colors"
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
                                  className="p-2 rounded-lg bg-white/10 border border-white/10 text-zinc-400 hover:bg-white/15 hover:text-red-400 hover:border-red-500/30 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>

                        {/* Last message preview - inset/recessed field */}
                        <div className="mt-3">
                          <button
                            onClick={() => onResume(entry.scenarioId, entry.conversationId)}
                            className="w-full text-left"
                          >
                            <div className="bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-1.5">
                              <p className="text-sm text-zinc-400 truncate leading-relaxed">
                                {entry.lastMessage || "No messages yet"}
                              </p>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More pagination */}
            {hasMore && (
              <div className="flex justify-center py-6">
                <button
                  onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                  className="px-6 py-2 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:bg-white/5 active:bg-white/10 transition-all active:scale-95 text-sm font-bold"
                >
                  Load More ({sortedRegistry.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
}
