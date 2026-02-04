
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { GalleryHub } from '@/components/chronicle/GalleryHub';
import { useAuth } from '@/hooks/use-auth';

const Gallery: React.FC = () => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handlePlay = (scenarioId: string, publishedScenarioId: string) => {
    // Navigate to main app and trigger play
    // We'll pass the scenario ID to play via state
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
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                Community Gallery
              </h1>
              <p className="text-sm text-slate-500">
                Discover and play stories from other creators
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <GalleryHub onPlay={handlePlay} />
      </main>
    </div>
  );
};

export default Gallery;
