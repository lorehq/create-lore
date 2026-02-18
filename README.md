# create-lore

Create a new [Lore](https://github.com/lorehq/lore) knowledge-persistent AI coding agent repo.

## Usage

```bash
npx create-lore myproject
```

This creates `lore-myproject/` with the full Lore framework — hooks, skills, scripts, and operating instructions that teach your coding agent to learn and remember across sessions.

## What you get

- **Instructions** — Operating instructions loaded automatically by each platform
- **Hooks** — Session init, memory guard, post-action capture reminders
- **Skills** — `create-skill` and `create-agent` for building your knowledge base
- **Scripts** — Registry generation, agent generation, consistency validation

## Supported platforms

- **Claude Code** — `hooks/` + `CLAUDE.md`
- **Cursor** — `.cursor/hooks/` + `.cursorrules`
- **OpenCode** — `.opencode/plugins/` + `opencode.json`

All platforms share the same knowledge base. No configuration needed.

## Options

```bash
npx create-lore myproject       # creates ./lore-myproject/
npx create-lore ./custom-path   # creates at specific path
```

## After setup

```bash
cd lore-myproject
git add -A && git commit -m "Init Lore"
```

Then open the project in your agent. Hooks fire automatically and the self-learning loop begins.

## Docs

Full documentation: [lorehq.github.io/lore-docs](https://lorehq.github.io/lore-docs/)

## License

Apache-2.0
