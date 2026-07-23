import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  assemblePostmanCollections,
  exportOpenApi,
  parseCommandArguments,
  PlatformApiError,
  projectOpenApiDocument,
  type PlatformApiCommand,
} from './openapi.js';

function parse(args: readonly string[]): PlatformApiCommand {
  return parseCommandArguments(args);
}

function project(
  document: unknown,
  options: { readonly stripTags: readonly string[]; readonly tag?: string },
) {
  return projectOpenApiDocument(document, options);
}

function openApiDocument(): Record<string, unknown> {
  return {
    info: { title: 'Projection test', version: '1.0.0' },
    openapi: '3.0.3',
    paths: {
      '/messages': {
        get: { responses: { '200': { description: 'ok' } }, tags: ['Public', 'Messages'] },
        post: { responses: { '200': { description: 'ok' } }, tags: ['Private', 'Messages'] },
        summary: 'Preserve this path metadata.',
      },
      '/users': {
        get: { responses: { '200': { description: 'ok' } }, tags: ['Public', 'Users'] },
      },
      '/private': {
        post: { responses: { '200': { description: 'ok' } }, tags: ['Private', 'Users'] },
      },
    },
    tags: [
      { description: 'Public operations.', name: 'Public' },
      { description: 'Private operations.', name: 'Private' },
      { description: 'Message operations.', name: 'Messages' },
      { description: 'User operations.', name: 'Users' },
    ],
    'x-document-metadata': { retained: true },
  };
}

function collection(
  item: readonly unknown[],
  variableValue = 'https://api.example.invalid',
): Record<string, unknown> {
  return {
    info: {
      name: 'OpenIM Platform API',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      'x-metadata': { retained: true },
    },
    item,
    variable: [{ key: 'baseUrl', value: variableValue }],
  };
}

test('parses platform-neutral export options when every value is present', () => {
  assert.deepEqual(
    parse([
      'export',
      '--',
      'input.json',
      'output.json',
      '--tag',
      'Public',
      '--strip-tag',
      'Internal',
      '--strip-tag',
      'Deprecated',
    ]),
    {
      command: 'export',
      inputPath: 'input.json',
      outputPath: 'output.json',
      stripTags: ['Internal', 'Deprecated'],
      tag: 'Public',
    },
  );
});

test('parses identical ordered folder imports for both publication platforms', () => {
  const values = ['--folder', 'Public:public:source.json', '--folder', 'Full:full.json'];
  const imports = [
    { folder: 'Public', path: 'public:source.json' },
    { folder: 'Full', path: 'full.json' },
  ];
  assert.deepEqual(parse(['publish-postman', ...values]), { command: 'publish-postman', imports });
  assert.deepEqual(parse(['publish-apifox', ...values]), { command: 'publish-apifox', imports });
  assert.deepEqual(parse([]), { command: 'help' });
  for (const command of ['export', 'publish-postman', 'publish-apifox'])
    assert.deepEqual(parse([command, '--help']), { command: 'help' });
});

for (const [name, args, message] of [
  ['unknown commands', ['publish-other', 'collection.json'], /publish-other/],
  ['unknown options', ['publish-postman', '--unknown'], /--unknown/],
  ['equals-form options', ['export', 'in', 'out', '--tag=Public'], /--tag=Public/],
  ['missing folders', ['publish-apifox'], /folder/i],
  ['extra positionals', ['publish-apifox', 'public.json'], /unexpected argument/i],
  ['option tokens as positionals', ['export', 'input.json', '--tag', 'Public'], /OUTPUT/],
  [
    'misplaced separators',
    ['publish-postman', '--folder', 'Public:file.json', '--', 'extra'],
    /unexpected argument/i,
  ],
  ['missing option values', ['export', 'in', 'out', '--tag'], /--tag/],
  ['repeated tags', ['export', 'in', 'out', '--tag', 'Public', '--tag', 'Full'], /--tag/],
  ['malformed imports', ['publish-postman', '--folder', 'Public'], /NAME:FILE/],
  ['blank folder names', ['publish-postman', '--folder', ':input.json'], /name/i],
  ['blank folder paths', ['publish-postman', '--folder', 'Public:'], /path/i],
  [
    'duplicate folder labels',
    ['publish-postman', '--folder', 'Public:one.json', '--folder', 'Public:two.json'],
    /Public/,
  ],
] as const)
  test(`rejects ${name} with a PlatformApiError`, () => {
    assert.throws(
      () => parse(args),
      (error: unknown) => error instanceof PlatformApiError && message.test(error.message),
    );
  });

test('projects exact tags before stripping while preserving metadata and input', () => {
  const source = openApiDocument();
  const original = JSON.parse(JSON.stringify(source));
  const projected = project(source, { stripTags: [], tag: 'Public' });
  assert.deepEqual(source, original);
  assert.deepEqual(projected.tags, [
    { description: 'Private operations.', name: 'Private' },
    { description: 'Message operations.', name: 'Messages' },
    { description: 'User operations.', name: 'Users' },
  ]);
  assert.deepEqual(projected.paths, {
    '/messages': {
      get: { responses: { '200': { description: 'ok' } }, tags: ['Messages'] },
      summary: 'Preserve this path metadata.',
    },
    '/users': {
      get: { responses: { '200': { description: 'ok' } }, tags: ['Users'] },
    },
  });
  assert.deepEqual(projected['x-document-metadata'], { retained: true });
});

test('includes all operations when stripping tags without filtering', () => {
  const projected = project(openApiDocument(), { stripTags: ['Public', 'Public', 'Missing'] });
  assert.deepEqual(projected.paths, {
    '/messages': {
      get: { responses: { '200': { description: 'ok' } }, tags: ['Messages'] },
      post: { responses: { '200': { description: 'ok' } }, tags: ['Private', 'Messages'] },
      summary: 'Preserve this path metadata.',
    },
    '/private': {
      post: { responses: { '200': { description: 'ok' } }, tags: ['Private', 'Users'] },
    },
    '/users': {
      get: { responses: { '200': { description: 'ok' } }, tags: ['Users'] },
    },
  });
});

test('rejects unmatched tags and path references before conversion', () => {
  assert.throws(
    () => project(openApiDocument(), { stripTags: [], tag: 'public' }),
    (error: unknown) => error instanceof PlatformApiError && /public/.test(error.message),
  );
  assert.throws(
    () =>
      project(
        {
          info: { title: 'Referenced', version: '1.0.0' },
          openapi: '3.0.3',
          paths: { '/users': { $ref: './paths/users.yaml' } },
        },
        { stripTags: [] },
      ),
    (error: unknown) => error instanceof PlatformApiError && /bundle first/i.test(error.message),
  );
  assert.throws(
    () =>
      project(
        {
          info: { title: 'Referenced operation', version: '1.0.0' },
          openapi: '3.0.3',
          paths: { '/users': { get: { $ref: './operations/users.yaml' } } },
        },
        { stripTags: [] },
      ),
    (error: unknown) => error instanceof PlatformApiError && /bundle first/i.test(error.message),
  );
});

test('writes deterministic exports atomically without replacing stale output on failure', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'openim-postman-export-'));
  const inputPath = join(directory, 'openapi.json');
  const outputPath = join(directory, 'collection.json');
  const malformedPath = join(directory, 'malformed.json');
  const unmatchedOutputPath = join(directory, 'unmatched.json');
  try {
    await writeFile(inputPath, JSON.stringify(openApiDocument()));
    await exportOpenApi(inputPath, outputPath, { stripTags: [], tag: 'Public' });
    const first = await readFile(outputPath, 'utf8');
    await exportOpenApi(inputPath, outputPath, { stripTags: [], tag: 'Public' });
    assert.equal(await readFile(outputPath, 'utf8'), first);
    assert.match(first, /\n$/);
    await writeFile(malformedPath, '{');
    await assert.rejects(
      () => exportOpenApi(malformedPath, outputPath, { stripTags: [] }),
      /bundle first/i,
    );
    assert.equal(await readFile(outputPath, 'utf8'), first);
    await assert.rejects(
      () => exportOpenApi(inputPath, unmatchedOutputPath, { stripTags: [], tag: 'Missing' }),
      /Missing/,
    );
    await assert.rejects(() => readFile(unmatchedOutputPath, 'utf8'), { code: 'ENOENT' });
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test('assembles ordered roots while preserving complete metadata and duplicate items', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'openim-postman-assemble-'));
  const publicPath = join(directory, 'public.json');
  const fullPath = join(directory, 'full.json');
  const outputPath = join(directory, 'collection.json');
  const publicItems = [
    { name: 'Duplicate', request: { method: 'GET', url: 'https://api.example.invalid/public' } },
    { name: 'Duplicate', request: { method: 'GET', url: 'https://api.example.invalid/public' } },
  ];
  const fullItems = [
    { name: 'Full', request: { method: 'POST', url: 'https://api.example.invalid/full' } },
  ];
  try {
    await writeFile(publicPath, JSON.stringify(collection(publicItems)));
    await writeFile(fullPath, JSON.stringify(collection(fullItems)));
    await writeFile(outputPath, 'stale');
    const imports = [
      { folder: 'Public', path: publicPath },
      { folder: 'Full', path: fullPath },
      { folder: 'Repeated', path: publicPath },
    ];
    await assemblePostmanCollections(outputPath, imports);
    const first = await readFile(outputPath, 'utf8');
    await assemblePostmanCollections(outputPath, imports);
    assert.equal(await readFile(outputPath, 'utf8'), first);
    assert.equal(first.endsWith('\n'), true);
    assert.deepEqual(JSON.parse(first), {
      info: {
        name: 'OpenIM Platform API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        'x-metadata': { retained: true },
      },
      item: [
        { item: publicItems, name: 'Public' },
        { item: fullItems, name: 'Full' },
        { item: publicItems, name: 'Repeated' },
      ],
      variable: [{ key: 'baseUrl', value: 'https://api.example.invalid' }],
    });
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test('rejects invalid imports without replacing stale assembly output', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'openim-postman-assemble-failure-'));
  const validPath = join(directory, 'valid.json');
  const mismatchPath = join(directory, 'mismatch.json');
  const malformedPath = join(directory, 'malformed.json');
  const malformedNestedPath = join(directory, 'malformed-nested.json');
  const outputPath = join(directory, 'collection.json');
  try {
    await writeFile(validPath, JSON.stringify(collection([])));
    await writeFile(
      mismatchPath,
      JSON.stringify(collection([], 'https://different.example.invalid')),
    );
    await writeFile(malformedPath, '{}');
    await writeFile(
      malformedNestedPath,
      JSON.stringify(collection([{ item: [{ invalidNestedPostmanItem: true }], name: 'Folder' }])),
    );
    await writeFile(outputPath, 'stale');
    await assert.rejects(
      () =>
        assemblePostmanCollections(outputPath, [
          { folder: 'Public', path: validPath },
          { folder: 'Full', path: mismatchPath },
        ]),
      /metadata/i,
    );
    assert.equal(await readFile(outputPath, 'utf8'), 'stale');
    await assert.rejects(() =>
      assemblePostmanCollections(outputPath, [{ folder: 'Broken', path: malformedPath }]),
    );
    await assert.rejects(() =>
      assemblePostmanCollections(outputPath, [
        { folder: 'Broken nested', path: malformedNestedPath },
      ]),
    );
    assert.equal(await readFile(outputPath, 'utf8'), 'stale');
    await assert.rejects(() =>
      assemblePostmanCollections(outputPath, [{ folder: 'Directory', path: directory }]),
    );
    await assert.rejects(() =>
      assemblePostmanCollections(outputPath, [
        { folder: 'Missing', path: join(directory, 'missing.json') },
      ]),
    );
    await assert.rejects(() => assemblePostmanCollections(outputPath, []), /import/i);
    await assert.rejects(
      () =>
        assemblePostmanCollections(outputPath, [
          { folder: 'Public', path: validPath },
          { folder: 'Public', path: validPath },
        ]),
      /Duplicate/,
    );
    await assert.rejects(() =>
      assemblePostmanCollections(join(directory, 'missing-parent', 'collection.json'), [
        { folder: 'Public', path: validPath },
      ]),
    );
    assert.equal(await readFile(outputPath, 'utf8'), 'stale');
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test('uses the official Collection schema for folders, requests, and invalid imports', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'openim-postman-official-schema-'));
  const validPath = join(directory, 'valid.json');
  const invalidPaths = {
    marker: join(directory, 'wrong-marker.json'),
    nested: join(directory, 'nested-arbitrary.json'),
    nullRequest: join(directory, 'null-request.json'),
    root: join(directory, 'root-arbitrary.json'),
  };
  const outputPath = join(directory, 'collection.json');
  try {
    await writeFile(
      validPath,
      JSON.stringify(
        collection([
          { item: [{ request: 'https://api.example.invalid/folder' }] },
          { request: { method: 'GET', url: 'https://api.example.invalid/object' } },
        ]),
      ),
    );
    await writeFile(invalidPaths.nullRequest, JSON.stringify(collection([{ request: null }])));
    await writeFile(invalidPaths.root, JSON.stringify(collection([{ arbitrary: true }])));
    await writeFile(
      invalidPaths.nested,
      JSON.stringify(collection([{ item: [{ arbitrary: true }] }])),
    );
    await writeFile(
      invalidPaths.marker,
      JSON.stringify({ ...collection([]), info: { name: 'OpenIM Platform API', schema: 'wrong' } }),
    );
    await writeFile(outputPath, 'stale');
    await assemblePostmanCollections(outputPath, [{ folder: 'Valid', path: validPath }]);
    for (const path of Object.values(invalidPaths)) {
      await writeFile(outputPath, 'stale');
      await assert.rejects(() =>
        assemblePostmanCollections(outputPath, [{ folder: 'Invalid', path }]),
      );
      assert.equal(await readFile(outputPath, 'utf8'), 'stale');
    }
    await writeFile(outputPath, 'stale');
    await assert.rejects(() =>
      assemblePostmanCollections(outputPath, [
        { folder: 'Valid', path: validPath },
        { folder: 'Invalid', path: invalidPaths.nullRequest },
      ]),
    );
    assert.equal(await readFile(outputPath, 'utf8'), 'stale');
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});
