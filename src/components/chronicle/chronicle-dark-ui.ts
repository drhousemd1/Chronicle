/**
 * Chronicle's established dark-surface language, extracted from the live App
 * Shell, Chat Interface, Story Builder, and Finance surfaces so prototypes do
 * not recreate those values independently.
 */
export const CHRONICLE_DARK = {
  background: "#0d0e12",
  sidebar: "#1b1b20",
  shell: "#2a2a2f",
  tray: "#2e2e33",
  elevated: "#3c3e47",
  elevatedHover: "#44464f",
  recessed: "#1c1c1f",
  text: "#e4e1e8",
  controlText: "#eaedf1",
  muted: "#a1a1aa",
  dim: "#525260",
  slateTop: "#5a7292",
  slateBottom: "#4a5f7f",
  divider: "rgba(255,255,255,0.06)",
  controlBorder: "rgba(255,255,255,0.10)",
  shellShadow:
    "0 12px 32px -2px rgba(0,0,0,0.50), inset 1px 1px 0 rgba(255,255,255,0.09), inset -1px -1px 0 rgba(0,0,0,0.35)",
  trayShadow:
    "inset 1px 1px 0 rgba(255,255,255,0.07), inset -1px -1px 0 rgba(0,0,0,0.30), 0 4px 12px rgba(0,0,0,0.25)",
  buttonShadow:
    "0 8px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.09), inset 0 -1px 0 rgba(0,0,0,0.20)",
} as const;

export const CHRONICLE_SURFACE_BUTTON_CLASS =
  "inline-flex h-10 items-center justify-center rounded-xl border-0 bg-[#303035] text-xs font-bold leading-none text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] transition-all hover:bg-[#343439] active:scale-95 active:bg-[#343439] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent-teal))]/40 disabled:pointer-events-none disabled:opacity-50";

export const CHRONICLE_CHAT_QUICK_ACTION_CLASS =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.10] bg-[#3c3e47] px-4 text-[11px] font-black uppercase tracking-[0.12em] text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] transition-colors hover:bg-[#44464f] active:scale-95 disabled:pointer-events-none disabled:opacity-50";

/**
 * Shared chat-presentation rules used by the live Chat Interface and R&D
 * reconstructions. Keeping these values here prevents a prototype from
 * inventing a second bubble geometry while leaving chat behavior independent.
 */
export const CHRONICLE_CHAT_TRANSCRIPT_CLASS =
  "relative z-10 h-full overflow-y-auto px-6 py-8 space-y-10 custom-scrollbar scrollbar-thin md:px-14 lg:px-20";

export const CHRONICLE_CHAT_CENTERED_MESSAGE_CLASS =
  "w-full max-w-4xl mx-auto";

export const CHRONICLE_CHAT_MESSAGE_BUBBLE_CLASS =
  "relative flex flex-col gap-4 rounded-[2rem] p-8 pb-12 pt-14 shadow-2xl transition-all";

export const CHRONICLE_CHAT_SPEAKER_COLUMN_CLASS =
  "float-left mr-4 mb-2 flex w-16 flex-col items-center gap-1.5";

export const CHRONICLE_CHAT_SPEAKER_AVATAR_CLASS =
  "flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border-2 border-ghost-white shadow-lg";

export const CHRONICLE_CHAT_SPEAKER_NAME_CLASS =
  "w-full truncate text-center text-[9px] font-black uppercase tracking-widest";

export const CHRONICLE_CHAT_DAY_TIME_CLASS =
  "absolute bottom-3 left-4 flex items-center gap-2 text-sm text-slate-400";
