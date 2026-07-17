const contextKey = 'chat/sdk/wasm';

export function getWasmSidebarPaths(config) {
  return flattenEntries(config.nodes);
}

export function buildWasmSidebar(config, routes) {
  const wasmRoutes = routes.filter((route) => route.contextKey === contextKey);
  const routeByPath = new Map(wasmRoutes.map((route) => [route.path, route]));
  const paths = getWasmSidebarPaths(config);
  const uniquePaths = new Set(paths);

  if (uniquePaths.size !== paths.length) {
    throw new Error('WASM sidebar contains duplicate route paths.');
  }

  for (const path of paths) {
    if (!routeByPath.has(path))
      throw new Error(`WASM sidebar references an unknown route: ${path}`);
  }

  const missingPaths = wasmRoutes
    .map((route) => route.path)
    .filter((path) => !uniquePaths.has(path));
  if (missingPaths.length > 0) {
    throw new Error(`WASM sidebar omits active routes: ${missingPaths.join(', ')}`);
  }

  return {
    nodes: config.nodes.map((entry) => buildNode(entry, routeByPath)),
    pageCount: paths.length,
    sidebarExpansion: config.sidebarExpansion,
  };
}

function flattenEntries(entries) {
  return entries.flatMap((entry) =>
    typeof entry === 'string'
      ? [entry]
      : entry.path
        ? [entry.path]
        : flattenEntries(entry.children),
  );
}

function buildNode(entry, routeByPath) {
  if (typeof entry === 'string' || entry.path) {
    const path = typeof entry === 'string' ? entry : entry.path;
    const route = routeByPath.get(path);
    return {
      id: route.relativePath.replace(/^chat\/sdk\/v4\/wasm\//, ''),
      segment: route.path.split('/').at(-1),
      title: route.title,
      href: route.path,
      type: 'page',
      children: [],
      minIndex: route.navOrder,
      ...(typeof entry === 'string' ? {} : { navigationTitle: entry.navigationTitle }),
    };
  }

  if (entry.children.length < 2) {
    throw new Error(`WASM sidebar folder must contain at least two entries: ${entry.id}`);
  }

  const children = entry.children.map((child) => buildNode(child, routeByPath));
  return {
    id: entry.id,
    segment: entry.id.split('/').at(-1),
    title: entry.title,
    href: null,
    type: 'folder',
    children,
    minIndex: Math.min(...children.map((child) => child.minIndex)),
  };
}
