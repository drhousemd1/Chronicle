# Chronicle R&D mock-up workspace

- Created: 2026-08-10
- Last edited: 2026-08-16

Files in this directory support Chronicle's Admin-only prototype workspace. The R&D host is implemented Admin behavior. The mock-ups displayed inside it are design and research material, not evidence of implemented Chronicle product behavior.

The editable surface is one ordered white document. Text is stored as plain-text blocks and dropped JPEG, PNG, or WebP files are referenced by image blocks. A desktop image dropped on a text block is inserted beneath that text and can be dragged to another block position. Do not add an image-import button, image gallery, visible note container, or browser-stored HTML.

## Prototype lifecycle and production isolation

R&D prototypes are isolated from production, but they are not disposable. Production adoption, replacement, cleanup, or a production rewrite does not authorize retirement or deletion of the reference prototype. Retire or delete a prototype only when the user directly instructs that named lifecycle outcome.

Production code must not import or depend on prototype code, local prototype state, or generated R&D artifacts. Tests may verify that isolation, but they must not encode inferred prototype absence as success. A production implementation and the reference prototype may coexist so the experiment remains available for comparison.

Editable metadata, text blocks, and image changes autosave to IndexedDB after a 500 ms quiet period as a temporary recovery copy. The top-right Save button is the durable action: it writes `docs/research-development/mockups/<stable-id>/mockup.json` plus original images through the loopback-only Vite middleware. On load, repository records are merged with local recovery records and the newer `contentUpdatedAt` wins. Keep Save one-click with no dialog, confirmation, inline success text, or repository-path message. The button may say `Saving...` during the write, then returns to `Save`; only a failure remains visible. `Add New Mock-up` and Save belong in Chronicle's shared white application header, with Add immediately left of Save; never reintroduce Add as a navigation-rail button. The rail reuses Story Builder's `#2a2a2f` base, `#3c3e47` header and row surfaces, and `#5a7292` to `#4a5f7f` section-header gradient.

Every created mock-up page renders the same protected shell immediately below its metadata divider, even before coded source is registered. Keep that shell limited to the App Style Guide's three-part structure: a thin gradient title/source strip, one preview field, and a collapsed white `Component Details` row. The header's only extra controls are four compact background swatches—white, light gray, medium gray, and charcoal—that change the preview field alone and persist per mock-up. Blank records leave the preview field visually empty. Do not add a background toolbar or dropdown, badges, instructional placeholder cards, copy controls, nested trays, or alternate shell variants. The ordinary editable notes and dropped reference images remain below the protected shell.

## Adding a coded mock-up

1. Ask the user to create or select the R&D page, then read its stable mock-up ID from the `Component Details` record or saved workspace manifest.
2. Inventory the ordinary UI families the mock-up needs—buttons, inputs, toggles, tables or control grids, shells, headers, navigation, cards, and status treatments—before writing their markup or styles.
3. Search the live Chronicle source and the App Style Guide for the same core purpose or shape. Reuse the actual Chronicle component or its presentational contract first. Use an established R&D component only when no suitable Chronicle component exists. A new visual pattern is the final option, not the default.
4. Create the mock-up implementation under `src/components/admin/research-development/prototypes/<mock-up-name>/`.
5. Register that same stable ID in `rnd-registry.tsx` with its default title, purpose, source dates, source path, coded `Preview`, factual `details`, and a `uiPrecedents` entry for every ordinary UI family used.
6. Put only the coded preview and current factual implementation or styling record in the registry definition. Keep brainstorming, comments, rough wording, and reference images in the user-editable workspace.

## UI precedent contract

Mock-ups can differ in composition and purpose. Their ordinary interface elements must still begin from Chronicle's existing visual and component language.

Use this order:

1. Import an existing Chronicle component directly.
2. If the production component is coupled to live state, extract or use a presentational adapter that keeps the established markup, states, spacing, typography, layering, and interaction treatment.
3. If Chronicle has no suitable component, reuse an accepted shared R&D pattern.
4. Create a new pattern only when the first three options do not fit. Mark it as `new-pattern` in `uiPrecedents` and state why the searched precedents were unsuitable.

Do not copy a button, table, toggle, shell, or input into a prototype and then restyle it independently. Shared purpose requires a shared component or shared style contract. Prototype-specific scene art, effect layers, spatial composition, and other experiment content may remain bespoke.

The accepted dark-surface values and application/chat button classes live in `src/components/chronicle/chronicle-dark-ui.ts`; their React surfaces live in `src/components/chronicle/ChronicleDarkUi.tsx`. The shared R&D effect-control panel in `rnd-effects-control-ui.tsx` is a presentational adapter of the production Character Builder section shell and Chat Settings control-row and selection contracts. Those production components remain the source precedents. Future effect controls may reuse the adapter only while retaining those source mappings; do not cite an R&D adapter as its own sole precedent.

One saved R&D page may contain more than one protected experiment when the experiments belong to the same investigation. Keep the first coded `Preview` as the primary shell and register later experiments through `additionalSections`; the host renders each entry with the same `RndPrototypeShell` directly below the previous one. Do not draw a shell inside a prototype. Additional sections share the saved page's contrast background selection, while each section owns its own title, source dates, source path, coded preview, factual details, and render-error boundary.

Always use `ResearchDevelopmentTool` and `RndPrototypeShell`. Do not reproduce the host layout inside a prototype, create a standalone HTML mock-up, store HTML or JSX in browser data, or treat R&D content as the production implementation of a Chronicle feature. The shared preview field owns the presentation boundary; its selected background provides contrast only and must never change the prototype's own styles.

## Generated prototype artifacts

Large generated files used by a coded experiment belong under `docs/research-development/generated/<prototype-name>/`, not in `public/` and not in the application bundle. During local development, the loopback-only R&D middleware may expose an allowlisted generated HTML, JavaScript, JSON, or Markdown file beneath `/__rnd-repository/generated/`.

Generated visualizations must use locally stored runtime scripts, render inside a restricted iframe, and record the generator version, scan scope, freshness, and known limits in Component Details. These files are local research evidence only. They do not prove implemented Chronicle behavior or current live-database state.
