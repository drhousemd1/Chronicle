

# Fix API Inspector: Replace Placeholder References With Actual Content + Add Callout Boxes

## The Problem

Every AI Enhance page in the inspector has lines like:
- `{buildFullContext() output}`
- `{buildCharacterSelfContext() output}`
- `{CURRENT VALUE section}`
- "See Physical Appearance page for the complete field-by-field assembly logic"

These are meaningless placeholders. You can't debug anything from them. The Physical Appearance page has the context assembly written out once, but every other page just says "go look at that other page" — which defeats the purpose of per-section documentation.

## What Will Change

Every single AI Enhance page (Preferred Clothing, Background, Personality, Tone, Relationships, Secrets, Fears, Key Life Events, Role Description, Character Goals, Custom Sections, and all 9 Story Builder pages) will be updated so that:

### 1. Replace all `{buildFullContext() output}` placeholders with the actual assembly

Instead of `{buildFullContext() output}`, each page will show the exact data that gets assembled:

```
WORLD & SCENARIO CONTEXT:
(Assembled from your Story Builder data. Each line only appears if the field has content.)

  Scenario: [Story Name from Story Builder]
  Description: [Brief Description from Story Builder]
  Premise: [Story Premise from Story Builder]
  Locations:
    - [Location Name]: [Location Description]    (for each structured location)
    OR: Locations: [legacy locations text]        (if no structured locations)
  Factions: [Factions text]
  Tone & Themes: [Tone Themes text]
  Plot Hooks: [Plot Hooks text]
  History: [History Timeline text]
  Dialog Style: [Dialog Formatting text]
  [Content Themes: Story Type, Genres, Character Types, Origin — semicolon-joined]
  [Custom World Sections: each section title + its filled label: value items]
  Story Goals:
    - [Goal Title]: [Desired Outcome]

  OTHER CHARACTERS IN SCENARIO:
    - [Name], role: [roleDescription], age [age], [sexType], tags: [tags],
      at: [location], personality: [top 3 trait values], 
      relationships: [label: value pairs from relationship extras]
```

### 2. Replace all `{buildCharacterSelfContext() output}` placeholders with the actual assembly

Instead of `{buildCharacterSelfContext() output}`, show:

```
THIS CHARACTER'S EXISTING DATA:
(Assembled from everything already filled on this character. Each line only appears if filled.)

  Name: [character name]  (skipped if still "New Character")
  Age: [age]
  Sex/Identity: [sexType]
  Sexual Orientation: [sexualOrientation]
  Role: [roleDescription]
  Tags: [tags]
  Location: [location]
  Current Mood: [currentMood]
  Nicknames: [nicknames]
  Physical Appearance: [all filled fields as key: value, including extras]
  Currently Wearing: [all filled fields as key: value, including extras]
  Preferred Clothing: [all filled fields as key: value, including extras]
  Background: [all filled fields as key: value, including extras]
  Personality: [trait label: value pairs — prefixed (outward)/(inward) if split mode]
  Tone: [label: value pairs from tone extras]
  Key Life Events: [label: value pairs]
  Relationships: [label: value pairs]
  Secrets: [label: value pairs]
  Fears: [label: value pairs]
  Goals: [title → desiredOutcome pairs]
  [Custom Sections: title + filled items]
```

### 3. Replace `{CURRENT VALUE section}` with the actual branching logic

Instead of `{CURRENT VALUE section}`, show:

```
CURRENT VALUE LOGIC:
  If the field already has text:
    "CURRENT VALUE (enhance while preserving intent):"
    [the existing text in that field]
  
  If the field is empty:
    "CURRENT VALUE: Empty - generate appropriate content based on context."
```

### 4. Add styled callout boxes

Each major section of the payload will get a colored callout box above it explaining what it is in plain English:

- **Request Body callout**: "This is the JSON object sent to the chat API. It contains two messages (system + user) and the model ID."
- **World Context callout**: "This section pulls in all your Story Builder data — story name, premise, locations, factions, other characters, etc. — so the AI knows the world this character lives in. Only fields you've filled in are included."
- **Character Data callout**: "This section pulls in everything you've already filled on this character — appearance, clothing, personality, background, etc. — so the AI doesn't contradict or duplicate what you've already written."
- **Current Value callout**: "If the field already has text, the AI is told to enhance it while keeping the intent. If the field is empty, the AI generates from scratch using the context above."
- **Field Instruction callout**: "This is the specific instruction for this field type. It tells the AI what kind of content to generate (e.g. 'Describe preferred casual clothing style')."

### 5. Remove all "see Physical Appearance page" cross-references

The line `buildFullContext() and buildCharacterSelfContext() — identical to Physical Appearance page. See that page for the complete field-by-field assembly logic.` will be deleted from every page and replaced with the full inline content.

### 6. Use a JS template to prevent drift

To avoid copy-pasting 500 lines of context assembly into 20+ pages, the HTML will define the context assembly strings once in JavaScript constants and inject them into each page's content block on render. This way:
- Every page shows the full content
- Updates to the assembly logic only need to happen in one place
- No page can accidentally have stale or missing context documentation

### 7. Story Builder pages get the same treatment

The Story Builder pages (scenarioName, briefDescription, etc.) use a different but simpler context system (`buildPrompt()` in `world-ai.ts`). Those pages will also get inline context assembly showing exactly which other Story Builder fields are pulled in as context.

## File Modified
- `public/api-call-inspector-chronicle.html`

## Result
Opening any AI Enhance page will show the complete, readable, self-contained API call with:
1. The exact payload sent (raw, verbatim)
2. Colored callout boxes explaining each section in plain English
3. No cross-references to other pages
4. No unexplained placeholders or function names

