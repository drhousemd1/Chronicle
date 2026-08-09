---
name: chronicle-application-manual-writer
description: Create or update Chronicle's source-backed application manual and Architecture Knowledge Hub. Use when documenting a Chronicle feature, page, workflow, interface, implementation area, or current work so a new maintainer can understand the intended user experience, rules, connected behavior, and code ownership without relying on shallow summaries.
---

# Chronicle Application Manual Writer

- Created: 2026-07-24
- Last Edited: 2026-07-24

## Core Objective

Create a living Chronicle application manual that explains how the product is supposed to work in enough detail that a new maintainer can make an informed change without repeatedly asking for the missing product context.

Document the product as a connected system: what the user sees, what they can do, what happens next, what rules can change the result, what data or state is involved, and which implementation areas own that behavior.

The goal is not a code inventory. A file name followed by one sentence is not documentation of behavior.

## Source Of Truth

- Treat the user's stated intended behavior as the product requirement.
- Inspect the relevant source, data contracts, and existing Chronicle documentation before making claims about the current implementation.
- Use the source to identify how the behavior is currently wired, not to replace the stated product requirement with accidental implementation details.
- If intended behavior and current code disagree, state the intended behavior clearly and record the mismatch in Work Status. Do not silently redefine the manual around the bug.
- Mark a claim as unknown when it cannot be established from the supplied requirement or inspected evidence. Do not fill gaps with plausible guesses.
- When source access is unavailable, draft only the intended-behavior material that the user established. Label implementation ownership, current state, and unresolved behavior as unverified rather than inventing a map.

## Division Of Responsibility

Use three layers and keep their jobs separate:

1. **This skill** defines the investigation method, evidence standard, and writing-quality bar.
2. **The Architecture Knowledge Hub** defines the reusable presentation structure, visual conventions, and page-level navigation.
3. **Each Chronicle feature page** contains the actual researched manual for that feature.

Do not hard-code a complete feature description, a fixed directory layout, personal notes, credentials, PDF output, or distribution workflow into this skill. Those are not reusable requirements for writing Chronicle's manual.

## Required Research Pass

Before drafting a feature page:

1. Read the existing hub page and any user-provided behavior notes.
2. Inspect the relevant page components, hooks, services, data access, and tests or validation evidence.
3. Build a private behavior map covering:
   - the user-visible entry point;
   - each meaningful action and outcome;
   - normal, blocked, empty, loading, success, and error states where they exist;
   - permissions, privacy, content gates, or ownership rules;
   - cross-feature handoffs;
   - the code and data areas that own each behavior.
4. Identify gaps between desired behavior and the current implementation before writing the Work Status material.

## Depth Contract

Write complete explanations, not labels disguised as documentation.

For every meaningful interface element, answer the relevant parts of this chain:

1. What does the user see, and where is it located?
2. What can the user do with it?
3. What immediate result should they see?
4. What state, data, permission, filter, or rule can change or block that result?
5. What happens next, including any handoff to another Chronicle area?
6. Which implementation area owns the behavior?

For every implementation entry, explain the user-facing behavior it exists to support. A list of React files, hooks, tables, or endpoints without that connection is inventory, not a manual.

Depth comes from explaining the causal chain. Do not pad sections with filler or impose arbitrary word counts. If a paragraph could be reduced to “this opens a panel” without losing essential behavior, it is too shallow.

## Hub Page Contract

When a Chronicle feature uses the established five-tab Hub structure, populate each tab for its actual purpose:

### Overview

Give a full plain-language account of what this feature is for, who uses it, how it fits into Chronicle, and the experience it provides. Explain its important boundaries and relationships to other areas.

### UI Elements & Outcomes

Document every meaningful visible control, display state, modal, menu, card action, search or filter input, toggle, and status message. Explain placement and visual distinction only where it helps identify the element. Prioritize what the control does and what result the user gets.

### Flows & Rules

Explain multi-step journeys and rules that span individual controls: entry, selection, filtering, permissions, privacy or content gates, save or publish behavior, errors, empty states, and handoffs to other Chronicle experiences.

### Implementation Map

Map components, hooks, services, state, APIs, and relevant data objects to the behavior they own. Explain responsibility, interaction, and downstream effects. Include source paths and line references when they improve a maintainer's ability to verify or change the behavior.

### Work Status

Keep current, concise operational context in one place: known issues, active work, recent completion, intended-versus-current mismatches, and explicit “none” states. Do not invent active work merely to avoid an empty section.

If a feature legitimately needs an extra tab, add it only when it represents a distinct maintained responsibility that cannot be explained within these five purposes.

## Writing And Formatting Standard

- Use clear headings, short introductory paragraphs, and grouped subsections so the manual is readable by a person as well as an LLM.
- Use prose for behavior and rationale. Use tables only when a repeated comparison is clearer than paragraphs.
- Use bullets for genuine lists and numbered steps for sequences.
- Keep terminology consistent with Chronicle's existing product language.
- Include screenshots only as contextual evidence: one orienting page image where useful, then targeted visuals only when the appearance or state materially affects the behavior. Do not create an image gallery that becomes a second, stale source of truth.
- Use Mermaid only when a relationship or sequence is materially clearer as a diagram.

## Prohibited Shortcuts

Do not:

- replace an explanation with headings such as “Receives,” “Produces,” or “Next Owner” followed by one sentence;
- treat a current implementation quirk as the desired product behavior;
- write generic promises such as “handles errors” without explaining the relevant error behavior;
- copy large code blocks where a source reference and behavioral explanation are clearer;
- include credentials, keys, private personal notes, PDF-generation instructions, or distribution steps;
- claim that a page or flow is complete without checking the relevant source and visible output.

## Final Quality Gate

Before finishing a section, verify that a fresh maintainer can answer:

- What is this feature for?
- What does the user do here, and what should happen?
- What rules, state, or conditions change the outcome?
- How does this feature connect to the rest of Chronicle?
- Where would I inspect or change the implementation?
- What is known to be incomplete, wrong, or currently being worked on?

If any answer is only a filename, a label, or a one-line summary, expand the section before calling it complete.