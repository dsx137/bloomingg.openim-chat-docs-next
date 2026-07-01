'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckIcon, ChevronDownIcon, CodeIcon, CopyIcon } from '@/src/components/ui/icons';
import { writeClipboardText } from '@/src/lib/clipboard';
import type { Locale } from '@/src/lib/i18n';
import { t } from '@/src/lib/i18n';

type CopyState = 'idle' | 'link' | 'markdown' | 'error';

export function CopyPageLink({
  locale = 'en',
  supportsMarkdown = true,
}: {
  locale?: Locale;
  supportsMarkdown?: boolean;
}) {
  const text = t(locale);
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (!open) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  async function copyLink() {
    await writeClipboardText(window.location.href);
    markCopied('link');
  }

  async function copyMarkdown() {
    const params = new URLSearchParams({
      locale,
      path: window.location.pathname,
    });
    const response = await fetch(`/api/markdown?${params.toString()}`);
    if (!response.ok) throw new Error(`Failed to load Markdown: ${response.status}`);
    await writeClipboardText(await response.text());
    markCopied('markdown');
  }

  async function runCopy(action: () => Promise<void>) {
    try {
      await action();
      setOpen(false);
    } catch {
      setCopyState('error');
      window.setTimeout(() => setCopyState('idle'), 1800);
    }
  }

  function markCopied(state: Exclude<CopyState, 'idle' | 'error'>) {
    setCopyState(state);
    window.setTimeout(() => setCopyState('idle'), 1600);
  }

  function summaryLabel() {
    if (copyState === 'link') return text.article.copiedLink;
    if (copyState === 'markdown') return text.article.copiedMarkdown;
    if (copyState === 'error') return text.article.copyFailed;
    return text.article.copy;
  }

  const triggerContent = (
    <>
      {copyState === 'idle' || copyState === 'error' ? <CopyIcon /> : <CheckIcon />}
      {summaryLabel()}
      {supportsMarkdown ? <ChevronDownIcon /> : null}
    </>
  );

  if (!supportsMarkdown) {
    return (
      <button className="copy-page-link" onClick={() => void runCopy(copyLink)} type="button">
        {triggerContent}
      </button>
    );
  }

  return (
    <details
      className="copy-page-menu"
      onToggle={(event) => setOpen(event.currentTarget.open)}
      open={open}
      ref={menuRef}
    >
      <summary className="copy-page-link">{triggerContent}</summary>
      <div className="copy-page-menu-panel">
        <button onClick={() => void runCopy(copyLink)} type="button">
          <CopyIcon />
          <span>
            <strong>{text.article.copyLink}</strong>
            <small>{text.article.copyLinkHint}</small>
          </span>
        </button>
        <button onClick={() => void runCopy(copyMarkdown)} type="button">
          <CodeIcon />
          <span>
            <strong>{text.article.copyMarkdown}</strong>
            <small>{text.article.copyMarkdownHint}</small>
          </span>
        </button>
      </div>
    </details>
  );
}
