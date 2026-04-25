import { Dispatch, SetStateAction, useEffect } from "react";
import { TabKey } from "@/types";
import { checkIsAdmin, writeCachedAdminState } from "@/services/app-settings";
import {
  fetchActiveApiUsageTestSession,
  type ApiUsageTestSession,
} from "@/services/api-usage-test-session";
import { normalizeBuilderTab, toLegacyBuilderTab } from "@/features/navigation/builder-tabs";
import * as supabaseData from "@/services/supabase-data";

type AppShellTab = TabKey | "library";
type WarmupLoader = () => Promise<unknown>;

interface StoryTransferNoticeState {
  tone: "success" | "error" | "info";
  text: string;
}

interface UseIndexShellBootstrapArgs {
  searchParams: URLSearchParams;
  clearAppliedSearchParams: () => void;
  setTab: Dispatch<SetStateAction<AppShellTab>>;
  setAdminActiveTool: Dispatch<SetStateAction<string>>;
  storyTransferNotice: StoryTransferNoticeState | null;
  dismissStoryTransferNotice: () => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: Dispatch<SetStateAction<boolean>>;
  authLoading: boolean;
  isAuthenticated: boolean;
  tab: AppShellTab;
  openAuthModal: () => void;
  userId?: string;
  setIsAdminState: Dispatch<SetStateAction<boolean>>;
  accountActiveTab: string;
  resetAccountProfileSaveState: () => void;
  isAdminState: boolean;
  setActiveApiUsageTestSession: Dispatch<SetStateAction<ApiUsageTestSession | null>>;
  setNavButtonImages: Dispatch<SetStateAction<Record<string, any>>>;
  warmupLoaders: WarmupLoader[];
}

export function useIndexShellBootstrap({
  searchParams,
  clearAppliedSearchParams,
  setTab,
  setAdminActiveTool,
  storyTransferNotice,
  dismissStoryTransferNotice,
  sidebarCollapsed,
  setSidebarCollapsed,
  authLoading,
  isAuthenticated,
  tab,
  openAuthModal,
  userId,
  setIsAdminState,
  accountActiveTab,
  resetAccountProfileSaveState,
  isAdminState,
  setActiveApiUsageTestSession,
  setNavButtonImages,
  warmupLoaders,
}: UseIndexShellBootstrapArgs) {
  useEffect(() => {
    const qTab = searchParams.get("tab");
    const qTool = searchParams.get("adminTool");
    if (!qTab) return;

    const normalizedTab = toLegacyBuilderTab(normalizeBuilderTab(qTab));
    setTab(normalizedTab as AppShellTab);
    if (normalizedTab === "admin" && qTool) {
      setAdminActiveTool(qTool);
    }
    clearAppliedSearchParams();
  }, [clearAppliedSearchParams, searchParams, setAdminActiveTool, setTab]);

  useEffect(() => {
    if (!storyTransferNotice) return;
    const timeoutId = setTimeout(dismissStoryTransferNotice, 5000);
    return () => clearTimeout(timeoutId);
  }, [dismissStoryTransferNotice, storyTransferNotice]);

  useEffect(() => {
    localStorage.setItem("chronicle_sidebar_collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1024px)");
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      if (event.matches) setSidebarCollapsed(true);
    };
    handleChange(mediaQuery);
    mediaQuery.addEventListener("change", handleChange as (event: MediaQueryListEvent) => void);
    return () =>
      mediaQuery.removeEventListener("change", handleChange as (event: MediaQueryListEvent) => void);
  }, [setSidebarCollapsed]);

  useEffect(() => {
    const guestAllowedTabs: TabKey[] = ["gallery", "world", "characters"];
    if (!authLoading && !isAuthenticated && !guestAllowedTabs.includes(tab as TabKey)) {
      setTab("gallery");
    }
  }, [authLoading, isAuthenticated, setTab, tab]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") !== "1") return;

    openAuthModal();
    params.delete("auth");
    const nextUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    window.history.replaceState({}, "", nextUrl);
  }, [openAuthModal]);

  useEffect(() => {
    if (!userId) {
      writeCachedAdminState(false);
      setIsAdminState(false);
      return;
    }

    let cancelled = false;
    void checkIsAdmin(userId)
      .then((value) => {
        if (!cancelled) {
          writeCachedAdminState(value);
          setIsAdminState(value);
        }
      })
      .catch((error) => {
        if (!cancelled && import.meta.env.DEV) {
          console.debug("[admin-bootstrap] admin-state preload skipped:", error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [setIsAdminState, userId]);

  useEffect(() => {
    if (tab !== "account" || accountActiveTab !== "profile") {
      resetAccountProfileSaveState();
    }
  }, [accountActiveTab, resetAccountProfileSaveState, tab]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !isAdminState || !userId) {
      setActiveApiUsageTestSession(null);
      return;
    }

    let cancelled = false;
    void fetchActiveApiUsageTestSession({ retries: 1, retryDelayMs: 500, suppressErrors: true })
      .then((session) => {
        if (!cancelled) setActiveApiUsageTestSession(session);
      })
      .catch((error) => {
        if (!cancelled && import.meta.env.DEV) {
          console.debug("[api-usage-test] Active session preload skipped:", error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    authLoading,
    isAdminState,
    isAuthenticated,
    setActiveApiUsageTestSession,
    userId,
  ]);

  useEffect(() => {
    void supabaseData
      .loadNavButtonImages()
      .then((images) => {
        setNavButtonImages((images || {}) as Record<string, any>);
      })
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.debug("[nav-button-images] preload skipped:", error);
        }
      });
  }, [setNavButtonImages]);

  useEffect(() => {
    let cancelled = false;

    const warmup = async () => {
      for (const load of warmupLoaders) {
        if (cancelled) return;
        try {
          await load();
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error ?? "");
          const transientChunkWarmupFailure =
            message.includes("Failed to fetch dynamically imported module") ||
            message.includes("Importing a module script failed");

          if (!transientChunkWarmupFailure && import.meta.env.DEV) {
            console.debug("[chunk-warmup] skipped preload for module:", message);
          }
        }
      }
    };

    const startWarmup = () => {
      void warmup();
    };

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let idleId: number | undefined;

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = (window as Window & { requestIdleCallback: (callback: () => void, options?: { timeout?: number }) => number }).requestIdleCallback(
        startWarmup,
        { timeout: 2000 },
      );
    } else {
      timeoutId = setTimeout(startWarmup, 300);
    }

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      if (idleId !== undefined && "cancelIdleCallback" in window) {
        (
          window as Window & {
            cancelIdleCallback: (handle: number) => void;
          }
        ).cancelIdleCallback(idleId);
      }
    };
  }, [warmupLoaders]);
}
