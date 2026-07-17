import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HomeLanding, generateHomeMetadata } from '@/src/components/mdx/home-landing';
import { isLocale } from '@/src/lib/i18n';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LocaleHome({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === 'en') notFound();

  return <HomeLanding locale={locale} />;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale) || locale === 'en') return {};
  return generateHomeMetadata(locale);
}
