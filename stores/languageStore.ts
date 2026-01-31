import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const LANGUAGE_STORAGE_KEY = 'civica_language';

export type Language = 'id' | 'en';

interface LanguageState {
    language: Language;
    isInitialized: boolean;

    initialize: () => Promise<void>;
    setLanguage: (lang: Language) => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
    language: 'id',
    isInitialized: false,

    initialize: async () => {
        try {
            const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (savedLanguage && (savedLanguage === 'id' || savedLanguage === 'en')) {
                set({
                    language: savedLanguage as Language,
                    isInitialized: true,
                });
            } else {
                set({ isInitialized: true });
            }
        } catch (error) {
            console.error('Error loading language:', error);
            set({ isInitialized: true });
        }
    },

    setLanguage: async (lang: Language) => {
        try {
            await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
            set({ language: lang });
        } catch (error) {
            console.error('Error saving language:', error);
        }
    },
}));
