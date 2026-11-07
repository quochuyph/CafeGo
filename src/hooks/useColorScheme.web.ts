import { useSyncExternalStore } from 'react';
import { useThemePreference } from '@/theme/ThemePreferenceContext';

const emptySubscribe = () => () => {};

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme(): 'light' | 'dark' {
  const hasHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const { colorScheme } = useThemePreference();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
