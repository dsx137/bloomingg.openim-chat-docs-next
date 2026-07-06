import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const routes = JSON.parse(await readFile(resolve(root, 'src/generated/routes.json'), 'utf8'));
const navigation = JSON.parse(
  await readFile(resolve(root, 'src/generated/navigation.json'), 'utf8'),
);
const searchIndex = JSON.parse(
  await readFile(resolve(root, 'src/generated/search-index.json'), 'utf8'),
);
const scope = JSON.parse(await readFile(resolve(root, 'data/structure/scope.json'), 'utf8'));
const expectedSdkPlatforms = [
  'ios',
  'android',
  'flutter',
  'uniapp',
  'wasm',
  'electron',
  'miniprogram',
  'react-native',
  'unity',
];

const errors = [];
const warnings = [];

let platformApiZh = { navigationLabels: {} };
try {
  platformApiZh = JSON.parse(
    await readFile(resolve(root, 'src/generated/platform-api-zh-content.json'), 'utf8'),
  );
} catch {
  errors.push('Missing generated Platform API Chinese navigation data.');
}

const pathSet = new Set();
const contentSet = new Set();
const routeByPath = new Map();
const platformApiDraftPatterns = [
  /\bSendbird-style\b/i,
  /Recommended implementation/i,
  /This page keeps/i,
  /familiar Sendbird-style browsing model/i,
  /Replace Sendbird-specific terminology/i,
  /No direct OpenIM endpoint/i,
  /Sendbird Platform API slot/i,
  /^### 弃用信息$/m,
  /当前 OpenIM 文档没有将该能力标记为废弃/,
  /迁移时应以 OpenIM REST API 当前版本/,
];
const platformApiPublishedOnlyPatterns = [
  /to call the documented OpenIM REST endpoint/i,
  /This capability is available through the referenced OpenIM endpoint/i,
];
const platformApiLegacyHeadingPatterns = [
  /^## OpenIM availability$/m,
  /^## Endpoint$/m,
  /^## Authentication$/m,
  /^## Request$/m,
  /^## Response$/m,
  /^## Verify$/m,
  /^## Official OpenIM references$/m,
  /^### Header$/m,
];
const platformApiZhLegacyPatterns = [
  /^## Overview$/m,
  /^## HTTP request$/m,
  /^## Parameters$/m,
  /^## Request body$/m,
  /^## Responses$/m,
  /^### Header$/m,
  /^## OpenIM availability$/m,
  /^## Implementation notes$/m,
  /^## Server-side responsibility$/m,
  /^## Official OpenIM references$/m,
  /\bgroup channel\b/i,
  /\bopen channel\b/i,
  /\bThis capability\b/,
  /\bImplementation approach\b/,
  /\bRequest conventions\b/,
  /\bRelated pages\b/,
];
const platformApiUnsupportedPathPatterns = [
  /\/open-channel\b/,
  /custom-channel-types?/,
  /\/listing-muted-users\//,
];
const platformApiUncoveredPatterns = [
  /可通过 OpenIM 基础能力组合实现/,
  /当前 OpenIM REST 未提供独立接口/,
  /不是一个独立接口/,
  /Available through OpenIM primitives/,
  /Not exposed as a Platform API endpoint/,
];
const platformApiZhRequiredApiHeadings = ['## HTTP 请求', '## 响应'];
const platformApiForbiddenApiHeadings = [
  /^### 路径参数$/m,
  /^### 查询参数$/m,
  /^#### 响应字段$/m,
  /^#### 错误字段$/m,
  /^## OpenIM 实现说明$/m,
  /^## 资源$/m,
];
const platformApiSendbirdHeadingExpectations = new Map([
  [
    '/docs/chat/platform-api/v3/user/listing-users/list-users',
    [
      '## HTTP 请求',
      '### 请求示例',
      '## 参数',
      '### 请求头',
      '### 请求体参数',
      '## 响应',
      '#### 响应属性列表',
      '#### users[] 属性',
      '### 分页读取建议',
      '### 错误',
    ],
  ],
]);
const platformApiOverviewHeadingExpectations = new Map([
  ['/docs/chat/platform-api/v3/overview', ['## 最常用', '## 推荐功能', '## 资源']],
  [
    '/docs/chat/platform-api/v3/prepare-to-use-api',
    ['## 基础地址', '## 请求头', '## Multipart 请求', '## 鉴权', '## 请求体'],
  ],
  [
    '/docs/chat/platform-api/v3/user/overview',
    ['## 能力范围', '## 常用接口', '## 接入建议', '## 相关页面'],
  ],
  [
    '/docs/chat/platform-api/v3/channel/overview',
    ['## 能力范围', '## 常用接口', '## 接入建议', '## 相关页面'],
  ],
  [
    '/docs/chat/platform-api/v3/message/overview',
    ['## 能力范围', '## 常用接口', '## 接入建议', '## 相关页面'],
  ],
  [
    '/docs/chat/platform-api/v3/migration/overview',
    ['## 能力范围', '## 常用接口', '## 接入建议', '## 相关页面'],
  ],
  [
    '/docs/chat/platform-api/v3/moderation/overview',
    ['## 能力范围', '## 常用接口', '## 接入建议', '## 相关页面'],
  ],
  [
    '/docs/chat/platform-api/v3/error-codes',
    ['## 响应结构', '## 错误码范围', '## 处理流程', '## 服务端错误码', '## 排查建议'],
  ],
]);
const platformApiAllowedOverviewPaths = new Set(platformApiOverviewHeadingExpectations.keys());
const visibleBrandPattern = /\bSendbird\b/i;
const activeSdkPlatforms = scope.products.sdk?.platforms ?? [];
if (activeSdkPlatforms.join('\n') !== expectedSdkPlatforms.join('\n')) {
  errors.push(
    `Active SDK platforms must be ${expectedSdkPlatforms.join(', ')}; got ${activeSdkPlatforms.join(
      ', ',
    )}`,
  );
}

for (const route of routes) {
  if (pathSet.has(route.path)) errors.push(`Duplicate route path: ${route.path}`);
  if (contentSet.has(route.contentFile))
    errors.push(`Duplicate content file: ${route.contentFile}`);
  pathSet.add(route.path);
  contentSet.add(route.contentFile);
  routeByPath.set(route.path, route);

  const productScope = scope.products[route.product];
  if (!productScope) {
    errors.push(`Route is outside the active content scope: ${route.path} (${route.product})`);
  } else {
    if (productScope.versions?.length > 0 && !productScope.versions.includes(route.version)) {
      errors.push(
        `Unsupported version in active scope: ${route.path} (${route.version ?? 'none'})`,
      );
    }
    if (productScope.platforms?.length > 0 && !productScope.platforms.includes(route.platform)) {
      errors.push(
        `Unsupported platform in active scope: ${route.path} (${route.platform ?? 'none'})`,
      );
    }
  }
  if (!scope.allowReferenceTemplates && route.template === 'reference') {
    errors.push(`Hand-authored reference page is disabled by scope: ${route.path}`);
  }

  const absolute = resolve(root, route.contentFile);
  try {
    const details = await stat(absolute);
    if (!details.isFile()) errors.push(`Not a file: ${route.contentFile}`);
  } catch {
    errors.push(`Missing MDX file: ${route.contentFile}`);
    continue;
  }

  const mdx = await readFile(absolute, 'utf8');
  const frontmatter = parseFrontmatter(mdx);
  for (const key of ['title', 'description', 'product', 'context', 'template', 'status']) {
    if (!frontmatter[key]) errors.push(`${route.contentFile}: missing frontmatter field “${key}”`);
  }
  if (frontmatter.title && frontmatter.title !== route.title) {
    warnings.push(`${route.contentFile}: title differs from generated route metadata`);
  }

  if (route.product === 'platform-api') {
    for (const pattern of platformApiUnsupportedPathPatterns) {
      if (pattern.test(route.path)) {
        errors.push(`${route.path}: unsupported Sendbird-only Platform API path was generated`);
      }
    }
    if (
      route.template === 'overview' &&
      !platformApiAllowedOverviewPaths.has(route.path)
    ) {
      errors.push(
        `${route.contentFile}: non-root Platform API overview page is outside current OpenIM coverage scope`,
      );
    }
    if (route.status !== 'published') {
      errors.push(`${route.contentFile}: Chinese-only Platform API route must be published`);
    }
    if (frontmatter.title && containsUnexpectedEnglish(frontmatter.title)) {
      errors.push(`${route.contentFile}: Platform API title contains untranslated English text`);
    }

    for (const pattern of platformApiDraftPatterns) {
      if (pattern.test(mdx)) {
        errors.push(`${route.contentFile}: contains Platform API draft wording (${pattern})`);
      }
    }
    const bodyWithoutFrontmatter = mdx.replace(/^---\r?\n[\s\S]*?\r?\n---/, '');
    if (visibleBrandPattern.test(bodyWithoutFrontmatter)) {
      errors.push(`${route.contentFile}: visible Platform API body must not mention Sendbird`);
    }
    const expectedOverviewHeadings = platformApiOverviewHeadingExpectations.get(route.path);
    if (expectedOverviewHeadings) {
      const actualHeadings = extractPlatformApiSecondLevelHeadings(bodyWithoutFrontmatter);
      if (actualHeadings.join('\n') !== expectedOverviewHeadings.join('\n')) {
        errors.push(
          `${route.contentFile}: overview heading structure differs from Sendbird source; expected ${JSON.stringify(
            expectedOverviewHeadings,
          )}, got ${JSON.stringify(actualHeadings)}`,
        );
      }
    }
    if (route.path === '/docs/chat/platform-api/v3/error-codes') {
      checkPlatformApiErrorCodesPage(bodyWithoutFrontmatter, route.contentFile);
    }
    for (const pattern of platformApiUncoveredPatterns) {
      if (pattern.test(bodyWithoutFrontmatter)) {
        errors.push(
          `${route.contentFile}: Platform API contains uncovered capability wording (${pattern})`,
        );
      }
    }

    for (const pattern of platformApiPublishedOnlyPatterns) {
      if (pattern.test(mdx)) {
        errors.push(
          `${route.contentFile}: Platform API page contains old English direct-only wording (${pattern})`,
        );
      }
    }
    for (const pattern of platformApiLegacyHeadingPatterns) {
      if (pattern.test(mdx)) {
        errors.push(
          `${route.contentFile}: uses legacy Platform API heading instead of Chinese-only structure (${pattern})`,
        );
      }
    }
    if (route.template === 'api') {
      for (const heading of platformApiZhRequiredApiHeadings) {
        if (!mdx.includes(heading)) {
          errors.push(`${route.contentFile}: missing Chinese heading "${heading}"`);
        }
      }
      if (!mdx.includes('## 参数') && !mdx.includes('## 请求体')) {
        errors.push(`${route.contentFile}: missing Sendbird-style parameter/request-body section`);
      }
      for (const pattern of platformApiForbiddenApiHeadings) {
        if (pattern.test(mdx)) {
          errors.push(
            `${route.contentFile}: contains non-Sendbird Platform API heading ${pattern}`,
          );
        }
      }
      const expectedHeadings = platformApiSendbirdHeadingExpectations.get(route.path);
      if (expectedHeadings) {
        const actualHeadings = extractPlatformApiHeadings(bodyWithoutFrontmatter);
        if (actualHeadings.join('\n') !== expectedHeadings.join('\n')) {
          errors.push(
            `${route.contentFile}: heading structure differs from Sendbird source; expected ${JSON.stringify(
              expectedHeadings,
            )}, got ${JSON.stringify(actualHeadings)}`,
          );
        }
      }
      if (route.path === '/docs/chat/platform-api/v3/user/listing-users/list-users') {
        for (const expected of [
          'curl --request POST',
          'process.env.OPENIM_API_ADDRESS',
          'http.NewRequest',
          '安全提示',
          '200 OK',
          'errCode === 0',
          'users[].userID',
          'pagination.pageNumber',
          '### 分页读取建议',
          '常见错误场景',
          '"showNumber": 100',
        ]) {
          if (!bodyWithoutFrontmatter.includes(expected)) {
            errors.push(`${route.contentFile}: list-users page is missing "${expected}"`);
          }
        }
        for (const forbidden of ['123.321.1.1', '203.56.175.233']) {
          if (bodyWithoutFrontmatter.includes(forbidden)) {
            errors.push(
              `${route.contentFile}: list-users page contains raw sample host ${forbidden}`,
            );
          }
        }
      }
    }

    const localizedPath = resolve(root, 'content/zh', `${route.path.slice(1)}.mdx`);
    let localizedMdx = '';
    try {
      const details = await stat(localizedPath);
      if (!details.isFile()) errors.push(`Not a file: content/zh/${route.path.slice(1)}.mdx`);
      localizedMdx = await readFile(localizedPath, 'utf8');
    } catch {
      errors.push(`Missing Chinese Platform API MDX file: content/zh/${route.path.slice(1)}.mdx`);
    }
    if (localizedMdx) {
      const localizedFrontmatter = parseFrontmatter(localizedMdx);
      if (!localizedFrontmatter.title) {
        errors.push(`content/zh/${route.path.slice(1)}.mdx: missing localized title`);
      } else if (containsUnexpectedEnglish(localizedFrontmatter.title)) {
        errors.push(
          `content/zh/${route.path.slice(1)}.mdx: localized title contains untranslated English text`,
        );
      }
      const localizedBody = localizedMdx.replace(/^---\r?\n[\s\S]*?\r?\n---/, '');
      if (visibleBrandPattern.test(localizedMdx)) {
        errors.push(
          `content/zh/${route.path.slice(1)}.mdx: visible Chinese page must not mention Sendbird`,
        );
      }
      const expectedOverviewHeadings = platformApiOverviewHeadingExpectations.get(route.path);
      if (expectedOverviewHeadings) {
        const actualHeadings = extractPlatformApiSecondLevelHeadings(localizedBody);
        if (actualHeadings.join('\n') !== expectedOverviewHeadings.join('\n')) {
          errors.push(
            `content/zh/${route.path.slice(
              1,
            )}.mdx: overview heading structure differs from Sendbird source; expected ${JSON.stringify(
              expectedOverviewHeadings,
            )}, got ${JSON.stringify(actualHeadings)}`,
          );
        }
      }
      if (route.path === '/docs/chat/platform-api/v3/error-codes') {
        checkPlatformApiErrorCodesPage(localizedBody, `content/zh/${route.path.slice(1)}.mdx`);
      }
      for (const pattern of platformApiUncoveredPatterns) {
        if (pattern.test(localizedBody)) {
          errors.push(
            `content/zh/${route.path.slice(1)}.mdx: contains uncovered capability wording (${pattern})`,
          );
        }
      }
      for (const pattern of platformApiZhLegacyPatterns) {
        if (pattern.test(localizedBody)) {
          errors.push(
            `content/zh/${route.path.slice(1)}.mdx: contains English Platform API template text (${pattern})`,
          );
        }
      }
      if (route.template === 'api') {
        for (const heading of platformApiZhRequiredApiHeadings) {
          if (!localizedBody.includes(heading)) {
            errors.push(
              `content/zh/${route.path.slice(1)}.mdx: missing Chinese heading "${heading}"`,
            );
          }
        }
        if (!localizedBody.includes('## 参数') && !localizedBody.includes('## 请求体')) {
          errors.push(
            `content/zh/${route.path.slice(
              1,
            )}.mdx: missing Sendbird-style parameter/request-body section`,
          );
        }
        for (const pattern of platformApiForbiddenApiHeadings) {
          if (pattern.test(localizedBody)) {
            errors.push(
              `content/zh/${route.path.slice(
                1,
              )}.mdx: contains non-Sendbird Platform API heading ${pattern}`,
            );
          }
        }
        const expectedHeadings = platformApiSendbirdHeadingExpectations.get(route.path);
        if (expectedHeadings) {
          const actualHeadings = extractPlatformApiHeadings(localizedBody);
          if (actualHeadings.join('\n') !== expectedHeadings.join('\n')) {
            errors.push(
              `content/zh/${route.path.slice(
                1,
              )}.mdx: heading structure differs from Sendbird source; expected ${JSON.stringify(
                expectedHeadings,
              )}, got ${JSON.stringify(actualHeadings)}`,
            );
          }
        }
        if (route.path === '/docs/chat/platform-api/v3/user/listing-users/list-users') {
          for (const expected of [
            'curl --request POST',
            'process.env.OPENIM_API_ADDRESS',
            'http.NewRequest',
            '安全提示',
            '200 OK',
            'errCode === 0',
            'users[].userID',
            'pagination.pageNumber',
            '### 分页读取建议',
            '常见错误场景',
            '"showNumber": 100',
          ]) {
            if (!localizedBody.includes(expected)) {
              errors.push(
                `content/zh/${route.path.slice(1)}.mdx: list-users page is missing "${expected}"`,
              );
            }
          }
          for (const forbidden of ['123.321.1.1', '203.56.175.233']) {
            if (localizedBody.includes(forbidden)) {
              errors.push(
                `content/zh/${route.path.slice(
                  1,
                )}.mdx: list-users page contains raw sample host ${forbidden}`,
              );
            }
          }
        }
      }
    }
  }

  for (const href of mdx.matchAll(/href=["'](\/docs\/[^"']+)["']/g)) {
    if (!pathSet.has(href[1]) && !routes.some((item) => item.path === href[1])) {
      warnings.push(`${route.contentFile}: unresolved internal link ${href[1]}`);
    }
  }
}

if (searchIndex.length !== routes.length) {
  errors.push(`Search index has ${searchIndex.length} records; expected ${routes.length}`);
}

const navigatedPaths = new Set();
for (const context of navigation.contexts) {
  for (const path of flattenNavigation(context.nodes)) {
    if (navigatedPaths.has(path)) warnings.push(`Navigation path appears more than once: ${path}`);
    navigatedPaths.add(path);
    if (!routeByPath.has(path)) errors.push(`Navigation points to unknown route: ${path}`);
  }
}

const sdkContextPlatforms = navigation.contexts
  .filter((context) => context.product === 'sdk')
  .map((context) => context.platform)
  .filter(Boolean);
if (sdkContextPlatforms.join('\n') !== expectedSdkPlatforms.join('\n')) {
  errors.push(
    `Navigation SDK platforms must be ${expectedSdkPlatforms.join(
      ', ',
    )}; got ${sdkContextPlatforms.join(', ')}`,
  );
}

const routeSdkPlatforms = [
  ...new Set(
    routes
      .filter((route) => route.product === 'sdk')
      .map((route) => route.platform)
      .filter(Boolean),
  ),
];
if (routeSdkPlatforms.join('\n') !== expectedSdkPlatforms.join('\n')) {
  errors.push(
    `Route SDK platforms must be ${expectedSdkPlatforms.join(', ')}; got ${routeSdkPlatforms.join(
      ', ',
    )}`,
  );
}

for (const route of routes) {
  if (route.path === '/docs/chat') continue;
  if (!navigatedPaths.has(route.path))
    warnings.push(`Route is not represented in sidebar navigation: ${route.path}`);
}

const platformContext = navigation.contexts.find(
  (context) => context.key === 'chat/platform-api/v3',
);
if (platformContext) {
  for (const segment of collectFolderSegments(platformContext.nodes)) {
    if (!platformApiZh.navigationLabels[segment]) {
      errors.push(`Missing Chinese Platform API navigation label for segment: ${segment}`);
    }
  }
}

console.log(`Content files checked: ${routes.length.toLocaleString()}`);
console.log(`Navigation contexts: ${navigation.contexts.length.toLocaleString()}`);
console.log(`Search records: ${searchIndex.length.toLocaleString()}`);

if (warnings.length > 0) {
  console.warn(`Warnings: ${warnings.length}`);
  for (const warning of warnings.slice(0, 20)) console.warn(`  - ${warning}`);
  if (warnings.length > 20) console.warn(`  … ${warnings.length - 20} additional warnings omitted`);
}

if (errors.length > 0) {
  console.error(`Errors: ${errors.length}`);
  for (const error of errors.slice(0, 50)) console.error(`  - ${error}`);
  process.exitCode = 1;
} else {
  console.log('Content integrity check passed.');
}

function parseFrontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const result = {};
  for (const line of match[1].split('\n')) {
    const separator = line.indexOf(':');
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    const raw = line.slice(separator + 1).trim();
    try {
      result[key] = JSON.parse(raw);
    } catch {
      result[key] = raw.replace(/^['"]|['"]$/g, '');
    }
  }
  return result;
}

function collectFolderSegments(nodes) {
  const segments = new Set();
  for (const node of nodes) {
    if (node.children?.length > 0 && !node.href && node.segment) segments.add(node.segment);
    for (const segment of collectFolderSegments(node.children ?? [])) segments.add(segment);
  }
  return segments;
}

function containsUnexpectedEnglish(value) {
  const allowed = value.replace(
    /\b(OpenIM|Platform|API|REST|Webhook|Token|ID|URL|APNs|FCM|HMS|GDPR|DAU|MAU|IP|SDK|APP|HTTP|JSON)\b/g,
    '',
  );
  return /[A-Za-z]{2,}/.test(allowed);
}

function extractPlatformApiHeadings(body) {
  return body
    .split(/\r?\n/)
    .map((line) => line.match(/^(#{2,4})\s+(.+)$/))
    .filter((match) => Boolean(match))
    .map((match) => `${match[1]} ${match[2].trim()}`);
}

function extractPlatformApiSecondLevelHeadings(body) {
  return body
    .split(/\r?\n/)
    .map((line) => line.match(/^(##)\s+(.+)$/))
    .filter((match) => Boolean(match))
    .map((match) => `${match[1]} ${match[2].trim()}`);
}

function checkPlatformApiErrorCodesPage(body, label) {
  for (const expected of [
    'errCode === 0',
    '1~9999',
    '10000~20000',
    '20001~29999',
    '| 1001 | 通用请求 | 参数错误',
    '| 1002 | 通用请求 | 权限不足',
    '| 1501 | Token | token 已过期',
    '不要直接暴露内部错误详情',
    '大量出现 `1002` 或 `1501~1507`',
  ]) {
    if (!body.includes(expected)) {
      errors.push(`${label}: error-codes page is missing "${expected}"`);
    }
  }
}

function* flattenNavigation(nodes) {
  for (const node of nodes) {
    if (node.href) yield node.href;
    yield* flattenNavigation(node.children ?? []);
  }
}
