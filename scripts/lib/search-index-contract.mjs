const wasmContext = 'chat/sdk/wasm';

export function validateSearchIndexPaths({ routes, auditPages, indexes }) {
  const errors = [];

  for (const locale of ['en', 'zh']) {
    const expected = new Set(
      routes
        .filter((route) => {
          if (route.contextKey !== wasmContext) return true;
          return auditPages.get(route.path)?.locales?.[locale]?.reviewStatus === 'published';
        })
        .map((route) => route.path),
    );
    const counts = new Map();
    for (const record of indexes[locale] ?? []) {
      counts.set(record.path, (counts.get(record.path) ?? 0) + 1);
    }

    for (const path of expected) {
      if (!counts.has(path)) errors.push(`${locale} search index is missing ${path}`);
    }
    for (const [path, count] of counts) {
      if (!expected.has(path)) errors.push(`${locale} search index has unexpected ${path}`);
      if (count > 1) errors.push(`${locale} search index has duplicate ${path}`);
    }
  }

  return errors.sort();
}
