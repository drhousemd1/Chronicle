
import React, { useRef, useState, useCallback } from 'react';
import { World, OpeningDialog, CodexEntry, Character, Scene, TimeOfDay, WorldCore } from '@/types';
import { Button, Input, TextArea, Card } from './UI';
import { Icons } from '@/constants';
import { uid, now, resizeImage, uuid, clamp } from '@/utils';
import { useAuth } from '@/hooks/use-auth';
import { uploadSceneImage, uploadCoverImage, dataUrlToBlob } from '@/services/supabase-data';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sunrise, Sun, Sunset, Moon, ChevronUp, ChevronDown, Pencil, Sparkles, Share2 } from 'lucide-react';
import { AVATAR_STYLES, DEFAULT_STYLE_ID } from '@/constants/avatar-styles';
import { cn } from '@/lib/utils';
import { SceneTagEditorModal } from './SceneTagEditorModal';
import { CoverImageGenerationModal } from './CoverImageGenerationModal';
import { SceneImageGenerationModal } from './SceneImageGenerationModal';
import { CoverImageActionButtons } from './CoverImageActionButtons';
import { SceneGalleryActionButtons } from './SceneGalleryActionButtons';
import { ShareScenarioModal } from './ShareScenarioModal';
import { aiEnhanceWorldField } from '@/services/world-ai';
import { useModelSettings } from '@/contexts/ModelSettingsContext';

interface WorldTabProps {
  scenarioId: string;
  world: World;
  characters: Character[];
  openingDialog: OpeningDialog;
  scenes: Scene[];
  coverImage: string;
  coverImagePosition: { x: number; y: number };
  selectedArtStyle: string;
  onUpdateWorld: (world: Partial<World>) => void;
  onUpdateOpening: (opening: Partial<OpeningDialog>) => void;
  onUpdateScenes: (scenes: Scene[]) => void;
  onUpdateCoverImage: (url: string) => void;
  onUpdateCoverPosition: (position: { x: number; y: number }) => void;
  onUpdateArtStyle: (styleId: string) => void;
  onNavigateToCharacters: () => void;
  onSelectCharacter: (id: string) => void;
}

const HintBox: React.FC<{ hints: string[] }> = ({ hints }) => (
  <div className="bg-zinc-900 rounded-xl p-4 space-y-2 border border-white/5">
    {hints.map((hint, index) => (
      <p key={index} className="text-sm text-zinc-400 leading-relaxed flex items-start gap-2">
        <span className="text-zinc-500 mt-0.5">◆</span>
        <span>{hint}</span>
      </p>
    ))}
  </div>
);

const CharacterButton: React.FC<{ char: Character; onSelect: (id: string) => void }> = ({ char, onSelect }) => (
  <button 
    type="button"
    onClick={() => onSelect(char.id)}
    className="w-full text-left group flex items-center gap-4 p-2 rounded-2xl hover:bg-slate-50 transition-all duration-200 border border-transparent hover:border-slate-100 cursor-pointer"
  >
    <div className="w-14 h-14 shrink-0 rounded-xl border-2 border-slate-100 overflow-hidden shadow-sm transition-transform duration-300 group-hover:scale-105 bg-slate-50">
      {char.avatarDataUrl ? (
        <img src={char.avatarDataUrl} alt={char.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center font-black text-slate-300 text-lg italic uppercase">
          {char.name.charAt(0)}
        </div>
      )}
    </div>
    <div className="min-w-0">
      <div className="text-sm font-bold text-slate-800 truncate leading-tight group-hover:text-blue-600 transition-colors">{char.name}</div>
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-0.5 truncate">{char.controlledBy}</div>
    </div>
  </button>
);

export const WorldTab: React.FC<WorldTabProps> = ({ 
  scenarioId,
  world, 
  characters, 
  openingDialog, 
  scenes,
  coverImage,
  coverImagePosition,
  selectedArtStyle,
  onUpdateWorld, 
  onUpdateOpening, 
  onUpdateScenes,
  onUpdateCoverImage,
  onUpdateCoverPosition,
  onUpdateArtStyle,
  onNavigateToCharacters, 
  onSelectCharacter 
}) => {
  const { user } = useAuth();
  const { modelId } = useModelSettings();
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isRepositioningCover, setIsRepositioningCover] = useState(false);
  const [coverDragStart, setCoverDragStart] = useState<{ x: number; y: number; pos: { x: number; y: number } } | null>(null);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [showCoverGenModal, setShowCoverGenModal] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [showSceneGenModal, setShowSceneGenModal] = useState(false);
  const [isGeneratingScene, setIsGeneratingScene] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [enhancingField, setEnhancingField] = useState<keyof WorldCore | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const coverContainerRef = useRef<HTMLDivElement>(null);

  const updateCore = (patch: any) => {
    onUpdateWorld({ core: { ...world.core, ...patch } });
  };

  // AI enhancement handler for World Core fields
  const handleEnhanceField = async (fieldName: keyof WorldCore) => {
    if (!modelId) {
      toast.error("No model selected. Please select a model in settings.");
      return;
    }
    
    setEnhancingField(fieldName);
    try {
      const enhanced = await aiEnhanceWorldField(
        fieldName,
        world.core[fieldName] || '',
        world.core,
        modelId
      );
      updateCore({ [fieldName]: enhanced });
      toast.success(`${fieldName.replace(/([A-Z])/g, ' $1').trim()} enhanced`);
    } catch (error: any) {
      console.error('Enhancement failed:', error);
      toast.error(error.message || "Enhancement failed");
    } finally {
      setEnhancingField(null);
    }
  };

  // Reusable field label with AI enhance button (dark theme)
  const FieldLabel: React.FC<{
    label: string;
    fieldName: keyof WorldCore;
  }> = ({ label, fieldName }) => {
    const isLoading = enhancingField === fieldName;
    return (
      <div className="flex items-center gap-2 mb-1">
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
          {label}
        </label>
        <button
          type="button"
          onClick={() => handleEnhanceField(fieldName)}
          disabled={isLoading || enhancingField !== null}
          title="Enhance with AI"
          className={cn(
            "p-1 rounded-md transition-all",
            isLoading 
              ? "text-cyan-400 animate-pulse cursor-wait" 
              : enhancingField !== null
              ? "text-zinc-600 cursor-not-allowed"
              : "text-zinc-400 hover:text-cyan-400 hover:bg-white/5"
          )}
        >
          <Sparkles size={14} />
        </button>
      </div>
    );
  };

  const handleUpdateEntry = (id: string, patch: Partial<CodexEntry>) => {
    const next = world.entries.map(e => e.id === id ? { ...e, ...patch, updatedAt: now() } : e);
    onUpdateWorld({ entries: next });
  };

  // Cover image handlers
  const handleCoverMouseDown = (e: React.MouseEvent) => {
    if (!isRepositioningCover) return;
    e.preventDefault();
    setCoverDragStart({
      x: e.clientX,
      y: e.clientY,
      pos: coverImagePosition || { x: 50, y: 50 }
    });
  };

  const handleCoverMouseMove = useCallback((e: React.MouseEvent) => {
    if (!coverDragStart || !coverContainerRef.current) return;
    
    const rect = coverContainerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - coverDragStart.x) / rect.width) * 100;
    const deltaY = ((e.clientY - coverDragStart.y) / rect.height) * 100;

    onUpdateCoverPosition({
      x: clamp(coverDragStart.pos.x - deltaX, 0, 100),
      y: clamp(coverDragStart.pos.y - deltaY, 0, 100)
    });
  }, [coverDragStart, onUpdateCoverPosition]);

  const handleCoverMouseUp = () => {
    setCoverDragStart(null);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setIsUploadingCover(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const dataUrl = reader.result as string;
          const optimized = await resizeImage(dataUrl, 1024, 1536, 0.85);
          const blob = dataUrlToBlob(optimized);
          if (!blob) throw new Error('Failed to process image');
          
          const filename = `cover-${uuid()}-${Date.now()}.jpg`;
          const publicUrl = await uploadCoverImage(user.id, blob, filename);
          
          onUpdateCoverImage(publicUrl);
          onUpdateCoverPosition({ x: 50, y: 50 });
          toast.success('Cover image uploaded');
        } catch (error) {
          console.error('Cover upload failed:', error);
          toast.error('Failed to upload cover');
        } finally {
          setIsUploadingCover(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Cover upload failed:', error);
      toast.error('Failed to upload cover');
      setIsUploadingCover(false);
    }
    e.target.value = '';
  };

  const handleDeleteCover = () => {
    if (confirm('Remove the cover image?')) {
      onUpdateCoverImage('');
      onUpdateCoverPosition({ x: 50, y: 50 });
    }
  };

  const handleAddScene = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!user) {
      toast.error('Please sign in to upload scenes');
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const dataUrl = reader.result as string;
          const optimized = await resizeImage(dataUrl, 1024, 768, 0.7);
          
          // Convert to blob and upload to Supabase Storage
          const blob = dataUrlToBlob(optimized);
          if (!blob) throw new Error('Failed to process image');
          
          const filename = `scene-${uuid()}-${Date.now()}.jpg`; // Use UUID for unique filename
          const publicUrl = await uploadSceneImage(user.id, blob, filename);
          
          const newScene: Scene = {
            id: uuid(), // Use UUID for Supabase
            url: publicUrl,
            tags: [],
            createdAt: now()
          };
          onUpdateScenes([newScene, ...scenes]);
          setEditingScene(newScene); // Open editor immediately for new scenes
          toast.success('Scene uploaded');
        } catch (error) {
          console.error('Scene upload failed:', error);
          toast.error('Failed to upload scene');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Scene upload failed:', error);
      toast.error('Failed to upload scene');
      setIsUploading(false);
    }
    e.target.value = '';
  };

  const handleUpdateSceneTags = (id: string, tags: string[]) => {
    const updatedScenes = scenes.map(s => s.id === id ? { ...s, tags } : s);
    onUpdateScenes(updatedScenes);
    // Also update the editing scene state so modal reflects changes
    if (editingScene?.id === id) {
      setEditingScene({ ...editingScene, tags });
    }
  };

  const handleDeleteScene = (id: string) => {
    if (confirm('Remove this scene image?')) {
      onUpdateScenes(scenes.filter(s => s.id !== id));
    }
  };

  const mainCharacters = characters.filter(c => c.characterRole === 'Main');
  const sideCharacters = characters.filter(c => c.characterRole === 'Side');

  const AddCharacterPlaceholder = () => (
    <button 
      type="button"
      onClick={onNavigateToCharacters}
      className="group/add w-full flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 bg-[#3a3a3f]/30 hover:bg-[#3a3a3f]/50 border-2 border-dashed border-zinc-600 hover:border-zinc-500 cursor-pointer"
    >
      <div className="w-14 h-14 shrink-0 rounded-xl bg-[#1a1a1f] border-2 border-dashed border-zinc-600 flex items-center justify-center text-zinc-500 transition-all duration-300 group-hover/add:border-zinc-400 group-hover/add:bg-[#3a3a3f]/70 group-hover/add:text-zinc-300">
         <span className="text-2xl font-light">+</span>
      </div>
      <div className="text-left">
        <div className="text-xs font-bold text-zinc-400 group-hover/add:text-zinc-200 transition-colors uppercase tracking-tight">Add / Create</div>
        <div className="text-[9px] font-black text-zinc-500 group-hover/add:text-zinc-400 uppercase tracking-widest mt-0.5">Character Registry</div>
      </div>
    </button>
  );

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <aside className="w-[260px] flex-shrink-0 bg-[#2a2a2f] border-r border-white/10 flex flex-col h-full">
        <div className="p-6 border-b border-white/10 bg-[#4a5f7f]">
          <div className="text-[10px] font-black text-white uppercase tracking-widest">Character Roster</div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-none pb-20 bg-[#2a2a2f]">
          <section className="space-y-2">
            <div className="bg-[#4a5f7f] px-4 py-2 rounded-xl mb-3 shadow-sm">
               <div className="text-[10px] font-bold text-white uppercase tracking-wider">Main Characters</div>
            </div>
            <div className="space-y-2">
              {mainCharacters.map(char => <CharacterButton key={char.id} char={char} onSelect={onSelectCharacter} />)}
              <AddCharacterPlaceholder />
            </div>
          </section>

          <section className="space-y-2">
            <div className="bg-[#4a5f7f] px-4 py-2 rounded-xl mb-3 shadow-sm">
               <div className="text-[10px] font-bold text-white uppercase tracking-wider">Side Characters</div>
            </div>
            <div className="space-y-2">
              {sideCharacters.map(char => <CharacterButton key={char.id} char={char} onSelect={onSelectCharacter} />)}
              <AddCharacterPlaceholder />
            </div>
          </section>
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto scrollbar-thin bg-slate-50/30">
        <div className="p-10 max-w-4xl mx-auto space-y-12 pb-20">
          <div className="mb-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Scenario Setup</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Configure the foundation of your interactive narrative.</p>
          </div>

          {/* Cover Image Section - Dark Theme */}
          <section>
            <div className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]">
              {/* Section Header - Steel Blue */}
              <div className="bg-[#4a5f7f] border-b border-white/20 px-6 py-4 flex items-center gap-3 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                <h2 className="text-white text-xl font-bold tracking-tight">Cover Image</h2>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <div className="p-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5">
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* Preview Container - Portrait aspect ratio for story cards */}
                    <div 
                      ref={coverContainerRef}
                      onMouseDown={handleCoverMouseDown}
                      onMouseMove={handleCoverMouseMove}
                      onMouseUp={handleCoverMouseUp}
                      onMouseLeave={handleCoverMouseUp}
                      className={`relative w-full md:w-48 aspect-[2/3] rounded-2xl overflow-hidden transition-all duration-200 ${
                        isRepositioningCover 
                          ? 'ring-4 ring-blue-500 cursor-move shadow-xl shadow-blue-500/20' 
                          : 'border-2 border-white/10 shadow-lg'
                      }`}
                    >
                      {coverImage ? (
                        <>
                          <img 
                            src={coverImage}
                            alt="Cover"
                            style={{ objectPosition: `${coverImagePosition.x}% ${coverImagePosition.y}%` }}
                            className="w-full h-full object-cover pointer-events-none select-none"
                            draggable={false}
                          />
                          {isRepositioningCover && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                              <div className="w-full h-[1px] bg-blue-500/40 absolute" />
                              <div className="h-full w-[1px] bg-blue-500/40 absolute" />
                              <div className="bg-blue-600 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-lg absolute bottom-3 tracking-widest shadow-xl">
                                Drag to Refocus
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex flex-col items-center justify-center border-2 border-dashed border-zinc-600 gap-3 rounded-2xl">
                          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">No Cover</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Controls */}
                    <div className="flex flex-col gap-4 flex-1">
                      <HintBox hints={[
                        "This image appears on your story card in the hub. For best results, use a portrait-oriented image (2:3 aspect ratio)."
                      ]} />
                      
                      <CoverImageActionButtons
                        onUploadFromDevice={() => coverFileInputRef.current?.click()}
                        onSelectFromLibrary={(imageUrl) => {
                          onUpdateCoverImage(imageUrl);
                          onUpdateCoverPosition({ x: 50, y: 50 });
                        }}
                        onGenerateClick={() => setShowCoverGenModal(true)}
                        disabled={isUploadingCover || isGeneratingCover}
                        isUploading={isUploadingCover}
                        isGenerating={isGeneratingCover}
                      />
                      
                      {coverImage && (
                        <div className="flex flex-wrap gap-3">
                          <button 
                            onClick={() => setIsRepositioningCover(!isRepositioningCover)}
                            className={`h-10 px-5 rounded-xl text-[10px] font-bold transition-colors ${
                              isRepositioningCover 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600 border border-zinc-600'
                            }`}
                          >
                            {isRepositioningCover ? "Done" : "Reposition"}
                          </button>
                          <button 
                            onClick={handleDeleteCover}
                            className="h-10 px-5 rounded-xl text-[10px] font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                      
                      <input 
                        type="file" 
                        ref={coverFileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleCoverUpload} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* World Core Section - Dark Theme */}
          <section>
            <div className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]">
              <div className="bg-[#4a5f7f] border-b border-white/20 px-6 py-4 flex items-center gap-3 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                <h2 className="text-white text-xl font-bold tracking-tight">World Core</h2>
              </div>
              <div className="p-6">
                <div className="p-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5">
                  <div className="grid grid-cols-1 gap-8">
                    <div>
                      <FieldLabel label="Scenario Name" fieldName="scenarioName" />
                      <Input value={world.core.scenarioName} onChange={(v) => updateCore({ scenarioName: v })} placeholder="e.g. Chronicles of Eldoria" className="bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-500" />
                    </div>
                    <div>
                      <FieldLabel label="Brief Description" fieldName="briefDescription" />
                      <TextArea value={world.core.briefDescription || ''} onChange={(v) => updateCore({ briefDescription: v })} rows={2} placeholder="A short summary that appears on your story card (1-2 sentences)..." className="bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-500" />
                    </div>
                    <div>
                      <FieldLabel label="Story Premise" fieldName="storyPremise" />
                      <TextArea value={world.core.storyPremise || ''} onChange={(v) => updateCore({ storyPremise: v })} rows={4} placeholder="What's the central situation or conflict? What's at stake? Describe the overall narrative the AI should understand..." className="bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-500" />
                    </div>
                    <div>
                      <FieldLabel label="Setting Overview" fieldName="settingOverview" />
                      <TextArea value={world.core.settingOverview} onChange={(v) => updateCore({ settingOverview: v })} rows={4} placeholder="Describe the physical and cultural landscape of your world..." className="bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-500" />
                    </div>
                    <div>
                      <FieldLabel label="Rules of Magic & Technology" fieldName="rulesOfMagicTech" />
                      <TextArea value={world.core.rulesOfMagicTech} onChange={(v) => updateCore({ rulesOfMagicTech: v })} rows={3} placeholder="How do supernatural or advanced systems function?" className="bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-500" />
                    </div>
                    <div>
                      <FieldLabel label="Primary Locations" fieldName="locations" />
                      <TextArea value={world.core.locations} onChange={(v) => updateCore({ locations: v })} rows={3} placeholder="List key cities, landmarks, or regions..." className="bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-500" />
                    </div>
                    <div>
                      <FieldLabel label="Tone & Central Themes" fieldName="toneThemes" />
                      <TextArea value={world.core.toneThemes} onChange={(v) => updateCore({ toneThemes: v })} rows={3} placeholder="What feelings and ideas should define the story?" className="bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Opening Dialog Section - Dark Theme */}
          <section>
            <div className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]">
              <div className="bg-[#4a5f7f] border-b border-white/20 px-6 py-4 flex items-center gap-3 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <h2 className="text-white text-xl font-bold tracking-tight">Opening Dialog</h2>
              </div>
              <div className="p-6">
                <div className="p-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5">
                  <div className="space-y-6">
                    <HintBox hints={[
                      "Opening dialog will display at the start of every new session. This should set the scene for where the story begins.",
                      'Dialog / blocks of dialog should be started with the name of the character followed by ":" i.e., "James:" This triggers avatars to appear by the appropriate dialog.',
                      'Enclose all spoken dialogue in " ".',
                      "Enclose all physical actions or descriptions in * *.",
                      "Enclose all internal thoughts in ( )."
                    ]} />
                    <div>
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Opening Dialog</label>
                      <TextArea 
                        value={openingDialog.text} 
                        onChange={(v) => onUpdateOpening({ text: v })} 
                        rows={8} 
                        placeholder='James: *James looked up from where he sat on the ground* (What was that?) "Hello? Is anyone there?"'
                        className="bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                    </div>
                    
                    {/* Starting Day & Time Controls */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Starting Day & Time</label>
                      <div className="flex items-center gap-6">
                        {/* Day Counter */}
                        <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-4 py-2 border border-zinc-700">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mr-1">Day</span>
                          <button
                            type="button"
                            onClick={() => {
                              const current = openingDialog.startingDay || 1;
                              if (current > 1) onUpdateOpening({ startingDay: current - 1 });
                            }}
                            className="p-1 rounded-md hover:bg-zinc-700 text-zinc-400 transition-colors disabled:opacity-30"
                            disabled={(openingDialog.startingDay || 1) <= 1}
                          >
                            <ChevronDown size={16} />
                          </button>
                          <span className="text-lg font-bold text-white min-w-[2ch] text-center">
                            {openingDialog.startingDay || 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const current = openingDialog.startingDay || 1;
                              onUpdateOpening({ startingDay: current + 1 });
                            }}
                            className="p-1 rounded-md hover:bg-zinc-700 text-zinc-400 transition-colors"
                          >
                            <ChevronUp size={16} />
                          </button>
                        </div>

                        {/* Time of Day Icons */}
                        <div className="flex items-center gap-1 bg-zinc-800 rounded-xl p-1 border border-zinc-700">
                          {([
                            { key: 'sunrise' as TimeOfDay, icon: Sunrise, label: 'Sunrise' },
                            { key: 'day' as TimeOfDay, icon: Sun, label: 'Day' },
                            { key: 'sunset' as TimeOfDay, icon: Sunset, label: 'Sunset' },
                            { key: 'night' as TimeOfDay, icon: Moon, label: 'Night' },
                          ] as const).map(({ key, icon: Icon, label }) => {
                            const isActive = (openingDialog.startingTimeOfDay || 'day') === key;
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => onUpdateOpening({ startingTimeOfDay: key })}
                                title={label}
                                className={`p-2 rounded-lg transition-all ${
                                  isActive 
                                    ? 'bg-blue-500 text-white shadow-md' 
                                    : 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                                }`}
                              >
                                <Icon size={18} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <HintBox hints={[
                      "Set when your story begins. The AI will use this context for time-appropriate responses.",
                      "This message will automatically appear at the start of every new session."
                    ]} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Scene Gallery Section - Dark Theme */}
          <section>
            <div className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]">
              <div className="bg-[#4a5f7f] border-b border-white/20 px-6 py-4 flex items-center gap-3 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                <h2 className="text-white text-xl font-bold tracking-tight">Scene Gallery</h2>
              </div>
              <div className="p-6">
                <div className="p-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5">
                  {/* HintBox + Buttons side by side */}
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <HintBox hints={[
                        "Upload images to be used for different scenes.",
                        "Add \"tags\" for each image.",
                        "Background adapts based on tags mentioned in dialog.",
                        "Recommend: 1024x768, 4:3 aspect ratio."
                      ]} />
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <SceneGalleryActionButtons
                        onUploadFromDevice={() => fileInputRef.current?.click()}
                        onSelectFromLibrary={(imageUrl) => {
                          const newScene: Scene = {
                            id: uuid(),
                            url: imageUrl,
                            tags: [],
                            createdAt: now()
                          };
                          onUpdateScenes([newScene, ...scenes]);
                          setEditingScene(newScene);
                          toast.success('Scene added from library');
                        }}
                        onGenerateClick={() => setShowSceneGenModal(true)}
                        disabled={isUploading || isGeneratingScene}
                        isUploading={isUploading}
                        isGenerating={isGeneratingScene}
                      />
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAddScene} />
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-6">
                    {scenes.map(scene => {
                      // Migration: handle legacy single tag
                      const sceneTags = scene.tags ?? ((scene as any).tag ? [(scene as any).tag] : []);
                      const tagCount = sceneTags.length;
                      
                      return (
                        <div key={scene.id} className="group relative aspect-video rounded-xl overflow-hidden border border-zinc-700 shadow-sm bg-zinc-800">
                          <img src={scene.url} alt={sceneTags[0] || 'Scene'} className="w-full h-full object-cover" />
                          
                          {/* Bottom bar with tag count and edit button */}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3">
                            <div className="flex items-center justify-between">
                              {/* Tag count indicator */}
                              <div className="flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60 flex-shrink-0">
                                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                                  <line x1="7" y1="7" x2="7.01" y2="7"/>
                                </svg>
                                <span className="text-white/80 text-[11px] font-medium">
                                  {tagCount === 0 ? 'No tags' : `${tagCount} tag${tagCount !== 1 ? 's' : ''}`}
                                </span>
                              </div>
                              
                              {/* Edit button - always visible */}
                              <button
                                onClick={() => setEditingScene({ ...scene, tags: sceneTags })}
                                className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all"
                                title="Edit tags"
                              >
                                <Pencil size={14} />
                              </button>
                            </div>
                          </div>
                          
                          {/* Delete button */}
                          <button 
                            onClick={() => handleDeleteScene(scene.id)}
                            className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                          >
                            <Icons.Trash />
                          </button>
                          
                          {/* Starting Scene Checkbox */}
                          <button
                            onClick={() => {
                              const updatedScenes = scenes.map(s => ({
                                ...s,
                                isStartingScene: s.id === scene.id ? !s.isStartingScene : false
                              }));
                              onUpdateScenes(updatedScenes);
                            }}
                            className={`absolute top-2 left-2 p-1.5 rounded-lg transition-all ${
                              scene.isStartingScene 
                                ? 'bg-amber-500 text-white opacity-100 shadow-lg shadow-amber-500/30' 
                                : 'bg-black/50 text-white/70 opacity-0 group-hover:opacity-100 hover:bg-black/70'
                            }`}
                            title={scene.isStartingScene ? "Starting scene" : "Set as starting scene"}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={scene.isStartingScene ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                          </button>
                          {scene.isStartingScene && (
                            <div className="absolute top-2 left-10 bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-lg">
                              Start
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {scenes.length === 0 && (
                      <div className="col-span-full py-12 text-center text-zinc-500 border-2 border-dashed border-zinc-700 rounded-2xl">
                         <p className="text-xs font-bold uppercase tracking-widest">No scenes uploaded</p>
                         <p className="text-sm mt-1 text-zinc-600">Upload images to enable dynamic backgrounds in chat.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Art Style Preference Section - Dark Theme */}
          <section>
            <div className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]">
              <div className="bg-[#4a5f7f] border-b border-white/20 px-6 py-4 flex items-center gap-3 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <circle cx="13.5" cy="6.5" r="2.5"/>
                  <circle cx="6" cy="12" r="2.5"/>
                  <circle cx="18" cy="12" r="2.5"/>
                  <circle cx="9" cy="18.5" r="2.5"/>
                  <circle cx="17" cy="18.5" r="2.5"/>
                  <path d="M12 2v1"/>
                </svg>
                <h2 className="text-white text-xl font-bold tracking-tight">Art Style Preference</h2>
              </div>
              <div className="p-6">
                <div className="p-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5">
                  <HintBox hints={[
                    "Select an art style you would like the AI to use when generating character avatars or images during your playthrough."
                  ]} />
                  
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {AVATAR_STYLES.map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => onUpdateArtStyle(style.id)}
                        className={cn(
                          "relative rounded-xl p-2 transition-all duration-200 cursor-pointer outline-none",
                          "bg-zinc-800 hover:bg-zinc-700",
                          selectedArtStyle === style.id
                            ? "ring-2 ring-blue-400 shadow-md shadow-blue-500/20"
                            : "ring-1 ring-zinc-600 hover:ring-zinc-500",
                          "focus:ring-2 focus:ring-blue-400 focus:ring-offset-0"
                        )}
                      >
                        <div className="aspect-square rounded-lg overflow-hidden bg-zinc-900">
                          <img
                            src={style.thumbnailUrl}
                            alt={style.displayName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-xs font-semibold text-zinc-200 text-center mt-2 truncate">
                          {style.displayName}
                        </p>
                        {selectedArtStyle === style.id && (
                          <div className="absolute top-3 right-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* World Codex Section - Dark Theme */}
          <section>
            <div className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]">
              <div className="bg-[#4a5f7f] border-b border-white/20 px-6 py-4 flex items-center gap-3 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
                <h2 className="text-white text-xl font-bold tracking-tight">World Codex</h2>
              </div>
              <div className="p-6">
                <div className="p-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5">
                  <div className="space-y-8">
                    <div>
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Narrative Style</label>
                      <TextArea 
                        value={world.core.narrativeStyle} 
                        onChange={(v) => updateCore({ narrativeStyle: v })} 
                        rows={4} 
                        placeholder="Detailed descriptions of environments and character actions..."
                        className="bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-500"
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <label className="block text-[10px] font-black uppercase text-zinc-400 tracking-widest">Dialog Formatting</label>
                      
                      {/* Critical rules - always present, read-only */}
                      <HintBox hints={[
                        'Enclose all spoken dialogue in " ".',
                        'Enclose all physical actions or descriptions in * *.',
                        'Enclose all internal thoughts in ( ).'
                      ]} />
                      
                      {/* User's additional formatting preferences - editable */}
                      <div>
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Additional Formatting Rules (Optional)</label>
                        <TextArea 
                          value={world.core.dialogFormatting} 
                          onChange={(v) => updateCore({ dialogFormatting: v })} 
                          rows={3} 
                          placeholder="Add any custom formatting preferences here..."
                          className="bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-500"
                        />
                      </div>
                    </div>

                    {world.entries.length > 0 && (
                      <div className="space-y-6 pt-6 border-t border-zinc-700/50">
                        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Additional Entries</h3>
                        <div className="grid grid-cols-1 gap-6">
                          {world.entries.map(entry => (
                            <div key={entry.id} className="p-6 space-y-4 group rounded-2xl bg-zinc-800/50 border border-zinc-700">
                              <div className="flex justify-between items-center">
                                <div className="flex-1">
                                  <Input 
                                    value={entry.title} 
                                    onChange={(v) => handleUpdateEntry(entry.id, { title: v })} 
                                    placeholder="Entry Title..." 
                                    className="!text-sm font-bold !bg-transparent !border-none !px-0 focus:!ring-0 text-white placeholder:text-zinc-500"
                                  />
                                </div>
                                <Button variant="ghost" className="text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 !p-0 hover:text-rose-300 hover:bg-rose-500/10" onClick={() => {
                                  const next = world.entries.filter(e => e.id !== entry.id);
                                  onUpdateWorld({ entries: next });
                                }}><Icons.Trash /></Button>
                              </div>
                              <TextArea value={entry.body} onChange={(v) => handleUpdateEntry(entry.id, { body: v })} placeholder="Detail the specifics..." rows={4} className="!bg-transparent border-zinc-700 text-white placeholder:text-zinc-500" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Share Section */}
          <section>
            <div className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 border-b border-white/20 px-6 py-4 flex items-center gap-3 shadow-lg">
                <Share2 className="w-5 h-5 text-white" />
                <h2 className="text-white text-xl font-bold tracking-tight">Share Your Story</h2>
              </div>
              <div className="p-6">
                <div className="p-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5">
                  <HintBox hints={[
                    'Publish to the gallery for others to discover.',
                    'Choose whether others can remix or play-only.',
                    'Add tags so players can find your story.'
                  ]} />
                  <div className="mt-4">
                    <Button 
                      variant="primary"
                      onClick={() => setShowShareModal(true)}
                      className="w-full !bg-gradient-to-r !from-blue-600 !to-purple-600 hover:!from-blue-500 hover:!to-purple-500"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Publish to Gallery
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      
      {/* Scene Tag Editor Modal */}
      <SceneTagEditorModal
        isOpen={!!editingScene}
        onClose={() => setEditingScene(null)}
        scene={editingScene}
        onUpdateTags={handleUpdateSceneTags}
      />
      
      {/* Cover Image Generation Modal */}
      <CoverImageGenerationModal
        isOpen={showCoverGenModal}
        onClose={() => setShowCoverGenModal(false)}
        onGenerated={(imageUrl) => {
          onUpdateCoverImage(imageUrl);
          onUpdateCoverPosition({ x: 50, y: 50 });
          setShowCoverGenModal(false);
          toast.success('Cover image generated!');
        }}
        scenarioTitle={world.core.scenarioName}
      />
      
      {/* Scene Image Generation Modal */}
      <SceneImageGenerationModal
        isOpen={showSceneGenModal}
        onClose={() => setShowSceneGenModal(false)}
        onGenerate={async (prompt, styleId) => {
          if (!user) {
            toast.error('Please sign in to generate scenes');
            return;
          }
          
          setIsGeneratingScene(true);
          try {
            const style = AVATAR_STYLES.find(s => s.id === styleId);
            const artStylePrompt = style?.backendPrompt || '';
            
            const { data, error } = await supabase.functions.invoke('generate-cover-image', {
              body: {
                prompt: `Scene: ${prompt}. Landscape composition, 4:3 aspect ratio environment background.`,
                artStylePrompt,
                scenarioTitle: world.core.scenarioName
              }
            });
            
            if (error) throw error;
            
            if (data?.imageUrl) {
              // Create new scene with the generated image
              const newScene: Scene = {
                id: uuid(),
                url: data.imageUrl,
                tags: [],
                createdAt: now()
              };
              onUpdateScenes([newScene, ...scenes]);
              setEditingScene(newScene);
              setShowSceneGenModal(false);
              toast.success('Scene generated!');
            } else {
              throw new Error('No image URL returned');
            }
          } catch (err) {
            console.error('Scene generation failed:', err);
            toast.error('Failed to generate scene');
          } finally {
            setIsGeneratingScene(false);
          }
        }}
        isGenerating={isGeneratingScene}
        selectedArtStyle={selectedArtStyle}
      />
      
      {/* Share Scenario Modal */}
      {user && (
        <ShareScenarioModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          scenarioId={scenarioId}
          scenarioTitle={world.core.scenarioName || 'Untitled Story'}
          userId={user.id}
        />
      )}
    </div>
  );
};
