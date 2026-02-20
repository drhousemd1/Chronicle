import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Heart, Bookmark, Play, Eye, FileText, Users, ArrowLeft, UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
          id, scenario_id, like_count, play_count,
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
        setWorks(worksRes.data.map((w: any) => ({
          ...w,
          scenario: w.scenarios,
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

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Profile Card */}
        <div className="bg-[#1e1e22] rounded-2xl border border-white/10 p-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar */}
            <div className="w-72 h-72 rounded-2xl overflow-hidden bg-zinc-800 shrink-0">
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

            {/* Info */}
            <div className="flex-grow space-y-4">
              {/* Creator name + follow */}
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-white/40 uppercase tracking-wider w-28 shrink-0 pt-1">Creator</span>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-white text-sm font-semibold">{displayName}</span>
                  {!isOwnProfile && user && (
                    <button
                      onClick={handleToggleFollow}
                      disabled={isToggling}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        isFollowing
                          ? 'bg-white/10 text-white hover:bg-red-500/20 hover:text-red-400'
                          : 'bg-[#4a5f7f] text-white hover:bg-[#5a6f8f]'
                      }`}
                    >
                      {isFollowing ? <UserMinus className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                  )}
                </div>
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

        {/* Stats */}
        {stats && (
          <div className="bg-[#1e1e22] rounded-2xl border border-white/10 p-6">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
              {[
                { label: 'Published', value: stats.published_count, icon: FileText },
                { label: 'Likes', value: stats.total_likes, icon: Heart },
                { label: 'Saves', value: stats.total_saves, icon: Bookmark },
                { label: 'Views', value: stats.total_views, icon: Eye },
                { label: 'Plays', value: stats.total_plays, icon: Play },
                { label: 'Followers', value: stats.follower_count, icon: Users },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="text-center">
                  <Icon className="w-4 h-4 text-white/30 mx-auto mb-1" />
                  <div className="text-xl font-black text-white">{value}</div>
                  <div className="text-[10px] font-bold text-white/40 uppercase">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Published Works */}
        {!profile.hide_published_works && (
          <div>
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Published Works</h3>
            {works.length === 0 ? (
              <p className="text-white/30 text-sm italic">No published works yet</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {works.map(work => (
                  <div key={work.id} className="group cursor-pointer" onClick={() => navigate('/')}>
                    <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#2a2a2f] relative">
                      {work.scenario?.cover_image_url ? (
                        <img
                          src={work.scenario.cover_image_url}
                          alt={work.scenario.title}
                          style={{
                            objectPosition: `${work.scenario.cover_image_position?.x || 50}% ${work.scenario.cover_image_position?.y || 50}%`,
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20 text-4xl font-black">
                          {work.scenario?.title?.charAt(0) || '?'}
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <p className="text-white text-sm font-bold truncate">{work.scenario?.title || 'Untitled'}</p>
                        <div className="flex items-center gap-3 mt-1 text-white/50 text-[10px]">
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{work.like_count}</span>
                          <span className="flex items-center gap-1"><Play className="w-3 h-3" />{work.play_count}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
