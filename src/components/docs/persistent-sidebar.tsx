'use client';

import { usePathname } from 'next/navigation';
import { type ReactNode, useCallback, useLayoutEffect, useRef } from 'react';

const scrollMemory = new Map<string, number>();

function readStoredScroll(storageKey: string): number | undefined {
  try {
    const stored = window.sessionStorage.getItem(storageKey);
    if (stored === null) return undefined;

    const scrollTop = Number(stored);
    return Number.isFinite(scrollTop) ? scrollTop : undefined;
  } catch {
    return undefined;
  }
}

function writeStoredScroll(storageKey: string, scrollTop: number) {
  try {
    window.sessionStorage.setItem(storageKey, String(scrollTop));
  } catch {
    // Storage can be unavailable in hardened browser modes; in-memory restore still works.
  }
}

export function PersistentSidebar({
  children,
  scrollKey,
}: {
  children: ReactNode;
  scrollKey: string;
}) {
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLElement>(null);
  const storageKey = `openim-docs:sidebar-scroll:${scrollKey}`;

  const saveScroll = useCallback(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const scrollTop = sidebar.scrollTop;
    scrollMemory.set(storageKey, scrollTop);
    writeStoredScroll(storageKey, scrollTop);
  }, [storageKey]);

  useLayoutEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const scrollTop = scrollMemory.get(storageKey) ?? readStoredScroll(storageKey);

    if (scrollTop !== undefined) {
      sidebar.scrollTop = scrollTop;
    }
  }, [pathname, storageKey]);

  return (
    <aside
      className="docs-sidebar"
      onClickCapture={saveScroll}
      onScroll={saveScroll}
      ref={sidebarRef}
    >
      {children}
    </aside>
  );
}
