// Tests for create-lore installer.
// Uses the local lore repo (sibling directory) as the template via LORE_TEMPLATE env var.
// Runs the installer in a subprocess and validates the output directory structure.

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BIN = path.resolve(__dirname, '../bin/create-lore.js');
const TEMPLATE = path.resolve(__dirname, '../../lore'); // Sibling lore repo
const OUTPUT = path.resolve(__dirname, '../test-output');

// Run the installer with LORE_TEMPLATE pointing at the local template
function run(args = '') {
  return execSync(`node ${BIN} ${args}`, {
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

  it('exits with error when no name given', () => {
    assert.throws(() => run(''), { status: 1 });
  });

  it('creates project directory with expected structure', () => {
    run(OUTPUT);

    assert.ok(fs.existsSync(OUTPUT), 'output directory exists');

    // .lore-config has required fields
    const config = JSON.parse(fs.readFileSync(path.join(OUTPUT, '.lore-config'), 'utf8'));
    assert.ok(config.name, 'name present');
    assert.ok(config.created, 'created date present');

    // Fresh git repo initialized (not cloned template history)
    assert.ok(fs.existsSync(path.join(OUTPUT, '.git')), 'git initialized');
    const entries = fs.readdirSync(path.join(OUTPUT, '.git'));
    assert.ok(entries.includes('HEAD'), '.git looks like a fresh init');
  });

  it('fails if target directory already exists', () => {
    fs.mkdirSync(OUTPUT, { recursive: true });
    assert.throws(() => run(OUTPUT), /already exists/);
    fs.rmSync(OUTPUT, { recursive: true });
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
    assert.ok(fs.existsSync(path.join(OUTPUT, '.opencode', 'plugins', 'session-init.js')),
      'session-init.js copied');
    assert.ok(fs.existsSync(path.join(OUTPUT, '.opencode', 'plugins', 'knowledge-tracker.js')),
      'knowledge-tracker.js copied');
    assert.ok(fs.existsSync(path.join(OUTPUT, '.opencode', 'plugins', 'protect-memory.js')),
      'protect-memory.js copied');
    assert.ok(fs.existsSync(path.join(OUTPUT, '.opencode', 'package.json')),
      '.opencode/package.json copied');
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
    if (!fs.existsSync(path.join(TEMPLATE, 'scripts/validate-consistency.sh'))) return;

    run(OUTPUT);
    const result = execSync('bash scripts/validate-consistency.sh', {
      cwd: OUTPUT,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    assert.ok(result.includes('PASSED'), 'validation passes');
    cleanup();
  });
});
