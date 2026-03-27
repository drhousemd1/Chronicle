// Character Edit Modal - Full-featured modal dialog for editing character details
// Session-scoped: edits persist only within the active playthrough

import React, { useState, useEffect, useRef } from 'react';
import { Character, SideCharacter, PhysicalAppearance, CurrentlyWearing, PreferredClothing, CharacterTraitSection, CharacterGoal, CharacterPersonality, WorldCore, LocationEntry, WorldCustomSection, WorldCustomItem, StoryGoal, CharacterExtraRow, CharacterBackground, CharacterTone, CharacterKeyLifeEvents, CharacterRelationships, CharacterSecrets, CharacterFears, defaultCharacterBackground } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Loader2, Plus, Trash2, X, Pencil, ChevronDown, ChevronUp, Sparkles, Globe, Lock, Info, Fingerprint, Accessibility, Shirt, Brain, Mic2, ScrollText, Users, EyeOff, TriangleAlert, Flag, CircleUserRound, Stars, type LucideIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client'; 
import * as supabaseData from '@/services/supabase-data'; 

import { cn } from '@/lib/utils';
import { AvatarActionButtons } from '@/components/chronicle/AvatarActionButtons';
import { ChangeNameModal } from '@/components/chronicle/ChangeNameModal';
import { CharacterGoalsSection } from '@/components/chronicle/CharacterGoalsSection';

import { ScenarioCardEditorView } from '@/features/character-editor-modal/ScenarioCardEditorView';
import { CustomContentTypeModal } from '@/components/chronicle/CustomContentTypeModal';
import { PersonalitySection } from '@/components/chronicle/PersonalitySection';
import { defaultPersonality } from '@/components/chronicle/PersonalitySection';
import { TabFieldNavigator } from '@/components/chronicle/TabFieldNavigator';
import { uid, now } from '@/utils';
import { Input } from '@/components/ui/input';
import { isCharacterSectionKeyMatch } from '@/features/character-builder/utils/section-keys';

// Unified draft type for both Character and SideCharacter
export interface CharacterEditDraft {
  name?: string;
  nicknames?: string;
  previousNames?: string[];  // Hidden field - stores old names for lookup, never shown in UI
  age?: string;
  sexType?: string;
  sexualOrientation?: string;
  roleDescription?: string;
  location?: string;
  currentMood?: string;
  controlledBy?: 'AI' | 'User';
  characterRole?: 'Main' | 'Side';
  physicalAppearance?: Partial<PhysicalAppearance>;
  currentlyWearing?: Partial<CurrentlyWearing>;
  preferredClothing?: Partial<PreferredClothing>;
  sections?: CharacterTraitSection[];
  goals?: CharacterGoal[];
  // Personality (main characters)
  mainPersonality?: CharacterPersonality;
  // New hardcoded sections (main characters)
  mainBackground?: CharacterBackground;
  tone?: CharacterTone;
  keyLifeEvents?: CharacterKeyLifeEvents;
  relationships?: CharacterRelationships;
  secrets?: CharacterSecrets;
  fears?: CharacterFears;
  // Avatar fields for session-scoped updates
  avatarDataUrl?: string;
  avatarPosition?: { x: number; y: number };
  // Side character specific
  background?: {
    relationshipStatus?: string;
    residence?: string;
    educationLevel?: string;
  };
  personality?: {
    traits?: string[];
    desires?: string;
    fears?: string;
    secrets?: string;
    miscellaneous?: string;
  };
}

export interface CharacterEditorModalScreenProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  character: Character | SideCharacter | null;
  onSave: (draft: CharacterEditDraft) => void;
  isSaving?: boolean;
  modelId?: string; // For AI avatar regeneration
  viewOnly?: boolean; // When true, opens in view mode with edit toggle
  conversationId?: string; // For deep scan - fetch message history
  allCharacters?: (Character | SideCharacter)[]; // For deep scan context
  // Scenario Card props (session-scoped world core)
  scenarioWorldCore?: WorldCore;
  onSaveScenarioCard?: (patch: Partial<WorldCore>) => void;
}

// ─── Nav constants ───────────────────────────────────────────────
const MODAL_BUILT_IN_SECTIONS: Array<{ key: string; label: string }> = [
  { key: 'basics', label: 'Basics' },
  { key: 'physicalAppearance', label: 'Physical Appearance' },
  { key: 'currentlyWearing', label: 'Currently Wearing' },
  { key: 'preferredClothing', label: 'Preferred Clothing' },
  { key: 'personality', label: 'Personality' },
  { key: 'tone', label: 'Tone' },
  { key: 'background', label: 'Background' },
  { key: 'keyLifeEvents', label: 'Key Life Events' },
  { key: 'relationships', label: 'Relationships' },
  { key: 'secrets', label: 'Secrets' },
  { key: 'fears', label: 'Fears' },
  { key: 'characterGoals', label: 'Goals & Desires' },
];

const MODAL_NAV_ICON_BY_KEY: Record<string, LucideIcon> = {
  basics: Fingerprint,
  physicalAppearance: Accessibility,
  currentlyWearing: CircleUserRound,
  preferredClothing: Shirt,
  personality: Brain,
  tone: Mic2,
  background: ScrollText,
  keyLifeEvents: Stars,
  relationships: Users,
  secrets: EyeOff,
  fears: TriangleAlert,
  characterGoals: Flag,
};

const navActionButtonClass =
  "relative w-full min-h-[48px] px-[14px] rounded-xl border-2 border-transparent text-left select-none overflow-hidden flex items-center justify-between gap-3 bg-[#3c3e47] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] transition-[filter,transform,box-shadow,border-color] duration-150 ease-out hover:brightness-[1.12] hover:-translate-y-px active:brightness-95 active:translate-y-0 active:scale-[0.99]";

// ─── Sidebar button ─────────────────────────────────────────────
const ModalNavButton: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
}> = ({ label, active, onClick, icon: Icon }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "relative w-full min-h-[48px] px-[14px] rounded-xl border-2 border-transparent text-left select-none overflow-hidden",
      "flex items-center justify-between gap-3",
      "bg-[#3c3e47] text-[#eaedf1]",
      "shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]",
      "transition-[filter,transform,box-shadow,border-color] duration-150 ease-out",
      "hover:brightness-[1.12] hover:-translate-y-px active:brightness-95 active:translate-y-0 active:scale-[0.99]",
      active && "border-[#3b82f6] shadow-[0_8px_24px_rgba(59,130,246,0.35),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]"
    )}
  >
    <span className="relative z-10 min-w-0 flex items-center gap-[10px]">
      <Icon className={cn("w-[18px] h-[18px] shrink-0", active ? "text-[#60a5fa]" : "text-[#6b7280]")} />
      <span className="truncate text-[12px] font-black tracking-[0.08em] leading-tight text-[#eaedf1]">
        {label}
      </span>
    </span>
  </button>
);

// ─── Auto-resizing textarea ─────────────────────────────────────
const AutoResizeTextarea: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}> = ({ value, onChange, placeholder, className = '', rows = 1 }) => {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  
  React.useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value]);
  
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      spellCheck={true}
      className={cn("w-full min-w-0 resize-none overflow-hidden whitespace-pre-wrap break-words", className)}
    />
  );
};

// ─── Row components matching builder geometry ────────────────────
const HardcodedRow: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ label, value, onChange, placeholder }) => (
  <div className="flex flex-col gap-2 md:flex-row md:items-start">
    <div className="w-full md:w-2/5 flex items-center gap-1.5 min-w-0">
      <div className="flex-1 px-3 py-2 text-xs font-bold bg-[#1c1c1f] border border-black/35 text-zinc-400 rounded-lg uppercase tracking-widest min-w-0 break-words">
        {label}
      </div>
    </div>
    <AutoResizeTextarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full md:flex-1 px-3 py-2 text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-w-0"
    />
    <div className="flex w-full flex-shrink-0 items-center justify-end pt-2 md:w-7 md:justify-center">
      <Lock className="w-3.5 h-3.5 text-zinc-400" />
    </div>
  </div>
);

// User-added extra row matching builder geometry
const ModalExtraRow: React.FC<{
  extra: CharacterExtraRow;
  onUpdate: (patch: Partial<CharacterExtraRow>) => void;
  onDelete: () => void;
}> = ({ extra, onUpdate, onDelete }) => (
  <div className="flex flex-col gap-2 md:flex-row md:items-start">
    <div className="w-full md:w-2/5 flex items-center gap-1.5 min-w-0">
      <AutoResizeTextarea
        value={extra.label}
        onChange={(v) => onUpdate({ label: v })}
        placeholder="LABEL"
        className="flex-1 px-3 py-2 text-xs font-bold bg-[#1c1c1f] border border-black/35 text-zinc-400 uppercase tracking-widest placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-w-0"
      />
    </div>
    <AutoResizeTextarea
      value={extra.value}
      onChange={(v) => onUpdate({ value: v })}
      placeholder="Description"
      className="w-full md:flex-1 px-3 py-2 text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-w-0"
    />
    <button
      type="button"
      tabIndex={-1}
      onClick={onDelete}
      className="self-end text-red-500 hover:text-red-400 p-1.5 rounded-md hover:bg-red-900/30 pt-2 flex-shrink-0"
    >
      <X className="w-4 h-4" />
    </button>
  </div>
);

// Builder-standard field input
const FieldInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ label, value, onChange, placeholder }) => (
  <div className="space-y-1.5">
    <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{label}</Label>
    <AutoResizeTextarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="px-3 py-2 rounded-lg text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
    />
  </div>
);

// Builder-standard textarea field
const FieldTextarea: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}> = ({ label, value, onChange, placeholder, rows = 3 }) => (
  <div className="space-y-1.5">
    <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{label}</Label>
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="text-sm resize-none bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-500 focus:ring-blue-500/20 focus:border-blue-500 whitespace-pre-wrap break-words"
    />
  </div>
);

// Collapsible section component matching builder style
const CollapsibleSection: React.FC<{
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  collapsedContent?: React.ReactNode;
}> = ({ title, isExpanded, onToggle, children, collapsedContent }) => (
  <div className="w-full bg-[#2a2a2f] rounded-[24px] overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]">
    <div className="relative bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-3 flex items-center justify-between shadow-lg overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.07] via-transparent to-transparent pointer-events-none" style={{ backgroundSize: '100% 60%', backgroundRepeat: 'no-repeat' }} />
      <h2 className="text-white text-xl font-bold tracking-[-0.015em] relative z-[1]">{title}</h2>
      <button 
        type="button"
        onClick={onToggle} 
        className="text-white/70 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10 relative z-[1]"
      >
        {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
      </button>
    </div>
    <div className="p-5">
      <div className="p-5 pb-6 bg-[#2e2e33] rounded-2xl shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
        {isExpanded ? (
          <div className="space-y-4">
            {children}
          </div>
        ) : (
          <div className="w-full min-w-0">
            {collapsedContent || <p className="text-zinc-500 text-sm italic">No data</p>}
          </div>
        )}
      </div>
    </div>
  </div>
);

const CollapsedFieldSummary: React.FC<{ 
  fields: { label: string; value: string | undefined }[] 
}> = ({ fields }) => {
  const filledFields = fields.filter(f => f.value);
  if (filledFields.length === 0) {
    return <p className="text-zinc-500 text-sm italic">No data</p>;
  }
  return (
    <div className="space-y-4 w-full min-w-0">
      {filledFields.map((field, idx) => (
        <div key={idx} className="space-y-1 w-full min-w-0">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block break-words">
            {field.label}
          </span>
          <p className="text-sm text-zinc-400 break-words whitespace-pre-wrap">
            {field.value}
          </p>
        </div>
      ))}
    </div>
  );
};

// Builder-standard Add Row button
const AddRowButton: React.FC<{ onClick: () => void; label?: string }> = ({ onClick, label = 'Add Row' }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full h-10 text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
  >
    <Plus className="w-4 h-4" /> {label}
  </button>
);

export const CharacterEditorModalScreen: React.FC<CharacterEditorModalScreenProps> = ({
  open,
  onOpenChange,
  character,
  onSave,
  isSaving = false,
  modelId,
  viewOnly = false,
  conversationId,
  allCharacters,
  scenarioWorldCore,
  onSaveScenarioCard
}) => {
  const [draft, setDraft] = useState<CharacterEditDraft>({});
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRegeneratingAvatar, setIsRegeneratingAvatar] = useState(false);
  const [isChangeNameModalOpen, setIsChangeNameModalOpen] = useState(false);
  const [isDeepScanning, setIsDeepScanning] = useState(false);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // View mode toggle: 'character' or 'scenario'
  type ViewMode = 'character' | 'scenario';
  const [viewMode, setViewMode] = useState<ViewMode>('character');
  
  // Sidebar nav state
  const [activeTraitSection, setActiveTraitSection] = useState<string>('basics');
  
  // Local scenario draft for editing
  const [scenarioDraft, setScenarioDraft] = useState<Partial<WorldCore>>({});
  
  // Reset view mode and nav when modal opens
  useEffect(() => {
    if (open) {
      setViewMode('character');
      setActiveTraitSection('basics');
    }
  }, [open]);
  
  // Initialize scenario draft from props
  useEffect(() => {
    if (scenarioWorldCore && open) {
      setScenarioDraft({
        storyPremise: scenarioWorldCore.storyPremise,
        structuredLocations: scenarioWorldCore.structuredLocations?.map(l => ({ ...l })),
        customWorldSections: scenarioWorldCore.customWorldSections?.map(s => ({ ...s, items: s.items.map(i => ({ ...i })) })),
        storyGoals: scenarioWorldCore.storyGoals?.map(g => ({ ...g, steps: g.steps.map(s => ({ ...s })) })),
      });
    }
  }, [scenarioWorldCore, open]);
  
  const handleSaveScenarioCard = () => {
    if (onSaveScenarioCard) {
      onSaveScenarioCard(scenarioDraft);
    }
  };

  // Expanded state for collapsible sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    avatar: true,
    control: true,
    physicalAppearance: true,
    currentlyWearing: true,
    preferredClothing: true,
    goals: true,
    background: true,
    personality: true,
    customCategories: true,
    tone: true,
    keyLifeEvents: true,
    relationships: true,
    secrets: true,
    fears: true
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Custom category expansion state (per-section)
  const [expandedCustomSections, setExpandedCustomSections] = useState<Record<string, boolean>>({});

  const toggleCustomSection = (sectionId: string) => {
    setExpandedCustomSections(prev => ({
      ...prev,
      [sectionId]: !(prev[sectionId] ?? true)
    }));
  };

  // Determine if this is a side character (has SideCharacterBackground-style background)
  const isSideCharacter = character && 'background' in character && 'firstMentionedIn' in character;

  // Build sidebar nav items (main characters only)
  const customTraitNavItems = (draft.sections || []).map((section) => ({
    key: `custom:${section.id}`,
    label: section.title?.trim() || 'Custom Section',
  }));
  const sidebarNavItems = [
    ...MODAL_BUILT_IN_SECTIONS,
    ...customTraitNavItems,
  ];
  const isTraitVisible = (key: string) => isCharacterSectionKeyMatch(activeTraitSection, key);

  // Auto-navigate to newly added custom section
  const prevSectionCountRef = useRef(draft.sections?.length ?? 0);
  useEffect(() => {
    const currentCount = draft.sections?.length ?? 0;
    if (currentCount > prevSectionCountRef.current && currentCount > 0) {
      const newest = draft.sections![currentCount - 1];
      setActiveTraitSection(`custom:${newest.id}`);
    }
    prevSectionCountRef.current = currentCount;
  }, [draft.sections, draft.sections?.length]);

  // Initialize draft from character when modal opens
  useEffect(() => {
    if (character && open) {
      const baseDraft: CharacterEditDraft = {
        name: character.name,
        nicknames: character.nicknames || '',
        age: character.age || '',
        sexType: character.sexType || '',
        sexualOrientation: (character as any).sexualOrientation || '',
        roleDescription: character.roleDescription || '',
        location: character.location || '',
        currentMood: character.currentMood || '',
        physicalAppearance: { ...character.physicalAppearance },
        currentlyWearing: { ...character.currentlyWearing },
        preferredClothing: { ...character.preferredClothing },
        avatarDataUrl: character.avatarDataUrl,
        avatarPosition: character.avatarPosition || { x: 50, y: 50 },
      };

      if ('goals' in character) {
        baseDraft.goals = (character as Character).goals?.map(g => ({ ...g })) || [];
      }

      if ('personality' in character && (character as Character).personality) {
        baseDraft.mainPersonality = JSON.parse(JSON.stringify((character as Character).personality));
      }

      if ('sections' in character) {
        baseDraft.sections = character.sections?.map(s => ({ ...s, items: [...s.items] })) || [];
        baseDraft.controlledBy = (character as Character).controlledBy;
        baseDraft.characterRole = (character as Character).characterRole;
        const mainChar = character as Character;
        baseDraft.mainBackground = mainChar.background ? { ...mainChar.background } : undefined;
        baseDraft.tone = mainChar.tone ? { ...mainChar.tone } : undefined;
        baseDraft.keyLifeEvents = mainChar.keyLifeEvents ? { ...mainChar.keyLifeEvents } : undefined;
        baseDraft.relationships = mainChar.relationships ? { ...mainChar.relationships } : undefined;
        baseDraft.secrets = mainChar.secrets ? { ...mainChar.secrets } : undefined;
        baseDraft.fears = mainChar.fears ? { ...mainChar.fears } : undefined;
      }

      if ('background' in character) {
        const sc = character as SideCharacter;
        baseDraft.background = { ...sc.background };
        baseDraft.personality = { 
          ...sc.personality,
          traits: sc.personality?.traits ? [...sc.personality.traits] : []
        };
        baseDraft.controlledBy = sc.controlledBy;
        baseDraft.characterRole = sc.characterRole;
      }

      setDraft(baseDraft);
    }
  }, [character, open]);

  // Deep scan handler
  const handleDeepScan = async () => {
    if (!character || !conversationId) {
      console.error('No conversation context available');
      return;
    }
    
    setIsDeepScanning(true);
    try {
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (msgError) throw msgError;
      if (!messages || messages.length === 0) {
        console.log('No messages to analyze');
        setIsDeepScanning(false);
        return;
      }
      
      const chronological = [...messages].reverse();
      const userMessages: string[] = [];
      const aiMessages: string[] = [];
      for (const msg of chronological) {
        if (msg.role === 'user') {
          userMessages.push(msg.content);
        } else if (msg.role === 'assistant') {
          aiMessages.push(msg.content);
        }
      }
      
      const concatenatedUser = userMessages.join('\n\n---\n\n');
      const concatenatedAi = aiMessages.join('\n\n---\n\n');
      
      const buildCharData = (c: Character | SideCharacter) => {
        const isMain = 'sections' in c;
        const mainChar = isMain ? c as Character : null;
        return {
          name: c.name,
          previousNames: ('previousNames' in c) ? (c as any).previousNames : [],
          nicknames: c.nicknames,
          physicalAppearance: c.physicalAppearance,
          currentlyWearing: c.currentlyWearing,
          preferredClothing: c.preferredClothing,
          location: c.location,
          currentMood: c.currentMood,
          goals: ('goals' in c && (c as Character).goals) 
            ? (c as Character).goals!.map(g => ({
                title: g.title,
                desiredOutcome: g.desiredOutcome || '',
                currentStatus: g.currentStatus || '',
                progress: g.progress || 0,
                steps: (g.steps || []).map(s => ({ id: s.id, description: s.description, completed: s.completed }))
              }))
            : [],
          customSections: (mainChar?.sections)
            ? mainChar.sections.map(s => ({
                title: s.title,
                items: s.items.map(i => ({ label: i.label, value: i.value }))
              }))
            : [],
          background: mainChar?.background,
          personality: mainChar?.personality ? {
            splitMode: mainChar.personality.splitMode,
            traits: (mainChar.personality.traits || []).map(t => ({ label: t.label, value: t.value })),
            outwardTraits: (mainChar.personality.outwardTraits || []).map(t => ({ label: t.label, value: t.value })),
            inwardTraits: (mainChar.personality.inwardTraits || []).map(t => ({ label: t.label, value: t.value })),
          } : undefined,
          tone: mainChar?.tone,
          keyLifeEvents: mainChar?.keyLifeEvents,
          relationships: mainChar?.relationships,
          secrets: mainChar?.secrets,
          fears: mainChar?.fears,
        };
      };
      
      const charactersData = allCharacters 
        ? allCharacters.map(buildCharData) 
        : [buildCharData(character)];
      
      const { data, error } = await supabase.functions.invoke('extract-character-updates', {
        body: {
          userMessage: concatenatedUser,
          aiResponse: concatenatedAi,
          characters: charactersData,
          modelId: modelId || 'grok-4-1-fast-reasoning'
        }
      });
      
      if (error) throw error;
      
      const updates = data?.updates || [];
      if (updates.length === 0) {
        console.log('No updates found from dialogue');
        setIsDeepScanning(false);
        return;
      }
      
      setDraft(prev => {
        const next = { ...prev };
        const updatedSections = [...(prev.sections || [])];
        const updatedGoals = [...(prev.goals || [])];
        let sectionsModified = false;
        let goalsModified = false;
        
        for (const update of updates) {
          const charName = (prev.name || character.name || '').toLowerCase();
          const updateCharName = (update.character || '').toLowerCase();
          
          const nicknames = (prev.nicknames || '').split(',').map((n: string) => n.trim().toLowerCase()).filter(Boolean);
          const isMatch = updateCharName === charName || nicknames.includes(updateCharName);
          if (!isMatch) continue;
          
          const { field, value } = update;
          
          if (field.startsWith('goals.')) {
            const goalTitle = field.slice(6);
            if (goalTitle) {
              let currentStatus = value;
              let desiredOutcome = '';
              let progress = 0;
              
              const desiredOutcomeMatch = value.match(/desired_outcome:\s*([^|]+)/i);
              const currentStatusMatch = value.match(/current_status:\s*([^|]+)/i);
              const progressMatch = value.match(/progress:\s*(\d+)/i);
              const completeStepsMatch = value.match(/complete_steps:\s*([^|]+)/i);
              const newStepsMatch = value.match(/new_steps:\s*(.*)/i);
              
              if (desiredOutcomeMatch) desiredOutcome = desiredOutcomeMatch[1].trim();
              if (currentStatusMatch) {
                currentStatus = currentStatusMatch[1].trim();
              } else if (progressMatch) {
                currentStatus = value.replace(/\s*\|\s*progress:\s*\d+\s*/i, '').trim();
                if (desiredOutcomeMatch) currentStatus = currentStatus.replace(/desired_outcome:\s*[^|]+\|?\s*/i, '').trim();
              }
              if (progressMatch) progress = Math.min(100, Math.max(0, parseInt(progressMatch[1], 10)));
              
              const existingIdx = updatedGoals.findIndex(g => g.title.toLowerCase() === goalTitle.toLowerCase());
              if (existingIdx !== -1) {
                const existingGoal = updatedGoals[existingIdx];
                let updatedSteps = [...(existingGoal.steps || [])];
                
                if (newStepsMatch) {
                  const newStepsRaw = newStepsMatch[1].trim();
                  const stepEntries = newStepsRaw.split(/Step\s+\d+:\s*/i).filter(Boolean);
                  console.log(`[deep-scan] Goal "${existingGoal.title}" - received ${stepEntries.length} steps from AI (full replacement)`);
                  
                  updatedSteps = [];
                  for (const desc of stepEntries) {
                    const trimmed = desc.trim().replace(/\|$/, '').trim();
                    if (trimmed) updatedSteps.push({ id: uid('step'), description: trimmed, completed: false });
                  }
                  
                  if (completeStepsMatch) {
                    const indices = completeStepsMatch[1].trim().split(',').map((s: string) => parseInt(s.trim(), 10)).filter((n: number) => !isNaN(n));
                    for (const idx of indices) {
                      if (idx >= 1 && idx <= updatedSteps.length) updatedSteps[idx - 1] = { ...updatedSteps[idx - 1], completed: true, completedAt: now() };
                    }
                  }
                } else {
                  console.log(`[deep-scan] Goal "${existingGoal.title}" - no new_steps found in AI response`);
                  if (completeStepsMatch) {
                    const indices = completeStepsMatch[1].trim().split(',').map((s: string) => parseInt(s.trim(), 10)).filter((n: number) => !isNaN(n));
                    for (const idx of indices) {
                      if (idx >= 1 && idx <= updatedSteps.length) updatedSteps[idx - 1] = { ...updatedSteps[idx - 1], completed: true, completedAt: now() };
                    }
                  }
                }
                
                if (updatedSteps.length > 0) {
                  const completedCount = updatedSteps.filter(s => s.completed).length;
                  progress = Math.round((completedCount / updatedSteps.length) * 100);
                }
                
                updatedGoals[existingIdx] = { 
                  ...existingGoal, currentStatus, progress, steps: updatedSteps, updatedAt: now(),
                  ...(desiredOutcome ? { desiredOutcome } : {})
                };
              } else {
                const newSteps: Array<{ id: string; description: string; completed: boolean }> = [];
                if (newStepsMatch) {
                  const newStepsRaw = newStepsMatch[1].trim();
                  const stepEntries = newStepsRaw.split(/Step\s+\d+:\s*/i).filter(Boolean);
                  console.log(`[deep-scan] NEW goal "${goalTitle}" - parsing ${stepEntries.length} steps from AI`);
                  for (const desc of stepEntries) {
                    const trimmed = desc.trim().replace(/\|$/, '').trim();
                    if (trimmed) newSteps.push({ id: uid('step'), description: trimmed, completed: false });
                  }
                } else {
                  console.log(`[deep-scan] NEW goal "${goalTitle}" - WARNING: no new_steps in AI response`);
                }
                
                updatedGoals.push({
                  id: uid('goal'), title: goalTitle, desiredOutcome, currentStatus, progress,
                  steps: newSteps, createdAt: now(), updatedAt: now()
                });
              }
              goalsModified = true;
            }
          } else if (field.startsWith('sections.')) {
            const parts = field.split('.');
            if (parts.length >= 3) {
              const sectionTitle = parts[1];
              const itemLabel = parts.slice(2).join('.');
              
              let sectionIndex = updatedSections.findIndex(s => s.title.toLowerCase() === sectionTitle.toLowerCase());
              if (sectionIndex === -1) {
                updatedSections.push({ id: uid('sec'), title: sectionTitle, items: [], createdAt: now(), updatedAt: now() });
                sectionIndex = updatedSections.length - 1;
              }
              
              const section = updatedSections[sectionIndex];
              const itemIndex = section.items.findIndex(i => i.label.toLowerCase() === itemLabel.toLowerCase());
              if (itemIndex === -1) {
                const placeholderPattern = /^(trait|item|entry|row|example|placeholder)\s*\d*$/i;
                const placeholderIdx = section.items.findIndex(i => placeholderPattern.test(i.label.trim()));
                
                if (placeholderIdx !== -1) {
                  console.log(`[deep-scan] Replacing placeholder label "${section.items[placeholderIdx].label}" with "${itemLabel}"`);
                  section.items[placeholderIdx] = { ...section.items[placeholderIdx], label: itemLabel, value, updatedAt: now() };
                } else {
                  section.items.push({ id: uid('item'), label: itemLabel, value, createdAt: now(), updatedAt: now() });
                }
              } else {
                section.items[itemIndex] = { ...section.items[itemIndex], value, updatedAt: now() };
              }
              section.updatedAt = now();
              sectionsModified = true;
            }
          } else if (field.includes('.')) {
            const [parent, child] = field.split('.');
            if (parent === 'physicalAppearance') {
              next.physicalAppearance = { ...next.physicalAppearance, [child]: value };
            } else if (parent === 'currentlyWearing') {
              next.currentlyWearing = { ...next.currentlyWearing, [child]: value };
            } else if (parent === 'preferredClothing') {
              next.preferredClothing = { ...next.preferredClothing, [child]: value };
            } else if (parent === 'background') {
              const bg = next.mainBackground || { jobOccupation: '', educationLevel: '', residence: '', hobbies: '', financialStatus: '', motivation: '' };
              (bg as any)[child] = value;
              next.mainBackground = bg;
            } else if (['tone', 'keyLifeEvents', 'relationships', 'secrets', 'fears'].includes(parent) && child === '_extras') {
              const sectionKey = parent as 'tone' | 'keyLifeEvents' | 'relationships' | 'secrets' | 'fears';
              const section = next[sectionKey] || {};
              const extras = [...(section._extras || [])];
              extras.push({ id: uid('extra'), label: value.split(':')[0]?.trim() || 'New', value: value.split(':').slice(1).join(':')?.trim() || value });
              (next as any)[sectionKey] = { ...section, _extras: extras };
            }
          } else {
            (next as any)[field] = value;
          }
        }
        
        if (sectionsModified) next.sections = updatedSections;
        if (goalsModified) next.goals = updatedGoals;
        
        return next;
      });
      
    } catch (err) {
      console.error('[handleDeepScan] Failed:', err);
    } finally {
      setIsDeepScanning(false);
    }
  };

  // Helper to resize image to 512x512
  const resizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Failed to get canvas context')); return; }
        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;
        ctx.drawImage(img, x, y, size, size, 0, 0, 512, 512);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, 'image/jpeg', 0.9);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const resizedBlob = await resizeImage(file);
      const filename = `session-avatar-${Date.now()}.jpg`;
      const publicUrl = await supabaseData.uploadAvatar(user.id, resizedBlob, filename);
      setDraft(prev => ({ ...prev, avatarDataUrl: publicUrl, avatarPosition: { x: 50, y: 50 } }));
    } catch (err) {
      console.error('Avatar upload failed:', err);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Build avatar prompt from appearance fields
  const buildAvatarPrompt = (): string => {
    const appearance = draft.physicalAppearance || character?.physicalAppearance;
    const name = draft.name || character?.name || 'Character';
    const parts: string[] = [name];
    if (appearance?.hairColor) parts.push(`${appearance.hairColor} hair`);
    if (appearance?.eyeColor) parts.push(`${appearance.eyeColor} eyes`);
    if (appearance?.build) parts.push(`${appearance.build} build`);
    if (appearance?.skinTone) parts.push(`${appearance.skinTone} skin`);
    if (appearance?.height) parts.push(`${appearance.height} tall`);
    if (draft.sexType || character?.sexType) parts.push(draft.sexType || character?.sexType || '');
    if (draft.age || character?.age) parts.push(`${draft.age || character?.age} years old`);
    return parts.filter(Boolean).join(', ');
  };

  // Handle avatar regeneration via AI
  const handleRegenerateAvatar = async () => {
    if (!character) return;
    setIsRegeneratingAvatar(true);
    try {
      const avatarPrompt = buildAvatarPrompt();
      const { data, error } = await supabase.functions.invoke('generate-side-character-avatar', {
        body: { avatarPrompt, characterName: draft.name || character.name, modelId: modelId || 'grok-4-1-fast-reasoning' }
      });
      if (error) throw error;
      if (data?.imageUrl) {
        setDraft(prev => ({ ...prev, avatarDataUrl: data.imageUrl, avatarPosition: { x: 50, y: 50 } }));
      }
    } catch (err) {
      console.error('Avatar regeneration failed:', err);
    } finally {
      setIsRegeneratingAvatar(false);
    }
  };

  const updateField = <K extends keyof CharacterEditDraft>(field: K, value: CharacterEditDraft[K]) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  };

  const updatePhysicalAppearance = (field: keyof PhysicalAppearance, value: string) => {
    setDraft(prev => ({ ...prev, physicalAppearance: { ...prev.physicalAppearance, [field]: value } }));
  };

  const updateCurrentlyWearing = (field: keyof CurrentlyWearing, value: string) => {
    setDraft(prev => ({ ...prev, currentlyWearing: { ...prev.currentlyWearing, [field]: value } }));
  };

  const updatePreferredClothing = (field: keyof PreferredClothing, value: string) => {
    setDraft(prev => ({ ...prev, preferredClothing: { ...prev.preferredClothing, [field]: value } }));
  };

  type ModalExtrasSection = 'physicalAppearance' | 'currentlyWearing' | 'preferredClothing' | 'tone' | 'keyLifeEvents' | 'relationships' | 'secrets' | 'fears';

  const addModalExtra = (section: ModalExtrasSection | 'background') => {
    setDraft(prev => {
      if (section === 'background') {
        const current = (prev as any).mainBackground || {};
        const extras = [...(current._extras || []), { id: `extra-${Date.now()}`, label: '', value: '' }];
        return { ...prev, mainBackground: { ...current, _extras: extras } };
      }
      const current = (prev[section] || {}) as any;
      const extras = [...(current._extras || []), { id: `extra-${Date.now()}`, label: '', value: '' }];
      return { ...prev, [section]: { ...current, _extras: extras } };
    });
  };

  const updateModalExtra = (section: ModalExtrasSection | 'background', extraId: string, patch: Partial<CharacterExtraRow>) => {
    setDraft(prev => {
      if (section === 'background') {
        const current = (prev as any).mainBackground || {};
        const extras = (current._extras || []).map((e: CharacterExtraRow) => e.id === extraId ? { ...e, ...patch } : e);
        return { ...prev, mainBackground: { ...current, _extras: extras } };
      }
      const current = (prev[section] || {}) as any;
      const extras = (current._extras || []).map((e: CharacterExtraRow) => e.id === extraId ? { ...e, ...patch } : e);
      return { ...prev, [section]: { ...current, _extras: extras } };
    });
  };

  const deleteModalExtra = (section: ModalExtrasSection | 'background', extraId: string) => {
    setDraft(prev => {
      if (section === 'background') {
        const current = (prev as any).mainBackground || {};
        const extras = (current._extras || []).filter((e: CharacterExtraRow) => e.id !== extraId);
        return { ...prev, mainBackground: { ...current, _extras: extras } };
      }
      const current = (prev[section] || {}) as any;
      const extras = (current._extras || []).filter((e: CharacterExtraRow) => e.id !== extraId);
      return { ...prev, [section]: { ...current, _extras: extras } };
    });
  };

  const updateMainBackground = (field: string, value: string) => {
    setDraft(prev => ({ ...prev, mainBackground: { ...(prev as any).mainBackground, [field]: value } }));
  };

  const updateBackground = (field: string, value: string) => {
    setDraft(prev => ({ ...prev, background: { ...prev.background, [field]: value } }));
  };

  const updatePersonality = (field: string, value: string | string[]) => {
    setDraft(prev => ({ ...prev, personality: { ...prev.personality, [field]: value } }));
  };

  const updateSectionItem = (sectionId: string, itemId: string, field: 'label' | 'value', value: string) => {
    setDraft(prev => ({
      ...prev,
      sections: prev.sections?.map(s => {
        if (s.id !== sectionId) return s;
        return { ...s, items: s.items.map(item => item.id === itemId ? { ...item, [field]: value } : item) };
      })
    }));
  };

  const addItemToSection = (sectionId: string) => {
    setDraft(prev => ({
      ...prev,
      sections: prev.sections?.map(s => {
        if (s.id !== sectionId) return s;
        return { ...s, items: [...s.items, { id: `item-${Date.now()}`, label: '', value: '', createdAt: Date.now(), updatedAt: Date.now() }] };
      })
    }));
  };

  const removeItemFromSection = (sectionId: string, itemId: string) => {
    setDraft(prev => ({
      ...prev,
      sections: prev.sections?.map(s => {
        if (s.id !== sectionId) return s;
        return { ...s, items: s.items.filter(item => item.id !== itemId) };
      })
    }));
  };

  const [showCategoryTypeModal, setShowCategoryTypeModal] = useState(false);
  const addNewSection = (type: 'structured' | 'freeform' = 'structured') => {
    const newSection: CharacterTraitSection = {
      id: `section-${Date.now()}`,
      title: 'New Category',
      type,
      items: [{ id: `item-${Date.now()}`, label: '', value: '', createdAt: Date.now(), updatedAt: Date.now() }],
      freeformValue: undefined,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setExpandedCustomSections(prev => ({ ...prev, [newSection.id]: true }));
    setDraft(prev => ({ ...prev, sections: [...(prev.sections || []), newSection] }));
  };

  const updateSectionTitle = (sectionId: string, newTitle: string) => {
    setDraft(prev => ({ ...prev, sections: prev.sections?.map(s => s.id === sectionId ? { ...s, title: newTitle } : s) }));
  };

  const deleteSection = (sectionId: string) => {
    setDraft(prev => ({ ...prev, sections: prev.sections?.filter(s => s.id !== sectionId) }));
  };

  const handleSave = () => { onSave(draft); };

  if (!character) return null;

  // ─── Render: Basics section (builder-matched 2-col layout) ─────
  const renderBasicsSection = () => (
    <CollapsibleSection
      title="Basics"
      isExpanded={expandedSections.avatar}
      onToggle={() => toggleSection('avatar')}
      collapsedContent={
        <CollapsedFieldSummary fields={[
          { label: 'Name', value: draft.name || character?.name },
          { label: 'Age', value: draft.age },
          { label: 'Sex / Identity', value: draft.sexType },
        ]} />
      }
    >
      {/* Builder-matched two-column grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Left column: Avatar + buttons */}
        <div className="flex flex-col gap-3">
          <div className={cn(
            "relative group w-full aspect-square rounded-2xl shadow-lg select-none overflow-hidden",
            (draft.avatarDataUrl || character.avatarDataUrl) ? "border-2 border-[#4a5f7f]" : ""
          )}>
            {(isUploadingAvatar || isRegeneratingAvatar) ? (
              <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
              </div>
            ) : (draft.avatarDataUrl || character.avatarDataUrl) ? (
              <img 
                src={draft.avatarDataUrl || character.avatarDataUrl} 
                alt={draft.name || character.name} 
                className="w-full h-full object-cover"
                style={{ 
                  objectPosition: `${(draft.avatarPosition?.x ?? character.avatarPosition?.x ?? 50)}% ${(draft.avatarPosition?.y ?? character.avatarPosition?.y ?? 50)}%` 
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex flex-col items-center justify-center border-2 border-dashed border-[#4a5f7f] gap-3 rounded-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">No Avatar</span>
              </div>
            )}
          </div>
          
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          
          <AvatarActionButtons
            onUploadFromDevice={() => fileInputRef.current?.click()}
            onSelectFromLibrary={(imageUrl) => {
              setDraft(prev => ({ ...prev, avatarDataUrl: imageUrl, avatarPosition: { x: 50, y: 50 } }));
            }}
            onGenerateClick={handleRegenerateAvatar}
            disabled={isUploadingAvatar}
            isGenerating={isRegeneratingAvatar}
            isUploading={isUploadingAvatar}
          />
        </div>

        {/* Right column: Name, Nicknames, Age/Sex grid, Orientation, Toggles */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Name</label>
            <div className="flex items-center gap-2">
              <AutoResizeTextarea
                value={draft.name || ''}
                onChange={(v) => updateField('name', v)}
                placeholder="Character name"
                className="flex-1 px-3 py-2 text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setIsChangeNameModalOpen(true)}
                className="inline-flex h-9 px-3 items-center justify-center gap-1.5 rounded-xl border-0 bg-[#3c3e47] text-blue-500 hover:text-blue-300 shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all active:scale-95 text-[10px] font-bold uppercase tracking-wider shrink-0"
              >
                <Pencil className="w-3 h-3" />
                Rename
              </button>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Nicknames</label>
            <AutoResizeTextarea value={draft.nicknames || ''} onChange={(v) => updateField('nicknames', v)} placeholder="Nicknames" className="w-full px-3 py-2 text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Age</label>
              <AutoResizeTextarea value={draft.age || ''} onChange={(v) => updateField('age', v)} placeholder="25" className="w-full px-3 py-2 text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Sex / Identity</label>
              <AutoResizeTextarea value={draft.sexType || ''} onChange={(v) => updateField('sexType', v)} placeholder="Female, Male, Non-binary" className="w-full px-3 py-2 text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Sexual Orientation</label>
            <AutoResizeTextarea value={(draft as any).sexualOrientation || ''} onChange={(v) => setDraft(prev => ({ ...prev, sexualOrientation: v }))} placeholder="Heterosexual, Bisexual, etc." className="w-full px-3 py-2 text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
          {/* Builder-matched toggle trays */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Controlled By</label>
              <div className="flex p-1.5 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]">
                <button type="button" onClick={() => updateField('controlledBy', 'AI')} className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${draft.controlledBy === 'AI' ? 'bg-[#3b82f6] text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)]' : 'bg-[#3f3f46] text-[#a1a1aa] hover:text-zinc-300'}`}>AI</button>
                <button type="button" onClick={() => updateField('controlledBy', 'User')} className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${draft.controlledBy === 'User' ? 'bg-[#3b82f6] text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)]' : 'bg-[#3f3f46] text-[#a1a1aa] hover:text-zinc-300'}`}>User</button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Character Role</label>
              <div className="flex p-1.5 bg-[#3c3e47] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)]">
                <button type="button" onClick={() => updateField('characterRole', 'Main')} className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${draft.characterRole === 'Main' ? 'bg-[#3b82f6] text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)]' : 'bg-[#3f3f46] text-[#a1a1aa] hover:text-zinc-300'}`}>Main</button>
                <button type="button" onClick={() => updateField('characterRole', 'Side')} className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${draft.characterRole === 'Side' ? 'bg-[#3b82f6] text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)]' : 'bg-[#3f3f46] text-[#a1a1aa] hover:text-zinc-300'}`}>Side</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Below grid: remaining fields */}
      <div className="space-y-4 mt-4">
        <div>
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Location</label>
          <AutoResizeTextarea value={draft.location || ''} onChange={(v) => updateField('location', v)} placeholder="Current location" className="w-full px-3 py-2 text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Current Mood</label>
          <AutoResizeTextarea value={draft.currentMood || ''} onChange={(v) => updateField('currentMood', v)} placeholder="Happy, Tired" className="w-full px-3 py-2 text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
        </div>
        <FieldTextarea label="Role Description" value={draft.roleDescription || ''} onChange={(v) => updateField('roleDescription', v)} placeholder="Character's role in the story..." rows={3} />
      </div>
    </CollapsibleSection>
  );

  // ─── Render: Custom section ─────────────────────────────────────
  const renderCustomSection = (section: CharacterTraitSection) => (
    <div key={section.id} className="w-full bg-[#2a2a2f] rounded-[24px] overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]">
      <div className="relative bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-3 flex items-center justify-between shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.07] via-transparent to-transparent pointer-events-none" style={{ backgroundSize: '100% 60%', backgroundRepeat: 'no-repeat' }} />
        <AutoResizeTextarea
          value={section.title}
          onChange={(v) => updateSectionTitle(section.id, v)}
          placeholder="Category name"
          className="bg-transparent border-none text-white text-xl font-bold tracking-[-0.015em] placeholder:text-[rgba(248,250,252,0.3)] focus:outline-none flex-1 mr-2 relative z-[1]"
        />
        <div className="flex items-center gap-2 shrink-0 relative z-[1]">
          <button type="button" onClick={() => toggleCustomSection(section.id)} className="text-white/70 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10">
            {(expandedCustomSections[section.id] ?? true) ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          </button>
          <button type="button" tabIndex={-1} onClick={() => deleteSection(section.id)} className="text-white hover:text-red-400 p-1 rounded-md hover:bg-white/10 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="p-5">
        <div className="p-5 pb-6 bg-[#2e2e33] rounded-2xl shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
          {(expandedCustomSections[section.id] ?? true) ? (
            <div className="space-y-4">
              {section.type === 'freeform' ? (
                <>
                  {(() => {
                    const items = section.items.length > 0
                      ? section.items
                      : section.freeformValue
                        ? [{ id: `item-${Date.now()}`, label: '', value: section.freeformValue, createdAt: Date.now(), updatedAt: Date.now() }]
                        : [{ id: `item-${Date.now()}`, label: '', value: '', createdAt: Date.now(), updatedAt: Date.now() }];
                    if (section.items.length === 0 && items.length > 0) {
                      setDraft(prev => ({
                        ...prev,
                        sections: prev.sections?.map(s => s.id === section.id ? { ...s, items, freeformValue: undefined } : s)
                      }));
                    }
                    return items.map(item => (
                      <div key={item.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <AutoResizeTextarea
                            value={item.label}
                            onChange={(v) => {
                              const nextItems = (section.items.length > 0 ? section.items : items).map(it => it.id === item.id ? { ...it, label: v } : it);
                              setDraft(prev => ({ ...prev, sections: prev.sections?.map(s => s.id === section.id ? { ...s, items: nextItems } : s) }));
                            }}
                            placeholder="LABEL"
                            className="flex-1 px-3 py-2 text-xs font-bold bg-[#1c1c1f] border border-black/35 text-zinc-400 uppercase tracking-widest placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-w-0"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const nextItems = (section.items.length > 0 ? section.items : items).filter(it => it.id !== item.id);
                              setDraft(prev => ({
                                ...prev,
                                sections: prev.sections?.map(s => s.id === section.id ? { ...s, items: nextItems.length > 0 ? nextItems : [{ id: `item-${Date.now()}`, label: '', value: '', createdAt: Date.now(), updatedAt: Date.now() }] } : s)
                              }));
                            }}
                            className="text-red-500 hover:text-red-400 p-1.5 rounded-md hover:bg-red-900/30"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <AutoResizeTextarea
                          value={item.value}
                          onChange={(v) => {
                            const nextItems = (section.items.length > 0 ? section.items : items).map(it => it.id === item.id ? { ...it, value: v } : it);
                            setDraft(prev => ({ ...prev, sections: prev.sections?.map(s => s.id === section.id ? { ...s, items: nextItems } : s) }));
                          }}
                          placeholder="Write your content here..."
                          className="w-full px-3 py-2 text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          rows={4}
                        />
                      </div>
                    ));
                  })()}
                  <AddRowButton onClick={() => {
                    const currentItems = section.items.length > 0 ? section.items : [{ id: `item-${Date.now()}`, label: '', value: section.freeformValue || '', createdAt: Date.now(), updatedAt: Date.now() }];
                    setDraft(prev => ({
                      ...prev,
                      sections: prev.sections?.map(s => s.id === section.id ? { ...s, items: [...currentItems, { id: `item-${Date.now() + 1}`, label: '', value: '', createdAt: Date.now(), updatedAt: Date.now() }], freeformValue: undefined } : s)
                    }));
                  }} label="Add Text Field" />
                </>
              ) : (
                <>
                  {section.items.map((item) => (
                    <div key={item.id} className="flex items-start gap-2">
                      <div className="w-2/5 min-w-0">
                        <AutoResizeTextarea
                          value={item.label}
                          onChange={(v) => updateSectionItem(section.id, item.id, 'label', v)}
                          placeholder="LABEL"
                          className="w-full px-3 py-2 rounded-lg text-xs font-bold bg-[#1c1c1f] border border-black/35 text-zinc-400 uppercase tracking-widest placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <AutoResizeTextarea
                        value={item.value}
                        onChange={(v) => updateSectionItem(section.id, item.id, 'value', v)}
                        placeholder="Description"
                        className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm bg-[#1c1c1f] border border-black/35 text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                      />
                      <button type="button" onClick={() => removeItemFromSection(section.id, item.id)} className="text-red-500 hover:text-red-400 p-1.5 rounded-md hover:bg-red-900/30 pt-2">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <AddRowButton onClick={() => addItemToSection(section.id)} />
                </>
              )}
            </div>
          ) : (
            (() => {
              if (section.type === 'freeform') {
                const items = section.items.length > 0 ? section.items : (section.freeformValue ? [{ id: 'legacy', label: '', value: section.freeformValue }] : []);
                return items.length > 0 && items.some(it => it.value)
                  ? <div className="space-y-2">{items.filter(it => it.value).map(it => (
                      <div key={it.id}>
                        {it.label && <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{it.label}</span>}
                        <p className="text-sm text-zinc-400 whitespace-pre-wrap">{it.value}</p>
                      </div>
                    ))}</div>
                  : <p className="text-zinc-500 text-sm italic">No content</p>;
              }
              const hasAnyValue = section.items.some(item => item.label || item.value);
              if (!hasAnyValue) return <p className="text-zinc-500 text-sm italic">No items</p>;
              return (
                <div className="space-y-4 w-full min-w-0">
                  {section.items.filter(item => item.label || item.value).map((item) => (
                    <div key={item.id} className="space-y-1 w-full min-w-0">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block break-words">{item.label || 'Untitled'}</span>
                      <p className="text-sm text-zinc-400 break-words whitespace-pre-wrap">{item.value || '—'}</p>
                    </div>
                  ))}
                </div>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );

  // ─── Render: Side character scroll layout ──────────────────────
  const renderSideCharacterContent = () => (
    <ScrollArea className="flex-1 min-h-0 bg-[#1a1b20]">
      <div className="p-6 space-y-6 pb-20">
        {/* Basics */}
        {renderBasicsSection()}

        {/* Physical Appearance */}
        <CollapsibleSection title="Physical Appearance" isExpanded={expandedSections.physicalAppearance} onToggle={() => toggleSection('physicalAppearance')}>
          <HardcodedRow label="Hair Color" value={draft.physicalAppearance?.hairColor || ''} onChange={(v) => updatePhysicalAppearance('hairColor', v)} placeholder="Brown" />
          <HardcodedRow label="Eye Color" value={draft.physicalAppearance?.eyeColor || ''} onChange={(v) => updatePhysicalAppearance('eyeColor', v)} placeholder="Blue" />
          <HardcodedRow label="Build" value={draft.physicalAppearance?.build || ''} onChange={(v) => updatePhysicalAppearance('build', v)} placeholder="Athletic" />
          <HardcodedRow label="Skin Tone" value={draft.physicalAppearance?.skinTone || ''} onChange={(v) => updatePhysicalAppearance('skinTone', v)} placeholder="Fair" />
          {((draft.physicalAppearance as any)?._extras || []).map((extra: CharacterExtraRow) => (
            <ModalExtraRow key={extra.id} extra={extra} onUpdate={(patch) => updateModalExtra('physicalAppearance', extra.id, patch)} onDelete={() => deleteModalExtra('physicalAppearance', extra.id)} />
          ))}
          <AddRowButton onClick={() => addModalExtra('physicalAppearance')} />
        </CollapsibleSection>

        {/* Currently Wearing */}
        <CollapsibleSection title="Currently Wearing" isExpanded={expandedSections.currentlyWearing} onToggle={() => toggleSection('currentlyWearing')}>
          <HardcodedRow label="Shirt / Top" value={draft.currentlyWearing?.top || ''} onChange={(v) => updateCurrentlyWearing('top', v)} placeholder="White blouse" />
          <HardcodedRow label="Pants / Bottoms" value={draft.currentlyWearing?.bottom || ''} onChange={(v) => updateCurrentlyWearing('bottom', v)} placeholder="Blue jeans" />
          <HardcodedRow label="Undergarments" value={draft.currentlyWearing?.undergarments || ''} onChange={(v) => updateCurrentlyWearing('undergarments', v)} placeholder="Description" />
          <HardcodedRow label="Miscellaneous" value={draft.currentlyWearing?.miscellaneous || ''} onChange={(v) => updateCurrentlyWearing('miscellaneous', v)} placeholder="Accessories, etc." />
          {((draft.currentlyWearing as any)?._extras || []).map((extra: CharacterExtraRow) => (
            <ModalExtraRow key={extra.id} extra={extra} onUpdate={(patch) => updateModalExtra('currentlyWearing', extra.id, patch)} onDelete={() => deleteModalExtra('currentlyWearing', extra.id)} />
          ))}
          <AddRowButton onClick={() => addModalExtra('currentlyWearing')} />
        </CollapsibleSection>

        {/* Preferred Clothing */}
        <CollapsibleSection title="Preferred Clothing" isExpanded={expandedSections.preferredClothing} onToggle={() => toggleSection('preferredClothing')}>
          <HardcodedRow label="Casual" value={draft.preferredClothing?.casual || ''} onChange={(v) => updatePreferredClothing('casual', v)} placeholder="Casual wear" />
          <HardcodedRow label="Work" value={draft.preferredClothing?.work || ''} onChange={(v) => updatePreferredClothing('work', v)} placeholder="Work attire" />
          <HardcodedRow label="Sleep" value={draft.preferredClothing?.sleep || ''} onChange={(v) => updatePreferredClothing('sleep', v)} placeholder="Sleepwear" />
          <HardcodedRow label="Undergarments" value={draft.preferredClothing?.undergarments || ''} onChange={(v) => updatePreferredClothing('undergarments', v)} placeholder="Preferred underwear" />
          <HardcodedRow label="Miscellaneous" value={draft.preferredClothing?.miscellaneous || ''} onChange={(v) => updatePreferredClothing('miscellaneous', v)} placeholder="Other preferences" />
          {((draft.preferredClothing as any)?._extras || []).map((extra: CharacterExtraRow) => (
            <ModalExtraRow key={extra.id} extra={extra} onUpdate={(patch) => updateModalExtra('preferredClothing', extra.id, patch)} onDelete={() => deleteModalExtra('preferredClothing', extra.id)} />
          ))}
          <AddRowButton onClick={() => addModalExtra('preferredClothing')} />
        </CollapsibleSection>

        {/* Side Character Background */}
        <CollapsibleSection title="Background" isExpanded={expandedSections.background} onToggle={() => toggleSection('background')}>
          <FieldInput label="Relationship Status" value={draft.background?.relationshipStatus || ''} onChange={(v) => updateBackground('relationshipStatus', v)} placeholder="Single, Married" />
          <FieldInput label="Residence" value={draft.background?.residence || ''} onChange={(v) => updateBackground('residence', v)} placeholder="Where they live" />
          <FieldInput label="Education Level" value={draft.background?.educationLevel || ''} onChange={(v) => updateBackground('educationLevel', v)} placeholder="College" />
        </CollapsibleSection>

        {/* Side Character Personality */}
        <CollapsibleSection title="Personality" isExpanded={expandedSections.personality} onToggle={() => toggleSection('personality')}>
          <FieldInput label="Traits" value={draft.personality?.traits?.join(', ') || ''} onChange={(v) => updatePersonality('traits', v.split(',').map(t => t.trim()).filter(Boolean))} placeholder="Friendly, Curious, Brave" />
          <FieldInput label="Desires" value={draft.personality?.desires || ''} onChange={(v) => updatePersonality('desires', v)} placeholder="What they want" />
          <FieldInput label="Fears" value={draft.personality?.fears || ''} onChange={(v) => updatePersonality('fears', v)} placeholder="What they fear" />
          <FieldTextarea label="Secrets" value={draft.personality?.secrets || ''} onChange={(v) => updatePersonality('secrets', v)} placeholder="Hidden information..." rows={2} />
          <FieldTextarea label="Miscellaneous" value={draft.personality?.miscellaneous || ''} onChange={(v) => updatePersonality('miscellaneous', v)} placeholder="Other personality notes..." rows={2} />
        </CollapsibleSection>
      </div>
    </ScrollArea>
  );

  // ─── Render: Main character with sidebar nav ───────────────────
  const renderMainCharacterContent = () => (
    <div className="flex flex-1 min-h-0 min-w-0 flex-col lg:flex-row overflow-hidden">
      {/* Sidebar nav */}
      <aside
        className="w-full lg:w-[260px] lg:max-w-[260px] max-h-[52vh] lg:max-h-none h-auto lg:h-full flex-shrink-0 bg-[#2a2a2f] flex flex-col shadow-[0_12px_32px_-2px_rgba(0,0,0,0.55),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]"
      >
        {/* Avatar header tile */}
        <div className="p-3">
          <div className="group relative overflow-hidden rounded-2xl bg-black border border-[#4a5f7f]" style={{ height: 140 }}>
            {(draft.avatarDataUrl || character.avatarDataUrl) ? (
              <img
                src={draft.avatarDataUrl || character.avatarDataUrl}
                alt={draft.name || character.name || 'Character'}
                className="block w-full h-full object-cover"
                style={{ objectPosition: `${(draft.avatarPosition?.x ?? character.avatarPosition?.x ?? 50)}% ${(draft.avatarPosition?.y ?? character.avatarPosition?.y ?? 50)}%` }}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 font-black text-5xl italic uppercase text-slate-500">
                {(draft.name || character.name || '?').charAt(0)}
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-200 z-[5] pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 z-30 p-3">
              <div className="flex items-end justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
                    {draft.name || character.name || 'Unnamed Character'}
                  </div>
                </div>
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-wide shrink-0 rounded-full px-2 py-0.5",
                  draft.controlledBy === 'User' ? "bg-blue-500 text-white" : "bg-slate-500 text-white"
                )}>
                  {draft.controlledBy || 'AI'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav buttons */}
        <div className="flex-1 overflow-y-auto scrollbar-none bg-[#2a2a2f]" style={{ padding: 10 }}>
          <div className="rounded-2xl space-y-2 bg-[#2e2e33] shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]" style={{ padding: 10 }}>
            {sidebarNavItems.map((item) => {
              const Icon = MODAL_NAV_ICON_BY_KEY[item.key] || Sparkles;
              return (
                <ModalNavButton
                  key={item.key}
                  label={item.label}
                  active={isCharacterSectionKeyMatch(item.key, activeTraitSection)}
                  icon={Icon}
                  onClick={() => setActiveTraitSection(item.key)}
                />
              );
            })}
            <button
              type="button"
              onClick={() => setShowCategoryTypeModal(true)}
              className={navActionButtonClass}
            >
              <span className="relative z-10 min-w-0 flex items-center gap-[10px]">
                <Plus className="w-[18px] h-[18px] shrink-0 text-[#60a5fa]" />
                <span className="truncate text-[12px] font-black tracking-[0.08em] leading-tight text-[#eaedf1]">
                  Custom Content
                </span>
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Content pane */}
      <TabFieldNavigator className="flex-1 min-h-0 min-w-0 overflow-y-auto scrollbar-thin bg-[#1a1b20]">
        <div className="p-4 lg:p-10 max-w-6xl mx-auto space-y-6 pb-20">
          {isTraitVisible('basics') && renderBasicsSection()}

          {isTraitVisible('physicalAppearance') && (
            <CollapsibleSection title="Physical Appearance" isExpanded={expandedSections.physicalAppearance} onToggle={() => toggleSection('physicalAppearance')}>
              <HardcodedRow label="Hair Color" value={draft.physicalAppearance?.hairColor || ''} onChange={(v) => updatePhysicalAppearance('hairColor', v)} placeholder="Brown" />
              <HardcodedRow label="Eye Color" value={draft.physicalAppearance?.eyeColor || ''} onChange={(v) => updatePhysicalAppearance('eyeColor', v)} placeholder="Blue" />
              <HardcodedRow label="Build" value={draft.physicalAppearance?.build || ''} onChange={(v) => updatePhysicalAppearance('build', v)} placeholder="Athletic" />
              <HardcodedRow label="Body Hair" value={draft.physicalAppearance?.bodyHair || ''} onChange={(v) => updatePhysicalAppearance('bodyHair', v)} placeholder="Light" />
              <HardcodedRow label="Height" value={draft.physicalAppearance?.height || ''} onChange={(v) => updatePhysicalAppearance('height', v)} placeholder="5ft 8in" />
              <HardcodedRow label="Breasts" value={draft.physicalAppearance?.breastSize || ''} onChange={(v) => updatePhysicalAppearance('breastSize', v)} placeholder="Size, description" />
              <HardcodedRow label="Genitalia" value={draft.physicalAppearance?.genitalia || ''} onChange={(v) => updatePhysicalAppearance('genitalia', v)} placeholder="Description" />
              <HardcodedRow label="Skin Tone" value={draft.physicalAppearance?.skinTone || ''} onChange={(v) => updatePhysicalAppearance('skinTone', v)} placeholder="Fair" />
              <HardcodedRow label="Makeup" value={draft.physicalAppearance?.makeup || ''} onChange={(v) => updatePhysicalAppearance('makeup', v)} placeholder="Natural" />
              <HardcodedRow label="Body Markings" value={draft.physicalAppearance?.bodyMarkings || ''} onChange={(v) => updatePhysicalAppearance('bodyMarkings', v)} placeholder="Tattoos, scars..." />
              <HardcodedRow label="Temporary Conditions" value={draft.physicalAppearance?.temporaryConditions || ''} onChange={(v) => updatePhysicalAppearance('temporaryConditions', v)} placeholder="Injuries, etc." />
              {((draft.physicalAppearance as any)?._extras || []).map((extra: CharacterExtraRow) => (
                <ModalExtraRow key={extra.id} extra={extra} onUpdate={(patch) => updateModalExtra('physicalAppearance', extra.id, patch)} onDelete={() => deleteModalExtra('physicalAppearance', extra.id)} />
              ))}
              <AddRowButton onClick={() => addModalExtra('physicalAppearance')} />
            </CollapsibleSection>
          )}

          {isTraitVisible('currentlyWearing') && (
            <CollapsibleSection title="Currently Wearing" isExpanded={expandedSections.currentlyWearing} onToggle={() => toggleSection('currentlyWearing')}>
              <HardcodedRow label="Shirt / Top" value={draft.currentlyWearing?.top || ''} onChange={(v) => updateCurrentlyWearing('top', v)} placeholder="White blouse" />
              <HardcodedRow label="Pants / Bottoms" value={draft.currentlyWearing?.bottom || ''} onChange={(v) => updateCurrentlyWearing('bottom', v)} placeholder="Blue jeans" />
              <HardcodedRow label="Undergarments" value={draft.currentlyWearing?.undergarments || ''} onChange={(v) => updateCurrentlyWearing('undergarments', v)} placeholder="Description" />
              <HardcodedRow label="Miscellaneous" value={draft.currentlyWearing?.miscellaneous || ''} onChange={(v) => updateCurrentlyWearing('miscellaneous', v)} placeholder="Accessories, etc." />
              {((draft.currentlyWearing as any)?._extras || []).map((extra: CharacterExtraRow) => (
                <ModalExtraRow key={extra.id} extra={extra} onUpdate={(patch) => updateModalExtra('currentlyWearing', extra.id, patch)} onDelete={() => deleteModalExtra('currentlyWearing', extra.id)} />
              ))}
              <AddRowButton onClick={() => addModalExtra('currentlyWearing')} />
            </CollapsibleSection>
          )}

          {isTraitVisible('preferredClothing') && (
            <CollapsibleSection title="Preferred Clothing" isExpanded={expandedSections.preferredClothing} onToggle={() => toggleSection('preferredClothing')}>
              <HardcodedRow label="Casual" value={draft.preferredClothing?.casual || ''} onChange={(v) => updatePreferredClothing('casual', v)} placeholder="Casual wear" />
              <HardcodedRow label="Work" value={draft.preferredClothing?.work || ''} onChange={(v) => updatePreferredClothing('work', v)} placeholder="Work attire" />
              <HardcodedRow label="Sleep" value={draft.preferredClothing?.sleep || ''} onChange={(v) => updatePreferredClothing('sleep', v)} placeholder="Sleepwear" />
              <HardcodedRow label="Undergarments" value={draft.preferredClothing?.undergarments || ''} onChange={(v) => updatePreferredClothing('undergarments', v)} placeholder="Preferred underwear" />
              <HardcodedRow label="Miscellaneous" value={draft.preferredClothing?.miscellaneous || ''} onChange={(v) => updatePreferredClothing('miscellaneous', v)} placeholder="Other preferences" />
              {((draft.preferredClothing as any)?._extras || []).map((extra: CharacterExtraRow) => (
                <ModalExtraRow key={extra.id} extra={extra} onUpdate={(patch) => updateModalExtra('preferredClothing', extra.id, patch)} onDelete={() => deleteModalExtra('preferredClothing', extra.id)} />
              ))}
              <AddRowButton onClick={() => addModalExtra('preferredClothing')} />
            </CollapsibleSection>
          )}

          {isTraitVisible('personality') && (
            <PersonalitySection
              personality={draft.mainPersonality || defaultPersonality}
              onChange={(personality) => setDraft(prev => ({ ...prev, mainPersonality: personality }))}
              isExpanded={expandedSections.personality}
              onToggle={() => toggleSection('personality')}
            />
          )}

          {isTraitVisible('tone') && (
            <CollapsibleSection title="Tone" isExpanded={expandedSections.tone} onToggle={() => toggleSection('tone')}>
              {((draft.tone as any)?._extras || []).map((extra: CharacterExtraRow) => (
                <ModalExtraRow key={extra.id} extra={extra} onUpdate={(patch) => updateModalExtra('tone', extra.id, patch)} onDelete={() => deleteModalExtra('tone', extra.id)} />
              ))}
              <AddRowButton onClick={() => addModalExtra('tone')} />
            </CollapsibleSection>
          )}

          {isTraitVisible('background') && (
            <CollapsibleSection title="Background" isExpanded={expandedSections.background} onToggle={() => toggleSection('background')}>
              <HardcodedRow label="Job / Occupation" value={(draft as any).mainBackground?.jobOccupation || ''} onChange={(v) => updateMainBackground('jobOccupation', v)} placeholder="Software Engineer" />
              <HardcodedRow label="Education Level" value={(draft as any).mainBackground?.educationLevel || ''} onChange={(v) => updateMainBackground('educationLevel', v)} placeholder="Bachelor's" />
              <HardcodedRow label="Residence" value={(draft as any).mainBackground?.residence || ''} onChange={(v) => updateMainBackground('residence', v)} placeholder="Downtown apartment" />
              <HardcodedRow label="Hobbies" value={(draft as any).mainBackground?.hobbies || ''} onChange={(v) => updateMainBackground('hobbies', v)} placeholder="Reading, Hiking" />
              <HardcodedRow label="Financial Status" value={(draft as any).mainBackground?.financialStatus || ''} onChange={(v) => updateMainBackground('financialStatus', v)} placeholder="Middle class" />
              <HardcodedRow label="Motivation" value={(draft as any).mainBackground?.motivation || ''} onChange={(v) => updateMainBackground('motivation', v)} placeholder="What drives this character" />
              {(((draft as any).mainBackground as any)?._extras || []).map((extra: CharacterExtraRow) => (
                <ModalExtraRow key={extra.id} extra={extra} onUpdate={(patch) => updateModalExtra('background', extra.id, patch)} onDelete={() => deleteModalExtra('background', extra.id)} />
              ))}
              <AddRowButton onClick={() => addModalExtra('background')} />
            </CollapsibleSection>
          )}

          {isTraitVisible('keyLifeEvents') && (
            <CollapsibleSection title="Key Life Events" isExpanded={expandedSections.keyLifeEvents} onToggle={() => toggleSection('keyLifeEvents')}>
              {((draft.keyLifeEvents as any)?._extras || []).map((extra: CharacterExtraRow) => (
                <ModalExtraRow key={extra.id} extra={extra} onUpdate={(patch) => updateModalExtra('keyLifeEvents', extra.id, patch)} onDelete={() => deleteModalExtra('keyLifeEvents', extra.id)} />
              ))}
              <AddRowButton onClick={() => addModalExtra('keyLifeEvents')} />
            </CollapsibleSection>
          )}

          {isTraitVisible('relationships') && (
            <CollapsibleSection title="Relationships" isExpanded={expandedSections.relationships} onToggle={() => toggleSection('relationships')}>
              {((draft.relationships as any)?._extras || []).map((extra: CharacterExtraRow) => (
                <ModalExtraRow key={extra.id} extra={extra} onUpdate={(patch) => updateModalExtra('relationships', extra.id, patch)} onDelete={() => deleteModalExtra('relationships', extra.id)} />
              ))}
              <AddRowButton onClick={() => addModalExtra('relationships')} />
            </CollapsibleSection>
          )}

          {isTraitVisible('secrets') && (
            <CollapsibleSection title="Secrets" isExpanded={expandedSections.secrets} onToggle={() => toggleSection('secrets')}>
              {((draft.secrets as any)?._extras || []).map((extra: CharacterExtraRow) => (
                <ModalExtraRow key={extra.id} extra={extra} onUpdate={(patch) => updateModalExtra('secrets', extra.id, patch)} onDelete={() => deleteModalExtra('secrets', extra.id)} />
              ))}
              <AddRowButton onClick={() => addModalExtra('secrets')} />
            </CollapsibleSection>
          )}

          {isTraitVisible('fears') && (
            <CollapsibleSection title="Fears" isExpanded={expandedSections.fears} onToggle={() => toggleSection('fears')}>
              {((draft.fears as any)?._extras || []).map((extra: CharacterExtraRow) => (
                <ModalExtraRow key={extra.id} extra={extra} onUpdate={(patch) => updateModalExtra('fears', extra.id, patch)} onDelete={() => deleteModalExtra('fears', extra.id)} />
              ))}
              <AddRowButton onClick={() => addModalExtra('fears')} />
            </CollapsibleSection>
          )}

          {isTraitVisible('characterGoals') && (
            <CharacterGoalsSection
              goals={draft.goals || []}
              onChange={(goals) => setDraft(prev => ({ ...prev, goals }))}
              isExpanded={expandedSections.goals}
              onToggle={() => toggleSection('goals')}
            />
          )}

          {/* Custom sections */}
          {draft.sections?.map((section) => {
            if (!isTraitVisible(`custom:${section.id}`)) return null;
            return renderCustomSection(section);
          })}
        </div>
      </TabFieldNavigator>

      <CustomContentTypeModal
        open={showCategoryTypeModal}
        onClose={() => setShowCategoryTypeModal(false)}
        onSelect={(type) => addNewSection(type as 'structured' | 'freeform')}
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[85vh] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col bg-[#2a2a2f] border-black/35 [&>button]:hidden">
        {/* Dark header bar matching builder */}
        <DialogHeader className="px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg font-black text-[hsl(var(--ui-surface-2))] uppercase tracking-tight">
                  {viewMode === 'character' ? 'Edit Character' : 'Scenario Card'}
                </DialogTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-blue-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[300px] text-xs font-semibold leading-relaxed normal-case tracking-normal">
                    Changes only apply to this playthrough and do not affect the creator's original story.
                  </TooltipContent>
                </Tooltip>
              </div>
              
              {/* View Mode Toggle */}
              {scenarioWorldCore && (
                <div className="flex items-center bg-[#2b2b2e] rounded-full p-1 gap-0.5 border border-[#2b2b2e]">
                  <button
                    type="button"
                    onClick={() => setViewMode('character')}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-bold transition-colors",
                      viewMode === 'character' 
                        ? "relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 text-white shadow-sm" 
                        : "border-t border-transparent text-[#a1a1aa] hover:text-[#e4e4e7]"
                    )}
                  >
                    {viewMode === 'character' && (
                      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/[0.13] via-white/[0.04] to-transparent" />
                    )}
                    <span className="relative z-[1]">Character Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('scenario')}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-bold transition-colors",
                      viewMode === 'scenario' 
                        ? "relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 text-white shadow-sm" 
                        : "border-t border-transparent text-[#a1a1aa] hover:text-[#e4e4e7]"
                    )}
                  >
                    {viewMode === 'scenario' && (
                      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/[0.13] via-white/[0.04] to-transparent" />
                    )}
                    <span className="relative z-[1]">Scenario Card</span>
                  </button>
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              {conversationId && (
                <Tooltip open={isTooltipOpen}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={handleDeepScan}
                      disabled={isDeepScanning || isSaving}
                      onMouseEnter={() => setIsTooltipOpen(true)}
                      onMouseLeave={() => setIsTooltipOpen(false)}
                      className="group relative flex h-10 px-4 rounded-xl overflow-hidden text-white text-xs font-bold leading-none shadow-[0_12px_40px_rgba(0,0,0,0.45)] hover:brightness-125 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/45 disabled:opacity-50 shrink-0"
                    >
                      <span aria-hidden className="absolute inset-0 rounded-xl" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.34) 0%, rgba(34,184,200,0.62) 18%, rgba(255,255,255,0.22) 44%, rgba(109,94,247,0.64) 78%, rgba(255,255,255,0.28) 100%)", filter: "drop-shadow(0 0 10px rgba(255,255,255,0.10)) drop-shadow(0 0 18px rgba(109,94,247,0.10)) drop-shadow(0 0 18px rgba(34,184,200,0.10))" }} />
                      <span aria-hidden className="absolute inset-[2px] rounded-[10px]" style={{ background: "#2B2D33" }} />
                      <span aria-hidden className="absolute inset-[2px] rounded-[10px]" style={{ background: "linear-gradient(90deg, rgba(34,184,200,0.22), rgba(109,94,247,0.22)), #2B2D33" }} />
                      <span aria-hidden className="absolute inset-[2px] rounded-[10px]" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.11), rgba(255,255,255,0.00) 46%, rgba(0,0,0,0.16))" }} />
                      <span aria-hidden className="absolute inset-0 rounded-xl pointer-events-none" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.26), inset 0 -1px 0 rgba(0,0,0,0.22)", background: "linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.00) 55%)", mixBlendMode: "screen" }} />
                      <span aria-hidden className="absolute -left-8 -top-8 h-32 w-32 rounded-full blur-2xl pointer-events-none" style={{ background: "radial-gradient(circle, rgba(34,184,200,0.28), transparent 62%)" }} />
                      <span aria-hidden className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, rgba(109,94,247,0.26), transparent 65%)" }} />
                      <span aria-hidden className="absolute inset-0 rounded-xl pointer-events-none" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(0,0,0,0.26), 0 0 0 1px rgba(255,255,255,0.06)" }} />
                      <span className="relative z-10 flex items-center justify-center gap-2 w-full">
                        {isDeepScanning ? (
                          <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin text-cyan-200" style={{ filter: "drop-shadow(0 0 10px rgba(34,184,200,0.35))" }} />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 shrink-0 text-cyan-200" style={{ filter: "drop-shadow(0 0 10px rgba(34,184,200,0.35))" }} />
                        )}
                        <span className="min-w-0 truncate drop-shadow-[0_1px_0_rgba(0,0,0,0.35)]">
                          {isDeepScanning ? "Analyzing..." : "AI Update"}
                        </span>
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[250px] pointer-events-none">
                    Run additional scan of dialog to update character card
                  </TooltipContent>
                </Tooltip>
              )}
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
                className="inline-flex items-center justify-center h-10 px-6 rounded-xl border-0 bg-[#303035] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:bg-[#343439] active:bg-[#343439] transition-all active:scale-95 text-xs font-bold leading-none disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (viewMode === 'scenario') handleSaveScenarioCard();
                  handleSave();
                }}
                disabled={isSaving}
                className="inline-flex items-center justify-center h-10 px-6 rounded-xl border-0 bg-[#303035] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:bg-[#343439] active:bg-[#343439] transition-all active:scale-95 text-xs font-bold leading-none disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        {viewMode === 'character' ? (
          isSideCharacter ? renderSideCharacterContent() : renderMainCharacterContent()
        ) : (
          <ScrollArea className="flex-1 min-h-0 bg-[#1a1b20]">
            <div className="p-6">
              <ScenarioCardEditorView
                scenarioDraft={scenarioDraft}
                onUpdateScenarioDraft={setScenarioDraft}
                expandedSections={expandedSections}
                toggleSection={toggleSection}
              />
            </div>
          </ScrollArea>
        )}
      </DialogContent>

      {/* Change Name Modal */}
      <ChangeNameModal
        open={isChangeNameModalOpen}
        onOpenChange={setIsChangeNameModalOpen}
        currentName={draft.name || character?.name || ''}
        onSave={(newName) => {
          setDraft(prev => ({
            ...prev,
            name: newName,
            previousNames: [...(prev.previousNames || []), prev.name || character?.name || ''].filter(Boolean)
          }));
          setIsChangeNameModalOpen(false);
        }}
      />
    </Dialog>
  );
};

export default CharacterEditorModalScreen;

// Backward-compatible named export during migration
export const CharacterEditModal = CharacterEditorModalScreen;
