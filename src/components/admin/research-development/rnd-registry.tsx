import type { RndPrototypeDefinition } from "./rnd-types";
import { GraphifyChronicleMapPreview } from "./prototypes/graphify-chronicle-map/GraphifyChronicleMapPreview";
import { ChatEffectsLayerPreview } from "./prototypes/sound-effects-visual-overlays/ChatEffectsLayerPreview";
import { SoundEffectsVisualOverlaysPreview } from "./prototypes/sound-effects-visual-overlays/SoundEffectsVisualOverlaysPreview";
import { StoryOpeningScreenPreview } from "./prototypes/story-opening-screen/StoryOpeningScreenPreview";

/**
 * Source-controlled mock-ups are registered here. The R&D host owns the shared
 * shell, notes editor, preview field and background swatches, and factual-details accordion.
 * Individual definitions supply only the coded preview and factual record.
 */
export const RND_PROTOTYPE_DEFINITIONS: readonly RndPrototypeDefinition[] = [
  {
    id: "7765bb8f-ef75-4b70-afd1-489a9c5bae6d",
    defaultTitle: "Sound Effects & Visual Overlays",
    defaultPurpose:
      "Test visual overlays and attached sound effects on Chronicle character cards and behind chat message bubbles.",
    createdAt: "2026-08-10T06:23:28.258Z",
    sourceUpdatedAt: "2026-08-16T06:00:00.000Z",
    sourcePath:
      "src/components/admin/research-development/prototypes/sound-effects-visual-overlays/",
    uiPrecedents: [
      {
        element: "Character-card tile",
        sourcePath: "src/components/chronicle/ChatInterfaceTab.tsx",
        reuseMethod: "presentational-adapter",
        note: "Preserves the approved prototype behavior while retaining Chronicle's live character-tile visual vocabulary.",
      },
      {
        element: "Effect-control section shell",
        sourcePath: "src/features/character-builder/sections/HardcodedSection.tsx",
        reuseMethod: "presentational-adapter",
        note: "Uses the production Character Builder hierarchy: one full-width slate header, a dark outer shell, body padding, and one recessed inner tray.",
      },
      {
        element: "Effect group labels, control rows, and selected states",
        sourcePath: "src/components/chronicle/ChatInterfaceTab.tsx",
        reuseMethod: "presentational-adapter",
        note: "Uses Chat Settings category typography, neutral raised control rows, and solid-blue selected states.",
      },
    ],
    Preview: SoundEffectsVisualOverlaysPreview,
    details: (
      <div className="space-y-3">
        <p>
          Migrated from the first character-card effects section of the preserved
          <span className="font-mono"> chronicle-character-card.html</span> prototype.
        </p>
        <p>
          The expandable Aria card, edit menu, visual-effect controls, health states,
          toxic cough selection, and all thirteen attached audio clips retain their
          source behavior. The supporting effects table uses Chronicle surfaces and
          control styling without changing those connections.
        </p>
      </div>
    ),
    additionalSections: [
      {
        id: "chat-effects-layer-test",
        title: "Chronicle Chat Effects Layer Test",
        createdAt: "2026-08-15T23:45:57.000Z",
        sourceUpdatedAt: "2026-08-17T02:47:00.000Z",
        sourcePath:
          "src/components/admin/research-development/prototypes/sound-effects-visual-overlays/ChatEffectsLayerPreview.tsx",
        uiPrecedents: [
          {
            element: "Chat shell, quick actions, and composer",
            sourcePath: "src/components/chronicle/ChatInterfaceTab.tsx",
            reuseMethod: "presentational-adapter",
          },
          {
            element: "Effect-control section shell",
            sourcePath: "src/features/character-builder/sections/HardcodedSection.tsx",
            reuseMethod: "presentational-adapter",
          },
          {
            element: "Effect group labels, control rows, and selected states",
            sourcePath: "src/components/chronicle/ChatInterfaceTab.tsx",
            reuseMethod: "presentational-adapter",
          },
        ],
        Preview: ChatEffectsLayerPreview,
        details: (
          <div className="space-y-3">
            <p>
              Migrated from the later Chronicle Chat Effects Layer Test in the preserved
              <span className="font-mono"> chronicle-character-card.html</span> prototype.
              The chat frame is rebuilt with Chronicle's current sidebar, message-bubble,
              and composer styling instead of using full rail and composer screenshots.
            </p>
            <p>
              The scene-wide effect layer remains between the bedroom scene and the HTML
              conversation bubble. The original canvas Rain and its sound remain intact;
              a second Rain control adds the generated silent video for direct comparison
              and reuses the existing rain-without-thunder audio. The remaining mapped
              visual effects, unmapped Dead state, effect-audio mappings, and two selectable
              Toxic cough voices retain the source interaction model.
            </p>
          </div>
        ),
      },
    ],
  },
  {
    id: "65007876-4e40-4713-92fd-fb017068fae1",
    defaultTitle: "Story Opening Screen",
    defaultPurpose:
      "Prototype an optional story-opening scene with an image, setup text, visual treatments, audio, and a transition into the Chronicle chat interface.",
    createdAt: "2026-08-22T08:19:25.255Z",
    sourceUpdatedAt: "2026-08-22T08:30:00.000Z",
    sourcePath:
      "src/components/admin/research-development/prototypes/story-opening-screen/",
    uiPrecedents: [
      {
        element: "Opening-screen section shell, field layering, and selected controls",
        sourcePath: "src/features/story-builder/StoryBuilderScreen.tsx",
        reuseMethod: "shared-style-contract",
        note: "Uses the current Story Builder slate header, dark outer shell, recessed tray, input treatment, and solid-blue selected state.",
      },
      {
        element: "Opening image upload and empty-media interaction",
        sourcePath: "src/features/story-builder/components/StoryCardSection.tsx",
        reuseMethod: "presentational-adapter",
        note: "Carries the current Story Builder media action pattern into a drag-and-drop prototype control.",
      },
      {
        element: "Dark prototype shell and raised action buttons",
        sourcePath: "src/components/chronicle/ChronicleDarkUi.tsx",
        reuseMethod: "direct",
        note: "Directly reuses ChronicleDarkShell and ChronicleSurfaceButton rather than defining another R&D control family.",
      },
      {
        element: "Chat arrival frame and message-bubble geometry",
        sourcePath: "src/components/chronicle/ChatInterfaceTab.tsx",
        reuseMethod: "presentational-adapter",
        note: "Uses Chronicle's existing chat presentation classes and current scene layout vocabulary for the coded destination frame.",
      },
    ],
    Preview: StoryOpeningScreenPreview,
    details: (
      <div className="space-y-3">
        <p>
          Migrated from the Story Opening Screen section of the preserved
          <span className="font-mono"> Mockup HTML reference exam, for single use.html</span>
          prototype. The opening text, three placements, eight visual styles, six
          stackable image treatments, optional audio, and eight transitions remain
          available as working local prototype controls.
        </p>
        <p>
          The legacy opening image, chat-reference image, and audio clip were not present
          beside the supplied HTML, so the coded prototype uses an intentional neutral
          opening field and a Chronicle-source-backed chat arrival frame instead of broken
          placeholders. Preview state is temporary; the R&amp;D page's existing Save action
          remains the only repository persistence control.
        </p>
      </div>
    ),
  },
  {
    id: "6f290eb9-a458-4dbf-bd2d-b12da34b2ac7",
    defaultTitle: "Chronicle Repository & Database Map",
    defaultPurpose:
      "Evaluate Graphify's interactive repository and schema maps against Chronicle's checked-in code before considering wider integration.",
    createdAt: "2026-08-29T19:58:36.000Z",
    sourceUpdatedAt: "2026-08-29T19:58:36.000Z",
    sourcePath:
      "src/components/admin/research-development/prototypes/graphify-chronicle-map/",
    uiPrecedents: [
      {
        element: "Map-view controls and dark surface",
        sourcePath: "src/components/chronicle/ChronicleDarkUi.tsx",
        reuseMethod: "direct",
        note: "Uses Chronicle's existing dark shell and raised surface buttons around the generated map.",
      },
      {
        element: "Interactive repository and dependency visualization",
        sourcePath:
          "docs/research-development/generated/graphify-chronicle-map/graph-tree.html",
        reuseMethod: "new-pattern",
        note: "Preserves Graphify's generated visualization instead of redrawing a lookalike map in React.",
      },
    ],
    Preview: GraphifyChronicleMapPreview,
    details: (
      <div className="space-y-3">
        <p>
          Generated locally with Graphify 0.9.52 from Chronicle's checked-in
          TypeScript, TSX, JavaScript, JSON, and SQL files. The map includes the
          repository's Supabase functions, migrations, and schema snapshots, but it
          does not connect to or describe the current live Supabase database.
        </p>
        <p>
          Chronicle Areas adds a deterministic product-ownership layer above Graphify's
          automatic communities. It groups individual nodes from repository paths, keeps
          each Graphify community visible underneath its Chronicle area, and sends mixed
          or unmatched structures to Shared / Cross-cutting instead of forcing a page
          assignment. The original repository tree, full dependency graph, and community
          overview remain available unchanged.
        </p>
        <p>
          Community names were derived locally from each cluster's dominant source path
          without using an external model or API. Generated files are served only by the
          loopback R&amp;D development middleware and are not imported into Chronicle's
          production bundle.
        </p>
      </div>
    ),
  },
];

const DEFINITION_BY_ID = new Map(
  RND_PROTOTYPE_DEFINITIONS.map((definition) => [definition.id, definition]),
);

export function getRndPrototypeDefinition(id: string): RndPrototypeDefinition | undefined {
  return DEFINITION_BY_ID.get(id);
}
