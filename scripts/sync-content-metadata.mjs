import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { buildWasmSidebar, getWasmSidebarPaths } from './lib/wasm-sidebar.mjs';

const root = process.cwd();
const routesPath = resolve(root, 'src/generated/routes.json');
const navigationPath = resolve(root, 'src/generated/navigation.json');
const wasmSidebarPath = resolve(root, 'data/structure/wasm-sidebar.json');
const routes = JSON.parse(await readFile(routesPath, 'utf8'));
const navigation = JSON.parse(await readFile(navigationPath, 'utf8'));
const wasmSidebar = JSON.parse(await readFile(wasmSidebarPath, 'utf8'));
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

changed += applyWasmSidebarOrder(routes, wasmSidebar);

const routeMap = new Map(routes.map((route) => [route.path, route]));
for (const context of navigation.contexts) {
  if (context.key === 'chat/sdk/wasm') {
    const next = buildWasmSidebar(wasmSidebar, routes);
    changed += replaceField(context, 'nodes', next.nodes);
    changed += setField(context, 'pageCount', next.pageCount);
    changed += setField(context, 'sidebarExpansion', next.sidebarExpansion);
  } else {
    changed += refreshNodes(context.nodes, routeMap);
  }
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
  let changed = 0;
  for (const node of nodes) {
    if (!Array.isArray(node.children)) {
      node.children = [];
      changed += 1;
    }

    changed += refreshNodes(node.children, routeMap);

    if (node.href) {
      const route = routeMap.get(node.href);
      if (route) {
        changed += setField(node, 'title', route.title);
        changed += setField(node, 'type', 'page');
        changed += setField(node, 'minIndex', route.navOrder);
      }
    } else {
      changed += setField(node, 'type', 'folder');
      const childIndexes = node.children
        .map((child) => child.minIndex)
        .filter((value) => Number.isFinite(value));
      if (childIndexes.length > 0) {
        changed += setField(node, 'minIndex', Math.min(...childIndexes));
      }
    }
  }
  return changed;
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

function setField(target, key, value) {
  if (target[key] === value) return 0;
  target[key] = value;
  return 1;
}

function applyWasmSidebarOrder(routes, config) {
  const order = getWasmSidebarPaths(config);
  const wasmRoutes = routes.filter((route) => route.contextKey === 'chat/sdk/wasm');
  const baseOrder = Math.min(...wasmRoutes.map((route) => route.navOrder).filter(Number.isFinite));
  let changed = 0;

  order.forEach((path, index) => {
    const route = routes.find((item) => item.path === path);
    if (!route) throw new Error(`Cannot order missing WASM route: ${path}`);
    changed += setField(route, 'navOrder', baseOrder + index);
  });

  return changed;
}

function replaceField(target, key, value) {
  if (JSON.stringify(target[key]) === JSON.stringify(value)) return 0;
  target[key] = value;
  return 1;
}
