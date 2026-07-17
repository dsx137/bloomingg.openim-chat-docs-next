import { HomeLanding, generateHomeMetadata } from '@/src/components/mdx/home-landing';

export const metadata = generateHomeMetadata('en');

export default function HomePage() {
  return <HomeLanding locale="en" />;
}
