
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { GalleryHub } from '@/components/chronicle/GalleryHub';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

type SortOption = 'all' | 'recent' | 'liked' | 'saved' | 'played' | 'following';

const Gallery: React.FC = () => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<SortOption>('all');

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
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
                      "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                      sortBy === option.key 
                        ? "bg-[#4a5f7f] text-white shadow-sm" 
                        : "text-[#a1a1aa] hover:text-[#e4e4e7]"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <GalleryHub onPlay={handlePlay} sortBy={sortBy} onSortChange={setSortBy} />
      </main>
    </div>
  );
};

export default Gallery;
