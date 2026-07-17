import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const contextKey = 'chat/sdk/wasm';
const routes = JSON.parse(await readFile('src/generated/routes.json', 'utf8'))
  .filter((route) => route.contextKey === contextKey)
  .sort((left, right) => left.navOrder - right.navOrder);

for (const route of routes) {
  const target = resolve('content', `${route.path.slice(1)}.mdx`);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, scaffold(route), 'utf8');
}

console.log(`Deferred ${routes.length} English WASM pages.`);

function scaffold(route) {
  return [
    '---',
    `title: '${escapeValue(route.title)}'`,
    `description: 'English content is deferred while the reviewed Chinese OpenIM WASM SDK documentation is completed.'`,
    "product: 'sdk'",
    `context: '${contextKey}'`,
    `template: '${route.template}'`,
    "status: 'draft'",
    "lastUpdated: '2026-07-14'",
    `version: '${route.version}'`,
    `platform: '${route.platform}'`,
    `sourcePath: '${route.path}'`,
    '---',
    '',
    '## Overview',
    '',
    'The English version of this OpenIM WASM SDK guide is deferred until the reviewed Chinese documentation is complete.',
    '',
  ].join('\n');
}

function escapeValue(value) {
  return String(value).replaceAll("'", "''");
}
