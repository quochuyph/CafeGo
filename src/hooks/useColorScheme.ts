import { useThemePreference } from '@/theme/ThemePreferenceContext';

export function useColorScheme(): 'light' | 'dark' {
  return useThemePreference().colorScheme;
}
