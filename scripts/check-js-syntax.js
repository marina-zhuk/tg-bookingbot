const { readdirSync, statSync } = require('fs');
const { join, relative } = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['.git', 'node_modules', '.vercel', 'data', 'logs', 'coverage', 'dist', 'build']);

function collectJsFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) collectJsFiles(full, out);
    else if (entry.endsWith('.js')) out.push(full);
  }
  return out;
}

const files = collectJsFiles(ROOT);
let failed = 0;

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], {
    cwd: ROOT,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    failed += 1;
    console.error(`\nSyntax check failed: ${relative(ROOT, file)}`);
    if (result.stdout) console.error(result.stdout.trim());
    if (result.stderr) console.error(result.stderr.trim());
  }
}

if (failed > 0) {
  console.error(`\n${failed} file(s) failed syntax check.`);
  process.exit(1);
}

console.log(`node --check OK: ${files.length} JS files`);
