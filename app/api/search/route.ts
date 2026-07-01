import { NextResponse } from 'next/server';
import { searchDocs } from '@/src/lib/search';

export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q')?.trim() ?? '';
  const requestedLimit = Number.parseInt(url.searchParams.get('limit') ?? '20', 10);
  const limit = Number.isFinite(requestedLimit) ? requestedLimit : 20;

  const results =
    query.length >= 2
      ? searchDocs(query, limit).map((result) => ({
          path: result.path,
          title: result.title,
          description: result.description,
          context: result.context,
        }))
      : [];

  return NextResponse.json(
    { query, results },
    {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    },
  );
}
