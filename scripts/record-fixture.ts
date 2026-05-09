#!/usr/bin/env -S npx tsx
// Tiny one-time tool: hit an NHL endpoint, write the JSON to a fixture file.
// Manual use only — not wired into CI. Documented in README.
//
// Usage:
//   npx tsx scripts/record-fixture.ts <url> <output-path>
//
// Example:
//   npx tsx scripts/record-fixture.ts \
//     https://api-web.nhle.com/v1/schedule/2026-05-09 \
//     src/lib/nhl/schedule/__fixtures__/schedule.json

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

async function main() {
  const [url, outPath] = process.argv.slice(2);
  if (!url || !outPath) {
    console.error('usage: record-fixture <url> <output-path>');
    process.exit(2);
  }

  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    console.error(`HTTP ${response.status} ${response.statusText} for ${url}`);
    process.exit(1);
  }

  const json = await response.json();
  const absolute = resolve(outPath);
  await mkdir(dirname(absolute), { recursive: true });
  await writeFile(absolute, JSON.stringify(json, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${absolute}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
