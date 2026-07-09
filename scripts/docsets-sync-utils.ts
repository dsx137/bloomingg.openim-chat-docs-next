import { spawnSync } from 'node:child_process';
import { appendFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { docsetsDataSchema, type DocsetRecord, type DocsetsData } from '../src/types/docs.js';

interface DiffRecord {
  key: string;
  repoUrl: string;
  packageName: string | null;
  docsRoot: string;
  sourceRef: string;
  targetRef: string;
  targetVersion: string;
  targetTagPattern: string;
  sourceSha: string;
  targetSha: string;
  diffPath: string;
  stat: string;
}

interface SkippedRecord {
  key: string;
  reason: string;
}

interface SyncSummary {
  changed: boolean;
  records: DiffRecord[];
  skipped: SkippedRecord[];
}

interface VersionParts {
  major: number;
  minor: number;
  patch: number;
  suffix: string;
  suffixRank: number;
  build: number;
  revision: number;
}

interface MatchedTag {
  tag: string;
  version: VersionParts;
  displayVersion: string;
}

interface ResolvedTargetRef {
  ref: string;
  version: string;
}

const repoRoot = process.cwd();
const manifestPath = resolve(repoRoot, 'data/structure/docsets.json');
const outputDir = resolve(repoRoot, '.docsets-sync');
const upstreamsDir = join(outputDir, 'upstreams');
const diffsDir = join(outputDir, 'diffs');
const summaryPath = join(outputDir, 'summary.json');
const [command, ...commandArgs] = process.argv.slice(2);

await run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

async function run(): Promise<void> {
  if (command === '--help' || command === '-h') {
    console.log(renderUsage());
  } else if (command === 'diff') {
    await collectDocsetDiffs(readDocsetKey(commandArgs));
  } else if (command === 'baseline') {
    if (commandArgs.length > 0) throw new Error(`baseline takes no arguments.\n${renderUsage()}`);
    await updateDocsetBaselines();
  } else {
    throw new Error(`${renderUsage()}\nUnknown docsets sync command: ${command ?? '(missing)'}.`);
  }
}

function renderUsage(): string {
  return [
    'Usage:',
    '  tsx scripts/docsets-sync-utils.ts diff [--docset-key KEY]',
    '  tsx scripts/docsets-sync-utils.ts baseline',
  ].join('\n');
}

async function collectDocsetDiffs(docsetKey: string | null): Promise<void> {
  const { docsets } = await readManifest();

  await rm(outputDir, { recursive: true, force: true });
  await mkdir(upstreamsDir, { recursive: true });
  await mkdir(diffsDir, { recursive: true });

  const records: DiffRecord[] = [];
  const skipped: SkippedRecord[] = [];
  let matchedFilter = false;

  for (const docset of docsets) {
    if (docsetKey && docset.key !== docsetKey) continue;
    matchedFilter = true;

    if (!docset.sourceRef) {
      skipped.push({ key: docset.key, reason: 'missing sourceRef' });
      continue;
    }

    const target = resolveTargetRef(docset);
    if (!target) {
      skipped.push({ key: docset.key, reason: 'no target ref matched' });
      continue;
    }

    const repoDir = join(upstreamsDir, safeName(docset.key));
    await mkdir(repoDir, { recursive: true });
    git(['init', '-q'], repoDir);
    git(['remote', 'add', 'origin', docset.repoUrl], repoDir);

    const sourceSha = fetchRef(repoDir, docset.sourceRef);
    const targetSha = fetchRef(repoDir, target.ref);

    if (sourceSha === targetSha) {
      skipped.push({ key: docset.key, reason: `no update (${docset.sourceRef} == ${target.ref})` });
      continue;
    }

    const diff = git(['diff', '--binary', sourceSha, targetSha, '--'], repoDir);
    if (!diff.trim()) {
      skipped.push({ key: docset.key, reason: 'ref changed but no file diff was produced' });
      continue;
    }

    const diffPath = join(diffsDir, `${safeName(docset.key)}.diff`);
    await writeFile(diffPath, diff);
    records.push({
      key: docset.key,
      repoUrl: docset.repoUrl,
      packageName: docset.packageName ?? null,
      docsRoot: `content/docs/${docset.key}`,
      sourceRef: docset.sourceRef,
      targetRef: target.ref,
      targetVersion: target.version,
      targetTagPattern: docset.targetTagPattern,
      sourceSha,
      targetSha,
      diffPath: relativeToRepo(diffPath),
      stat: git(['diff', '--stat', sourceSha, targetSha, '--'], repoDir),
    });
  }

  if (docsetKey && !matchedFilter) throw new Error(`Unknown docset key: ${docsetKey}`);

  const summary: SyncSummary = { changed: records.length > 0, records, skipped };
  await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
  await writeFile(join(outputDir, 'summary.md'), renderSummary(records, skipped));
  await writeFile(join(outputDir, 'omp-prompt.md'), renderPrompt(records));
  await writeGitHubOutputs(summary.changed);

  console.log(
    summary.changed ? `Collected ${records.length} upstream diff(s).` : 'No docsets updates found.',
  );
  if (skipped.length > 0) console.log(`Skipped ${skipped.length} docsets item(s).`);
}

async function updateDocsetBaselines(): Promise<void> {
  const manifest = await readManifest();
  const { records } = JSON.parse(await readFile(summaryPath, 'utf8')) as SyncSummary;

  if (records.length === 0) {
    console.log('No docsets baselines to update.');
    return;
  }

  const docsetsByKey = new Map(manifest.docsets.map((docset) => [docset.key, docset]));
  for (const record of records) {
    const docset = docsetsByKey.get(record.key);
    if (!docset) throw new Error(`Unknown docset key in summary: ${record.key}`);
    docset.sourceRef = record.targetRef;
  }

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(`Updated ${records.length} docsets baseline(s).`);
  for (const record of records) {
    console.log(`- ${record.key}: sourceRef ${docsetsByKey.get(record.key)!.sourceRef}`);
  }
}

async function readManifest(): Promise<DocsetsData> {
  return docsetsDataSchema.parse(JSON.parse(await readFile(manifestPath, 'utf8')));
}

function readDocsetKey(values: string[]): string | null {
  const args = values[0] === '--' ? values.slice(1) : values;
  if (args.length === 0) return null;
  if (args.length === 2 && args[0] === '--docset-key' && args[1]) return args[1];
  throw new Error(`Invalid diff arguments.\n${renderUsage()}`);
}

async function writeGitHubOutputs(changed: boolean): Promise<void> {
  if (!process.env.GITHUB_OUTPUT) return;
  const outputPath = process.env.GITHUB_OUTPUT;
  await mkdir(dirname(outputPath), { recursive: true });
  await appendFile(
    outputPath,
    [
      `changed=${changed ? 'true' : 'false'}`,
      'summary_path=.docsets-sync/summary.md',
      'prompt_path=.docsets-sync/omp-prompt.md',
      '',
    ].join('\n'),
  );
}

function renderSummary(records: DiffRecord[], skipped: SkippedRecord[]): string {
  const lines: string[] = ['# Docsets upstream diff summary', ''];
  if (records.length === 0) {
    lines.push('No configured docsets have upstream changes.');
  } else {
    for (const record of records) {
      lines.push(`## ${record.key}`, '');
      lines.push(`- Repo: ${record.repoUrl}`);
      if (record.packageName) lines.push(`- Package: ${record.packageName}`);
      lines.push(`- Docs root: ${record.docsRoot}`);
      lines.push(`- Source: ${record.sourceRef} (${record.sourceSha})`);
      lines.push(`- Target: ${record.targetRef} (${record.targetSha})`);
      lines.push(`- Target tag pattern: ${record.targetTagPattern}`);
      lines.push(`- Target semver: ${record.targetVersion}`);
      lines.push(`- Diff: ${record.diffPath}`, '', '```text', record.stat.trim(), '```', '');
    }
  }
  if (skipped.length > 0) {
    lines.push('## Skipped', '');
    for (const item of skipped) lines.push(`- ${item.key}: ${item.reason}`);
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

function renderPrompt(records: DiffRecord[]): string {
  const lines: string[] = [
    '# Docsets update request',
    '',
    'Update this documentation repository using the upstream git diffs collected for configured docsets.',
    '',
    'Requirements:',
    '- Edit only files that are needed to reflect the upstream changes in the local docs.',
    '- Prefer existing docs style and frontmatter conventions.',
    '- Keep generated files consistent by running the repository sync/check commands after edits when needed.',
    '- Do not update data/structure/docsets.json; this workflow updates docsets baselines after the docs edits.',
    '- Do not change unrelated pages or repository configuration.',
    '',
    'Changed docsets:',
    '',
  ];
  for (const record of records) {
    lines.push(`## ${record.key}`);
    lines.push(`- Local docs root: ${record.docsRoot}`);
    lines.push(`- Upstream repo: ${record.repoUrl}`);
    if (record.packageName) lines.push(`- Package: ${record.packageName}`);
    lines.push(
      `- Compare: ${record.sourceRef} (${record.sourceSha}) -> ${record.targetRef} (${record.targetSha})`,
    );
    lines.push(`- Diff file: ${record.diffPath}`, '');
  }
  return `${lines.join('\n')}\n`;
}

function resolveTargetRef(docset: DocsetRecord): ResolvedTargetRef | null {
  const tag = getLatestMatchingTag(docset.repoUrl, docset.targetTagPattern);
  return tag ? { ref: tag.tag, version: tag.displayVersion } : null;
}

function getLatestMatchingTag(repoUrl: string, patternText: string): MatchedTag | null {
  let pattern: RegExp;
  try {
    pattern = new RegExp(patternText);
  } catch (error) {
    throw new Error(
      `Invalid targetTagPattern ${JSON.stringify(patternText)}: ${(error as Error).message}`,
    );
  }

  return (
    getRemoteTags(repoUrl)
      .map((tag) => readMatchedTag(tag, pattern, patternText))
      .filter((tag): tag is MatchedTag => Boolean(tag))
      .sort((a, b) => compareVersionParts(b.version, a.version) || a.tag.localeCompare(b.tag))[0] ??
    null
  );
}

function readMatchedTag(tag: string, pattern: RegExp, patternText: string): MatchedTag | null {
  const match = pattern.exec(tag);
  if (!match) return null;
  const groups = match.groups as Record<string, string | undefined> | undefined;
  if (!groups?.major || !groups.minor || !groups.patch) {
    throw new Error(
      `targetTagPattern must provide named capture groups major, minor, and patch: ${patternText}`,
    );
  }

  const version = {
    major: parseVersionGroup(groups.major, 'major', patternText),
    minor: parseVersionGroup(groups.minor, 'minor', patternText),
    patch: parseVersionGroup(groups.patch, 'patch', patternText),
    suffix: groups.suffix ?? '',
    suffixRank: groups.suffix ? 1 : 0,
    build: groups.build ? parseVersionGroup(groups.build, 'build', patternText) : 0,
    revision: groups.revision ? parseVersionGroup(groups.revision, 'revision', patternText) : 0,
  };

  return { tag, version, displayVersion: tag.replace(/^v/, '') };
}

function parseVersionGroup(value: string, groupName: string, patternText: string): number {
  const numberValue = Number(value);
  if (!Number.isSafeInteger(numberValue) || numberValue < 0) {
    throw new Error(
      `targetTagPattern group ${groupName} must capture a non-negative integer: ${patternText}`,
    );
  }
  return numberValue;
}

function getRemoteTags(repoUrl: string): string[] {
  return git(['ls-remote', '--tags', '--refs', repoUrl], repoRoot)
    .split('\n')
    .map((line) => line.trim().match(/^[a-f0-9]+\s+refs\/tags\/(.+)$/)?.[1])
    .filter((tag): tag is string => Boolean(tag));
}

function fetchRef(repoDir: string, ref: string): string {
  git(['fetch', '--quiet', '--depth=1', 'origin', ref], repoDir);
  return git(['rev-parse', 'FETCH_HEAD'], repoDir).trim();
}

function git(args: string[], cwd: string): string {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed:\n${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

function compareVersionParts(a: VersionParts, b: VersionParts): number {
  for (const field of ['major', 'minor', 'patch'] as const) {
    const diff = a[field] - b[field];
    if (diff !== 0) return diff;
  }
  if (a.build !== b.build) return a.build - b.build;
  if (a.revision !== b.revision) return a.revision - b.revision;
  if (a.suffixRank !== b.suffixRank) return a.suffixRank - b.suffixRank;
  return a.suffix.localeCompare(b.suffix);
}

function safeName(value: string): string {
  return value.replace(/[^A-Za-z0-9_.-]+/g, '__');
}

function relativeToRepo(path: string): string {
  return path.replace(`${repoRoot}/`, '');
}
