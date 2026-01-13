import { Brand, Colors, FontSize, FontWeight, Radius, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import {
    ArrowLeft,
    Bell,
    ChevronRight,
    Globe,
    HelpCircle,
    Info,
    Lock,
    Moon,
    Shield,
    Smartphone,
    User,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
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
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(colorScheme === 'dark');
    const [locationServices, setLocationServices] = useState(true);

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
                <Text style={[styles.headerTitle, { color: colors.text }]}>Pengaturan</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <SectionHeader title="AKUN" />
                <View style={styles.settingsGroup}>
                    <SettingsItem
                        icon={User}
                        label="Edit Profil"
                        onPress={() => { }}
                    />
                    <SettingsItem
                        icon={Lock}
                        label="Keamanan"
                        onPress={() => { }}
                    />
                    <SettingsItem
                        icon={Shield}
                        label="Privasi"
                        onPress={() => { }}
                    />
                </View>

                <SectionHeader title="PREFERENSI" />
                <View style={styles.settingsGroup}>
                    <SettingsItem
                        icon={Bell}
                        label="Notifikasi"
                        showToggle
                        toggleValue={notifications}
                        onToggle={setNotifications}
                    />
                    <SettingsItem
                        icon={Moon}
                        label="Mode Gelap"
                        showToggle
                        toggleValue={darkMode}
                        onToggle={setDarkMode}
                    />
                    <SettingsItem
                        icon={Globe}
                        label="Bahasa"
                        value="Indonesia"
                        onPress={() => { }}
                    />
                    <SettingsItem
                        icon={Smartphone}
                        label="Layanan Lokasi"
                        showToggle
                        toggleValue={locationServices}
                        onToggle={setLocationServices}
                    />
                </View>

                <SectionHeader title="DUKUNGAN" />
                <View style={styles.settingsGroup}>
                    <SettingsItem
                        icon={HelpCircle}
                        label="Pusat Bantuan"
                        onPress={() => { }}
                    />
                    <SettingsItem
                        icon={Info}
                        label="Tentang CIVICA"
                        value="v1.0.0"
                        onPress={() => { }}
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
});
