import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const routes = JSON.parse(await readFile(resolve(root, 'src/generated/routes.json'), 'utf8'));
const records = [];

for (const route of routes) {
  const mdx = await readFile(resolve(root, route.contentFile), 'utf8');
  const body = mdx.replace(/^---\r?\n[\s\S]*?\r?\n---/, '');
  records.push({
    path: route.path,
    title: route.title,
    description: route.description,
    context: route.contextTitle,
    keywords: [route.product, route.platform, route.version, ...route.relativePath.split('/')]
      .filter(Boolean)
      .join(' '),
    content: normalizeBody(body).slice(0, 12_000),
  });
}

await writeFile(
  resolve(root, 'src/generated/search-index.json'),
  `${JSON.stringify(records, null, 2)}\n`,
  'utf8',
);
console.log(`Wrote ${records.length.toLocaleString()} search records from MDX content.`);

function normalizeBody(value) {
  return value
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```\w*/g, ' '))
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#{}`*_>[\]()!-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
