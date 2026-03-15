

## Analysis

The **TURN PROGRESSION CONTRACT** already requires a "concrete scene delta" each turn and says "Characters pursue their goals and take action" — but goal-pursuit is buried as a sub-bullet, not the primary directive. The contract currently emphasizes *any* state change, not *goal-directed* state change. This means the AI can satisfy the rule by introducing random action that doesn't connect to the characters' defined goals, arcs, or motivations.

## Plan

**Single file change: `src/services/llm.ts`, TURN PROGRESSION CONTRACT block (~line 440)**

Add a **goal-directedness requirement** as the first bullet of the contract, above the existing scene-delta rule:

```
* Every response must advance at least one active goal, desire, story arc,
  or core motivation belonging to the characters in the scene.
  Non-directional responses — reactions, observations, or atmosphere
  that don't connect to any character's driving factors — are FORBIDDEN.
```

Then tighten the existing "Characters pursue their goals" sub-bullet to reference the defined goals explicitly:

```
* AI-controlled characters MUST drive scenes toward their defined goals,
  desires, and motivations. They take concrete action informed by what
  they want — not generic action for its own sake.
```

No new blocks. No new systems. This wires the existing goal/arc data (already injected into the prompt via `storyGoalsContext` and `characterGoalsContext`) to the output contract that was missing the connection.

**Documentation**: Add a line to the TURN PROGRESSION CONTRACT description in `edge-functions-ai-services-structure-guide.md` noting goal-directedness was added.

