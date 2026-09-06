import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

import type {
  PreviewBackground,
  RndMockupRecord,
  RndPrototypeDefinition,
  RndPrototypeSectionDefinition,
} from "./rnd-types";

const PREVIEW_BACKGROUND_OPTIONS: ReadonlyArray<{
  id: Extract<PreviewBackground, "paper" | "light" | "slate" | "charcoal">;
  label: string;
  className: string;
}> = [
  { id: "paper", label: "White", className: "bg-white" },
  { id: "light", label: "Light gray", className: "bg-[#d4d4d8]" },
  { id: "slate", label: "Medium gray", className: "bg-[#71717a]" },
  { id: "charcoal", label: "Charcoal", className: "bg-[#1a1a1e]" },
];

function normalizePreviewBackground(background: PreviewBackground) {
  if (background === "ink") return "charcoal";
  if (background === "checkerboard") return "light";
  return background;
}

interface PreviewBoundaryState {
  failed: boolean;
}

class PreviewBoundary extends React.Component<React.PropsWithChildren, PreviewBoundaryState> {
  state: PreviewBoundaryState = { failed: false };

  static getDerivedStateFromError(): PreviewBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error): void {
    console.error("R&D coded preview failed to render:", error);
  }

  render() {
    if (this.state.failed) {
      return (
        <div role="alert" className="max-w-lg rounded-2xl border border-rose-400/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
          This coded preview could not render. The surrounding notes and factual record are still available.
        </div>
      );
    }
    return this.props.children;
  }
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

interface RndPrototypeShellProps {
  mockup: RndMockupRecord;
  definition?: RndPrototypeDefinition;
  section?: RndPrototypeSectionDefinition;
  isEditingDisabled?: boolean;
  onBackgroundChange: (background: PreviewBackground) => void;
}

export function RndPrototypeShell({
  mockup,
  definition,
  section,
  isEditingDisabled = false,
  onBackgroundChange,
}: RndPrototypeShellProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const Preview = section?.Preview ?? definition?.Preview;
  const sectionKey = section?.id ?? "primary";
  const sectionTitle = section?.title ?? (mockup.displayTitle || "Untitled Mock-up");
  const sectionSourcePath = section?.sourcePath ?? definition?.sourcePath;
  const sectionDetails = section?.details ?? definition?.details;
  const sectionUiPrecedents = section?.uiPrecedents ?? definition?.uiPrecedents ?? [];
  const titleId = `rnd-protected-title-${mockup.id}-${sectionKey}`;
  const selectedBackground = normalizePreviewBackground(mockup.previewBackground);
  const selectedBackgroundClassName =
    PREVIEW_BACKGROUND_OPTIONS.find((option) => option.id === selectedBackground)?.className ??
    "bg-[#1a1a1e]";

  return (
    <section
      aria-labelledby={titleId}
      data-rnd-mockup-id={mockup.id}
      data-rnd-prototype-section={sectionKey}
      className="w-full overflow-hidden rounded-[4px] border-2 border-black bg-white"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black bg-gradient-to-b from-[#5a7292] to-[#4a5f7f] px-[18px] py-2.5 text-white">
        <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2
            id={titleId}
            className="min-w-0 truncate text-[13px] font-black uppercase tracking-[0.08em]"
          >
            {sectionTitle}
          </h2>
          <p className="min-w-0 truncate text-[11px] text-white/75">
            {sectionSourcePath ?? "Protected mock-up preview"}
          </p>
        </div>

        <div role="group" aria-label="Preview background" className="flex shrink-0 items-center gap-2">
          {PREVIEW_BACKGROUND_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-label={`Use ${option.label.toLowerCase()} preview background`}
              aria-pressed={selectedBackground === option.id}
              title={option.label}
              disabled={isEditingDisabled}
              onClick={() => onBackgroundChange(option.id)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                onBackgroundChange(option.id);
              }}
              className={cn(
                "h-5 w-5 rounded-full border border-white/70 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-[#4a5f7f] disabled:cursor-not-allowed disabled:opacity-50",
                option.className,
                selectedBackground === option.id &&
                  "ring-2 ring-white ring-offset-1 ring-offset-[#4a5f7f]",
              )}
            />
          ))}
        </div>
      </header>

      <div
        role="region"
        aria-label={section ? `${section.title} protected mock-up preview` : "Protected mock-up preview"}
        className={cn(
          "flex min-h-[340px] items-center justify-center overflow-auto border-b-2 border-black p-5 sm:p-8",
          selectedBackgroundClassName,
        )}
        data-testid={section ? `rnd-preview-canvas-${sectionKey}` : "rnd-preview-canvas"}
      >
        {Preview ? (
          <PreviewBoundary key={`${mockup.id}-${sectionKey}`}>
            <Preview />
          </PreviewBoundary>
        ) : null}
      </div>

      <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              setDetailsOpen((open) => !open);
            }}
            className="flex w-full items-center justify-between bg-white px-[18px] py-2.5 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#555] transition-colors hover:bg-[#f9f9f9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5a7292]"
          >
            <span>Component Details</span>
            <ChevronDown
              className={cn("h-5 w-5 text-[#888] transition-transform duration-200", detailsOpen && "rotate-180")}
              aria-hidden="true"
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-[#e0e0e0] bg-white px-[18px] py-5 text-sm leading-relaxed text-[#27272a] sm:px-[22px]">
            <div className="space-y-4">
              <dl className="grid gap-3 border-b border-[#e4e4e7] pb-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Mock-up ID</dt>
                  <dd className="mt-1 break-all font-mono text-[11px]">{mockup.id}</dd>
                </div>
                {definition ? (
                  <>
                    <div>
                      <dt className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Source created</dt>
                      <dd className="mt-1 text-xs font-semibold">{formatDate(section?.createdAt ?? definition.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Source updated</dt>
                      <dd className="mt-1 text-xs font-semibold">{formatDate(section?.sourceUpdatedAt ?? definition.sourceUpdatedAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Source owner</dt>
                      <dd className="mt-1 break-all font-mono text-[11px]">{sectionSourcePath}</dd>
                    </div>
                  </>
                ) : null}
              </dl>
              {sectionUiPrecedents.length > 0 ? (
                <section aria-labelledby={`${titleId}-precedents`} className="border-b border-[#e4e4e7] pb-4">
                  <h3
                    id={`${titleId}-precedents`}
                    className="text-[10px] font-black uppercase tracking-widest text-zinc-500"
                  >
                    UI precedents
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {sectionUiPrecedents.map((precedent) => (
                      <li key={`${precedent.element}-${precedent.sourcePath}`} className="text-xs leading-relaxed">
                        <span className="font-bold text-zinc-800">{precedent.element}</span>
                        <span className="text-zinc-500"> · {precedent.reuseMethod}</span>
                        <span className="block break-all font-mono text-[10px] text-zinc-500">
                          {precedent.sourcePath}
                        </span>
                        {precedent.note ? <span className="mt-0.5 block text-zinc-600">{precedent.note}</span> : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {sectionDetails ? (
                sectionDetails
              ) : (
                <p className="text-zinc-600">No component details have been added yet.</p>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
