
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { GalleryHub } from '@/components/chronicle/GalleryHub';
import { GalleryNsfwToggle } from '@/components/chronicle/GalleryNsfwToggle';
import { useAuth } from '@/hooks/use-auth';
import { useGalleryNsfwPreference } from '@/hooks/use-gallery-nsfw-preference';
import { cn } from '@/lib/utils';
import type { SortOption } from '@/services/gallery-data';

const Gallery: React.FC = () => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<SortOption>('all');
  const [showNsfw, setShowNsfw] = useGalleryNsfwPreference();

  // Redirect to home if not authenticated (auth modal will handle login)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/?auth=1');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handlePlay = (scenarioId: string, publishedScenarioId: string) => {
    navigate('/', { 
      state: { 
        playScenarioId: scenarioId,
        publishedScenarioId: publishedScenarioId 
      } 
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-ghost-white" />
    );
  }

  return (
    <div className="min-h-screen bg-ghost-white flex flex-col">
      {/* Header */}
      <header className="bg-[rgba(248,250,252,0.3)] border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-black text-[hsl(var(--ui-surface-2))] uppercase tracking-tight">
                Community Gallery
              </h1>
              <div className="flex items-center bg-[#2b2b2e] rounded-full p-1 gap-0.5 border border-[#2b2b2e]">
                {[
                  { key: 'all' as SortOption, label: 'All Stories' },
                  { key: 'recent' as SortOption, label: 'Recent' },
                  { key: 'liked' as SortOption, label: 'Liked' },
                  { key: 'saved' as SortOption, label: 'Saved' },
                  { key: 'played' as SortOption, label: 'Played' },
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setSortBy(option.key)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-bold transition-colors border-t",
                      sortBy === option.key 
                        ? "relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-white/20 text-white shadow-sm" 
                        : "border-transparent text-[#a1a1aa] hover:text-[#e4e4e7]"
                    )}
                  >
                    {sortBy === option.key && (
                      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/[0.07] via-transparent to-transparent pointer-events-none" />
                    )}
                    <span className="relative z-[1]">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <GalleryNsfwToggle
            checked={showNsfw}
            onCheckedChange={setShowNsfw}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <GalleryHub onPlay={handlePlay} sortBy={sortBy} onSortChange={setSortBy} showNsfw={showNsfw} />
      </main>
    </div>
  );
};

export default Gallery;
