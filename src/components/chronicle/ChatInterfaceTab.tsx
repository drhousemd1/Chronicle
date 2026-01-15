import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ScenarioData, Character, Conversation, Message, CharacterTraitSection, Scene } from '../../types';
import { Button, TextArea } from './UI';
import { Badge } from '@/components/ui/badge';
import { uid, now } from '../../services/storage';
import { generateRoleplayResponseStream } from '../../services/gemini';
interface ChatInterfaceTabProps {
  scenarioId: string;
  appData: ScenarioData;
  conversationId: string;
  modelId: string;
  onUpdate: (convs: Conversation[]) => void;
  onBack: () => void;
  onSaveScenario: () => void;
  onUpdateUiSettings?: (patch: { showBackgrounds?: boolean; transparentBubbles?: boolean }) => void;
}

const FormattedMessage: React.FC<{ text: string }> = ({ text }) => {
  const tokens = useMemo(() => {
    const cleanRaw = text.replace(/\[SCENE:\s*.*?\]/g, '').trim();
    const regex = /(\*.*?\*)|(".*?")|(\(.*?\))/g;

    const parts: { type: string; content: string }[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(cleanRaw)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'plain', content: cleanRaw.slice(lastIndex, match.index) });
      }

      const found = match[0];
      if (found.startsWith('*')) {
        parts.push({ type: 'action', content: found.slice(1, -1) });
      } else if (found.startsWith('"')) {
        parts.push({ type: 'speech', content: found.slice(1, -1) });
      } else if (found.startsWith('(')) {
        parts.push({ type: 'thought', content: found.slice(1, -1) });
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < cleanRaw.length) {
      parts.push({ type: 'plain', content: cleanRaw.slice(lastIndex) });
    }

    return parts;
  }, [text]);

  return (
    <div className="space-y-1">
      {tokens.map((token, i) => {
        if (token.type === 'speech') {
          return (
            <span key={i} className="text-white font-medium">
              "{token.content}"
            </span>
          );
        }
        if (token.type === 'action') {
          return (
            <span key={i} className="text-slate-400 italic">
               {token.content}
            </span>
          );
        }
        if (token.type === 'thought') {
          return (
            <span 
              key={i} 
              className="text-indigo-200/90 text-sm italic font-light tracking-tight animate-in fade-in zoom-in-95 duration-500"
              style={{
                textShadow: '0 0 8px rgba(129, 140, 248, 0.6), 0 0 16px rgba(129, 140, 248, 0.4), 0 0 24px rgba(129, 140, 248, 0.2)'
              }}
            >
              {token.content}
            </span>
          );
        }
        return <span key={i} className="text-slate-300">{token.content}</span>;
      })}
    </div>
  );
};

export const ChatInterfaceTab: React.FC<ChatInterfaceTabProps> = ({
  scenarioId,
  appData,
  conversationId,
  modelId,
  onUpdate,
  onBack,
  onSaveScenario,
  onUpdateUiSettings
}) => {
  const [input, setInput] = useState('');
  const [expandedCharId, setExpandedCharId] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversation = appData.conversations.find(c => c.id === conversationId);
  const mainCharacters = appData.characters.filter(c => c.characterRole === 'Main');
  const sideCharacters = appData.characters.filter(c => c.characterRole === 'Side');

  const activeScene = useMemo(() =>
    appData.scenes.find(s => s.id === activeSceneId) || null
  , [appData.scenes, activeSceneId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages, streamingContent]);

  useEffect(() => {
    // First, try to find a [SCENE: tag] command in messages
    let foundSceneTag = false;
    if (conversation?.messages.length) {
      for (let i = conversation.messages.length - 1; i >= 0; i--) {
        const match = conversation.messages[i].text.match(/\[SCENE:\s*(.*?)\]/);
        if (match) {
          const tag = match[1].trim();
          const scene = appData.scenes.find(s => s.tag.toLowerCase() === tag.toLowerCase());
          if (scene) {
            setActiveSceneId(scene.id);
            foundSceneTag = true;
            break;
          }
        }
      }
    }
    
    // If no [SCENE:] tag was found, fall back to the starting scene
    if (!foundSceneTag) {
      const startingScene = appData.scenes.find(s => s.isStartingScene);
      if (startingScene) {
        setActiveSceneId(startingScene.id);
      }
    }
  }, [conversation?.messages, appData.scenes]);

  const handleSend = async () => {
    if (!input.trim() || !conversation || isStreaming) return;

    const userMsg: Message = { id: uid('msg'), role: 'user', text: input, createdAt: now() };
    const nextConvsWithUser = appData.conversations.map(c =>
      c.id === conversationId ? { ...c, messages: [...c.messages, userMsg], updatedAt: now() } : c
    );

    onUpdate(nextConvsWithUser);
    setInput('');
    setIsStreaming(true);
    setStreamingContent('');

    try {
      let fullText = '';
      const stream = generateRoleplayResponseStream(appData, conversationId, input, modelId);

      for await (const chunk of stream) {
        fullText += chunk;
        setStreamingContent(fullText);
      }

      const aiMsg: Message = { id: uid('msg'), role: 'assistant', text: fullText, createdAt: now() };
      const nextConvsWithAi = appData.conversations.map(c =>
        c.id === conversationId ? { ...c, messages: [...c.messages, userMsg, aiMsg], updatedAt: now() } : c
      );
      onUpdate(nextConvsWithAi);
      onSaveScenario();
    } catch (err) {
      console.error(err);
      alert("Dialogue stream failed. Check your connection or model settings.");
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  const identifySpeaker = (text: string, isUser: boolean) => {
    const cleanRaw = text.replace(/\[SCENE:\s*.*?\]/g, '').trim();

    if (isUser) {
      const userChar = appData.characters.find(c => c.controlledBy === 'User');
      if (userChar) {
        if (cleanRaw.toLowerCase().startsWith(userChar.name.toLowerCase() + ':')) {
          return { char: userChar, cleanText: cleanRaw.slice(userChar.name.length + 1).trim() };
        }
        return { char: userChar, cleanText: cleanRaw };
      }
    }

    const colonMatch = cleanRaw.match(/^([^:\n\*]{1,30}):/);
    if (colonMatch) {
      const name = colonMatch[1].trim();
      const char = appData.characters.find(c => c.name.toLowerCase() === name.toLowerCase());
      if (char) return { char, cleanText: cleanRaw.slice(colonMatch[0].length).trim() };
    }

    const firstSentence = cleanRaw.split(/[.!?\n]/)[0];
    const foundChar = appData.characters.find(c => firstSentence.includes(c.name));
    if (foundChar) return { char: foundChar, cleanText: cleanRaw };

    const aiChars = appData.characters.filter(c => c.controlledBy === 'AI');
    if (!isUser && aiChars.length > 0) {
      return { char: aiChars[0], cleanText: cleanRaw };
    }

    return { char: null, cleanText: cleanRaw };
  };

  const toggleCharacterExpand = (id: string) => {
    setExpandedCharId(expandedCharId === id ? null : id);
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const renderSection = (section: CharacterTraitSection) => {
    const isOpen = openSections[section.id] !== false;
    return (
      <div key={section.id} className="border-t border-slate-200/60 first:border-t-0">
        <button
          onClick={(e) => { e.stopPropagation(); toggleSection(section.id); }}
          className="w-full flex items-center justify-between py-2.5 px-1 hover:bg-slate-100/50 transition-colors group"
        >
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{section.title}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12" height="12"
            viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round"
            className={`transition-transform duration-200 text-slate-300 group-hover:text-slate-500 ${isOpen ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        {isOpen && (
          <div className="pb-4 px-1 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
            {section.items.map((item) => (
              <div key={item.id} className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                <span className="text-[11px] font-bold text-slate-700 leading-tight">{item.value || "—"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderCharacterCard = (char: Character) => {
    const isExpanded = expandedCharId === char.id;
    return (
      <div
        key={char.id}
        className={`rounded-2xl transition-all duration-300 border-2 ${isExpanded ? 'bg-slate-50 border-blue-100 shadow-sm' : 'border-transparent hover:bg-slate-50'}`}
      >
        <button
          onClick={() => toggleCharacterExpand(char.id)}
          className="w-full flex flex-col items-center gap-2 p-3 text-center group"
        >
          <div className="relative">
            <div className={`w-20 h-20 rounded-full border-2 shadow-sm overflow-hidden bg-slate-50 transition-all duration-300 ${isExpanded ? 'border-blue-400 scale-105 shadow-blue-100' : 'border-slate-100 group-hover:border-blue-200'}`}>
              {char.avatarDataUrl ? (
                <img src={char.avatarDataUrl} alt={char.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-black text-slate-300 text-xl italic uppercase">
                  {char.name.charAt(0)}
                </div>
              )}
            </div>
            <Badge 
              variant={char.controlledBy === 'User' ? 'default' : 'secondary'}
              className={`absolute -bottom-1 -right-1 text-[9px] px-1.5 py-0.5 shadow-sm ${
                char.controlledBy === 'User' 
                  ? 'bg-blue-500 hover:bg-blue-500 text-white border-0' 
                  : 'bg-slate-500 hover:bg-slate-500 text-white border-0'
              }`}
            >
              {char.controlledBy}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className={`text-sm font-bold tracking-tight transition-colors ${isExpanded ? 'text-blue-600' : 'text-slate-800'}`}>{char.name}</div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14" height="14"
              viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="3"
              strokeLinecap="round" strokeLinejoin="round"
              className={`transition-transform duration-300 text-slate-400 ${isExpanded ? 'rotate-180 text-blue-500' : ''}`}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </button>

        {isExpanded && (
          <div className="px-5 pb-5 pt-1 space-y-1 animate-in zoom-in-95 duration-300">
            {char.sections.map(section => renderSection(section))}
          </div>
        )}
      </div>
    );
  };

  const bubblesTransparent = appData.uiSettings?.transparentBubbles;
  const showBackground = appData.uiSettings?.showBackgrounds && activeScene;

  const handleUpdateUiSettings = (patch: { showBackgrounds?: boolean; transparentBubbles?: boolean }) => {
    if (onUpdateUiSettings) {
      onUpdateUiSettings(patch);
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-500">Conversation not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 h-full w-full bg-white overflow-hidden relative">
      {showBackground && (
        <div className="absolute inset-0 z-0">
           <img
             src={activeScene?.url}
             className="w-full h-full object-cover transition-opacity duration-1000 animate-in fade-in fill-mode-forwards"
             alt="Scene background"
           />
           <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
        </div>
      )}

      <aside className={`w-[300px] flex-shrink-0 border-r border-slate-200 flex flex-col h-full shadow-[inset_-4px_0_12px_rgba(0,0,0,0.02)] z-10 transition-colors ${showBackground ? 'bg-white/90 backdrop-blur-md' : 'bg-white'}`}>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest hover:text-blue-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Exit Scenario
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar scrollbar-none">
          <section>
            <h3 className="text-[11px] font-bold text-slate-500 bg-slate-100 px-4 py-1.5 rounded-lg mb-4 tracking-tight uppercase">Main Characters</h3>
            <div className="space-y-4">
              {mainCharacters.map(renderCharacterCard)}
            </div>
          </section>

          <section>
            <h3 className="text-[11px] font-bold text-slate-500 bg-slate-100 px-4 py-1.5 rounded-lg mb-4 tracking-tight uppercase">Side Characters</h3>
            <div className="space-y-4">
              {sideCharacters.map(renderCharacterCard)}
              {sideCharacters.length === 0 && (
                <p className="text-[10px] text-slate-400 text-center italic">No side characters defined.</p>
              )}
            </div>
          </section>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden h-full relative z-10">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar scrollbar-thin">
          {conversation?.messages.length === 0 && !streamingContent && (
             <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-6">
               <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-4xl shadow-sm border border-slate-100">✨</div>
               <div className="text-center max-w-sm">
                 <p className="font-black uppercase tracking-[0.2em] text-sm text-slate-600">The stage is set</p>
                 <p className="text-xs mt-2 italic text-slate-400">Waiting for your first act. You can start by typing a prompt or action below.</p>
               </div>
             </div>
          )}

          {conversation?.messages.map((msg) => {
            const isAi = msg.role === 'assistant';
            const { char } = identifySpeaker(msg.text, !isAi);

            return (
              <div key={msg.id} className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={`p-8 rounded-[2rem] border shadow-2xl flex flex-col gap-8 transition-all hover:border-white/20 ${
                  bubblesTransparent
                    ? 'bg-black/40 backdrop-blur-xl border-white/5'
                    : 'bg-[#1c1f26] border-white/5'
                } ${!isAi && !bubblesTransparent ? 'border-blue-500/20 bg-[#232a35]' : ''}`}>
                  <div className="flex gap-8 items-start">
                    <div className="flex flex-col items-center gap-2 w-20 flex-shrink-0">
                      <div className={`w-16 h-16 rounded-full border-2 border-white/10 shadow-lg overflow-hidden flex items-center justify-center ${char?.avatarDataUrl ? '' : 'bg-slate-800'}`}>
                        {char?.avatarDataUrl ? (
                          <img src={char.avatarDataUrl} alt={char.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className={`font-black italic text-xl ${isAi ? 'text-white/20' : 'text-blue-400/30'}`}>
                            {char?.name.charAt(0) || ''}
                          </div>
                        )}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest text-center truncate w-full ${!isAi ? 'text-blue-300' : 'text-slate-400'}`}>
                        {char?.name || ''}
                      </span>
                    </div>
                    <div className={`flex-1 pt-2 antialiased`}>
                      <FormattedMessage text={msg.text} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {streamingContent && (
            <div className="max-w-4xl mx-auto w-full">
              <div className={`p-8 rounded-[2rem] border shadow-2xl flex flex-col gap-8 ${
                  bubblesTransparent
                    ? 'bg-black/40 backdrop-blur-xl border-white/5'
                    : 'bg-[#1c1f26] border-white/5'
              }`}>
                <div className="flex gap-8 items-start">
                  <div className="flex flex-col items-center gap-2 w-20 flex-shrink-0">
                    <div className="w-16 h-16 rounded-full border-2 border-white/10 shadow-lg overflow-hidden bg-slate-800 flex items-center justify-center animate-pulse">
                       <div className="text-white/20 font-black italic text-xl">...</div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-center text-slate-400">Thinking</span>
                  </div>
                  <div className="flex-1 pt-2 antialiased">
                    <FormattedMessage text={streamingContent} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={`p-8 border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] transition-colors ${showBackground ? 'bg-white/90 backdrop-blur-md' : 'bg-white'}`}>
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <TextArea
                  value={input}
                  onChange={setInput}
                  placeholder="Describe your action or dialogue..."
                  rows={1}
                  autoResize={true}
                  className="!py-4 !px-6 !bg-slate-50 !border-slate-200 !text-slate-900 !placeholder-slate-400 focus:!ring-blue-500/10 focus:!border-blue-400 transition-all min-h-[56px] !rounded-2xl shadow-inner"
                  onKeyDown={(e: any) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                />
              </div>
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className="h-[56px] px-10 bg-[#1c1f26] hover:bg-slate-800 text-white shadow-lg font-black uppercase tracking-widest rounded-2xl border-none transition-all active:scale-95 disabled:opacity-30"
              >
                {isStreaming ? '...' : 'Send'}
              </Button>
            </div>
            <div className="flex justify-between items-center px-2">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isStreaming ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`} />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {isStreaming ? 'Narrative Engine Active' : 'Story Mode Active'}
                </p>
              </div>
              <div className="flex gap-6 relative">
                 <button
                   onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                   className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center gap-2"
                 >
                   <span className="text-blue-500 opacity-70">✨</span> IMMERSIVE INTERFACE
                 </button>
                 {isSettingsOpen && (
                   <div className="absolute bottom-full mb-4 right-0 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 space-y-4 animate-in slide-in-from-bottom-2">
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Show Backgrounds</span>
                         <input
                           type="checkbox"
                           checked={appData.uiSettings?.showBackgrounds}
                           onChange={(e) => handleUpdateUiSettings({ showBackgrounds: e.target.checked })}
                         />
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Transparent Bubbles</span>
                         <input
                           type="checkbox"
                           checked={bubblesTransparent}
                           onChange={(e) => handleUpdateUiSettings({ transparentBubbles: e.target.checked })}
                         />
                      </div>
                      <p className="text-[9px] text-slate-400 font-medium leading-relaxed border-t border-slate-100 pt-3">
                        Backgrounds will automatically change based on the story context if scene images are tagged in the gallery.
                      </p>
                   </div>
                 )}
                 <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-amber-600 transition-colors flex items-center gap-2">
                   <span className="text-amber-500 opacity-70">🎲</span> ROLL DICE
                 </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChatInterfaceTab;
