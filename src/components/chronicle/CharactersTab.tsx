
import React, { useRef, useState, useCallback } from 'react';
import { Character, CharacterTraitSection, ScenarioData } from '@/types';
import { Button, Input, TextArea, Card } from './UI';
import { Icons } from '@/constants';
import { uid, now, clamp, resizeImage } from '@/utils';
import { generateCharacterImage } from '@/services/gemini';
import { useAuth } from '@/hooks/use-auth';
import { uploadAvatar, dataUrlToBlob } from '@/services/supabase-data';
import { toast } from 'sonner';

interface CharactersTabProps {
  appData: ScenarioData;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, patch: Partial<Character>) => void;
  onDelete: (id: string) => void;
}

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarContainerRef = useRef<HTMLDivElement>(null);

  const selected = characters.find(c => c.id === selectedId);

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

  const handleAiPortrait = async () => {
    if (!selected) return;
    if (!user) {
      toast.error('Please sign in to generate portraits');
      return;
    }
    
    setIsGeneratingImg(true);
    try {
      const dataUrl = await generateCharacterImage(selected, appData.world);
      if (dataUrl) {
        // Convert generated image to blob and upload to storage
        const blob = dataUrlToBlob(dataUrl);
        if (!blob) throw new Error('Failed to process generated image');
        
        const filename = `avatar-${selected.id}-${Date.now()}.png`;
        const publicUrl = await uploadAvatar(user.id, blob, filename);
        
        onUpdate(selected.id, { avatarDataUrl: publicUrl, avatarPosition: { x: 50, y: 50 } });
        toast.success('AI portrait generated and saved');
      }
    } catch (error) {
      console.error('AI portrait generation failed:', error);
      toast.error('Failed to generate portrait');
    } finally {
      setIsGeneratingImg(false);
    }
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
                     {c.sections[0]?.items[0]?.value || "No bio available."}
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
              <p className="font-bold text-lg text-slate-500">The stage is empty.</p>
              <p className="text-sm">Create a character to begin.</p>
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
        <div className="space-y-6 lg:sticky lg:top-10 h-fit">
          <div className="flex justify-between items-center h-9">
            <h2 className="text-xl font-bold text-slate-900">Avatar</h2>
          </div>
          <Card className="p-6 !shadow-[0_12px_32px_-2px_rgba(0,0,0,0.15)] border-transparent ring-1 ring-slate-900/5">
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
                    <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="flex-1" disabled={isUploading}>
                      {isUploading ? "Uploading..." : "Upload"}
                    </Button>
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
                  <Button variant="primary" onClick={handleAiPortrait} disabled={isGeneratingImg} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 shadow-blue-500/25">
                    {isGeneratingImg ? "..." : "AI Portrait"}
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
                          toast.success('Avatar uploaded');
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
              
              <div className="space-y-4">
                <Input label="Name" value={selected.name} onChange={(v) => onUpdate(selected.id, { name: v })} />
                
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

                <Input label="Sex / Identity" value={selected.sexType} onChange={(v) => onUpdate(selected.id, { sexType: v })} />
                <Input label="Tags" value={selected.tags} onChange={(v) => onUpdate(selected.id, { tags: v })} placeholder="Separated by commas" />
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center h-9">
            <h2 className="text-xl font-bold text-slate-900">Profile Traits</h2>
          </div>
          
          {selected.sections.map(section => (
            <Card key={section.id} className="p-6 space-y-4 !shadow-[0_12px_32px_-2px_rgba(0,0,0,0.15)] hover:!shadow-[0_16px_40px_-2px_rgba(0,0,0,0.2)] transition-shadow border-transparent ring-1 ring-slate-900/5">
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
                      <Input 
                        value={item.label} 
                        onChange={(v) => {
                          const nextItems = section.items.map(it => it.id === item.id ? { ...it, label: v } : it);
                          handleUpdateSection(selected.id, section.id, { items: nextItems });
                        }} 
                        placeholder="Label (e.g. Bio)" 
                      />
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
              <Button variant="ghost" className="w-full border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 mt-4" onClick={() => handleAddItem(selected.id, section.id)}>+ Add Row</Button>
            </Card>
          ))}
          {selected.sections.length === 0 && (
            <Card className="py-12 text-center text-slate-400 border border-dashed border-slate-200 shadow-sm bg-slate-50">
              No detail sections yet. Use the brainstorm tool or add one manually.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
