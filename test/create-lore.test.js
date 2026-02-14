const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BIN = path.resolve(__dirname, '../bin/create-lore.js');
const TEMPLATE = path.resolve(__dirname, '../../lore');
const OUTPUT = path.resolve(__dirname, '../test-output');

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
    const output = run(`${OUTPUT} --template ${TEMPLATE}`);

    assert.ok(fs.existsSync(OUTPUT), 'output directory exists');

    // .lore-config written with correct fields
    const config = JSON.parse(fs.readFileSync(path.join(OUTPUT, '.lore-config'), 'utf8'));
    assert.equal(config.name, OUTPUT);
    assert.ok(Array.isArray(config.tools), 'tools is an array');
    assert.ok(config.created, 'created date present');

    // git repo initialized
    assert.ok(fs.existsSync(path.join(OUTPUT, '.git')), 'git initialized');

    // no template .git leaked
    const entries = fs.readdirSync(path.join(OUTPUT, '.git'));
    assert.ok(entries.includes('HEAD'), '.git looks like a fresh init');
  });

  it('fails if target directory already exists', () => {
    fs.mkdirSync(OUTPUT, { recursive: true });
    assert.throws(() => run(`${OUTPUT} --template ${TEMPLATE}`), /already exists/);
    fs.rmSync(OUTPUT, { recursive: true });
  });

  // These tests activate as lore repo gets populated (Phase 2+)

  it('has AGENTS.md when template provides it', () => {
    const agentsMd = path.join(TEMPLATE, 'AGENTS.md');
    if (!fs.existsSync(agentsMd)) return; // skip until Phase 2

    run(`${OUTPUT} --template ${TEMPLATE}`);
    assert.ok(fs.existsSync(path.join(OUTPUT, 'AGENTS.md')), 'AGENTS.md copied');
    const content = fs.readFileSync(path.join(OUTPUT, 'AGENTS.md'), 'utf8');
    assert.ok(content.length > 0, 'AGENTS.md is non-empty');
    cleanup();
  });

  it('has hooks wired in .claude/settings.json when template provides it', () => {
    const settings = path.join(TEMPLATE, '.claude/settings.json');
    if (!fs.existsSync(settings)) return; // skip until Phase 3

    run(`${OUTPUT} --template ${TEMPLATE}`);
    const parsed = JSON.parse(fs.readFileSync(path.join(OUTPUT, '.claude/settings.json'), 'utf8'));
    assert.ok(parsed.hooks, 'hooks key exists in settings');
    cleanup();
  });

  it('passes validate-consistency.sh when template provides it', () => {
    const script = path.join(TEMPLATE, 'scripts/validate-consistency.sh');
    if (!fs.existsSync(script)) return; // skip until Phase 5

    run(`${OUTPUT} --template ${TEMPLATE}`);
    const result = execSync(`bash scripts/validate-consistency.sh`, {
      cwd: OUTPUT,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    assert.ok(result.includes('PASSED'), 'validation passes');
    cleanup();
  });
});
