import { spawnSync } from 'node:child_process';
import { appendFile, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

class PlatformApiError extends Error {
  readonly name = 'PlatformApiError';
}

function required<T>(value: T | null | undefined, message: string): T {
  if (value === null || value === undefined) throw new PlatformApiError(message);
  return value;
}

export async function listFiles(directory: string): Promise<string[]> {
  return (
    await Promise.all(
      (await readdir(directory, { withFileTypes: true })).map(async (entry) => {
        const path = resolve(directory, entry.name);
        if (entry.isDirectory()) return listFiles(path);
        return entry.isFile() ? [path] : [];
      }),
    )
  ).flat();
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

async function listOpenApiFiles(root: string): Promise<string[]> {
  const files = await Promise.all(
    (await listFiles(resolve(root, 'api'))).map(async (path): Promise<string[]> => {
      if (!/\.(?:json|ya?ml)$/i.test(path)) return [];
      const content = await readFile(path, 'utf8');
      if (/\.ya?ml$/i.test(path))
        return /^(?:openapi|swagger)\s*:/m.test(content) ? [relative(root, path)] : [];
      try {
        const document: unknown = JSON.parse(content);
        return isRecord(document) &&
          (typeof document.openapi === 'string' || typeof document.swagger === 'string')
          ? [relative(root, path)]
          : [];
      } catch {
        return [relative(root, path)];
      }
    }),
  );
  return files.flat();
}

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export async function lintApiOpenApiDocuments(root: string): Promise<void> {
  const paths = await listOpenApiFiles(root);
  if (paths.length === 0) throw new PlatformApiError('No OpenAPI documents found under api/.');
  const result = spawnSync(
    process.execPath,
    [
      resolve(root, 'node_modules/@redocly/cli/bin/cli.js'),
      'lint',
      '--config',
      resolve(root, 'redocly.yaml'),
      ...paths,
    ],
    { cwd: root, encoding: 'utf8', stdio: 'inherit' },
  );
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new PlatformApiError(`Redocly lint failed with exit code ${result.status ?? 'unknown'}.`);
}

const postmanSchema = 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json';
const publishConfigSchema = z.object({
  GITHUB_SHA: z.string().min(1).optional(),
  GITHUB_STEP_SUMMARY: z.string().min(1).optional(),
});
export const postmanPublishConfigSchema = publishConfigSchema.extend({
  POSTMAN_API_KEY: z.string().min(1),
  POSTMAN_COLLECTION_ID: z.string().min(1),
});
export const apifoxPublishConfigSchema = publishConfigSchema.extend({
  APIFOX_ACCESS_TOKEN: z.string().min(1),
  APIFOX_PROJECT_ID: z.string().regex(/^\d+$/),
});
const postmanCollectionSchema = z
  .object({
    info: z.object({ name: z.string().min(1), schema: z.literal(postmanSchema) }).passthrough(),
    item: z.array(z.unknown()),
  })
  .passthrough();
const apifoxImportResultSchema = z.object({
  data: z.object({
    counters: z.record(z.string(), z.number().int().nonnegative()),
    errors: z
      .array(
        z
          .object({ code: z.union([z.string(), z.number()]), message: z.string().min(1) })
          .passthrough(),
      )
      .optional(),
  }),
});
type PostmanCollection = z.infer<typeof postmanCollectionSchema>;

export function normalizePostmanCollection(
  value: unknown,
  property = '',
  stripPostmanIdentity = true,
): unknown {
  if (typeof value === 'string' && (property === 'body' || property === 'raw')) {
    try {
      return JSON.stringify(normalizePostmanCollection(JSON.parse(value), '', false));
    } catch (error) {
      if (error instanceof SyntaxError) return value;
      throw error;
    }
  }
  if (Array.isArray(value))
    return value.map((entry) => normalizePostmanCollection(entry, '', stripPostmanIdentity));
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(
        ([key]) =>
          !/^key_\d+$/.test(key) &&
          (!stripPostmanIdentity || (key !== '_postman_id' && key !== 'id' && key !== 'uid')),
      )
      .map(([key, entry]) => [key, normalizePostmanCollection(entry, key, stripPostmanIdentity)]),
  );
}

export function parseApifoxImportResult(value: unknown): void {
  const result = apifoxImportResultSchema.parse(value);
  const failedNames = Object.keys(result.data.counters).filter((name) => name.endsWith('Failed'));
  if (failedNames.length === 0)
    throw new PlatformApiError('Apifox import response is missing failure counters.');
  const failed = failedNames
    .map((name) => `${name}=${result.data.counters[name]}`)
    .filter((entry) => !entry.endsWith('=0'));
  if (failed.length > 0) throw new PlatformApiError(`Apifox import failed: ${failed.join(', ')}.`);
  const messages = (result.data.errors ?? []).map(({ message }) => message);
  if (messages.length > 0)
    throw new PlatformApiError(`Apifox reported import errors: ${messages.join('; ')}.`);
}

function runProcess(command: string, args: readonly string[]): void {
  const result = spawnSync(command, [...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new PlatformApiError(
      `${command} failed with exit code ${result.status ?? 'unknown'}: ${result.stderr ?? result.stdout ?? ''}`,
    );
}

// Seed Math.random so openapi-to-postmanv2 example generation is stable across runs.
const deterministicRandomSource = `let state = 0x6d2b79f5;
Math.random = () => {
  state |= 0;
  state = (state + 0x6d2b79f5) | 0;
  let value = Math.imul(state ^ (state >>> 15), 1 | state);
  value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
};
`;

export async function convertOpenApiToPostman(openApi: string): Promise<PostmanCollection> {
  const directory = await mkdtemp(join(tmpdir(), 'openim-platform-api-postman-'));
  const bundlePath = join(directory, 'openapi.json');
  const collectionPath = join(directory, 'postman-collection.json');
  const randomPath = join(directory, 'deterministic-random.cjs');
  try {
    await writeFile(bundlePath, openApi);
    await writeFile(randomPath, deterministicRandomSource);
    runProcess(process.execPath, [
      '--require',
      randomPath,
      resolve(repoRoot, 'node_modules/openapi-to-postmanv2/bin/openapi2postmanv2.js'),
      '--spec',
      bundlePath,
      '--output',
      collectionPath,
      '--options',
      'parametersResolution=Example',
    ]);
    const document: unknown = JSON.parse(await readFile(collectionPath, 'utf8'));
    return postmanCollectionSchema.parse(normalizePostmanCollection(document));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function requestJson(url: string, init: RequestInit): Promise<unknown> {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(30_000) });
  const body = await response.text();
  if (!response.ok)
    throw new PlatformApiError(
      `${init.method ?? 'GET'} ${url} returned ${response.status}: ${body}`,
    );
  try {
    const parsed: unknown = JSON.parse(body);
    return parsed;
  } catch (error) {
    if (error instanceof SyntaxError)
      throw new PlatformApiError(`${init.method ?? 'GET'} ${url} returned invalid JSON.`);
    throw error;
  }
}

async function publishPostman(
  apiKey: string,
  collectionId: string,
  openApi: string,
): Promise<void> {
  const collection = await convertOpenApiToPostman(openApi);
  const url = `https://api.getpostman.com/collections/${collectionId}`;
  await requestJson(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
    body: JSON.stringify({ collection }),
  });
}

async function publishApifox(
  accessToken: string,
  projectId: string,
  openApi: string,
): Promise<void> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'X-Apifox-Api-Version': '2024-03-28',
  };
  const project = `https://api.apifox.com/v1/projects/${projectId}`;
  parseApifoxImportResult(
    await requestJson(`${project}/import-openapi?locale=en-US`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        input: openApi,
        options: {
          deleteUnmatchedResources: true,
          endpointOverwriteBehavior: 'OVERWRITE_EXISTING',
          prependBasePath: false,
          schemaOverwriteBehavior: 'OVERWRITE_EXISTING',
          updateFolderOfChangedEndpoint: true,
        },
      }),
    }),
  );
}

async function publishPlatformApiPostman(openApiPath: string): Promise<void> {
  const config = postmanPublishConfigSchema.parse(process.env);
  const openApi = await readFile(openApiPath, 'utf8');
  await publishPostman(config.POSTMAN_API_KEY, config.POSTMAN_COLLECTION_ID, openApi);
  const summary = [
    '### Postman OpenAPI publication completed',
    '',
    `- Source revision: \`${config.GITHUB_SHA ?? 'local'}\``,
    '- Postman collection updated in place',
    '',
  ].join('\n');
  if (config.GITHUB_STEP_SUMMARY) await appendFile(config.GITHUB_STEP_SUMMARY, summary);
  console.log('Published OpenIM Platform API v3 to Postman.');
}

async function publishPlatformApiApifox(openApiPath: string): Promise<void> {
  const config = apifoxPublishConfigSchema.parse(process.env);
  const openApi = await readFile(openApiPath, 'utf8');
  await publishApifox(config.APIFOX_ACCESS_TOKEN, config.APIFOX_PROJECT_ID, openApi);
  const summary = [
    '### Apifox OpenAPI publication completed',
    '',
    `- Source revision: \`${config.GITHUB_SHA ?? 'local'}\``,
    '- Apifox project imported and its documentation site refreshed',
    '',
  ].join('\n');
  if (config.GITHUB_STEP_SUMMARY) await appendFile(config.GITHUB_STEP_SUMMARY, summary);
  console.log('Published OpenIM Platform API v3 to Apifox.');
}

export function commandArguments(args: readonly string[]): readonly [string, string?] {
  const [command = '--help', ...rawArguments] = args;
  const values = rawArguments[0] === '--' ? rawArguments.slice(1) : rawArguments;
  return [command, values[0]];
}

async function runCommand(command: string, inputPath?: string): Promise<void> {
  switch (command) {
    case 'publish-postman':
      return publishPlatformApiPostman(
        required(inputPath, 'publish-postman requires an OpenAPI path.'),
      );
    case 'publish-apifox':
      return publishPlatformApiApifox(
        required(inputPath, 'publish-apifox requires an OpenAPI path.'),
      );
    case '--help':
    case 'help':
      console.log(
        'Usage: pnpm run platform-api:<publish-postman|publish-apifox> -- <openapi-path>',
      );
      return;
    default:
      throw new PlatformApiError(
        `Unknown Platform API command: ${command}. Use publish-postman, publish-apifox, or --help.`,
      );
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  await runCommand(...commandArguments(process.argv.slice(2)));
