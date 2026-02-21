// Tests for create-lore installer.
// Uses the local lore repo (sibling directory) as the template via LORE_TEMPLATE env var.
// Runs the installer in a subprocess and validates the output directory structure.

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { execSync, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BIN = path.resolve(__dirname, '../bin/create-lore.js');
const TEMPLATE = process.env.LORE_TEMPLATE || path.resolve(__dirname, '../../lore');
const OUTPUT = path.resolve(__dirname, '../test-output');

// Run the installer with LORE_TEMPLATE pointing at the local template
function run(args = '') {
  return execFileSync('node', [BIN, ...args.split(' ').filter(Boolean)], {
    env: { ...process.env, LORE_TEMPLATE: TEMPLATE },
    stdio: 'pipe',
    encoding: 'utf8',
  });
}

// Run with exact argv (no shell interpretation) — for testing shell metacharacters
function runExact(name) {
  return execFileSync('node', [BIN, name], {
    env: { ...process.env, LORE_TEMPLATE: TEMPLATE },
    stdio: 'pipe',
    encoding: 'utf8',
  });
}

function cleanup() {
  if (fs.existsSync(OUTPUT)) fs.rmSync(OUTPUT, { recursive: true });
}

describe('create-lore', () => {
  before(cleanup);
  after(cleanup);

  it('--help shows usage text', () => {
    const output = run('--help');
    assert.ok(output.includes('Usage:'), 'shows usage');
    assert.ok(output.includes('create-lore'), 'mentions create-lore');
  });

  it('--version outputs package.json version', () => {
    const output = run('--version');
    const pkg = require('../package.json');
    assert.equal(output.trim(), pkg.version);
  });

  it('exits with error when no name given', () => {
    assert.throws(() => run(''), { status: 1 });
  });

  it('creates project directory with expected structure', () => {
    run(OUTPUT);

    assert.ok(fs.existsSync(OUTPUT), 'output directory exists');

    // .lore/config.json has required fields (JSONC — strip comments before parsing)
    const raw = fs.readFileSync(path.join(OUTPUT, '.lore', 'config.json'), 'utf8');
    const config = JSON.parse(raw.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/,(\s*[}\]])/g, '$1'));
    assert.ok(config.name, 'name present');
    assert.ok(config.created, 'created date present');

    // Fresh git repo initialized (not cloned template history)
    assert.ok(fs.existsSync(path.join(OUTPUT, '.git')), 'git initialized');
    const entries = fs.readdirSync(path.join(OUTPUT, '.git'));
    assert.ok(entries.includes('HEAD'), '.git looks like a fresh init');
  });

  it('strips dev-only files from scaffolded instance', () => {
    cleanup();
    run(OUTPUT);

    const devOnly = [
      'test', '.github', 'node_modules', 'site',
      'docs/assets', 'docs/javascripts', 'docs/stylesheets',
      'CODE_OF_CONDUCT.md', 'CONTRIBUTING.md', 'SECURITY.md',
      'LICENSE', 'README.md', '.prettierrc', '.prettierignore',
      'eslint.config.js', 'package-lock.json',
    ];
    for (const name of devOnly) {
      assert.ok(!fs.existsSync(path.join(OUTPUT, name)), `${name} should be stripped`);
    }
    cleanup();
  });

  it('fails if target directory already exists', () => {
    fs.mkdirSync(OUTPUT, { recursive: true });
    assert.throws(() => run(OUTPUT), /already exists/);
    fs.rmSync(OUTPUT, { recursive: true });
  });

  it('rejects names with shell metacharacters', () => {
    assert.throws(() => runExact('foo;echo pwned'), /Invalid project name/);
    assert.throws(() => runExact('foo$(cmd)'), /Invalid project name/);
    assert.throws(() => runExact('foo|bar'), /Invalid project name/);
  });

  it('rejects path arguments with shell metacharacters in basename', () => {
    assert.throws(() => runExact('./foo;rm'), /Invalid project name/);
    assert.throws(() => runExact('/tmp/bad$(cmd)'), /Invalid project name/);
  });

  // -- Template content tests --
  // These skip gracefully if the template hasn't reached that phase yet.

  it('has CLAUDE.md when template provides it', () => {
    if (!fs.existsSync(path.join(TEMPLATE, 'CLAUDE.md'))) return;

    run(OUTPUT);
    assert.ok(fs.existsSync(path.join(OUTPUT, 'CLAUDE.md')), 'CLAUDE.md copied');
    const content = fs.readFileSync(path.join(OUTPUT, 'CLAUDE.md'), 'utf8');
    assert.ok(content.length > 0, 'CLAUDE.md is non-empty');
    cleanup();
  });

  it('has hooks wired in .claude/settings.json when template provides it', () => {
    if (!fs.existsSync(path.join(TEMPLATE, '.claude/settings.json'))) return;

    run(OUTPUT);
    const parsed = JSON.parse(fs.readFileSync(path.join(OUTPUT, '.claude/settings.json'), 'utf8'));
    assert.ok(parsed.hooks, 'hooks key exists in settings');
    cleanup();
  });

  it('has OpenCode plugins when template provides them', () => {
    if (!fs.existsSync(path.join(TEMPLATE, '.opencode/plugins'))) return;

    run(OUTPUT);
    assert.ok(fs.existsSync(path.join(OUTPUT, '.opencode', 'plugins', 'session-init.js')), 'session-init.js copied');
    assert.ok(
      fs.existsSync(path.join(OUTPUT, '.opencode', 'plugins', 'knowledge-tracker.js')),
      'knowledge-tracker.js copied',
    );
    assert.ok(
      fs.existsSync(path.join(OUTPUT, '.opencode', 'plugins', 'protect-memory.js')),
      'protect-memory.js copied',
    );
    assert.ok(fs.existsSync(path.join(OUTPUT, '.opencode', 'package.json')), '.opencode/package.json copied');
    cleanup();
  });

  it('has opencode.json when template provides it', () => {
    if (!fs.existsSync(path.join(TEMPLATE, 'opencode.json'))) return;

    run(OUTPUT);
    const parsed = JSON.parse(fs.readFileSync(path.join(OUTPUT, 'opencode.json'), 'utf8'));
    assert.ok(parsed.instructions, 'instructions key exists');
    assert.ok(parsed.instructions.includes('.lore/instructions.md'), 'instructions includes .lore/instructions.md');
    cleanup();
  });

  it('passes validate-consistency.sh when template provides it', () => {
    if (!fs.existsSync(path.join(TEMPLATE, '.lore/scripts/validate-consistency.sh'))) return;

    run(OUTPUT);
    const result = execSync('bash .lore/scripts/validate-consistency.sh', {
      cwd: OUTPUT,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    assert.ok(result.includes('PASSED'), 'validation passes');
    cleanup();
  });
});
