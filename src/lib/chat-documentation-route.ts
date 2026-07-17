import type { DocumentationPageParams } from '@/src/components/docs/documentation-page';

export type ChatProductRoute = 'platform-api' | 'sdk';

export function getChatDocumentationParams(
  product: ChatProductRoute,
  slug?: string[],
): DocumentationPageParams {
  const productSlugs = [product, ...(slug ?? [])];
  return {
    routePath: `/${productSlugs.join('/')}`,
    sourceSlugs: ['chat', ...productSlugs],
  };
}
