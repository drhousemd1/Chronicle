import type { CSSProperties, ChangeEvent, DragEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ImagePlus,
  MessageSquareText,
  Music2,
  Play,
  RotateCcw,
  Trash2,
} from "lucide-react";

import {
  ChronicleDarkShell,
  ChronicleSurfaceButton,
} from "@/components/chronicle/ChronicleDarkUi";
import {
  CHRONICLE_CHAT_CENTERED_MESSAGE_CLASS,
  CHRONICLE_CHAT_DAY_TIME_CLASS,
  CHRONICLE_CHAT_MESSAGE_BUBBLE_CLASS,
  CHRONICLE_CHAT_SPEAKER_AVATAR_CLASS,
  CHRONICLE_CHAT_SPEAKER_COLUMN_CLASS,
  CHRONICLE_CHAT_SPEAKER_NAME_CLASS,
} from "@/components/chronicle/chronicle-dark-ui";
import { cn } from "@/lib/utils";

import "./story-opening-screen.css";

type Placement = "left" | "center" | "lower";
type VisualStyle =
  | "modern"
  | "luxury"
  | "noir"
  | "gothic"
  | "academia"
  | "medieval"
  | "fantasy"
  | "scifi";
type Overlay =
  | "soft-dark"
  | "cinematic-shade"
  | "lower-vignette"
  | "warm-light"
  | "cool-mist"
  | "frosted-vignette";
type Transition =
  | "fade-clear"
  | "fade-black"
  | "fade-white"
  | "split-fold"
  | "chromatic-shutter"
  | "photo-plane-extrusion"
  | "print-plate-disassembly"
  | "kinetic-type-interlude";
type PreviewPhase = "opening" | "transitioning" | "chat";

interface SelectedMedia {
  fileName: string;
  url: string;
}

const DEFAULT_COPY = "Set the scene before the first message.";

const PLACEMENTS: ReadonlyArray<{ id: Placement; label: string }> = [
  { id: "left", label: "Left cinematic" },
  { id: "center", label: "Centered" },
  { id: "lower", label: "Lower third" },
];

const VISUAL_STYLES: ReadonlyArray<{ id: VisualStyle; label: string }> = [
  { id: "modern", label: "Clean modern" },
  { id: "luxury", label: "Luxury contemporary" },
  { id: "noir", label: "Cinematic noir" },
  { id: "gothic", label: "Gothic romance" },
  { id: "academia", label: "Dark academia" },
  { id: "medieval", label: "Medieval" },
  { id: "fantasy", label: "High fantasy" },
  { id: "scifi", label: "Sci-fi" },
];

const OVERLAYS: ReadonlyArray<{ id: Overlay; label: string }> = [
  { id: "soft-dark", label: "Soft dark" },
  { id: "cinematic-shade", label: "Cinematic shade" },
  { id: "lower-vignette", label: "Lower vignette" },
  { id: "warm-light", label: "Warm light" },
  { id: "cool-mist", label: "Cool mist" },
  { id: "frosted-vignette", label: "Frosted vignette" },
];

const TRANSITIONS: ReadonlyArray<{ id: Transition; label: string; duration: number }> = [
  { id: "fade-clear", label: "Fade to clear", duration: 1700 },
  { id: "fade-black", label: "Fade to black", duration: 1900 },
  { id: "fade-white", label: "Fade to white", duration: 1900 },
  { id: "split-fold", label: "Split fold", duration: 2200 },
  { id: "chromatic-shutter", label: "Chromatic shutter", duration: 2300 },
  { id: "photo-plane-extrusion", label: "Photo plane extrusion", duration: 2500 },
  { id: "print-plate-disassembly", label: "Print-plate disassembly", duration: 2600 },
  { id: "kinetic-type-interlude", label: "Kinetic type interlude", duration: 2450 },
];

function ControlLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
      {children}
    </p>
  );
}

function ChoiceButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <ChronicleSurfaceButton
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-9 min-w-0 px-3 text-[11px]",
        active &&
          "bg-[#3b82f6] text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)] hover:bg-[#3b82f6] hover:brightness-110",
      )}
    >
      {children}
    </ChronicleSurfaceButton>
  );
}

function ChatArrivalFrame({ hidden }: { hidden: boolean }) {
  return (
    <div
      className="story-opening-chat"
      aria-hidden={hidden || undefined}
      aria-label={hidden ? undefined : "Chronicle chat arrival preview"}
    >
      <img
        className="story-opening-chat__scene"
        src="/rnd/sound-effects-visual-overlays/chat-reference-bedroom-clean.png"
        alt="Ornate bedroom scene"
      />
      <aside className="story-opening-chat__rail" aria-hidden="true">
        <div className="story-opening-chat__exit">‹ Exit Scenario</div>
        <div className="story-opening-chat__time">
          <span>Manual</span>
          <strong>Day 1 · Night</strong>
        </div>
        <div className="story-opening-chat__rail-label">Main Characters</div>
        <img
          src="/rnd/sound-effects-visual-overlays/chat-reference-rhys-card.png"
          alt=""
          className="story-opening-chat__character"
        />
      </aside>

      <main className="story-opening-chat__conversation">
        <article
          className={cn(
            CHRONICLE_CHAT_CENTERED_MESSAGE_CLASS,
            CHRONICLE_CHAT_MESSAGE_BUBBLE_CLASS,
            "story-opening-chat__bubble bg-[#22232b]/95 text-slate-300",
          )}
        >
          <div className={cn(CHRONICLE_CHAT_SPEAKER_COLUMN_CLASS, "story-opening-chat__speaker")}>
            <img
              src="/rnd/sound-effects-visual-overlays/chat-reference-feyre-avatar.png"
              alt="Feyre"
              className={CHRONICLE_CHAT_SPEAKER_AVATAR_CLASS}
            />
            <span className={cn(CHRONICLE_CHAT_SPEAKER_NAME_CLASS, "text-slate-400")}>Feyre</span>
          </div>
          <p>
            The room returns around me as the opening scene clears. The first exchange is ready to begin.
          </p>
          <div className={CHRONICLE_CHAT_DAY_TIME_CLASS}>Day: 1 · Night</div>
        </article>
      </main>

      <div className="story-opening-chat__composer" aria-hidden="true">
        <span>Chat Settings</span>
        <span>Generate Image</span>
        <span>Change Color</span>
        <div>Describe your action or dialogue…</div>
      </div>
    </div>
  );
}

function TransitionLayer({
  transition,
  openingImage,
  openingCopy,
}: {
  transition: Transition;
  openingImage: string | null;
  openingCopy: string;
}) {
  const words = openingCopy.trim().split(/\s+/).filter(Boolean).slice(0, 3);
  while (words.length < 3) words.push(["Set", "The", "Scene"][words.length]);
  const transitionImage = openingImage
    ? `url("${openingImage.replace(/"/g, '\\"')}")`
    : "linear-gradient(135deg, #111827, #26354c 55%, #0b0c10)";

  return (
    <div
      className="story-opening-transition-layer"
      data-transition={transition}
      aria-hidden="true"
      style={{ "--story-opening-transition-image": transitionImage } as CSSProperties}
    >
      <span className="story-opening-transition-panel story-opening-transition-panel--one" />
      <span className="story-opening-transition-panel story-opening-transition-panel--two" />
      <span className="story-opening-transition-panel story-opening-transition-panel--three" />
      <div className="story-opening-photo-planes">
        {Array.from({ length: 9 }, (_, index) => (
          <span key={index} style={{ "--plane-index": index } as CSSProperties} />
        ))}
      </div>
      <div className="story-opening-print-plates">
        <span className="story-opening-print-plate story-opening-print-plate--cyan" />
        <span className="story-opening-print-plate story-opening-print-plate--magenta" />
        <span className="story-opening-print-plate story-opening-print-plate--yellow" />
      </div>
      <div className="story-opening-kinetic-type">
        {words.map((word, index) => (
          <span key={`${word}-${index}`} data-word-index={index}>{word}</span>
        ))}
      </div>
    </div>
  );
}

export function StoryOpeningScreenPreview() {
  const [openingCopy, setOpeningCopy] = useState(DEFAULT_COPY);
  const [placement, setPlacement] = useState<Placement>("left");
  const [visualStyle, setVisualStyle] = useState<VisualStyle>("noir");
  const [selectedOverlays, setSelectedOverlays] = useState<Overlay[]>([]);
  const [transition, setTransition] = useState<Transition>("fade-clear");
  const [phase, setPhase] = useState<PreviewPhase>("opening");
  const [transitionRun, setTransitionRun] = useState(0);
  const [openingImage, setOpeningImage] = useState<SelectedMedia | null>(null);
  const [openingAudio, setOpeningAudio] = useState<SelectedMedia | null>(null);
  const [mediaError, setMediaError] = useState("");
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const audioStartTimerRef = useRef<number | null>(null);
  const audioFadeTimerRef = useRef<number | null>(null);

  const currentTransition = useMemo(
    () => TRANSITIONS.find((option) => option.id === transition) ?? TRANSITIONS[0],
    [transition],
  );

  const stopTimers = useCallback(() => {
    if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current);
    if (audioStartTimerRef.current !== null) window.clearTimeout(audioStartTimerRef.current);
    if (audioFadeTimerRef.current !== null) window.clearInterval(audioFadeTimerRef.current);
    transitionTimerRef.current = null;
    audioStartTimerRef.current = null;
    audioFadeTimerRef.current = null;
  }, []);

  const stopAudio = useCallback((resetTime = true) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    if (resetTime) audio.currentTime = 0;
    audio.volume = 1;
  }, []);

  useEffect(() => {
    return () => {
      stopTimers();
      stopAudio();
    };
  }, [stopAudio, stopTimers]);

  useEffect(() => {
    return () => {
      if (openingImage) URL.revokeObjectURL(openingImage.url);
    };
  }, [openingImage]);

  useEffect(() => {
    return () => {
      if (openingAudio) URL.revokeObjectURL(openingAudio.url);
    };
  }, [openingAudio]);

  const resetPreview = (playAudio = false) => {
    stopTimers();
    stopAudio();
    setTransitionRun((current) => current + 1);
    setPhase("opening");
    if (playAudio && openingAudio) {
      audioStartTimerRef.current = window.setTimeout(() => {
        audioStartTimerRef.current = null;
        const audio = audioRef.current;
        if (!audio) return;
        audio.volume = 1;
        const playback = audio.play();
        if (playback) {
          void playback.catch(() => {
            setMediaError("Opening audio could not be played. Choose a supported audio file.");
          });
        }
      }, 0);
    }
  };

  const beginTransition = () => {
    if (phase === "transitioning") return;
    stopTimers();
    setTransitionRun((current) => current + 1);
    setPhase("transitioning");

    const audio = audioRef.current;
    if (audio && !audio.paused) {
      let step = 0;
      const startVolume = audio.volume;
      audioFadeTimerRef.current = window.setInterval(() => {
        step += 1;
        audio.volume = Math.max(0, startVolume * (1 - step / 8));
        if (step < 8) return;
        if (audioFadeTimerRef.current !== null) window.clearInterval(audioFadeTimerRef.current);
        audioFadeTimerRef.current = null;
        stopAudio();
      }, 80);
    }

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    transitionTimerRef.current = window.setTimeout(
      () => {
        setPhase("chat");
        transitionTimerRef.current = null;
      },
      reduceMotion ? 40 : currentTransition.duration,
    );
  };

  const setImageFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMediaError("Choose an image file for the opening scene.");
      return;
    }
    setMediaError("");
    setOpeningImage({ fileName: file.name, url: URL.createObjectURL(file) });
    resetPreview(false);
  };

  const setAudioFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      setMediaError("Choose an audio file for the opening scene.");
      return;
    }
    setMediaError("");
    stopAudio();
    setOpeningAudio({ fileName: file.name, url: URL.createObjectURL(file) });
  };

  const toggleOverlay = (overlay: Overlay) => {
    setSelectedOverlays((current) =>
      current.includes(overlay)
        ? current.filter((selected) => selected !== overlay)
        : [...current, overlay],
    );
  };

  const selectedOverlayNames = selectedOverlays.join(" ");
  const displayedOpeningCopy = openingCopy.trim() || DEFAULT_COPY;
  const copyVisualLength =
    displayedOpeningCopy.length + (displayedOpeningCopy.match(/\n/g)?.length ?? 0) * 28;
  const copyDensity =
    copyVisualLength > 240
      ? "dense"
      : copyVisualLength > 120
        ? "medium"
        : "standard";

  return (
    <ChronicleDarkShell
      className="w-full max-w-[1180px]"
      data-testid="story-opening-screen-preview"
    >
      <header className="relative flex items-center gap-3 overflow-hidden border-t border-white/20 bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] px-5 py-3 shadow-lg">
        <div
          className="absolute inset-0 z-0 bg-gradient-to-tr from-white/10 to-transparent opacity-40"
          style={{ height: "60%" }}
        />
        <MessageSquareText className="relative z-[1] h-[18px] w-[18px] text-white" aria-hidden="true" />
        <h3 className="relative z-[1] text-xl font-bold tracking-[-0.015em] text-white">
          Story Opening Screen
        </h3>
      </header>

      <div className="p-4 sm:p-5">
        <div className="space-y-5 rounded-2xl bg-[#2e2e33] p-4 pb-5 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)] sm:p-5 sm:pb-6">
          <div
            className="story-opening-frame"
            data-phase={phase}
            data-placement={placement}
            data-style={visualStyle}
            data-overlays={selectedOverlayNames}
            data-transition={transition}
            data-testid="story-opening-stage"
          >
            <ChatArrivalFrame hidden={phase !== "chat"} />

            {phase !== "chat" ? (
              <div className="story-opening-art">
                {openingImage ? (
                  <img src={openingImage.url} alt="Selected opening scene" />
                ) : (
                  <div className="story-opening-art__empty" aria-hidden="true" />
                )}
                {selectedOverlays.map((overlay) => (
                  <span key={overlay} className="story-opening-overlay" data-overlay={overlay} />
                ))}
                <div className="story-opening-copy">
                  <h4 className="story-opening-copy__title">Chronicle Story Opening</h4>
                  <p className="story-opening-copy__text" data-density={copyDensity}>
                    {displayedOpeningCopy}
                  </p>
                  <button
                    type="button"
                    className="story-opening-copy__begin"
                    onClick={beginTransition}
                    disabled={phase === "transitioning"}
                  >
                    Begin
                  </button>
                </div>
              </div>
            ) : null}

            {phase === "transitioning" ? (
              <TransitionLayer
                key={`${transition}-${transitionRun}`}
                transition={transition}
                openingImage={openingImage?.url ?? null}
                openingCopy={displayedOpeningCopy}
              />
            ) : null}
          </div>

          <div className="grid gap-5 border-t border-white/[0.06] pt-5 lg:grid-cols-2">
            <div className="space-y-5 lg:border-r lg:border-white/[0.06] lg:pr-5">
              <section>
                <label
                  id="story-opening-copy-label"
                  htmlFor="story-opening-copy-input"
                  className="mb-1 block text-[10px] font-black uppercase tracking-widest text-zinc-400"
                >
                  Opening text
                </label>
                <textarea
                  id="story-opening-copy-input"
                  value={openingCopy}
                  maxLength={360}
                  rows={4}
                  onChange={(event) => {
                    setOpeningCopy(event.target.value);
                    resetPreview(false);
                  }}
                  className="w-full resize-y rounded-lg border border-black/35 bg-[#1c1c1f] px-3 py-2 text-sm leading-relaxed text-white placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </section>

              <section>
                <ControlLabel>Presentation placement</ControlLabel>
                <div role="group" aria-label="Presentation placement" className="flex flex-wrap gap-2">
                  {PLACEMENTS.map((option) => (
                    <ChoiceButton
                      key={option.id}
                      active={placement === option.id}
                      onClick={() => {
                        setPlacement(option.id);
                        resetPreview(false);
                      }}
                    >
                      {option.label}
                    </ChoiceButton>
                  ))}
                </div>
              </section>

              <section>
                <ControlLabel>Visual style</ControlLabel>
                <div role="group" aria-label="Visual style" className="flex flex-wrap gap-2">
                  {VISUAL_STYLES.map((option) => (
                    <ChoiceButton
                      key={option.id}
                      active={visualStyle === option.id}
                      onClick={() => {
                        setVisualStyle(option.id);
                        resetPreview(false);
                      }}
                    >
                      {option.label}
                    </ChoiceButton>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-5">
              <section>
                <ControlLabel>Opening media</ControlLabel>
                <div
                  className={cn(
                    "rounded-xl border border-dashed border-[#4a5f7f] bg-[#1c1c1f] p-3 transition-colors",
                    isDraggingImage && "border-blue-400 bg-blue-500/10",
                  )}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setIsDraggingImage(true);
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDragLeave={(event) => {
                    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
                    setIsDraggingImage(false);
                  }}
                  onDrop={(event: DragEvent<HTMLDivElement>) => {
                    event.preventDefault();
                    setIsDraggingImage(false);
                    setImageFile(event.dataTransfer.files[0]);
                  }}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <ChronicleSurfaceButton
                      onClick={() => imageInputRef.current?.click()}
                      className="gap-2 px-4"
                    >
                      <ImagePlus className="h-4 w-4" aria-hidden="true" />
                      {openingImage ? "Replace image" : "Choose image"}
                    </ChronicleSurfaceButton>
                    {openingImage ? (
                      <>
                        <span className="min-w-0 flex-1 truncate text-[11px] text-zinc-400">
                          {openingImage.fileName}
                        </span>
                        <ChronicleSurfaceButton
                          aria-label="Remove opening image"
                          onClick={() => {
                            setOpeningImage(null);
                            resetPreview(false);
                          }}
                          className="h-10 w-10 px-0"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </ChronicleSurfaceButton>
                      </>
                    ) : (
                      <span className="text-[11px] text-zinc-500">or drop an image here</span>
                    )}
                  </div>
                  <input
                    ref={imageInputRef}
                    className="hidden"
                    type="file"
                    accept="image/*"
                    aria-label="Opening image file"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      setImageFile(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <ChronicleSurfaceButton
                    onClick={() => audioInputRef.current?.click()}
                    className="gap-2 px-4"
                  >
                    <Music2 className="h-4 w-4" aria-hidden="true" />
                    {openingAudio ? "Replace audio" : "Choose audio"}
                  </ChronicleSurfaceButton>
                  {openingAudio ? (
                    <>
                      <span className="min-w-0 flex-1 truncate text-[11px] text-zinc-400">
                        {openingAudio.fileName}
                      </span>
                      <ChronicleSurfaceButton
                        aria-label="Remove opening audio"
                        onClick={() => {
                          stopAudio();
                          setOpeningAudio(null);
                        }}
                        className="h-10 w-10 px-0"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </ChronicleSurfaceButton>
                    </>
                  ) : (
                    <span className="text-[11px] text-zinc-500">optional</span>
                  )}
                  <input
                    ref={audioInputRef}
                    className="hidden"
                    type="file"
                    accept="audio/*"
                    aria-label="Opening audio file"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      setAudioFile(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                  {openingAudio ? (
                    <audio
                      ref={audioRef}
                      src={openingAudio.url}
                      preload="metadata"
                      onError={() => {
                        setMediaError("Opening audio could not be loaded. Choose a supported audio file.");
                      }}
                    />
                  ) : null}
                </div>
                {mediaError ? <p role="alert" className="mt-2 text-xs text-red-400">{mediaError}</p> : null}
              </section>

              <section>
                <ControlLabel>Image treatments</ControlLabel>
                <div role="group" aria-label="Image treatments" className="flex flex-wrap gap-2">
                  <ChoiceButton
                    active={selectedOverlays.length === 0}
                    onClick={() => {
                      setSelectedOverlays([]);
                      resetPreview(false);
                    }}
                  >
                    None
                  </ChoiceButton>
                  {OVERLAYS.map((option) => (
                    <ChoiceButton
                      key={option.id}
                      active={selectedOverlays.includes(option.id)}
                      onClick={() => {
                        toggleOverlay(option.id);
                        resetPreview(false);
                      }}
                    >
                      {option.label}
                    </ChoiceButton>
                  ))}
                </div>
              </section>

              <section>
                <ControlLabel>Transition into chat</ControlLabel>
                <div role="group" aria-label="Transition into chat" className="flex flex-wrap gap-2">
                  {TRANSITIONS.map((option) => (
                    <ChoiceButton
                      key={option.id}
                      active={transition === option.id}
                      onClick={() => {
                        setTransition(option.id);
                        resetPreview(false);
                      }}
                    >
                      {option.label}
                    </ChoiceButton>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-white/[0.06] pt-5">
            <ChronicleSurfaceButton
              onClick={() => resetPreview(true)}
              className="gap-2 px-4"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              Preview opening
            </ChronicleSurfaceButton>
            <ChronicleSurfaceButton
              onClick={() => resetPreview(false)}
              className="gap-2 px-4"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset preview
            </ChronicleSurfaceButton>
          </div>
        </div>
      </div>
    </ChronicleDarkShell>
  );
}
