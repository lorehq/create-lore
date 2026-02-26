# create-lore

Scaffold a new [Lore](https://github.com/lorehq/lore) instance — a coding agent harness.

## The Problem

AI coding agents (Claude Code, Cursor, OpenCode) forget everything between sessions. Every session you re-explain project structure, re-discover API quirks, and repeat lessons learned yesterday. Lore fixes that.

## What Lore Does

Lore is a harness that wraps your coding agent in a git-versioned knowledge base with rule enforcement, orchestrated delegation, and work tracking. Hooks fire automatically to reinforce knowledge capture as you work. Fieldnotes become skills, rules are enforced at write-time, and complex work delegates to focused workers loaded with curated skills.

- **Fieldnotes** — API quirks, auth quirks, encoding tricks. Captured once, loaded forever.
- **Knowledge docs** — Environment details, runbooks, architecture decisions. Accumulated across sessions.
- **Work tracking** — Roadmaps, plans, and brainstorms that persist and appear in every session banner.
- **Hooks** — Session init, capture reminders, memory protection. All automatic.
- **Docs UI & Semantic Search** — Tell your agent to start the docs sidecar. It pulls a local Docker image that gives agents semantic search over the full knowledge base and opens a live MkDocs site for browsing it visually. Falls back to Grep/Glob without Docker — works for small knowledge bases, degrades as docs grow.

## Quick Start

```bash
npx create-lore my-project
cd my-project
git add -A && git commit -m "Init Lore"
```

Then open the project in your agent. Hooks fire automatically.

## Supported Platforms

| Platform    | Integration                                                           |
| ----------- | --------------------------------------------------------------------- |
| Claude Code | `.lore/hooks/` + `CLAUDE.md`                                          |
| Cursor      | `.lore/hooks/` + `.cursor/hooks/` + `.cursor/mcp/` + `.cursor/rules/` |
| OpenCode    | `.opencode/plugins/` + `opencode.json`                                |

All platforms share the same knowledge base. No configuration needed.

## Options

```bash
npx create-lore my-project       # creates ./my-project/
npx create-lore ./custom-path    # creates at specific path
npx create-lore --help           # show usage
npx create-lore --version        # show version
```

## Requirements

- Node.js 18+
- git
- Docker (highly recommended — enables semantic search and docs UI; not required)

## Docs

Full documentation: [lorehq.github.io/lore-docs](https://lorehq.github.io/lore-docs/)

## License

Apache-2.0
