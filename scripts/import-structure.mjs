import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const root = process.cwd();
const force = process.argv.includes('--force');
const dryRun = process.argv.includes('--dry-run');
const manifestArg = readArg('--manifest');
const manifestPath = resolve(root, manifestArg ?? 'src/generated/routes.json');
const routes = JSON.parse(await readFile(manifestPath, 'utf8'));
let created = 0;
let skipped = 0;

for (const route of routes) {
  const output = resolve(root, route.contentFile);
  const exists = await fileExists(output);
  if (exists && !force) {
    skipped += 1;
    continue;
  }
  const body = renderPage(route);
  if (!dryRun) {
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, body, 'utf8');
  }
  created += 1;
}

console.log(
  `${dryRun ? 'Would create' : 'Created'} ${created.toLocaleString()} page files; skipped ${skipped.toLocaleString()}.`,
);
if (force) console.warn('Force mode overwrote existing MDX files.');

function renderPage(route) {
  const fields = [
    ['title', route.title],
    ['description', route.description],
    ['product', route.product],
    ['context', route.contextKey],
    ['template', route.template],
    ['status', route.status ?? 'scaffold'],
    ['lastUpdated', new Date().toISOString().slice(0, 10)],
    ['version', route.version],
    ['platform', route.platform],
    ['sourcePath', route.sourcePath],
  ].filter(([, value]) => value !== null && value !== undefined);
  const frontmatter = fields.map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n');
  if (route.template === 'landing') return renderLanding(frontmatter);

  const component =
    {
      overview: 'OverviewScaffold',
      guide: 'DocScaffold',
      api: 'ApiScaffold',
    }[route.template] ?? 'DocScaffold';
  return `---\n${frontmatter}\n---\n<${component}\n  route=${JSON.stringify(route.path)}\n  context=${JSON.stringify(route.contextTitle)}\n  sourceTitle=${JSON.stringify(route.title)}\n/>\n`;
}

function renderLanding(frontmatter) {
  return `---\n${frontmatter}\n---\n<ChatHero
  eyebrow="OPENIM CHAT"
  title="Build real-time communication on infrastructure you control."
  description="A documentation workspace for the current OpenIM SDKs and server-side APIs. Replace the scaffold pages with your product content."
  primaryLabel="Explore client SDKs"
  primaryHref="/docs/chat/sdk/v4/wasm/overview"
  secondaryLabel="Explore server APIs"
  secondaryHref="/docs/chat/platform-api/v3/overview"
/>

<LandingSection title="Choose how you want to build" description="Keep client SDKs and server control in one consistent documentation system.">
  <LandingCard title="Client SDKs" href="/docs/chat/sdk/v4/wasm/overview" description="Integrate messaging capabilities across supported client platforms." icon="code" />
  <LandingCard title="Server API" href="/docs/chat/platform-api/v3/overview" description="Describe administrative operations, webhooks, and automation." icon="server" />
</LandingSection>
`;
}

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
