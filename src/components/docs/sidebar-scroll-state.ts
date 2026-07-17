'use client';

const scrollState = new Map<string, number>();

export function readSidebarScroll(stateScope: string): number | undefined {
  return scrollState.get(stateScope);
}

export function writeSidebarScroll(stateScope: string, scrollTop: number): void {
  scrollState.set(stateScope, scrollTop);
}
