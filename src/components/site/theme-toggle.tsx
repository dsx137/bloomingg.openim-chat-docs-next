'use client';

import { MoonIcon, SunIcon } from '@/src/components/ui/icons';

export function ThemeToggle() {
  function toggleTheme() {
    const nextTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem('openim-docs-theme', nextTheme);
  }

  return (
    <button
      aria-label="Toggle color theme"
      className="icon-button theme-toggle"
      onClick={toggleTheme}
      type="button"
    >
      <span className="theme-icon theme-icon-moon">
        <MoonIcon />
      </span>
      <span className="theme-icon theme-icon-sun">
        <SunIcon />
      </span>
    </button>
  );
}
