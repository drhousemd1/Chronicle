# Graphify 0.9.52 inert upstream reference

This directory preserves the exact official Graphify Codex guidance and license files reviewed for Chronicle's repository-graph integration.

It is intentionally **not an installed Codex skill**. The upstream Codex document is named `skill-codex.md`, not `SKILL.md`, and this directory is outside every Codex skill-discovery location. Chronicle must never run `graphify install`, `graphify codex install`, or copy these files into `AGENTS.md`, `.codex`, `.agents`, `.claude`, hooks, memory, MCP, or another always-on instruction path.

Chronicle owns the wrapper, source allowlist, normalized graph contract, capability lenses, privacy checks, and local artifact custody. Graphify is only the pinned extraction dependency.
