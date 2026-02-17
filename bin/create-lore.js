#!/usr/bin/env node

// create-lore: Bootstrap a new Lore knowledge-persistent agent repo.
//
// Usage: npx create-lore <name|path>
//
// How it works:
//   1. Clones the Lore template from GitHub (or copies from LORE_TEMPLATE env var)
//   2. Strips the template's .git history
//   3. Writes a .lore-config with the project name and creation date
//   4. Runs git init for a clean start
//
// The LORE_TEMPLATE env var is used by tests to point at a local template
// directory instead of cloning from GitHub.

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_URL = 'https://github.com/lorehq/lore.git';

// -- Parse arguments --
const name = process.argv[2];
if (!name) {
  console.error('Usage: create-lore <name>');
  process.exit(1);
}

// If the name contains a path separator, treat it as a custom path.
// Otherwise, create a {name}/ directory in the current folder.
const isPath = name.includes('/') || name.includes(path.sep);
const targetDir = path.resolve(isPath ? name : `./${name}`);

if (fs.existsSync(targetDir)) {
  console.error(`Error: ${targetDir} already exists`);
  process.exit(1);
}

// -- Copy template to target --
// Clone from GitHub or copy from a local template directory.
// Uses a temp dir so we can strip .git before copying to the final location.
const tmpDir = path.join(require('os').tmpdir(), `create-lore-${Date.now()}`);
try {
  const templateDir = process.env.LORE_TEMPLATE;
  if (templateDir) {
    fs.cpSync(templateDir, tmpDir, { recursive: true });
  } else {
    execSync(`git clone --depth 1 ${REPO_URL} "${tmpDir}"`, { stdio: 'pipe' });
  }
  fs.rmSync(path.join(tmpDir, '.git'), { recursive: true, force: true });
  fs.cpSync(tmpDir, targetDir, { recursive: true });
} finally {
  // Always clean up the temp dir
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });
}

// -- Write .lore-config --
const projectName = isPath ? path.basename(targetDir) : name;
const templateConfig = JSON.parse(fs.readFileSync(path.join(targetDir, '.lore-config'), 'utf8'));
const config = { name: projectName, version: templateConfig.version || '0.0.0', created: new Date().toISOString().split('T')[0] };
fs.writeFileSync(path.join(targetDir, '.lore-config'), JSON.stringify(config, null, 2) + '\n');

// -- Initialize git --
execSync('git init', { cwd: targetDir, stdio: 'pipe' });

// -- Done --
console.log(`\nCreated ${targetDir}`);
console.log(`\nNext steps:`);
console.log(`  cd ${targetDir}`);
console.log(`  git add -A && git commit -m "Init Lore"`);
