import React from "react";
import { TabKey } from "@/types";
import { cn } from "@/lib/utils";
import { GalleryNsfwToggle } from "@/components/chronicle/GalleryNsfwToggle";
import { AppShellHeader } from "@/components/app-shell/AppShellHeader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LabeledToggle } from "@/components/ui/labeled-toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Download,
  Image as ImageIcon,
  Moon,
  Pencil,
  Settings,
  Sparkles,
  Sun,
  Upload,
} from "lucide-react";

type AppShellTab = TabKey | "library";

interface SegmentedOption {
  key: string;
  label: string;
}

interface LibraryHeaderConfig {
  selectedCharacterId: string | null;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onBack: () => void;
}

interface BuilderHeaderConfig {
  activeTab: "world" | "characters";
  onBack: () => void;
}

interface HubHeaderConfig {
  activeFilter: string;
  options: SegmentedOption[];
  onFilterChange: (value: string) => void;
  onOpenBackgroundModal: () => void;
}

interface GalleryHeaderConfig {
  activeSort: string;
  options: SegmentedOption[];
  onSortChange: (value: string) => void;
  showNsfw: boolean;
  onToggleNsfw: (checked: boolean) => void;
}

interface ImageLibraryHeaderConfig {
  isInFolder: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onExitFolder: () => void;
  onUploadImages: () => void;
  onOpenBackgroundModal: () => void;
}

interface AdminHeaderConfig {
  activeTool: string;
  guideTheme: "dark" | "light";
  styleGuideEditsCount: number;
  onBackToHub: () => void;
  onToggleGuideTheme: () => void;
  onGuideSave: () => void;
  onGuideSyncAll: () => void;
  onOpenStyleGuideEdits: () => void;
  onDownloadStyleGuide: () => void;
}

interface AccountHeaderConfig {
  activeTab: string;
  isSavingProfile: boolean;
  onBack: () => void;
  onSaveProfile: () => void;
}

interface ConversationHeaderConfig {
  hasConversations: boolean;
  onDeleteAll: () => void;
}

interface StoryTransferNoticeConfig {
  tone: "success" | "error" | "info";
  text: string;
  warningDetails: string[];
}

interface StoryBuilderHeaderConfig {
  canInteract: boolean;
  isSaving: boolean;
  isSavingAndClosing: boolean;
  isAdminState: boolean;
  apiUsageTrackingStatusText: string;
  isApiUsageTrackingCurrentStory: boolean;
  isApiUsageToggleBusy: boolean;
  storyTransferNotice: StoryTransferNoticeConfig | null;
  onOpenImport: () => void;
  onOpenExport: () => void;
  onFinalizeAndClose: () => void;
  onSaveDraft: () => void;
  onToggleApiUsageTracking: (checked: boolean) => void;
}

interface CharacterEditorHeaderConfig {
  selectedCharacterId: string | null;
  isLibraryTab: boolean;
  isAiFilling: boolean;
  isSaving: boolean;
  isSavingAndClosing: boolean;
  isSavingToLibrary: boolean;
  selectedCharacterIsInLibrary: boolean;
  onOpenAiFill: () => void;
  onSave: () => void;
  onCancel: () => void;
  onSaveToLibrary: () => void;
  onOpenCharacterPicker: () => void;
  onCreateCharacter: () => void;
}

interface AppShellTopBarProps {
  tab: AppShellTab;
  library?: LibraryHeaderConfig;
  builder?: BuilderHeaderConfig;
  hub?: HubHeaderConfig;
  gallery?: GalleryHeaderConfig;
  imageLibrary?: ImageLibraryHeaderConfig;
  admin?: AdminHeaderConfig;
  account?: AccountHeaderConfig;
  conversations?: ConversationHeaderConfig;
  storyBuilder?: StoryBuilderHeaderConfig;
  characterEditor?: CharacterEditorHeaderConfig;
}

const SURFACE_BUTTON_CLASS =
  "inline-flex items-center justify-center h-10 rounded-xl border-0 bg-[#303035] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] hover:bg-[#343439] active:bg-[#343439] transition-all active:scale-95 text-xs font-bold leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40 disabled:opacity-50 disabled:pointer-events-none";

function BackChevronIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
      <BackChevronIcon />
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-lg font-black text-[hsl(var(--ui-surface-2))] uppercase tracking-tight">
      {children}
    </h1>
  );
}

function SearchChip({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="ml-4 bg-[#2b2b2e] rounded-full p-1 border border-[#2b2b2e]">
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-7 w-56 px-3 py-1 text-xs font-bold rounded-full bg-transparent text-white placeholder:text-zinc-500 focus:outline-none"
      />
    </div>
  );
}

function SegmentedControl({
  options,
  activeValue,
  onChange,
}: {
  options: SegmentedOption[];
  activeValue: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="overflow-x-auto scrollbar-none flex-shrink-0">
      <div className="flex items-center bg-[#2b2b2e] rounded-full p-1 gap-0.5 border border-[#2b2b2e]">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap border-t",
              activeValue === option.key
                ? "relative overflow-hidden bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] border-white/20 text-white shadow-sm"
                : "border-transparent text-[#a1a1aa] hover:text-[#e4e4e7]",
            )}
          >
            {activeValue === option.key && (
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/[0.07] via-transparent to-transparent pointer-events-none" />
            )}
            <span className="relative z-[1]">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SurfaceButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={cn(SURFACE_BUTTON_CLASS, className)} {...props}>
      {children}
    </button>
  );
}

function StoryTransferNotice({ notice }: { notice: StoryTransferNoticeConfig }) {
  return (
    <div className="max-w-[420px] animate-in fade-in duration-300 text-right space-y-1">
      <span
        className={cn(
          "block text-xs",
          notice.tone === "success" && "text-emerald-400",
          notice.tone === "error" && "text-red-400",
          notice.tone === "info" && "text-sky-400",
        )}
      >
        {notice.text}
      </span>
      {notice.warningDetails.length > 0 && (
        <details className="text-[11px] text-[#c7d2fe] bg-[#141826] border border-[#334155] rounded-lg px-2 py-1">
          <summary className="cursor-pointer list-none font-semibold text-sky-300 hover:text-sky-200">
            View import warning details
          </summary>
          <ul className="mt-1 space-y-1 text-left max-h-32 overflow-auto pr-1">
            {notice.warningDetails.map((warning, index) => (
              <li key={`${warning}-${index}`} className="leading-snug text-[#dbeafe]">
                {index + 1}. {warning}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function AiFillButton({
  isLoading,
  onClick,
}: {
  isLoading: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={isLoading}
          className="group relative flex h-10 px-4 rounded-xl overflow-hidden text-white text-[10px] font-bold leading-none shadow-[0_12px_40px_rgba(0,0,0,0.45)] hover:brightness-125 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/45 disabled:opacity-50"
        >
          <span
            aria-hidden
            className="absolute inset-0 rounded-xl"
            style={{
              background:
                "linear-gradient(90deg, rgba(255,255,255,0.34) 0%, rgba(34,184,200,0.62) 18%, rgba(255,255,255,0.22) 44%, rgba(109,94,247,0.64) 78%, rgba(255,255,255,0.28) 100%)",
              filter:
                "drop-shadow(0 0 10px rgba(255,255,255,0.10)) drop-shadow(0 0 18px rgba(109,94,247,0.10)) drop-shadow(0 0 18px rgba(34,184,200,0.10))",
            }}
          />
          <span aria-hidden className="absolute inset-[2px] rounded-[10px]" style={{ background: "#2B2D33" }} />
          <span
            aria-hidden
            className="absolute inset-[2px] rounded-[10px]"
            style={{ background: "linear-gradient(90deg, rgba(34,184,200,0.22), rgba(109,94,247,0.22)), #2B2D33" }}
          />
          <span
            aria-hidden
            className="absolute inset-[2px] rounded-[10px]"
            style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.11), rgba(255,255,255,0.00) 46%, rgba(0,0,0,0.16))" }}
          />
          <span
            aria-hidden
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.26), inset 0 -1px 0 rgba(0,0,0,0.22)",
              background: "linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.00) 55%)",
              mixBlendMode: "screen",
            }}
          />
          <span
            aria-hidden
            className="absolute -left-8 -top-8 h-32 w-32 rounded-full blur-2xl pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(34,184,200,0.28), transparent 62%)" }}
          />
          <span
            aria-hidden
            className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(109,94,247,0.26), transparent 65%)" }}
          />
          <span
            aria-hidden
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(0,0,0,0.26), 0 0 0 1px rgba(255,255,255,0.06)" }}
          />
          <span className="relative z-10 flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-cyan-200" style={{ filter: "drop-shadow(0 0 10px rgba(34,184,200,0.35))" }} />
            <span className="min-w-0 truncate drop-shadow-[0_1px_0_rgba(0,0,0,0.35)]">
              {isLoading ? "Filling..." : "AI Fill"}
            </span>
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent>Have AI generate text for empty fields</TooltipContent>
    </Tooltip>
  );
}

export function AppShellTopBar({
  tab,
  library,
  builder,
  hub,
  gallery,
  imageLibrary,
  admin,
  account,
  conversations,
  storyBuilder,
  characterEditor,
}: AppShellTopBarProps) {
  if (tab === "chat_interface") {
    return null;
  }

  let leftContent: React.ReactNode = null;
  let rightContent: React.ReactNode = null;

  if (tab === "library" && library) {
    leftContent = (
      <div className="flex items-center gap-3 flex-1">
        {library.selectedCharacterId && <BackButton onClick={library.onBack} />}
        <SectionTitle>Character Library</SectionTitle>
        {!library.selectedCharacterId && (
          <SearchChip
            value={library.searchQuery}
            placeholder="Search characters..."
            onChange={library.onSearchChange}
          />
        )}
      </div>
    );
  }

  if ((tab === "world" || tab === "characters") && builder) {
    leftContent = (
      <div className="flex items-center gap-3">
        <BackButton onClick={builder.onBack} />
        <SectionTitle>{builder.activeTab === "characters" ? "Character Builder" : "Story Builder"}</SectionTitle>
      </div>
    );
  }

  if (tab === "conversations") {
    leftContent = <SectionTitle>Chat History</SectionTitle>;
  }

  if (tab === "hub" && hub) {
    leftContent = (
      <div className="flex items-center gap-6">
        <SectionTitle>My Stories</SectionTitle>
        <SegmentedControl
          options={hub.options}
          activeValue={hub.activeFilter}
          onChange={hub.onFilterChange}
        />
      </div>
    );
  }

  if (tab === "image_library" && imageLibrary) {
    leftContent = (
      <div className="flex items-center gap-2">
        {imageLibrary.isInFolder && <BackButton onClick={imageLibrary.onExitFolder} />}
        <SectionTitle>Image Library</SectionTitle>
        {imageLibrary.isInFolder && (
          <SearchChip
            value={imageLibrary.searchQuery}
            placeholder="Search by tags..."
            onChange={imageLibrary.onSearchChange}
          />
        )}
      </div>
    );
  }

  if (tab === "admin" && admin) {
    leftContent = (
      <div className="flex items-center gap-2">
        {admin.activeTool !== "hub" && <BackButton onClick={admin.onBackToHub} />}
        <SectionTitle>{admin.activeTool === "finance_dashboard" ? "Finance Dashboard" : "Admin Panel"}</SectionTitle>
      </div>
    );
  }

  if (tab === "account" && account) {
    leftContent = (
      <div className="flex items-center gap-2">
        <BackButton onClick={account.onBack} />
        <SectionTitle>Account</SectionTitle>
      </div>
    );
  }

  if (tab === "gallery" && gallery) {
    leftContent = (
      <div className="flex items-center gap-6">
        <SectionTitle>Community Gallery</SectionTitle>
        <SegmentedControl
          options={gallery.options}
          activeValue={gallery.activeSort}
          onChange={gallery.onSortChange}
        />
      </div>
    );
  }

  if (tab === "gallery" && gallery) {
    rightContent = (
      <GalleryNsfwToggle checked={gallery.showNsfw} onCheckedChange={gallery.onToggleNsfw} />
    );
  }

  if (tab === "world" && storyBuilder) {
    rightContent = (
      <>
        <SurfaceButton
          onClick={storyBuilder.onOpenImport}
          disabled={!storyBuilder.canInteract || storyBuilder.isSavingAndClosing}
          className="px-5 gap-2"
        >
          <Upload size={14} />
          Import
        </SurfaceButton>
        <SurfaceButton
          onClick={storyBuilder.onOpenExport}
          disabled={!storyBuilder.canInteract || storyBuilder.isSavingAndClosing}
          className="px-5 gap-2"
        >
          <Download size={14} />
          Export
        </SurfaceButton>
        <SurfaceButton
          onClick={storyBuilder.onFinalizeAndClose}
          disabled={storyBuilder.isSavingAndClosing}
          className="px-6"
        >
          {storyBuilder.isSavingAndClosing ? "Saving..." : "Finalize and Close"}
        </SurfaceButton>
        <SurfaceButton
          onClick={storyBuilder.onSaveDraft}
          disabled={storyBuilder.isSaving || storyBuilder.isSavingAndClosing}
          className="px-6"
        >
          {storyBuilder.isSaving ? "Saving..." : "Save Draft"}
        </SurfaceButton>
        {storyBuilder.isAdminState && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SurfaceButton className="w-10 px-0" aria-label="Story Builder settings" title="Story Builder settings">
                <Settings className="w-5 h-5" />
              </SurfaceButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-2">
              <div className="flex items-center justify-between gap-3 rounded-[9px] px-2 py-1">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-[#eaedf1]">Track API Usage</div>
                  <div className="text-[11px] text-[#a1a1aa] mt-0.5 truncate">{storyBuilder.apiUsageTrackingStatusText}</div>
                </div>
                <LabeledToggle
                  checked={storyBuilder.isApiUsageTrackingCurrentStory}
                  disabled={storyBuilder.isApiUsageToggleBusy}
                  onCheckedChange={storyBuilder.onToggleApiUsageTracking}
                  offLabel="Off"
                  onLabel="On"
                />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {storyBuilder.storyTransferNotice && (
          <StoryTransferNotice notice={storyBuilder.storyTransferNotice} />
        )}
      </>
    );
  }

  if (tab === "conversations" && conversations?.hasConversations) {
    rightContent = (
      <SurfaceButton onClick={conversations.onDeleteAll} className="px-6">
        Delete All
      </SurfaceButton>
    );
  }

  if (tab === "hub" && hub) {
    rightContent = (
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SurfaceButton className="w-10 px-0" aria-label="Story Hub settings" title="Story Hub settings">
              <Settings className="w-5 h-5" />
            </SurfaceButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={hub.onOpenBackgroundModal} className="cursor-pointer">
              <ImageIcon className="w-4 h-4 mr-2" />
              Change Background
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  if (tab === "admin" && admin?.activeTool === "app_guide") {
    rightContent = (
      <div className="flex items-center gap-2">
        <SurfaceButton
          onClick={admin.onToggleGuideTheme}
          className="w-10 px-0"
          title={admin.guideTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {admin.guideTheme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </SurfaceButton>
        <SurfaceButton onClick={admin.onGuideSave} className="px-6">
          Save
        </SurfaceButton>
        <SurfaceButton onClick={admin.onGuideSyncAll} className="px-6">
          Sync All
        </SurfaceButton>
      </div>
    );
  }

  if (tab === "admin" && admin?.activeTool === "style_guide") {
    rightContent = (
      <div className="flex items-center gap-2">
        <SurfaceButton onClick={admin.onOpenStyleGuideEdits} className="relative px-5 gap-2">
          <Pencil size={14} />
          Edits
          {admin.styleGuideEditsCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center h-4 min-w-[16px] rounded-full bg-zinc-600 text-[9px] font-bold px-1">
              {admin.styleGuideEditsCount}
            </span>
          )}
        </SurfaceButton>
        <SurfaceButton onClick={admin.onDownloadStyleGuide} className="px-6 gap-2">
          <Download size={14} />
          Download
        </SurfaceButton>
      </div>
    );
  }

  if (tab === "image_library" && imageLibrary) {
    rightContent = (
      <div className="flex items-center gap-2">
        {imageLibrary.isInFolder && (
          <SurfaceButton onClick={imageLibrary.onUploadImages} className="px-6">
            + Upload Images
          </SurfaceButton>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SurfaceButton className="w-10 px-0">
              <Settings className="w-5 h-5" />
            </SurfaceButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={imageLibrary.onOpenBackgroundModal} className="cursor-pointer">
              <ImageIcon className="w-4 h-4 mr-2" />
              Change Background
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  if (tab === "account" && account?.activeTab === "profile") {
    rightContent = (
      <SurfaceButton onClick={account.onSaveProfile} disabled={account.isSavingProfile} className="px-6">
        {account.isSavingProfile ? "Saving..." : "Save"}
      </SurfaceButton>
    );
  }

  if ((tab === "characters" || tab === "library") && characterEditor) {
    if (characterEditor.selectedCharacterId) {
      rightContent = (
        <>
          <AiFillButton isLoading={characterEditor.isAiFilling} onClick={characterEditor.onOpenAiFill} />
          {!characterEditor.isLibraryTab && (
            <SurfaceButton
              onClick={characterEditor.onSave}
              disabled={characterEditor.isSaving || characterEditor.isSavingAndClosing}
              className="px-6 gap-2"
            >
              {characterEditor.isSaving ? "Saving..." : "Save"}
            </SurfaceButton>
          )}
          <SurfaceButton onClick={characterEditor.onCancel} className="px-6 gap-2">
            Cancel
          </SurfaceButton>
          <Tooltip>
            <TooltipTrigger asChild>
              <SurfaceButton
                onClick={characterEditor.onSaveToLibrary}
                disabled={characterEditor.isSavingToLibrary}
                className="px-6 gap-2"
              >
                {characterEditor.isSavingToLibrary
                  ? "Saving..."
                  : characterEditor.selectedCharacterIsInLibrary
                    ? "Update Character"
                    : "+ Character Library"}
              </SurfaceButton>
            </TooltipTrigger>
            <TooltipContent>
              {characterEditor.selectedCharacterIsInLibrary
                ? "Update character profile in library"
                : "Add character to library"}
            </TooltipContent>
          </Tooltip>
        </>
      );
    } else if (tab === "characters") {
      rightContent = (
        <>
          <SurfaceButton onClick={characterEditor.onCancel} className="px-6">
            Cancel
          </SurfaceButton>
          <SurfaceButton onClick={characterEditor.onOpenCharacterPicker} className="px-6">
            Import from Library
          </SurfaceButton>
          <SurfaceButton onClick={characterEditor.onCreateCharacter} className="px-6">
            + New Character
          </SurfaceButton>
        </>
      );
    }
  }

  return <AppShellHeader visible leftContent={leftContent} rightContent={rightContent} />;
}
