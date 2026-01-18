
import React from "react";
import { ConversationMetadata } from "@/types";
import resumeSessionHero from "@/assets/resume-session-hero.png";

export function ConversationsTab({
  globalRegistry,
  selectedEntry,
  onSelectEntry,
}: {
  globalRegistry: ConversationMetadata[];
  selectedEntry: ConversationMetadata | null;
  onSelectEntry: (entry: ConversationMetadata | null) => void;
}) {
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
                    onClick={() => onSelectEntry(entry)}
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

  // Selected conversation detail view - just the body content (header is now in parent)
  return (
    <div className="max-w-4xl mx-auto py-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center overflow-hidden">
        {/* Hero image with rectangular edge fade */}
        <div className="relative w-80 h-44 mx-auto mb-6">
          {/* Edge fade overlays */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            {/* Top edge */}
            <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-white to-transparent" />
            {/* Bottom edge */}
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent" />
            {/* Left edge */}
            <div className="absolute top-0 bottom-0 left-0 w-6 bg-gradient-to-r from-white to-transparent" />
            {/* Right edge */}
            <div className="absolute top-0 bottom-0 right-0 w-6 bg-gradient-to-l from-white to-transparent" />
          </div>
          <img 
            src={resumeSessionHero}
            alt="Resume your adventure" 
            className="w-full h-full object-contain"
          />
        </div>
        
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
