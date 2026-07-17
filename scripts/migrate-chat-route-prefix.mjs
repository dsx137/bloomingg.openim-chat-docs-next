import { readFile, readdir, writeFile } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

const root = process.cwd();
const roots = ['app', 'content/docs', 'content/zh', 'data/structure', 'scripts', 'src'];
const extensions = new Set(['.json', '.mdx', '.mjs', '.ts', '.tsx']);
const excluded = new Set([
  'scripts/__tests__/chat-route-prefix.test.mjs',
  'scripts/__tests__/home-route.test.mjs',
  'scripts/migrate-chat-route-prefix.mjs',
]);
const internalRoute = /(^|[\s"'`(=:[,{])\/docs\/chat(?=\/|["'`)\s?#,}])/gm;

let changedFiles = 0;
let replacements = 0;

for (const directory of roots) {
  for (const file of await walk(resolve(root, directory))) {
    const relativePath = relative(root, file).replaceAll('\\', '/');
    if (excluded.has(relativePath) || !extensions.has(extname(file))) continue;

    const source = await readFile(file, 'utf8');
    let fileReplacements = 0;
    let migrated = source.replace(internalRoute, (_, prefix) => {
      fileReplacements += 1;
      return prefix;
    });

    if (relativePath === 'scripts/sync-wasm-content-audit.mjs') {
      migrated = migrated.replace(
        "path.replace('/sdk/v4/wasm/', '/sdk/v4/javascript/')",
        "path.replace('/sdk/v4/wasm/', '/docs/chat/sdk/v4/javascript/')",
      );
    }

    if (migrated === source) continue;
    await writeFile(file, migrated, 'utf8');
    changedFiles += 1;
    replacements += fileReplacements;
  }
}

const routesPath = resolve(root, 'src/generated/routes.json');
const routes = JSON.parse(await readFile(routesPath, 'utf8'));
let relativePathChanges = 0;
for (const route of routes) {
  if (!route.relativePath?.startsWith('chat/')) continue;
  route.relativePath = route.relativePath.slice('chat/'.length);
  relativePathChanges += 1;
}
await writeFile(routesPath, `${JSON.stringify(routes, null, 2)}\n`, 'utf8');

console.log(
  `Migrated ${replacements.toLocaleString()} internal route references in ${changedFiles.toLocaleString()} files and ${relativePathChanges.toLocaleString()} relative paths.`,
);

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}
