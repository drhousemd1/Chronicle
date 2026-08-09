# Overview

## Chronicle at a Glance

### What Is Chronicle?

Chronicle is a story-authoring, discovery, publishing, and persistent roleplay platform. It gives people the structure to create an original world, define its characters and starting situation, play through that material as an ongoing conversation, and return to the same playthrough later. It also lets people discover stories shared by other creators, save them for later, begin their own playthroughs, and create separately owned adaptations when the creator permits it.

The application is divided into capabilities that handle different parts of that experience. My Stories organizes the user’s owned and saved stories. Story Builder defines the reusable story source. Character Library and Character Builder manage reusable and story-specific characters. My Images manages reusable visual material. Community Gallery handles public discovery. Chat Interface runs the active playthrough, and Chat History returns the user to a particular conversation. Public Profile represents the creator publicly, while Account handles private account settings.

### Persistent Roleplay Built from Authored Sources

Chronicle is designed for playthroughs that develop over time rather than isolated prompts followed by disposable answers. The authored story remains the reusable starting source, while each conversation develops its own accepted messages, scene progression, time, memories, character conditions, relationships, and goal progress. Later responses should continue the particular version of events established in that conversation instead of repeatedly rebuilding the experience from a loose character description.

Persistence does not mean that every stored detail should appear in every response. Chronicle uses the authored story, the player’s latest action, accepted conversation history, relevant character knowledge, and current playthrough state according to their purpose. The result should feel continuous and specific to the current moment without turning into a summary of everything the application knows.

### Adult and NSFW Material Is First-Class Story Data

Chronicle supports adult and explicitly sexual roleplay as ordinary creator-authored material. Anatomy, sexual interests, power dynamics, relationship boundaries, explicit dialogue, and other NSFW details can belong to a story, a character, a content warning, or the evolving conversation. The application should preserve those details accurately rather than silently softening valid material merely because it is explicit.

That support does not erase privacy or knowledge boundaries. A private detail can be stored without being published. A content warning can describe the presence of sensitive material without revealing hidden story information. The application can know a fact that the current character has not learned. Chronicle must preserve both the user’s control over who can access the material and the story’s control over who is permitted to know it.

## Creating and Owning a Story

### Story Creation Has More Than One Entry Point

A creator can begin in My Stories and choose to create a story, or open Story Builder directly from Chronicle’s main navigation. My Stories is the personal story library: it helps the user find owned drafts, completed stories, published stories, and stories saved from Community Gallery. Story Builder is the authoring workspace where a new idea becomes a structured Chronicle story.

Whichever entry point the creator uses, the story should enter the same ownership lifecycle. The user should be able to save the work, return to it from My Stories, continue editing it, add characters and visual material, prepare it for play, and decide whether to publish it. Moving between My Stories and Story Builder must not create a second story or detach the work from its owner.

### What the Story Source Contains

A Chronicle story is the reusable authored source from which play begins. It includes the story’s identity and description, premise, structured and freeform world information, locations, opening dialogue, starting day and time, scenes, content themes, goals, cast, control assignments, artwork, and roleplay-facing settings. These fields are not decorative metadata around a single prompt. They are separate sources with different roles in validation, publication, display, and runtime context selection.

Story Builder assembles and edits that source. It gives the creator a place to explain the central situation, define the world, establish important locations, select the cast, decide who controls each character, write the opening exchange, add longer-term direction, classify the content, and choose the imagery that represents the story. Saving, closing, reopening, exporting, publishing, and starting play should all preserve the same authored story rather than dropping whichever parts happen to be stored somewhere else.

### Draft, Play-Ready, and Published Describe Different Milestones

A draft is an owned work in progress that the creator can continue shaping. A play-ready story contains enough starting material for Chronicle to begin a coherent conversation. A published story has also been deliberately made available for public discovery. Reaching one milestone should not silently imply the others: private authoring does not make a story public, and publishing does not turn another user’s later playthrough into part of the creator’s source.

Completion checks should help the creator understand what is still needed for the next action. A story may need a usable premise, cast, opening situation, content classification, description, and representative imagery before it is ready for a particular destination. Those requirements should be presented as preparation for the selected action, not as proof that every story must be written in one rigid way.

### Authored Source and Playthrough State Must Remain Separate

The story defines the reusable starting conditions. A conversation records what occurs during one playthrough. If a character changes clothing, reveals a secret, moves somewhere new, develops a relationship, or makes progress toward a goal, that change belongs to the active conversation unless the creator deliberately edits the story source. Starting another conversation from the same story should recreate the authored starting point, not inherit every event from a previous session.

This boundary works in both directions. Playthrough events should not silently rewrite the reusable source, and later changes to the source should not be presented as events that already happened in an existing conversation. The story and its conversations stay connected so the application knows their shared origin, but each conversation remains its own developing version of events.

## Publishing, Discovery, and Reuse

### Publishing Makes a Story Discoverable Without Transferring Ownership

Publishing is the creator’s deliberate decision to make a story available for community discovery. The creator remains the owner of the editable source, while the published version supplies the public title, description, cover, creator identity, classifications, warnings, and playable story material that other people are permitted to access.

Publishing should be a clear boundary. The creator needs to understand what becomes visible, which story is being published, and how later updates or removal from the Gallery affect public availability. Publication should never expose private drafts, private conversations, account information, or unrelated library material simply because they belong to the same user.

### Community Gallery Is the Public Discovery Surface

Community Gallery presents public stories with the information a player needs to evaluate them before acting: cover art, title, creator, description, content type, genres, warnings, engagement, publication options, and available actions. Search, sorting, category filters, following state, saved and liked state, and NSFW visibility controls narrow the catalog. Opening Story Detail provides more information; it does not by itself save, copy, edit, or start the story.

The Gallery is a discovery surface, not the authority for private story ownership or conversation state. It receives public publication data and hands later responsibilities to other capabilities. Save hands the relationship to My Stories. Play hands runtime control to Chat Interface. A creator profile link hands identity and published-work discovery to Public Profile.

### Save, Play, and Create an Owned Remix Copy Mean Different Things

Save creates a relationship between the user and a publication so the story can be found again from My Stories. It does not transfer ownership and does not create an editable duplicate. The saved entry still represents another creator’s published work, so actions available from My Stories must continue to respect that ownership.

Play creates a new conversation based on the story exposed through the publication. It does not grant edit rights. Editing another creator’s saved story creates a new user-owned story before Story Builder persists changes. This overview calls that result an owned remix copy. It is the correct boundary for customization because changes made by the new owner must never overwrite the publisher’s source.

### An Owned Remix Copy Must Be Genuinely Independent

A creator decides whether other users may adapt a published story. When adaptation is permitted, Chronicle creates a separately owned story rather than opening the publisher’s source for editing. The new owner can then change the premise, characters, world information, imagery, and other story material without modifying what the original creator owns.

Independence includes the complete story, not only its title and main record. The copied story needs its own identity, ownership, characters, world information, classifications, scenes, and durable media. It must remain usable if the original publication later changes or disappears, and deleting the copy must not remove the source from which it was created.

## Characters and Visual Identity

### Characters Are Structured Story Participants

A Chronicle character can include identity, nicknames, age, sex, sexual orientation, appearance, clothing, personality, history, relationships, fears, secrets, voice, goals, custom creator-written sections, and visual identity. The creator also determines whether the user or the AI controls the character and whether the character is part of the principal cast or a supporting participant. These assignments affect validation, builder behavior, and the roleplay sources available at runtime.

A character is more than a paragraph pasted into every response request. Stable authored attributes explain who the person is at the beginning, while conversation-specific conditions explain what has changed during one playthrough. Chronicle should preserve that distinction so an evolving relationship, injury, outfit, location, or newly learned fact can affect the active conversation without silently rewriting the reusable character definition.

### Character Builder Has Library and Story Contexts

Character Builder edits the same broad kind of character information in two ownership contexts. Character Library stores reusable personal characters that are not tied to one story. A character inside Story Builder belongs to that story’s cast and can be customized for that scenario. The required behavior is copy independence: changing a story character must not rewrite the reusable library source, and later library edits must not unexpectedly alter a story that was already built.

Moving a character between those contexts is an explicit copy operation. Adding a library character to a story creates story-owned material that can be tailored to that setting. Saving a story character to Character Library creates a reusable personal version. In both directions, the destination receives an independent character rather than a hidden live link to the source.

### Conversation-Created Characters Belong to the Playthrough

Roleplay can introduce supporting characters who were not part of the original cast. Chronicle can assign them an identity and maintain conversation-specific information about their presence, condition, knowledge, and relationships. Because those people emerged from a particular sequence of events, their default home is the conversation that introduced them rather than the reusable story source.

The existence of side-character support does not authorize arbitrary invention. Chronicle still has to distinguish who the character is, who controls them, what established information they may use, and which conversation produced their current state. A newly generated participant must not overwrite a principal character or inherit private information merely because both are available to the application.

### My Images Is the Private Reusable Media Library

The manual calls this capability My Images; the current runtime navigation calls it Image Library. It stores private reusable media with folders, titles, tags, upload, search, and deletion. Its purpose is not to make private storage public. It gives users a durable source from which covers, avatars, scenes, and profile imagery can be selected for a specific destination.

Selecting an image for a story, character, scene, or profile gives that destination a durable use of the chosen media. The destination should not depend on a temporary preview or on the continued existence of an unrelated library view. Once the handoff succeeds, the image belongs to the destination’s lifecycle while the reusable library original remains available for other uses.

### Selected and Generated Images Belong to Their Destination

Chronicle can use existing library media or request newly generated imagery, but the consuming capability decides what the result means. A story cover represents the story. A character portrait represents that character. A scene image represents a location or moment. A profile image represents the creator. The image operation supplies visual material; it does not decide the destination’s ownership or privacy.

The same visual source can be reused in more than one place without making those destinations the same object. Each destination must retain the image it needs, apply the correct privacy rules, and decide what happens when the story, character, scene, profile, or original library item is later changed or deleted.

## Playing and Returning to a Story

### Play Creates a New Conversation from the Current Story Source

Starting play uses the selected story’s premise, cast, world information, opening situation, starting time, scenes, classifications, and roleplay settings to create a new conversation. Chronicle gives that conversation its own identity and opens it in Chat Interface. The story supplies the starting source; the conversation becomes the home of everything that happens afterward.

Starting the same story again creates a separate playthrough rather than reopening or overwriting an earlier one. Each conversation can develop different messages, relationships, discoveries, character conditions, and outcomes while still pointing back to the same authored starting material.

### Every Playthrough Has Its Own Identity

A conversation is identified by more than the story title or cover shown beside it. Chronicle must preserve the selected story, the specific conversation, the accepted message history, and the evolving state that belongs to that session. Similar names or shared artwork cannot be used as substitutes for the identities that distinguish one playthrough from another.

This identity follows the conversation across Chat Interface and Chat History. When the player leaves and returns, Chronicle should reopen the same sequence of events rather than start a new session, select another conversation from the same story, or combine state from two different playthroughs.

### Chat Interface Turns the Setup into an Ongoing Scene

Chat Interface combines the player’s latest action with the relevant story material, accepted conversation, current scene and time, character knowledge, memories, goals, and conversation-specific state. The resulting response should continue the immediate situation from what the player actually established rather than summarize the setup, replay the player’s action, expose hidden information, or force every stored detail into the same exchange.

The interface also gives the player the controls needed to manage the conversation: send a new action, replace an unwanted response, ask the assistant to continue, delete messages, create scene imagery, review available context, and leave or return without losing which conversation is active. Each control must preserve the meaning of the action the player selected.

### Send Starts a Response to a New Player Turn

Send begins a response to a new player-authored turn. The player’s message becomes part of the conversation, and Chronicle uses it as the immediate authority for what the player just said, attempted, or established. The assistant response should react to that action without rewriting it or inventing a different player decision.

Once the response is accepted into the conversation, later turns treat that exchange as part of the playthrough’s history. The player should see a clear pending state while Chronicle is responding and a clear recoverable outcome if the response cannot be produced.

### Retry Replaces a Rejected Assistant Generation

Retry asks Chronicle to replace an assistant response the player rejected. It is anchored to the same player turn and valid preceding context, but the rejected wording does not become accepted story history or a hidden example for the replacement to imitate. The operation changes the assistant’s answer; it does not create another player action.

The replacement should preserve established facts and the player’s original action while providing a genuinely new response. After Retry completes, the conversation must have one clearly accepted version of that assistant turn so later roleplay does not alternate between rejected and replacement outcomes.

### Continue Extends an Accepted Assistant Response

Continue asks the assistant to extend the current assistant turn without requiring another player message. It begins from the accepted response already at the end of the conversation and adds more description, dialogue, action, or immediate development from that same moment. It must not invent a new player decision merely to keep the scene moving.

If the most recent assistant response was deleted and the conversation now ends on the player turn that originally requested it, recovery should create a replacement response from that surviving player action. In either case, Chronicle must understand whether the user is extending accepted assistant text or restoring a missing answer rather than treating Continue as a generic Send button.

### Accepted History Defines What Happened

The visible transcript can contain player turns, accepted assistant responses, notices, deleted material, replacements, and private instructions. Those entries do not all have the same meaning. Chronicle must distinguish the conversation that the player accepted from text that was rejected, removed, or intended only as private direction.

Later responses should use enough accepted recent history to preserve the current scene without allowing discarded text to re-enter as established events. Older events that remain important can be carried forward through durable memories and reviewed state rather than forcing the full transcript into every new response.

### Chat History Returns to One Specific Playthrough

Chat History lists the user’s saved conversations with enough information to recognize them, such as the story, conversation title, recent activity, message count, and latest visible exchange. Choosing one should reopen that exact playthrough with its accepted messages and conversation-specific state.

Deleting a conversation removes that playthrough rather than the reusable story that created it. The story remains available for editing or for starting another conversation, while the deleted session no longer appears as something the user can resume.

## How Chronicle Uses AI

### Different AI Operations Serve Different Product Purposes

Chronicle uses AI for live roleplay, builder assistance, image generation, memory extraction, goal review, character-state review, and support for characters introduced during play. These operations can share provider infrastructure, but they do not have the same input, output, or authority. A roleplay response becomes visible conversation history, while a builder suggestion remains a proposal until the creator chooses to apply it.

The capability that requested the operation decides what happens to the result. Story Builder decides whether suggested material becomes part of the story. Character Builder decides whether proposed details change a character. My Images or the requesting destination decides where generated media belongs. Chat Interface decides how a completed roleplay response enters the active conversation.

### Context Selection Gives Each Source a Clear Role

Creator-authored facts, the latest player action, accepted conversation history, current state, memories, character knowledge, and goals can all contribute to roleplay, but they serve different purposes. Chronicle should select the information needed for the current response rather than sending every available record indiscriminately.

The latest player turn controls what the player just did. Accepted conversation establishes what has happened in this playthrough. The story source supplies reusable starting facts. Current state and memories preserve durable developments. Goals provide long-range direction when they are relevant; they do not require visible progress in every response. Keeping those roles clear helps the model continue the present moment without allowing background material to override the player.

### Character Knowledge Is Narrower Than Application Knowledge

Chronicle can know a fact for continuity or orchestration without granting that fact to the current speaker. Private reference material, another character’s secret, a hidden goal, or a proposed state update may be available to the application while remaining unavailable for character dialogue or decision-making. Knowledge visibility is therefore a runtime authorization problem, not a writing-style preference.

The system must consider who established a fact, whether it is accepted for this conversation, which characters witnessed or learned it, and whether the current speaker is allowed to use it. A response can be fluent and still be wrong if a character acts on information they have never received.

### Post-Turn Support Can Affect Future Turns Only

After a turn becomes part of the conversation, support operations can preserve information needed later. They can identify durable memories, record meaningful movement toward a goal, review character-state changes, and maintain conversation-specific information about supporting characters.

These operations prepare future context. They do not rewrite the response that caused them or make an inaccurate response correct after the player has already seen it. Their value is that a later turn can remember what changed without repeatedly sending the entire conversation back through the roleplay model.

### AI Performs Operations Within Chronicle’s Product Rules

The model produces text, structured suggestions, or media, but it does not decide ownership, privacy, accepted history, player control, or which capability may change a record. Chronicle defines those rules before and after the AI operation so a plausible model output cannot silently transfer ownership, expose private material, or overwrite the player’s action.

A useful result must be applied to the right object and the right lifecycle. A memory belongs to a conversation, a builder proposal belongs to the creator’s draft until accepted, a generated portrait belongs to the selected character, and a roleplay response belongs to the action that requested it. Product behavior remains the authority even when several operations use the same underlying model provider.

## Ownership, Public Identity, and Privacy

### Related Story Objects Are Not Interchangeable

The creator’s story is the editable source. A publication is a public visibility relationship to that source. A saved-story record is another user’s bookmark. An owned remix copy is a separately owned story created for editing. A conversation is one evolving playthrough. Messages are entries within that conversation, and assistant generations identify which version of a response is currently accepted. Similar titles and artwork do not merge these identities.

This distinction changes the meaning of familiar actions. Gallery Save creates or removes a bookmark. Story Builder Save or Save Draft preserves an owned source. Editing another creator’s saved story creates an owned remix copy. Gallery Play creates a conversation without granting source ownership. Chat History Delete removes a playthrough, while deleting an owned story removes the reusable source. The interface must make the target of each action clear before the user commits it.

### Public Profile Represents the Creator

The Public Profile tab inside Account edits creator-facing data such as display name, biography, avatar, preferred genres, and privacy controls. The separate Creator Profile route renders the permitted public view of that identity, including profile information, engagement statistics, published works, and follow or unfollow controls. The viewer-facing route does not expose private drafts, conversations, reusable characters, or private image-library contents.

Profile privacy choices apply wherever the public identity is consumed. Hiding profile details limits what other users can learn about the creator. Hiding published works removes those stories from public discovery surfaces rather than merely hiding one block on the profile page. The creator should see a consistent public result no matter where another user encounters the profile.

### Account Handles Private User Administration

Account Settings manages private account-level information such as the signed-in email, password, session, and account actions. Subscription presents the user’s current tier and the plans available to them. These controls belong to private account administration rather than the creator identity shown publicly.

Authentication and account identity determine which private records the user may own or retrieve, but authentication is not the same as publication permission, story ownership, or character knowledge. A user can be signed in and still lack authority to edit another creator’s source. Conversely, a public Gallery visitor can read deliberately published material without gaining access to the creator’s private account data.

### Private Material Remains Private Until a Deliberate Handoff

Draft stories, personal characters, image-library originals, conversations, account records, memories, and conversation-specific state are private user data. Displaying that material to its owner inside Chronicle does not make it public. A deliberate action such as publishing a story or updating a public profile must define exactly which material crosses into a public destination.

The public destination receives only what it needs for its purpose. Community Gallery can present and play a published story without exposing the creator’s drafts or conversations. Public Profile can represent the creator without exposing private account settings. A roleplay model can receive relevant story context without granting every character knowledge of every fact.

## What a Coherent Chronicle Experience Requires

### Every Handoff Must Preserve Identity, Ownership, and State

A successful handoff carries more than display text. It preserves the identifiers, owner, permissions, durable source data, and current state the next capability needs. The destination must be able to reopen and act on the same object without reconstructing identity from a title, preview image, or temporary URL.

The receiving capability becomes responsible for the next lifecycle. After Save, My Stories presents the saved relationship and provides its removal workflow. After Play, Chat Interface manages the new conversation. After a character or image is selected, the destination story, character, scene, or profile manages how that material is used.

### The User Should Always Understand What Happened

Each action needs a visible outcome that matches the user’s intent. Saving should preserve work that can be reopened. Publishing should make the chosen story discoverable. Playing should open the correct conversation. Retrying should replace the unwanted response. Deleting should identify whether it will remove an owned source, a saved relationship, a conversation, a message, or an image.

When an action takes time, Chronicle should show that it is still working without allowing duplicate submissions. When nothing exists yet, the empty state should explain what can be created or discovered. When an action cannot finish, the user should see what was not completed, retain any work that can be recovered, and receive an appropriate way to try again.

### What Success Looks Like

When Chronicle works correctly, a creator can build and preserve a detailed adult story, deliberately publish it with a clear understanding of which source and related records become readable, and remain its owner. Another user can discover that story, understand its content, bookmark it, start a separate playthrough, or create an authorized, independently owned remix copy without modifying the source. Reusable characters and images cross into stories through explicit copy boundaries rather than invisible shared ownership.

During play, the current scene advances from the player’s actual action and accepted history. Characters use only information available to them, durable state changes survive into later turns, rejected responses do not become accepted context, and Send, Retry, Continue, and deleted-response recovery retain their distinct meanings. Separate conversations remain separate, and public and private material stay within their intended boundaries.

# Community Gallery

## Community Gallery

### Community Gallery is Chronicle’s public story catalog

Community Gallery is where people browse stories that creators have deliberately published for other Chronicle users to discover. It is not a view of every story stored in Chronicle, and it is not a shared editing space. Each result is a public presentation of a creator-owned story: enough information to understand what the story offers, decide whether its content is appropriate, learn who created it, and choose whether to inspect, like, save, review, or play it.

The page supports two different levels of access. Anyone can browse the public catalog, search it, filter it, open a story’s details, read reviews, and visit the creator’s public profile. Like, Save, and writing or changing a review require a signed-in account because they create activity tied to one user. If a signed-out visitor selects one of those actions, Chronicle opens its authentication interface and leaves the publication unchanged until the user signs in and requests the action again.

Play has a different guest handoff. Selecting Play while signed out takes the visitor to the selected story’s read-only Chat Interface preview and then asks them to sign in. The visitor can see where the story will be played, but cannot send a message or create a persisted playthrough until authentication is complete. A signed-in Play creates a fresh conversation that belongs only to that player.

Nothing done while browsing grants ownership of the creator’s original story. Liking records appreciation. Saving adds the publication to the viewer’s saved stories in My Stories. Playing starts a separate conversation based on the story. An editable indicator means the creator permits a custom copy to be made through the later My Stories and Story Builder flow. Those actions are intentionally different because a public publication, a saved relationship, an owned copy, and a roleplay conversation are different things inside Chronicle.

### The page header changes which part of the catalog is being viewed

The application header identifies the current workspace as **Community Gallery**. Beside that title is a six-option selector. These options work together with search and category filters; choosing one does not clear the other criteria already applied.

-   **All Stories** shows the general published catalog.
-   **Recent** orders eligible publications by publication date, with the newest stories first.
-   **Liked** ranks publications by their total number of likes. It is a popularity sort, not a private list containing only stories the current viewer has liked.
-   **Saved** ranks publications by total saves. It does not mean “my saved stories”; that personal collection belongs in My Stories.
-   **Played** ranks publications by total play count.
-   **Following** limits results to stories published by creators the signed-in viewer follows, then presents those results newest first. If the viewer follows nobody, or those creators have no eligible publications, the page explains that there are no stories from followed creators and directs the viewer to follow creators. Following a creator itself happens from the creator-profile experience, not from a Gallery card.

The right side of the header contains the **Hide NSFW** or **Show NSFW** toggle. This is a presentation preference for the current device. It controls whether adult cover art and NSFW details may be shown; it never changes how the creator classified a story. The complete age-confirmation behavior is described below.

### Search accepts ordinary language and hashtags in one field

The primary search field is labeled **Search titles, descriptions, or #tags**. Words entered normally are used to search public story titles and descriptions. A token beginning with a hash mark is treated as a publication tag instead: for example, entering a normal phrase and one or more hashtags applies the phrase as text search and the hashtags as tag criteria at the same time. Tag matching is normalized to lowercase before the request is made.

Search updates shortly after typing stops, using a brief delay so the Gallery does not send a new request for every keystroke. Pressing Enter applies the current query immediately. Once any text has been entered, an X button appears at the right side of the field. Selecting it clears the typed query, the parsed text search, and every hashtag derived from that field.

Search does not replace category filtering. A viewer can search for words or hashtags and simultaneously limit the results by story type, genre, origin, or trigger warning. The Gallery combines all of those choices into one result request.

### Browse Categories opens the Gallery’s complete filter interface

The **Browse Categories** button opens a 280-pixel filter panel on the left side of the Gallery. Its grid icon identifies it as the catalog-navigation control, its chevron indicates whether the panel is open, and a count badge appears whenever category filters are active. While the panel is open, the same header at the top of the panel closes it. Opening or closing the panel changes the available page width but does not discard the current query or scroll results back to their defaults.

The panel supports multiple selections. Selecting an option adds it to the active criteria; selecting the same option again removes it. Options within a category are combined as eligible matches for that category, while selections from different categories are applied together. The panel shows a **filters active** total and a **Clear all** action whenever at least one category option has been selected.

#### Story Type

Story Type is open when the panel first appears. It contains **SFW** and, when the viewer has enabled adult visibility, **NSFW**. When NSFW visibility is off, NSFW is removed from this filter list. Turning adult visibility off also removes an already-selected NSFW story-type filter so the interface cannot silently retain a criterion the viewer can no longer see.

#### Genre

Genre is also open by default. Its current options are **Fictional**, **Fantasy**, **Romance**, **Dark Romance**, **Why Choose**, **Reverse Harem**, **Gothic Romance**, **Paranormal Romance**, **Enemies To Lovers**, **Hentai**, **Anime**, **Royalty**, **Action**, **Adventure**, **Religious**, **Historical**, **Sci-Fi**, **Horror**, **FanFiction**, **Philosophy**, **Political**, **Detective**, and **Manga**. Each option has an accompanying visual icon, and selected genres receive a distinct active treatment.

#### Origin

Origin begins closed and can be expanded with its chevron. It classifies the source tradition of a story as **Original**, **Game**, **Movie**, or **Novel**. These labels describe the publication; choosing one does not import, duplicate, or otherwise alter the story.

#### Trigger Warnings

Trigger Warnings also begins closed. The available filters are **Cheating**, **Cuckold**, **CNC**, **NTR**, **Chastity**, **Hypno**, **BDSM**, **Voyeurism**, **Bondage**, **Impregnation**, **Sissification**, **Breeding**, **Femdom**, **Gore**, **Bloodplay**, **Forced Orgasm**, **Humiliation**, **Drug Use**, **Coercion / Manipulation**, **Blackmail**, **Somnophilia**, **Captivity**, **Physical Abuse**, **Domestic Violence**, **Murder**, **Stalking**, **Isolation Control**, **Medical Play**, **Age Gap**, **Incest**, **Pseudo-Incest**, **Degradation**, **Breath Play**, **Knife Play**, **Free Use**, **Self Harm**, **Eating Disorders**, **Mental Illness**, and **Dark Themes**.

Publication tags can be searched through the hashtag syntax in the main search field. Story Detail also presents the custom tags supplied with the publication so the viewer can understand why a result matches their interests.

### Every active criterion remains visible above the results

When search text, hashtags, or category choices are active, the Gallery displays a **Filtering by:** row above the grid. The text portion of a search appears as a quoted chip. Each hashtag appears as its own chip. Story Type, Genre, Origin, and Trigger Warning selections use different colors so the viewer can tell which category each value belongs to without reopening the sidebar.

Every chip has its own X button. Removing the quoted text chip keeps any hashtag search in place. Removing one hashtag leaves the others intact. Removing a category chip changes only that category selection. The row’s **Clear all** action is broader: it resets typed search, parsed search text, hashtags, and every category filter together. The top-level All Stories, Recent, Liked, Saved, Played, or Following selection remains a separate page-header choice.

### The responsive result grid gives a compact preview of every publication

Results appear as tall, cover-led story cards. The layout adapts from one column on narrow screens through two, three, four, and finally five columns as space increases. Each card is itself the button for opening Story Detail. The centered actions that appear over the artwork are separate controls and stop the card click, so liking, saving, or playing does not accidentally open the detail interface.

A card uses the creator’s published cover and saved crop position when one is available. If there is no cover, it substitutes a dark gradient with the first character of the story title. A bottom gradient keeps the overlaid text readable. The title is limited to one line, the synopsis preview is limited to two lines, and missing information is represented with **Untitled Story** or **No description provided.** rather than leaving an unexplained blank area.

The upper-right badge identifies the story as SFW or NSFW. If the creator allows customization, a purple pencil appears in the upper-left corner. That pencil is an availability indicator, not an Edit button. When NSFW visibility is off, an NSFW story remains in the catalog but its cover is enlarged slightly, heavily blurred, and darkened. This preserves the result layout and lets the viewer know that a publication exists without displaying its explicit artwork.

The lower portion of every card shows the title, synopsis preview, and four engagement totals: the eye is the number of recorded views, the heart is likes, the bookmark is saves, and the play symbol is plays. A filled rose heart indicates that the signed-in viewer has liked the story; a filled amber bookmark indicates that the viewer has saved it. The final line identifies the creator by display name, username, or **Anonymous** when neither public name is available.

### Hover actions let a viewer act without opening Story Detail

Hovering a card reveals a heart, a bookmark, and a **Play** button in the center of the cover. The heart toggles Like and Unlike. While that request is running, the heart is disabled to prevent repeated submissions. After a successful change, the card’s visible count and selected state update and Chronicle refreshes the viewer’s interaction data.

The bookmark toggles Save and Unsave and is likewise disabled while its request is running. Saving creates a relationship between the signed-in user and the published story, updates the visible save total, and refreshes the saved-story registry used by My Stories. Unsaving removes only that relationship. It does not delete, unpublish, or modify the creator’s story.

Play may require authentication and adult-content approval. A signed-out visitor is first handed to the selected story’s read-only Chat Interface preview and sign-in gate. Once the user is permitted to begin, Chronicle records the play for the publication and gives the underlying story to Chat Interface, which becomes responsible for the resulting session.

Opening a card records a view only when the viewer is signed in. Repeated openings by the same account within the view-deduplication window count as one accepted view. The number shown to the user must represent the engagement the service accepted rather than treating every click as a new durable view.

### Story Detail is the full evaluation interface

Selecting the body of a card opens Story Detail over the Gallery. The modal can be closed with the X button or by selecting the dark area outside it. On wider screens it is split into a cover-and-actions column on the left and a scrollable information column on the right. Its height is constrained to the available window, and wheel or trackpad input is routed through the information pane so long descriptions, themes, characters, and reviews remain reachable.

The left column repeats the published cover, crop position, SFW or NSFW badge, and purple pencil when customization is allowed. If the publication has no cover, the modal substitutes the story’s first initial. Under the cover, a normal Gallery visitor receives full-text **Like** or **Liked**, **Save** or **Saved**, and **Play** buttons. The first two expose the same toggle behavior as the card icons; Play uses the same authentication, age, engagement, and conversation handoff.

If the signed-in viewer is also the publisher, Story Detail adds **Remove from Gallery**. Selecting it unpublishes the public representation while preserving the creator’s owned source story, refreshes the Gallery, and closes the modal after the removal succeeds. A spinner replaces the action icon while the request is running.

### The information pane explains the story, its creator, and its content

The story title appears in the header banner. Beneath it, Story Detail can show the publication’s average Story rating as stars and its average Spice rating as flames. Both aggregates describe the complete eligible review set for that publication rather than only the review rows visible on the current page. The four engagement totals—views, likes, saves, and plays—are repeated in compact form, with large values abbreviated for readability.

The creator appears in a dedicated public-identity control with an avatar, or a generated initial when no avatar is available, plus the creator’s display name or username. Selecting that control closes Story Detail and navigates to the public creator profile. The Gallery itself does not place a Follow or Unfollow button on the story card or in Story Detail.

An **EDITABLE** badge appears when the creator permits customization. Hovering or focusing its explanation clarifies that the story can be loaded from My Stories into Story Builder to create a custom version and that doing so will not change the original publication. There is no direct Remix or Edit button in the current Gallery interface. A **PUBLISHED** badge exists in the shared detail component for owned-story contexts, but it is not part of the normal public Gallery presentation.

The **Synopsis** section shows the complete published description without the card’s two-line truncation. When provided, the content-classification area shows **Genre**, **Character Types**, and **Story Origin**, followed by **Trigger Warnings** and **Custom Tags**. Empty classifications are omitted instead of displaying rows with no values.

The **Characters** section is loaded when Story Detail opens. Four skeleton portraits indicate the initial request. If the story has no public character results, the modal says **No characters yet**. Otherwise it shows up to eight characters with their avatar and saved crop position, or an initial fallback, plus a truncated name below each portrait. These character items are informational unless Chronicle gives them a defined destination; their presentation must not imply that they open a profile or another modal when no such action exists.

### Reviews form a second interface within Story Detail

The bottom of Story Detail contains **Reviews** with the publication’s review count. Review entries display the reviewer’s avatar or initial, public name, relative posting time, Story score, Spice score when one was supplied, and optional written comment. The modal initially requests five reviews. When more are available, **See more reviews** loads five additional entries and replaces its label with a spinner while the request runs. With no entries, the section says **No reviews yet. Be the first!**

A signed-in viewer sees **Leave a Review**. If that viewer already has a review for the publication, the same control becomes **Edit Review**. Selecting it opens a review modal above Story Detail. Closing the review with its X or outside area dismisses only the review interface and returns the viewer to the still-open story details.

The review interface begins with **Quick Rating**, a one-to-five-star Story score. For any story not explicitly classified SFW, it also offers **Optional Spice**, a one-to-five-flame score that may be left blank. The form can be submitted once either the Story score or Spice score has at least one selected value; before then, the submit button remains disabled.

**Additional Feedback** is closed by default and can be expanded for five optional category ratings. **Concept Strength** asks whether the scenario idea is compelling, specific, and interesting. **Motivation / Tension** asks whether there is a reason to engage immediately. **Worldbuilding & Vibe** rates how rich and usable the setting is for roleplay. **Replayability** rates whether there is enough depth or variety to replay differently. **Character Details & Complexity** rates the strength of the character cards and story structure. Each uses its own one-to-five-star control.

The final review field is an optional comment with a 1,000-character limit and guidance to describe what worked or what the reviewer would like more of. A new review ends with **Submit Review**; an existing review is prefilled and ends with **Update Review** plus **Delete Review**. Delete opens a confirmation dialog titled **Delete your review?**, explains that the quick rating, additional feedback, and comment will be permanently removed, and offers Cancel or Delete. Submit, update, and delete show progress while saving. A failed request keeps the review interface and entered values available and clearly states that the review was not changed.

### Adult-content gating protects presentation without hiding the catalog

The NSFW toggle stores two separate facts on the current device: whether the user has confirmed they are at least 18 and whether NSFW presentation is enabled. Chronicle restores the Show NSFW preference on a later visit only if the age confirmation was also completed. If browser storage is unavailable, the current in-memory choice can still work for the session but may not survive a reload.

Turning NSFW off is immediate. It closes any pending age prompt, masks adult covers, and removes an NSFW story-type filter. Turning it on for the first time opens **Confirm Your Age**, which includes an 18+ badge, an explanation that sensitive or adult material may appear, an X close button, **Go Back**, and **I’m Over 18**. The modal can also be dismissed from outside. Closing or going back leaves adult presentation disabled.

The same gate applies when a viewer directly selects an NSFW card or its Play button while adult presentation is hidden. Instead of opening explicit details or starting the story immediately, Chronicle opens the age modal and remembers the pending action. Confirming age enables NSFW presentation and then continues that specific Detail or Play action. Once confirmed on the device, later requests can enable NSFW without repeating the modal.

NSFW publications are therefore not silently removed when Hide NSFW is active. The viewer can still see a masked card, its classification, title, non-cover metadata, and engagement context. The gate controls explicit presentation and entry; it does not rewrite the publication, convert it to SFW, or imply that all other story metadata is non-sensitive.

### Loading, empty results, and continuous paging have distinct presentations

The initial request loads twenty publications at a time. While the first page is pending, the Gallery shows four tall skeleton cards in the same responsive grid rather than presenting an empty page. As the viewer approaches the bottom, an invisible sentinel requests the next twenty results before the end is reached. Existing cards remain visible while **Loading more stories…** appears beneath them. When there are no additional pages, the footer says **You’ve reached the end**.

The Gallery has several purposeful empty messages. Following with no eligible publications shows **No stories from followed creators** and **Follow creators to see their stories here.** A search or filter combination with no matches shows **No stories found** and suggests changing filters or clearing search. A truly empty unfiltered catalog also uses **No stories found** but adds **Be the first to publish a story to the gallery!**

A failed catalog request is not an empty catalog. The Gallery keeps the chosen feed, search, and filters visible, explains that the results could not be loaded, and provides a retry for the same request. If only a later page fails, the stories already loaded remain in place while the user retries the additional page.

### Play leaves the Gallery and begins a separate story session

Play transfers the exact selected story to Chat Interface. For a signed-out visitor, that destination first acts as a read-only preview and authentication gate. After authentication and any required age approval, Chronicle prepares the story’s opening state and creates a new conversation with its own **Story Session** identity. The new conversation becomes the active playthrough; the public publication remains unchanged.

The Gallery must not present a playable or resumable session unless the selected story has been loaded and the new conversation can be associated with the signed-in player. If the handoff fails, Chronicle preserves the originating story identity, explains that the playthrough was not created, and gives the user a way to retry without searching for the publication again.

The public play counter and the user’s conversation are related but not identical records. The Gallery increments publication engagement, with repeated play-count updates throttled over a short period, while Chat Interface and Chat History own the actual conversation after the handoff. Returning to that playthrough later is therefore a Chat History responsibility, not a Gallery-card function.

### Save, customize, publish, and remove each mean something different

**Save** is the only Gallery action that places another creator’s publication into the viewer’s My Stories experience. It preserves the publication relationship and still does not make the story editable. When the creator has enabled customization, choosing to edit from the later owned-work area must create a separate user-owned copy before Story Builder opens. The purple pencil and EDITABLE badge explain that permission, but the Gallery itself does not manufacture the copy.

**Publish** begins from the creator’s own story workflow, not from a public Gallery result. Publishing makes the approved story representation discoverable here. **Remove from Gallery** is available only to the publication owner and changes that public availability; it is not the same as deleting the owner’s source story. Likes, saves, reviews, views, and play counts describe engagement with the publication and do not grant any viewer permission to overwrite it.

This separation is the central promise of the page. Community Gallery helps a person find and evaluate something worth playing. My Stories manages what that person owns or has saved. Story Builder manages an owned editable version. Chat Interface manages the active roleplay. Public Profile manages the creator relationship. Every Gallery control either changes the current catalog view, records engagement with a publication, or hands a clearly identified story to one of those later owners.

# My Stories

# Character Library

# My Images

# Story Builder

# Character Builder

# Chat Interface

# Chat History

# Public Profile

# Account Settings

# Admin Panel

## Admin Tools

![Admin Panel](knowledge-asset:admin-panel-overview)

### Image Generation

### AI Status

### App Dashboard

### App Architecture

### Supabase Schema

### Roleplay Pipeline

### Quality Hub

### Validation Evidence Ledger

### Finance Dashboard
