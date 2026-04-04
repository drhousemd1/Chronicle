import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  X,
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
import { ScrollArea } from '@/components/ui/scroll-area';
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
      <CollapsibleTrigger className="flex items-center justify-between w-full py-3 px-4 hover:bg-ghost-white transition-colors">
        <span className="text-sm font-semibold text-white">{title}</span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-[rgba(248,250,252,0.3)]" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[rgba(248,250,252,0.3)]" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-4 pr-2 pb-2 space-y-0.5">
          {items.map((item) => {
            const Icon = getIcon ? getIcon(item) : Tag;
            const iconColor = getIconColor ? getIconColor(item) : 'text-[rgba(248,250,252,0.3)]';
            const isSelected = selectedItems.includes(item);
            
            return (
              <button
                key={item}
                onClick={() => onToggle(item)}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left text-sm transition-colors",
                  isSelected 
                    ? "bg-blue-500/20 text-blue-500" 
                    : "text-white/70 hover:bg-ghost-white hover:text-white"
                )}
              >
                <Icon className={cn("w-4 h-4 flex-shrink-0", isSelected ? "text-blue-500" : iconColor)} />
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
  onClose,
  selectedFilters,
  onFilterChange,
}, ref) => {
  if (!isOpen) return null;

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
    <div ref={ref} className="w-72 flex-shrink-0 bg-[#18181b] border-r border-ghost-white flex flex-col h-full">
      {/* Yellow accent border */}
      <div className="h-0.5 bg-yellow-400" />
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ghost-white">
        <span className="text-sm font-bold text-white">Browse Categories</span>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-ghost-white transition-colors"
          aria-label="Close category browser"
          title="Close category browser"
        >
          <X className="w-4 h-4 text-[rgba(248,250,252,0.3)]" />
        </button>
      </div>
      
      {/* Clear filters button */}
      {hasActiveFilters && (
        <div className="px-4 py-2 border-b border-ghost-white">
          <button
            onClick={clearAllFilters}
            className="text-xs text-blue-500 hover:text-blue-300 font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}
      
      {/* Scrollable categories */}
      <ScrollArea className="flex-1">
        <div className="py-2">
          {/* Story Type */}
          <CategorySection
            title="Story Type"
            items={STORY_TYPES}
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
      </ScrollArea>
    </div>
  );
});

GalleryCategorySidebar.displayName = "GalleryCategorySidebar";
