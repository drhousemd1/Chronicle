# Overview

## Chronicle Knowledge Base at a Glance

The Chronicle Knowledge Base is the administrator’s reference for understanding the application: what each area is for, what its controls do, how its implementation fits together, and where recorded problems, database references, and completed changes belong. It is a reading surface over maintained repository documents and records, not a second database of application behavior.

Chronicle Overview introduces the whole application. The capability sections explain the product itself. Administration & Maintenance documents the internal tools used to operate and develop Chronicle. These serve different questions even though they share one page.

## From a Product Question to Its Source

Begin with a section’s Overview for the complete mental model. UI Elements and Functions explains the visible controls and their consequences. App Architecture follows the real owners and handoffs behind those controls, with a repository graph at the top and the written explanation below. Supabase Tables explains the relevant storage relationship. Issues records known problems and audit findings; Changelog records meaningful completed changes.

The written explanations are maintained Markdown files. The page’s manifest assigns each file and heading to a section and tab. This means an agent can read the same underlying document that a person sees in the application; the visible manual is not independently rewritten copy.

## The Architecture Maps

In local development, Chronicle Overview contains the global repository map. Individual architecture tabs show smaller filtered views of the same private graph artifact. The circles and connections help locate areas, source groups, and extracted relationships; selecting and exploring them provides supporting source evidence. The production application does not include this private graph and instead displays an availability notice; its written manuals remain readable.

A graph describes relationships extracted from the allowlisted local checkout snapshot, including eligible uncommitted and untracked source files. It does not establish the intended product behavior, prove that a request succeeded, or inspect a live Supabase deployment. The written architecture remains necessary to explain meaning and responsibility. When the graph is stale or unavailable, its state must remain visible rather than being silently treated as current.

## Manuals, Records, and Evidence Have Different Jobs

A stable manual describes how an area works. An Issue records a verified problem or audit finding with its explanation and supporting evidence. Recording an Issue does not start a project or require progress paperwork. A Changelog entry records a meaningful completed change, not a running task diary or a list of test runs. A test receipt records what a particular check actually observed.

Current Work has been retired. Its old records are retained as historical reference, not active assignments or instructions to resume work. Issues and Changelog stand on their own; neither requires a Current Work project. Opening a tab does not create a record, run a test, or approve a result. The Validation Evidence Ledger has its own narrower roleplay evidence projection, documented in its tool section.

## Reading and Maintenance

The page is behind the application’s administrator route guard. Its controls select tabs, navigate to documents or records, and explore the graph. There is no in-page editor or Save operation for these manuals. Documentation changes are made in the repository and are rendered through the registered source heading. Issue and Changelog records are maintained separately when the assigned work calls for them.

The review and update dates identify documentation metadata. They are not a statement that every related tool, deployed database policy, or historical claim was rechecked at that moment. A tool can be documented accurately while still being unfinished.

## Current Boundaries

The page is a maintained reference, not an automatic audit of the running application. Source changes can make a written explanation outdated until it is reviewed. Graph freshness and document review dates are separate signals. A missing graph does not erase the written manual, and a current graph does not certify the prose. Administrative tool record tabs point to shared records instead of creating new issue or history systems for each tool.

# UI Elements and Functions

## Section Titles and Tabs

Each section uses the same heading, description, pill-style tab selector, and dark reading panel. Selecting a tab changes that section’s content. The section and tab in a supported deep link select the requested destination, allowing another person or agent to reopen the same part of the manual.

Overview is the explanatory starting point. UI Elements and Functions is the control reference. App Architecture combines the graph and written implementation explanation in one place. Issues and Changelog expose findings and completed changes, or their canonical shared destination. Supabase Tables provides the storage explanation appropriate to the section.

## Download a Reference Copy

The header's Download menu offers HTML and Markdown. Both formats include every registered manual in full, including inactive tabs, followed by the shared table reference, repository Issues, historical work records, and canonical Changelog records. Historical work records retain their original context and are not instructions for ongoing work. Each source document appears once. The copy records its export time and the manifest's reviewed revision; the latter is documentation metadata, not a fresh Git HEAD check.

HTML renders the actual Knowledge Base page components and embeds their existing styles and reference images. It preserves the header, section layout, tab bars, dates, dark reading panels, and complete content of every tab. Tabs and internal links work offline; linked source records remain available without adding a separate report or contents list above the page. Graph views are visual snapshots of their current loaded state, not live explorers or proof of a deployed system. Markdown is a text-focused version for search and LLM conversations, mechanically converted from the same complete source snapshot; image captions remain, while image bytes stay in the HTML version. Live database/application data and the contents of separately linked tools or external files are not included. The download creates a private reference copy on the device, not a new source authority or an automatic upload to another service. Review it before sharing.

Selecting a format opens the operating system's Save As dialog when the browser supports it, initially suggesting Desktop. Choose a filename and destination, then Save. Chronicle prepares the content after the destination is chosen and reports success only after the file write completes. Canceling the chooser stops the operation without a download or error message.

Browsers without this API, or whose security policy blocks it, show a Save Knowledge Base dialog with the prepared filename, Download file, and Open file instead. These links remain available while the dialog is open. The browser controls the download location; Chronicle reports a download request, not confirmed disk storage. Open the page in a supporting browser such as Chrome or Edge to use the native destination chooser.

Preparing or saving a file temporarily disables Download. If an HTML reference image cannot be loaded or a file write fails, the page reports the failure instead of claiming the file was saved; the user can retry. No repository record or live data is modified by exporting.

## Dates and Record Counts

Ordinary manual tabs show their recorded review and update dates. Issue counts on capability tabs come from the registered operational records rather than a number written into the prose. Shared administrative record references do not display a parent count as though it were a count of problems in that particular tool.

## Architecture Explorer

The global explorer offers Chronicle Areas, Repository Tree, Dependency Graph, Community Overview, and Recorded History. Capability views start with the relevant filtered area. Search and selection narrow the view; pan, zoom, reset, and source details support inspection without replacing the written explanation. Recorded History reads canonical Changelog information; it does not create graph-owned history.

## Record Links and Navigation

Issues show the recorded problems and their supporting context. Changelog links open the full completed-change record. Existing links to historical work records open their retained source text; they do not reactivate those assignments. The header’s Back control returns to Admin Panel.

## Unavailable and Restricted States

The administrator guard withholds the page while access is being resolved and redirects visitors who lack access. The graph owns its loading, stale, unavailable, empty, and error presentation. A record view with no registered entries is not proof that the related product has no defects. Reading this page never initiates a provider request or a validation run.

# App Architecture

## Route and Composition

`src/App.tsx` mounts the protected Knowledge Base route. `chronicle-knowledge-base.tsx` composes the registered sections using `KnowledgeSwitcher`, resolves requested tabs from the URL, and routes content by its registered kind. It also handles the architecture-map, Changelog, and archive navigation paths.

## Repository Documents to Visible Content

`docs/architecture-knowledge/manifest.json` identifies each section, its source document, and the heading for each tab. `manifest.ts` imports the Markdown as raw text, parses its top-level headings, and returns the matching section to the renderer. `KnowledgeMarkdown` handles normal text, tables, links, and the registered images. Roleplay Pipeline retains its specialized document renderer for its accepted stage layout.

Administration & Maintenance sections use the same switcher and Markdown presentation. Their record references lead to existing shared sources; registering a tool manual does not create an Issue or Changelog entry.

## Architecture Evidence

`CapabilityArchitecture` places `RepositoryGraphView` above the written architecture. The graph client requests the local private graph projection. The lens configuration identifies the inspected paths belonging to each manual; the graph service resolves those paths against the normalized source artifact and reports freshness and unavailable data. This is the same graph infrastructure used by the global map, not a separately authored diagram for each tool.

## Operational Sources and History

The operational source loader derives the Issue registry from repository records. Capability selection filters those findings before rendering. Changelog loading and the record route use the canonical Changelog sources, including correction relationships, rather than the old Quality Hub copy. Historical work records remain readable through their existing links, but they do not supply an active work registry or a Current Work tab. The reading page does not create or update these records.

### Inspected Source Paths

```text
src/App.tsx
src/pages/Admin.tsx
src/pages/style-guide/chronicle-knowledge-base.tsx
src/components/admin/knowledge-base/KnowledgeSwitcher.tsx
src/components/admin/knowledge-base/CapabilityArchitecture.tsx
src/components/admin/knowledge-base/RepositoryGraphView.tsx
src/components/admin/knowledge-base/RoleplayPipelineDocument.tsx
src/components/admin/knowledge-base/OperationalRecordContent.tsx
src/data/chronicle-knowledge-base/manifest.ts
src/data/chronicle-knowledge-base/knowledge-routes.ts
src/data/chronicle-knowledge-base/operational-record-sources.ts
src/data/chronicle-knowledge-base/changelog-record-sources.ts
src/data/chronicle-knowledge-base/repository-graph-client.ts
```

# Supabase Tables

## The Manual Is Repository-Backed

The Knowledge Base does not save its section prose in a Supabase table. Its documents, manifest, Issues, historical work records, and Changelog are repository sources. The private graph artifact is also separate from the deployed database. Loading a schema explanation or a graph node is not a query against the described table.

## Administrator Access

The surrounding route uses the authenticated user and the administrator check through `has_role`. That is an access dependency, not document storage. The Admin hub’s title and thumbnail overrides are stored separately in `app_settings` under `admin_tool_meta`; those overrides do not change the manual’s content or authority.

## Relationship to the Schema Reference

The capability Supabase tabs explain why a product area uses its tables. The [Supabase Schema Reference](/style-guide/supabase-schema-reference) provides the field-level catalog. Neither surface is an automatic live permission probe. Current deployed claims require their own source-backed verification when the task actually depends on them.
