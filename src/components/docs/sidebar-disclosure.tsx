'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  readSidebarOpen,
  writeSidebarOpen,
} from '@/src/components/docs/sidebar-open-state';

export function SidebarDisclosure({
  children,
  className,
  initiallyOpen,
  stateKey,
}: {
  children: ReactNode;
  className?: string;
  initiallyOpen: boolean;
  stateKey: string;
}) {
  const [open, setOpen] = useState(() => readSidebarOpen(stateKey, initiallyOpen));

  useEffect(() => {
    if (!initiallyOpen) return;
    // Route changes must reveal the newly active branch while preserving other saved toggles.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(true);
    writeSidebarOpen(stateKey, true);
  }, [initiallyOpen, stateKey]);

  return (
    <details
      className={className}
      onToggle={(event) => {
        const nextOpen = event.currentTarget.open;
        setOpen(nextOpen);
        writeSidebarOpen(stateKey, nextOpen);
      }}
      open={open}
    >
      {children}
    </details>
  );
}
