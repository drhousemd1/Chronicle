import React, { useState, useEffect } from 'react';
import { User, Settings, LogOut, UserCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

interface AccountButtonProps {
  user: { id: string; email?: string } | null;
  onNavigateToAccount: (tab?: string) => void;
  onSignOut: () => void;
}

export const AccountButton: React.FC<AccountButtonProps> = ({
  user,
  onNavigateToAccount,
  onSignOut,
}) => {
  const [profile, setProfile] = useState<{
    display_name: string | null;
    avatar_url: string | null;
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile(data);
      });
  }, [user]);

  if (!user) return null;

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl border border-[hsl(var(--ui-border))] bg-[hsl(var(--ui-surface-2))] shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:bg-white/5 active:bg-white/10 transition-all active:scale-95 px-2 py-1.5"
        >
          <Avatar className="h-7 w-7">
            {profile?.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt={displayName} />
            ) : null}
            <AvatarFallback className="bg-[#4a5f7f] text-white text-[10px] font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-[10px] font-bold text-[hsl(var(--ui-text))] uppercase tracking-wider hidden sm:block max-w-[80px] truncate">
            {displayName}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onNavigateToAccount('profile')} className="cursor-pointer">
          <UserCircle className="w-4 h-4 mr-2" />
          Public Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onNavigateToAccount('settings')} className="cursor-pointer">
          <Settings className="w-4 h-4 mr-2" />
          Account Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut} className="cursor-pointer text-red-500 focus:text-red-500">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
