import Link from 'next/link';
import { ChevronRightIcon } from '@/src/components/ui/icons';
import type { Locale } from '@/src/lib/i18n';
import { t, toLocalizedPath } from '@/src/lib/i18n';
import type { RouteRecord } from '@/src/types/docs';

export function Pagination({
  previous,
  next,
  locale = 'en',
}: {
  previous?: RouteRecord;
  next?: RouteRecord;
  locale?: Locale;
}) {
  const text = t(locale);
  if (!previous && !next) return null;

  return (
    <nav aria-label="Previous and next pages" className="pagination">
      {previous ? (
        <Link className="pagination-previous" href={toLocalizedPath(previous.path, locale)}>
          <span>{text.docs.previous}</span>
          <strong>{previous.title}</strong>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link className="pagination-next" href={toLocalizedPath(next.path, locale)}>
          <span>{text.docs.next}</span>
          <strong>{next.title}</strong>
          <ChevronRightIcon />
        </Link>
      ) : null}
    </nav>
  );
}
