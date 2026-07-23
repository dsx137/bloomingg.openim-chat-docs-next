import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, test } from 'node:test';
import Ajv, { type ValidateFunction } from 'ajv';

type HttpMethod = 'get' | 'post';
type Route = { readonly method: HttpMethod; readonly path: string };
type OpenApiOperation = Route & { readonly source: string; readonly reference: string };

class PlatformApiError extends Error {
  readonly name = 'PlatformApiError';
}

function required<T>(value: T | null | undefined, message: string): T {
  if (value === null || value === undefined) throw new PlatformApiError(message);
  return value;
}

const routeKey = ({ method, path }: Route): string => `${method.toUpperCase()} ${path}`;

function parseRoutes(source: string): Route[] {
  const prefixes = new Map<string, string>([['r', '']]);
  const routes: Route[] = [];
  for (const [index, line] of source.split('\n').entries()) {
    const sourceLine = index + 1;
    const group = line.match(/^\s*(\w+)\s*:=\s*(\w+)\.Group\("([^"]+)"(?:,[^)]*)?\)\s*$/);
    if (group) {
      const [, name, parent, segment] = group;
      const prefix = prefixes.get(parent);
      if (prefix === undefined)
        throw new PlatformApiError(`Unknown router group ${parent} on line ${sourceLine}.`);
      prefixes.set(name, `${prefix}${segment}`);
      continue;
    }
    const registration = line.match(/^\s*(\w+)\.([A-Z]+)\("([^"]+)",\s*([^)]+)\)\s*(?:\/\/.*)?$/);
    if (!registration) continue;
    const [, groupName, method, segment] = registration;
    if (method !== 'GET' && method !== 'POST')
      throw new PlatformApiError(`Unsupported HTTP method ${method} on line ${sourceLine}.`);
    const prefix = prefixes.get(groupName);
    if (prefix === undefined)
      throw new PlatformApiError(`Unknown router group ${groupName} on line ${sourceLine}.`);
    routes.push({
      method: method === 'GET' ? 'get' : 'post',
      path: `${prefix}${segment}`.replace(/\/\*([A-Za-z][A-Za-z0-9_]*)$/, '/{$1}'),
    });
  }
  const keys = routes.map(routeKey);
  if (new Set(keys).size !== keys.length)
    throw new PlatformApiError('Upstream router contains duplicate method/path pairs.');
  return routes.sort((left, right) => routeKey(left).localeCompare(routeKey(right), 'en'));
}

function pathReferences(source: string): Map<string, string> {
  const section = required(
    source.match(/^paths:\n([\s\S]*?)^components:/m)?.[1],
    'OpenAPI root must contain paths before components.',
  );
  return new Map(
    [...section.matchAll(/^  (\/[^:]+):\n    \$ref: (.+)$/gm)].map(([, path, ref]) => [path, ref]),
  );
}

async function documentedRoutes(root: string): Promise<OpenApiOperation[]> {
  return Promise.all(
    [...pathReferences(await readFile(root, 'utf8'))].map(async ([path, reference]) => {
      const source = await readFile(resolve(dirname(root), reference), 'utf8');
      const method = source.match(/^(get|post):/m)?.[1];
      if (method !== 'get' && method !== 'post')
        throw new PlatformApiError(`Invalid operation method for ${path}.`);
      return { method, path, reference, source };
    }),
  );
}

async function listFiles(directory: string): Promise<string[]> {
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

type JsonObject = Record<string, unknown>;
type JsonContent = {
  readonly schema: JsonObject;
  readonly examples?: Record<string, { readonly value: JsonObject }>;
};
type TestOperation = {
  readonly requestBody?: { readonly content: { readonly 'application/json': JsonContent } };
  readonly responses: Record<string, unknown>;
};
type OpenApiDocument = {
  readonly paths: Record<string, Partial<Record<Route['method'], TestOperation>>>;
  readonly servers: readonly {
    readonly variables: { readonly host: { readonly default: string } };
  }[];
};

const upstream = {
  tagObject: '8c6bf8af683b0f739c4b7c1b3b4447cb436dcbcd',
  commit: 'f6411a8a1a31d3df36f4c2b3ad28481a94141e1f',
  path: 'internal/api/router.go',
  blob: 'bad891fda8cb18056645ecc8aa5da34f283fa659',
} as const;
export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const platformApiRoot = resolve(repoRoot, 'api/chat/platform-api/v3');
export const rootPath = resolve(platformApiRoot, 'openapi.yaml');
const gitDirectory = resolve(
  repoRoot,
  process.env.PLATFORM_API_UPSTREAM_GIT_DIR ??
    '.docsets-sync/upstreams/api__chat__platform-api__v3/.git',
);

function git(...args: readonly string[]): string {
  const result = spawnSync('git', [`--git-dir=${gitDirectory}`, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new PlatformApiError(`${result.stderr}${result.stdout}`.trim());
  return result.stdout.trim();
}

const readUpstreamRoutes = (): Route[] => parseRoutes(git('show', `FETCH_HEAD:${upstream.path}`));

export async function verifyUpstreamRoutes(): Promise<void> {
  assert.equal(git('rev-parse', 'FETCH_HEAD'), upstream.tagObject);
  assert.equal(git('rev-parse', 'FETCH_HEAD^{commit}'), upstream.commit);
  assert.equal(git('rev-parse', `FETCH_HEAD:${upstream.path}`), upstream.blob);
  const routes = readUpstreamRoutes();
  const documented = await documentedRoutes(rootPath);
  assert.equal(routes.length, 140);
  assert.deepEqual(documented.map(routeKey).sort(), routes.map(routeKey).sort());
  console.log(`Verified ${routes.length} Platform API routes against ${upstream.commit}.`);
}

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

let temporaryDirectory = '';
let openApiDocument: OpenApiDocument = {
  paths: {},
  servers: [{ variables: { host: { default: '' } } }],
};
let ajv = new Ajv({ allErrors: true, strict: false, validateFormats: false });
let validateSendMessage: ValidateFunction = ajv.compile({});

export function registerTests(): void {
  before(async () => {
    temporaryDirectory = await mkdtemp(join(tmpdir(), 'openim-platform-api-'));
    const bundlePath = join(temporaryDirectory, 'openapi.json');
    const result = runNode(resolve(repoRoot, 'node_modules/@redocly/cli/bin/cli.js'), [
      'bundle',
      rootPath,
      '--dereferenced',
      '--output',
      bundlePath,
    ]);
    assert.equal(result.status, 0, `${result.stdout ?? ''}${result.stderr ?? ''}`);
    openApiDocument = JSON.parse(await readFile(bundlePath, 'utf8'));
    ajv = new Ajv({ allErrors: true, strict: false, validateFormats: false });
    validateSendMessage = compileRequestSchema('/msg/send_msg');
  });
  after(() => rm(temporaryDirectory, { recursive: true, force: true }));
  test('accepts valid direct, group, and custom messages', () => {
    assertSendMessages(true, [
      { recvID: 'recipient', content: { content: 'hello' }, contentType: 101, sessionType: 1 },
      { groupID: 'group', content: { content: 'hello' }, contentType: 101, sessionType: 3 },
      { recvID: 'recipient', content: { data: '{}' }, contentType: 110, sessionType: 1 },
    ]);
  });
  test('rejects invalid message destinations, session, content, and empty strings', () => {
    const text = { content: { content: 'x' }, contentType: 101 };
    assertSendMessages(false, [
      { ...text, sessionType: 1 },
      { ...text, sessionType: 3 },
      { ...text, groupID: 'g', sessionType: 2 },
      { recvID: 'r', content: { content: 'x' }, contentType: 110, sessionType: 1 },
      { ...text, recvID: 'r', content: { content: '' }, sessionType: 1 },
    ]);
  });
  test('keeps message content variants outside allOf for Swagger Client', () => {
    const schema = requestContent('/msg/send_msg').schema;
    assert.ok(Array.isArray(schema.allOf));
    assert.equal(schema.allOf.length, 1);
    assert.ok(Array.isArray(schema.oneOf));
    assert.equal(schema.oneOf.length, 8);
  });
  test('enforces auth and group request contracts', () => {
    const auth = compileRequestSchema('/auth/get_user_token');
    assert.equal(auth({ userID: 'u', platformID: 9 }), true);
    assert.equal(auth({ userID: 'u', platformID: 10 }), false);
    assert.equal(auth({ userID: 'u', platformID: 11 }), true);
    const group = compileRequestSchema('/group/create_group');
    assert.equal(group({ ownerUserID: 'o', groupInfo: { groupType: 2 } }), true);
    assert.equal(group({ ownerUserID: 'o', groupInfo: { groupType: 1 } }), false);
    const joinGroup = compileRequestSchema('/group/join_group');
    assert.equal(joinGroup({ groupID: 'g', joinSource: 2 }), false);
    assert.equal(joinGroup({ groupID: 'g', inviterUserID: 'i', joinSource: 2 }), true);
  });
  test('enforces group decisions, safe server, and HTTP error claims', () => {
    const validate = compileRequestSchema('/group/group_application_response');
    assert.equal(validate({ groupID: 'g', fromUserID: 'u', handleResult: -1 }), true);
    assert.equal(validate({ groupID: 'g', fromUserID: 'u', handleResult: 0 }), false);
    const examples = requestExamples('/group/group_application_response');
    assert.equal(examples.example1.value.handleResult, -1);
    assert.equal(examples.example2.value.handleResult, 1);
    assert.equal(openApiDocument.servers[0].variables.host.default, 'api.example.invalid');
    for (const [path, item] of Object.entries(openApiDocument.paths))
      for (const method of ['get', 'post'] as const)
        if (item[method])
          assert.equal(
            Boolean(item[method]?.responses['400']),
            path === '/msg/send_msg' || path === '/object/{name}',
          );
  });
  test('lint discovers an invalid API root without docset metadata', async () => {
    const invalid = resolve(platformApiRoot, '__lint-regression__.yaml');
    await writeFile(invalid, 'openapi: 3.0.3\ninfo:\n  title: invalid\n');
    try {
      const result = runNode(resolve(repoRoot, 'node_modules/tsx/dist/cli.mjs'), [
        'scripts/docsets-sync-utils.ts',
        'lint-openapi',
      ]);
      assert.notEqual(result.status, 0, `${result.stdout ?? ''}${result.stderr ?? ''}`);
    } finally {
      await rm(invalid, { force: true });
    }
  });
  test('keeps every Platform API YAML file free of CJK text', async () => {
    const cjk = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u{20000}-\u{2fa1f}]/u;
    const violations: string[] = [];
    for (const path of await listFiles(platformApiRoot))
      if (/\.ya?ml$/i.test(path) && cjk.test(await readFile(path, 'utf8')))
        violations.push(relative(repoRoot, path));
    assert.deepEqual(violations, []);
  });
  test('matches every upstream route and enforces auth and GET behavior', async () => {
    const source = readUpstreamRoutes();
    const documented = await documentedRoutes(rootPath);
    assert.equal(source.length, 140);
    assert.deepEqual(documented.map(routeKey).sort(), source.map(routeKey).sort());
    const operationIds = documented.map((route) =>
      required(route.source.match(/^  operationId: (\S+)$/m)?.[1], `Missing ID for ${route.path}.`),
    );
    assert.equal(documented.filter(({ method }) => method === 'get').length, 13);
    assert.equal(documented.filter(({ method }) => method === 'post').length, 127);
    assert.equal(new Set(operationIds).size, 140);
    for (const route of documented) {
      const publicRoute =
        route.method === 'get' ||
        route.path === '/auth/get_admin_token' ||
        route.path === '/auth/parse_token';
      assert.match(route.source, publicRoute ? /^  security: \[\]$/m : /^    - TokenAuth: \[\]$/m);
      if (route.method === 'get') assert.doesNotMatch(route.source, /^  requestBody:$/m);
    }
  });
  test('retains representative field schemas and rejects unsupported methods', async () => {
    const routes = await documentedRoutes(rootPath);
    const batch = requireRoute(routes, '/msg/batch_send_msg');
    assert.match(batch.source, /'recvIDs':/);
    assert.match(batch.source, /'failedUserIDs':/);
    assert.match(batch.source, /x-source-schema-status: field-level/);
    const pull = requireRoute(routes, '/msg/pull_msg_by_seq');
    assert.match(pull.source, /enum:\n\s+- 0\n\s+- 1/);
    const commented = parseRoutes('r.POST("/commented", handler) //\n').map(routeKey);
    assert.deepEqual(commented, ['POST /commented']);
    assert.throws(
      () => parseRoutes('router.DELETE("/private", handler)\n'),
      /Unsupported HTTP method DELETE/,
    );
  });
}

const requireRoute = (routes: readonly OpenApiOperation[], path: string): OpenApiOperation =>
  required(
    routes.find((candidate) => candidate.path === path),
    `Missing documented route ${path}.`,
  );
const requestExamples = (path: string): Record<string, { readonly value: JsonObject }> =>
  required(requestContent(path).examples, `Missing examples for ${path}.`);
const compileRequestSchema = (path: string): ValidateFunction =>
  ajv.compile(requestContent(path).schema);
function requestContent(path: string): JsonContent {
  return required(
    openApiDocument.paths[path]?.post?.requestBody?.content['application/json'],
    `Missing request schema for ${path}.`,
  );
}
function assertSendMessages(valid: boolean, values: readonly JsonObject[]): void {
  for (const value of values)
    assert.equal(
      validateSendMessage({ sendID: 'sender', ...value }),
      valid,
      valid ? JSON.stringify(validateSendMessage.errors) : undefined,
    );
}
function runNode(modulePath: string, args: readonly string[]): ReturnType<typeof spawnSync> {
  return spawnSync(process.execPath, [modulePath, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, NODE_TEST_CONTEXT: undefined },
  });
}

async function runCommand(command: string): Promise<void> {
  if (command === 'verify') return verifyUpstreamRoutes();
  throw new PlatformApiError(`Unknown Platform API command: ${command}. Use verify.`);
}

if (process.env.NODE_TEST_CONTEXT !== undefined) registerTests();
else if (process.argv[1] === fileURLToPath(import.meta.url))
  await runCommand(process.argv[2] ?? 'verify');
