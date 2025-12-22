'use client';

import { useLayoutEffect } from 'react';
import { useSettingsStore } from './settings-store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const darkMode = useSettingsStore((state) => state.appearance.darkMode);

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}
