import { notFound, redirect } from 'next/navigation';
import { isLocale, toLocalizedPath } from '@/src/lib/i18n';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LocaleHome({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === 'en') notFound();

  redirect(toLocalizedPath('/docs/chat', locale));
}
