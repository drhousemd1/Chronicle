import React from 'react';
import { CharacterPersonality, PersonalityTrait, PersonalityTraitFlexibility } from '@/types';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { uid } from '@/utils';
import { cn } from '@/lib/utils';

interface PersonalitySectionProps {
  personality: CharacterPersonality;
  onChange: (personality: CharacterPersonality) => void;
  isExpanded?: boolean;
  onToggle?: () => void;
  readOnly?: boolean;
}

const FLEX_OPTIONS: { value: PersonalityTraitFlexibility; label: string }[] = [
  { value: 'rigid', label: 'Rigid' },
  { value: 'normal', label: 'Normal' },
  { value: 'flexible', label: 'Flexible' },
];

const FLEX_COLORS: Record<PersonalityTraitFlexibility, string> = {
  rigid: 'text-red-400',
  normal: 'text-blue-400',
  flexible: 'text-emerald-400',
};

const defaultTrait = (): PersonalityTrait => ({
  id: uid('ptrait'),
  label: '',
  value: '',
  flexibility: 'normal',
});

export const defaultPersonality: CharacterPersonality = {
  splitMode: false,
  traits: [defaultTrait()],
  outwardTraits: [defaultTrait()],
  inwardTraits: [defaultTrait()],
};

// Auto-resizing textarea
const AutoResizeTextarea: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder, className = '' }) => {
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
      rows={1}
      spellCheck={true}
      className={`w-full min-w-0 resize-none overflow-hidden whitespace-pre-wrap break-words ${className}`}
    />
  );
};

const TraitRow: React.FC<{
  trait: PersonalityTrait;
  onUpdate: (patch: Partial<PersonalityTrait>) => void;
  onDelete: () => void;
  readOnly?: boolean;
}> = ({ trait, onUpdate, onDelete, readOnly }) => {
  if (readOnly) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{trait.label || 'Untitled'}</span>
          <span className={cn("text-[9px] font-bold uppercase", FLEX_COLORS[trait.flexibility])}>[{trait.flexibility}]</span>
        </div>
        <p className="text-sm text-zinc-400">{trait.value || '—'}</p>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <div className="flex-1 flex gap-2 min-w-0">
        <AutoResizeTextarea
          value={trait.label}
          onChange={(v) => onUpdate({ label: v })}
          placeholder="Trait name"
          className="w-1/3 px-3 py-2 text-xs font-bold bg-zinc-900/50 border border-white/10 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-w-0"
        />
        <AutoResizeTextarea
          value={trait.value}
          onChange={(v) => onUpdate({ value: v })}
          placeholder="Description..."
          className="flex-1 px-3 py-2 text-sm bg-zinc-900/50 border border-white/10 text-white placeholder:text-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-w-0"
        />
      </div>
      {/* Flexibility dropdown */}
      <select
        value={trait.flexibility}
        onChange={(e) => onUpdate({ flexibility: e.target.value as PersonalityTraitFlexibility })}
        className="mt-1 text-[10px] font-bold uppercase bg-zinc-900/50 border border-white/10 text-zinc-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
      >
        {FLEX_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={onDelete}
        className="text-red-400 hover:text-red-300 p-1.5 rounded-md hover:bg-red-900/30 mt-1"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const TraitList: React.FC<{
  heading?: string;
  traits: PersonalityTrait[];
  onUpdateTrait: (id: string, patch: Partial<PersonalityTrait>) => void;
  onDeleteTrait: (id: string) => void;
  onAddTrait: () => void;
  readOnly?: boolean;
}> = ({ heading, traits, onUpdateTrait, onDeleteTrait, onAddTrait, readOnly }) => (
  <div className="space-y-3">
    {heading && (
      <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.15em] border-b border-white/5 pb-2">{heading}</h4>
    )}
    {traits.length > 0 ? (
      <div className="space-y-3">
        {traits.map(trait => (
          <TraitRow
            key={trait.id}
            trait={trait}
            onUpdate={(patch) => onUpdateTrait(trait.id, patch)}
            onDelete={() => onDeleteTrait(trait.id)}
            readOnly={readOnly}
          />
        ))}
      </div>
    ) : (
      <p className="text-zinc-500 text-sm italic">No traits defined</p>
    )}
    {!readOnly && (
      <button
        type="button"
        onClick={onAddTrait}
        className="w-full py-2.5 text-sm font-medium text-blue-400 hover:text-blue-300 border border-dashed border-blue-500/30 hover:border-blue-400 rounded-xl transition-all flex items-center justify-center gap-1"
      >
        <Plus className="w-4 h-4" /> Add Trait
      </button>
    )}
  </div>
);

export const PersonalitySection: React.FC<PersonalitySectionProps> = ({
  personality,
  onChange,
  isExpanded = true,
  onToggle,
  readOnly = false,
}) => {
  const updateTraits = (key: 'traits' | 'outwardTraits' | 'inwardTraits', id: string, patch: Partial<PersonalityTrait>) => {
    onChange({
      ...personality,
      [key]: personality[key].map(t => t.id === id ? { ...t, ...patch } : t),
    });
  };

  const deleteTrait = (key: 'traits' | 'outwardTraits' | 'inwardTraits', id: string) => {
    onChange({
      ...personality,
      [key]: personality[key].filter(t => t.id !== id),
    });
  };

  const addTrait = (key: 'traits' | 'outwardTraits' | 'inwardTraits') => {
    onChange({
      ...personality,
      [key]: [...personality[key], defaultTrait()],
    });
  };

  const CollapsedView = () => {
    const allTraits = personality.splitMode
      ? [...personality.outwardTraits, ...personality.inwardTraits]
      : personality.traits;
    const filled = allTraits.filter(t => t.label || t.value);
    if (filled.length === 0) return <p className="text-zinc-500 text-sm italic">No personality traits defined</p>;
    return (
      <div className="space-y-3">
        {filled.map(t => (
          <TraitRow key={t.id} trait={t} onUpdate={() => {}} onDelete={() => {}} readOnly />
        ))}
      </div>
    );
  };

  return (
    <div className="w-full bg-[#2a2a2f] rounded-[24px] border border-white/10 overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)]">
      <div className="bg-[#4a5f7f] border-b border-white/20 px-5 py-3 flex items-center justify-between shadow-lg">
        <h2 className="text-white text-xl font-bold tracking-tight">Personality</h2>
        {onToggle && (
          <button onClick={onToggle} className="text-white/70 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10">
            {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          </button>
        )}
      </div>

      <div className="p-5">
        <div className="p-5 pb-6 bg-[#3a3a3f]/30 rounded-2xl border border-white/5">
          {!isExpanded ? (
            <CollapsedView />
          ) : (
            <div className="space-y-5">
              {/* Split toggle */}
              {!readOnly && (
                <div className="flex items-center gap-3">
                  <Switch
                    checked={personality.splitMode}
                    onCheckedChange={(checked) => onChange({ ...personality, splitMode: checked })}
                  />
                  <span className="text-xs text-zinc-400 font-medium">Split into Outward & Inward Personalities</span>
                </div>
              )}

              {personality.splitMode ? (
                <div className="space-y-6">
                  <TraitList
                    heading="Outward Personality"
                    traits={personality.outwardTraits}
                    onUpdateTrait={(id, patch) => updateTraits('outwardTraits', id, patch)}
                    onDeleteTrait={(id) => deleteTrait('outwardTraits', id)}
                    onAddTrait={() => addTrait('outwardTraits')}
                    readOnly={readOnly}
                  />
                  <TraitList
                    heading="Inward Personality"
                    traits={personality.inwardTraits}
                    onUpdateTrait={(id, patch) => updateTraits('inwardTraits', id, patch)}
                    onDeleteTrait={(id) => deleteTrait('inwardTraits', id)}
                    onAddTrait={() => addTrait('inwardTraits')}
                    readOnly={readOnly}
                  />
                </div>
              ) : (
                <TraitList
                  traits={personality.traits}
                  onUpdateTrait={(id, patch) => updateTraits('traits', id, patch)}
                  onDeleteTrait={(id) => deleteTrait('traits', id)}
                  onAddTrait={() => addTrait('traits')}
                  readOnly={readOnly}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
