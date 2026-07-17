'use client';

const openState = new Map<string, boolean>();

export function readSidebarOpen(stateKey: string, fallback: boolean): boolean {
  if (openState.has(stateKey)) return openState.get(stateKey)!;
  return fallback;
}

export function writeSidebarOpen(stateKey: string, open: boolean): void {
  openState.set(stateKey, open);
}
