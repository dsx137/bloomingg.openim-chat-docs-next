import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const wasmContext = 'chat/sdk/wasm';

export function buildSearchIndexes({ routes, sourcePages, manualZhPages, auditPages }) {
  const indexes = { en: [], zh: [] };

  for (const route of routes) {
    const sourcePage = sourcePages.get(route.path);
    if (!sourcePage) throw new Error(`${route.path}: missing source page`);

    if (route.contextKey !== wasmContext) {
      indexes.en.push(createSearchRecord(route, sourcePage));
      indexes.zh.push(createSearchRecord(route, sourcePage));
      continue;
    }

    const auditPage = auditPages.get(route.path);
    if (!auditPage) throw new Error(`${route.path}: missing audit record`);
    if (auditPage?.locales?.en?.reviewStatus === 'published') {
      indexes.en.push(createSearchRecord(route, sourcePage));
    }
    if (auditPage?.locales?.zh?.reviewStatus === 'published') {
      const manualPage = manualZhPages.get(route.path);
      if (!manualPage) {
        throw new Error(`${route.path}: published zh search page requires manual MDX`);
      }
      indexes.zh.push(createSearchRecord(route, manualPage));
    }
  }

  return indexes;
}

export async function buildSearchIndexFiles({
  routesPath = resolve(root, 'src/generated/routes.json'),
  auditPath = resolve(root, 'data/structure/wasm-content-audit.json'),
  enOutputPath = resolve(root, 'src/generated/search-index.json'),
  zhOutputPath = resolve(root, 'src/generated/search-index-zh.json'),
} = {}) {
  const [routes, audit] = await Promise.all([readJson(routesPath), readJson(auditPath)]);
  const sourcePages = new Map(
    await Promise.all(
      routes.map(async (route) => {
        const source = await readFile(resolve(root, route.contentFile), 'utf8');
        return [route.path, parseMdx(source)];
      }),
    ),
  );
  const wasmRoutes = routes.filter((route) => route.contextKey === wasmContext);
  const manualEntries = await Promise.all(
    wasmRoutes.map(async (route) => {
      const path = resolve(
        root,
        route.contentFile.replace(/^content\/docs\//, 'content/zh/docs/'),
      );
      try {
        return [route.path, parseMdx(await readFile(path, 'utf8'))];
      } catch (error) {
        if (error?.code === 'ENOENT') return undefined;
        throw error;
      }
    }),
  );
  const manualZhPages = new Map(manualEntries.filter(Boolean));
  const auditPages = new Map(audit.pages.map((page) => [page.currentPath, page]));
  const indexes = buildSearchIndexes({ routes, sourcePages, manualZhPages, auditPages });

  await Promise.all([
    writeFile(enOutputPath, `${JSON.stringify(indexes.en, null, 2)}\n`, 'utf8'),
    writeFile(zhOutputPath, `${JSON.stringify(indexes.zh, null, 2)}\n`, 'utf8'),
  ]);
  return { en: indexes.en.length, zh: indexes.zh.length };
}

function createSearchRecord(route, page) {
  return {
    path: route.path,
    title: page.title ?? route.title,
    description: page.description ?? route.description,
    context: route.contextTitle,
    keywords: [route.product, route.platform, route.version, ...route.relativePath.split('/')]
      .filter(Boolean)
      .join(' '),
    content: normalizeBody(page.body).slice(0, 12_000),
  };
}

function parseMdx(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const frontmatter = {};
  if (!match) return { body: source.trim() };

  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    const raw = line.slice(separator + 1).trim();
    if (!key || !raw) continue;
    try {
      frontmatter[key] = JSON.parse(raw);
    } catch {
      frontmatter[key] = raw.replace(/^['"]|['"]$/g, '');
    }
  }

  return {
    body: source.slice(match[0].length).trim(),
    description: frontmatter.description,
    title: frontmatter.title,
  };
}

function normalizeBody(value) {
  return value
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```\w*/g, ' '))
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#{}`*_>[\]()!-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : undefined;
if (invokedPath === import.meta.url) {
  buildSearchIndexFiles()
    .then(({ en, zh }) => {
      console.log(`Wrote ${en.toLocaleString()} English and ${zh.toLocaleString()} Chinese search records.`);
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
