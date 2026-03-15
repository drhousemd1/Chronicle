import React, { useState } from 'react';
import { Tags, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContentThemes } from '@/types';
import {
  CHARACTER_TYPES,
  STORY_TYPES,
  GENRES,
  ORIGINS,
  TRIGGER_WARNINGS
} from '@/constants/content-themes';

interface ContentThemesSectionProps {
  themes: ContentThemes;
  onUpdate: (themes: ContentThemes) => void;
  tagsError?: string;
  storyTypeError?: string;
}

interface CategorySelectorProps {
  title: string;
  prebuiltOptions: readonly string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  allowCustom?: boolean;
  singleSelect?: boolean;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  title,
  prebuiltOptions,
  selected,
  onChange,
  allowCustom = true,
  singleSelect = false
}) => {
  const [customInput, setCustomInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  const toggleOption = (option: string) => {
    if (singleSelect) {
      onChange(selected.includes(option) ? [] : [option]);
    } else {
      if (selected.includes(option)) {
        onChange(selected.filter(s => s !== option));
      } else {
        onChange([...selected, option]);
      }
    }
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
      setCustomInput('');
      setShowInput(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustom();
    } else if (e.key === 'Escape') {
      setShowInput(false);
      setCustomInput('');
    }
  };

  // Custom options are those not in prebuilt list
  const customOptions = selected.filter(s => !prebuiltOptions.includes(s as any));

  return (
    <div className="space-y-1">
      <h4 className="text-[10px] font-black text-zinc-400">
        {title}
      </h4>
      
       <div className="bg-[#1c1c1f] rounded-xl p-4 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
        <div className="flex flex-wrap gap-2">
          {/* Prebuilt options */}
          {prebuiltOptions.map(option => {
            const isSelected = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleOption(option)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border-0 transition-all shadow-[0_6px_16px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.07),inset_0_-1px_0_rgba(0,0,0,0.20)]",
                  isSelected
                    ? "bg-blue-500 text-white"
                    : "bg-[#3c3e47] text-zinc-300 hover:brightness-110"
                )}
              >
                {option}
              </button>
            );
          })}
          
          {/* Custom options (with remove button) */}
          {customOptions.map(option => (
            <div
              key={option}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30"
            >
              <span>{option}</span>
              <button
                type="button"
                onClick={() => onChange(selected.filter(s => s !== option))}
                className="ml-1 hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          
          {/* Add custom button/input */}
          {allowCustom && (
            showInput ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={() => {
                    if (!customInput.trim()) {
                      setShowInput(false);
                    }
                  }}
                  placeholder="Custom..."
                  autoFocus
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1c1c1f] text-white border-t border-black/35 focus:border-blue-500 focus:outline-none w-28"
                />
                <button
                  type="button"
                  onClick={addCustom}
                  className="p-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowInput(true)}
                className="h-8 px-3 rounded-lg text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Custom
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

// Story Type selector (single select, mutually exclusive)
const StoryTypeSelector: React.FC<{
  selected: 'SFW' | 'NSFW' | null;
  onChange: (value: 'SFW' | 'NSFW' | null) => void;
}> = ({ selected, onChange }) => {
  return (
    <div className="space-y-1">
      <h4 className="text-[10px] font-black text-zinc-400">
        Story Type
      </h4>
      
      <div className="bg-[#1c1c1f] rounded-xl p-4 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)] w-fit">
        <div className="flex gap-2">
          {STORY_TYPES.map(type => {
            const isSelected = selected === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => onChange(isSelected ? null : type)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border-0 transition-all shadow-[0_6px_16px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.07),inset_0_-1px_0_rgba(0,0,0,0.20)]",
                  isSelected
                    ? type === 'NSFW'
                      ? "bg-red-500 text-white"
                      : "bg-blue-500 text-white"
                    : "bg-[#3c3e47] text-zinc-300 hover:brightness-110"
                )}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Custom Tags section (free-form input)
const CustomTagsSection: React.FC<{
  tags: string[];
  onChange: (tags: string[]) => void;
}> = ({ tags, onChange }) => {
  const [input, setInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  const addTag = () => {
    const trimmed = input.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInput('');
      setShowInput(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Escape') {
      setShowInput(false);
      setInput('');
    }
  };

  return (
    <div className="space-y-1">
      <h4 className="text-[10px] font-black text-zinc-400">
        Custom Tags
      </h4>
      
      <div className="bg-[#1c1c1f] rounded-xl p-4 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <div
              key={tag}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => onChange(tags.filter(t => t !== tag))}
                className="ml-1 hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          
          {showInput ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  if (!input.trim()) {
                    setShowInput(false);
                  }
                }}
                placeholder="Custom..."
                autoFocus
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1c1c1f] text-white border-t border-black/35 focus:border-blue-500 focus:outline-none w-28"
              />
              <button
                type="button"
                onClick={addTag}
                className="p-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowInput(true)}
              className="h-8 px-3 rounded-lg text-xs font-bold text-blue-500 hover:text-blue-300 bg-[#3c3e47] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:brightness-110 transition-all flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
               Custom
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const ContentThemesSection: React.FC<ContentThemesSectionProps> = ({
  themes,
  onUpdate,
  tagsError,
  storyTypeError
}) => {
  const updateField = <K extends keyof ContentThemes>(
    field: K,
    value: ContentThemes[K]
  ) => {
    onUpdate({ ...themes, [field]: value });
  };

  return (
    <section>
      <div className="w-full bg-[#2a2a2f] rounded-[24px] overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]">
        {/* Section Header - Steel Blue */}
        <div className="relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-3 flex items-center gap-3 shadow-lg">
          <div className="absolute inset-0 z-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40" style={{ height: '60%' }} />
          <Tags className="w-[18px] h-[18px] text-white relative z-[1]" />
          <h2 className="text-white text-xl font-bold tracking-[-0.015em] relative z-[1]">Content Themes</h2>
        </div>
        
        {/* Content */}
        <div className="p-5">
          <div className="p-5 pb-6 bg-[#2e2e33] rounded-2xl shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
            <div className="space-y-6">
              {/* Tags error */}
              {tagsError && <p className="text-sm text-red-500 font-medium">{tagsError}</p>}

              {/* Character Types */}
              <CategorySelector
                title="Character Types"
                prebuiltOptions={CHARACTER_TYPES}
                selected={themes.characterTypes}
                onChange={v => updateField('characterTypes', v)}
              />

              {/* Story Type */}
              {storyTypeError && <p className="text-sm text-red-500 font-medium">{storyTypeError}</p>}
              <StoryTypeSelector
                selected={themes.storyType}
                onChange={v => updateField('storyType', v)}
              />

              {/* Genre */}
              <CategorySelector
                title="Genre"
                prebuiltOptions={GENRES}
                selected={themes.genres}
                onChange={v => updateField('genres', v)}
              />

              {/* Origin */}
              <CategorySelector
                title="Origin"
                prebuiltOptions={ORIGINS}
                selected={themes.origin}
                onChange={v => updateField('origin', v)}
              />

              {/* Trigger Warnings */}
              <CategorySelector
                title="Trigger Warnings"
                prebuiltOptions={TRIGGER_WARNINGS}
                selected={themes.triggerWarnings}
                onChange={v => updateField('triggerWarnings', v)}
              />

              {/* Custom Tags */}
              <CustomTagsSection
                tags={themes.customTags}
                onChange={v => updateField('customTags', v)}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
