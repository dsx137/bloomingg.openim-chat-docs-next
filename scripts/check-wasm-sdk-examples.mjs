import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const roots = ['content/docs/chat/sdk/wasm', 'content/zh/docs/chat/sdk/wasm'];
const files = [];

for (const root of roots) walk(root);
files.push('scripts/build-wasm-sdk-zh-content.mjs');

const codePatterns = [
  {
    reason: 'destructures errCode/errMsg from an awaited OpenIM call',
    pattern: /\{[\s\S]*\berr(?:Code|Msg)\b[\s\S]*\}\s*=\s*await\s+OpenIM\./,
  },
  {
    reason: 'checks response.errCode after an awaited OpenIM call',
    pattern: /(?:const|let|var)\s+(\w+)\s*=\s*await\s+OpenIM\.[\s\S]*?\b\1\.errCode\b/,
  },
  {
    reason: 'checks errCode after an awaited OpenIM call',
    pattern: /\b(?:errCode|\w+\.errCode)\s*!==?\s*0/,
  },
];

const prosePatterns = [
  /Confirm the SDK response has `errCode === 0`/,
  /The response has an error code/,
  /SDK Promise 成功返回后，仍要检查响应中的 `errCode`/,
  /多数业务方法在 Promise 成功返回后仍需要检查响应体/,
  /Promise 成功返回只表示 SDK 调用完成，业务上仍应检查/,
  /errCode === 0/,
  /响应(?:满足|包含)[^。\n`]*`errCode === 0`/,
  /返回 `errCode === 0`/,
  /例如 `errCode === 0`/,
  /const \{[^}\n]*err(?:Code|Msg)[^}\n]*\}.*await OpenIM/,
  /if \(errCode !== 0\)/,
  /\b(?:response|result)\.errCode\b/,
  /errMsg \|\|/,
];

const failures = [];

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  if (file.endsWith('.mdx')) checkMdxFile(file, source);
  else checkProse(file, source);
}

if (failures.length > 0) {
  console.error('WASM SDK docs still use response errCode as the awaited-call failure path:');
  for (const failure of failures) {
    console.error(`- ${failure.file}:${failure.line} ${failure.reason}`);
  }
  process.exit(1);
}

console.log('WASM SDK code examples use catch-based OpenIM error handling.');

function checkMdxFile(file, source) {
  for (const block of codeBlocks(source)) {
    if (!/await\s+OpenIM\./.test(block.code)) continue;

    for (const { pattern, reason } of codePatterns) {
      if (pattern.test(block.code)) {
        failures.push({ file, line: block.line, reason });
      }
    }
  }

  checkProse(file, stripCodeBlocks(source));
}

function checkProse(file, source) {
  for (const pattern of prosePatterns) {
    for (const match of source.matchAll(new RegExp(pattern, 'g'))) {
      failures.push({
        file,
        line: lineForIndex(source, match.index ?? 0),
        reason: `contains old errCode success-path wording: ${pattern.source}`,
      });
    }
  }
}

function* codeBlocks(source) {
  const pattern = /```[^\n]*\n([\s\S]*?)```/g;
  for (const match of source.matchAll(pattern)) {
    yield {
      code: match[1],
      line: lineForIndex(source, match.index ?? 0),
    };
  }
}

function stripCodeBlocks(source) {
  return source.replace(/```[^\n]*\n[\s\S]*?```/g, '');
}

function lineForIndex(source, index) {
  return source.slice(0, index).split('\n').length;
}

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (path.endsWith('.mdx')) files.push(path);
  }
}
