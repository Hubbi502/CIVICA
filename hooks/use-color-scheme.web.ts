import { useThemeStore } from '@/stores/themeStore';
import { useEffect, useState } from 'react';

export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const { effectiveColorScheme } = useThemeStore();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  if (hasHydrated) {
    return effectiveColorScheme;
  }

  return 'light';
}
