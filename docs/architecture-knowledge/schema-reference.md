# Overview

## Supabase Schema Reference at a Glance

The Supabase Schema Reference is Chronicle’s administrator-facing catalog of database tables, storage buckets, and the fields associated with them. It connects a technical field name to its purpose, sensitivity, access expectations, and the place it affects the application. It is intended to answer “What is this stored value for, and who is supposed to use it?” without requiring a reader to decipher a migration first.

The current page renders a checked-in reference dataset. It does not connect to Supabase to discover the schema on each visit, edit tables, change policies, or display users’ stored rows. The distinction matters because some source descriptions contain the words “Live RLS access.” Those are recorded descriptions in the dataset, not the result of a live check performed by this page.

## Finding an Object

The left navigation lists tables and storage objects. Search narrows both the navigation and the visible object cards. The All, Tables, and Storage buttons limit the object type. Selecting a jump link moves to that object’s card, while the active navigation item follows the card being read.

Search is case-insensitive and matches object names and kinds, field names and types, categories, sensitivity, exposure, access actors, UI-use labels, and application locations. It does not search the prose in Purpose or Access / Security Rationale, including individual field-purpose descriptions. It filters whole objects; it does not remove nonmatching rows from an object’s field table. The visible count therefore counts matching objects, not matching fields or live database records.

## Reading a Card

Each object starts with its name and kind, followed by its Purpose and Access / Security Rationale. The field table then explains each column or bucket entry. In addition to data type and purpose, it shows Data Category, Sensitivity, Raw Backend Exposure, Read, Write, Update, Delete, Feeds Front-End UI, and App Location.

These are complementary descriptions. Sensitivity describes the consequences of exposing the information. Raw Backend Exposure describes whether an ordinary user should be able to obtain the underlying row or file outside the curated interface. The access columns identify actors such as Owner, Admin, Signed-in, Public, System, or None. A field can support an internal process without directly appearing on a screen, which is why Feeds Front-End UI and App Location are separate from access.

## Legend and Consistent Vocabulary

View Legend opens the page’s definitions for sensitivity, raw exposure, actor labels, visible use, and application location. Read, Write, Update, and Delete describe who acts; they are not the place for statuses such as Published. The legend is a key for interpreting the catalog, not a permission editor.

The object’s explanation is most useful alongside its capability’s written architecture. The catalog describes fields and access expectations; the capability manual explains the user action and service flow that use those fields. This tool manual explains how to read and maintain the reference without copying the complete catalog into another place.

## Maintenance and Confidence

Reference content lives in `src/data/supabase-schema-reference.ts`. Updating that source changes what the page displays. Page-local search, legend visibility, and collapsed cards do not alter the dataset and are not saved to the database.

The current interface has no schema refresh button, synchronization timestamp, or drift comparison against the deployed database. A missing object can mean that the maintained reference is incomplete; it does not establish that the object is absent from Supabase. Likewise, a described policy is not proof that the current deployment enforces it. No live database inspection was performed to create this tool manual.

# UI Elements and Functions

## Browse Controls

**Search objects or fields** trims the entered query and compares it case-insensitively with each object’s generated search text. Clearing the query restores the current type-filtered list. **All**, **Tables**, and **Storage** select the object category and expose their selected state to assistive technology.

The navigation groups matching objects by type. A jump link uses the object’s stable page ID. The highlighted object follows viewport visibility through an intersection observer; it is a reading aid, not a database selection.

## Object Cards

Each card displays the object name and kind. **Collapse section** hides that card’s detailed explanation and field matrix; **Expand section** restores it. Collapsed state is independent for each object and is held only in the current page session.

The matrix uses code styling for field names and technical types, and labeled value styling for sensitivity, exposure, actors, and UI use. Labels retain their meaning even when color alone is not distinguishable. Storage objects use the registered Bucket field label; tables use Column.

## Legend, Count, and Empty State

**View Legend** and **Hide Legend** toggle the reference key above the object stack. The button exposes its expanded state. **Showing … objects** reports the filtered object count. When no object matches the combined query and type filter, the page says so explicitly; it does not report a backend failure.

The header’s Back control returns to Admin Panel. There are no Save, Delete Table, Apply Policy, or Run Migration controls. Browsing and expanding cards are local reading operations.

# App Architecture

## Protected Entry

Admin Panel opens `/style-guide/supabase-schema-reference`. `src/App.tsx` mounts the page behind `AdminOnlyRoute`, using the authenticated user and administrator check. The reference component itself owns browsing state, not authorization rules or a separate database session.

## Dataset and Search

`schemaReferenceObjects` is imported from `src/data/supabase-schema-reference.ts`. Its typed objects contain stable IDs, names, table-or-storage classification, Purpose, Access / Security Rationale, and field rows. `getSchemaReferenceSearchIndex` combines the object’s reference strings for searching. The page memoizes the visible object selection from the query and type filter, then derives table and storage navigation groups from that same result.

## Rendering and Local State

`SchemaCard` renders an object, its two explanatory sections, and the complete matrix. `SchemaRow` and its cell helpers format technical strings and access values. `SchemaLegend` supplies the interpretive key. A set of collapsed IDs determines which cards show detail. An intersection observer watches the currently visible cards and updates the active jump link; its observers are disconnected when the selection changes or the page unmounts.

No fetch, Supabase table query, schema mutation, or save operation is part of this page’s content path. Its behavior is dataset → local filter → navigation and cards. Deployed schema verification and changes belong to separately authorized maintenance work.

### Inspected Source Paths

```text
src/App.tsx
src/pages/Admin.tsx
src/pages/style-guide/supabase-schema-reference.tsx
src/data/supabase-schema-reference.ts
src/services/app-settings.ts
src/hooks/use-auth.ts
```

# Supabase Tables

## Described Objects Are Not Queried Objects

The tool describes many Supabase tables and storage objects but does not read their live rows to render the catalog. Its reference source is the checked-in TypeScript dataset. Search and card visibility have no database writes.

## Access Dependency

The route’s administrator gate depends on the existing authentication and `has_role` check. The Admin hub may separately load presentation overrides from `app_settings`. Neither dependency is a schema inventory or a source of the field matrix.

## Where to Find Field Detail

Use the [Supabase Schema Reference](/style-guide/supabase-schema-reference) for the maintained object and field descriptions, and the relevant capability’s Supabase Tables tab for its data-flow explanation. A change to the catalog is a documentation change; applying a migration or changing RLS is a separate live-system operation. The reference does not perform either on the reader’s behalf.
