import React from "react";
import { TabKey } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  Image as ImageIcon,
  LogIn,
  LogOut,
  PanelLeft,
  PanelLeftClose,
  Settings,
  UserCircle,
} from "lucide-react";

type AppShellTab = TabKey | "library";

interface SidebarItemProps {
  active: boolean;
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  subtitle?: string;
  className?: string;
  collapsed?: boolean;
}

interface AppSidebarProps {
  tab: AppShellTab;
  sidebarCollapsed: boolean;
  hasActiveStory: boolean;
  activeStoryTitle?: string | null;
  isAdminState: boolean;
  isAuthenticated: boolean;
  userEmail?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  userMenuOpen: boolean;
  onToggleSidebar: () => void;
  onSelectGallery: () => void;
  onSelectHub: () => void;
  onSelectLibrary: () => void;
  onSelectImageLibrary: () => void;
  onSelectConversations: () => void;
  onSelectStoryBuilder: () => void;
  onSelectAdmin: () => void;
  onToggleUserMenu: () => void;
  onSelectPublicProfile: () => void;
  onSelectAccountSettings: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

const SidebarIcons = {
  Gallery: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  ),
  Hub: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  ),
  Library: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 6 4 14" />
      <path d="M12 6v14" />
      <path d="M8 8v12" />
      <path d="M4 4v16" />
    </svg>
  ),
  ImageLibrary: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  ),
  Chat: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Builder: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
} satisfies Record<string, React.ComponentType>;

function SidebarItem({
  active,
  label,
  onClick,
  icon,
  subtitle,
  className = "",
  collapsed = false,
}: SidebarItemProps) {
  const activeClasses = active
    ? "bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 shadow-lg shadow-black/40 text-white"
    : "text-slate-400 hover:bg-ghost-white hover:text-white hover:shadow-md hover:shadow-black/20";

  const content = (
    <button
      type="button"
      onClick={onClick}
      className={`relative overflow-hidden w-full flex flex-col rounded-xl transition-all duration-200 font-bold text-sm mb-1 cursor-pointer group border border-transparent ${activeClasses} ${className} ${collapsed ? "px-3 py-3 items-center justify-center" : "px-4 py-3"}`}
    >
      {active && (
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.07] via-transparent to-transparent pointer-events-none" style={{ backgroundSize: "100% 60%", backgroundRepeat: "no-repeat" }} />
      )}
      <div className={`relative z-[1] flex items-center ${collapsed ? "justify-center" : "gap-3 w-full"}`}>
        <span className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">{icon}</span>
        {!collapsed && <span className="truncate">{label}</span>}
      </div>
      {!collapsed && subtitle && (
        <div className={`relative z-[1] text-[10px] font-black tracking-wide uppercase mt-1 ml-8 text-left transition-colors duration-200 truncate ${active ? "text-blue-200 opacity-100" : "text-slate-600 opacity-70 group-hover:text-slate-400"}`}>
          {subtitle}
        </div>
      )}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="font-semibold">
          {label}
          {subtitle && <span className="block text-xs text-muted-foreground">{subtitle}</span>}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

export function AppSidebar({
  tab,
  sidebarCollapsed,
  hasActiveStory,
  activeStoryTitle,
  isAdminState,
  isAuthenticated,
  userEmail,
  displayName,
  avatarUrl,
  userMenuOpen,
  onToggleSidebar,
  onSelectGallery,
  onSelectHub,
  onSelectLibrary,
  onSelectImageLibrary,
  onSelectConversations,
  onSelectStoryBuilder,
  onSelectAdmin,
  onToggleUserMenu,
  onSelectPublicProfile,
  onSelectAccountSettings,
  onSignIn,
  onSignOut,
}: AppSidebarProps) {
  const resolvedDisplayName = displayName || userEmail?.split("@")[0] || "User";
  const initials = resolvedDisplayName.slice(0, 2).toUpperCase();

  return (
    <aside className={`flex-shrink-0 bg-[#1a1a1a] flex flex-col border-r border-black shadow-2xl z-50 transition-all duration-300 ${sidebarCollapsed ? "w-[72px]" : "w-[280px]"}`}>
      <div className={`py-8 ${sidebarCollapsed ? "px-4" : "px-8"} transition-all duration-300`}>
        <div className={`flex ${sidebarCollapsed ? "flex-col items-center gap-3" : "items-center justify-between"}`}>
          <div className={`flex items-center ${sidebarCollapsed ? "justify-center" : "gap-4"}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-t border-white/20 flex items-center justify-center text-white font-black text-2xl italic shadow-xl shadow-[#4a5f7f]/30 flex-shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/[0.07] via-transparent to-transparent pointer-events-none" />
              <span className="relative z-[1]">C</span>
            </div>
            {!sidebarCollapsed && (
              <div className="font-black uppercase tracking-tighter text-2xl leading-none text-white whitespace-nowrap overflow-hidden">Chronicle</div>
            )}
          </div>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button onClick={onToggleSidebar} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-ghost-white transition-colors">
                {sidebarCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <nav className={`flex-1 overflow-y-auto pb-4 mt-4 space-y-1 ${sidebarCollapsed ? "px-2" : "px-4"}`}>
        <SidebarItem active={tab === "gallery"} label="Community Gallery" icon={<SidebarIcons.Gallery />} onClick={onSelectGallery} collapsed={sidebarCollapsed} />
        <SidebarItem active={tab === "hub"} label="My Stories" icon={<SidebarIcons.Hub />} onClick={onSelectHub} collapsed={sidebarCollapsed} />
        <SidebarItem active={tab === "library"} label="Character Library" icon={<SidebarIcons.Library />} onClick={onSelectLibrary} collapsed={sidebarCollapsed} />
        <SidebarItem active={tab === "image_library"} label="Image Library" icon={<SidebarIcons.ImageLibrary />} onClick={onSelectImageLibrary} collapsed={sidebarCollapsed} />
        <SidebarItem active={tab === "conversations"} label="Chat History" icon={<SidebarIcons.Chat />} onClick={onSelectConversations} collapsed={sidebarCollapsed} />
        <SidebarItem
          active={tab === "world" || tab === "characters"}
          label="Story Builder"
          subtitle={hasActiveStory ? activeStoryTitle || "Unsaved Draft" : undefined}
          icon={<SidebarIcons.Builder />}
          onClick={onSelectStoryBuilder}
          className={!hasActiveStory ? "opacity-80" : ""}
          collapsed={sidebarCollapsed}
        />

        {isAdminState && (
          <div className="pt-4 mt-4 border-t border-ghost-white">
            <SidebarItem active={tab === "admin"} label="Admin" icon={<Settings className="w-5 h-5" />} onClick={onSelectAdmin} collapsed={sidebarCollapsed} />
          </div>
        )}

        <div className="pt-4 mt-4 border-t border-ghost-white">
          {isAuthenticated ? (
            <div>
              <button
                type="button"
                onClick={onToggleUserMenu}
                className={cn(
                  "flex items-center gap-3 w-full rounded-xl px-2 py-2 hover:bg-ghost-white active:bg-ghost-white transition-all text-left",
                  sidebarCollapsed && "justify-center px-0",
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  {avatarUrl ? <AvatarImage src={avatarUrl} alt={resolvedDisplayName} /> : null}
                  <AvatarFallback className="bg-[#4a5f7f] text-white text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {!sidebarCollapsed && (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">{resolvedDisplayName}</p>
                      <p className="text-xs text-white/30 truncate">{userEmail}</p>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-white/30 shrink-0 transition-transform duration-200", userMenuOpen && "rotate-180")} />
                  </>
                )}
              </button>
              {userMenuOpen && (
                <div className={cn("flex flex-col gap-0.5 mt-1", !sidebarCollapsed && "pl-4")}>
                  <button
                    type="button"
                    onClick={onSelectPublicProfile}
                    className={cn(
                      "flex items-center gap-2 w-full rounded-lg px-2 py-1.5 hover:bg-ghost-white transition-colors text-white/70 hover:text-white text-sm font-bold",
                      sidebarCollapsed && "justify-center px-0",
                    )}
                  >
                    <UserCircle className="w-4 h-4 shrink-0" />
                    {!sidebarCollapsed && <span>Public Profile</span>}
                  </button>
                  <button
                    type="button"
                    onClick={onSelectAccountSettings}
                    className={cn(
                      "flex items-center gap-2 w-full rounded-lg px-2 py-1.5 hover:bg-ghost-white transition-colors text-white/70 hover:text-white text-sm font-bold",
                      sidebarCollapsed && "justify-center px-0",
                    )}
                  >
                    <Settings className="w-4 h-4 shrink-0" />
                    {!sidebarCollapsed && <span>Account Settings</span>}
                  </button>
                  <button
                    type="button"
                    onClick={onSignOut}
                    className={cn(
                      "flex items-center gap-2 w-full rounded-lg px-2 py-1.5 hover:bg-ghost-white transition-colors text-red-500 text-sm font-bold",
                      sidebarCollapsed && "justify-center px-0",
                    )}
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    {!sidebarCollapsed && <span>Sign Out</span>}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className={cn(
                "flex items-center gap-3 w-full rounded-xl px-2 py-2 hover:bg-ghost-white active:bg-ghost-white transition-all text-[#4a5f7f]",
                sidebarCollapsed && "justify-center px-0",
              )}
            >
              <LogIn className="w-5 h-5 shrink-0" />
              {!sidebarCollapsed && <span className="text-sm font-bold">Sign In</span>}
            </button>
          )}
        </div>
      </nav>
    </aside>
  );
}
