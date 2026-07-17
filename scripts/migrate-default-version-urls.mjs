/**
 * One-shot migration: omit default version segments from public Chat URLs.
 *
 * SDK:          /sdk/v4/{platform}/...  → /sdk/{platform}/...
 * Platform API: /platform-api/v3/...    → /platform-api/...
 *
 * Version remains metadata (frontmatter / routes.version). Historical versioned
 * URLs are intentionally not redirected.
 */
import { rename, readdir, readFile, writeFile, rm, mkdir, stat } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

const root = process.cwd();

const excludedRelative = new Set([
  'scripts/migrate-default-version-urls.mjs',
  'scripts/migrate-chat-route-prefix.mjs',
]);

const excludedPrefixes = [
  'docs/superpowers/',
  'node_modules/',
  '.next/',
  '.git/',
  '.playwright-cli/',
];

const rewriteRoots = [
  'app',
  'content/docs',
  'content/zh',
  'data/structure',
  'docs',
  'scripts',
  'src',
];

const extensions = new Set(['.json', '.md', '.mdx', '.mjs', '.ts', '.tsx']);

const directoryMoves = [
  {
    from: 'content/docs/chat/sdk/v4',
    to: 'content/docs/chat/sdk',
  },
  {
    from: 'content/zh/docs/chat/sdk/v4',
    to: 'content/zh/docs/chat/sdk',
  },
  {
    from: 'content/docs/chat/platform-api/v3',
    to: 'content/docs/chat/platform-api',
  },
  {
    from: 'content/zh/docs/chat/platform-api/v3',
    to: 'content/zh/docs/chat/platform-api',
  },
];

let changedFiles = 0;
let replacements = 0;

for (const move of directoryMoves) {
  await moveVersionDirectory(resolve(root, move.from), resolve(root, move.to));
}

for (const directory of rewriteRoots) {
  const absolute = resolve(root, directory);
  if (!(await exists(absolute))) continue;
  for (const file of await walk(absolute)) {
    const relativePath = relative(root, file).replaceAll('\\', '/');
    if (shouldSkip(relativePath) || !extensions.has(extname(file))) continue;

    const source = await readFile(file, 'utf8');
    const migrated = rewriteText(source, relativePath);
    if (migrated.text === source) continue;

    await writeFile(file, migrated.text, 'utf8');
    changedFiles += 1;
    replacements += migrated.count;
  }
}

console.log(
  `Migrated default-version URLs: ${replacements.toLocaleString()} replacements in ${changedFiles.toLocaleString()} files.`,
);

function shouldSkip(relativePath) {
  if (excludedRelative.has(relativePath)) return true;
  return excludedPrefixes.some((prefix) => relativePath.startsWith(prefix));
}

function rewriteText(source, relativePath) {
  let count = 0;
  let text = source;

  // Protect absolute Sendbird / external docs URLs that legitimately contain /v3 or /v4.
  const protectedChunks = [];
  text = text.replace(/https?:\/\/[^\s"'`)\]]+/g, (match) => {
    const token = `__PROTECTED_URL_${protectedChunks.length}__`;
    protectedChunks.push(match);
    return token;
  });
  // Protect Sendbird path templates embedded in code (still versioned on their site).
  text = text.replace(/\/docs\/chat\/sdk\/v4\/javascript\//g, (match) => {
    const token = `__PROTECTED_URL_${protectedChunks.length}__`;
    protectedChunks.push(match);
    return token;
  });
  text = text.replace(/\/sdk\/v4\/javascript\//g, (match) => {
    const token = `__PROTECTED_URL_${protectedChunks.length}__`;
    protectedChunks.push(match);
    return token;
  });
  text = text.replace(/\/docs\/chat\/platform-api\/v3\//g, (match) => {
    // Only protect when used as Sendbird mirror path after sendbird host was already protected.
    // Keep as-is for sendbird-style template strings that are not our localRoot.
    if (relativePath.includes('sync-wasm') || relativePath.includes('sendbird')) {
      const token = `__PROTECTED_URL_${protectedChunks.length}__`;
      protectedChunks.push(match);
      return token;
    }
    return match;
  });

  const replacementsSpec = [
    [/content\/zh\/docs\/chat\/sdk\/v4(?=\/|"|'|`|\s|,|}|$)/g, 'content/zh/docs/chat/sdk'],
    [/content\/docs\/chat\/sdk\/v4(?=\/|"|'|`|\s|,|}|$)/g, 'content/docs/chat/sdk'],
    [
      /content\/zh\/docs\/chat\/platform-api\/v3(?=\/|"|'|`|\s|,|}|$)/g,
      'content/zh/docs/chat/platform-api',
    ],
    [/content\/docs\/chat\/platform-api\/v3(?=\/|"|'|`|\s|,|}|$)/g, 'content/docs/chat/platform-api'],
    [/chat\/sdk\/v4(?=\/|"|'|`|\s|,|}|$)/g, 'chat/sdk'],
    [/chat\/platform-api\/v3(?=\/|"|'|`|\s|,|}|$)/g, 'chat/platform-api'],
    [/\/sdk\/v4(?=\/|"|'|`|\s|,|}|$)/g, '/sdk'],
    [/\/platform-api\/v3(?=\/|"|'|`|\s|,|}|$)/g, '/platform-api'],
    // Unprefixed relative / nav ids (e.g. relativePath, navigation node id).
    [/(^|["'`=\s,{[])sdk\/v4\//g, '$1sdk/'],
    [/(^|["'`=\s,{[])platform-api\/v3\//g, '$1platform-api/'],
  ];

  for (const [pattern, replacement] of replacementsSpec) {
    text = text.replace(pattern, () => {
      count += 1;
      return replacement;
    });
  }

  // Restore protected URLs unchanged.
  protectedChunks.forEach((url, index) => {
    text = text.replaceAll(`__PROTECTED_URL_${index}__`, url);
  });

  void relativePath;
  return { text, count };
}

async function moveVersionDirectory(fromDir, toDir) {
  if (!(await exists(fromDir))) {
    console.log(`Skip missing directory: ${relative(root, fromDir)}`);
    return;
  }

  await mkdir(toDir, { recursive: true });
  for (const entry of await readdir(fromDir, { withFileTypes: true })) {
    const fromPath = join(fromDir, entry.name);
    const toPath = join(toDir, entry.name);
    if (await exists(toPath)) {
      throw new Error(
        `Refusing to overwrite existing path while moving ${relative(root, fromPath)} → ${relative(root, toPath)}`,
      );
    }
    await rename(fromPath, toPath);
  }

  await rm(fromDir, { recursive: true, force: true });
  console.log(`Moved ${relative(root, fromDir)}/* → ${relative(root, toDir)}/`);
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      files.push(...(await walk(path)));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }
  return files;
}
