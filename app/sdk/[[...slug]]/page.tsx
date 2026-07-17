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
  return generateDocumentationMetadata(getChatDocumentationParams('sdk', slug));
}

export default async function SdkDocumentationPage({ params }: PageProps) {
  const { slug } = await params;
  return renderDocumentationPage(getChatDocumentationParams('sdk', slug));
}
