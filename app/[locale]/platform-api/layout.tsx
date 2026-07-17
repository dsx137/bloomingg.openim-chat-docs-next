import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { DocsLayoutShell } from '@/src/components/site/docs-layout-shell';
import type { Locale } from '@/src/lib/i18n';
import { isLocale } from '@/src/lib/i18n';

export default async function LocalizedPlatformApiLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === 'en') notFound();
  return <DocsLayoutShell locale={locale as Locale}>{children}</DocsLayoutShell>;
}
