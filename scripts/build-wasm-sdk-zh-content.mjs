import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.cwd();
const outputPath = resolve(root, 'src/generated/wasm-sdk-zh-content.json');

export function buildLocalizedSdkData({ routes, manualPages, auditPages, navigationLabels }) {
  const pages = {};
  const pendingPaths = [];
  const reviewStates = {};

  for (const route of routes) {
    const auditPage = auditPages.get(route.path);
    if (!auditPage) throw new Error(`Missing WASM content audit record: ${route.path}`);

    reviewStates[route.path] = auditPage.locales?.zh?.reviewStatus ?? 'structure-only';

    const manualPage = manualPages.get(route.path);
    if (!manualPage) {
      pendingPaths.push(route.path);
      continue;
    }

    const body = normalizeManualBody(manualPage.body);
    pages[route.path] = {
      body,
      description: manualPage.frontmatter.description ?? '',
      headings: extractHeadings(body),
      sourcePath: manualPage.frontmatter.sourcePath ?? '',
      title: manualPage.frontmatter.title ?? '',
    };
  }

  return {
    sourceContext: 'chat/sdk/wasm',
    sourceRoot: 'content/zh/docs/chat/sdk/wasm',
    pageCount: routes.length,
    manualPageCount: Object.keys(pages).length,
    pendingPaths,
    reviewStates,
    navigationLabels,
    pages,
  };
}

export function parseMdx(source) {
  const normalizedSource = source.replace(/\r\n?/g, '\n');
  const match = normalizedSource.match(/^---\n([\s\S]*?)\n---\n?/);
  const frontmatter = {};
  if (!match) return { body: normalizedSource.trim(), frontmatter };

  for (const line of match[1].split('\n')) {
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
    body: normalizedSource.slice(match[0].length).trim(),
    frontmatter,
  };
}

export function normalizeManualBody(body) {
  return body.replace(/\r\n?/g, '\n').trim();
}

export function resolveLocalizedRouteTitle(title, navigationLabels) {
  if (navigationLabels[title]) return navigationLabels[title];
  const normalizedTitle = title.toLocaleLowerCase();
  for (const [key, label] of Object.entries(navigationLabels)) {
    if (humanizeLabelKey(key).toLocaleLowerCase() === normalizedTitle) return label;
  }
  return undefined;
}

async function main() {
  const [routesData, auditData, navigationLabels] = await Promise.all([
    readJson('src/generated/routes.json'),
    readJson('data/structure/wasm-content-audit.json'),
    readJson('data/structure/wasm-navigation-labels.json'),
  ]);
  const routes = routesData
    .filter((route) => route.contextKey === 'chat/sdk/wasm')
    .sort((a, b) => a.navOrder - b.navOrder || a.sourceIndex - b.sourceIndex);
  const manualPages = await readManualPages(routes);
  const auditPages = new Map(auditData.pages.map((page) => [page.currentPath, page]));
  const output = buildLocalizedSdkData({
    routes,
    manualPages,
    auditPages,
    navigationLabels,
  });

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(
    `Packaged Chinese WASM SDK content (${output.manualPageCount} manual pages, ${output.pendingPaths.length} pending paths).`,
  );
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(resolve(root, relativePath), 'utf8'));
}

async function readManualPages(routes) {
  const pages = new Map();
  for (const route of routes) {
    const filePath = resolve(
      root,
      route.contentFile.replace(/^content\/docs\//, 'content/zh/docs/'),
    );
    try {
      pages.set(route.path, parseMdx(await readFile(filePath, 'utf8')));
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
  return pages;
}

function extractHeadings(body) {
  const nextHeadingId = createHeadingIdGenerator();
  return body
    .split('\n')
    .map((line) => line.match(/^(#{2,4})\s+(.+)$/))
    .filter(Boolean)
    .map((match) => {
      const title = match[2].trim();
      return {
        depth: match[1].length,
        title,
        url: `#${nextHeadingId(title)}`,
      };
    });
}

function createHeadingIdGenerator() {
  const counts = new Map();
  return (title) => {
    const base = headingId(title) || 'section';
    const count = (counts.get(base) ?? 0) + 1;
    counts.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  };
}

function headingId(value) {
  return value
    .replace(/[>#*_`]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

function humanizeLabelKey(value) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bIos\b/g, 'iOS')
    .replace(/\bSdk\b/g, 'SDK')
    .replace(/\bApi\b/g, 'API');
}

const isDirectExecution =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) await main();
