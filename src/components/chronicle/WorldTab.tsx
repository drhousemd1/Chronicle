
import React, { useRef, useState, useCallback } from 'react';
import { World, OpeningDialog, CodexEntry, Character, Scene, TimeOfDay } from '@/types';
import { Button, Input, TextArea, Card } from './UI';
import { Icons } from '@/constants';
import { uid, now, resizeImage, uuid, clamp } from '@/utils';
import { useAuth } from '@/hooks/use-auth';
import { uploadSceneImage, uploadCoverImage, dataUrlToBlob } from '@/services/supabase-data';
import { toast } from 'sonner';
import { Sunrise, Sun, Sunset, Moon, ChevronUp, ChevronDown, Pencil } from 'lucide-react';
import { AVATAR_STYLES, DEFAULT_STYLE_ID } from '@/constants/avatar-styles';
import { cn } from '@/lib/utils';
import { SceneTagEditorModal } from './SceneTagEditorModal';

interface WorldTabProps {
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
  <div className="bg-slate-900 rounded-xl p-4 space-y-2">
    {hints.map((hint, index) => (
      <p key={index} className="text-sm text-white leading-relaxed flex items-start gap-2">
        <span className="text-white mt-0.5">◆</span>
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
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isRepositioningCover, setIsRepositioningCover] = useState(false);
  const [coverDragStart, setCoverDragStart] = useState<{ x: number; y: number; pos: { x: number; y: number } } | null>(null);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const coverContainerRef = useRef<HTMLDivElement>(null);

  const updateCore = (patch: any) => {
    onUpdateWorld({ core: { ...world.core, ...patch } });
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
      className="group/add w-full flex items-center gap-4 p-2 rounded-2xl transition-all duration-300 hover:bg-blue-50/50 cursor-pointer"
    >
      <div className="w-14 h-14 shrink-0 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 transition-all duration-300 group-hover/add:border-blue-400 group-hover/add:bg-blue-50 group-hover/add:text-blue-500">
         <span className="text-2xl font-light">+</span>
      </div>
      <div className="text-left">
        <div className="text-xs font-bold text-slate-400 group-hover/add:text-blue-600 transition-colors uppercase tracking-tight">Add / Create</div>
        <div className="text-[9px] font-black text-slate-300 group-hover/add:text-blue-300 uppercase tracking-widest mt-0.5">Character Registry</div>
      </div>
    </button>
  );

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <aside className="w-[260px] flex-shrink-0 bg-white border-r border-slate-200 flex flex-col h-full shadow-[inset_-4px_0_12px_rgba(0,0,0,0.02)]">
        <div className="p-6 border-b border-slate-100 bg-slate-50/30">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Character Roster</div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-none pb-20">
          <section className="space-y-2">
            <div className="bg-slate-100 px-3 py-1.5 rounded-lg mb-3">
               <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Main Characters</div>
            </div>
            <div className="space-y-2">
              {mainCharacters.map(char => <CharacterButton key={char.id} char={char} onSelect={onSelectCharacter} />)}
              <AddCharacterPlaceholder />
            </div>
          </section>

          <section className="space-y-2">
            <div className="bg-slate-100 px-3 py-1.5 rounded-lg mb-3">
               <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Side Characters</div>
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

          {/* Cover Image Section */}
          <section>
            <Card className="p-8 !shadow-[0_12px_32px_-2px_rgba(0,0,0,0.15)] border-transparent ring-1 ring-slate-900/5">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight mb-8 pb-4 border-b border-slate-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                Cover Image
              </h2>
              
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
                      : 'border-2 border-slate-100 shadow-lg'
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
                    <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 gap-3 rounded-2xl">
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Cover</span>
                    </div>
                  )}
                </div>
                
                {/* Controls */}
                <div className="flex flex-col gap-4 flex-1">
              <HintBox hints={[
                "This image appears on your story card in the hub. For best results, use a portrait-oriented image (2:3 aspect ratio)."
              ]} />
                  
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      variant="primary" 
                      onClick={() => coverFileInputRef.current?.click()} 
                      disabled={isUploadingCover}
                      className="!px-5"
                    >
                      {isUploadingCover ? "Uploading..." : coverImage ? "Change Image" : "Upload Image"}
                    </Button>
                    
                    {coverImage && (
                      <>
                        <Button 
                          variant={isRepositioningCover ? 'primary' : 'secondary'}
                          onClick={() => setIsRepositioningCover(!isRepositioningCover)}
                          className="!px-5"
                        >
                          {isRepositioningCover ? "Done" : "Reposition"}
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="!text-rose-500 hover:!bg-rose-50" 
                          onClick={handleDeleteCover}
                        >
                          Remove
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <input 
                    type="file" 
                    ref={coverFileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleCoverUpload} 
                  />
                </div>
              </div>
            </Card>
          </section>

          <section>
            <Card className="p-8 !shadow-[0_12px_32px_-2px_rgba(0,0,0,0.15)] border-transparent ring-1 ring-slate-900/5">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight mb-8 pb-4 border-b border-slate-100">
                <Icons.Globe /> World Core
              </h2>
              <div className="grid grid-cols-1 gap-8">
                <Input label="Scenario Name" value={world.core.scenarioName} onChange={(v) => updateCore({ scenarioName: v })} placeholder="e.g. Chronicles of Eldoria" />
                <TextArea label="Brief Description" value={world.core.briefDescription || ''} onChange={(v) => updateCore({ briefDescription: v })} rows={2} placeholder="A short summary that appears on your story card (1-2 sentences)..." />
                <TextArea label="Setting Overview" value={world.core.settingOverview} onChange={(v) => updateCore({ settingOverview: v })} rows={4} placeholder="Describe the physical and cultural landscape of your world..." />
                <TextArea label="Rules of Magic & Technology" value={world.core.rulesOfMagicTech} onChange={(v) => updateCore({ rulesOfMagicTech: v })} rows={3} placeholder="How do supernatural or advanced systems function?" />
                <TextArea label="Primary Locations" value={world.core.locations} onChange={(v) => updateCore({ locations: v })} rows={3} placeholder="List key cities, landmarks, or regions..." />
                <TextArea label="Tone & Central Themes" value={world.core.toneThemes} onChange={(v) => updateCore({ toneThemes: v })} rows={3} placeholder="What feelings and ideas should define the story?" />
              </div>
            </Card>
          </section>

          <section>
            <Card className="p-8 !shadow-[0_12px_32px_-2px_rgba(0,0,0,0.15)] border-transparent ring-1 ring-slate-900/5">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight mb-8 pb-4 border-b border-slate-100">
                <Icons.MessageSquare /> Opening Dialog
              </h2>
              <div className="space-y-6">
                <HintBox hints={[
                  "Opening dialog will display at the start of every new session. This should set the scene for where the story begins.",
                  'Dialog / blocks of dialog should be started with the name of the character followed by ":" i.e., "James:" This triggers avatars to appear by the appropriate dialog.',
                  'Enclose all spoken dialogue in " ".',
                  "Enclose all physical actions or descriptions in * *.",
                  "Enclose all internal thoughts in ( )."
                ]} />
                <TextArea 
                  label="Opening Dialog" 
                  value={openingDialog.text} 
                  onChange={(v) => onUpdateOpening({ text: v })} 
                  rows={8} 
                  placeholder='James: *James looked up from where he sat on the ground* (What was that?) "Hello? Is anyone there?"'
                />
                
                {/* Starting Day & Time Controls */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Starting Day & Time</label>
                  <div className="flex items-center gap-6">
                    {/* Day Counter */}
                    <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Day</span>
                      <button
                        type="button"
                        onClick={() => {
                          const current = openingDialog.startingDay || 1;
                          if (current > 1) onUpdateOpening({ startingDay: current - 1 });
                        }}
                        className="p-1 rounded-md hover:bg-slate-200 text-slate-500 transition-colors disabled:opacity-30"
                        disabled={(openingDialog.startingDay || 1) <= 1}
                      >
                        <ChevronDown size={16} />
                      </button>
                      <span className="text-lg font-bold text-slate-700 min-w-[2ch] text-center">
                        {openingDialog.startingDay || 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const current = openingDialog.startingDay || 1;
                          onUpdateOpening({ startingDay: current + 1 });
                        }}
                        className="p-1 rounded-md hover:bg-slate-200 text-slate-500 transition-colors"
                      >
                        <ChevronUp size={16} />
                      </button>
                    </div>

                    {/* Time of Day Icons */}
                    <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 border border-slate-200">
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
                                : 'text-slate-400 hover:bg-slate-200 hover:text-slate-600'
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
            </Card>
          </section>

          <section>
            <Card className="p-8 !shadow-[0_12px_32px_-2px_rgba(0,0,0,0.15)] border-transparent ring-1 ring-slate-900/5">
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg> Scene Gallery
                </h2>
                <Button 
                  variant="primary" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                   {isUploading ? "Uploading..." : "+ Upload Scene"}
                </Button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAddScene} />
              </div>

              <HintBox hints={[
                "Add keywords to each scene. When dialog mentions these keywords, the background will automatically change.",
                "Recommended: 1024px × 768px (landscape orientation, 4:3 aspect ratio)"
              ]} />
              <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-6">
                {scenes.map(scene => {
                  // Migration: handle legacy single tag
                  const sceneTags = scene.tags ?? ((scene as any).tag ? [(scene as any).tag] : []);
                  const tagCount = sceneTags.length;
                  
                  return (
                    <div key={scene.id} className="group relative aspect-video rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
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
                  <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                     <p className="text-xs font-bold uppercase tracking-widest">No scenes uploaded</p>
                     <p className="text-sm mt-1">Upload images to enable dynamic backgrounds in chat.</p>
                  </div>
                )}
              </div>
            </Card>
          </section>

          {/* Art Style Preference Section */}
          <section className="space-y-6">
            <Card className="p-8 !shadow-[0_12px_32px_-2px_rgba(0,0,0,0.15)] border-transparent ring-1 ring-slate-900/5">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight mb-8 pb-4 border-b border-slate-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="13.5" cy="6.5" r="2.5"/>
                  <circle cx="6" cy="12" r="2.5"/>
                  <circle cx="18" cy="12" r="2.5"/>
                  <circle cx="9" cy="18.5" r="2.5"/>
                  <circle cx="17" cy="18.5" r="2.5"/>
                  <path d="M12 2v1"/>
                </svg>
                Art Style Preference
              </h2>
              
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
                      "bg-white hover:bg-slate-50",
                      selectedArtStyle === style.id
                        ? "ring-2 ring-blue-400 shadow-md"
                        : "ring-1 ring-slate-200 hover:ring-slate-300",
                      "focus:ring-2 focus:ring-blue-100 focus:ring-offset-0"
                    )}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden bg-slate-100">
                      <img
                        src={style.thumbnailUrl}
                        alt={style.displayName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs font-semibold text-slate-700 text-center mt-2 truncate">
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
            </Card>
          </section>

          <section className="space-y-6">
            <Card className="p-8 !shadow-[0_12px_32px_-2px_rgba(0,0,0,0.15)] border-transparent ring-1 ring-slate-900/5">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight mb-8 pb-4 border-b border-slate-100">
                <Icons.Database /> World Codex
              </h2>
              
              <div className="space-y-8">
                <TextArea 
                  label="Narrative Style" 
                  value={world.core.narrativeStyle} 
                  onChange={(v) => updateCore({ narrativeStyle: v })} 
                  rows={4} 
                  placeholder="Detailed descriptions of environments and character actions..."
                />
                
                <div className="space-y-4">
                  <label className="block text-xs font-bold uppercase text-slate-500">Dialog Formatting</label>
                  
                  {/* Critical rules - always present, read-only */}
                  <HintBox hints={[
                    'Enclose all spoken dialogue in " ".',
                    'Enclose all physical actions or descriptions in * *.',
                    'Enclose all internal thoughts in ( ).'
                  ]} />
                  
                  {/* User's additional formatting preferences - editable */}
                  <TextArea 
                    label="Additional Formatting Rules (Optional)"
                    value={world.core.dialogFormatting} 
                    onChange={(v) => updateCore({ dialogFormatting: v })} 
                    rows={3} 
                    placeholder="Add any custom formatting preferences here..."
                  />
                </div>

                {world.entries.length > 0 && (
                  <div className="space-y-6 pt-6 border-t border-slate-100">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Additional Entries</h3>
                    <div className="grid grid-cols-1 gap-6">
                      {world.entries.map(entry => (
                        <div key={entry.id} className="p-6 space-y-4 group rounded-2xl bg-slate-50 border border-slate-200">
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <Input 
                                value={entry.title} 
                                onChange={(v) => handleUpdateEntry(entry.id, { title: v })} 
                                placeholder="Entry Title..." 
                                className="!text-sm font-bold !bg-transparent !border-none !px-0 focus:!ring-0"
                              />
                            </div>
                            <Button variant="ghost" className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 !p-0" onClick={() => {
                              const next = world.entries.filter(e => e.id !== entry.id);
                              onUpdateWorld({ entries: next });
                            }}><Icons.Trash /></Button>
                          </div>
                          <TextArea value={entry.body} onChange={(v) => handleUpdateEntry(entry.id, { body: v })} placeholder="Detail the specifics..." rows={4} className="!bg-transparent" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
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
    </div>
  );
};
