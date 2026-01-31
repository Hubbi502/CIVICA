import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName } from 'react-native';
import { create } from 'zustand';

const THEME_STORAGE_KEY = 'civica_theme_mode';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
    themeMode: ThemeMode;
    effectiveColorScheme: ColorSchemeName;
    isInitialized: boolean;

    initialize: () => Promise<void>;
    setThemeMode: (mode: ThemeMode) => Promise<void>;
    toggleDarkMode: () => Promise<void>;
}

const getEffectiveColorScheme = (mode: ThemeMode): ColorSchemeName => {
    if (mode === 'system') {
        return Appearance.getColorScheme() ?? 'light';
    }
    return mode;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
    themeMode: 'system',
    effectiveColorScheme: Appearance.getColorScheme() ?? 'light',
    isInitialized: false,

    initialize: async () => {
        try {
            const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
            if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
                const mode = savedTheme as ThemeMode;
                set({
                    themeMode: mode,
                    effectiveColorScheme: getEffectiveColorScheme(mode),
                    isInitialized: true,
                });
            } else {
                set({ isInitialized: true });
            }
        } catch (error) {
            console.error('Error loading theme:', error);
            set({ isInitialized: true });
        }

        // Listen for system theme changes
        Appearance.addChangeListener(({ colorScheme }) => {
            const { themeMode } = get();
            if (themeMode === 'system') {
                set({ effectiveColorScheme: colorScheme ?? 'light' });
            }
        });
    },

    setThemeMode: async (mode: ThemeMode) => {
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
            set({
                themeMode: mode,
                effectiveColorScheme: getEffectiveColorScheme(mode),
            });
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    },

    toggleDarkMode: async () => {
        const { effectiveColorScheme, setThemeMode } = get();
        const newMode = effectiveColorScheme === 'dark' ? 'light' : 'dark';
        await setThemeMode(newMode);
    },
}));
