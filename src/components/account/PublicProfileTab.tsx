import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Heart, Bookmark, Play, FileText, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resizeImage } from '@/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { AvatarActionButtons } from '@/components/chronicle/AvatarActionButtons';
import { AvatarGenerationModal } from '@/components/chronicle/AvatarGenerationModal';

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

export const PublicProfileTab: React.FC<PublicProfileTabProps> = ({ user }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  });
  const [works, setWorks] = useState<PublishedWork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [showAvatarGenModal, setShowAvatarGenModal] = useState(false);
  const [genreInput, setGenreInput] = useState('');

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('profiles').select('display_name, about_me, avatar_url, preferred_genres, hide_published_works, hide_profile_details').eq('id', user.id).maybeSingle(),
      supabase.rpc('get_creator_stats', { creator_user_id: user.id }),
      supabase.from('published_scenarios').select(`
        id, scenario_id, like_count, play_count, view_count, save_count, allow_remix,
        scenarios!inner (title, description, cover_image_url, cover_image_position)
      `).eq('publisher_id', user.id).eq('is_published', true).eq('is_hidden', false).order('created_at', { ascending: false }),
    ]).then(async ([profileRes, statsRes, worksRes]) => {
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
    } catch (e: any) {
      console.error('Save failed:', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const uploadAvatarFromUrl = async (imageUrl: string) => {
    if (!user) return;
    setIsUploadingAvatar(true);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const filename = `${user.id}/avatar-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filename, blob, { upsert: true, contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filename);
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      if (updateError) throw updateError;
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
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
          setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
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

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-white/50">Loading profile...</div>;
  }

  const initials = (profile.display_name || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
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
      <div className="bg-[#1e1e22] rounded-2xl border border-white/10 p-6">
        <div className="flex gap-6">
          {/* Avatar column */}
          <div className="flex-shrink-0 flex flex-col items-center gap-3">
            {/* Square avatar matching character builder style */}
            <div className="w-48 h-48 rounded-2xl overflow-hidden shadow-lg flex items-center justify-center border-2 border-dashed border-zinc-600 bg-zinc-800">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-zinc-500">{initials}</span>
              )}
            </div>

            {/* Upload + AI Generate buttons */}
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
          <div className="flex-1 space-y-4 min-w-0">
            {/* Hide Profile Details */}
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={profile.hide_profile_details}
                onCheckedChange={(checked) => setProfile(prev => ({ ...prev, hide_profile_details: !!checked }))}
              />
              <span className="text-sm text-white/70">Hide Profile Details</span>
            </label>

            {/* Display Name */}
            <div className="flex items-center gap-4">
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider w-32 shrink-0">Display Name</label>
              <input
                type="text"
                value={profile.display_name}
                onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                className="flex-1 bg-[#2a2a2f] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4a5f7f]"
                placeholder="Your display name"
                maxLength={30}
              />
            </div>

            {/* About Me */}
            <div className="flex items-start gap-4">
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider w-32 shrink-0 pt-2.5">About Me</label>
              <textarea
                value={profile.about_me}
                onChange={(e) => setProfile(prev => ({ ...prev, about_me: e.target.value }))}
                className="flex-1 bg-[#2a2a2f] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4a5f7f] resize-none h-20"
                placeholder="Tell others about yourself..."
                maxLength={500}
              />
            </div>

            {/* Preferred Genres */}
            <div className="flex items-start gap-4">
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider w-32 shrink-0 pt-2.5">Preferred Genres</label>
              <div className="flex-1 space-y-2">
                {profile.preferred_genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.preferred_genres.map(genre => (
                      <span key={genre} className="px-2.5 py-1 bg-[#4a5f7f]/20 text-[#7ba3d4] rounded-lg text-xs font-bold flex items-center gap-1">
                        {genre}
                        <button onClick={() => removeGenre(genre)} className="hover:text-red-400 transition-colors">×</button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={genreInput}
                    onChange={(e) => setGenreInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGenre())}
                    className="flex-1 bg-[#2a2a2f] border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4a5f7f]"
                    placeholder="Add a genre..."
                  />
                  <button onClick={addGenre} className="px-3 py-2 bg-[#4a5f7f] hover:bg-[#5a6f8f] text-white rounded-xl text-sm font-semibold transition-colors">
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Published Works */}
      <div className="bg-[#1e1e22] rounded-2xl border border-white/10 p-6">
        {/* Header row */}
        <div className="flex items-center flex-wrap gap-x-6 gap-y-2 mb-5">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">Published Works</h3>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={profile.hide_published_works}
              onCheckedChange={(checked) => setProfile(prev => ({ ...prev, hide_published_works: !!checked }))}
            />
            <span className="text-xs text-white/50">Hide Published Works</span>
          </label>

          <div className="flex items-center gap-4 ml-auto text-white/40">
            {[
              { icon: Heart, value: stats.total_likes, label: 'Likes' },
              { icon: FileText, value: stats.published_count, label: 'Published' },
              { icon: Bookmark, value: stats.total_saves, label: 'Saved' },
              { icon: Eye, value: stats.total_views, label: 'Views' },
              { icon: Play, value: stats.total_plays, label: 'Plays' },
            ].map(({ icon: Icon, value, label }) => (
              <span key={label} className="flex items-center gap-1 text-xs">
                <Icon className="w-3.5 h-3.5" />
                <span className="font-bold text-white/60">{value}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Works grid */}
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

                    {/* Remix/Edit badge */}
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
                        Written by: {profile.display_name || 'Anonymous'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
