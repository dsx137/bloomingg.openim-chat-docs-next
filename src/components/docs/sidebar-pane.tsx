'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import {
  readSidebarScroll,
  writeSidebarScroll,
} from '@/src/components/docs/sidebar-scroll-state';

export function SidebarPane({
  children,
  stateScope,
}: {
  children: ReactNode;
  stateScope: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const saved = readSidebarScroll(stateScope);
    if (saved !== undefined) {
      element.scrollTop = saved;
    }

    const persist = () => {
      writeSidebarScroll(stateScope, element.scrollTop);
    };

    element.addEventListener('scroll', persist, { passive: true });
    return () => {
      persist();
      element.removeEventListener('scroll', persist);
    };
  }, [stateScope]);

  return (
    <aside className="docs-sidebar" ref={ref}>
      {children}
    </aside>
  );
}
