
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ScenarioData, TabKey, Character, ScenarioMetadata, Conversation, Message, ConversationMetadata } from "@/types";
import { createDefaultScenarioData, now, uid, truncateLine } from "@/utils";
import { LLM_MODELS } from "@/constants";
import { CharactersTab } from "@/components/chronicle/CharactersTab";
import { WorldTab } from "@/components/chronicle/WorldTab";
import { ConversationsTab } from "@/components/chronicle/ConversationsTab";

import { ScenarioHub } from "@/components/chronicle/ScenarioHub";
import { ModelSettingsTab } from "@/components/chronicle/ModelSettingsTab";
import { ChatInterfaceTab } from "@/components/chronicle/ChatInterfaceTab";
import { Button } from "@/components/chronicle/UI";
import { brainstormCharacterDetails } from "@/services/gemini";
import { CharacterPicker } from "@/components/chronicle/CharacterPicker";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import * as supabaseData from "@/services/supabase-data";

const IconsList = {
  Hub: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>,
  Characters: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  World: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>,
  Chat: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  System: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/><line x1="7" x2="7.01" y1="15" y2="15"/><line x1="12" x2="12.01" y1="15" y2="15"/></svg>,
  Model: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v10"/><path d="M18.4 4.6a10 10 0 1 1-12.8 0"/></svg>,
  Builder: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  Library: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/></svg>,
  ChatInterface: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/></svg>,
  Logout: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
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
  const { user, loading: authLoading, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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
  const [conversationRegistry, setConversationRegistry] = useState<ConversationMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [globalModelId, setGlobalModelId] = useState<string>(() => localStorage.getItem("rpg_studio_global_model") || 'gemini-3-flash-preview');

  useEffect(() => {
    localStorage.setItem("rpg_studio_global_model", globalModelId);
  }, [globalModelId]);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Load data from Supabase when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    async function loadData() {
      setIsLoading(true);
      try {
        const [scenarios, characters, conversations] = await Promise.all([
          supabaseData.fetchScenarios(),
          supabaseData.fetchCharacterLibrary(),
          supabaseData.fetchConversationRegistry()
        ]);
        setRegistry(scenarios);
        setLibrary(characters);
        setConversationRegistry(conversations);
      } catch (e: any) {
        console.error("Failed to load data:", e);
        toast({
          title: "Failed to load data",
          description: e.message,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [isAuthenticated, user, toast]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  async function handlePlayScenario(id: string) {
    if (!user) return;
    try {
      const data = await supabaseData.fetchScenarioById(id);
      if (!data) {
        toast({ title: "Scenario not found", variant: "destructive" });
        return;
      }
      const meta = registry.find(r => r.id === id);
      
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
      
      // Save to Supabase
      await supabaseData.saveConversation(newConv, id, user.id);
      
      // Update conversation registry
      const updatedConvRegistry = await supabaseData.fetchConversationRegistry();
      setConversationRegistry(updatedConvRegistry);
      
      setActiveId(id);
      setActiveData(data);
      setPlayingConversationId(newConv.id);
      setTab("chat_interface");
      setSelectedCharacterId(null);
    } catch (e: any) {
      toast({ title: "Failed to play scenario", description: e.message, variant: "destructive" });
    }
  }

  async function handleEditScenario(id: string) {
    try {
      const data = await supabaseData.fetchScenarioById(id);
      if (!data) {
        toast({ title: "Scenario not found", variant: "destructive" });
        return;
      }
      setActiveId(id);
      setActiveData(data);
      setTab("world"); 
      setSelectedCharacterId(null);
      setPlayingConversationId(null);
    } catch (e: any) {
      toast({ title: "Failed to edit scenario", description: e.message, variant: "destructive" });
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

  const handleSave = useCallback(async (navigateToHub: boolean = false): Promise<boolean> => {
    if (!activeId || !activeData || !user) {
      toast({ title: "Error", description: "No active scenario found to save.", variant: "destructive" });
      return false;
    }
    
    setIsSaving(true);
    try {
      const derivedTitle = activeData.world.core.scenarioName || 
                           (activeData.characters[0]?.name ? `${activeData.characters[0].name}'s Story` : "New Scenario");

      const metadata = {
        title: derivedTitle,
        description: truncateLine(activeData.world.core.settingOverview || "Created via Builder", 120),
        coverImage: "",
        tags: ["Custom"]
      };

      await supabaseData.saveScenario(activeId, activeData, metadata, user.id);
      
      // Refresh registry
      const updatedRegistry = await supabaseData.fetchScenarios();
      setRegistry(updatedRegistry);
      
      // Update conversation registry
      const updatedConvRegistry = await supabaseData.fetchConversationRegistry();
      setConversationRegistry(updatedConvRegistry);
      
      // Sync characters to library
      if (activeData.characters.length > 0) {
        for (const char of activeData.characters) {
          await supabaseData.saveCharacterToLibrary(char, user.id);
        }
        const updatedLibrary = await supabaseData.fetchCharacterLibrary();
        setLibrary(updatedLibrary);
      }

      toast({ title: "Saved!", description: "Your scenario has been saved." });

      if (navigateToHub) {
        setActiveId(null);
        setActiveData(null);
        setSelectedCharacterId(null);
        setTab("hub");
      }

      return true;
    } catch (e: any) {
      console.error("Save failed:", e);
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [activeId, activeData, user, toast]);

  async function handleSaveCharacter() {
    if (!user) return;
    
    if (tab === 'library') {
      try {
        const char = library.find(c => c.id === selectedCharacterId);
        if (char) {
          await supabaseData.saveCharacterToLibrary(char, user.id);
          toast({ title: "Character saved!" });
        }
        setSelectedCharacterId(null);
      } catch (e: any) {
        toast({ title: "Error saving character", description: e.message, variant: "destructive" });
      }
    } else {
      const success = await handleSave();
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
    if (activeData.characters.some(c => c.id === char.id)) {
      toast({ title: "Character already in scenario", variant: "destructive" });
      return;
    }
    const copy = JSON.parse(JSON.stringify(char));
    handleUpdateActive({ characters: [copy, ...activeData.characters] });
    setIsCharacterPickerOpen(false);
  }

  async function handleDeleteScenario(id: string) {
    if (!confirm("Delete this entire scenario? This cannot be undone.")) return;
    try {
      await supabaseData.deleteScenario(id);
      const updatedRegistry = await supabaseData.fetchScenarios();
      setRegistry(updatedRegistry);
      
      const updatedConvRegistry = await supabaseData.fetchConversationRegistry();
      setConversationRegistry(updatedConvRegistry);
      
      if (activeId === id) {
        setActiveId(null);
        setActiveData(null);
        setSelectedCharacterId(null);
        setPlayingConversationId(null);
        setTab("hub");
      }
      
      toast({ title: "Scenario deleted" });
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    }
  }
  
  async function handleResumeFromHistory(scenarioId: string, conversationId: string) {
    try {
      const data = await supabaseData.fetchScenarioById(scenarioId);
      if (!data) {
        toast({ title: "Scenario not found", variant: "destructive" });
        return;
      }
      setActiveId(scenarioId);
      setActiveData(data);
      setPlayingConversationId(conversationId);
      setTab("chat_interface");
    } catch (e: any) {
      toast({ title: "Failed to load scenario", description: e.message, variant: "destructive" });
    }
  }
  
  async function handleDeleteConversationFromHistory(scenarioId: string, conversationId: string) {
    try {
      await supabaseData.deleteConversation(conversationId);
      
      const updatedConvRegistry = await supabaseData.fetchConversationRegistry();
      setConversationRegistry(updatedConvRegistry);
      
      if (activeId === scenarioId && activeData) {
        const updatedData = { ...activeData, conversations: activeData.conversations.filter(c => c.id !== conversationId) };
        setActiveData(updatedData);
      }
      
      toast({ title: "Conversation deleted" });
    } catch (e: any) {
      toast({ title: "Failed to delete conversation", description: e.message, variant: "destructive" });
    }
  }
  
  async function handleRenameConversationFromHistory(scenarioId: string, conversationId: string, newTitle: string) {
    try {
      await supabaseData.renameConversation(conversationId, newTitle);
      
      const updatedConvRegistry = await supabaseData.fetchConversationRegistry();
      setConversationRegistry(updatedConvRegistry);
      
      if (activeId === scenarioId && activeData) {
        const updatedData = { 
          ...activeData, 
          conversations: activeData.conversations.map(c => 
            c.id === conversationId ? { ...c, title: newTitle, updatedAt: now() } : c
          ) 
        };
        setActiveData(updatedData);
      }
      
      toast({ title: "Conversation renamed" });
    } catch (e: any) {
      toast({ title: "Failed to rename conversation", description: e.message, variant: "destructive" });
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

  async function handleDeleteCharacterFromList(id: string) {
    if (tab === "library") {
      if (!confirm("Delete permanently from Global Library?")) return;
      try {
        await supabaseData.deleteCharacterFromLibrary(id);
        const nextLib = library.filter(c => c.id !== id);
        setLibrary(nextLib);
        if (selectedCharacterId === id) setSelectedCharacterId(null);
        toast({ title: "Character deleted from library" });
      } catch (e: any) {
        toast({ title: "Failed to delete character", description: e.message, variant: "destructive" });
      }
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
      toast({ title: "Brainstorming failed", variant: "destructive" });
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

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-2xl italic shadow-xl shadow-blue-500/30 mx-auto mb-4">C</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (fatal) return <div className="h-screen bg-slate-900 flex items-center justify-center p-6 text-white text-center"><div><h1 className="text-3xl font-black mb-4 text-rose-500">CRITICAL ERROR</h1><p className="max-w-md mb-8">{fatal}</p><button onClick={() => { localStorage.clear(); location.reload(); }} className="px-6 py-3 bg-white text-slate-900 rounded-2xl font-bold">Clear All Data & Restart</button></div></div>;

  const isDraft = activeId ? !registry.some(r => r.id === activeId) : false;
  const activeMeta = registry.find(m => m.id === activeId);

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
            label="Scenario Builder"
            subtitle={activeId ? (activeMeta?.title || "Unsaved Draft") : "Click to create"}
            icon={<IconsList.Builder />} 
            onClick={() => {
              if (activeId) setTab("world");
              else handleCreateNewScenario();
            }}
            className={!activeId ? "opacity-80" : ""}
          />

          <div className="pt-4 mt-4 border-t border-white/10">
            <SidebarItem active={tab === "model_settings"} label="Model Settings" icon={<IconsList.Model />} onClick={() => setTab("model_settings")} />
          </div>
        </nav>
        
        {activeId && (tab === "world" || tab === "characters") && (
          <div className="p-4 border-t border-white/10 space-y-2">
            <Button variant="brand" onClick={() => handleSave(true)} className="w-full" disabled={isSaving}>
              {isSaving ? "Saving..." : "💾 Save Scenario"}
            </Button>
            <Button variant="ghost" onClick={() => { setActiveId(null); setActiveData(null); setTab("hub"); }} className="w-full !text-slate-500">
              ← Back to Stories
            </Button>
          </div>
        )}

        <div className="p-4 border-t border-white/10">
          <div className="text-xs text-slate-500 mb-2 truncate">{user?.email}</div>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm"
          >
            <IconsList.Logout />
            Sign Out
          </button>
        </div>
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
                globalRegistry={conversationRegistry}
                onResumeConversation={handleResumeFromHistory}
                onDeleteConversation={handleDeleteConversationFromHistory}
                onRenameConversation={handleRenameConversationFromHistory}
              />
            </div>
          )}

          {tab === "chat_interface" && activeId && activeData && playingConversationId && (
            <ChatInterfaceTab
              scenarioId={activeId}
              appData={activeData}
              conversationId={playingConversationId}
              modelId={globalModelId}
              onUpdate={(convs) => handleUpdateActive({ conversations: convs })}
              onBack={() => { setPlayingConversationId(null); setTab("hub"); }}
              onSaveScenario={() => handleSave()}
              onUpdateUiSettings={(patch) => handleUpdateActive({ uiSettings: { ...activeData.uiSettings, ...patch } })}
            />
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
