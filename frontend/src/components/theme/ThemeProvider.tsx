'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export interface ThemeColorOption {
  name: string;
  value: string;
  twClass: string;
}

export const THEME_COLOR_PRESETS: ThemeColorOption[] = [
  { name: 'Royal Blue', value: '#2563EB', twClass: 'bg-blue-600' },
  { name: 'Emerald Green', value: '#059669', twClass: 'bg-emerald-600' },
  { name: 'Violet Purple', value: '#7C3AED', twClass: 'bg-purple-600' },
  { name: 'Rose Pink', value: '#E11D48', twClass: 'bg-rose-600' },
  { name: 'Amber Gold', value: '#D97706', twClass: 'bg-amber-600' },
  { name: 'Indigo Night', value: '#4F46E5', twClass: 'bg-indigo-600' },
];

interface ThemeContextType {
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;
  themeColor: string;
  setThemeColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  darkMode: false,
  setDarkMode: () => {},
  toggleDarkMode: () => {},
  themeColor: '#2563EB',
  setThemeColor: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [darkMode, setDarkModeState] = useState<boolean>(false);
  const [themeColor, setThemeColorState] = useState<string>('#2563EB');
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Inisialisasi tema dari localStorage saat awal render di browser
  useEffect(() => {
    setIsMounted(true);
    try {
      const savedDark = localStorage.getItem('duitq_dark_mode');
      const savedColor = localStorage.getItem('duitq_theme_color');

      if (savedDark !== null) {
        const isDark = savedDark === 'true';
        setDarkModeState(isDark);
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }

      if (savedColor) {
        setThemeColorState(savedColor);
        document.documentElement.style.setProperty('--app-primary', savedColor);
      }
    } catch {
      // ignore storage access error
    }
  }, []);

  // Sinkronisasi preferensi dari akun pengguna jika tersedia
  useEffect(() => {
    if (!user?.preferences) return;

    if (user.preferences.darkMode !== undefined) {
      setDarkModeState(user.preferences.darkMode);
      if (user.preferences.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      try {
        localStorage.setItem('duitq_dark_mode', String(user.preferences.darkMode));
      } catch {}
    }

    if (user.preferences.themeColor) {
      setThemeColorState(user.preferences.themeColor);
      document.documentElement.style.setProperty('--app-primary', user.preferences.themeColor);
      try {
        localStorage.setItem('duitq_theme_color', user.preferences.themeColor);
      } catch {}
    }
  }, [user?.preferences?.darkMode, user?.preferences?.themeColor]);

  const setDarkMode = (dark: boolean) => {
    setDarkModeState(dark);
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('duitq_dark_mode', String(dark));
    } catch {}
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const setThemeColor = (color: string) => {
    setThemeColorState(color);
    document.documentElement.style.setProperty('--app-primary', color);
    try {
      localStorage.setItem('duitq_theme_color', color);
    } catch {}
  };

  return (
    <ThemeContext.Provider
      value={{
        darkMode,
        setDarkMode,
        toggleDarkMode,
        themeColor,
        setThemeColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
