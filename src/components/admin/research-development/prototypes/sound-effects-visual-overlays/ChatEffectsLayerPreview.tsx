import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import {
  ChevronDown,
  Image as ImageIcon,
  Moon,
  Palette,
  Pencil,
  Settings,
  Sun,
  Sunrise,
  Sunset,
  Video,
  Volume2,
} from "lucide-react";

import { FormattedMessage } from "@/features/chat-runtime/message-formatting";
import {
  CHRONICLE_CHAT_CENTERED_MESSAGE_CLASS,
  CHRONICLE_CHAT_DAY_TIME_CLASS,
  CHRONICLE_CHAT_MESSAGE_BUBBLE_CLASS,
  CHRONICLE_CHAT_QUICK_ACTION_CLASS,
  CHRONICLE_CHAT_SPEAKER_AVATAR_CLASS,
  CHRONICLE_CHAT_SPEAKER_COLUMN_CLASS,
  CHRONICLE_CHAT_SPEAKER_NAME_CLASS,
  CHRONICLE_CHAT_TRANSCRIPT_CLASS,
} from "@/components/chronicle/chronicle-dark-ui";
import { CHAT_SIDEBAR_WIDTH } from "@/features/chat-runtime/avatar-position";
import { cn } from "@/lib/utils";

import {
  RndEffectAuxiliaryButton,
  RndEffectControlButton,
  RndEffectControlGrid,
  RndEffectControlRow,
} from "../../rnd-effects-control-ui";

import {
  createChatEffectsCanvasRuntime,
  type ChatEffectId,
  type ChatEffectsCanvasRuntime,
} from "./chat-effects-canvas";

const ASSET_ROOT = "/rnd/sound-effects-visual-overlays";
const AMBIENCE_VOLUME = 0.45;
const AUDIO_FADE_DURATION = 900;
const VIDEO_RAIN_ID = "rain-video" as const;
const LIGHT_RAIN_VIDEO_ID = "light-rain-video" as const;
const HEAVY_SNOW_VIDEO_ID = "heavy-snow-video" as const;
const BLEEDING_VIDEO_ID = "bleeding-video" as const;
const CHAT_STAGE_WIDTH = 1536;
const CHAT_STAGE_HEIGHT = 1152;

type ToxicVoice = "male" | "female";

interface EffectAudioConfig {
  file: string;
  ambience: boolean;
  label: string;
}

interface EffectControl {
  id: ChatEffectId;
  label: string;
  audio?: EffectAudioConfig;
}

type VideoEffectControlId =
  | typeof VIDEO_RAIN_ID
  | typeof LIGHT_RAIN_VIDEO_ID
  | typeof HEAVY_SNOW_VIDEO_ID
  | typeof BLEEDING_VIDEO_ID;
type AudioControlId = ChatEffectId | VideoEffectControlId;

type ControlCell = EffectControl | { id: "dead"; label: "Dead"; disabled: true };

const WEATHER_CONTROLS: readonly ControlCell[] = [
  { id: "rain", label: "Rain", audio: { file: "rain-without-thunder.wav", ambience: true, label: "rain audio" } },
  { id: "light-snow", label: "Light Snow" },
  { id: "heavy-snow", label: "Heavy Snow", audio: { file: "heavy-snow.wav", ambience: false, label: "heavy snow audio" } },
  { id: "lightning", label: "Lightning", audio: { file: "thunder.wav", ambience: false, label: "thunder audio" } },
  { id: "sunny", label: "Sunny" },
  { id: "cloudy", label: "Cloudy" },
  { id: "night", label: "Night", audio: { file: "night-crickets.wav", ambience: true, label: "night ambience" } },
  { id: "sunrise", label: "Sunrise", audio: { file: "sunrise-birds.wav", ambience: true, label: "sunrise ambience" } },
  { id: "sunset", label: "Sunset" },
  { id: "windy", label: "Windy", audio: { file: "wind-gust.wav", ambience: true, label: "wind audio" } },
];

const AMBIENT_CONTROLS: readonly ControlCell[] = [
  { id: "cold", label: "Cold" },
  { id: "hot", label: "Hot" },
  { id: "wet", label: "Wet" },
];

const CONDITION_CONTROLS: readonly ControlCell[] = [
  { id: "bleeding", label: "Bleeding", audio: { file: "bleeding.wav", ambience: false, label: "bleeding audio" } },
  { id: "freezing", label: "Freezing", audio: { file: "freezing.wav", ambience: false, label: "freezing audio" } },
  { id: "fractures", label: "Fractures", audio: { file: "fracture.wav", ambience: false, label: "fracture audio" } },
  { id: "toxic", label: "Toxic" },
  { id: "dead", label: "Dead", disabled: true },
  { id: "drowning", label: "Drowning" },
];

const EFFECT_CONTROLS = [...WEATHER_CONTROLS, ...AMBIENT_CONTROLS, ...CONDITION_CONTROLS]
  .filter((control): control is EffectControl => !("disabled" in control));

const AUDIO_CONTROLS = new Map<AudioControlId, EffectAudioConfig>();
EFFECT_CONTROLS.forEach((control) => {
  if (control.audio) AUDIO_CONTROLS.set(control.id, control.audio);
});
AUDIO_CONTROLS.set(VIDEO_RAIN_ID, {
  file: "rain-without-thunder.wav",
  ambience: true,
  label: "video rain audio",
});
AUDIO_CONTROLS.set(LIGHT_RAIN_VIDEO_ID, {
  file: "rain-without-thunder.wav",
  ambience: true,
  label: "light rain video audio",
});
AUDIO_CONTROLS.set(HEAVY_SNOW_VIDEO_ID, {
  file: "heavy-snow.wav",
  ambience: false,
  label: "heavy snow video audio",
});
AUDIO_CONTROLS.set(BLEEDING_VIDEO_ID, {
  file: "bleeding.wav",
  ambience: false,
  label: "bleeding video audio",
});

function isVideoEffectControlId(effect: AudioControlId): effect is VideoEffectControlId {
  return effect === VIDEO_RAIN_ID
    || effect === LIGHT_RAIN_VIDEO_ID
    || effect === HEAVY_SNOW_VIDEO_ID
    || effect === BLEEDING_VIDEO_ID;
}

function drawLumaKeyedVideoFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
  if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) return;
  const layoutWidth = canvas.clientWidth;
  const layoutHeight = canvas.clientHeight;
  if (layoutWidth === 0 || layoutHeight === 0) return;

  const width = Math.max(1, Math.round(layoutWidth * 0.5));
  const height = Math.max(1, Math.round(layoutHeight * 0.5));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return;
  const coverScale = Math.max(width / video.videoWidth, height / video.videoHeight);
  const sourceWidth = width / coverScale;
  const sourceHeight = height / coverScale;
  const sourceX = (video.videoWidth - sourceWidth) / 2;
  const sourceY = (video.videoHeight - sourceHeight) / 2;
  context.clearRect(0, 0, width, height);
  context.drawImage(
    video,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    width,
    height,
  );

  const frame = context.getImageData(0, 0, width, height);
  const pixels = frame.data;
  const transparentBelow = 18;
  const opaqueAbove = 72;
  for (let index = 0; index < pixels.length; index += 4) {
    const peak = Math.max(pixels[index], pixels[index + 1], pixels[index + 2]);
    const keyedAlpha = peak <= transparentBelow
      ? 0
      : peak >= opaqueAbove
        ? 255
        : Math.round(((peak - transparentBelow) / (opaqueAbove - transparentBelow)) * 255);
    pixels[index + 3] = Math.min(pixels[index + 3], keyedAlpha);
  }
  context.putImageData(frame, 0, 0);
}

function StaticAction({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className={cn(CHRONICLE_CHAT_QUICK_ACTION_CLASS, "pointer-events-none")}
    >
      {children}
    </span>
  );
}

function CharacterTile({
  image,
  name,
  owner,
}: {
  image: string;
  name: string;
  owner: "AI" | "User";
}) {
  return (
    <div className="relative h-[88px] overflow-hidden rounded-[12px] border border-[#5a7292] bg-black shadow-[0_8px_20px_rgba(0,0,0,0.35)]">
      <img src={image} alt="" className="h-full w-full object-cover object-top" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
      <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white drop-shadow">{name}</span>
      <span className={cn(
        "absolute bottom-2 right-2 rounded-md px-1.5 py-0.5 text-[7px] font-black text-white",
        owner === "User" ? "bg-blue-500" : "bg-slate-500",
      )}>
        {owner}
      </span>
      <span aria-hidden="true" className="absolute right-2 top-2 rounded-md bg-black/40 p-1 text-white/80">
        <Pencil className="h-3 w-3" />
      </span>
    </div>
  );
}

function CharacterSectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-7 items-center justify-between rounded-[9px] bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] px-3 text-[8px] font-black uppercase tracking-[0.08em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
      <span>{children}</span>
      <ChevronDown className="h-3 w-3 text-white/80" />
    </div>
  );
}

function SpeakerAvatar({ image, name }: { image: string; name: string }) {
  return (
    <div className={CHRONICLE_CHAT_SPEAKER_COLUMN_CLASS}>
      <div className={CHRONICLE_CHAT_SPEAKER_AVATAR_CLASS}>
        <img src={image} alt={name} className="h-full w-full object-cover" />
      </div>
      <span className={cn(CHRONICLE_CHAT_SPEAKER_NAME_CLASS, "text-slate-500")}>{name}</span>
    </div>
  );
}

function ChatShell({
  canvasRef,
  videoRainRef,
  lightRainVideoRef,
  heavySnowVideoRef,
  bleedingVideoRef,
  bleedingVideoCanvasRef,
  activeEffects,
  videoRainActive,
  lightRainVideoActive,
  heavySnowVideoActive,
  bleedingVideoActive,
}: {
  canvasRef: RefObject<HTMLCanvasElement>;
  videoRainRef: RefObject<HTMLVideoElement>;
  lightRainVideoRef: RefObject<HTMLVideoElement>;
  heavySnowVideoRef: RefObject<HTMLVideoElement>;
  bleedingVideoRef: RefObject<HTMLVideoElement>;
  bleedingVideoCanvasRef: RefObject<HTMLCanvasElement>;
  activeEffects: ReadonlySet<ChatEffectId>;
  videoRainActive: boolean;
  lightRainVideoActive: boolean;
  heavySnowVideoActive: boolean;
  bleedingVideoActive: boolean;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [stageScale, setStageScale] = useState(1);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const updateScale = () => {
      const width = frame.getBoundingClientRect().width;
      if (width > 0) setStageScale(width / CHAT_STAGE_WIDTH);
    };
    updateScale();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateScale);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={frameRef}
      data-testid="coded-chat-shell"
      className="relative w-full overflow-hidden rounded-2xl border border-[#4a5f7f] bg-[#202126] shadow-[0_18px_46px_rgba(0,0,0,0.42)]"
      style={{ aspectRatio: `${CHAT_STAGE_WIDTH} / ${CHAT_STAGE_HEIGHT}` }}
    >
      <div
        data-testid="coded-chat-stage"
        className="absolute left-0 top-0 flex overflow-hidden bg-[#202126]"
        style={{
          width: CHAT_STAGE_WIDTH,
          height: CHAT_STAGE_HEIGHT,
          transform: `scale(${stageScale})`,
          transformOrigin: "top left",
        }}
      >
      <aside
        className="relative z-40 flex flex-col overflow-hidden border-r border-white/15 bg-[#25262c]"
        style={{
          width: CHAT_SIDEBAR_WIDTH,
          minWidth: CHAT_SIDEBAR_WIDTH,
          maxWidth: CHAT_SIDEBAR_WIDTH,
        }}
      >
        <div className="flex h-12 items-center justify-between border-b border-white/10 bg-black/15 px-3 text-white">
          <span className="text-[8px] font-black uppercase tracking-[0.12em]">‹ &nbsp; Exit Scenario</span>
          <span className="rounded-lg bg-[#3c3e47] p-2 shadow-lg"><Settings className="h-3.5 w-3.5" /></span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden bg-[radial-gradient(circle_at_50%_0%,#3b4657_0%,#25262c_48%,#1e1f24_100%)] p-3">
          <div className="rounded-xl border border-white/20 bg-[#0e1830]/90 p-3 text-white shadow-[0_8px_20px_rgba(0,0,0,0.42)]">
            <div className="mb-2 flex items-center gap-1 text-[7px] font-black uppercase tracking-[0.14em]"><span>Manual</span><span className="text-white/55">ⓘ</span></div>
            <div className="grid grid-cols-[1fr_auto] items-end gap-2">
              <div>
                <div className="mb-1 text-center text-[6px] font-black uppercase tracking-widest">Day</div>
                <div className="rounded-md bg-white px-3 py-2 text-center text-[11px] font-black text-black">1</div>
              </div>
              <div>
                <div className="mb-1 text-center text-[6px] font-black uppercase tracking-widest">Time</div>
                <div className="flex gap-1">
                  {[Sunrise, Sun, Sunset, Moon].map((Icon, index) => (
                    <span key={index} className={cn("rounded-md bg-white p-2 text-black", index === 3 && "ring-2 ring-blue-500")}>
                      <Icon className="h-3 w-3" />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <CharacterSectionLabel>Main Characters</CharacterSectionLabel>
          <CharacterTile image={`${ASSET_ROOT}/chat-reference-rhys-card.png`} name="Rhys" owner="AI" />
          <CharacterTile image={`${ASSET_ROOT}/chat-reference-tamlin-avatar.png`} name="Tamlin" owner="AI" />
          <CharacterTile image={`${ASSET_ROOT}/chat-reference-feyre-avatar.png`} name="Feyre" owner="User" />
          <CharacterSectionLabel>Side Characters</CharacterSectionLabel>
        </div>
      </aside>

      <main className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="relative min-h-0 flex-1 overflow-hidden bg-[#17181d]">
          <img
            data-layer="scene"
            src={`${ASSET_ROOT}/chat-reference-bedroom-clean.png`}
            alt="Ornate bedroom scene"
            className="absolute inset-0 z-0 h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 z-10 bg-black/5" />
          <img
            data-layer="wet-texture"
            src={`${ASSET_ROOT}/wet-overlay.png`}
            alt=""
            className={cn("pointer-events-none absolute inset-0 z-20 h-full w-full object-fill opacity-0 mix-blend-screen transition-opacity", activeEffects.has("wet") && "opacity-40")}
          />
          <img
            data-layer="freezing-texture"
            src={`${ASSET_ROOT}/frost-overlay.jpg`}
            alt=""
            className={cn("pointer-events-none absolute inset-0 z-20 h-full w-full object-fill opacity-0 mix-blend-screen transition-opacity", activeEffects.has("freezing") && "opacity-50")}
          />
          <img
            data-layer="fractures-texture"
            src={`${ASSET_ROOT}/cracks-overlay.png`}
            alt=""
            className={cn("pointer-events-none absolute inset-0 z-20 h-full w-full object-fill opacity-0 mix-blend-screen transition-opacity", activeEffects.has("fractures") && "opacity-100")}
          />
          <video
            ref={videoRainRef}
            data-layer="rain-video"
            src={`${ASSET_ROOT}/rain-seedance-video.mp4`}
            aria-hidden="true"
            muted
            loop
            playsInline
            preload="metadata"
            className={cn(
              "pointer-events-none absolute inset-0 z-20 h-full w-full object-cover opacity-0 mix-blend-screen transition-opacity duration-200",
              videoRainActive && "opacity-100",
            )}
          />
          <video
            ref={lightRainVideoRef}
            data-layer="light-rain-video"
            src={`${ASSET_ROOT}/light-rain-attempt-2.m4v`}
            aria-hidden="true"
            muted
            loop
            playsInline
            preload="metadata"
            className={cn(
              "pointer-events-none absolute inset-0 z-20 h-full w-full object-cover opacity-0 mix-blend-screen transition-opacity duration-200",
              lightRainVideoActive && "opacity-100",
            )}
          />
          <video
            ref={heavySnowVideoRef}
            data-layer="heavy-snow-video"
            src={`${ASSET_ROOT}/heavy-snow-seedance-video.m4v`}
            aria-hidden="true"
            muted
            loop
            playsInline
            preload="metadata"
            className={cn(
              "pointer-events-none absolute inset-0 z-20 h-full w-full object-cover opacity-0 mix-blend-screen transition-opacity duration-200",
              heavySnowVideoActive && "opacity-100",
            )}
          />
          <video
            ref={bleedingVideoRef}
            data-layer="bleeding-video"
            src={`${ASSET_ROOT}/bleeding-seedance-video.m4v`}
            aria-hidden="true"
            muted
            loop
            playsInline
            preload="metadata"
            className="pointer-events-none absolute h-px w-px opacity-0"
          />
          <canvas
            ref={bleedingVideoCanvasRef}
            data-layer="bleeding-video-keyed"
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0 z-20 h-full w-full opacity-0 transition-opacity duration-200",
              bleedingVideoActive && "opacity-100",
            )}
          />
          <canvas
            ref={canvasRef}
            data-layer="effects"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 h-full w-full"
          />

          <div
            data-layer="transcript"
            className={cn(CHRONICLE_CHAT_TRANSCRIPT_CLASS, "absolute inset-0 z-30")}
          >
            <div className={CHRONICLE_CHAT_CENTERED_MESSAGE_CLASS}>
              <article
                data-testid="chat-transcript-bubble"
                className={cn(CHRONICLE_CHAT_MESSAGE_BUBBLE_CLASS, "bg-[#22232b]")}
              >
              <div data-testid="chat-speaker-segment" className="relative">
                <SpeakerAvatar image={`${ASSET_ROOT}/chat-reference-feyre-avatar.png`} name="Feyre" />
                <div className="pt-1 antialiased">
                  <FormattedMessage
                    text="My limbs flailed as I shot up in bed, yanking on invisible chains. I stumbled to the open window and pushed it wider, clearing my view of the star-specked darkness. I rested my head against the wall. In a few hours I'll be married. I'll have my happy ending whether I deserve it or not."
                    dynamicText={false}
                    plainTextMode="action"
                  />
                </div>
                <div className="clear-both" />
              </div>
              <div data-testid="chat-speaker-segment" className="relative mt-2.5 border-t border-ghost-white pt-2.5">
                <SpeakerAvatar image={`${ASSET_ROOT}/chat-reference-tamlin-avatar.png`} name="Tamlin" />
                <div className="pt-1 antialiased">
                  <FormattedMessage
                    text={'walks into the room and sees Feyre with her head against the wall. Stops in the doorway threshold and cocks his head to the side as he looks at her with a blank face. "Get some sleep, I will see you at the wedding tomorrow" He turns around and closes the door behind him, not waiting for a response from Feyre.'}
                    dynamicText={false}
                    plainTextMode="action"
                  />
                </div>
                <div className="clear-both" />
              </div>
              <div className={CHRONICLE_CHAT_DAY_TIME_CLASS}>
                <span>Day: 1</span><Moon className="h-5 w-5" />
              </div>
              </article>
            </div>
          </div>
        </div>

        <div data-layer="composer" className="relative z-40 border-t border-white/10 bg-[#2a2a2f] px-4 py-3 shadow-[0_-6px_16px_rgba(0,0,0,0.24)]">
          <div className="mb-2 flex items-center gap-2">
            <StaticAction><Settings className="h-3 w-3" />Chat Settings</StaticAction>
            <StaticAction><ImageIcon className="h-3 w-3" />Generate Image</StaticAction>
            <StaticAction><Palette className="h-3 w-3" />Change Color</StaticAction>
            <span aria-hidden="true" className="ml-auto inline-flex h-8 items-center rounded-[10px] border border-white/10 bg-[#3c3e47] px-4 text-[8px] font-black uppercase tracking-[0.12em] text-[#8f95a3] opacity-50">Send</span>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-[#2e2e33] p-2 shadow-inner">
            <div className="h-14 rounded-lg border border-white/10 bg-[#3c3e47] px-3 py-2 text-[10px] text-[#9ca3af]">Describe your action or dialogue...</div>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}

function EffectControlCell({
  control,
  activeEffects,
  enabledAudio,
  toxicVoice,
  onToggleEffect,
  onToggleAudio,
  onSelectToxicVoice,
}: {
  control: ControlCell;
  activeEffects: ReadonlySet<ChatEffectId>;
  enabledAudio: ReadonlySet<AudioControlId>;
  toxicVoice: ToxicVoice | null;
  onToggleEffect: (effect: ChatEffectId) => void;
  onToggleAudio: (effect: AudioControlId) => void;
  onSelectToxicVoice: (voice: ToxicVoice) => void;
}) {
  if ("disabled" in control) {
    return (
      <RndEffectControlButton disabled className="w-full flex-col text-[#a1a1aa]">
        <span>Dead</span><span className="text-[8px] uppercase tracking-[0.12em]">Not yet mapped</span>
      </RndEffectControlButton>
    );
  }

  const active = activeEffects.has(control.id);
  const audioEnabled = enabledAudio.has(control.id);
  return (
    <RndEffectControlRow>
      <RndEffectControlButton
        data-chat-effect={control.id}
        active={active}
        onClick={() => onToggleEffect(control.id)}
      >
        {control.label}
      </RndEffectControlButton>
      {control.audio ? (
        <RndEffectAuxiliaryButton
          data-chat-audio={control.id}
          aria-label={`${audioEnabled ? "Disable" : "Enable"} chat ${control.audio.label}`}
          active={audioEnabled}
          onClick={() => onToggleAudio(control.id)}
        >
          <Volume2 className="h-4 w-4" />
        </RndEffectAuxiliaryButton>
      ) : null}
      {control.id === "toxic" ? (
        <>
          {(["male", "female"] as const).map((voice) => (
            <RndEffectAuxiliaryButton
              key={voice}
              data-chat-toxic-cough={voice}
              aria-label={`${toxicVoice === voice ? "Deselect" : "Select"} ${voice} cough for chat Toxic`}
              active={toxicVoice === voice}
              onClick={() => onSelectToxicVoice(voice)}
              className="text-base"
            >
              {voice === "male" ? "♂" : "♀"}
            </RndEffectAuxiliaryButton>
          ))}
        </>
      ) : null}
    </RndEffectControlRow>
  );
}

function VideoEffectControlCell({
  controlId,
  dataId,
  label,
  toggleLabel,
  audioLabel,
  title,
  active,
  audioEnabled,
  onToggle,
  onToggleAudio,
}: {
  controlId: VideoEffectControlId;
  dataId: string;
  label: string;
  toggleLabel: string;
  audioLabel: string;
  title: string;
  active: boolean;
  audioEnabled: boolean;
  onToggle: (effect: VideoEffectControlId) => void;
  onToggleAudio: (effect: AudioControlId) => void;
}) {
  return (
    <RndEffectControlRow>
      <RndEffectControlButton
        data-chat-video-effect={dataId}
        aria-label={`Toggle ${toggleLabel}`}
        title={title}
        active={active}
        onClick={() => onToggle(controlId)}
        className="gap-2"
      >
        <span>{label}</span>
        <Video aria-hidden="true" className="h-4 w-4" />
      </RndEffectControlButton>
      <RndEffectAuxiliaryButton
        data-chat-video-audio={dataId}
        aria-label={`${audioEnabled ? "Disable" : "Enable"} chat ${audioLabel}`}
        active={audioEnabled}
        onClick={() => onToggleAudio(controlId)}
      >
        <Volume2 className="h-4 w-4" />
      </RndEffectAuxiliaryButton>
    </RndEffectControlRow>
  );
}

export function ChatEffectsLayerPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRainRef = useRef<HTMLVideoElement>(null);
  const lightRainVideoRef = useRef<HTMLVideoElement>(null);
  const heavySnowVideoRef = useRef<HTMLVideoElement>(null);
  const bleedingVideoRef = useRef<HTMLVideoElement>(null);
  const bleedingVideoCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRuntimeRef = useRef<ChatEffectsCanvasRuntime | null>(null);
  const activeEffectsRef = useRef<ReadonlySet<ChatEffectId>>(new Set());
  const videoRainActiveRef = useRef(false);
  const lightRainVideoActiveRef = useRef(false);
  const heavySnowVideoActiveRef = useRef(false);
  const bleedingVideoActiveRef = useRef(false);
  const audioBankRef = useRef(new Map<AudioControlId, HTMLAudioElement>());
  const toxicAudioRef = useRef(new Map<ToxicVoice, HTMLAudioElement>());
  const fadeFramesRef = useRef(new Map<AudioControlId, number>());
  const [activeEffects, setActiveEffects] = useState<ReadonlySet<ChatEffectId>>(new Set());
  const [videoRainActive, setVideoRainActive] = useState(false);
  const [lightRainVideoActive, setLightRainVideoActive] = useState(false);
  const [heavySnowVideoActive, setHeavySnowVideoActive] = useState(false);
  const [bleedingVideoActive, setBleedingVideoActive] = useState(false);
  const [enabledAudio, setEnabledAudio] = useState<ReadonlySet<AudioControlId>>(new Set());
  const [toxicVoice, setToxicVoice] = useState<ToxicVoice | null>(null);

  useEffect(() => {
    const fadeFrames = fadeFramesRef.current;
    const audioBank = audioBankRef.current;
    const toxicAudio = toxicAudioRef.current;
    return () => {
      fadeFrames.forEach((frame) => window.cancelAnimationFrame(frame));
      fadeFrames.clear();
      [...audioBank.values(), ...toxicAudio.values()].forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
        audio.src = "";
      });
      audioBank.clear();
      toxicAudio.clear();
    };
  }, []);

  useEffect(() => () => {
    canvasRuntimeRef.current?.destroy();
    canvasRuntimeRef.current = null;
  }, []);

  useEffect(() => {
    const video = videoRainRef.current;
    if (!video) return;
    if (videoRainActive) {
      video.currentTime = 0;
      void video.play().catch(() => undefined);
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [videoRainActive]);

  useEffect(() => () => {
    const video = videoRainRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  }, []);

  useEffect(() => {
    const video = lightRainVideoRef.current;
    if (!video) return;
    if (lightRainVideoActive) {
      video.currentTime = 0;
      video.playbackRate = 3;
      void video.play().catch(() => undefined);
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [lightRainVideoActive]);

  useEffect(() => () => {
    const video = lightRainVideoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  }, []);

  useEffect(() => {
    const video = heavySnowVideoRef.current;
    if (!video) return;
    if (heavySnowVideoActive) {
      video.currentTime = 0;
      video.playbackRate = 1;
      void video.play().catch(() => undefined);
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [heavySnowVideoActive]);

  useEffect(() => () => {
    const video = heavySnowVideoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  }, []);

  useEffect(() => {
    const video = bleedingVideoRef.current;
    if (!video) return;
    if (bleedingVideoActive) {
      video.currentTime = 0;
      video.playbackRate = 1;
      void video.play().catch(() => undefined);
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [bleedingVideoActive]);

  useEffect(() => () => {
    const video = bleedingVideoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  }, []);

  useEffect(() => {
    const video = bleedingVideoRef.current;
    const canvas = bleedingVideoCanvasRef.current;
    if (!video || !canvas) return;
    if (!bleedingVideoActive) {
      canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    let animationFrame = 0;
    const render = () => {
      drawLumaKeyedVideoFrame(video, canvas);
      animationFrame = window.requestAnimationFrame(render);
    };
    animationFrame = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [bleedingVideoActive]);

  useEffect(() => {
    activeEffectsRef.current = activeEffects;
    if (activeEffects.size > 0 && !canvasRuntimeRef.current && canvasRef.current) {
      canvasRuntimeRef.current = createChatEffectsCanvasRuntime(
        canvasRef.current,
        () => activeEffectsRef.current,
      );
    }
    canvasRuntimeRef.current?.refresh();
  }, [activeEffects]);

  const getAudio = useCallback((effect: AudioControlId) => {
    const existing = audioBankRef.current.get(effect);
    if (existing) return existing;
    const config = AUDIO_CONTROLS.get(effect);
    if (!config) return undefined;
    const audio = new Audio(`${ASSET_ROOT}/${config.file}`);
    audio.preload = "metadata";
    audio.loop = config.ambience;
    audio.volume = config.ambience ? 0 : 1;
    audioBankRef.current.set(effect, audio);
    return audio;
  }, []);

  const getToxicAudio = useCallback((voice: ToxicVoice) => {
    const existing = toxicAudioRef.current.get(voice);
    if (existing) return existing;
    const audio = new Audio(`${ASSET_ROOT}/toxic-cough-${voice}.wav`);
    audio.preload = "metadata";
    toxicAudioRef.current.set(voice, audio);
    return audio;
  }, []);

  const fadeAudioTo = useCallback((effect: AudioControlId, target: number, onComplete?: () => void) => {
    const audio = getAudio(effect);
    if (!audio) return;
    const previousFrame = fadeFramesRef.current.get(effect);
    if (previousFrame !== undefined) window.cancelAnimationFrame(previousFrame);
    const startedAt = performance.now();
    const startVolume = audio.volume;
    const step = (now: number) => {
      const progress = Math.min((now - startedAt) / AUDIO_FADE_DURATION, 1);
      audio.volume = startVolume + (target - startVolume) * progress;
      if (progress < 1) fadeFramesRef.current.set(effect, window.requestAnimationFrame(step));
      else {
        fadeFramesRef.current.delete(effect);
        onComplete?.();
      }
    };
    fadeFramesRef.current.set(effect, window.requestAnimationFrame(step));
  }, [getAudio]);

  const startAudio = useCallback((effect: AudioControlId) => {
    if (!enabledAudio.has(effect)) return;
    const config = AUDIO_CONTROLS.get(effect);
    const audio = getAudio(effect);
    if (!config || !audio) return;
    audio.currentTime = 0;
    if (config.ambience) audio.volume = 0;
    void audio.play().catch(() => undefined);
    if (config.ambience) fadeAudioTo(effect, AMBIENCE_VOLUME);
  }, [enabledAudio, fadeAudioTo, getAudio]);

  const stopAudio = useCallback((effect: AudioControlId) => {
    const config = AUDIO_CONTROLS.get(effect);
    const audio = audioBankRef.current.get(effect);
    if (!config || !audio) return;
    if (config.ambience) {
      fadeAudioTo(effect, 0, () => {
        audio.pause();
        audio.currentTime = 0;
      });
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [fadeAudioTo]);

  const stopToxicAudio = useCallback(() => {
    toxicAudioRef.current.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  }, []);

  const playToxicAudio = useCallback((voice: ToxicVoice | null) => {
    if (!voice) return;
    const audio = getToxicAudio(voice);
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  }, [getToxicAudio]);

  const toggleEffect = useCallback((effect: ChatEffectId) => {
    const active = activeEffectsRef.current.has(effect);
    const next = new Set(activeEffectsRef.current);
    if (active) next.delete(effect);
    else next.add(effect);
    activeEffectsRef.current = next;
    setActiveEffects(next);
    if (active) stopAudio(effect);
    else startAudio(effect);
    if (effect === "toxic") {
      if (active) stopToxicAudio();
      else playToxicAudio(toxicVoice);
    }
  }, [playToxicAudio, startAudio, stopAudio, stopToxicAudio, toxicVoice]);

  const toggleAudio = useCallback((effect: AudioControlId) => {
    const audioIsEnabled = enabledAudio.has(effect);
    const next = new Set(enabledAudio);
    if (audioIsEnabled) next.delete(effect);
    else next.add(effect);
    setEnabledAudio(next);
    if (audioIsEnabled) stopAudio(effect);
    else if (
      (effect === VIDEO_RAIN_ID && videoRainActiveRef.current)
      || (effect === LIGHT_RAIN_VIDEO_ID && lightRainVideoActiveRef.current)
      || (effect === HEAVY_SNOW_VIDEO_ID && heavySnowVideoActiveRef.current)
      || (effect === BLEEDING_VIDEO_ID && bleedingVideoActiveRef.current)
      || (!isVideoEffectControlId(effect) && activeEffectsRef.current.has(effect))
    ) {
      const config = AUDIO_CONTROLS.get(effect);
      const audio = getAudio(effect);
      if (config && audio) {
        audio.currentTime = 0;
        if (config.ambience) audio.volume = 0;
        void audio.play().catch(() => undefined);
        if (config.ambience) fadeAudioTo(effect, AMBIENCE_VOLUME);
      }
    }
  }, [enabledAudio, fadeAudioTo, getAudio, stopAudio]);

  const toggleVideoEffect = useCallback((effect: VideoEffectControlId) => {
    let active: boolean;
    if (effect === VIDEO_RAIN_ID) {
      active = videoRainActiveRef.current;
      videoRainActiveRef.current = !active;
      setVideoRainActive(!active);
    } else if (effect === LIGHT_RAIN_VIDEO_ID) {
      active = lightRainVideoActiveRef.current;
      lightRainVideoActiveRef.current = !active;
      setLightRainVideoActive(!active);
    } else if (effect === HEAVY_SNOW_VIDEO_ID) {
      active = heavySnowVideoActiveRef.current;
      heavySnowVideoActiveRef.current = !active;
      setHeavySnowVideoActive(!active);
    } else {
      active = bleedingVideoActiveRef.current;
      bleedingVideoActiveRef.current = !active;
      setBleedingVideoActive(!active);
    }
    if (active) stopAudio(effect);
    else startAudio(effect);
  }, [startAudio, stopAudio]);

  const selectToxicVoice = useCallback((voice: ToxicVoice) => {
    const nextVoice = toxicVoice === voice ? null : voice;
    stopToxicAudio();
    setToxicVoice(nextVoice);
    if (activeEffectsRef.current.has("toxic")) playToxicAudio(nextVoice);
  }, [playToxicAudio, stopToxicAudio, toxicVoice]);

  const controlProps = {
    activeEffects,
    enabledAudio,
    toxicVoice,
    onToggleEffect: toggleEffect,
    onToggleAudio: toggleAudio,
    onSelectToxicVoice: selectToxicVoice,
  };
  const weatherControls = WEATHER_CONTROLS.flatMap((control) => {
    const controlCell = <EffectControlCell key={control.id} control={control} {...controlProps} />;
    if (control.id === "rain") return [
      controlCell,
      <VideoEffectControlCell
        key={VIDEO_RAIN_ID}
        controlId={VIDEO_RAIN_ID}
        dataId="rain"
        label="Rain"
        toggleLabel="video rain"
        audioLabel="video rain audio"
        title="Generated rain video"
        active={videoRainActive}
        audioEnabled={enabledAudio.has(VIDEO_RAIN_ID)}
        onToggle={toggleVideoEffect}
        onToggleAudio={toggleAudio}
      />,
      <VideoEffectControlCell
        key={LIGHT_RAIN_VIDEO_ID}
        controlId={LIGHT_RAIN_VIDEO_ID}
        dataId="light-rain"
        label="Light Rain"
        toggleLabel="light rain video"
        audioLabel="light rain video audio"
        title="Generated light rain video"
        active={lightRainVideoActive}
        audioEnabled={enabledAudio.has(LIGHT_RAIN_VIDEO_ID)}
        onToggle={toggleVideoEffect}
        onToggleAudio={toggleAudio}
      />,
    ];
    if (control.id === "heavy-snow") return [
      controlCell,
      <VideoEffectControlCell
        key={HEAVY_SNOW_VIDEO_ID}
        controlId={HEAVY_SNOW_VIDEO_ID}
        dataId="heavy-snow"
        label="Heavy Snow"
        toggleLabel="heavy snow video"
        audioLabel="heavy snow video audio"
        title="Generated heavy snow video"
        active={heavySnowVideoActive}
        audioEnabled={enabledAudio.has(HEAVY_SNOW_VIDEO_ID)}
        onToggle={toggleVideoEffect}
        onToggleAudio={toggleAudio}
      />,
    ];
    return [controlCell];
  });
  const conditionControls = CONDITION_CONTROLS.flatMap((control) => {
    const controlCell = <EffectControlCell key={control.id} control={control} {...controlProps} />;
    if (control.id !== "bleeding") return [controlCell];
    return [
      controlCell,
      <VideoEffectControlCell
        key={BLEEDING_VIDEO_ID}
        controlId={BLEEDING_VIDEO_ID}
        dataId="bleeding"
        label="Bleeding"
        toggleLabel="bleeding video"
        audioLabel="bleeding video audio"
        title="Generated bleeding video"
        active={bleedingVideoActive}
        audioEnabled={enabledAudio.has(BLEEDING_VIDEO_ID)}
        onToggle={toggleVideoEffect}
        onToggleAudio={toggleAudio}
      />,
    ];
  });
  const controlColumns = [
    { title: "Weather", controls: weatherControls },
    {
      title: "Ambient",
      controls: AMBIENT_CONTROLS.map((control) => (
        <EffectControlCell key={control.id} control={control} {...controlProps} />
      )),
    },
    {
      title: "Condition",
      controls: conditionControls,
    },
  ];

  return (
    <div className="w-full" data-testid="chat-effects-layer-preview">
      <ChatShell
        canvasRef={canvasRef}
        videoRainRef={videoRainRef}
        lightRainVideoRef={lightRainVideoRef}
        heavySnowVideoRef={heavySnowVideoRef}
        bleedingVideoRef={bleedingVideoRef}
        bleedingVideoCanvasRef={bleedingVideoCanvasRef}
        activeEffects={activeEffects}
        videoRainActive={videoRainActive}
        lightRainVideoActive={lightRainVideoActive}
        heavySnowVideoActive={heavySnowVideoActive}
        bleedingVideoActive={bleedingVideoActive}
      />
      <RndEffectControlGrid columns={controlColumns} className="mt-4" />
    </div>
  );
}
