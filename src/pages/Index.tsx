
import React, { useEffect, useState } from "react";
import { ScenarioData, TabKey, Character, ScenarioMetadata, Conversation, Message } from "@/types";
import { getRegistry, saveRegistry, loadScenario, saveScenario, deleteScenario, createDefaultScenarioData, now, uid, getCharacterLibrary, saveCharacterLibrary, truncateLine } from "@/utils";
import { LLM_MODELS } from "@/constants";
import { CharactersTab } from "@/components/chronicle/CharactersTab";
import { WorldTab } from "@/components/chronicle/WorldTab";
import { ConversationsTab } from "@/components/chronicle/ConversationsTab";
import { ImportExportTab } from "@/components/chronicle/ImportExportTab";
import { ScenarioHub } from "@/components/chronicle/ScenarioHub";
import { ModelSettingsTab } from "@/components/chronicle/ModelSettingsTab";
import { Button } from "@/components/chronicle/UI";
import { brainstormCharacterDetails } from "@/services/gemini";
import { CharacterPicker } from "@/components/chronicle/CharacterPicker";

const IconsList = {
  Hub: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>,
  Characters: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  World: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>,
  Chat: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  System: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/><line x1="7" x2="7.01" y1="15" y2="15"/><line x1="12" x2="12.01" y1="15" y2="15"/></svg>,
  Model: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v10"/><path d="M18.4 4.6a10 10 0 1 1-12.8 0"/></svg>,
  Builder: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  Library: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/></svg>,
  ChatInterface: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/></svg>
};

function SidebarItem({ active, label, onClick, icon, subtitle, className = "" }: { active: boolean; label: string; onClick: () => void; icon: React.ReactNode; subtitle?: string; className?: string; }) {
  const activeClasses = active ? "bg-blue-600 shadow-lg shadow-black/40 text-white" : "text-slate-400 hover:bg-white/10 hover:text-white hover:shadow-md hover:shadow-black/20"; 
  return (
    <button type="button" onClick={onClick} className={`w-full flex flex-col rounded-xl px-4 py-3 transition-all duration-200 font-bold text-sm mb-1 cursor-pointer group border border-transparent ${activeClasses} ${className}`}>
      <div className="flex items-center gap-3 w-full">
        <span className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      {subtitle && <div className={`text-[10px] font-black tracking-wide uppercase mt-1 ml-8 text-left transition-colors duration-200 ${active ? "text-blue-200 opacity-100" : "text-slate-600 opacity-70 group-hover:text-slate-400"}`}>{subtitle}</div>}
    </button>
  );
}

const Index = () => {
  const [registry, setRegistry] = useState<ScenarioMetadata[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeData, setActiveData] = useState<ScenarioData | null>(null);
  const [playingConversationId, setPlayingConversationId] = useState<string | null>(null);
  const [library, setLibrary] = useState<Character[]>([]);
  const [tab, setTab] = useState<TabKey | "library">("hub");
  const [fatal, setFatal] = useState<string>("");
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [isBrainstorming, setIsBrainstorming] = useState(false);
  const [isCharacterPickerOpen, setIsCharacterPickerOpen] = useState(false);
  
  const [globalModelId, setGlobalModelId] = useState<string>(() => localStorage.getItem("rpg_studio_global_model") || 'gemini-3-flash-preview');

  useEffect(() => {
    localStorage.setItem("rpg_studio_global_model", globalModelId);
  }, [globalModelId]);

  useEffect(() => {
    try {
      setRegistry(getRegistry());
      setLibrary(getCharacterLibrary());
    } catch (e: any) {
      setFatal("Failed to load data: " + e.message);
    }
  }, []);

  function handlePlayScenario(id: string) {
    try {
      const data = loadScenario(id);
      
      const initialMessages: Message[] = [];
      const openingText = data.story?.openingDialog?.text?.trim();
      if (openingText) {
        initialMessages.push({
          id: uid("msg"),
          role: "assistant",
          text: openingText,
          createdAt: now()
        });
      }

      const newConv: Conversation = { 
        id: uid("conv"), 
        title: `Story Session ${data.conversations.length + 1}`, 
        messages: initialMessages, 
        createdAt: now(), 
        updatedAt: now() 
      };

      data.conversations = [newConv, ...data.conversations];
      saveScenario(id, data);
      setActiveId(id);
      setActiveData(data);
      setPlayingConversationId(newConv.id);
      setTab("conversations");
      setSelectedCharacterId(null);
    } catch (e: any) {
      alert("Failed to play scenario: " + e.message);
    }
  }

  function handleEditScenario(id: string) {
    try {
      const data = loadScenario(id);
      setActiveId(id);
      setActiveData(data);
      setTab("world"); 
      setSelectedCharacterId(null);
      setPlayingConversationId(null);
    } catch (e: any) {
      alert("Failed to edit scenario: " + e.message);
    }
  }

  function handleCreateNewScenario() {
    const id = uid("scen");
    const data = createDefaultScenarioData();
    setActiveId(id);
    setActiveData(data);
    setTab("world"); 
    setSelectedCharacterId(null);
    setPlayingConversationId(null);
  }

  const handleSave = (): boolean => {
    if (!activeId || !activeData) {
      alert("Error: No active scenario found to save.");
      return false;
    }
    
    try {
      const t = now();
      const currentRegistry = getRegistry();
      const exists = currentRegistry.some(r => r.id === activeId);
      
      const derivedTitle = activeData.world.core.scenarioName || 
                           (activeData.characters[0]?.name ? `${activeData.characters[0].name}'s Story` : "New Scenario");

      let nextReg: ScenarioMetadata[];
      if (!exists) {
        const meta: ScenarioMetadata = {
          id: activeId,
          title: derivedTitle,
          description: truncateLine(activeData.world.core.settingOverview || "Created via Builder", 120),
          coverImage: "", 
          tags: ["Custom"],
          createdAt: t,
          updatedAt: t,
        };
        nextReg = [meta, ...currentRegistry];
      } else {
        nextReg = currentRegistry.map(m => m.id === activeId ? { 
          ...m, 
          title: derivedTitle,
          description: truncateLine(activeData.world.core.settingOverview || m.description, 120),
          updatedAt: t,
          coverImage: "" 
        } : m);
      }

      saveScenario(activeId, activeData);
      saveRegistry(nextReg);
      setRegistry(nextReg);
      
      try {
        let nextLib = getCharacterLibrary();
        if (activeData.characters.length > 0) {
          activeData.characters.forEach(scenChar => {
            const idx = nextLib.findIndex(l => l.id === scenChar.id);
            if (idx !== -1) {
              const incomingChar = { ...scenChar };
              if (!incomingChar.avatarDataUrl && nextLib[idx].avatarDataUrl) {
                incomingChar.avatarDataUrl = nextLib[idx].avatarDataUrl;
                incomingChar.avatarPosition = nextLib[idx].avatarPosition;
              }
              nextLib[idx] = incomingChar;
            }
            else nextLib.unshift(scenChar);
          });
          if (nextLib.length > 100) nextLib = nextLib.slice(0, 100);
          saveCharacterLibrary(nextLib);
          setLibrary(nextLib);
        }
      } catch (libErr) {
        console.warn("Library sync failed, but scenario was saved:", libErr);
      }

      return true;
    } catch (e: any) {
      console.error("Critical Save Failure:", e);
      if (e.name === 'QuotaExceededError' || e.message?.toLowerCase().includes('quota')) {
        alert("Browser storage is full. This scenario is too large. Please delete old stories or use fewer/smaller images.");
      } else {
        alert("Save failed: " + (e.message || "An unknown error occurred while accessing local storage."));
      }
      return false;
    }
  };

  function handleSaveCharacter() {
    if (tab === 'library') {
      try {
        saveCharacterLibrary(library);
        setSelectedCharacterId(null);
      } catch (e: any) {
        if (e.name === 'QuotaExceededError') {
           alert("Library is full. Try deleting other characters from the library first.");
        } else {
           alert("Error saving character to library: " + e.message);
        }
      }
    } else {
      const success = handleSave();
      if (success) {
        setSelectedCharacterId(null);
        setTab("world"); 
      }
    }
  }

  function handleCreateCharacter() {
    const t = now();
    const c: Character = {
      id: uid("char"),
      name: "New Character",
      sexType: "",
      controlledBy: "AI",
      characterRole: "Main",
      tags: "",
      avatarDataUrl: "",
      sections: [{ id: uid("sec"), title: "Basics", items: [{ id: uid("item"), label: "", value: "", createdAt: t, updatedAt: t }], createdAt: t, updatedAt: t }],
      createdAt: t,
      updatedAt: t,
    };
    if (tab === "library") {
      setLibrary(prev => [c, ...prev]);
      setSelectedCharacterId(c.id);
      return;
    }
    if (activeData) {
      handleUpdateActive({ characters: [c, ...activeData.characters] });
      setSelectedCharacterId(c.id);
    }
  }

  function handleImportCharacter(char: Character) {
    if (!activeData) return;
    if (activeData.characters.some(c => c.id === char.id)) return alert("Character is already in this scenario.");
    const copy = JSON.parse(JSON.stringify(char));
    handleUpdateActive({ characters: [copy, ...activeData.characters] });
    setIsCharacterPickerOpen(false);
  }

  function handleDeleteScenario(id: string) {
    if (!confirm("Delete this entire scenario? This cannot be undone.")) return;
    try {
      deleteScenario(id);
      setRegistry(getRegistry());
      if (activeId === id) {
        setActiveId(null);
        setActiveData(null);
        setSelectedCharacterId(null);
        setPlayingConversationId(null);
        setTab("hub");
      }
    } catch (e: any) {
      alert("Delete failed: " + e.message);
    }
  }

  function handleUpdateActive(patch: Partial<ScenarioData>) {
    setActiveData(prev => prev ? { ...prev, ...patch } : null);
  }

  function handleUpdateCharacter(id: string, patch: Partial<Character>) {
    if (tab === "library") {
      setLibrary(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
    } else {
      setActiveData(prev => {
        if (!prev) return prev;
        return { ...prev, characters: prev.characters.map((c) => c.id === id ? { ...c, ...patch } : c) };
      });
    }
  }

  function handleDeleteCharacterFromList(id: string) {
    if (tab === "library") {
      if (!confirm("Delete permanently from Global Library?")) return;
      const nextLib = library.filter(c => c.id !== id);
      setLibrary(nextLib);
      if (selectedCharacterId === id) setSelectedCharacterId(null);
      saveCharacterLibrary(nextLib);
    } else if (activeData) {
      if (!confirm("Remove from this scenario?")) return;
      const nextChars = activeData.characters.filter((c) => c.id !== id);
      handleUpdateActive({ characters: nextChars });
      if (selectedCharacterId === id) setSelectedCharacterId(null);
    }
  }

  function handleAddWorldEntry() {
    if (!activeData) return;
    const t = now();
    const newEntry = { id: uid('codex'), title: '', body: '', createdAt: t, updatedAt: t };
    handleUpdateActive({ world: { ...activeData.world, entries: [newEntry, ...activeData.world.entries] } });
  }

  async function handleAiBrainstorm() {
    let character = tab === "library" ? library.find(c => c.id === selectedCharacterId) : activeData?.characters.find(c => c.id === selectedCharacterId);
    if (!character) return;
    setIsBrainstorming(true);
    try {
      const details = await brainstormCharacterDetails(character.name || "Unknown", activeData || createDefaultScenarioData(), globalModelId);
      if (details) {
        const nextSections = [...character.sections, { id: uid('sec'), title: 'AI Brainstormed Lore', items: [
          { id: uid('item'), label: 'Biography', value: (details as any).bio || '', createdAt: now(), updatedAt: now() },
          { id: uid('item'), label: 'Motivation', value: (details as any).motivation || '', createdAt: now(), updatedAt: now() },
          { id: uid('item'), label: 'Appearance', value: (details as any).appearance || '', createdAt: now(), updatedAt: now() }
        ], createdAt: now(), updatedAt: now() }];
        handleUpdateCharacter(character.id, { sexType: details.sexType || character.sexType, tags: details.tags || character.tags, sections: nextSections, updatedAt: now() });
      }
    } catch (e) {
      console.error(e);
      alert("Brainstorming failed.");
    } finally {
      setIsBrainstorming(false);
    }
  }

  function handleAddSection() {
     if (!selectedCharacterId) return;
     const sourceList = tab === "library" ? library : activeData?.characters;
     const selected = sourceList?.find(c => c.id === selectedCharacterId);
     if (!selected) return;
     handleUpdateCharacter(selected.id, { sections: [...selected.sections, { id: uid('sec'), title: 'New Section', items: [], createdAt: now(), updatedAt: now() }] });
  }

  const selectedModelObj = LLM_MODELS.find(m => m.id === globalModelId);

  if (fatal) return <div className="h-screen bg-slate-900 flex items-center justify-center p-6 text-white text-center"><div><h1 className="text-3xl font-black mb-4 text-rose-500">CRITICAL ERROR</h1><p className="max-w-md mb-8">{fatal}</p><button onClick={() => { localStorage.clear(); location.reload(); }} className="px-6 py-3 bg-white text-slate-900 rounded-2xl font-bold">Clear All Data & Restart</button></div></div>;

  const isDraft = activeId ? !registry.some(r => r.id === activeId) : false;
  const activeMeta = registry.find(m => m.id === activeId);

  const getPageTitle = () => {
    if (tab === 'hub') return 'Your Stories';
    if (tab === 'library') return 'Global Character Library';
    if (tab === 'conversations') return 'Chat History';
    return '';
  };

  return (
    <div className="h-screen flex bg-white overflow-hidden">
      <aside className="w-[280px] flex-shrink-0 bg-[#1a1a1a] flex flex-col border-r border-black shadow-2xl z-50">
        <div className="p-8"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-2xl italic shadow-xl shadow-blue-500/30">C</div><div className="font-black uppercase tracking-tighter text-2xl leading-none text-white">Chronicle</div></div></div>
        <nav className="flex-1 overflow-y-auto px-4 pb-4 mt-4 space-y-1">
          <SidebarItem active={tab === "hub"} label="Your Stories" icon={<IconsList.Hub />} onClick={() => { setActiveId(null); setTab("hub"); setPlayingConversationId(null); }} />
          <SidebarItem active={tab === "library"} label="Character Library" icon={<IconsList.Library />} onClick={() => { setActiveId(null); setTab("library"); setSelectedCharacterId(null); setPlayingConversationId(null); }} />
          
          <SidebarItem active={tab === "conversations"} label="Chat History" icon={<IconsList.Chat />} onClick={() => setTab("conversations")} />
          
          <SidebarItem 
            active={tab === "world" || tab === "characters"} 
            label={activeMeta?.title || (isDraft ? "New Scenario" : "Scenario Builder")}
            subtitle={activeId ? (isDraft ? "Draft" : "Editing") : "No scenario selected"}
            icon={<IconsList.Builder />} 
            onClick={() => activeId ? setTab("world") : null}
            className={!activeId ? "opacity-50 pointer-events-none" : ""}
          />

          <div className="pt-4 mt-4 border-t border-white/10">
            <SidebarItem active={tab === "model_settings"} label="Model Settings" icon={<IconsList.Model />} onClick={() => setTab("model_settings")} />
            <SidebarItem active={tab === "import_export"} label="Import / Export" icon={<IconsList.System />} onClick={() => setTab("import_export")} />
          </div>
        </nav>
        
        {activeId && (tab === "world" || tab === "characters") && (
          <div className="p-4 border-t border-white/10 space-y-2">
            <Button variant="brand" onClick={handleSave} className="w-full">
              💾 Save Scenario
            </Button>
            <Button variant="ghost" onClick={() => { setActiveId(null); setActiveData(null); setTab("hub"); }} className="w-full !text-slate-500">
              ← Back to Stories
            </Button>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
        {(tab === "characters" || tab === "world" || tab === "library") && (
          <header className="flex-shrink-0 h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shadow-sm">
            <div className="flex items-center gap-4">
              {tab === "characters" && selectedCharacterId && (
                <button onClick={() => setSelectedCharacterId(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
              )}
              {(tab === "world" || tab === "characters") && activeData && (
                <div className="flex p-1 bg-slate-100 rounded-xl">
                  <button onClick={() => setTab("world")} className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${tab === "world" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>World</button>
                  <button onClick={() => { setTab("characters"); setSelectedCharacterId(null); }} className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${tab === "characters" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Characters</button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {(tab === "characters" || tab === "library") && (
                <>
                  {selectedCharacterId && (
                    <>
                      <Button variant="secondary" onClick={handleAddSection}>+ Section</Button>
                      <Button variant="secondary" onClick={handleAiBrainstorm} disabled={isBrainstorming}>{isBrainstorming ? "..." : "✨ Brainstorm"}</Button>
                      <Button variant="primary" onClick={handleSaveCharacter}>Save</Button>
                    </>
                  )}
                  {!selectedCharacterId && (
                    <>
                      {tab === "characters" && <Button variant="secondary" onClick={() => setIsCharacterPickerOpen(true)}>Import from Library</Button>}
                      <Button variant="primary" onClick={handleCreateCharacter}>+ New Character</Button>
                    </>
                  )}
                </>
              )}
              {tab === "world" && activeData && (
                <Button variant="secondary" onClick={handleAddWorldEntry}>+ Codex Entry</Button>
              )}
            </div>
          </header>
        )}

        <div className="flex-1 overflow-hidden">
          {tab === "hub" && (
            <ScenarioHub
              registry={registry}
              onPlay={handlePlayScenario}
              onEdit={handleEditScenario}
              onDelete={handleDeleteScenario}
              onCreate={handleCreateNewScenario}
            />
          )}

          {tab === "library" && (
            <div className="p-10 overflow-y-auto h-full">
              <CharactersTab
                appData={{ ...createDefaultScenarioData(), characters: library }}
                selectedId={selectedCharacterId}
                onSelect={setSelectedCharacterId}
                onUpdate={handleUpdateCharacter}
                onDelete={handleDeleteCharacterFromList}
              />
            </div>
          )}

          {tab === "characters" && activeData && (
            <div className="p-10 overflow-y-auto h-full">
              <CharactersTab
                appData={activeData}
                selectedId={selectedCharacterId}
                onSelect={setSelectedCharacterId}
                onUpdate={handleUpdateCharacter}
                onDelete={handleDeleteCharacterFromList}
              />
            </div>
          )}

          {tab === "world" && activeData && (
            <WorldTab
              world={activeData.world}
              characters={activeData.characters}
              openingDialog={activeData.story.openingDialog}
              scenes={activeData.scenes}
              onUpdateWorld={(patch) => handleUpdateActive({ world: { ...activeData.world, ...patch } })}
              onUpdateOpening={(patch) => handleUpdateActive({ story: { openingDialog: { ...activeData.story.openingDialog, ...patch } } })}
              onUpdateScenes={(scenes) => handleUpdateActive({ scenes })}
              onNavigateToCharacters={() => { setTab("characters"); setSelectedCharacterId(null); }}
              onSelectCharacter={(id) => { setSelectedCharacterId(id); setTab("characters"); }}
            />
          )}

          {tab === "conversations" && (
            <div className="p-10 overflow-y-auto h-full">
              <ConversationsTab
                appData={activeData}
                onUpdate={(convs) => activeData && handleUpdateActive({ conversations: convs })}
                onPlayConversation={(id) => { setPlayingConversationId(id); }}
                modelId={globalModelId}
              />
            </div>
          )}

          {tab === "import_export" && activeData && (
            <div className="p-10 overflow-y-auto h-full">
              <ImportExportTab
                data={activeData}
                onReplaceAll={(next) => setActiveData(next)}
                onReset={() => setActiveData(createDefaultScenarioData())}
              />
            </div>
          )}

          {tab === "model_settings" && (
            <div className="p-10 overflow-y-auto h-full">
              <ModelSettingsTab
                selectedModelId={globalModelId}
                onSelectModel={setGlobalModelId}
              />
            </div>
          )}
        </div>
      </main>

      {isCharacterPickerOpen && (
        <CharacterPicker
          library={library}
          onSelect={handleImportCharacter}
          onClose={() => setIsCharacterPickerOpen(false)}
        />
      )}
    </div>
  );
};

export default Index;
