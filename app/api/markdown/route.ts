import { NextResponse } from 'next/server';
import { getGuideMarkdownPage } from '@/src/lib/guide-markdown';
import { getLocalizedDocPage } from '@/src/lib/localized-docs';
import { isLocale, stripLocaleFromPath, type Locale } from '@/src/lib/i18n';
import { getRouteRecord } from '@/src/lib/routes';
import { getSourceDocPage } from '@/src/lib/source-docs';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawPath = url.searchParams.get('path') ?? '';
  const requestedLocale = url.searchParams.get('locale') ?? undefined;
  const locale: Locale = isLocale(requestedLocale) ? requestedLocale : 'en';
  const path = stripLocaleFromPath(rawPath);
  const guidePage = getGuideMarkdownPage(path);

  if (guidePage) {
    return createMarkdownResponse({
      body: guidePage.body,
      filename: slugFromPath(path),
      title: guidePage.title,
    });
  }

  const route = getRouteRecord(path);

  if (!route) {
    return NextResponse.json({ error: 'Markdown source not found.' }, { status: 404 });
  }

  const localized = getLocalizedDocPage(route.path, locale);
  const page = localized ?? getSourceDocPage(route.contentFile);

  if (!page) {
    return NextResponse.json({ error: 'Markdown source not found.' }, { status: 404 });
  }

  return createMarkdownResponse({
    body: page.body,
    filename: slugFromPath(route.path),
    title: page.title || route.title,
  });
}

function createMarkdownResponse({
  body,
  filename,
  title,
}: {
  body: string;
  filename: string;
  title: string;
}) {
  const markdown = renderPageMarkdown({ body, title });

  return new Response(markdown, {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      'Content-Disposition': `inline; filename="${filename}.md"`,
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
}

function renderPageMarkdown({ body, title }: { body: string; title: string }) {
  const normalizedBody = body.trim();
  if (!title) return `${normalizedBody}\n`;
  if (normalizedBody.startsWith(`# ${title}`)) return `${normalizedBody}\n`;
  return `# ${title}\n\n${normalizedBody}\n`;
}

function slugFromPath(path: string) {
  return path.split('/').filter(Boolean).at(-1) ?? 'page';
}
