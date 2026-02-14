#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const TOOLS = ['Claude Code', 'Cursor', 'OpenCode'];
const REPO_URL = 'https://github.com/lorehq/lore.git';

async function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer); }));
}

async function selectTools() {
  console.log('\nWhich AI coding tools will you use?\n');
  TOOLS.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
  console.log();
  const answer = await prompt('Select tools (comma-separated numbers, e.g. 1,3): ');
  const indices = answer.split(',').map(s => parseInt(s.trim(), 10) - 1);
  const selected = indices.filter(i => i >= 0 && i < TOOLS.length).map(i => TOOLS[i]);
  return selected.length > 0 ? selected : ['Claude Code'];
}

async function main() {
  const args = process.argv.slice(2);
  const name = args.find(a => !a.startsWith('-'));
  const templateDir = args.find((a, i) => args[i - 1] === '--template') || process.env.LORE_TEMPLATE;

  if (!name) {
    console.error('Usage: create-lore <name> [--template <path>]');
    process.exit(1);
  }

  const isPath = name.includes('/') || name.includes(path.sep);
  const targetDir = path.resolve(isPath ? name : `./lore-${name}`);

  if (fs.existsSync(targetDir)) {
    console.error(`Error: ${targetDir} already exists`);
    process.exit(1);
  }

  // Clone or copy template
  const tmpDir = path.join(require('os').tmpdir(), `create-lore-${Date.now()}`);
  try {
    if (templateDir) {
      console.log(`Copying template from ${templateDir}...`);
      copyDir(templateDir, tmpDir);
    } else {
      console.log(`Cloning ${REPO_URL}...`);
      execSync(`git clone --depth 1 ${REPO_URL} "${tmpDir}"`, { stdio: 'pipe' });
    }

    // Remove .git from clone
    const gitDir = path.join(tmpDir, '.git');
    if (fs.existsSync(gitDir)) fs.rmSync(gitDir, { recursive: true });

    // Copy to target
    copyDir(tmpDir, targetDir);
  } finally {
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });
  }

  // Select tools (skip in non-interactive mode)
  let tools = ['Claude Code'];
  if (process.stdin.isTTY) {
    tools = await selectTools();
  }

  // Write .lore-config
  const config = { name, tools, created: new Date().toISOString().split('T')[0] };
  fs.writeFileSync(path.join(targetDir, '.lore-config'), JSON.stringify(config, null, 2) + '\n');

  // Init git repo
  execSync('git init', { cwd: targetDir, stdio: 'pipe' });

  console.log(`\nCreated lore-${name} at ${targetDir}`);
  console.log(`Tools: ${tools.join(', ')}`);
  console.log(`\nNext steps:`);
  console.log(`  cd ${targetDir}`);
  console.log(`  git add -A && git commit -m "Init Lore"`);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

main().catch(err => { console.error(err.message); process.exit(1); });
