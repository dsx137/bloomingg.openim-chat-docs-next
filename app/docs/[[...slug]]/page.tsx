import type { Metadata } from 'next';
import {
  generateDocumentationMetadata,
  renderDocumentationPage,
} from '@/src/components/docs/documentation-page';

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export const dynamicParams = true;
export const revalidate = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return generateDocumentationMetadata(await params);
}

export default async function DocumentationPage({ params }: PageProps) {
  return renderDocumentationPage(await params);
}
