import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Shield,
  Flame,
  Wand2,
  Heart,
  Moon,
  Skull,
  Rocket,
  Zap,
  BookOpen,
  Pen,
  Gamepad2,
  Film,
  AlertTriangle,
  Tag,
  Sparkles,
  Crown,
  Swords,
  Ghost,
  Users,
  Compass
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { GENRES, ORIGINS, TRIGGER_WARNINGS, STORY_TYPES } from '@/constants/content-themes';

export interface CategoryFilters {
  storyTypes: string[];
  genres: string[];
  origins: string[];
  triggerWarnings: string[];
  customTags: string[];
}

interface GalleryCategorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  showNsfw: boolean;
  selectedFilters: CategoryFilters;
  onFilterChange: (filters: CategoryFilters) => void;
}

// Icon mapping for genres
const genreIcons: Record<string, React.ElementType> = {
  'Fictional': Sparkles,
  'Fantasy': Wand2,
  'Romance': Heart,
  'Dark Romance': Moon,
  'Why Choose': Users,
  'Reverse Harem': Crown,
  'Gothic Romance': Ghost,
  'Paranormal Romance': Ghost,
  'Enemies To Lovers': Swords,
  'Hentai': Flame,
  'Anime': Sparkles,
  'Royalty': Crown,
  'Action': Zap,
  'Adventure': Compass,
  'Religious': BookOpen,
  'Historical': BookOpen,
  'Sci-Fi': Rocket,
  'Horror': Skull,
  'FanFiction': Pen,
  'Philosophy': BookOpen,
  'Political': BookOpen,
  'Detective': BookOpen,
  'Manga': BookOpen,
};

// Icon mapping for origins
const originIcons: Record<string, React.ElementType> = {
  'Original': Pen,
  'Game': Gamepad2,
  'Movie': Film,
  'Novel': BookOpen,
};

interface CategorySectionProps {
  title: string;
  items: readonly string[];
  selectedItems: string[];
  onToggle: (item: string) => void;
  getIcon?: (item: string) => React.ElementType;
  getIconColor?: (item: string) => string;
  defaultOpen?: boolean;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  title,
  items,
  selectedItems,
  onToggle,
  getIcon,
  getIconColor,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl border border-black/30 bg-[#3c3e47] px-4 py-3 text-left shadow-[0_8px_20px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.07),inset_0_-1px_0_rgba(0,0,0,0.18)] transition-colors hover:bg-[#44464f]">
        <span className="text-sm font-bold tracking-[-0.01em] text-white/90">{title}</span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-zinc-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-zinc-400" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-1.5 px-1 pb-1 pt-3">
          {items.map((item) => {
            const Icon = getIcon ? getIcon(item) : Tag;
            const iconColor = getIconColor ? getIconColor(item) : 'text-[rgba(248,250,252,0.3)]';
            const isSelected = selectedItems.includes(item);
            
            return (
              <button
                key={item}
                onClick={() => onToggle(item)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                  isSelected 
                    ? "border-[#6e89ad]/45 bg-[#4a5f7f]/25 text-[#e7eef8] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" 
                    : "border-transparent text-zinc-300 hover:bg-white/[0.04] hover:text-white"
                )}
              >
                <Icon className={cn("h-4 w-4 flex-shrink-0", isSelected ? "text-[#9fb5d4]" : iconColor)} />
                <span className="truncate">{item}</span>
              </button>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export const GalleryCategorySidebar = React.forwardRef<HTMLDivElement, GalleryCategorySidebarProps>(({
  isOpen,
  showNsfw,
  selectedFilters,
  onFilterChange,
}, ref) => {
  if (!isOpen) return null;

  const visibleStoryTypes = showNsfw
    ? STORY_TYPES
    : STORY_TYPES.filter((type) => type !== 'NSFW');

  const toggleFilter = (category: keyof CategoryFilters, item: string) => {
    const current = selectedFilters[category];
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    
    onFilterChange({
      ...selectedFilters,
      [category]: updated,
    });
  };

  const clearAllFilters = () => {
    onFilterChange({
      storyTypes: [],
      genres: [],
      origins: [],
      triggerWarnings: [],
      customTags: [],
    });
  };

  const hasActiveFilters = 
    selectedFilters.storyTypes.length > 0 ||
    selectedFilters.genres.length > 0 ||
    selectedFilters.origins.length > 0 ||
    selectedFilters.triggerWarnings.length > 0 ||
    selectedFilters.customTags.length > 0;

  return (
    <div
      ref={ref}
      className="flex h-full min-h-0 w-full flex-col bg-[#2e2e33]"
    >
      {hasActiveFilters && (
        <div className="bg-[#2e2e33] px-4 py-3 shadow-[inset_1px_1px_0_rgba(255,255,255,0.04),inset_-1px_-1px_0_rgba(0,0,0,0.18)]">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#6e89ad]/30 bg-[#4a5f7f]/12 px-3 py-2 text-xs text-zinc-300">
            <span>{selectedFilters.storyTypes.length + selectedFilters.genres.length + selectedFilters.origins.length + selectedFilters.triggerWarnings.length + selectedFilters.customTags.length} filters active</span>
            <button
              onClick={clearAllFilters}
              className="font-bold text-[#dbe7f4] transition-colors hover:text-white"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto bg-[#2e2e33] p-3 scrollbar-none">
        <div className="space-y-3">
          {/* Story Type */}
          <CategorySection
            title="Story Type"
            items={visibleStoryTypes}
            selectedItems={selectedFilters.storyTypes}
            onToggle={(item) => toggleFilter('storyTypes', item)}
            getIcon={(item) => item === 'SFW' ? Shield : Flame}
            getIconColor={(item) => item === 'SFW' ? 'text-green-400' : 'text-orange-400'}
            defaultOpen={true}
          />
          
          {/* Genres */}
          <CategorySection
            title="Genre"
            items={GENRES}
            selectedItems={selectedFilters.genres}
            onToggle={(item) => toggleFilter('genres', item)}
            getIcon={(item) => genreIcons[item] || Sparkles}
            defaultOpen={true}
          />
          
          {/* Origin */}
          <CategorySection
            title="Origin"
            items={ORIGINS}
            selectedItems={selectedFilters.origins}
            onToggle={(item) => toggleFilter('origins', item)}
            getIcon={(item) => originIcons[item] || Tag}
            defaultOpen={false}
          />
          
          {/* Trigger Warnings */}
          <CategorySection
            title="Trigger Warnings"
            items={TRIGGER_WARNINGS}
            selectedItems={selectedFilters.triggerWarnings}
            onToggle={(item) => toggleFilter('triggerWarnings', item)}
            getIcon={() => AlertTriangle}
            getIconColor={() => 'text-amber-400'}
            defaultOpen={false}
          />
        </div>
      </div>
    </div>
  );
});

GalleryCategorySidebar.displayName = "GalleryCategorySidebar";
