import { Personas } from '@/constants/personas';
import { Brand, Colors, FontSize, FontWeight, Radius, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/authStore';
import { router } from 'expo-router';
import { ArrowLeft, Check, ChevronRight, Settings, Sparkles } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function PreferencesScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const {
        onboardingData,
        setOnboardingPreferences,
        completeOnboarding,
        isLoading,
        firebaseUser,
    } = useAuthStore();

    const [displayName, setDisplayName] = useState('');
    const [preferences, setPreferences] = useState<string[]>([]);
    const [selectedPreferences, setSelectedPreferences] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (onboardingData.persona) {
            const personaInfo = Personas[onboardingData.persona];
            setPreferences(personaInfo.defaultPreferences);
            setSelectedPreferences(new Set(personaInfo.defaultPreferences));
        }
    }, [onboardingData.persona]);

    const togglePreference = (pref: string) => {
        const newSelected = new Set(selectedPreferences);
        if (newSelected.has(pref)) {
            newSelected.delete(pref);
        } else {
            newSelected.add(pref);
        }
        setSelectedPreferences(newSelected);
    };

    const handleComplete = async () => {
        if (!displayName.trim()) {
            Alert.alert('Error', 'Mohon isi nama tampilan Anda');
            return;
        }

        try {
            setOnboardingPreferences(Array.from(selectedPreferences));
            await completeOnboarding(displayName.trim());
            router.replace('/(tabs)');
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Gagal menyelesaikan pendaftaran');
        }
    };

    const handleBack = () => {
        router.back();
    };

    const personaInfo = onboardingData.persona ? Personas[onboardingData.persona] : null;

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.content}
        >
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: Brand.info + '20' }]}>
                    <Settings size={32} color={Brand.info} />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>Hampir Selesai!</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Atur preferensi Anda dan mulai gunakan CIVICA
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Nama Tampilan</Text>
                <TextInput
                    style={[
                        styles.nameInput,
                        {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                            color: colors.text,
                        }
                    ]}
                    placeholder="Nama yang akan ditampilkan"
                    placeholderTextColor={colors.textMuted}
                    value={displayName}
                    onChangeText={setDisplayName}
                    autoCapitalize="words"
                />
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Info yang Anda butuhkan
                    </Text>
                    <View style={styles.aiTag}>
                        <Sparkles size={12} color={Brand.accent} />
                        <Text style={[styles.aiTagText, { color: Brand.accent }]}>AI Generated</Text>
                    </View>
                </View>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                    Berdasarkan profil {personaInfo?.name || 'Anda'}
                </Text>

                <View style={styles.preferencesContainer}>
                    {preferences.map((pref) => {
                        const isSelected = selectedPreferences.has(pref);

                        return (
                            <TouchableOpacity
                                key={pref}
                                style={[
                                    styles.preferenceItem,
                                    {
                                        backgroundColor: colors.surface,
                                        borderColor: isSelected ? Brand.primary : colors.border,
                                    }
                                ]}
                                onPress={() => togglePreference(pref)}
                            >
                                <View style={[
                                    styles.checkbox,
                                    {
                                        borderColor: isSelected ? Brand.primary : colors.border,
                                        backgroundColor: isSelected ? Brand.primary : 'transparent',
                                    }
                                ]}>
                                    {isSelected && <Check size={12} color="#FFFFFF" />}
                                </View>
                                <Text style={[styles.preferenceText, { color: colors.text }]}>
                                    {pref}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.summaryTitle, { color: colors.text }]}>Ringkasan</Text>
                <View style={styles.summaryItem}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Lokasi:</Text>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>
                        {onboardingData.location?.district}, {onboardingData.location?.city}
                    </Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Tipe:</Text>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>
                        {personaInfo?.name}
                    </Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Minat:</Text>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>
                        {onboardingData.interests?.slice(0, 3).join(', ') || '-'}
                    </Text>
                </View>
            </View>

            <TouchableOpacity
                style={[
                    styles.completeButton,
                    (!displayName.trim() || isLoading) && styles.buttonDisabled
                ]}
                onPress={handleComplete}
                disabled={!displayName.trim() || isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <>
                        <Text style={styles.completeButtonText}>Mulai Menggunakan CIVICA</Text>
                        <ChevronRight size={20} color="#FFFFFF" />
                    </>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: Spacing.xl,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing['3xl'],
    },
    backButton: {
        padding: Spacing.xs,
        marginLeft: -Spacing.xs,
        marginBottom: Spacing.md,
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing['2xl'],
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: FontSize['2xl'],
        fontWeight: FontWeight.bold,
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: FontSize.md,
        textAlign: 'center',
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    sectionTitle: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        marginBottom: Spacing.sm,
    },
    sectionSubtitle: {
        fontSize: FontSize.sm,
        marginBottom: Spacing.md,
    },
    aiTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Brand.accent + '15',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: Radius.full,
        marginBottom: Spacing.sm,
    },
    aiTagText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
    },
    nameInput: {
        borderWidth: 1,
        borderRadius: Radius.lg,
        paddingHorizontal: Spacing.lg,
        height: 52,
        fontSize: FontSize.md,
        ...Shadows.sm,
    },
    preferencesContainer: {
        gap: Spacing.sm,
    },
    preferenceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        gap: Spacing.md,
        ...Shadows.sm,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderWidth: 2,
        borderRadius: Radius.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    preferenceText: {
        flex: 1,
        fontSize: FontSize.md,
    },
    summaryCard: {
        borderWidth: 1,
        borderRadius: Radius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.xl,
        ...Shadows.sm,
    },
    summaryTitle: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        marginBottom: Spacing.md,
    },
    summaryItem: {
        flexDirection: 'row',
        marginBottom: Spacing.sm,
    },
    summaryLabel: {
        fontSize: FontSize.sm,
        width: 60,
    },
    summaryValue: {
        flex: 1,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
    completeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Brand.primary,
        height: 52,
        borderRadius: Radius.lg,
        ...Shadows.md,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    completeButtonText: {
        color: '#FFFFFF',
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
    },
});
