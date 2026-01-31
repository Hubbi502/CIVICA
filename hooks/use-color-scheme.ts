import { useThemeStore } from '@/stores/themeStore';

export function useColorScheme() {
    const { effectiveColorScheme } = useThemeStore();
    return effectiveColorScheme;
}
