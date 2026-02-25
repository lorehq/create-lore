# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public GitHub issue
2. Email the maintainers or use [GitHub's private vulnerability reporting](../../security/advisories/new)
3. Include steps to reproduce and potential impact

We will acknowledge receipt within 48 hours and provide a timeline for a fix.

## Scope

`create-lore` is a CLI scaffolder that clones a template repo and initializes a new project. Security concerns are primarily:

- Shell command execution during project scaffolding (`git clone`, `git init`)
- Template integrity (clones from a pinned version tag on GitHub)

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.14.x  | Yes       |
