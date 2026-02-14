# create-lore

Create a new [Lore](https://github.com/lorehq/lore) knowledge-persistent AI coding framework repo.

## Usage

```bash
npx create-lore myproject
```

This creates `lore-myproject/` with the full Lore framework — hooks, skills, scripts, and operating instructions that teach your AI coding tool to learn and remember across sessions.

## What you get

- **AGENTS.md / CLAUDE.md** — Operating instructions your AI tool reads automatically
- **Hooks** — Session init, memory guard, post-action capture reminders
- **Skills** — `create-skill` and `create-agent` for building your knowledge base
- **Scripts** — Registry generation, agent generation, consistency validation

## Options

```bash
npx create-lore myproject                    # creates ./lore-myproject/
npx create-lore ./custom-path                # creates at specific path
npx create-lore myproject --template ./lore  # use local template instead of GitHub
```

## After setup

```bash
cd lore-myproject
git add -A && git commit -m "Init Lore"
```

Then open your AI coding tool in the project. The hooks will fire automatically and the self-learning loop begins.

## License

Apache-2.0
