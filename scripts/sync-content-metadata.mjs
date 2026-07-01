import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const routesPath = resolve(root, 'src/generated/routes.json');
const navigationPath = resolve(root, 'src/generated/navigation.json');
const routes = JSON.parse(await readFile(routesPath, 'utf8'));
const navigation = JSON.parse(await readFile(navigationPath, 'utf8'));
let changed = 0;

for (const route of routes) {
  const source = await readFile(resolve(root, route.contentFile), 'utf8');
  const data = parseFrontmatter(source);
  const next = {
    title: data.title ?? route.title,
    description: data.description ?? route.description,
    product: data.product ?? route.product,
    template: data.template ?? route.template,
    status: data.status ?? route.status,
    version: data.version ?? route.version,
    platform: data.platform ?? route.platform,
  };
  for (const [key, value] of Object.entries(next)) {
    if (route[key] !== value) {
      route[key] = value;
      changed += 1;
    }
  }
}

const routeMap = new Map(routes.map((route) => [route.path, route]));
for (const context of navigation.contexts) {
  refreshNodes(context.nodes, routeMap);
  const overview = routeMap.get(context.overviewPath);
  if (overview && context.title !== overview.contextTitle && overview.contextTitle) {
    context.title = overview.contextTitle;
  }
}

await Promise.all([
  writeFile(routesPath, `${JSON.stringify(routes, null, 2)}\n`, 'utf8'),
  writeFile(navigationPath, `${JSON.stringify(navigation, null, 2)}\n`, 'utf8'),
]);
console.log(`Synchronized content metadata (${changed.toLocaleString()} changed fields).`);

function refreshNodes(nodes, routeMap) {
  for (const node of nodes) {
    if (node.href) {
      const route = routeMap.get(node.href);
      if (route) node.title = route.title;
    }
    refreshNodes(node.children ?? [], routeMap);
  }
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
