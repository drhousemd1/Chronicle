import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Camera, Eye, Heart, Bookmark, Play, FileText, Users } from 'lucide-react';
import { resizeImage } from '@/utils';

interface PublicProfileTabProps {
  user: { id: string; email?: string } | null;
}

interface ProfileData {
  display_name: string;
  about_me: string;
  avatar_url: string;
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

export const PublicProfileTab: React.FC<PublicProfileTabProps> = ({ user }) => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData>({
    display_name: '',
    about_me: '',
    avatar_url: '',
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
    follower_count: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [genreInput, setGenreInput] = useState('');

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('profiles').select('display_name, about_me, avatar_url, preferred_genres, hide_published_works, hide_profile_details').eq('id', user.id).maybeSingle(),
      supabase.rpc('get_creator_stats', { creator_user_id: user.id }),
    ]).then(([profileRes, statsRes]) => {
      if (profileRes.data) {
        setProfile({
          display_name: profileRes.data.display_name || '',
          about_me: profileRes.data.about_me || '',
          avatar_url: profileRes.data.avatar_url || '',
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
          follower_count: Number(s.follower_count) || 0,
        });
      }
      setIsLoading(false);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        display_name: profile.display_name,
        about_me: profile.about_me,
        preferred_genres: profile.preferred_genres,
        hide_published_works: profile.hide_published_works,
        hide_profile_details: profile.hide_profile_details,
      }).eq('id', user.id);
      if (error) throw error;
      toast({ title: 'Profile saved', description: 'Your public profile has been updated.' });
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
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
          setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
          toast({ title: 'Avatar updated' });
        } catch (err: any) {
          toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
        } finally {
          setIsUploadingAvatar(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
      setIsUploadingAvatar(false);
    }
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

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-white/50">Loading profile...</div>;
  }

  const initials = (profile.display_name || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Avatar + Display Name */}
      <div className="bg-[#1e1e22] rounded-2xl border border-white/10 p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative group">
            <Avatar className="h-24 w-24 ring-2 ring-white/10">
              {profile.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
              ) : null}
              <AvatarFallback className="bg-[#4a5f7f] text-white text-2xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-6 h-6 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
            </label>
          </div>

          {/* Name */}
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Display Name</label>
              <input
                type="text"
                value={profile.display_name}
                onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                className="w-full bg-[#2a2a2f] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4a5f7f]"
                placeholder="Your display name"
                maxLength={30}
              />
            </div>
          </div>
        </div>
      </div>

      {/* About Me */}
      <div className="bg-[#1e1e22] rounded-2xl border border-white/10 p-6">
        <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">About Me</label>
        <textarea
          value={profile.about_me}
          onChange={(e) => setProfile(prev => ({ ...prev, about_me: e.target.value }))}
          className="w-full bg-[#2a2a2f] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4a5f7f] resize-none h-32"
          placeholder="Tell others about yourself..."
          maxLength={500}
        />
      </div>

      {/* Preferred Genres */}
      <div className="bg-[#1e1e22] rounded-2xl border border-white/10 p-6">
        <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Preferred Genres</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {profile.preferred_genres.map(genre => (
            <span key={genre} className="px-3 py-1.5 bg-[#4a5f7f]/20 text-[#7ba3d4] rounded-lg text-xs font-bold flex items-center gap-1.5">
              {genre}
              <button onClick={() => removeGenre(genre)} className="hover:text-red-400 transition-colors">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={genreInput}
            onChange={(e) => setGenreInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGenre())}
            className="flex-1 bg-[#2a2a2f] border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4a5f7f]"
            placeholder="Add a genre..."
          />
          <button onClick={addGenre} className="px-4 py-2 bg-[#4a5f7f] hover:bg-[#5a6f8f] text-white rounded-xl text-sm font-semibold transition-colors">
            Add
          </button>
        </div>
      </div>

      {/* Privacy Toggles */}
      <div className="bg-[#1e1e22] rounded-2xl border border-white/10 p-6 space-y-4">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Privacy Settings</h3>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={profile.hide_published_works}
            onChange={(e) => setProfile(prev => ({ ...prev, hide_published_works: e.target.checked }))}
            className="mt-0.5 rounded border-white/20 bg-[#2a2a2f] text-[#4a5f7f] focus:ring-[#4a5f7f]"
          />
          <div>
            <span className="text-sm text-white font-medium">Hide Published Works</span>
            <p className="text-xs text-white/40 mt-0.5">Your published works won't be visible on your profile page</p>
          </div>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={profile.hide_profile_details}
            onChange={(e) => setProfile(prev => ({ ...prev, hide_profile_details: e.target.checked }))}
            className="mt-0.5 rounded border-white/20 bg-[#2a2a2f] text-[#4a5f7f] focus:ring-[#4a5f7f]"
          />
          <div>
            <span className="text-sm text-white font-medium">Hide Profile Details</span>
            <p className="text-xs text-white/40 mt-0.5">Works published while this is checked will show as anonymous and won't link to your profile</p>
          </div>
        </label>
      </div>

      {/* Creator Stats */}
      <div className="bg-[#1e1e22] rounded-2xl border border-white/10 p-6">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Creator Stats</h3>
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

      {/* Save Button */}
      <div className="flex justify-end pb-8">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-8 py-3 bg-[#4a5f7f] hover:bg-[#5a6f8f] text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
};
