import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  generateDocumentationMetadata,
  renderDocumentationPage,
} from '@/src/components/docs/documentation-page';
import type { Locale } from '@/src/lib/i18n';
import { isLocale } from '@/src/lib/i18n';

type PageProps = {
  params: Promise<{ locale: string; slug?: string[] }>;
};

export const dynamicParams = true;
export const revalidate = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale) || locale === 'en') return {};
  return generateDocumentationMetadata({ slug }, locale as Locale);
}

export default async function LocalizedDocumentationPage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || locale === 'en') notFound();

  return renderDocumentationPage({ slug }, locale as Locale);
}
