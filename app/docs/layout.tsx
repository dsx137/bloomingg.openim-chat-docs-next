import type { ReactNode } from 'react';
import { DocsLayoutShell } from '@/src/components/site/docs-layout-shell';

export default function DocsLayout({ children }: { children: ReactNode }) {
  return <DocsLayoutShell>{children}</DocsLayoutShell>;
}
