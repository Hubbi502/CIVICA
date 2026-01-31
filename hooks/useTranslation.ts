import { translations } from '@/constants/translations';
import { useLanguageStore } from '@/stores/languageStore';

export function useTranslation() {
    const language = useLanguageStore((state) => state.language);

    const t = (key: string): string => {
        return translations[language][key] || key;
    };

    return { t, language };
}
