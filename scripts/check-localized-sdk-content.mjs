import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  normalizeManualBody,
  parseMdx,
  resolveLocalizedRouteTitle,
} from './build-wasm-sdk-zh-content.mjs';

const root = process.cwd();
const manualRoot = resolve(root, 'content/zh/docs/chat/sdk/wasm');

export function validateLocalizedSdkData({ routes, manualPages, auditPages, localized }) {
  const errors = [];
  const routePaths = routes.map((route) => route.path);
  const manualPaths = [...manualPages.keys()].sort();
  const generatedPaths = Object.keys(localized?.pages ?? {}).sort();
  const expectedPendingPaths = routePaths.filter((path) => !manualPages.has(path));
  const actualPendingPaths = localized?.pendingPaths ?? [];

  if (!sameArray(generatedPaths, manualPaths)) {
    errors.push(
      `generated page keys differ from manual MDX paths: expected ${manualPaths.length}, found ${generatedPaths.length}`,
    );
  }
  if (!sameArray(actualPendingPaths, expectedPendingPaths)) {
    errors.push(
      `pending paths differ from active routes without manual MDX: expected ${expectedPendingPaths.length}, found ${actualPendingPaths.length}`,
    );
  }
  if (localized?.pageCount !== routes.length) {
    errors.push(`pageCount: expected ${routes.length}, found ${String(localized?.pageCount)}`);
  }
  if (localized?.manualPageCount !== manualPaths.length) {
    errors.push(
      `manualPageCount: expected ${manualPaths.length}, found ${String(localized?.manualPageCount)}`,
    );
  }
  if (localized?.sourceRoot !== 'content/zh/docs/chat/sdk/wasm') {
    errors.push(`sourceRoot must identify the manual Chinese MDX directory`);
  }

  for (const path of generatedPaths) {
    const page = localized.pages[path];
    const manualPage = manualPages.get(path);
    if (!manualPage) continue;

    if (!auditPages.has(path)) errors.push(`${path}: generated page is missing an audit record`);
    if (!manualPage.frontmatter.title?.trim()) {
      errors.push(`${path}: manual MDX requires a non-empty title`);
    }
    if (!manualPage.frontmatter.description?.trim()) {
      errors.push(`${path}: manual MDX requires a non-empty description`);
    }
    if (manualPage.frontmatter.sourcePath !== path) {
      errors.push(`${path}: manual MDX sourcePath must equal the route path`);
    }
    if (page.body !== normalizeManualBody(manualPage.body)) {
      errors.push(`${path}: generated body differs from normalized manual MDX`);
    }
    if (page.title !== (manualPage.frontmatter.title ?? '')) {
      errors.push(`${path}: generated title differs from manual MDX`);
    }
    if (page.description !== (manualPage.frontmatter.description ?? '')) {
      errors.push(`${path}: generated description differs from manual MDX`);
    }
    if (page.sourcePath !== (manualPage.frontmatter.sourcePath ?? '')) {
      errors.push(`${path}: generated sourcePath differs from manual MDX`);
    }
  }

  for (const path of expectedPendingPaths) {
    if (localized?.pages?.[path]) errors.push(`${path}: pending path has generated body`);
  }

  for (const route of routes) {
    const path = route.path;
    const structuralTitle = resolveLocalizedRouteTitle(
      route.title,
      localized?.navigationLabels ?? {},
    );
    if (!/[\u3400-\u9fff]/.test(structuralTitle ?? '')) {
      errors.push(`${path}: active route requires a Chinese structural title`);
    }

    const expectedState = auditPages.get(path)?.locales?.zh?.reviewStatus;
    if (!expectedState) {
      errors.push(`${path}: active route is missing a Chinese audit state`);
    } else if (localized?.reviewStates?.[path] !== expectedState) {
      errors.push(`${path}: generated review state differs from audit manifest`);
    }
  }

  return errors.sort();
}

async function main() {
  const [routesData, auditData, localized, manualPages] = await Promise.all([
    readJson('src/generated/routes.json'),
    readJson('data/structure/wasm-content-audit.json'),
    readJson('src/generated/wasm-sdk-zh-content.json'),
    readManualPages(),
  ]);
  const routes = routesData
    .filter((route) => route.contextKey === 'chat/sdk/wasm')
    .sort((a, b) => a.navOrder - b.navOrder || a.sourceIndex - b.sourceIndex);
  const auditPages = new Map(auditData.pages.map((page) => [page.currentPath, page]));
  const errors = validateLocalizedSdkData({ routes, manualPages, auditPages, localized });

  if (errors.length > 0) {
    console.error(`Chinese WASM SDK content check failed: ${errors.length}`);
    for (const error of errors.slice(0, 50)) console.error(`  - ${error}`);
    if (errors.length > 50) console.error(`  ... ${errors.length - 50} additional errors omitted`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `Chinese WASM SDK content check passed (${routes.length} active routes, ${manualPages.size} manual pages, ${localized.pendingPaths.length} pending paths).`,
  );
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(resolve(root, relativePath), 'utf8'));
}

async function readManualPages() {
  const pages = new Map();
  for (const filePath of await listMdxFiles(manualRoot)) {
    const relativePath = relative(resolve(root, 'content/zh'), filePath).replaceAll('\\', '/');
    const routeRelativePath = relativePath.startsWith('docs/chat/')
      ? relativePath.slice('docs/chat/'.length)
      : relativePath;
    const path = `/${routeRelativePath.slice(0, -'.mdx'.length)}`;
    pages.set(path, parseMdx(await readFile(filePath, 'utf8')));
  }
  return pages;
}

async function listMdxFiles(directory) {
  const files = [];
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listMdxFiles(entryPath)));
    else if (entry.isFile() && entry.name.endsWith('.mdx')) files.push(entryPath);
  }
  return files.sort();
}

function sameArray(first, second) {
  return first.length === second.length && first.every((value, index) => value === second[index]);
}

const isDirectExecution =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) await main();
