'use client';

import { usePathname } from 'next/navigation';
import {
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
} from 'react';

const scrollMemory = new Map<string, number>();
const pendingNavigationScroll = new Map<string, number>();
const restoreDelays = [0, 50, 150, 350];

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
  const restoringRef = useRef(false);
  const restoreTimersRef = useRef<number[]>([]);
  const pendingClearTimerRef = useRef<number | undefined>(undefined);
  const storageKey = `openim-docs:sidebar-scroll:${scrollKey}`;

  const clearPendingTimer = useCallback(() => {
    if (pendingClearTimerRef.current === undefined) return;

    window.clearTimeout(pendingClearTimerRef.current);
    pendingClearTimerRef.current = undefined;
  }, []);

  const saveScroll = useCallback(
    (preserveForNavigation = false) => {
      if (restoringRef.current && !preserveForNavigation) return;

      const sidebar = sidebarRef.current;
      if (!sidebar) return;

      const scrollTop = sidebar.scrollTop;
      scrollMemory.set(storageKey, scrollTop);
      writeStoredScroll(storageKey, scrollTop);

      if (preserveForNavigation) {
        pendingNavigationScroll.set(storageKey, scrollTop);
        clearPendingTimer();
        pendingClearTimerRef.current = window.setTimeout(() => {
          pendingNavigationScroll.delete(storageKey);
          pendingClearTimerRef.current = undefined;
        }, 2000);
      }
    },
    [clearPendingTimer, storageKey],
  );

  const saveBeforeNavigation = useCallback(
    (event: MouseEvent<HTMLElement> | PointerEvent<HTMLElement>) => {
      if (!isNavigationClick(event.target)) return;

      saveScroll(true);
    },
    [saveScroll],
  );

  const saveBeforeKeyboardNavigation = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (!isNavigationClick(event.target)) return;

      saveScroll(true);
    },
    [saveScroll],
  );

  useLayoutEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const scrollTop =
      pendingNavigationScroll.get(storageKey) ??
      readStoredScroll(storageKey) ??
      scrollMemory.get(storageKey);

    if (scrollTop === undefined) return;

    clearPendingTimer();
    restoringRef.current = true;
    scrollMemory.set(storageKey, scrollTop);
    writeStoredScroll(storageKey, scrollTop);

    const restore = () => {
      sidebar.scrollTop = scrollTop;
    };

    restore();
    restoreTimersRef.current = restoreDelays.map((delay, index) =>
      window.setTimeout(() => {
        restore();

        if (index === restoreDelays.length - 1) {
          pendingNavigationScroll.delete(storageKey);
          restoringRef.current = false;
        }
      }, delay),
    );

    return () => {
      restoreTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      restoreTimersRef.current = [];
      restoringRef.current = false;
    };
  }, [clearPendingTimer, pathname, storageKey]);

  useLayoutEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return undefined;

    const saveCurrentScroll = () => saveScroll();
    const saveNavigationScroll = (event: Event) => {
      if (!isNavigationClick(event.target)) return;

      saveScroll(true);
    };
    const saveKeyboardNavigationScroll = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (!isNavigationClick(event.target)) return;

      saveScroll(true);
    };

    sidebar.addEventListener('scroll', saveCurrentScroll, { passive: true });
    sidebar.addEventListener('pointerdown', saveNavigationScroll, true);
    sidebar.addEventListener('mousedown', saveNavigationScroll, true);
    sidebar.addEventListener('click', saveNavigationScroll, true);
    sidebar.addEventListener('auxclick', saveNavigationScroll, true);
    sidebar.addEventListener('keydown', saveKeyboardNavigationScroll, true);

    return () => {
      sidebar.removeEventListener('scroll', saveCurrentScroll);
      sidebar.removeEventListener('pointerdown', saveNavigationScroll, true);
      sidebar.removeEventListener('mousedown', saveNavigationScroll, true);
      sidebar.removeEventListener('click', saveNavigationScroll, true);
      sidebar.removeEventListener('auxclick', saveNavigationScroll, true);
      sidebar.removeEventListener('keydown', saveKeyboardNavigationScroll, true);
      clearPendingTimer();
    };
  }, [clearPendingTimer, saveScroll]);

  return (
    <aside
      className="docs-sidebar"
      onClickCapture={saveBeforeNavigation}
      onKeyDownCapture={saveBeforeKeyboardNavigation}
      onPointerDownCapture={saveBeforeNavigation}
      onScroll={() => saveScroll()}
      ref={sidebarRef}
    >
      {children}
    </aside>
  );
}

function isNavigationClick(target: EventTarget | null) {
  if (target instanceof Element) return target.closest('a[href]') !== null;
  if (target instanceof Node) return target.parentElement?.closest('a[href]') !== null;
  return false;
}
