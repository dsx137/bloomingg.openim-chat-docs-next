export function localizedContentFile(contentFile) {
  const sourcePrefix = 'content/docs/';
  if (!contentFile.startsWith(sourcePrefix)) {
    throw new Error(`Unsupported Chat content file: ${contentFile}`);
  }
  return `content/zh/docs/${contentFile.slice(sourcePrefix.length)}`;
}

export function isChatDocumentationPath(path) {
  return (
    path === '/sdk' ||
    path.startsWith('/sdk/') ||
    path === '/platform-api' ||
    path.startsWith('/platform-api/')
  );
}
