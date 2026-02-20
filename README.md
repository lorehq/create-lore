# create-lore

Bootstrap a new [Lore](https://github.com/lorehq/lore) project — persistent memory for AI coding agents.

## The Problem

AI coding agents (Claude Code, Cursor, OpenCode) forget everything between sessions. Every session you re-explain project structure, re-discover API quirks, and repeat lessons learned yesterday. Lore fixes that.

## What Lore Does

Lore wraps your coding agent in a git-versioned knowledge base. Hooks fire automatically to reinforce knowledge capture as you work. Gotchas become skills, and every future session starts with what previous sessions learned. Complex work delegates to focused workers loaded with curated skills.

- **Skills** — API quirks, auth gotchas, encoding tricks. Captured once, loaded forever.
- **Knowledge docs** — Environment details, runbooks, architecture decisions. Accumulated across sessions.
- **Work tracking** — Roadmaps, plans, and brainstorms that persist and appear in every session banner.
- **Hooks** — Session init, capture reminders, memory protection. All automatic.

## Quick Start

```bash
npx create-lore my-project
cd my-project
git add -A && git commit -m "Init Lore"
```

Then open the project in your agent. Hooks fire automatically.

## Supported Platforms

| Platform    | Integration                                          |
| ----------- | ---------------------------------------------------- |
| Claude Code | `hooks/` + `CLAUDE.md`                               |
| Cursor      | `.cursor/hooks/` + `.cursor/mcp/` + `.cursor/rules/` |
| OpenCode    | `.opencode/plugins/` + `opencode.json`               |

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

## Docs

Full documentation: [lorehq.github.io/lore-docs](https://lorehq.github.io/lore-docs/)

## License

Apache-2.0
