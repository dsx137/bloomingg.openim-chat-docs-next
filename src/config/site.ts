export const siteConfig = {
  name: 'OpenIM Docs',
  productName: 'OpenIM',
  description: 'Documentation for OpenIM client SDKs and Platform API.',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  githubUrl: process.env.NEXT_PUBLIC_GITHUB_URL ?? 'https://github.com/openimsdk',
  editBaseUrl: process.env.NEXT_PUBLIC_EDIT_BASE_URL ?? '',
} as const;
