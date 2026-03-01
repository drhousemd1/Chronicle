# Simplified version

### \- no seperate DND version, just add some of the elements that would be possible in the DND version which isn't many to the story mode we already have.

### \- Skills (hard coded container) this would be more of just a generic guide on what the skills due but we would leave out damage calculation, mana/energy levels etc. rely more on what the end-user describes naturally and roll with it as much as possible unless they try to use skills they don't possess? then we would need a way to correct that.

### \- Discoverable skills (Hard coded container), would look a lot like the containers we have but slighty different, would need 3 options to determine. Skill name, description, and trigger event that would reveal that skills.

\- Toggle on Avatar panel to use or not use health bar

\- If health bar = 0 for user character, should trigger code to send API with specific instructions to generate a 1-3 paragrah summary of how the story ended or events that transpired, clarifying the characters death and esentially wrapping up the story. I'm picturing, 

\- Would need additional coding for how to update health bar status

\- We already have temporary status in our code, would need to revise it to be more specific on the effects we mean, would need to add the UI elements on the card that display the effect, durration. Would still need to figure out how those affects affect the dialog/story /

\- UI element to toggle on/off Inventory use in story, inventory limit/size (keep it simple, text based inventory)

\- Weight system: No  
\- Mana system/ energy system: No  
\- limit skill use, damage calculations: No  
\- Leveling component: No

Massive Picture Overview - What IS D&D Mode?

\- Before diving into implementation, let's be crystal clear about what D&D Mode actually DOES for the end user:

## D&D Mode (Structured gameplay with)

\- Rules-based skill checks (roll dice + modifiers vs difficulty)

\- Inventory management (collect/use items)

\- Character progression (level up, gain abilities)

\- Quest tracking (objectives, rewards)

\- Turn-based decision making

\- Combat encounters with HP/damage

The AI shifts from just role playing as characters to role playing as characters as well as having a "dungeon master" type narrator at specifc times when needed. 

\*\*Critical Design Question:\*\* Do we want D&D Mode to be D&D 5e compatible (use actual D&D rules) or a simplified "D&D-like" system? This affects EVERYTHING. I'd recommend starting with simplified rules that FEEL like D&D without legal/licensing issues.

# Adding a Mode Toggle in the Scenario Builder (UI Component)

\- We will introduce a UI control that lets the user choose between \*\*AI Chat Roleplay\*\* and \*\*D&D Mode\*\* for each scenario. The most intuitive place is in the Scenario Builder interface, since that’s where scenario-wide settings are configured. At the top of the builder (perhaps in the header bar or at the top of the \*\*World\*\* tab), we’ll add a mode toggle:

\- Clicking Scenario builder page → (Choose Mode Page) → Navigates to the actual scenario builder page loading in which hard coded content and supporting code is needed.

## Choose Mode Page:

    - Slider bar center of the screen to toggle between the two modes.

    - Text towards the top saying “Choose your mode to begin”

    - A description box shows up below the slider bar to describe more about the modes. Changes based on which mode is selected

    - Slicking on each mode will cause the background image to change, with a fade transition as they click one mode or the other.

    - A “Continue to Scenario Builder” button, white texts, slate blue button towards the bottom which navigates to the actual scenario builder page.

    - See image (below) for Mockup

![](https://gialzvvswxadxolnwots.supabase.co/storage/v1/object/public/guide_images/98d690d7-ac5a-4b04-b15e-78b462f5eec6/1772080441350-11p9el.jpg)

\- **Integrating with State:** (proposed by chatGPT) We will store the mode selection in the scenario data (see next section for data model changes). The toggle buttons will read from \*\*\`activeData.mode\`\*\* (the currently loaded scenario’s mode) and update it. This might be done by a simple state patch: e.g., \*\*\`handleSetMode('DND')\`\*\* would do \*\*\`handleUpdateActive({ mode: 'DND' })\`\*\* to set the mode on the active scenario data in state. The UI should immediately reflect the change (highlighting the D&D button).

\- **Behavior:** Toggling the mode could immediately enable/disable certain UI elements. For example, when switched to D&D Mode, the Scenario Builder might show or hide any D&D-specific fields (if we add any to the builder later). Initially, the main effect will be during gameplay (chat), but it's good to have the toggle in the builder so the user’s choice is saved with the scenario.

\- Placing this toggle in the builder ensures that scenario \*\*metadata\*\* captures which mode the scenario is in, and the choice persists. It also makes it clear to the user when they are editing that they are configuring a D&D scenario vs a normal one.

# Scenario Data Model Changes for Mode (Coding Component proposed by ChatGPT)

To support the new mode toggle, we need to extend our data model to record the scenario’s mode. This involves both the in-memory data (\*\*\`ScenarioData\`\*\*) and the saved metadata (\*\*\`ScenarioMetadata\`\*\* in the registry):

\- \*\*Add a Mode Field\*\*: We will introduce a \*\*\`mode\`\*\* property. For example, in \*\*\`types.ts\`\*\* we can define an enumeration or union for mode and include it in ScenarioMetadata:

    \`\`\`tsx

    exporttypeScenarioMode ='Roleplay' |'DND';// two possible modesexporttypeScenarioMetadata = {id:string;title:string;description:string;coverImage:string;tags:string\[\];createdAt:number;updatedAt:number;mode:ScenarioMode;// new field to indicate mode

    };

    \`\`\`

    We’ll default this to \*\*\`"Roleplay"\`\*\* for existing or new scenarios unless explicitly set to \*\*\`"DND"\`\*\*.

\- \*\*Include Mode in ScenarioData\*\*: It’s useful to also have the mode in the loaded scenario data object (so we can easily check \*\*\`activeData.mode\`\*\* throughout the app). We can add \*\*\`mode?: ScenarioMode\`\*\* to \*\*\`ScenarioData\`\*\*. This field can be stored redundantly (since it’s also in metadata), but it makes it convenient to branch logic in the frontend. When loading a scenario, we can derive \*\*\`ScenarioData.mode\`\*\* from the saved metadata, or store it inside the scenario JSON as well for simplicity.

\- \*\*Saving Metadata with Mode\*\*: Whenever we save the scenario or update the registry, we must include the mode. For instance, in the \*\*\`handleSave\`\*\* function where a new ScenarioMetadata is created, we will set \*\*\`mode\`\*\* accordingly. Currently, that code looks like:

    \`\`\`tsx

    constmeta:ScenarioMetadata = {id: activeId,title: derivedTitle,description:truncateLine(...),coverImage:"",tags: \["Custom"\],createdAt: t,updatedAt: t,

    };

    \`\`\`

    We will add \*\*\`mode: activeData.mode || 'Roleplay'\`\*\* in that object. For example:

    \`\`\`tsx

    mode: activeData.mode ||'Roleplay'

    \`\`\`

    (If \*\*\`activeData.mode\`\*\* is undefined, it defaults to 'Roleplay'. This covers older scenarios that were created before the mode field existed.)

    Similarly, when updating an existing scenario’s metadata, carry over or update the mode. In \*\*\`handleSave\`\*\*, for the \*\*\`exists\`\*\* case, we can do:

    \`\`\`tsx

    nextReg = currentRegistry.map(m => m.id === activeId ? {

        ...m,title: derivedTitle,description:truncateLine(...),updatedAt: t,coverImage:"",mode: activeData.mode || m.mode ||'Roleplay'

    } : m);

    \`\`\`

This ensures if the user toggled the mode, the registry entry gets the new mode; otherwise it keeps the previous value.

# ⚠️ Backward Compatibility (?)

**\- Backward Compatibility:** (From Chatgpt) If you have any scenarios saved from before adding the mode field, they simply won’t have a mode property (undefined). Our code already defaults undefined to 'Roleplay'. We should handle that gracefully – e.g., when rendering the toggle, treat missing mode as 'Roleplay'. When saving, assign 'Roleplay' if none. This ensures old scenarios still function as normal mode.

\- (Thomas): I don't think we should overthink this. The DND mode essentially brings in more harded coded elements, if the end-user switched it back to the other mode I think it would just remove the elements? but.. the mdoe is selected before you enter the scenario editor. Clicking "Edit" on a tile for a story already created just loads all the data in the scenario builder, it doesn't take the end-user back to the menu to choose which type it is. I don't really think we need backwards compatability.. but I'm not sure..

# D&D Mode Chat Interface and Gameplay Features

## Health Bar Implementation:

    - Add Health Bar in avatar container in character builder, likely place this (above) the “Name” text input field.

    - ⚠️ Question: Do we enable the ability to set a numerical value for how much HP a character has or is it just a 0 - 100% slider?

    - ⚠️ Question: is the HP bar just set to 100 hit points?

    - ⚠️ Question: How would we enable scaling if leveling of characters was implemented? (Possibly to complex)

    - ⚠️ Question: Does the max HP scale off stat point distribution? Would Strength increase it or would other stats?

![](https://gialzvvswxadxolnwots.supabase.co/storage/v1/object/public/guide_images/98d690d7-ac5a-4b04-b15e-78b462f5eec6/1772081431901-mjtwd5.jpg)

## Mana Bar Implementation

    - Place below health bar

    - ⚠️ Question: how do we determine how much mana someone has? Stat points?

    - ⚠️ Question: Is the mana pool just a fixed max amount? Does it scale with leveling?  
Maybe call it Energy?

## Inventory Implementation

    - Hard coded container in the character builder page

    - ⚠️ Question: do we handle inventory items in a category/list stile or in a table format with elegant UI styling?

\- Answer: List 

    - ⚠️ Question: would items just populate in the inventory or would we have a pop up asking what items are available to look and have a loot button next to each item so they can pick what they take?

    - ⚠️ Question: would we use a weight system? Or would we stick with a max item inventory to prevent bloat?

    - ⚠️ Question: How would users remove items from the inventory? If the inventory is full and they want to loot another item how would they swap out the new item with an item from the inventory?

    - ⚠️ Question: would the inventory slots just show text or would we build an inventory of images and display images and text?

    - ⚠️ Question: how would we handle monetary value of the items like if the user wanted to sell the item to a vendor in the story?

    - ⚠️ Question: would we have standard (equipped items like helm, armor, gloves, pants, weapons etc and then inventory items?)

## Skills implementation

    - Hard coded container in the character builder page for initially building/adding details about skills, such as what the skills names are, mana cost, effects they have, damage they cause

    - Possible concept: add a Ui button in the chat interface for quickly viewing things like skills, inventory etc

    - ⚠️ Question: how do we handle damage from skills? If the user says the skill does 50 damage, does it always do 50 damage or does it have a range? How do we handle the math/coding for how much damage a skill does?

    - ⚠️ Question: how do we handle overuse of skills? If the user has 50 mana left but in their dialog they say they use three different skills costing 150 mana then sends their message how do we handle the next phase of the dialog if they didn’t have the mana to use those skills? Do they have to select skills they want to use that then adds it to a section at the bottom of the chat bubble that says something like “skills used” and shows a number? Perhaps as they check a box for what skills to use it updates the mana bar in real time before they send the message, not letting them send the message of the total mana cost exceeds what’s available?

    - ⚠️ Question: how do we handle situations where the user types out in plain text that they used skill x, y, and z but only checks one skill. Essentially casting more skills than they can by using the fact that they have free rein on what they type? Do we only count effects if a skills chosen and not from “free text?”

\- Possible Implementation: In the chat interface, to the right of the button that says generate image, have two additional buttons, "inventory" and "skills." Clickling the skills button opens up a menu with a layout similar to the mockup below. We would need to add a "use" button which is missing in the mockup. After clicking "use" it could do one of the following:  
\- After clciking "use" insert the skill name into the chat input box wherever the cursor is so the user would do the following:  
\- \[Typed dialog\] "user clicks skills clicks "use" which inserts skill name into dialg box" \[continued dialog  
\- We could also maybe have a search/listener function so lets say the user is typing out dialg and starts to type the name of a skill and it would open up some quick link to add in the rest of the text for the skill, like an auto fill.

Example for a skill called "healing"  
\- User types dialog... "Character hea..." and after detecting "hea" it shows the pop up radial or suggests auto completing it with the skill "Heal" ???

Another posibility would be to use the bottom of the dialg box which shows the day and time, to also show skills selected. so the user could select "skills" they want to use and they would populate at the bottom. If the user doesnt have enough mana, when clicking skills button those skills will be grayed out. 

\- Question: How would we determine priority of text dialg over skills option? What if end-user types "character healed x and y" but they didn't have mana to use a healing skill. Would we allow this to happen or would the dungeon master/narrator generate a response like "Character tried to heal but they couldn't... and generate descriptive scene" but not allow it to happen and direct the story as if the healing didn't occur and setting the end-user up to determine what to do next?

![](https://gialzvvswxadxolnwots.supabase.co/storage/v1/object/public/guide_images/98d690d7-ac5a-4b04-b15e-78b462f5eec6/1772082455581-2gtl8x.jpg)

## Leveling implementation

    - While most D&D-style games allow for leveling, I'm not entirely sure how we would go about implementing this given the free text nature and unlimited possibilities that may occur through story playthroughs.

    - Potential XP bar location would be under the mana bar. Second potential location would be on top of Text input box in the chat interface running horizontally across the top of it, updating as user gains XP.

    - ⚠️ Question: How would we figure out how to allocate XP based on what the user does?

    - ⚠️ Question: How would we determine how much XP is needed at each level to level up?

    - ⚠️ What are the benefits of leveling up? Would this increase stat points that the user could add? Would we add a pop-up when they level showing how many additional skill points they've gained with a UI that lets them add it to whichever fields they want and then save it which updates the character card? Would this also visually show how much their HP bar and mana bar have increased?

## Handling Temporary effects

    - I have placeholders for three circular icons to the right of the avatar image in the chat interface on the small cards. Let's say you can only have three effects maximum just for clean UI display. This will show a circle with an image depicting the effect, and then text beside it. There will be another circle with a number on the border of each element. The number depicts how long the effect will be present before it drops off. Each time the user sends a message in the chat interface, that will count as one turn and will need to be coded to automatically update these counters and count them down. When they reach zero, the effects will disappear.

    ![](https://gialzvvswxadxolnwots.supabase.co/storage/v1/object/public/guide_images/98d690d7-ac5a-4b04-b15e-78b462f5eec6/1772081736618-m561mx.jpg)

## Handling dice rolls

    - The likely best way to handle this would be behind the scenes. If a check is needed, the code runs, does the calculation of the dice roll, and the dialogue proceeds based on the outcome.

    - Example would be the user types that maybe they're running to go do something or attack someone, or it's left kind of inconclusive whether or not or what the outcome will be from their response. A dice roll can happen in the background if a check is required, and then the next response by the AI will depict the outcome based on the dialogue. For instance, if it's not favorable, perhaps the person he was running to attack sees him, throws him to the ground. If it was successful, perhaps the dialogue would say they turned to see him as they crash into him throwing the enemy to the ground, et cetera.

    - A more complex alternative would be to have a pop-up with a 20-sided die and a button that says "Roll." However, I'm not sure on how the chain of coding would work between when they click "Roll" to how that ends up with an outcome given how the application works with this turn-by-turn text dialog.

    - (Question) How would any of this be coded in the background? How do we convert open-ended, unlimited possibilities through user text input to then know when dice rolls are needed?

    - Perhaps results of dice rolls could be handled by the game master, character, or alternative narrator, not through actual character dialogue. But perhaps they try to do something, and then the next response has a separate dialogue box narrating how the outcome went, kind of based on the behind-the-scenes dice roll.

This should be visible AT ALL TIMES during gameplay, not buried in menus. Think of it like a video game HUD.