import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Heart, Bookmark, Play, Eye, FileText, Users, ArrowLeft, UserPlus, UserMinus, Loader2, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CreatorProfileData {
  display_name: string | null;
  avatar_url: string | null;
  avatar_position: { x: number; y: number } | null;
  about_me: string | null;
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
  follower_count: number;
}

interface PublishedWork {
  id: string;
  scenario_id: string;
  like_count: number;
  play_count: number;
  view_count: number;
  save_count: number;
  allow_remix: boolean;
  storyType?: string | null;
  scenario: {
    title: string;
    description: string | null;
    cover_image_url: string | null;
    cover_image_position: { x: number; y: number } | null;
  } | null;
}

export default function CreatorProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<CreatorProfileData | null>(null);
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [works, setWorks] = useState<PublishedWork[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);

    const loadData = async () => {
      const [profileRes, statsRes, worksRes] = await Promise.all([
        supabase.from('profiles').select('display_name, avatar_url, avatar_position, about_me, preferred_genres, hide_published_works, hide_profile_details').eq('id', userId).maybeSingle(),
        supabase.rpc('get_creator_stats', { creator_user_id: userId }),
        supabase.from('published_scenarios').select(`
          id, scenario_id, like_count, play_count, view_count, save_count, allow_remix,
          scenarios!inner (title, description, cover_image_url, cover_image_position)
        `).eq('publisher_id', userId).eq('is_published', true).eq('is_hidden', false).order('created_at', { ascending: false }),
      ]);

      if (profileRes.data) {
        const d = profileRes.data as any;
        setProfile({
          ...d,
          avatar_position: d.avatar_position ? (typeof d.avatar_position === 'string' ? JSON.parse(d.avatar_position) : d.avatar_position) : { x: 50, y: 50 },
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
          follower_count: Number(s.follower_count) || 0,
        });
      }
      if (worksRes.data) {
        const scenarioIds = worksRes.data.map((w: any) => w.scenario_id);
        const { data: themesData } = await supabase
          .from('content_themes')
          .select('scenario_id, story_type')
          .in('scenario_id', scenarioIds);
        const themesMap = new Map((themesData || []).map((t: any) => [t.scenario_id, t.story_type]));
        setWorks(worksRes.data.map((w: any) => ({
          ...w,
          scenario: w.scenarios,
          storyType: themesMap.get(w.scenario_id) || null,
        })));
      }

      if (user) {
        const { data: followData } = await supabase.from('creator_follows')
          .select('id').eq('follower_id', user.id).eq('creator_id', userId).maybeSingle();
        setIsFollowing(!!followData);
      }

      setIsLoading(false);
    };

    loadData();
  }, [userId, user]);

  const handleToggleFollow = async () => {
    if (!user || !userId || user.id === userId) return;
    setIsToggling(true);
    try {
      if (isFollowing) {
        await supabase.from('creator_follows').delete().eq('follower_id', user.id).eq('creator_id', userId);
        setIsFollowing(false);
        setStats(prev => prev ? { ...prev, follower_count: Math.max(0, prev.follower_count - 1) } : prev);
        toast({ title: 'Unfollowed' });
      } else {
        await supabase.from('creator_follows').insert({ follower_id: user.id, creator_id: userId });
        setIsFollowing(true);
        setStats(prev => prev ? { ...prev, follower_count: prev.follower_count + 1 } : prev);
        toast({ title: 'Following creator' });
      }
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121214] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/30" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#121214] flex flex-col items-center justify-center text-white">
        <h2 className="text-2xl font-bold mb-2">Profile not found</h2>
        <button onClick={() => navigate(-1)} className="text-[#7ba3d4] hover:underline mt-4">Go back</button>
      </div>
    );
  }

  if (profile.hide_profile_details) {
    return (
      <div className="min-h-screen bg-[#121214] flex flex-col items-center justify-center text-white">
        <h2 className="text-2xl font-bold mb-2">This profile is private</h2>
        <button onClick={() => navigate(-1)} className="text-[#7ba3d4] hover:underline mt-4">Go back</button>
      </div>
    );
  }

  const displayName = profile.display_name || 'Anonymous';
  const initials = displayName.slice(0, 2).toUpperCase();
  const isOwnProfile = user?.id === userId;
  const avatarPos = profile.avatar_position || { x: 50, y: 50 };

  return (
    <div className="min-h-screen bg-[#121214] text-white">
      {/* Header bar */}
      <header className="sticky top-0 z-50 h-16 bg-white border-b border-slate-200 flex items-center px-6 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors mr-3">
          <ArrowLeft className="w-5 h-5 text-slate-900" />
        </button>
        <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">Creator Profile</h1>
      </header>

      <div className="px-6 py-10 space-y-6">
        {/* Profile Card — mirrors PublicProfileTab Section 1 */}
        <div className="bg-[#1e1e22] rounded-2xl border border-white/10 p-6">
          <div className="flex gap-6">
            {/* Avatar column — same w-72 as PublicProfileTab */}
            <div className="flex-shrink-0 flex flex-col items-center gap-3 w-72">
              {/* Square avatar */}
              <div className="w-72 h-72 rounded-2xl overflow-hidden border-2 border-dashed border-zinc-600 bg-zinc-800">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    style={{ objectPosition: `${avatarPos.x}% ${avatarPos.y}%` }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/40 text-5xl font-black">
                    {initials}
                  </div>
                )}
              </div>

              {/* Follow button — centered below avatar, same position as Upload/AI Generate in PublicProfileTab */}
              {!isOwnProfile && user && (
                <div className="flex flex-col gap-2 w-full">
                  <button
                    onClick={handleToggleFollow}
                    disabled={isToggling}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                      isFollowing
                        ? 'bg-white/10 text-white hover:bg-red-500/20 hover:text-red-400'
                        : 'bg-[#4a5f7f] text-white hover:bg-[#5a6f8f]'
                    )}
                  >
                    {isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </button>
                </div>
              )}
            </div>

            {/* Info column — matches PublicProfileTab form column layout */}
            <div className="flex-1 space-y-4 min-w-0">
              {/* Display Name */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white/40 uppercase tracking-wider w-28 shrink-0">Creator</span>
                <span className="text-white text-sm font-semibold">{displayName}</span>
              </div>

              {/* About Me */}
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-white/40 uppercase tracking-wider w-28 shrink-0 pt-1">About Me</span>
                <p className="text-white text-sm leading-relaxed">{profile.about_me || 'No bio yet'}</p>
              </div>

              {/* Preferred Genres */}
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-white/40 uppercase tracking-wider w-28 shrink-0 pt-1">Preferred Genres</span>
                <div className="flex flex-wrap gap-2">
                  {profile.preferred_genres?.length > 0 ? (
                    profile.preferred_genres.map(g => (
                      <span key={g} className="px-3 py-1 bg-[#4a5f7f]/20 text-[#7ba3d4] rounded-lg text-xs font-bold">{g}</span>
                    ))
                  ) : (
                    <span className="text-white/30 text-sm italic">None set</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Published Works — mirrors PublicProfileTab Section 2 exactly */}
        {!profile.hide_published_works && (
          <div className="bg-[#1e1e22] rounded-2xl border border-white/10 p-6">
            {/* Header row — same as PublicProfileTab lines 427-452 */}
            <div className="flex items-center flex-wrap gap-x-6 gap-y-2 mb-5">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Published Works</h3>

              {/* Stats inline, right-aligned — matching PublicProfileTab */}
              <div className="flex items-center gap-4 ml-auto text-white/40">
                {[
                  { icon: Heart, value: stats?.total_likes ?? 0, label: 'Likes' },
                  { icon: FileText, value: stats?.published_count ?? 0, label: 'Published' },
                  { icon: Bookmark, value: stats?.total_saves ?? 0, label: 'Saved' },
                  { icon: Eye, value: stats?.total_views ?? 0, label: 'Views' },
                  { icon: Play, value: stats?.total_plays ?? 0, label: 'Plays' },
                  { icon: Users, value: stats?.follower_count ?? 0, label: 'Followers' },
                ].map(({ icon: Icon, value, label }) => (
                  <span key={label} className="flex items-center gap-1 text-xs">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="font-bold text-white/60">{value}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Works grid — identical to PublicProfileTab */}
            {works.length === 0 ? (
              <p className="text-white/30 text-sm italic py-8 text-center">No published works yet</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {works.map(work => {
                  const coverPosition = work.scenario?.cover_image_position || { x: 50, y: 50 };
                  return (
                    <div key={work.id} className="group relative">
                      <div className="aspect-[2/3] w-full overflow-hidden rounded-[2rem] bg-slate-200 shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50)] transition-all duration-300 group-hover:-translate-y-3 group-hover:shadow-2xl border border-[#4a5f7f] relative">
                        {/* Cover Image */}
                        {work.scenario?.cover_image_url ? (
                          <img
                            src={work.scenario.cover_image_url}
                            alt={work.scenario.title}
                            style={{ objectPosition: `${coverPosition.x}% ${coverPosition.y}%` }}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-10 text-center">
                            <div className="font-black text-white/10 text-6xl uppercase tracking-tighter italic break-words p-4 text-center">
                              {work.scenario?.title?.charAt(0) || '?'}
                            </div>
                          </div>
                        )}

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />

                        {/* SFW/NSFW Badge */}
                        {work.storyType && (
                          <div className={cn(
                            "absolute top-4 right-4 px-2.5 py-1 backdrop-blur-sm rounded-lg text-xs font-bold shadow-lg bg-[#2a2a2f]",
                            work.storyType === 'NSFW' ? "text-red-400" : "text-blue-400"
                          )}>
                            {work.storyType}
                          </div>
                        )}

                        {/* Remix badge */}
                        {work.allow_remix && (
                          <div className="absolute top-4 left-4 p-1.5 backdrop-blur-sm rounded-lg shadow-lg bg-[#2a2a2f]">
                            <Pencil className="w-4 h-4 text-purple-400" />
                          </div>
                        )}

                        {/* Bottom Info */}
                        <div className="absolute inset-x-0 bottom-0 p-4 pb-5 pointer-events-none flex flex-col">
                          <h3 className="text-lg font-black text-white leading-tight tracking-tight truncate">
                            {work.scenario?.title || 'Untitled Story'}
                          </h3>
                          <p className="text-xs text-white/60 line-clamp-2 leading-relaxed italic min-h-[2.5rem]">
                            {work.scenario?.description || 'No description provided.'}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] text-white/50 mt-1">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {work.view_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              {work.like_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <Bookmark className="w-3 h-3" />
                              {work.save_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <Play className="w-3 h-3" />
                              {work.play_count}
                            </span>
                          </div>
                          <span className="text-[11px] text-white/50 font-medium mt-1">
                            Written by: {displayName}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
