#!/usr/bin/env node
/**
 * Spacing-palette audit for ClockMath.
 *
 * The sanctioned scale lives in app/globals.css (see the "Spacing scale"
 * comment). This script scans first-party .tsx files and reports spacing
 * utilities outside the palette so drift is visible before it ships.
 *
 * Usage: node scripts/spacing-audit.js        (report only)
 *        node scripts/spacing-audit.js --strict  (exit 1 on violations)
 */
const fs = require('fs');
const path = require('path');

// Sanctioned values per the scale: micro 1/1.5/2/3, block 4/6, plus the
// specific larger values each pattern is allowed to use.
const ALLOWED = {
  p: ['1', '1.5', '2', '2.5', '3', '3.5', '4', '5', '6', '8'],
  px: ['1', '1.5', '2', '2.5', '3', '4', '5', '6'],
  py: ['0.5', '1', '1.5', '2', '2.5', '3', '4', '5', '6', '10'],
  gap: ['0.5', '1', '1.5', '2', '2.5', '3', '4', '6'],
  mb: ['0.5', '1', '1.5', '2', '3', '4', '6', '8', 'section'],
  mt: ['0.5', '1', '2', '3', '4', '6', '8', 'section'],
  my: ['2', '6', '8'],
  'space-y': ['1', '2', '3', '4', '6', 'section'],
  pt: ['1', '2', '3', '4', '6', '10'],
  pb: ['1', '2', '3', '4', '6', '10'],
  'space-x': ['1', '2', '3', '4'],
};

const RX = /\b(p|px|py|pt|pb|gap|mb|mt|my|space-y|space-x)-([0-9]+(?:\.[0-9]+)?|section)\b/g;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (p.includes(`components${path.sep}ui`)) continue;
      walk(p, out);
    } else if (e.name.endsWith('.tsx')) out.push(p);
  }
  return out;
}

const files = [...walk('app'), ...walk('components')];
const violations = [];
for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const m of line.matchAll(RX)) {
      const [, prefix, value] = m;
      if (ALLOWED[prefix] && !ALLOWED[prefix].includes(value)) {
        violations.push(`${file}:${i + 1}  ${prefix}-${value}`);
      }
    }
  });
}

if (violations.length) {
  console.log(`Off-palette spacing (${violations.length}):`);
  for (const v of violations) console.log('  ' + v);
} else {
  console.log('Spacing palette clean — no off-scale utilities in first-party code.');
}
if (process.argv.includes('--strict') && violations.length) process.exit(1);
