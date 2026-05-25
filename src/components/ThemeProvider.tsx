'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
type ThemePreference = Theme | 'system';

interface ThemeContextType {
  theme: Theme;
  themePreference: ThemePreference;
  toggleTheme: () => void;
  setThemePreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');

  const resolveTheme = (preference: ThemePreference): Theme => {
    if (preference === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return preference;
  };

  const applyTheme = (nextTheme: Theme, preference: ThemePreference) => {
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    document.documentElement.dataset.theme = preference;
    document.documentElement.style.colorScheme = nextTheme;
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const savedTheme = localStorage.getItem('theme');
    const initialPreference: ThemePreference = savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system'
      ? savedTheme
      : 'system';
    const initialTheme = resolveTheme(initialPreference);

    setThemePreferenceState(initialPreference);
    setTheme(initialTheme);
    applyTheme(initialTheme, initialPreference);

    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      if (themePreference !== 'system') return;
      const nextTheme = event.matches ? 'dark' : 'light';
      setTheme(nextTheme);
      applyTheme(nextTheme, 'system');
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [themePreference]);

  const setThemePreference = (preference: ThemePreference) => {
    const nextTheme = resolveTheme(preference);
    setThemePreferenceState(preference);
    setTheme(nextTheme);
    localStorage.setItem('theme', preference);
    applyTheme(nextTheme, preference);
  };

  const toggleTheme = () => {
    const newThemePreference: ThemePreference = theme === 'light' ? 'dark' : 'light';
    setThemePreference(newThemePreference);
  };

  return (
    <ThemeContext.Provider value={{ theme, themePreference, toggleTheme, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
