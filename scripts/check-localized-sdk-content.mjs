import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const routesPath = resolve(root, 'src/generated/routes.json');
const localizedPath = resolve(root, 'src/generated/wasm-sdk-zh-content.json');
const routes = JSON.parse(await readFile(routesPath, 'utf8'));
const wasmRoutes = routes.filter((route) => route.contextKey === 'chat/sdk/v4/wasm');

const errors = [];
const formalCandidateRoutes = [];
let localized;

const formalGuideHeadings = [
  '## 概览',
  '## 与 OpenIM 的对应关系',
  '## 前置条件',
  '## API 签名',
  '## 安装和配置',
  '## 初始化 SDK',
  '## 实现步骤',
  '## 验证结果',
  '## 故障排查',
  '## 下一步',
];

const formalBannedPatterns = [
  /This draft/i,
  /Support status/i,
  /Sendbird/i,
  /占位/,
  /草稿/,
  /本段说明/,
  /building blocks/i,
  /不提供.*等价/,
  /没有.*公开 API/,
];

const localizedBannedPatterns = [
  /@openim\/wasm-client-sdk@\d/,
  /\/openim\/(?:openIM\.wasm|sql-wasm\.wasm|wasm_exec\.js)/,
  /public\/openim/,
  /No public OpenIM WASM SDK method in `@openim\/wasm-client-sdk@/i,
  /This draft uses public signatures/i,
  /开放频道/,
  /频道 URL/,
  /按名称、URL/,
];

try {
  localized = JSON.parse(await readFile(localizedPath, 'utf8'));
} catch {
  errors.push('Missing generated Chinese WASM SDK content file.');
}

const pages = localized?.pages ?? {};
if (Object.keys(pages).length !== wasmRoutes.length) {
  errors.push(
    `Chinese WASM SDK pages: expected ${wasmRoutes.length}, found ${Object.keys(pages).length}.`,
  );
}

for (const route of wasmRoutes) {
  const page = pages[route.path];
  const source = await readFile(resolve(root, route.contentFile), 'utf8');
  const formalCandidate = isFormalCandidate(source);
  if (formalCandidate) formalCandidateRoutes.push(route);

  if (!page) {
    errors.push(`Missing Chinese WASM SDK page: ${route.path}`);
    continue;
  }
  if (!containsCjk(page.title)) errors.push(`${route.path}: title is not localized.`);
  if (!containsCjk(page.description)) errors.push(`${route.path}: description is not localized.`);
  if (!containsCjk(page.body)) errors.push(`${route.path}: body is not localized.`);
  if (!page.body.includes('```ts'))
    errors.push(`${route.path}: TypeScript code fences were not kept.`);

  for (const pattern of localizedBannedPatterns) {
    if (pattern.test(page.body)) {
      errors.push(`${route.path}: localized SDK page contains stale path or version copy.`);
      break;
    }
  }

  if (formalCandidate) {
    for (const heading of formalGuideHeadings) {
      if (!page.body.includes(heading)) {
        errors.push(`${route.path}: formal SDK guide is missing heading ${heading}.`);
      }
    }
    for (const pattern of formalBannedPatterns) {
      if (pattern.test(page.body)) {
        errors.push(`${route.path}: formal SDK guide still contains draft or migration copy.`);
        break;
      }
    }
  }
}

const overview = pages['/docs/chat/sdk/v4/wasm/overview'];
if (overview) {
  if (!overview.title.includes('WASM SDK')) {
    errors.push('Overview title should still identify WASM SDK.');
  }
  if (!overview.body.includes('## 概览'))
    errors.push('Overview body should contain a Chinese overview heading.');
  if (!overview.body.includes('API 签名'))
    errors.push('Overview body should contain a Chinese API signatures heading.');
}

const firstMessage = pages['/docs/chat/sdk/v4/wasm/getting-started/send-first-message'];
if (firstMessage) {
  if (!firstMessage.title.includes('发送第一条消息')) {
    errors.push('Send first message title should be localized.');
  }
  if (!firstMessage.body.includes('创建消息对象')) {
    errors.push('Send first message body should localize the implementation guidance.');
  }
  if (
    /接收方可以是.*群组中的成员/.test(firstMessage.body) ||
    /群聊场景下当前用户是目标群成员/.test(firstMessage.body)
  ) {
    errors.push('Send first message should not describe group chat as targeting a receiver user.');
  }
}

try {
  const firstMessageMdx = await readFile(
    resolve(root, 'content/zh/docs/chat/sdk/v4/wasm/getting-started/send-first-message.mdx'),
    'utf8',
  );
  if (
    /接收方可以是.*群组中的成员/.test(firstMessageMdx) ||
    /群聊场景下当前用户是目标群成员/.test(firstMessageMdx) ||
    /memberUserIDs:\s*\[\s*['"]user_b['"]\s*]/.test(firstMessageMdx)
  ) {
    errors.push('Chinese send-first-message MDX still implies group messages target a receiver user.');
  }
} catch {
  errors.push('Missing Chinese send-first-message MDX file.');
}

const applicationUsers =
  pages['/docs/chat/sdk/v4/wasm/user/retrieving-users/retrieve-a-list-of-users-in-an-application'];
if (applicationUsers) {
  if (!applicationUsers.body.includes('## ApplicationUserListQuery')) {
    errors.push('Application users page should keep the Sendbird-style query object section.');
  }
  if (!applicationUsers.body.includes('#### 参数列表')) {
    errors.push('Application users page should include a parameter list section.');
  }
  if (
    applicationUsers.body.includes('## OpenIM 模型') ||
    applicationUsers.body.includes('## 前置条件') ||
    applicationUsers.body.includes('## 故障排查')
  ) {
    errors.push('Application users page should not use the generic SDK guide structure.');
  }
  if (
    /Provide a 可信后端|Use Platform API|When the page describes|Confirm the 后端/.test(
      applicationUsers.body,
    )
  ) {
    errors.push('Application users page still contains mixed English/Chinese fallback copy.');
  }
}

if (errors.length > 0) {
  console.error(`Chinese WASM SDK content check failed: ${errors.length}`);
  for (const error of errors.slice(0, 50)) console.error(`  - ${error}`);
  if (errors.length > 50) console.error(`  ... ${errors.length - 50} additional errors omitted`);
  process.exitCode = 1;
} else {
  console.log(
    `Chinese WASM SDK content check passed (${wasmRoutes.length} pages, ${formalCandidateRoutes.length} formal candidates).`,
  );
}

function containsCjk(value) {
  return /[\u3400-\u9fff]/.test(value ?? '');
}

function isFormalCandidate(source) {
  return ![
    /No public OpenIM WASM SDK method/,
    /there is no public WASM SDK API equivalent/,
    /does not expose/,
    /server-owned/,
    /server-side/,
    /backend feature/,
    /authoritative action should run on your backend/,
    /trusted backend/,
    /Platform API layer/,
    /covers part of this workflow/,
    /remaining behavior belongs/,
  ].some((pattern) => pattern.test(source));
}
