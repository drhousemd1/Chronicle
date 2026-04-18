import { useCallback, useEffect, useRef, useState } from 'react';

const GALLERY_NSFW_PREFERENCE_KEY = 'chronicle.gallery.showNsfw';
const GALLERY_NSFW_AGE_CONFIRMED_KEY = 'chronicle.gallery.nsfwAgeConfirmed';

const readStoredFlag = (key: string) => {
  if (typeof window === 'undefined') return false;

  try {
    return window.localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
};

export function useGalleryNsfwPreference() {
  const [showNsfw, setShowNsfw] = useState<boolean>(() => {
    // Do not rehydrate NSFW visibility unless the user has explicitly completed
    // the 18+ confirmation flow on this device.
    return readStoredFlag(GALLERY_NSFW_AGE_CONFIRMED_KEY) && readStoredFlag(GALLERY_NSFW_PREFERENCE_KEY);
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(GALLERY_NSFW_PREFERENCE_KEY, String(showNsfw));
    } catch {
      // Ignore storage failures and keep the in-memory preference.
    }
  }, [showNsfw]);

  return [showNsfw, setShowNsfw] as const;
}

export function useGalleryNsfwAgeConfirmation() {
  const [hasConfirmedNsfw, setHasConfirmedNsfw] = useState<boolean>(() => {
    return readStoredFlag(GALLERY_NSFW_AGE_CONFIRMED_KEY);
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(GALLERY_NSFW_AGE_CONFIRMED_KEY, String(hasConfirmedNsfw));
    } catch {
      // Ignore storage failures and keep the in-memory confirmation state.
    }
  }, [hasConfirmedNsfw]);

  return [hasConfirmedNsfw, setHasConfirmedNsfw] as const;
}

export function useGalleryNsfwAccess() {
  const [showNsfw, setShowNsfw] = useGalleryNsfwPreference();
  const [hasConfirmedNsfw, setHasConfirmedNsfw] = useGalleryNsfwAgeConfirmation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pendingApprovalActionRef = useRef<(() => void) | null>(null);

  const closeConfirm = useCallback(() => {
    pendingApprovalActionRef.current = null;
    setConfirmOpen(false);
  }, []);

  const requestShowNsfw = useCallback((onApproved?: () => void) => {
    if (hasConfirmedNsfw) {
      setShowNsfw(true);
      onApproved?.();
      return;
    }

    pendingApprovalActionRef.current = onApproved ?? null;
    setConfirmOpen(true);
  }, [hasConfirmedNsfw, setShowNsfw]);

  const handleToggleChange = useCallback((nextChecked: boolean) => {
    if (!nextChecked) {
      pendingApprovalActionRef.current = null;
      setConfirmOpen(false);
      setShowNsfw(false);
      return;
    }

    requestShowNsfw();
  }, [requestShowNsfw, setShowNsfw]);

  const confirmShowNsfw = useCallback(() => {
    setHasConfirmedNsfw(true);
    setShowNsfw(true);

    const pendingApprovalAction = pendingApprovalActionRef.current;
    pendingApprovalActionRef.current = null;
    setConfirmOpen(false);
    pendingApprovalAction?.();
  }, [setHasConfirmedNsfw, setShowNsfw]);

  return {
    showNsfw,
    onToggleChange: handleToggleChange,
    requestShowNsfw,
    confirmOpen,
    closeConfirm,
    confirmShowNsfw,
  };
}
