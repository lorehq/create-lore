# Contributing to create-lore

Thanks for your interest in contributing. `create-lore` is the CLI scaffolder for [Lore](https://github.com/lorehq/lore).

## Dev Setup

```bash
git clone https://github.com/lorehq/create-lore.git
cd create-lore
```

Requires **Node.js 18+**. Zero runtime dependencies.

## Running Tests

```bash
npm test
```

Tests use `LORE_TEMPLATE` env var to point at a local lore repo instead of cloning from GitHub:

```bash
LORE_TEMPLATE=../lore npm test
```

## Pull Requests

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Run `npm test`
4. Open a pull request

## What We're Looking For

- Bug fixes with clear reproduction steps
- Better error messaging for common failure modes
- Test coverage improvements

## Guidelines

- Keep changes focused — one concern per PR
- Match existing code style
- For framework changes (hooks, skills, lib), contribute to [lorehq/lore](https://github.com/lorehq/lore) instead

## Reporting Issues

Use [GitHub Issues](../../issues). For security vulnerabilities, see [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contributions will be licensed under the Apache-2.0 license.
