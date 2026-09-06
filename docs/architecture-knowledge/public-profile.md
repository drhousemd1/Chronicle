# Overview

## Public Profile at a Glance

Public Profile is Chronicle’s creator-facing identity capability. It gives an authenticated creator one place to manage the information other people may see, while visitors receive a dedicated page for that approved public view. The capability connects a creator identity to a display name, biography, avatar, preferred genres, aggregate Gallery statistics, published works, and follower relationships.

The capability has two surfaces with different authority. The **Public Profile** tab inside Account edits the signed-in person’s profile. The `/creator/:userId` route reads another creator’s public profile and published work. A visitor-facing page must respect the creator’s privacy choices and must not expose editable controls or private account fields.

## Profile Information and Privacy

The editable profile contains a display name, **About Me** text, an avatar and its position, preferred genres, **Hide Profile Details**, and **Hide Published Works**. The outer Account header owns the **Save** action registered by the profile tab. Saving updates the current user’s profile row; it does not alter their email, subscription, stories, or publication records.

**Hide Profile Details** makes the visitor-facing profile private. **Hide Published Works** keeps the public identity visible while withholding the published-work section. These are distinct choices. The editing view continues to show the owner’s information so it can be changed; the public route applies the visibility settings to visitors.

## Avatar and Genre Management

The creator can upload an avatar, choose an image from the existing library path, request an image through the avatar-generation dialog, reposition the selected image, or remove it through the available avatar actions. Uploaded or generated images are normalized before the profile row stores the public URL. Repositioning changes the crop coordinates rather than creating another identity.

Preferred genres are a creator-supplied list. The editor adds a non-empty genre only when it is not already present and lets the owner remove existing entries. These values describe the creator’s interests; they do not automatically classify or alter published stories.

## Published Works and Statistics

The owner view loads the creator’s visible published stories and their content-theme and publisher-presentation data. It also loads aggregate counts for published stories, likes, saves, views, and plays. The creator can open a published story’s details, like or save it, and start a playthrough through the same Gallery service boundaries used elsewhere.

The visitor route displays the creator’s public works unless the creator hides them. An authenticated visitor can follow or unfollow another creator, and the page displays the follower count with the other aggregate statistics. A creator’s own profile does not display a follow control.

## Loading, Empty, and Failure States

The editable profile remains in a loading state while profile, statistics, and published-work queries are assembled. An empty published list shows **No published works yet**. The visitor route distinguishes a missing profile from a private profile. Those states are not interchangeable: one means no visible profile row could be loaded, and the other is an explicit privacy choice.

Some current write failures are logged rather than surfaced through a dedicated visible error panel. That is an implementation limitation, not evidence that the save succeeded. A spinner, changed local field, or updated counter proves only the current interface state until the persistence operation completes successfully.

## Handoffs and Evidence Limits

Account & Subscription owns entry to the editable tab and the top-level Save action. My Stories and Story Builder own the reusable story source. Community Gallery owns publication discovery and the shared published-story interactions. Public Profile owns the creator identity and visibility choices, then hands Play to the normal new-session path.

Source inspection confirms the current form, public route, profile queries, published-work presentation, and following boundaries. It does not prove live row-level policies, storage policies, RPC definitions, or deployed visibility enforcement. The **Supabase Tables** tab is a synchronized reference with explicit limits rather than live-deployment proof.

# UI Elements and Functions

## Editable Profile

- **Public Profile** contains the current avatar and the profile editing fields.
- **Display Name** changes the name shown on the public creator surface.
- **About Me** changes the creator biography.
- **Preferred Genres** adds unique non-empty labels and lets the creator remove existing labels.
- **Hide Profile Details** marks the visitor-facing profile as private.
- The Account top-bar **Save** action persists the editable fields. While the registered operation is active, the button displays **Saving...**

## Avatar Controls

- The avatar actions support an uploaded file, an existing image-library selection, and the avatar-generation dialog.
- **Reposition** changes the visible crop using pointer or touch movement. Leaving reposition mode saves the position.
- A new avatar resets the stored position to the center before the creator adjusts it.
- Loading and generation indicators must remain tied to the operation that started them and must clear after success or failure.

## Published Works

- **Hide Published Works** controls whether visitors receive the creator’s published-work section.
- The statistics row shows Likes, Published, Saved, Views, and Plays for the current creator.
- Published story cards provide Like, Save or Unsave, Play, and detail actions through the shared Gallery behavior.
- Opening a story records a view and opens the shared story-detail dialog.
- **No published works yet** is the explicit empty state.

## Visitor-Facing Creator Page

- `/creator/:userId` displays the selected creator’s public identity rather than the signed-in account editor.
- **Go back** returns through browser navigation.
- **Follow** and **Unfollow** are available to an authenticated visitor viewing another creator.
- The page shows **Profile not found** when no readable profile exists and **This profile is private** when the visibility setting requires it.
- The creator’s own page omits the follow control.

## Current Failure Presentation

The current editor logs several profile and avatar write failures to the console instead of presenting a complete visible recovery message. Likewise, publication interaction failures do not all share one error panel. This manual records those boundaries without claiming that silence is successful recovery. A future behavior change should provide a visible, action-specific result without merging unrelated writes.

# App Architecture

## Application Entries

The `src/pages/Index.tsx` file renders `PublicProfileTab` under the `account` application tab when the account subtab is `profile`. `AppShellTopBar` renders the Account navigation and supplies the profile **Save** button through a registered callback. Separately, `src/App.tsx` registers `/creator/:userId` for `CreatorProfile`, the visitor-facing read surface.

The editor and public page intentionally share concepts but not mutation authority. `PublicProfileTab` can update only the signed-in user’s profile through its supplied user ID. `CreatorProfile` reads the route’s user ID, applies public visibility, and exposes follow behavior for another signed-in visitor.

## Profile Reads and Writes

The editor reads `profiles`, calls `get_creator_stats`, and queries the current publisher’s visible `published_scenarios`. It then loads related `content_themes` and publisher-presentation data before mapping the result into the shared `PublishedScenario` shape. The registered **Save** callback updates the signed-in profile’s editable fields.

Avatar files are resized or compressed before upload to the `avatars` storage bucket. The resulting public URL is written to the profile row. Image-library and generated-image choices converge on the same upload/update boundary. Position changes update `avatar_position` separately when repositioning ends.

## Published-Work Interactions

The owner editor delegates published-story Like, Save/Unsave, Play, and View operations to `src/services/gallery-data.ts`. It updates local sets and counters after successful operations and hands Play to Index so the normal scenario-start boundary remains authoritative. `GalleryStoryCard` and `StoryDetailModal` provide the shared presentation.

The visitor route queries published work for the selected creator and uses `creator_follows` for the signed-in visitor’s following relationship. The deployed database remains responsible for preventing a visitor from reading or modifying data outside their authority.

## Privacy Boundary

The `hide_profile_details` setting prevents the visitor route from presenting the normal profile body. The `hide_published_works` setting conditionally removes only the works section. Application checks express the intended UI behavior; live privacy still depends on deployed database policies and callable functions, which were not verified here.

### Inspected Source Paths

```text
src/App.tsx
src/pages/Index.tsx
src/pages/CreatorProfile.tsx
src/components/account/PublicProfileTab.tsx
src/components/chronicle/AvatarActionButtons.tsx
src/components/chronicle/AvatarGenerationModal.tsx
src/components/chronicle/GalleryStoryCard.tsx
src/components/chronicle/StoryDetailModal.tsx
src/components/app-shell/AppShellTopBar.tsx
src/hooks/use-auth.ts
src/services/gallery-data.ts
src/integrations/supabase/client.ts
```

## Verification Limit

This account was checked against the listed repository sources on September 4, 2026. It establishes the current editable and visitor-facing surfaces, saved fields, visibility decisions, image handoffs, Gallery interactions, and follow boundary. It does not prove deployed RLS, storage policies, RPC behavior, or successful live persistence.
