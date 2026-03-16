import React, { useState, useMemo } from "react";
import { ConversationMetadata } from "@/types";
import { Trash2 } from "lucide-react";
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
  onDelete,
}: {
  globalRegistry: ConversationMetadata[];
  onResume: (scenarioId: string, conversationId: string) => void;
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
    <div className="max-w-5xl mx-auto py-4">
        {sortedRegistry.length === 0 ? (
          <div className="bg-[#2a2a2f] rounded-2xl py-20 text-center" style={{ boxShadow: '0 12px 32px -2px rgba(0,0,0,0.50), inset 1px 1px 0 rgba(255,255,255,0.09), inset -1px -1px 0 rgba(0,0,0,0.35)' }}>
            <div className="text-6xl mb-4">💬</div>
            <p className="font-bold text-zinc-400">No saved sessions found.</p>
            <p className="text-sm text-zinc-500 mt-1">Start playing a scenario to create your first save.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {visibleItems.map((entry) => {
                const dateStr = new Date(entry.updatedAt).toLocaleDateString([], { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                });

                return (
                  <div
                    key={entry.conversationId}
                    className="bg-[#2a2a2f] rounded-2xl overflow-hidden group"
                    style={{ boxShadow: '0 12px 32px -2px rgba(0,0,0,0.50), inset 1px 1px 0 rgba(255,255,255,0.09), inset -1px -1px 0 rgba(0,0,0,0.35)' }}
                  >
                    <div className="p-4">
                      <div className="bg-[#3a3a3f]/30 rounded-2xl border border-[#4a5f7f] p-4">
                        <div className="flex gap-4">
                          {/* Scenario thumbnail - clickable */}
                          <button
                            onClick={() => onResume(entry.scenarioId, entry.conversationId)}
                            className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800 border border-[#4a5f7f] hover:ring-2 hover:ring-[#4a5f7f] transition-all shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
                          >
                            {entry.scenarioImageUrl ? (
                              <img 
                                src={entry.scenarioImageUrl} 
                                alt="" 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-500 text-2xl">
                                📖
                              </div>
                            )}
                          </button>

                          {/* Right content area */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            {/* Top row: title + meta + actions */}
                            <div className="flex items-start justify-between gap-2">
                              <button
                                onClick={() => onResume(entry.scenarioId, entry.conversationId)}
                                className="min-w-0 text-left"
                              >
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-bold text-white truncate">
                                    {entry.scenarioTitle}
                                  </h3>
                                  <span className="flex items-center gap-1 text-sm text-[rgba(248,250,252,0.8)]">
                                    💬 {entry.messageCount}
                                  </span>
                                  <span className="text-sm text-[rgba(248,250,252,0.8)]">•</span>
                                  <span className="text-sm text-[rgba(248,250,252,0.8)]">{dateStr}</span>
                                </div>
                                <p className="text-xs text-[rgba(248,250,252,0.8)] mt-0.5">
                                  Created by: {entry.creatorName || 'You'}
                                </p>
                              </button>

                              {/* Action buttons */}
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(entry.scenarioId, entry.conversationId);
                                      }}
                                      className="p-2 rounded-lg bg-red-500 border border-red-500 text-white hover:bg-red-600 hover:border-red-600 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete</TooltipContent>
                                </Tooltip>
                              </div>
                            </div>

                            {/* Last message preview */}
                            <button
                              onClick={() => onResume(entry.scenarioId, entry.conversationId)}
                              className="w-full text-left mt-2"
                            >
                              <div className="bg-zinc-900/50 border border-[#4a5f7f] rounded-lg px-3 py-1.5">
                                <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">
                                  {entry.lastMessage || "No messages yet"}
                                </p>
                              </div>
                            </button>
                          </div>
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
                  className="px-6 py-2 rounded-xl border border-[#4a5f7f] bg-[hsl(var(--ui-surface-2))] text-[hsl(var(--ui-text))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:bg-ghost-white active:bg-ghost-white transition-all active:scale-95 text-sm font-bold"
                >
                  Load More ({sortedRegistry.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        )}
    </div>
    </TooltipProvider>
  );
}