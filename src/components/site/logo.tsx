import Link from 'next/link';
import type { Locale } from '@/src/lib/i18n';
import { t, toLocalizedPath } from '@/src/lib/i18n';

export function Logo({ locale = 'en' }: { locale?: Locale }) {
  const text = t(locale);

  return (
    <Link
      aria-label="OpenIM Docs home"
      className="brand-lockup"
      href={toLocalizedPath('/', locale)}
    >
      <span aria-hidden="true" className="brand-mark">
        <span />
        <span />
      </span>
      <span className="brand-name">OpenIM</span>
      <span className="brand-divider" />
      <span className="brand-docs">{text.chrome.docs}</span>
    </Link>
  );
}
