import type { ButtonHTMLAttributes, ReactNode } from "react";

import { CHRONICLE_DARK } from "@/components/chronicle/chronicle-dark-ui";
import { cn } from "@/lib/utils";

export interface RndEffectControlColumn {
  title: string;
  controls: readonly ReactNode[];
}

const controlBaseClass =
  "flex min-h-11 min-w-0 items-center justify-center rounded-[10px] border border-white/[0.10] bg-[#3c3e47] px-3 text-center text-xs font-bold text-[#eaedf1] shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(0,0,0,0.20)] transition-all hover:bg-[#44464f] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8fa9ca] disabled:cursor-not-allowed disabled:opacity-45";

export function RndEffectControlGrid({
  columns,
  className,
}: {
  columns: readonly RndEffectControlColumn[];
  className?: string;
}) {
  return (
    <section
      data-rnd-ui-pattern="effect-control-panel"
      data-rnd-ui-precedent="character-builder-section-chat-settings-controls"
      className={cn(
        "w-full overflow-hidden rounded-[24px] bg-[#2a2a2f] shadow-[0_12px_32px_-2px_rgba(0,0,0,0.50),inset_1px_1px_0_rgba(255,255,255,0.09),inset_-1px_-1px_0_rgba(0,0,0,0.35)]",
        className,
      )}
    >
      <header
        data-rnd-ui-role="section-header"
        className="relative flex items-center border-t border-white/20 bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] px-5 py-3 shadow-lg"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.07] via-transparent to-transparent"
        />
        <h3 className="relative text-xl font-bold tracking-[-0.015em] text-white">
          Effect Controls
        </h3>
      </header>
      <div className="p-5">
        <div className="rounded-2xl bg-[#2e2e33] p-5 pb-6 shadow-[inset_1px_1px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.25)]">
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
          >
            {columns.map((column) => (
              <section
                key={column.title}
                data-rnd-ui-role="control-group"
                className="min-w-0"
              >
                <h4 className="mb-2.5 text-left text-xs font-black uppercase tracking-[0.12em] text-[#a1a1aa]">
                  {column.title}
                </h4>
                <div className="space-y-2">
                  {column.controls.map((control, controlIndex) => (
                    <div key={`${column.title}-${controlIndex}`} className="min-w-0">
                      {control}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function RndEffectControlRow({ children }: { children: ReactNode }) {
  return <div className="flex min-h-11 min-w-0 gap-1.5">{children}</div>;
}

export function RndEffectControlButton({
  active = false,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={props.disabled ? undefined : active}
      className={cn(
        controlBaseClass,
        "flex-1",
        active && "border-[#3b82f6] bg-[#3b82f6] text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)] hover:bg-[#3b82f6] hover:brightness-110",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function RndEffectAuxiliaryButton({
  active = false,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        controlBaseClass,
        "w-11 shrink-0 px-0 text-[#b9c9dc]",
        active && "border-[#3b82f6] bg-[#3b82f6] text-white shadow-[0_2px_8px_rgba(59,130,246,0.35)] hover:bg-[#3b82f6] hover:brightness-110",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * The first preserved prototype remains in an iframe. This stylesheet applies
 * the exact same Chronicle-derived surface contract without replacing its
 * working legacy event and audio handlers.
 */
export const RND_EFFECT_CONTROL_DOCUMENT_CSS = `
  .effects-panel {
    display: block;
    padding: 0;
    border: 0;
    border-radius: 24px;
    overflow: hidden;
    background: ${CHRONICLE_DARK.shell};
    box-shadow: ${CHRONICLE_DARK.shellShadow};
  }
  .effects-panel-header {
    position: relative;
    display: flex;
    align-items: center;
    padding: 12px 20px;
    border-top: 1px solid rgba(255,255,255,0.20);
    background: linear-gradient(180deg, ${CHRONICLE_DARK.slateTop} 0%, ${CHRONICLE_DARK.slateBottom} 100%);
    color: #fff;
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.30), 0 4px 6px -4px rgba(0,0,0,0.30);
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.015em;
  }
  .effects-panel-header::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(180deg, rgba(255,255,255,0.07), transparent 60%);
  }
  .effects-panel-body { padding: 20px; }
  .effects-panel-tray {
    padding: 20px 20px 24px;
    border-radius: 16px;
    background: ${CHRONICLE_DARK.tray};
    box-shadow: ${CHRONICLE_DARK.trayShadow};
  }
  .effects-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px 16px;
  }
  .effects-col-label {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    min-height: 0;
    padding: 0 0 2px;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: ${CHRONICLE_DARK.muted};
    box-shadow: none;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.12em;
  }
  .fx-cell,
  .fx-empty {
    min-height: 52px;
    padding: 4px;
    border: 0;
    background: transparent;
  }
  .fx-control { gap: 6px; min-height: 44px; }
  .fx-cell .fx-btn,
  .fx-audio-toggle {
    min-height: 44px;
    border: 1px solid ${CHRONICLE_DARK.controlBorder};
    border-radius: 10px;
    background: ${CHRONICLE_DARK.elevated};
    color: ${CHRONICLE_DARK.controlText};
    box-shadow: ${CHRONICLE_DARK.buttonShadow};
    font-size: 12px;
    font-weight: 700;
    transition: background 150ms ease, border-color 150ms ease, color 150ms ease, transform 100ms ease, filter 150ms ease;
  }
  .fx-cell .fx-btn:hover,
  .fx-audio-toggle:hover { background: ${CHRONICLE_DARK.elevatedHover}; }
  .fx-cell .fx-btn:active,
  .fx-audio-toggle:active { transform: scale(0.985); }
  .fx-cell .fx-btn.on,
  .fx-audio-toggle.on {
    border-color: #3b82f6;
    background: #3b82f6;
    color: #fff;
    box-shadow: 0 2px 8px rgba(59,130,246,0.35);
  }
  .fx-audio-toggle {
    flex-basis: 44px;
    min-width: 44px;
    padding: 0;
    color: #b9c9dc;
  }
  @media (max-width: 760px) {
    .effects-panel-header { padding: 10px 14px; font-size: 16px; }
    .effects-panel-body { padding: 12px; }
    .effects-panel-tray { padding: 14px 12px 16px; }
    .effects-grid { gap: 6px 8px; }
    .effects-col-label { font-size: 9px; letter-spacing: 0.08em; }
    .fx-cell, .fx-empty { padding: 2px; }
    .fx-control { gap: 3px; }
    .fx-cell .fx-btn { padding: 7px 3px; font-size: 10px; line-height: 1.15; }
    .fx-audio-toggle { flex-basis: 34px; min-width: 34px; }
  }
`;
