import React, { useState } from 'react';
import { 
  ChevronDown, 
  Shield, 
  Flame, 
  BookOpen, 
  Heart, 
  Skull, 
  Tv,
  Sparkles,
  Gamepad2,
  Film,
  BookMarked,
  AlertTriangle,
  Tag,
  Filter,
  X,
  Crown,
  Swords,
  Ghost,
  Users,
  Book
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GENRES, ORIGINS, TRIGGER_WARNINGS } from '@/constants/content-themes';
import { Checkbox } from '@/components/ui/checkbox';

export interface CategoryFilter {
  storyType: ('SFW' | 'NSFW')[];
  genres: string[];
  origin: string[];
  triggerWarnings: string[];
  customTags: string[];
}

interface GalleryCategorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: CategoryFilter;
  onFilterChange: (filters: CategoryFilter) => void;
  popularCustomTags: string[];
}

// Icon mapping for genres
const getGenreIcon = (genre: string) => {
  switch (genre) {
    case 'Fiction':
    case 'Fictional':
      return <BookOpen className="w-4 h-4 text-blue-400" />;
    case 'Fantasy':
      return <Sparkles className="w-4 h-4 text-purple-400" />;
    case 'Romance':
      return <Heart className="w-4 h-4 text-pink-400" />;
    case 'Dark Romance':
      return <Heart className="w-4 h-4 text-rose-600" />;
    case 'Why Choose':
    case 'Reverse Harem':
      return <Users className="w-4 h-4 text-pink-300" />;
    case 'Gothic Romance':
      return <Ghost className="w-4 h-4 text-purple-500" />;
    case 'Paranormal Romance':
      return <Ghost className="w-4 h-4 text-violet-400" />;
    case 'Enemies To Lovers':
      return <Swords className="w-4 h-4 text-red-400" />;
    case 'Hentai':
    case 'Anime':
    case 'Manga':
      return <Tv className="w-4 h-4 text-cyan-400" />;
    case 'Royalty':
      return <Crown className="w-4 h-4 text-amber-400" />;
    case 'Action':
    case 'Adventure':
      return <Swords className="w-4 h-4 text-orange-400" />;
    case 'Horror':
      return <Skull className="w-4 h-4 text-red-500" />;
    case 'Sci-Fi':
      return <Sparkles className="w-4 h-4 text-cyan-400" />;
    case 'Historical':
    case 'Religious':
      return <Book className="w-4 h-4 text-amber-600" />;
    case 'FanFiction':
      return <BookMarked className="w-4 h-4 text-blue-400" />;
    case 'Detective':
      return <BookOpen className="w-4 h-4 text-slate-400" />;
    default:
      return <BookOpen className="w-4 h-4 text-zinc-400" />;
  }
};

// Icon mapping for origins
const getOriginIcon = (origin: string) => {
  switch (origin) {
    case 'Original':
      return <Sparkles className="w-4 h-4 text-amber-400" />;
    case 'Game':
      return <Gamepad2 className="w-4 h-4 text-green-400" />;
    case 'Movie':
      return <Film className="w-4 h-4 text-red-400" />;
    case 'Novel':
      return <BookMarked className="w-4 h-4 text-blue-400" />;
    default:
      return <Tag className="w-4 h-4 text-zinc-400" />;
  }
};

export const GalleryCategorySidebar: React.FC<GalleryCategorySidebarProps> = ({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  popularCustomTags
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['genre', 'origin', 'triggerWarnings', 'customTags']));
  const [filterMode, setFilterMode] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const toggleStoryType = (type: 'SFW' | 'NSFW') => {
    const current = filters.storyType;
    const next = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    onFilterChange({ ...filters, storyType: next });
  };

  const toggleGenre = (genre: string) => {
    const current = filters.genres;
    const next = current.includes(genre)
      ? current.filter(g => g !== genre)
      : [...current, genre];
    onFilterChange({ ...filters, genres: next });
  };

  const toggleOrigin = (origin: string) => {
    const current = filters.origin;
    const next = current.includes(origin)
      ? current.filter(o => o !== origin)
      : [...current, origin];
    onFilterChange({ ...filters, origin: next });
  };

  const toggleTriggerWarning = (tw: string) => {
    const current = filters.triggerWarnings;
    const next = current.includes(tw)
      ? current.filter(t => t !== tw)
      : [...current, tw];
    onFilterChange({ ...filters, triggerWarnings: next });
  };

  const toggleCustomTag = (tag: string) => {
    const current = filters.customTags;
    const next = current.includes(tag)
      ? current.filter(t => t !== tag)
      : [...current, tag];
    onFilterChange({ ...filters, customTags: next });
  };

  const clearAllFilters = () => {
    onFilterChange({
      storyType: [],
      genres: [],
      origin: [],
      triggerWarnings: [],
      customTags: []
    });
  };

  const hasActiveFilters = 
    filters.storyType.length > 0 ||
    filters.genres.length > 0 ||
    filters.origin.length > 0 ||
    filters.triggerWarnings.length > 0 ||
    filters.customTags.length > 0;

  if (!isOpen) return null;

  return (
    <div className="w-72 flex-shrink-0 bg-[#18181b] border-r border-white/5 h-full overflow-y-auto">
      {/* Yellow/Gold accent bar */}
      <div className="h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500" />
      
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Categories</h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Clear all
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Story Type Section */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Story Type</span>
          <button
            onClick={() => setFilterMode(!filterMode)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors",
              filterMode ? "bg-[#4a5f7f] text-white" : "bg-white/5 text-zinc-400 hover:text-white"
            )}
          >
            <Filter className="w-3 h-3" />
            Filter
          </button>
        </div>
        <div className="space-y-1">
          <button
            onClick={() => toggleStoryType('SFW')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
              filters.storyType.includes('SFW') 
                ? "bg-blue-500/20 border border-blue-500/30" 
                : "bg-white/5 hover:bg-white/10 border border-transparent"
            )}
          >
            {filterMode && (
              <Checkbox 
                checked={filters.storyType.includes('SFW')}
                className="border-zinc-600"
              />
            )}
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white">SFW</span>
          </button>
          <button
            onClick={() => toggleStoryType('NSFW')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
              filters.storyType.includes('NSFW') 
                ? "bg-orange-500/20 border border-orange-500/30" 
                : "bg-white/5 hover:bg-white/10 border border-transparent"
            )}
          >
            {filterMode && (
              <Checkbox 
                checked={filters.storyType.includes('NSFW')}
                className="border-zinc-600"
              />
            )}
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-white">NSFW</span>
          </button>
        </div>
      </div>

      {/* Genre Section */}
      <div className="border-b border-white/5">
        <button
          onClick={() => toggleSection('genre')}
          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Genre</span>
          <ChevronDown className={cn(
            "w-4 h-4 text-zinc-400 transition-transform",
            !expandedSections.has('genre') && "rotate-180"
          )} />
        </button>
        {expandedSections.has('genre') && (
          <div className="px-4 pb-4 space-y-1 max-h-64 overflow-y-auto">
            {GENRES.map(genre => (
              <button
                key={genre}
                onClick={() => toggleGenre(genre)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left",
                  filters.genres.includes(genre)
                    ? "bg-white/10 border border-white/20"
                    : "hover:bg-white/5 border border-transparent"
                )}
              >
                {filterMode && (
                  <Checkbox 
                    checked={filters.genres.includes(genre)}
                    className="border-zinc-600"
                  />
                )}
                {getGenreIcon(genre)}
                <span className="text-sm text-white/90">{genre}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Origin Section */}
      <div className="border-b border-white/5">
        <button
          onClick={() => toggleSection('origin')}
          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Origin</span>
          <ChevronDown className={cn(
            "w-4 h-4 text-zinc-400 transition-transform",
            !expandedSections.has('origin') && "rotate-180"
          )} />
        </button>
        {expandedSections.has('origin') && (
          <div className="px-4 pb-4 space-y-1">
            {ORIGINS.map(origin => (
              <button
                key={origin}
                onClick={() => toggleOrigin(origin)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left",
                  filters.origin.includes(origin)
                    ? "bg-white/10 border border-white/20"
                    : "hover:bg-white/5 border border-transparent"
                )}
              >
                {filterMode && (
                  <Checkbox 
                    checked={filters.origin.includes(origin)}
                    className="border-zinc-600"
                  />
                )}
                {getOriginIcon(origin)}
                <span className="text-sm text-white/90">{origin}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Trigger Warnings Section */}
      <div className="border-b border-white/5">
        <button
          onClick={() => toggleSection('triggerWarnings')}
          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Trigger Warnings</span>
          <ChevronDown className={cn(
            "w-4 h-4 text-zinc-400 transition-transform",
            !expandedSections.has('triggerWarnings') && "rotate-180"
          )} />
        </button>
        {expandedSections.has('triggerWarnings') && (
          <div className="px-4 pb-4 space-y-1 max-h-64 overflow-y-auto">
            {TRIGGER_WARNINGS.map(tw => (
              <button
                key={tw}
                onClick={() => toggleTriggerWarning(tw)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left",
                  filters.triggerWarnings.includes(tw)
                    ? "bg-red-500/10 border border-red-500/30"
                    : "hover:bg-white/5 border border-transparent"
                )}
              >
                {filterMode && (
                  <Checkbox 
                    checked={filters.triggerWarnings.includes(tw)}
                    className="border-zinc-600"
                  />
                )}
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="text-sm text-white/90">{tw}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Popular Custom Tags Section */}
      {popularCustomTags.length > 0 && (
        <div className="border-b border-white/5">
          <button
            onClick={() => toggleSection('customTags')}
            className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Popular Tags</span>
            <ChevronDown className={cn(
              "w-4 h-4 text-zinc-400 transition-transform",
              !expandedSections.has('customTags') && "rotate-180"
            )} />
          </button>
          {expandedSections.has('customTags') && (
            <div className="px-4 pb-4 space-y-1 max-h-64 overflow-y-auto">
              {popularCustomTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleCustomTag(tag)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left",
                    filters.customTags.includes(tag)
                      ? "bg-purple-500/10 border border-purple-500/30"
                      : "hover:bg-white/5 border border-transparent"
                  )}
                >
                  {filterMode && (
                    <Checkbox 
                      checked={filters.customTags.includes(tag)}
                      className="border-zinc-600"
                    />
                  )}
                  <Tag className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="text-sm text-white/90">{tag}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
