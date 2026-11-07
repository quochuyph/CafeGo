import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, Platform, useColorScheme as useSystemColorScheme } from 'react-native';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedColorScheme = 'light' | 'dark';

const STORAGE_KEY = '@cafego/theme_preference';

type ThemePreferenceContextValue = {
  themePreference: ThemePreference;
  colorScheme: ResolvedColorScheme;
  isDark: boolean;
  setThemePreference: (preference: ThemePreference) => Promise<void>;
  toggleTheme: () => Promise<void>;
};

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(null);

export function ThemePreferenceProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    const loadPreference = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setThemePreferenceState(stored);
          if (Platform.OS !== 'web' && typeof Appearance.setColorScheme === 'function') {
            Appearance.setColorScheme(stored === 'system' ? 'unspecified' : stored);
          }
        }
      } catch {
        // Ignore storage read errors and keep system default.
      }
    };
    loadPreference();
  }, []);

  const colorScheme: ResolvedColorScheme = useMemo(() => {
    if (themePreference === 'light' || themePreference === 'dark') {
      return themePreference;
    }
    return systemScheme === 'dark' ? 'dark' : 'light';
  }, [themePreference, systemScheme]);

  const setThemePreference = useCallback(async (preference: ThemePreference) => {
    setThemePreferenceState(preference);
    try {
      if (Platform.OS !== 'web' && typeof Appearance.setColorScheme === 'function') {
        Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
      }
      await AsyncStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // Ignore storage write errors.
    }
  }, []);

  const toggleTheme = useCallback(async () => {
    const next: ThemePreference = colorScheme === 'dark' ? 'light' : 'dark';
    await setThemePreference(next);
  }, [colorScheme, setThemePreference]);

  const value = useMemo<ThemePreferenceContextValue>(
    () => ({
      themePreference,
      colorScheme,
      isDark: colorScheme === 'dark',
      setThemePreference,
      toggleTheme,
    }),
    [themePreference, colorScheme, setThemePreference, toggleTheme],
  );

  return (
    <ThemePreferenceContext.Provider value={value}>
      {children}
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference(): ThemePreferenceContextValue {
  const ctx = useContext(ThemePreferenceContext);
  const systemScheme = useSystemColorScheme();
  if (!ctx) {
    const fallbackScheme: ResolvedColorScheme = systemScheme === 'dark' ? 'dark' : 'light';
    return {
      themePreference: 'system',
      colorScheme: fallbackScheme,
      isDark: fallbackScheme === 'dark',
      setThemePreference: async () => {},
      toggleTheme: async () => {},
    };
  }
  return ctx;
}
