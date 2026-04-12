import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Heart, Bookmark, Play, FileText, Pencil, Move } from 'lucide-react';
import { compressAndUpload, resizeImage } from '@/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { AvatarActionButtons } from '@/components/chronicle/AvatarActionButtons';
import { AvatarGenerationModal } from '@/components/chronicle/AvatarGenerationModal';
import { GalleryScenarioCard } from '@/components/chronicle/GalleryStoryCard';
import { ScenarioDetailModal } from '@/components/chronicle/StoryDetailModal';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  type PublishedScenario,
  getUserInteractions,
  incrementPlayCount,
  recordView,
  saveScenarioToCollection,
  toggleLike,
  unsaveScenario,
} from '@/services/gallery-data';

interface PublicProfileTabProps {
  user: { id: string; email?: string } | null;
  onRegisterSave?: ((saveFn: (() => Promise<void>) | null) => void) | undefined;
  onSavingStateChange?: ((isSaving: boolean) => void) | undefined;
  onPlayScenario?: ((scenarioId: string, publishedScenarioId: string) => void) | undefined;
}

interface ProfileData {
  display_name: string;
  about_me: string;
  avatar_url: string;
  avatar_position: { x: number; y: number };
  preferred_genres: string[];
  hide_published_works: boolean;
  hide_profile_details: boolean;
}

interface CreatorStats {
  published_count: number;
  total_likes: number;
  total_saves: number;
  total_views: number;
  total_plays: number;
}

const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

export const PublicProfileTab: React.FC<PublicProfileTabProps> = ({
  user,
  onRegisterSave,
  onSavingStateChange,
  onPlayScenario,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarContainerRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<ProfileData>({
    display_name: '',
    about_me: '',
    avatar_url: '',
    avatar_position: { x: 50, y: 50 },
    preferred_genres: [],
    hide_published_works: false,
    hide_profile_details: false,
  });
  const [stats, setStats] = useState<CreatorStats>({
    published_count: 0,
    total_likes: 0,
    total_saves: 0,
    total_views: 0,
    total_plays: 0,
  });
  const [works, setWorks] = useState<PublishedScenario[]>([]);
  const [likes, setLikes] = useState<Set<string>>(new Set());
  const [saves, setSaves] = useState<Set<string>>(new Set());
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPublished, setSelectedPublished] = useState<PublishedScenario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [showAvatarGenModal, setShowAvatarGenModal] = useState(false);
  const [genreInput, setGenreInput] = useState('');
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; pos: { x: number; y: number } } | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('profiles').select('display_name, about_me, avatar_url, avatar_position, preferred_genres, hide_published_works, hide_profile_details').eq('id', user.id).maybeSingle(),
      supabase.rpc('get_creator_stats', { creator_user_id: user.id }),
      supabase.from('published_scenarios').select(`
        id,
        scenario_id,
        publisher_id,
        allow_remix,
        tags,
        like_count,
        save_count,
        play_count,
        view_count,
        avg_rating,
        review_count,
        is_published,
        created_at,
        updated_at,
        stories!inner (
          id,
          title,
          description,
          cover_image_url,
          cover_image_position,
          world_core
        )
      `).eq('publisher_id', user.id).eq('is_published', true).eq('is_hidden', false).order('created_at', { ascending: false }),
    ]).then(async ([profileRes, statsRes, worksRes]) => {
      if (profileRes.data) {
        const pos = profileRes.data.avatar_position as any;
        setProfile({
          display_name: profileRes.data.display_name || '',
          about_me: profileRes.data.about_me || '',
          avatar_url: profileRes.data.avatar_url || '',
          avatar_position: pos && typeof pos.x === 'number' ? pos : { x: 50, y: 50 },
          preferred_genres: profileRes.data.preferred_genres || [],
          hide_published_works: profileRes.data.hide_published_works || false,
          hide_profile_details: profileRes.data.hide_profile_details || false,
        });
      }
      if (statsRes.data && Array.isArray(statsRes.data) && statsRes.data.length > 0) {
        const s = statsRes.data[0];
        setStats({
          published_count: Number(s.published_count) || 0,
          total_likes: Number(s.total_likes) || 0,
          total_saves: Number(s.total_saves) || 0,
          total_views: Number(s.total_views) || 0,
          total_plays: Number(s.total_plays) || 0,
        });
      }
      if (worksRes.data) {
        const scenarioIds = worksRes.data.map((w: any) => w.scenario_id);
        const publisherIds = [...new Set(worksRes.data.map((w: any) => w.publisher_id))];
        const [themesRes, publishersRes] = await Promise.all([
          supabase
            .from('content_themes')
            .select('scenario_id, character_types, story_type, genres, origin, trigger_warnings, custom_tags')
            .in('scenario_id', scenarioIds),
          supabase
            .from('profiles')
            .select('id, username, avatar_url, display_name')
            .in('id', publisherIds),
        ]);

        const themesMap = new Map((themesRes.data || []).map((t: any) => [
          t.scenario_id,
          {
            characterTypes: t.character_types || [],
            storyType: t.story_type as 'SFW' | 'NSFW' | null,
            genres: t.genres || [],
            origin: t.origin || [],
            triggerWarnings: t.trigger_warnings || [],
            customTags: t.custom_tags || [],
          },
        ]));
        const publisherMap = new Map((publishersRes.data || []).map((p: any) => [p.id, p]));

        const mappedWorks: PublishedScenario[] = worksRes.data.map((w: any) => ({
          ...w,
          scenario: w.stories,
          publisher: publisherMap.get(w.publisher_id) || undefined,
          contentThemes: themesMap.get(w.scenario_id),
        }));
        setWorks(mappedWorks);

        if (mappedWorks.length > 0) {
          const interactions = await getUserInteractions(mappedWorks.map((w) => w.id), user.id);
          setLikes(interactions.likes);
          setSaves(interactions.saves);
        } else {
          setLikes(new Set());
          setSaves(new Set());
        }
      }
      setIsLoading(false);
    });
  }, [user]);

  const handleSave = useCallback(async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        display_name: profile.display_name,
        about_me: profile.about_me,
        avatar_position: profile.avatar_position as any,
        preferred_genres: profile.preferred_genres,
        hide_published_works: profile.hide_published_works,
        hide_profile_details: profile.hide_profile_details,
      }).eq('id', user.id);
      if (error) throw error;
    } catch (e: any) {
      console.error('Save failed:', e.message);
    } finally {
      setIsSaving(false);
    }
  }, [user, profile]);

  useEffect(() => {
    onRegisterSave?.(handleSave);
    return () => {
      onRegisterSave?.(null);
    };
  }, [onRegisterSave, handleSave]);

  useEffect(() => {
    onSavingStateChange?.(isSaving);
  }, [onSavingStateChange, isSaving]);

  // --- Reposition drag handlers (ported from CharactersTab) ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isRepositioning) return;
    setDragStart({ x: e.clientX, y: e.clientY, pos: profile.avatar_position });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragStart || !avatarContainerRef.current) return;
    const rect = avatarContainerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;
    setProfile(prev => ({
      ...prev,
      avatar_position: {
        x: clamp(dragStart.pos.x - deltaX, 0, 100),
        y: clamp(dragStart.pos.y - deltaY, 0, 100),
      }
    }));
  }, [dragStart]);

  const handleMouseUp = () => setDragStart(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isRepositioning) return;
    e.preventDefault();
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX, y: touch.clientY, pos: profile.avatar_position });
  };

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragStart || !avatarContainerRef.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = avatarContainerRef.current.getBoundingClientRect();
    const deltaX = ((touch.clientX - dragStart.x) / rect.width) * 100;
    const deltaY = ((touch.clientY - dragStart.y) / rect.height) * 100;
    setProfile(prev => ({
      ...prev,
      avatar_position: {
        x: clamp(dragStart.pos.x - deltaX, 0, 100),
        y: clamp(dragStart.pos.y - deltaY, 0, 100),
      }
    }));
  }, [dragStart]);

  const handleTouchEnd = () => setDragStart(null);

  const handleRepositionToggle = async () => {
    if (isRepositioning && user) {
      // Save position to DB when exiting reposition mode
      await supabase.from('profiles').update({ avatar_position: profile.avatar_position as any }).eq('id', user.id);
    }
    setIsRepositioning(!isRepositioning);
  };

  const uploadAvatarFromUrl = async (imageUrl: string) => {
    if (!user) return;
    setIsUploadingAvatar(true);
    try {
      const publicUrl = await compressAndUpload(imageUrl, 'avatars', user.id, 512, 512, 0.85);
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      if (updateError) throw updateError;
      setProfile(prev => ({ ...prev, avatar_url: publicUrl, avatar_position: { x: 50, y: 50 } }));
      setIsRepositioning(true);
    } catch (err: any) {
      console.error('Upload failed:', err.message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setIsUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const dataUrl = reader.result as string;
          const optimized = await resizeImage(dataUrl, 400, 400, 0.85);
          const response = await fetch(optimized);
          const blob = await response.blob();
          const filename = `${user.id}/avatar-${Date.now()}.jpg`;
          const { error: uploadError } = await supabase.storage.from('avatars').upload(filename, blob, { upsert: true, contentType: 'image/jpeg' });
          if (uploadError) throw uploadError;
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filename);
          const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
          if (updateError) throw updateError;
          setProfile(prev => ({ ...prev, avatar_url: publicUrl, avatar_position: { x: 50, y: 50 } }));
          setIsRepositioning(true);
        } catch (err: any) {
          console.error('Upload failed:', err.message);
        } finally {
          setIsUploadingAvatar(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Upload failed:', err.message);
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarGenerated = async (imageUrl: string) => {
    setShowAvatarGenModal(false);
    await uploadAvatarFromUrl(imageUrl);
  };

  const addGenre = () => {
    const trimmed = genreInput.trim();
    if (trimmed && !profile.preferred_genres.includes(trimmed)) {
      setProfile(prev => ({ ...prev, preferred_genres: [...prev.preferred_genres, trimmed] }));
      setGenreInput('');
    }
  };

  const removeGenre = (genre: string) => {
    setProfile(prev => ({ ...prev, preferred_genres: prev.preferred_genres.filter(g => g !== genre) }));
  };

  const updateWork = useCallback((publishedId: string, updater: (work: PublishedScenario) => PublishedScenario) => {
    setWorks((prev) => prev.map((work) => (work.id === publishedId ? updater(work) : work)));
  }, []);

  const handleLikeWork = useCallback(async (published: PublishedScenario) => {
    if (!user) return;

    try {
      const nowLiked = await toggleLike(published.id, user.id);
      setLikes((prev) => {
        const next = new Set(prev);
        if (nowLiked) next.add(published.id);
        else next.delete(published.id);
        return next;
      });
      updateWork(published.id, (work) => ({
        ...work,
        like_count: Math.max(0, work.like_count + (nowLiked ? 1 : -1)),
      }));
      setStats((prev) => ({
        ...prev,
        total_likes: Math.max(0, prev.total_likes + (nowLiked ? 1 : -1)),
      }));
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  }, [updateWork, user]);

  const handleSaveWork = useCallback(async (published: PublishedScenario) => {
    if (!user) return;

    const alreadySaved = saves.has(published.id);

    try {
      if (alreadySaved) {
        await unsaveScenario(published.id, user.id);
      } else {
        await saveScenarioToCollection(published.id, published.scenario_id, user.id);
      }

      setSaves((prev) => {
        const next = new Set(prev);
        if (alreadySaved) next.delete(published.id);
        else next.add(published.id);
        return next;
      });
      updateWork(published.id, (work) => ({
        ...work,
        save_count: Math.max(0, work.save_count + (alreadySaved ? -1 : 1)),
      }));
      setStats((prev) => ({
        ...prev,
        total_saves: Math.max(0, prev.total_saves + (alreadySaved ? -1 : 1)),
      }));
    } catch (error) {
      console.error('Failed to toggle save:', error);
    }
  }, [saves, updateWork, user]);

  const handlePlayWork = useCallback((published: PublishedScenario) => {
    incrementPlayCount(published.id).catch(console.error);
    updateWork(published.id, (work) => ({ ...work, play_count: work.play_count + 1 }));
    setStats((prev) => ({ ...prev, total_plays: prev.total_plays + 1 }));
    onPlayScenario?.(published.scenario_id, published.id);
  }, [onPlayScenario, updateWork]);

  const handleViewDetails = useCallback((published: PublishedScenario) => {
    setSelectedPublished(published);
    setDetailModalOpen(true);

    if (user) {
      recordView(published.id).catch(console.error);
      updateWork(published.id, (work) => ({ ...work, view_count: work.view_count + 1 }));
      setStats((prev) => ({ ...prev, total_views: prev.total_views + 1 }));
    }
  }, [updateWork, user]);

  const liveSelectedWork = selectedPublished
    ? works.find((work) => work.id === selectedPublished.id) || selectedPublished
    : null;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-[rgba(248,250,252,0.3)]">Loading profile...</div>;
  }

  const initials = (profile.display_name || 'U').slice(0, 2).toUpperCase();
  const avatarPos = profile.avatar_position;
  const panelOuterClass =
    "w-full bg-[#2a2a2f] rounded-[24px] overflow-hidden shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]";
  const panelHeaderClass =
    "relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 px-5 py-3 flex items-center shadow-lg";
  const panelBodyClass =
    "p-5 bg-[#2e2e33] rounded-b-[24px] shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]";
  const panelShineClass = "absolute inset-0 z-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40";
  const fieldLabelClass = "text-[10px] font-bold text-zinc-400 uppercase tracking-widest";
  const fieldInputClass =
    "bg-[#1c1c1f] border border-black/35 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-8">
      {/* Hidden file input for avatar upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarUpload}
        disabled={isUploadingAvatar}
      />

      {/* Section 1: Profile Info */}
      <section className={panelOuterClass}>
        <div className={panelHeaderClass}>
          <div className={panelShineClass} style={{ height: '60%' }} />
          <h3 className="relative z-[1] text-white text-xl font-bold tracking-[-0.015em]">Public Profile</h3>
        </div>
        <div className={panelBodyClass}>
          {/* Responsive guardrail: keep avatar + profile details side-by-side from medium widths upward.
              The profile form should shrink first; stacking too early makes the details pane jump under the avatar. */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[288px_minmax(0,1fr)] md:items-start">
            {/* Avatar column */}
            <div className="flex flex-col items-center gap-3 w-full max-w-[288px]">
              <div
                ref={avatarContainerRef}
                className={`relative group w-full aspect-square rounded-2xl shadow-lg select-none ${
                  isRepositioning
                    ? 'ring-4 ring-blue-500 cursor-move overflow-hidden'
                    : profile.avatar_url
                    ? 'border-2 border-[#4a5f7f] overflow-hidden'
                    : ''
                }`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={isRepositioning ? { touchAction: 'none' } : undefined}
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    style={{ objectPosition: `${avatarPos.x}% ${avatarPos.y}%`, pointerEvents: 'none' }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center border-2 border-dashed border-[#4a5f7f] rounded-2xl">
                    <span className="text-3xl font-bold text-zinc-500">{initials}</span>
                  </div>
                )}

                {/* Three-dot menu — top-right of avatar */}
                {profile.avatar_url && !isRepositioning && (
                  <div className="absolute top-2 right-2 z-30">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg transition-colors bg-black/30 hover:bg-black/50 text-white/70 hover:text-white">
                          <Pencil className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setIsRepositioning(true)}>
                          <Move className="w-4 h-4 mr-2" />
                          Reposition image
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}

                {/* Reposition overlay with Done button */}
                {isRepositioning && (
                  <div className="absolute inset-0 z-[18] touch-none cursor-move pointer-events-auto">
                    <button
                      type="button"
                      className="absolute left-2 top-2 rounded-md bg-black/55 border border-white/20 px-2 py-1 text-[9px] font-bold text-white hover:bg-black/70 pointer-events-auto z-20"
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleRepositionToggle();
                      }}
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 w-full">
                <AvatarActionButtons
                  onUploadFromDevice={() => fileInputRef.current?.click()}
                  onSelectFromLibrary={(imageUrl) => uploadAvatarFromUrl(imageUrl)}
                  onGenerateClick={() => setShowAvatarGenModal(true)}
                  isUploading={isUploadingAvatar}
                  isGenerating={isGeneratingAvatar}
                />
              </div>
            </div>

            {/* Form column */}
            <div className="space-y-4 min-w-0">
              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <Checkbox
                  checked={profile.hide_profile_details}
                  onCheckedChange={(checked) => setProfile(prev => ({ ...prev, hide_profile_details: !!checked }))}
                  className="h-4 w-4 rounded-[4px] border border-white/25 bg-[#1c1c1f] text-white data-[state=checked]:border-[#60a5fa] data-[state=checked]:bg-[#3b82f6] data-[state=checked]:text-white"
                />
                <span className="text-sm text-zinc-300">Hide Profile Details</span>
              </label>

              {/* Match Story Builder / Character Builder field pattern: labels sit above inputs, not to the left. */}
              <div className="space-y-1.5 min-w-0">
                <label className={`${fieldLabelClass} block`}>Display Name</label>
                <input
                  type="text"
                  value={profile.display_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                  className={`w-full ${fieldInputClass}`}
                  placeholder="Your display name"
                  maxLength={30}
                />
              </div>

              <div className="space-y-1.5 min-w-0">
                <label className={`${fieldLabelClass} block`}>About Me</label>
                <textarea
                  value={profile.about_me}
                  onChange={(e) => setProfile(prev => ({ ...prev, about_me: e.target.value }))}
                  className={`w-full ${fieldInputClass} resize-none h-24`}
                  placeholder="Tell others about yourself..."
                  maxLength={500}
                />
              </div>

              <div className="space-y-1.5 min-w-0">
                <label className={`${fieldLabelClass} block`}>Preferred Genres</label>
                <div className="space-y-2 min-w-0">
                  {profile.preferred_genres.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.preferred_genres.map((genre) => (
                        <span
                          key={genre}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-blue-400/25 bg-blue-500/20 text-blue-200 text-xs font-bold"
                        >
                          {genre}
                          <button
                            type="button"
                            onClick={() => removeGenre(genre)}
                            className="text-blue-100 hover:text-red-300 transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="text"
                      value={genreInput}
                      onChange={(e) => setGenreInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGenre())}
                      className={`min-w-0 flex-1 ${fieldInputClass}`}
                      placeholder="Add a genre..."
                    />
                    <button
                      type="button"
                      onClick={addGenre}
                      className="inline-flex h-10 shrink-0 items-center justify-center px-4 rounded-xl border-0 bg-[#3c3e47] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] text-[#eaedf1] text-xs font-bold leading-none hover:bg-[#44464f] transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Published Works */}
      <section className={panelOuterClass}>
        <div className={panelHeaderClass}>
          <div className={panelShineClass} style={{ height: '60%' }} />
          <h3 className="relative z-[1] text-white text-xl font-bold tracking-[-0.015em]">Published Works</h3>
        </div>
        <div className={panelBodyClass}>
          <div className="flex items-center flex-wrap gap-x-6 gap-y-2 mb-5">
            <label className="inline-flex items-center gap-2.5 cursor-pointer">
              <Checkbox
                checked={profile.hide_published_works}
                onCheckedChange={(checked) => setProfile(prev => ({ ...prev, hide_published_works: !!checked }))}
                className="h-4 w-4 rounded-[4px] border border-white/25 bg-[#1c1c1f] text-white data-[state=checked]:border-[#60a5fa] data-[state=checked]:bg-[#3b82f6] data-[state=checked]:text-white"
              />
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Hide Published Works</span>
            </label>

            <div className="flex items-center gap-4 ml-auto text-zinc-400">
              {[
                { icon: Heart, value: stats.total_likes, label: 'Likes' },
                { icon: FileText, value: stats.published_count, label: 'Published' },
                { icon: Bookmark, value: stats.total_saves, label: 'Saved' },
                { icon: Eye, value: stats.total_views, label: 'Views' },
                { icon: Play, value: stats.total_plays, label: 'Plays' },
              ].map(({ icon: Icon, value, label }) => (
                <span key={label} className="flex items-center gap-1 text-xs">
                  <Icon className="w-3.5 h-3.5" />
                  <span className="font-bold text-zinc-300">{value}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Works grid */}
          {works.length === 0 ? (
            <div className="rounded-xl border border-white/[0.08] bg-[#1c1c1f] py-10">
              <p className="text-zinc-500 text-sm italic text-center">No published works yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {works.map((work) => (
                <GalleryScenarioCard
                  key={work.id}
                  published={work}
                  isLiked={likes.has(work.id)}
                  isSaved={saves.has(work.id)}
                  onLike={() => handleLikeWork(work)}
                  onSave={() => handleSaveWork(work)}
                  onPlay={() => handlePlayWork(work)}
                  onViewDetails={() => handleViewDetails(work)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {liveSelectedWork && (
        <TooltipProvider>
          <ScenarioDetailModal
            open={detailModalOpen}
            onOpenChange={setDetailModalOpen}
            scenarioId={liveSelectedWork.scenario_id}
            title={liveSelectedWork.scenario?.title || "Untitled"}
            description={liveSelectedWork.scenario?.description || ""}
            coverImage={liveSelectedWork.scenario?.cover_image_url || ""}
            coverImagePosition={liveSelectedWork.scenario?.cover_image_position || { x: 50, y: 50 }}
            tags={liveSelectedWork.tags || []}
            contentThemes={liveSelectedWork.contentThemes}
            likeCount={liveSelectedWork.like_count}
            saveCount={liveSelectedWork.save_count}
            playCount={liveSelectedWork.play_count}
            viewCount={liveSelectedWork.view_count}
            avgRating={liveSelectedWork.avg_rating}
            reviewCount={liveSelectedWork.review_count}
            publisher={liveSelectedWork.publisher}
            publisherId={liveSelectedWork.publisher_id}
            publishedScenarioId={liveSelectedWork.id}
            publishedAt={liveSelectedWork.created_at}
            isLiked={likes.has(liveSelectedWork.id)}
            isSaved={saves.has(liveSelectedWork.id)}
            allowRemix={liveSelectedWork.allow_remix}
            onLike={() => handleLikeWork(liveSelectedWork)}
            onSave={() => handleSaveWork(liveSelectedWork)}
            onPlay={() => handlePlayWork(liveSelectedWork)}
            isPublished={true}
          />
        </TooltipProvider>
      )}

      {/* Avatar Generation Modal */}
      <AvatarGenerationModal
        isOpen={showAvatarGenModal}
        onClose={() => setShowAvatarGenModal(false)}
        onGenerated={handleAvatarGenerated}
        characterName={profile.display_name || 'User'}
        modelId=""
      />
    </div>
  );
};
