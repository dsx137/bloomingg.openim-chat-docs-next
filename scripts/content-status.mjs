import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const statusFilter = readArg('--status');
const limit = Number.parseInt(readArg('--limit') ?? '20', 10);
const json = process.argv.includes('--json');
const routes = JSON.parse(await readFile(resolve(root, 'src/generated/routes.json'), 'utf8'));
const pages = [];

for (const route of routes) {
  const source = await readFile(resolve(root, route.contentFile), 'utf8');
  const frontmatter = parseFrontmatter(source);
  pages.push({
    path: route.path,
    contentFile: route.contentFile,
    title: frontmatter.title ?? route.title,
    status: frontmatter.status ?? route.status ?? 'scaffold',
    product: frontmatter.product ?? route.product,
    context: frontmatter.context ?? route.contextKey,
    template: frontmatter.template ?? route.template,
  });
}

const report = {
  total: pages.length,
  byStatus: countBy(pages, 'status'),
  byProduct: countBy(pages, 'product'),
  byTemplate: countBy(pages, 'template'),
};

if (json) {
  console.log(JSON.stringify({ ...report, pages: filterPages() }, null, 2));
  process.exit(0);
}

console.log(`Pages: ${report.total.toLocaleString()}`);
printGroup('By status', report.byStatus);
printGroup('By product', report.byProduct);
printGroup('By template', report.byTemplate);

const selected = filterPages();
if (statusFilter) {
  console.log(`\nFirst ${Math.min(selected.length, limit)} page(s) with status “${statusFilter}”:`);
  for (const page of selected.slice(0, limit)) {
    console.log(`  - ${page.path}  [${page.contentFile}]`);
  }
  if (selected.length > limit) console.log(`  … ${selected.length - limit} more`);
}

function filterPages() {
  return statusFilter ? pages.filter((page) => page.status === statusFilter) : [];
}

function countBy(items, field) {
  return Object.fromEntries(
    [
      ...items
        .reduce((map, item) => {
          const key = item[field] ?? 'unknown';
          map.set(key, (map.get(key) ?? 0) + 1);
          return map;
        }, new Map())
        .entries(),
    ].sort(([a], [b]) => a.localeCompare(b)),
  );
}

function printGroup(label, values) {
  console.log(`\n${label}:`);
  const width = Math.max(...Object.keys(values).map((key) => key.length));
  for (const [key, value] of Object.entries(values)) {
    const percentage = ((value / pages.length) * 100).toFixed(1);
    console.log(`  ${key.padEnd(width)}  ${String(value).padStart(5)}  ${percentage.padStart(5)}%`);
  }
}

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function parseFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const result = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    const raw = line.slice(separator + 1).trim();
    if (!raw) continue;
    try {
      result[key] = JSON.parse(raw);
    } catch {
      result[key] = raw.replace(/^['"]|['"]$/g, '');
    }
  }
  return result;
}
