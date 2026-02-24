#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const ignoreNames = new Set(['.git', '_site', 'node_modules']);
const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;

function walk(dir, acc) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoreNames.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, acc);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      acc.push(full);
    }
  }
}

function isExternal(target) {
  return /^(https?:)?\/\//.test(target) || target.startsWith('#') || target.startsWith('mailto:') || target.startsWith('tel:');
}

function checkFile(filePath) {
  const rel = path.relative(root, filePath);
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);
  const broken = [];

  lines.forEach((line, idx) => {
    let m;
    while ((m = linkRe.exec(line)) !== null) {
      const label = m[1].trim();
      const href = m[2].trim();
      if (!href || isExternal(href)) continue;
      const base = href.split('#', 1)[0];
      if (!base) continue;
      const targetPath = path.normalize(path.join(path.dirname(filePath), base));
      if (!fs.existsSync(targetPath)) {
        broken.push({ line: idx + 1, label, href });
      }
    }
  });

  return { rel, broken };
}

function main() {
  const files = [];
  walk(root, files);

  let totalBroken = 0;
  files.sort();

  for (const file of files) {
    const { rel, broken } = checkFile(file);
    if (!broken.length) continue;
    totalBroken += broken.length;
    console.log(`\n${rel}`);
    for (const b of broken) {
      console.log(`  - line ${b.line}: "${b.label}" -> ${b.href}`);
    }
  }

  if (!totalBroken) {
    console.log('No broken relative links found.');
  } else {
    console.log(`\nTotal broken links: ${totalBroken}`);
    process.exitCode = 1;
  }
}

main();
