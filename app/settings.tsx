import { Brand, Colors, FontSize, FontWeight, Radius, Shadows, Spacing } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';
import { Language, useLanguageStore } from '@/stores/languageStore';
import { useThemeStore } from '@/stores/themeStore';
import { router } from 'expo-router';
import {
    ArrowLeft,
    Bell,
    Check,
    ChevronRight,
    Globe,
    Info,
    Lock,
    Moon,
    Smartphone,
    User
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SettingsItemProps = {
    icon: React.ComponentType<any>;
    label: string;
    value?: string;
    onPress?: () => void;
    showToggle?: boolean;
    toggleValue?: boolean;
    onToggle?: (value: boolean) => void;
};

export default function SettingsScreen() {
    const { effectiveColorScheme, toggleDarkMode } = useThemeStore();
    const { language, setLanguage } = useLanguageStore();
    const { t } = useTranslation();
    const colorScheme = effectiveColorScheme ?? 'light';
    const colors = Colors[colorScheme];

    const [notifications, setNotifications] = useState(true);
    const darkMode = colorScheme === 'dark';
    const [locationServices, setLocationServices] = useState(true);
    const [languageModalVisible, setLanguageModalVisible] = useState(false);

    const handleDarkModeToggle = async () => {
        await toggleDarkMode();
    };

    const handleLanguageSelect = async (lang: Language) => {
        await setLanguage(lang);
        setLanguageModalVisible(false);
    };

    const getLanguageDisplayName = (lang: Language) => {
        return lang === 'id' ? t('indonesian') : t('english');
    };

    const SettingsItem = ({
        icon: Icon,
        label,
        value,
        onPress,
        showToggle,
        toggleValue,
        onToggle,
    }: SettingsItemProps) => (
        <TouchableOpacity
            style={[styles.settingsItem, { backgroundColor: colors.surface }]}
            onPress={onPress}
            disabled={showToggle}
        >
            <View style={styles.settingsItemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: Brand.primary + '15' }]}>
                    <Icon size={20} color={Brand.primary} />
                </View>
                <Text style={[styles.settingsItemText, { color: colors.text }]}>{label}</Text>
            </View>
            <View style={styles.settingsItemRight}>
                {value && (
                    <Text style={[styles.settingsValueText, { color: colors.textSecondary }]}>
                        {value}
                    </Text>
                )}
                {showToggle ? (
                    <Switch
                        value={toggleValue}
                        onValueChange={onToggle}
                        trackColor={{ false: colors.border, true: Brand.primary }}
                        thumbColor="#FFFFFF"
                    />
                ) : (
                    <ChevronRight size={20} color={colors.icon} />
                )}
            </View>
        </TouchableOpacity>
    );

    const SectionHeader = ({ title }: { title: string }) => (
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>{title}</Text>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings')}</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <SectionHeader title={t('account') || 'AKUN'} />
                <View style={styles.settingsGroup}>
                    <SettingsItem
                        icon={User}
                        label={t('editProfile') || 'Edit Profil'}
                        onPress={() => router.push('/edit-profile' as any)}
                    />
                    <SettingsItem
                        icon={Lock}
                        label={t('security') || 'Keamanan'}
                        onPress={() => router.push('/security' as any)}
                    />
                </View>

                <SectionHeader title={t('preferences') || 'PREFERENSI'} />
                <View style={styles.settingsGroup}>
                    <SettingsItem
                        icon={Bell}
                        label={t('notifications') || 'Notifikasi'}
                        showToggle
                        toggleValue={notifications}
                        onToggle={setNotifications}
                    />
                    <SettingsItem
                        icon={Moon}
                        label={t('darkMode') || 'Mode Gelap'}
                        showToggle
                        toggleValue={darkMode}
                        onToggle={handleDarkModeToggle}
                    />
                    <SettingsItem
                        icon={Globe}
                        label={t('language') || 'Bahasa'}
                        value={getLanguageDisplayName(language)}
                        onPress={() => setLanguageModalVisible(true)}
                    />
                    <SettingsItem
                        icon={Smartphone}
                        label={t('locationServices') || 'Layanan Lokasi'}
                        showToggle
                        toggleValue={locationServices}
                        onToggle={setLocationServices}
                    />
                </View>

                <SectionHeader title={t('support') || 'DUKUNGAN'} />
                <View style={styles.settingsGroup}>
                    <SettingsItem
                        icon={Info}
                        label={t('aboutCivica') || 'Tentang CIVICA'}
                        value="v1.0.0"
                        onPress={() => router.push('/about' as any)}
                    />
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.textMuted }]}>
                        CIVICA: Public Eyes
                    </Text>
                    <Text style={[styles.footerText, { color: colors.textMuted }]}>
                        © 2024 CIVICA Team
                    </Text>
                </View>
            </ScrollView>

            {/* Language Selection Modal */}
            <Modal
                visible={languageModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setLanguageModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setLanguageModalVisible(false)}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {t('selectLanguage')}
                        </Text>

                        <TouchableOpacity
                            style={[styles.languageOption, { borderColor: colors.border }]}
                            onPress={() => handleLanguageSelect('id')}
                        >
                            <Text style={[styles.languageOptionText, { color: colors.text }]}>
                                🇮🇩 Indonesia
                            </Text>
                            {language === 'id' && <Check size={20} color={Brand.primary} />}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.languageOption, { borderColor: colors.border }]}
                            onPress={() => handleLanguageSelect('en')}
                        >
                            <Text style={[styles.languageOptionText, { color: colors.text }]}>
                                🇺🇸 English
                            </Text>
                            {language === 'en' && <Check size={20} color={Brand.primary} />}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.cancelButton, { backgroundColor: colors.background }]}
                            onPress={() => setLanguageModalVisible(false)}
                        >
                            <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                                {t('cancel')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    backButton: {
        padding: Spacing.xs,
    },
    headerTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
    },
    placeholder: {
        width: 32,
    },
    sectionHeader: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
        letterSpacing: 0.5,
    },
    settingsGroup: {
        marginHorizontal: Spacing.lg,
        borderRadius: Radius.xl,
        overflow: 'hidden',
        ...Shadows.sm,
    },
    settingsItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    settingsItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: Radius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingsItemText: {
        fontSize: FontSize.md,
    },
    settingsItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    settingsValueText: {
        fontSize: FontSize.sm,
    },
    footer: {
        alignItems: 'center',
        marginVertical: Spacing.xl,
        gap: Spacing.xs,
    },
    footerText: {
        fontSize: FontSize.xs,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    modalContent: {
        width: '100%',
        maxWidth: 340,
        borderRadius: Radius.xl,
        padding: Spacing.lg,
        ...Shadows.lg,
    },
    modalTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
        textAlign: 'center',
        marginBottom: Spacing.lg,
    },
    languageOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderRadius: Radius.md,
        borderWidth: 1,
        marginBottom: Spacing.sm,
    },
    languageOptionText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
    },
    cancelButton: {
        padding: Spacing.md,
        borderRadius: Radius.md,
        alignItems: 'center',
        marginTop: Spacing.sm,
    },
    cancelButtonText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
    },
});
