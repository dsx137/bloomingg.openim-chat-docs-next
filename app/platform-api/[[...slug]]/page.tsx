import type { Metadata } from 'next';
import {
  generateDocumentationMetadata,
  renderDocumentationPage,
} from '@/src/components/docs/documentation-page';
import { getChatDocumentationParams } from '@/src/lib/chat-documentation-route';

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export const dynamicParams = true;
export const revalidate = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return generateDocumentationMetadata(getChatDocumentationParams('platform-api', slug));
}

export default async function PlatformApiDocumentationPage({ params }: PageProps) {
  const { slug } = await params;
  return renderDocumentationPage(getChatDocumentationParams('platform-api', slug));
}
