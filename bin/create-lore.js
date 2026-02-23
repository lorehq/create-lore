#!/usr/bin/env node

// create-lore: Bootstrap a new Lore knowledge-persistent agent repo.
//
// Usage: npx create-lore <name|path>
//
// How it works:
//   1. Clones the Lore template from GitHub (or copies from LORE_TEMPLATE env var)
//   2. Strips the template's .git history
//   3. Writes .lore/config.json with the project name and creation date
//   4. Runs git init for a clean start
//
// The LORE_TEMPLATE env var is used by tests to point at a local template
// directory instead of cloning from GitHub.

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_URL = 'https://github.com/lorehq/lore.git';
const pkg = require('../package.json');

// -- Parse arguments --
const arg = process.argv[2];
if (arg === '--help' || arg === '-h') {
  console.log(`create-lore v${pkg.version}\n`);
  console.log('Usage: create-lore <name|path>\n');
  console.log('Bootstrap a new Lore knowledge-persistent agent repo.\n');
  console.log('Examples:');
  console.log('  npx create-lore myproject       # creates ./myproject/');
  console.log('  npx create-lore ./custom-path   # creates at specific path');
  process.exit(0);
}
if (arg === '--version' || arg === '-v') {
  console.log(pkg.version);
  process.exit(0);
}

const name = arg;
if (!name) {
  console.error('Usage: create-lore <name>');
  process.exit(1);
}

// If the name contains a path separator, treat it as a custom path.
// Otherwise, create a {name}/ directory in the current folder.
const isPath = name.includes('/') || name.includes(path.sep);
const targetDir = path.resolve(isPath ? name : `./${name}`);

// Validate every segment of the resolved path's tail (the parts the user controls).
// For simple names, validate the name directly. For paths, validate the basename.
// This prevents shell-hostile characters like ; | & $ ` from sneaking through.
const segmentPattern = /^[a-zA-Z0-9._-]+$/;
const finalName = path.basename(targetDir);
if (!segmentPattern.test(finalName)) {
  console.error(`Error: Invalid project name '${finalName}'`);
  console.error('Names may contain letters, numbers, dots, hyphens, and underscores.');
  process.exit(1);
}

// Guard against path traversal — resolved target must be under cwd
const cwd = process.cwd();
if (!targetDir.startsWith(cwd + path.sep) && targetDir !== cwd) {
  console.error(`Error: Target directory '${targetDir}' is outside the current working directory.`);
  console.error('Use a relative name or path within the current directory.');
  process.exit(1);
}

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
    try {
      execSync(`git clone --depth 1 --branch v${pkg.version} ${REPO_URL} "${tmpDir}"`, { stdio: 'pipe' });
    } catch (err) {
      const stderr = err.stderr ? err.stderr.toString() : '';
      if (stderr.includes('not found') || stderr.includes('not a valid')) {
        console.error(`Error: Version tag v${pkg.version} not found in ${REPO_URL}`);
        console.error('This usually means the release tag is missing. Try:');
        console.error('  npx create-lore@latest ' + name);
      } else if (stderr.includes('Could not resolve host') || stderr.includes('unable to access')) {
        console.error('Error: Cannot reach github.com');
        console.error('Check your internet connection, DNS, and firewall/proxy settings.');
      } else {
        console.error('Error: Failed to clone template from GitHub');
        console.error(stderr.trim() || err.message);
      }
      process.exit(1);
    }
  }
  fs.rmSync(path.join(tmpDir, '.git'), { recursive: true, force: true });

  // Only keep files needed in instances — remove everything else
  const keep = new Set([
    '.lore',
    '.claude',
    '.cursor',
    '.opencode',
    'docs',
    'CLAUDE.md',
    'opencode.json',
    '.mcp.json',
    '.gitattributes',
    '.gitignore',
  ]);
  for (const entry of fs.readdirSync(tmpDir)) {
    if (!keep.has(entry)) {
      fs.rmSync(path.join(tmpDir, entry), { recursive: true, force: true });
    }
  }

  fs.cpSync(tmpDir, targetDir, { recursive: true });
} finally {
  // Always clean up the temp dir
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });
}

// -- Write .lore/config.json --
const projectName = isPath ? path.basename(targetDir) : name;
// Read version from the copied config.json, then rewrite from template
let templateConfig;
try {
  templateConfig = JSON.parse(fs.readFileSync(path.join(targetDir, '.lore', 'config.json'), 'utf8'));
} catch {
  templateConfig = {};
}
const templateVersion = templateConfig.version || '0.0.0';
const createdDate = new Date().toISOString().split('T')[0];
const configTemplate = fs.readFileSync(path.join(targetDir, '.lore', 'templates', 'config.json'), 'utf8');
const configContent = configTemplate
  .replace('{{name}}', projectName)
  .replace('{{version}}', templateVersion)
  .replace('{{created}}', createdDate);
fs.writeFileSync(path.join(targetDir, '.lore', 'config.json'), configContent);

// -- Create gitignored files from templates --
// Templates are already in targetDir (copied from the template clone via .lore/).
// These are normally recreated by ensureStickyFiles() each session, but the
// installer should produce a complete instance from the start.
const tplDir = path.join(targetDir, '.lore', 'templates');
const localDir = path.join(targetDir, 'docs', 'knowledge', 'local');
fs.mkdirSync(localDir, { recursive: true });

fs.writeFileSync(path.join(localDir, 'index.md'), fs.readFileSync(path.join(tplDir, 'local-index.md'), 'utf8'));
fs.writeFileSync(
  path.join(localDir, 'operator-profile.md'),
  fs.readFileSync(path.join(tplDir, 'operator-profile.md'), 'utf8'),
);
fs.writeFileSync(
  path.join(targetDir, '.lore', 'memory.local.md'),
  fs.readFileSync(path.join(tplDir, 'memory-local.md'), 'utf8'),
);

// -- Write .env for docker compose project naming --
// docker compose reads .env from the project directory (where the command runs),
// not from the directory containing the compose file.
const envContent = fs.readFileSync(path.join(tplDir, 'env.template'), 'utf8')
  .replace('{{name}}', projectName);
fs.writeFileSync(path.join(targetDir, '.env'), envContent);

// -- Initialize git --
execSync('git init -b main', { cwd: targetDir, stdio: 'pipe' });

// -- Done --
console.log(`\nCreated ${name}`);
console.log(`\nNext steps:`);
console.log(`  cd ${name}`);
console.log(`  git add -A && git commit -m "Init Lore"`);
