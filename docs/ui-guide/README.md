# Chronicle UI Guide

This is the page-specific visual reference for designing new Chronicle UI. The Admin Panel's **Chronicle UI Guide** tile opens `/style-guide/chronicle-ui-guide`. All published regional references appear one after another on this single page, like Chronicle's Knowledge Base. Each retains its own seven tabs and reading panel; there is no region selector.

The page and the coding-agent reader use the same Markdown source, registered in `catalog.json`. Edit the registered region's Markdown to maintain its text. Figures, color swatches and collapsible supporting source retain a small amount of HTML for the rendered manual. There is no separately editable exported guide and no in-document jump navigation.

## Read it for a coding task

From the Chronicle repository:

```sh
npm run -s ui-guide:read -- --list
npm run -s ui-guide:read -- story-builder
npm run -s ui-guide:read -- story-builder --section fields,panels,mockups --images --json
npm run -s ui-guide:read -- character-builder --section fields,panels,mockups --images --json
npm run -s ui-guide:read -- character-library --section fields,panels,mockups --images --json
npm run -s ui-guide:read -- my-stories --section fields,panels,mockups --images --json
npm run -s ui-guide:read -- community-gallery --section fields,panels,mockups --images --json
npm run -s ui-guide:read -- image-library --section fields,panels,mockups --images --json
npm run -s ui-guide:read -- chat-history --section fields,panels,mockups --images --json
npm run -s ui-guide:read -- active-roleplay --section fields,panels,mockups --images --json
npm run -s ui-guide:read -- account-access --section fields,panels,mockups --images --json
npm run -s ui-guide:read -- creator-profile --section fields,panels,mockups --images --json
npm run -s ui-guide:read -- admin-panel --section fields,panels,mockups --images --json
npm run -s ui-guide:read -- admin-workspaces --section fields,panels,mockups --images --json
```

The reader returns plain Markdown without the frontend's navigation, framing HTML or source disclosures. Construction fragments stay beside their recipes. `--full-source` also includes the complete supporting implementations. A selected section automatically includes Overview, Color Palette, and Typography & Spacing so its shared foundations are available. Unknown pages or sections fail explicitly.

Use the user's intended interaction to select the relevant patterns, carry their styling and states into the design, and adapt the arrangement to the new content. Existing examples, proposed teaching combinations and caller responsibilities remain distinguished in the guide. Check named product owners when an interface or its styling has changed since the guide's review date.

## Images without frontend navigation

Original PNG files live under `src/assets/ui-guide/<region>/`. The Markdown retains captions and repository-relative image paths. `--images --json` returns the relevant images' absolute local paths, dimensions, captions and narrow-layout variants alongside the text; load the needed files with an image-reading tool, batching related specimens where the tool supports it. No browser, UI click, running server or network request is required.

Markdown text does not itself supply image pixels to an agent. The image-reading tool supplies those pixels. Do not treat a caption or filename as evidence that an image was inspected. The reader checks registered images against their hashes and reports missing or changed assets instead of silently dropping them.

## Maintaining and extending coverage

`catalog.json` identifies each guide's document, image manifest, revision dates, and seven sections. Add another page only with its own reviewed source and explicit page-specific styling differences. The renderer and reader consume the same registration. Images use an asset manifest so their identity and dimensions can be checked independently of the prose.

`story-builder.migration.json` records the accepted mockup's identity and the migrated code/image counts. The original standalone mockup remains a reference artifact outside the production path. `examples/composition-examples.tsx` is supporting example source only; the application does not import or execute it. Its documented local-state limitations remain applicable.

The 09/10/2026 repository-wide `knowledge:check` run reports stale inspected-source composites for Character Library, Story Builder and Character Builder. Substituting only the pre-existing Roadmap import/route out of `src/App.tsx` reproduces all three recorded composites; the other listed source bytes match those snapshots. This expansion does not refresh those capability-review fingerprints or claim a new Roadmap review. Guide-specific content, image, page and protected-route checks are tracked separately.

## Application regions

Story Builder remains the unchanged formatting reference. Each region uses its seven-section structure. The catalog is the source of published coverage; this is a representative styling menu, not an exhaustive component database.

| Region ID | Reference | Styling covered |
| --- | --- | --- |
| `story-builder` | Story Builder | Preserved original: authoring surfaces, fields, actions, menus and composition examples. |
| `character-builder` | Character Builder | Selected character editor, identity fields, repeated sections and overlays. |
| `character-library` | Character Library | Browsing grid, cards, library actions and selection/removal presentation. |
| `my-stories` | My Stories | Story hub, details and background appearance. |
| `community-gallery` | Community Gallery | Discovery, public story detail, reviews and confirmation surfaces. |
| `image-library` | Image Library | Folder/image browsing, labels, editing and media preview. |
| `chat-history` | Chat History | Saved-session rows, fallback/empty presentation and confirmations. |
| `active-roleplay` | Active Roleplay | Conversation sidebar, transcript, composer and presentation settings. |
| `account-access` | Account & Access | Account fields, editable profile, subscriptions and authentication surfaces. |
| `creator-profile` | Creator Profile | Public identity, read-only information, ratings and custom published-work posters. |
| `admin-panel` | Admin Panel | Tool launchers, tile metadata editor and shared header actions. |
| `admin-workspaces` | Admin Workspaces | Representative asset configuration, light status, dark operations/records and R&D notebook styling. |

These twelve references cover the main application regions and representative Admin workspace families. They do not enumerate every tool, field or component.

The page-specific recipes identify actual shared components, local styling, caller responsibilities, visible states and adaptable dimensions. Main application chrome is inherited, not redesigned for each reference. Character Library and Character Builder share an owner file but document different surfaces.

## Reference illustrations and limits

Figures show imported components or explicitly identified source-derived visual fragments with fixed illustrative content. Teaching examples are labeled as proposed combinations; files under `examples/` are supporting reference source and are not mounted as product features. Capture provenance records the owners, imported versus reproduced markup, local data boundaries and image identity. A source hash proves file identity, not complete review or current production behavior.

Earlier work also exercised local interactions. Those historical observations do not make product workflow testing a requirement for writing or maintaining these references. Continue by checking styling against its source, proofreading the construction guidance and inspecting the document presentation. Do not expand reference maintenance into application behavior tests, simulated service failures, a new test harness or unrelated certification.

Existing layout limitations remain stated beside the affected patterns. For example, the current Active Roleplay sidebar and Creator Profile identity row are fixed-width, and some authentication/Admin forms can exceed a short viewport. New compositions may adapt layout while retaining the specified visual language. These references do not change those production components or prove remote persistence, authentication, billing, generation, uploads, publication or permissions.
