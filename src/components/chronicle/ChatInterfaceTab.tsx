
import React, { useState, useRef, useEffect, useCallback } from "react";
import { ScenarioData, Conversation, Message, Character } from "@/types";
import { Button } from "./UI";
import { generateRoleplayResponseStream } from "@/services/gemini";
import { uid, now, saveScenario } from "@/utils";

interface ChatInterfaceTabProps {
  scenarioId: string;
  appData: ScenarioData;
  conversationId: string;
  modelId: string;
  onUpdate: (conversations: Conversation[]) => void;
  onBack: () => void;
  onSaveScenario: () => void;
}

export function ChatInterfaceTab({
  scenarioId,
  appData,
  conversationId,
  modelId,
  onUpdate,
  onBack,
  onSaveScenario,
}: ChatInterfaceTabProps) {
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const conversation = appData.conversations.find((c) => c.id === conversationId);
  const messages = conversation?.messages || [];

  // Get the first AI character for avatar display
  const aiCharacter = appData.characters.find(c => c.controlledBy === "AI") || appData.characters[0];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() || isGenerating || !conversation) return;

    const userMessage: Message = {
      id: uid("msg"),
      role: "user",
      text: inputText.trim(),
      createdAt: now(),
    };

    // Add user message immediately
    const updatedMessages = [...messages, userMessage];
    const updatedConv = { ...conversation, messages: updatedMessages, updatedAt: now() };
    const updatedConversations = appData.conversations.map((c) =>
      c.id === conversationId ? updatedConv : c
    );
    onUpdate(updatedConversations);

    setInputText("");
    setIsGenerating(true);
    setStreamingText("");

    try {
      let fullResponse = "";
      const generator = generateRoleplayResponseStream(
        { ...appData, conversations: updatedConversations },
        conversationId,
        userMessage.text,
        modelId
      );

      for await (const chunk of generator) {
        fullResponse += chunk;
        setStreamingText(fullResponse);
      }

      // Add AI response
      const aiMessage: Message = {
        id: uid("msg"),
        role: "assistant",
        text: fullResponse,
        createdAt: now(),
      };

      const finalMessages = [...updatedMessages, aiMessage];
      const finalConv = { ...conversation, messages: finalMessages, updatedAt: now() };
      const finalConversations = appData.conversations.map((c) =>
        c.id === conversationId ? finalConv : c
      );
      onUpdate(finalConversations);

      // Auto-save after each exchange
      try {
        saveScenario(scenarioId, { ...appData, conversations: finalConversations });
      } catch (e) {
        console.warn("Auto-save failed:", e);
      }
    } catch (error: any) {
      console.error("Generation error:", error);
      const errorMessage: Message = {
        id: uid("msg"),
        role: "assistant",
        text: `⚠️ Error: ${error.message || "Failed to generate response"}`,
        createdAt: now(),
      };
      const errorConversations = appData.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...updatedMessages, errorMessage], updatedAt: now() }
          : c
      );
      onUpdate(errorConversations);
    } finally {
      setIsGenerating(false);
      setStreamingText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-10">
        <div className="text-5xl mb-6 opacity-30">💬</div>
        <h2 className="text-xl font-black text-slate-800">Session Not Found</h2>
        <p className="text-sm text-slate-500 mt-2">The conversation could not be loaded.</p>
        <Button variant="secondary" onClick={onBack} className="mt-6">
          ← Back to Stories
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-100 to-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div className="flex items-center gap-3">
            {aiCharacter?.avatarDataUrl ? (
              <img
                src={aiCharacter.avatarDataUrl}
                alt={aiCharacter.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-slate-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center">
                <span className="text-white font-black text-lg italic opacity-30">
                  {aiCharacter?.name?.charAt(0) || "?"}
                </span>
              </div>
            )}
            <div>
              <h2 className="font-black text-slate-900 tracking-tight">{conversation.title}</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                {appData.world.core.scenarioName || "Story Session"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 px-3 py-1 bg-slate-100 rounded-full font-medium">
            {modelId}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} character={aiCharacter} />
        ))}
        
        {streamingText && (
          <MessageBubble
            message={{ id: "streaming", role: "assistant", text: streamingText, createdAt: now() }}
            character={aiCharacter}
            isStreaming
          />
        )}

        {messages.length === 0 && !streamingText && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4 opacity-20">✨</div>
            <p className="text-slate-500 max-w-md">
              Your story begins here. Type a message to interact with the world.
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What do you do?"
              disabled={isGenerating}
              rows={1}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ minHeight: "56px", maxHeight: "150px" }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isGenerating}
            className="flex-shrink-0 w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
          >
            {isGenerating ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            )}
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-3">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  character,
  isStreaming = false,
}: {
  message: Message;
  character?: Character;
  isStreaming?: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} gap-3`}>
      {!isUser && (
        <div className="flex-shrink-0">
          {character?.avatarDataUrl ? (
            <img
              src={character.avatarDataUrl}
              alt={character.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center shadow-md">
              <span className="text-white font-black text-sm italic opacity-30">
                {character?.name?.charAt(0) || "N"}
              </span>
            </div>
          )}
        </div>
      )}
      
      <div
        className={`max-w-[75%] rounded-3xl px-5 py-4 shadow-sm ${
          isUser
            ? "bg-blue-600 text-white rounded-tr-lg"
            : "bg-white text-slate-900 border border-slate-100 rounded-tl-lg"
        } ${isStreaming ? "animate-pulse" : ""}`}
      >
        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isUser ? "text-blue-200" : "text-slate-400"}`}>
          {isUser ? "You" : character?.name || "Narrator"}
        </div>
        <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shadow-md">
          <span className="text-blue-600 font-black text-sm">You</span>
        </div>
      )}
    </div>
  );
}
