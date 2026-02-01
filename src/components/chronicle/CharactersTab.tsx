
import React, { useRef, useState, useCallback } from 'react';
import { Character, CharacterTraitSection, ScenarioData, PhysicalAppearance, CurrentlyWearing, PreferredClothing, CharacterGoal } from '@/types';
import { Button, Input, TextArea, Card } from './UI';
import { Icons } from '@/constants';
import { uid, now, clamp, resizeImage } from '@/utils';
import { useAuth } from '@/hooks/use-auth';
import { uploadAvatar, dataUrlToBlob } from '@/services/supabase-data';
import { toast } from 'sonner';
import { AvatarGenerationModal } from './AvatarGenerationModal';
import { UploadSourceMenu } from './UploadSourceMenu';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { aiEnhanceCharacterField } from '@/services/character-ai';
import { CharacterGoalsSection } from './CharacterGoalsSection';

interface CharactersTabProps {
  appData: ScenarioData;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, patch: Partial<Character>) => void;
  onDelete: (id: string) => void;
}

// Hardcoded section component with distinct styling
const HardcodedSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <Card className="p-6 space-y-4 !shadow-[0_12px_32px_-2px_rgba(0,0,0,0.15)] !bg-slate-100 border-2 border-slate-800">
    <div className="flex justify-between items-center bg-emerald-100 rounded-xl px-3 py-2">
      <span className="text-emerald-900 font-bold text-base">{title}</span>
    </div>
    <div className="space-y-4">
      {children}
    </div>
  </Card>
);

// Reusable input field for hardcoded sections with AI enhance button
const HardcodedInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onEnhance?: () => void;
  isEnhancing?: boolean;
}> = ({ label, value, onChange, placeholder, onEnhance, isEnhancing }) => (
  <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-start">
    <div className="w-full md:w-1/3 shrink-0">
      <div className="flex items-center gap-1.5 mb-1">
        <label className="block text-xs font-bold uppercase text-slate-500">{label}</label>
        {onEnhance && (
          <button
            type="button"
            onClick={onEnhance}
            disabled={isEnhancing}
            title="Enhance with AI"
            className={cn(
              "p-1 rounded-md transition-all",
              isEnhancing
                ? "text-blue-500 animate-pulse cursor-wait"
                : "text-black hover:text-blue-500 hover:bg-blue-50"
            )}
          >
            <Sparkles size={14} />
          </button>
        )}
      </div>
    </div>
    <div className="w-full md:flex-1">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
      />
    </div>
  </div>
);

export const CharactersTab: React.FC<CharactersTabProps> = ({ 
  appData, 
  selectedId, 
  onSelect, 
  onUpdate, 
  onDelete
}) => {
  const { user } = useAuth();
  const characters = appData.characters;
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number, y: number, pos: { x: number, y: number } } | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [enhancingField, setEnhancingField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarContainerRef = useRef<HTMLDivElement>(null);

  const selected = characters.find(c => c.id === selectedId);

  // Build world context for AI enhancement
  const buildWorldContext = () => {
    return `Setting: ${appData.world.core.settingOverview || 'Not specified'}
Tone: ${appData.world.core.toneThemes || 'Not specified'}
Scenario: ${appData.world.core.scenarioName || 'Not specified'}`.trim();
  };

  // Handler for per-field AI enhancement
  const handleEnhanceField = async (
    fieldKey: string,
    section: 'physicalAppearance' | 'currentlyWearing' | 'preferredClothing' | 'custom',
    getCurrentValue: () => string,
    setValue: (value: string) => void,
    customLabel?: string
  ) => {
    if (!selected || enhancingField) return;
    
    setEnhancingField(fieldKey);
    try {
      const currentValue = getCurrentValue();
      const worldContext = buildWorldContext();
      
      const enhanced = await aiEnhanceCharacterField(
        fieldKey,
        currentValue,
        selected,
        worldContext,
        appData.selectedModel || 'google/gemini-3-flash-preview',
        customLabel
      );
      
      setValue(enhanced);
      toast.success('Field enhanced');
    } catch (error) {
      console.error('Enhancement failed:', error);
      toast.error('Enhancement failed');
    } finally {
      setEnhancingField(null);
    }
  };

  const handleUpdateSection = (charId: string, sectionId: string, patch: Partial<CharacterTraitSection>) => {
    const char = characters.find(c => c.id === charId);
    if (!char) return;
    const nextSections = char.sections.map(s => s.id === sectionId ? { ...s, ...patch, updatedAt: now() } : s);
    onUpdate(charId, { sections: nextSections });
  };

  const handleAddItem = (charId: string, sectionId: string) => {
    const char = characters.find(c => c.id === charId);
    if (!char) return;
    const nextSections = char.sections.map(s => {
      if (s.id !== sectionId) return s;
      return {
        ...s,
        items: [...s.items, { id: uid('item'), label: '', value: '', createdAt: now(), updatedAt: now() }],
        updatedAt: now()
      };
    });
    onUpdate(charId, { sections: nextSections });
  };

  const handleAiPortrait = () => {
    setShowAvatarModal(true);
  };

  const handleAvatarGenerated = (imageUrl: string) => {
    if (selected) {
      onUpdate(selected.id, {
        avatarDataUrl: imageUrl,
        avatarPosition: { x: 50, y: 50 }
      });
      toast.success('Avatar generated successfully!');
    }
    setShowAvatarModal(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isRepositioning || !selected) return;
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      pos: selected.avatarPosition || { x: 50, y: 50 }
    });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragStart || !selected || !avatarContainerRef.current) return;
    
    const rect = avatarContainerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

    onUpdate(selected.id, {
      avatarPosition: {
        x: clamp(dragStart.pos.x - deltaX, 0, 100),
        y: clamp(dragStart.pos.y - deltaY, 0, 100)
      }
    });
  }, [dragStart, selected, onUpdate]);

  const handleMouseUp = () => {
    setDragStart(null);
  };

  // Handlers for updating hardcoded sections
  const handlePhysicalAppearanceChange = (field: keyof PhysicalAppearance, value: string) => {
    if (!selected) return;
    onUpdate(selected.id, {
      physicalAppearance: {
        ...selected.physicalAppearance,
        [field]: value
      }
    });
  };

  const handleCurrentlyWearingChange = (field: keyof CurrentlyWearing, value: string) => {
    if (!selected) return;
    onUpdate(selected.id, {
      currentlyWearing: {
        ...selected.currentlyWearing,
        [field]: value
      }
    });
  };

  const handlePreferredClothingChange = (field: keyof PreferredClothing, value: string) => {
    if (!selected) return;
    onUpdate(selected.id, {
      preferredClothing: {
        ...selected.preferredClothing,
        [field]: value
      }
    });
  };

  // Handle adding a new custom section
  const handleAddSection = () => {
    if (!selected) return;
    const newSection: CharacterTraitSection = {
      id: uid('sec'),
      title: 'New Section',
      items: [{ id: uid('item'), label: '', value: '', createdAt: now(), updatedAt: now() }],
      createdAt: now(),
      updatedAt: now()
    };
    onUpdate(selected.id, { sections: [...selected.sections, newSection] });
  };

  if (!selectedId || !selected) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {characters.map(c => (
            <div key={c.id} className="group relative cursor-pointer" onClick={() => onSelect(c.id)}>
              <div className="aspect-[2/3] w-full overflow-hidden rounded-[2rem] bg-slate-200 !shadow-[0_12px_24px_-8px_rgba(0,0,0,0.15)] transition-all duration-300 group-hover:-translate-y-3 group-hover:shadow-2xl border border-slate-200 relative">
                
                {c.avatarDataUrl ? (
                  <img
                    src={c.avatarDataUrl}
                    alt={c.name}
                    style={{ 
                      objectPosition: `${c.avatarPosition?.x ?? 50}% ${c.avatarPosition?.y ?? 50}%` 
                    }}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-900 p-10 text-center">
                     <div className="font-black text-white/10 text-6xl uppercase tracking-tighter italic break-words">{c.name.charAt(0) || '?'}</div>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />
                
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {c.tags && c.tags.split(',').slice(0, 2).map(tag => (
                      <span key={tag} className="bg-blue-600 text-[9px] font-black text-white px-2 py-1 rounded-md uppercase tracking-widest shadow-lg truncate max-w-[100px]">
                        {tag.trim()}
                      </span>
                    ))}
                    <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest shadow-lg ${c.characterRole === 'Main' ? 'bg-indigo-600 text-white' : 'bg-slate-600 text-white/80'}`}>
                      {c.characterRole}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white leading-tight mb-1 tracking-tight group-hover:text-blue-300 transition-colors truncate">{c.name || "Unnamed"}</h3>
                  <p className="text-xs text-white/70 line-clamp-3 leading-relaxed italic">
                     {c.roleDescription || c.sections[0]?.items[0]?.value || "No description available."}
                  </p>
                </div>

                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                  className="absolute top-4 right-4 p-3 bg-black/40 text-white/50 hover:text-rose-500 hover:bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:rotate-12 z-20"
                >
                  <Icons.Trash />
                </button>
              </div>
            </div>
          ))}
          {characters.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-400 select-none">
              <div className="text-6xl mb-4 font-thin opacity-30">✦</div>
              <p className="font-bold text-lg text-slate-500">Character Creation</p>
              <p className="text-sm">Select import a character from Library or Create New</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const avatarPos = selected.avatarPosition || { x: 50, y: 50 };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Avatar Panel */}
        <div className="space-y-6 lg:sticky lg:top-0 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto lg:pr-2 lg:pb-6 lg:overscroll-contain">
          <div className="flex justify-between items-center h-9">
            <h2 className="text-xl font-bold text-slate-900">Avatar</h2>
          </div>
          <Card className="p-6 !shadow-[0_12px_32px_-2px_rgba(0,0,0,0.15)] border-2 border-slate-800">
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <div 
                  ref={avatarContainerRef}
                  className={`relative group w-48 h-48 rounded-2xl overflow-hidden shadow-lg select-none ${isRepositioning ? 'ring-4 ring-blue-500 cursor-move' : 'border-2 border-slate-100'}`}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {selected.avatarDataUrl ? (
                    <img 
                      src={selected.avatarDataUrl} 
                      style={{ 
                        objectPosition: `${avatarPos.x}% ${avatarPos.y}%`,
                        pointerEvents: 'none'
                      }}
                      className={`w-full h-full object-cover transition-opacity ${isGeneratingImg ? 'opacity-50' : ''}`} 
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center font-bold text-3xl text-slate-400 border-2 border-dashed border-slate-200">
                      {selected.name.charAt(0) || '?'}
                    </div>
                  )}
                  
                  {isGeneratingImg && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[2px]">
                      <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}

                  {isRepositioning && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-full h-[1px] bg-blue-500/30 absolute" />
                      <div className="h-full w-[1px] bg-blue-500/30 absolute" />
                      <div className="bg-blue-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded absolute bottom-2 tracking-widest">Drag to Refocus</div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 w-full">
                  <div className="flex gap-2 w-full">
                    <UploadSourceMenu
                      onUploadFromDevice={() => fileInputRef.current?.click()}
                      onSelectFromLibrary={(imageUrl) => {
                        if (selected) {
                          onUpdate(selected.id, {
                            avatarDataUrl: imageUrl,
                            avatarPosition: { x: 50, y: 50 }
                          });
                        }
                      }}
                      disabled={isUploading}
                      isUploading={isUploading}
                      label="Upload Image"
                      variant="primary"
                      className="flex-1"
                    />
                    {selected.avatarDataUrl && (
                      <Button 
                        variant={isRepositioning ? 'primary' : 'secondary'} 
                        onClick={() => setIsRepositioning(!isRepositioning)}
                        className={`flex-1 ${isRepositioning ? 'bg-blue-600 text-white' : ''}`}
                      >
                        {isRepositioning ? "Save Position" : "Reposition"}
                      </Button>
                    )}
                  </div>
                  <Button variant="primary" onClick={handleAiPortrait} disabled={isGeneratingImg} className="w-full">
                    {isGeneratingImg ? "..." : "AI Generate"}
                  </Button>
                </div>
                
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f || !selected || !user) {
                      if (!user) toast.error('Please sign in to upload avatars');
                      return;
                    }
                    
                    setIsUploading(true);
                    try {
                      const reader = new FileReader();
                      reader.onload = async () => {
                        try {
                          const optimized = await resizeImage(reader.result as string, 512, 512, 0.7);
                          const blob = dataUrlToBlob(optimized);
                          if (!blob) throw new Error('Failed to process image');
                          
                          const filename = `avatar-${selected.id}-${Date.now()}.jpg`;
                          const publicUrl = await uploadAvatar(user.id, blob, filename);
                          
                          onUpdate(selected.id, { 
                            avatarDataUrl: publicUrl,
                            avatarPosition: { x: 50, y: 50 } 
                          });
                          setIsRepositioning(true);
                        } catch (error) {
                          console.error('Avatar upload failed:', error);
                          toast.error('Failed to upload avatar');
                        } finally {
                          setIsUploading(false);
                        }
                      };
                      reader.readAsDataURL(f);
                    } catch (error) {
                      console.error('Avatar upload failed:', error);
                      toast.error('Failed to upload avatar');
                      setIsUploading(false);
                    }
                  }} 
                />
              </div>
              
              {/* Avatar Panel Fields */}
              <div className="space-y-4">
                <Input label="Name" value={selected.name === "New Character" ? "" : selected.name} onChange={(v) => onUpdate(selected.id, { name: v })} placeholder="Character name" />
                <Input label="Nicknames" value={selected.nicknames || ''} onChange={(v) => onUpdate(selected.id, { nicknames: v })} placeholder="e.g., Mom, Mother (comma-separated)" />
                <Input label="Age" value={selected.age || ''} onChange={(v) => onUpdate(selected.id, { age: v })} placeholder="e.g., 25" />
                <Input label="Sex / Identity" value={selected.sexType} onChange={(v) => onUpdate(selected.id, { sexType: v })} placeholder="e.g., Female, Male, Non-binary" />
                <Input label="Location" value={selected.location || ''} onChange={(v) => onUpdate(selected.id, { location: v })} placeholder="Current location" />
                <Input label="Current Mood" value={selected.currentMood || ''} onChange={(v) => onUpdate(selected.id, { currentMood: v })} placeholder="e.g., Happy, Tired" />
                
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase text-slate-500">Controlled By</label>
                  <div className="flex p-1 bg-slate-100 rounded-xl">
                    <button 
                      onClick={() => onUpdate(selected.id, { controlledBy: 'AI' })}
                      className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${selected.controlledBy === 'AI' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      AI
                    </button>
                    <button 
                      onClick={() => onUpdate(selected.id, { controlledBy: 'User' })}
                      className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${selected.controlledBy === 'User' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      User
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase text-slate-500">Character Role</label>
                  <div className="flex p-1 bg-slate-100 rounded-xl">
                    <button 
                      onClick={() => onUpdate(selected.id, { characterRole: 'Main' })}
                      className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${selected.characterRole === 'Main' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Main
                    </button>
                    <button 
                      onClick={() => onUpdate(selected.id, { characterRole: 'Side' })}
                      className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${selected.characterRole === 'Side' ? 'bg-white text-slate-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Side
                    </button>
                  </div>
                </div>

                <Input label="Role Description" value={selected.roleDescription || ''} onChange={(v) => onUpdate(selected.id, { roleDescription: v })} placeholder="Brief description of the character's role" />
                <Input label="Tags" value={selected.tags} onChange={(v) => onUpdate(selected.id, { tags: v })} placeholder="Separated by commas" />
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Trait Sections */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center h-9">
            <h2 className="text-xl font-bold text-slate-900">Character Traits</h2>
          </div>

          {/* HARDCODED SECTION 1: Physical Appearance */}
          <HardcodedSection title="Physical Appearance">
            <HardcodedInput label="Hair Color" value={selected.physicalAppearance?.hairColor || ''} onChange={(v) => handlePhysicalAppearanceChange('hairColor', v)} placeholder="e.g., Brunette, Blonde, Black" onEnhance={() => handleEnhanceField('hairColor', 'physicalAppearance', () => selected.physicalAppearance?.hairColor || '', (v) => handlePhysicalAppearanceChange('hairColor', v))} isEnhancing={enhancingField === 'hairColor'} />
            <HardcodedInput label="Eye Color" value={selected.physicalAppearance?.eyeColor || ''} onChange={(v) => handlePhysicalAppearanceChange('eyeColor', v)} placeholder="e.g., Blue, Brown, Green" onEnhance={() => handleEnhanceField('eyeColor', 'physicalAppearance', () => selected.physicalAppearance?.eyeColor || '', (v) => handlePhysicalAppearanceChange('eyeColor', v))} isEnhancing={enhancingField === 'eyeColor'} />
            <HardcodedInput label="Build" value={selected.physicalAppearance?.build || ''} onChange={(v) => handlePhysicalAppearanceChange('build', v)} placeholder="e.g., Athletic, Slim, Curvy" onEnhance={() => handleEnhanceField('build', 'physicalAppearance', () => selected.physicalAppearance?.build || '', (v) => handlePhysicalAppearanceChange('build', v))} isEnhancing={enhancingField === 'build'} />
            <HardcodedInput label="Body Hair" value={selected.physicalAppearance?.bodyHair || ''} onChange={(v) => handlePhysicalAppearanceChange('bodyHair', v)} placeholder="e.g., Smooth, Light, Natural" onEnhance={() => handleEnhanceField('bodyHair', 'physicalAppearance', () => selected.physicalAppearance?.bodyHair || '', (v) => handlePhysicalAppearanceChange('bodyHair', v))} isEnhancing={enhancingField === 'bodyHair'} />
            <HardcodedInput label="Height" value={selected.physicalAppearance?.height || ''} onChange={(v) => handlePhysicalAppearanceChange('height', v)} placeholder="e.g., 5 foot 8" onEnhance={() => handleEnhanceField('height', 'physicalAppearance', () => selected.physicalAppearance?.height || '', (v) => handlePhysicalAppearanceChange('height', v))} isEnhancing={enhancingField === 'height'} />
            <HardcodedInput label="Breast Size" value={selected.physicalAppearance?.breastSize || ''} onChange={(v) => handlePhysicalAppearanceChange('breastSize', v)} placeholder="e.g., C-cup / N/A" onEnhance={() => handleEnhanceField('breastSize', 'physicalAppearance', () => selected.physicalAppearance?.breastSize || '', (v) => handlePhysicalAppearanceChange('breastSize', v))} isEnhancing={enhancingField === 'breastSize'} />
            <HardcodedInput label="Genitalia" value={selected.physicalAppearance?.genitalia || ''} onChange={(v) => handlePhysicalAppearanceChange('genitalia', v)} placeholder="e.g., Male, Female / N/A" onEnhance={() => handleEnhanceField('genitalia', 'physicalAppearance', () => selected.physicalAppearance?.genitalia || '', (v) => handlePhysicalAppearanceChange('genitalia', v))} isEnhancing={enhancingField === 'genitalia'} />
            <HardcodedInput label="Skin Tone" value={selected.physicalAppearance?.skinTone || ''} onChange={(v) => handlePhysicalAppearanceChange('skinTone', v)} placeholder="e.g., Fair, Olive, Dark" onEnhance={() => handleEnhanceField('skinTone', 'physicalAppearance', () => selected.physicalAppearance?.skinTone || '', (v) => handlePhysicalAppearanceChange('skinTone', v))} isEnhancing={enhancingField === 'skinTone'} />
            <HardcodedInput label="Makeup" value={selected.physicalAppearance?.makeup || ''} onChange={(v) => handlePhysicalAppearanceChange('makeup', v)} placeholder="e.g., Light, Heavy, None" onEnhance={() => handleEnhanceField('makeup', 'physicalAppearance', () => selected.physicalAppearance?.makeup || '', (v) => handlePhysicalAppearanceChange('makeup', v))} isEnhancing={enhancingField === 'makeup'} />
            <HardcodedInput label="Body Markings" value={selected.physicalAppearance?.bodyMarkings || ''} onChange={(v) => handlePhysicalAppearanceChange('bodyMarkings', v)} placeholder="Scars, tattoos, birthmarks, piercings" onEnhance={() => handleEnhanceField('bodyMarkings', 'physicalAppearance', () => selected.physicalAppearance?.bodyMarkings || '', (v) => handlePhysicalAppearanceChange('bodyMarkings', v))} isEnhancing={enhancingField === 'bodyMarkings'} />
            <HardcodedInput label="Temporary Conditions" value={selected.physicalAppearance?.temporaryConditions || ''} onChange={(v) => handlePhysicalAppearanceChange('temporaryConditions', v)} placeholder="Injuries, illness, etc." onEnhance={() => handleEnhanceField('temporaryConditions', 'physicalAppearance', () => selected.physicalAppearance?.temporaryConditions || '', (v) => handlePhysicalAppearanceChange('temporaryConditions', v))} isEnhancing={enhancingField === 'temporaryConditions'} />
          </HardcodedSection>

          {/* HARDCODED SECTION 2: Currently Wearing */}
          <HardcodedSection title="Currently Wearing">
            <HardcodedInput label="Shirt/Top" value={selected.currentlyWearing?.top || ''} onChange={(v) => handleCurrentlyWearingChange('top', v)} placeholder="e.g., White blouse, T-shirt" onEnhance={() => handleEnhanceField('top', 'currentlyWearing', () => selected.currentlyWearing?.top || '', (v) => handleCurrentlyWearingChange('top', v))} isEnhancing={enhancingField === 'top'} />
            <HardcodedInput label="Pants/Bottoms" value={selected.currentlyWearing?.bottom || ''} onChange={(v) => handleCurrentlyWearingChange('bottom', v)} placeholder="e.g., Jeans, Skirt, Shorts" onEnhance={() => handleEnhanceField('bottom', 'currentlyWearing', () => selected.currentlyWearing?.bottom || '', (v) => handleCurrentlyWearingChange('bottom', v))} isEnhancing={enhancingField === 'bottom'} />
            <HardcodedInput label="Undergarments" value={selected.currentlyWearing?.undergarments || ''} onChange={(v) => handleCurrentlyWearingChange('undergarments', v)} placeholder="Bras, panties, boxers, etc." onEnhance={() => handleEnhanceField('undergarments', 'currentlyWearing', () => selected.currentlyWearing?.undergarments || '', (v) => handleCurrentlyWearingChange('undergarments', v))} isEnhancing={enhancingField === 'undergarments'} />
            <HardcodedInput label="Miscellaneous" value={selected.currentlyWearing?.miscellaneous || ''} onChange={(v) => handleCurrentlyWearingChange('miscellaneous', v)} placeholder="Outerwear, footwear, accessories" onEnhance={() => handleEnhanceField('cw_miscellaneous', 'currentlyWearing', () => selected.currentlyWearing?.miscellaneous || '', (v) => handleCurrentlyWearingChange('miscellaneous', v))} isEnhancing={enhancingField === 'cw_miscellaneous'} />
          </HardcodedSection>

          {/* HARDCODED SECTION 3: Preferred Clothing */}
          <HardcodedSection title="Preferred Clothing">
            <HardcodedInput label="Casual" value={selected.preferredClothing?.casual || ''} onChange={(v) => handlePreferredClothingChange('casual', v)} placeholder="e.g., Jeans and t-shirts" onEnhance={() => handleEnhanceField('casual', 'preferredClothing', () => selected.preferredClothing?.casual || '', (v) => handlePreferredClothingChange('casual', v))} isEnhancing={enhancingField === 'casual'} />
            <HardcodedInput label="Work" value={selected.preferredClothing?.work || ''} onChange={(v) => handlePreferredClothingChange('work', v)} placeholder="e.g., Business casual, Uniform" onEnhance={() => handleEnhanceField('work', 'preferredClothing', () => selected.preferredClothing?.work || '', (v) => handlePreferredClothingChange('work', v))} isEnhancing={enhancingField === 'work'} />
            <HardcodedInput label="Sleep" value={selected.preferredClothing?.sleep || ''} onChange={(v) => handlePreferredClothingChange('sleep', v)} placeholder="e.g., Pajamas, Nightgown" onEnhance={() => handleEnhanceField('sleep', 'preferredClothing', () => selected.preferredClothing?.sleep || '', (v) => handlePreferredClothingChange('sleep', v))} isEnhancing={enhancingField === 'sleep'} />
            <HardcodedInput label="Undergarments" value={selected.preferredClothing?.undergarments || ''} onChange={(v) => handlePreferredClothingChange('undergarments', v)} placeholder="e.g., Cotton basics, Lace" onEnhance={() => handleEnhanceField('pc_undergarments', 'preferredClothing', () => selected.preferredClothing?.undergarments || '', (v) => handlePreferredClothingChange('undergarments', v))} isEnhancing={enhancingField === 'pc_undergarments'} />
            <HardcodedInput label="Miscellaneous" value={selected.preferredClothing?.miscellaneous || ''} onChange={(v) => handlePreferredClothingChange('miscellaneous', v)} placeholder="Formal, athletic, swimwear, etc." onEnhance={() => handleEnhanceField('pc_miscellaneous', 'preferredClothing', () => selected.preferredClothing?.miscellaneous || '', (v) => handlePreferredClothingChange('miscellaneous', v))} isEnhancing={enhancingField === 'pc_miscellaneous'} />
          </HardcodedSection>

          {/* HARDCODED SECTION 4: Character Goals */}
          <CharacterGoalsSection
            goals={selected.goals || []}
            onChange={(goals) => onUpdate(selected.id, { goals })}
          />

          {/* USER-CREATED CUSTOM SECTIONS */}
          {selected.sections.map(section => (
            <Card key={section.id} className="p-6 space-y-4 !shadow-[0_12px_32px_-2px_rgba(0,0,0,0.15)] hover:!shadow-[0_16px_40px_-2px_rgba(0,0,0,0.2)] transition-shadow border-transparent ring-1 ring-slate-900/5 bg-white">
              <div className="flex justify-between items-center bg-emerald-100 rounded-xl px-3 py-2">
                <Input 
                  value={section.title} 
                  onChange={(v) => handleUpdateSection(selected.id, section.id, { title: v })} 
                  placeholder="Section Title" 
                  className="!bg-transparent !border-none !text-emerald-900 font-bold placeholder:text-emerald-800/50 focus:!ring-0 text-base !p-0"
                />
                <Button variant="ghost" className="text-rose-500 hover:bg-emerald-200/50 h-8 w-8 !p-0" onClick={() => {
                  const next = selected.sections.filter(s => s.id !== section.id);
                  onUpdate(selected.id, { sections: next });
                }}><Icons.Trash /></Button>
              </div>
              
              <div className="space-y-4">
                {section.items.map(item => (
                  <div key={item.id} className="group relative flex flex-col md:flex-row gap-4 items-start pt-2">
                    <div className="w-full md:w-1/3 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <Input 
                          value={item.label} 
                          onChange={(v) => {
                            const nextItems = section.items.map(it => it.id === item.id ? { ...it, label: v } : it);
                            handleUpdateSection(selected.id, section.id, { items: nextItems });
                          }} 
                          placeholder="Label (e.g. Bio)" 
                          className="flex-1"
                        />
                        {item.label && (
                          <button
                            type="button"
                            onClick={() => handleEnhanceField(
                              `custom_${item.id}`,
                              'custom',
                              () => item.value,
                              (v) => {
                                const nextItems = section.items.map(it => it.id === item.id ? { ...it, value: v } : it);
                                handleUpdateSection(selected.id, section.id, { items: nextItems });
                              },
                              item.label
                            )}
                            disabled={enhancingField !== null}
                            title="Enhance with AI"
                            className={cn(
                              "p-1.5 rounded-md transition-all flex-shrink-0",
                              enhancingField === `custom_${item.id}`
                                ? "text-blue-500 animate-pulse cursor-wait"
                                : "text-black hover:text-blue-500 hover:bg-blue-50"
                            )}
                          >
                            <Sparkles size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="w-full md:flex-1 relative">
                      <TextArea 
                        value={item.value} 
                        onChange={(v) => {
                          const nextItems = section.items.map(it => it.id === item.id ? { ...it, value: v } : it);
                          handleUpdateSection(selected.id, section.id, { items: nextItems });
                        }} 
                        placeholder="Value" 
                        rows={1} 
                        autoResize={true}
                        className="!py-2 min-h-[42px] pr-10"
                      />
                      <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                         <Button variant="ghost" className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50 rounded-lg" onClick={() => {
                           const nextItems = section.items.filter(it => it.id !== item.id);
                           handleUpdateSection(selected.id, section.id, { items: nextItems });
                         }}><Icons.Trash /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full py-3 border-2 border-dashed border-slate-500 bg-slate-50/50 text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all mt-4" onClick={() => handleAddItem(selected.id, section.id)}>+ Add Row</Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Avatar Generation Modal */}
      <AvatarGenerationModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onGenerated={handleAvatarGenerated}
        characterName={selected?.name || "Character"}
        characterData={{
          physicalAppearance: selected?.physicalAppearance,
          currentlyWearing: selected?.currentlyWearing,
          sexType: selected?.sexType,
          age: selected?.age
        }}
        modelId={appData.selectedModel || "google/gemini-3-flash-preview"}
      />
    </div>
  );
};
