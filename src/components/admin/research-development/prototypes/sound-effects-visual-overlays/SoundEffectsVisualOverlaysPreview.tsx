import { useCallback, useEffect, useRef, useState } from "react";

import { soundEffectsVisualOverlaysDocument } from "./sound-effects-visual-overlays-document";

const DEFAULT_PREVIEW_HEIGHT = 960;

export function SoundEffectsVisualOverlaysPreview() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const [frameHeight, setFrameHeight] = useState(DEFAULT_PREVIEW_HEIGHT);

  const disconnectObservers = useCallback(() => {
    resizeObserverRef.current?.disconnect();
    resizeObserverRef.current = null;
    mutationObserverRef.current?.disconnect();
    mutationObserverRef.current = null;
  }, []);

  const syncFrameHeight = useCallback(() => {
    const frameDocument = frameRef.current?.contentDocument;
    if (!frameDocument) return;

    const nextHeight = Math.max(
      frameDocument.documentElement.scrollHeight,
      frameDocument.body?.scrollHeight ?? 0,
      DEFAULT_PREVIEW_HEIGHT,
    );
    setFrameHeight(nextHeight);
  }, []);

  const handleFrameLoad = useCallback(() => {
    disconnectObservers();
    const frameDocument = frameRef.current?.contentDocument;
    if (!frameDocument?.body) return;

    syncFrameHeight();
    if (typeof ResizeObserver !== "undefined") {
      resizeObserverRef.current = new ResizeObserver(syncFrameHeight);
      resizeObserverRef.current.observe(frameDocument.body);
    }
    mutationObserverRef.current = new MutationObserver(syncFrameHeight);
    mutationObserverRef.current.observe(frameDocument.body, {
      attributes: true,
      childList: true,
      subtree: true,
    });
  }, [disconnectObservers, syncFrameHeight]);

  useEffect(() => disconnectObservers, [disconnectObservers]);

  return (
    <iframe
      ref={frameRef}
      title="Sound Effects & Visual Overlays interactive mock-up"
      srcDoc={soundEffectsVisualOverlaysDocument}
      onLoad={handleFrameLoad}
      className="block w-full border-0 bg-transparent"
      style={{ height: `${frameHeight}px` }}
    />
  );
}
