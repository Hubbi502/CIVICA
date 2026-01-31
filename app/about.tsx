import { Brand, Colors, FontSize, FontWeight, Radius, Shadows, Spacing } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';
import { useThemeStore } from '@/stores/themeStore';
import { router } from 'expo-router';
import {
    ArrowLeft,
    Award,
    Heart,
    Megaphone,
    Shield,
    Users
} from 'lucide-react-native';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AboutScreen() {
    const { effectiveColorScheme } = useThemeStore();
    const { t } = useTranslation();
    const colorScheme = effectiveColorScheme ?? 'light';
    const colors = Colors[colorScheme];

    const FeatureItem = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
        <View style={[styles.featureItem, { backgroundColor: colors.surface }]}>
            <View style={[styles.featureIconContainer, { backgroundColor: Brand.primary + '15' }]}>
                <Icon size={24} color={Brand.primary} />
            </View>
            <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>{description}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{t('aboutCivica')}</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.logoSection}>
                    <View style={[styles.logoContainer, { backgroundColor: Brand.primary }]}>
                        <Shield size={48} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.appName, { color: colors.text }]}>CIVICA</Text>
                    <Text style={[styles.version, { color: colors.textSecondary }]}>{t('version')} 1.0.0</Text>
                </View>

                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.description, { color: colors.text }]}>
                        {t('aboutDescription')}
                    </Text>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('features')}</Text>

                <View style={styles.featuresContainer}>
                    <FeatureItem
                        icon={Megaphone}
                        title={t('featureReportTitle')}
                        description={t('featureReportDesc')}
                    />
                    <FeatureItem
                        icon={Users}
                        title={t('featureComTitle')}
                        description={t('featureComDesc')}
                    />
                    <FeatureItem
                        icon={Award}
                        title={t('featureGamTitle')}
                        description={t('featureGamDesc')}
                    />
                </View>

                <View style={[styles.missionSection, { backgroundColor: Brand.primary + '10' }]}>
                    <Heart size={32} color={Brand.primary} style={styles.missionIcon} />
                    <Text style={[styles.missionTitle, { color: Brand.primary }]}>{t('ourMission')}</Text>
                    <Text style={[styles.missionText, { color: colors.text }]}>
                        "{t('missionText')}"
                    </Text>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.textMuted }]}>
                        {t('copyright')}
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
    scrollContent: {
        paddingBottom: Spacing['2xl'],
    },
    logoSection: {
        alignItems: 'center',
        marginVertical: Spacing.xl,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
        ...Shadows.md,
    },
    appName: {
        fontSize: 32,
        fontWeight: FontWeight.bold,
        marginBottom: Spacing.xs,
    },
    version: {
        fontSize: FontSize.md,
    },
    card: {
        marginHorizontal: Spacing.lg,
        padding: Spacing.xl,
        borderRadius: Radius.xl,
        marginBottom: Spacing.xl,
        ...Shadows.sm,
    },
    description: {
        fontSize: FontSize.md,
        lineHeight: 24,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    featuresContainer: {
        marginHorizontal: Spacing.lg,
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    featureItem: {
        flexDirection: 'row',
        padding: Spacing.lg,
        borderRadius: Radius.xl,
        alignItems: 'center',
        gap: Spacing.md,
        ...Shadows.sm,
    },
    featureIconContainer: {
        width: 48,
        height: 48,
        borderRadius: Radius.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        marginBottom: 2,
    },
    featureDescription: {
        fontSize: FontSize.sm,
        lineHeight: 20,
    },
    missionSection: {
        marginHorizontal: Spacing.lg,
        padding: Spacing.xl,
        borderRadius: Radius.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Brand.primary + '30',
        marginBottom: Spacing.xl,
    },
    missionIcon: {
        marginBottom: Spacing.md,
    },
    missionTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        marginBottom: Spacing.sm,
    },
    missionText: {
        fontSize: FontSize.md,
        textAlign: 'center',
        fontStyle: 'italic',
        lineHeight: 24,
    },
    footer: {
        alignItems: 'center',
        marginTop: Spacing.md,
    },
    footerText: {
        fontSize: FontSize.sm,
    },
});
