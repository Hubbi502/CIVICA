import { getAllPersonas } from '@/constants/personas';
import { Brand, Colors, FontSize, FontWeight, Radius, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/authStore';
import { PersonaType } from '@/types';
import { router } from 'expo-router';
import { ArrowLeft, Briefcase, Check, ChevronRight, GraduationCap, Home, Store } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const PERSONA_ICONS: Record<PersonaType, React.ComponentType<any>> = {
    merchant: Store,
    office_worker: Briefcase,
    resident: Home,
    student: GraduationCap,
};

export default function PersonaScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const { setOnboardingPersona } = useAuthStore();

    const [selectedPersona, setSelectedPersona] = useState<PersonaType | null>(null);

    const personas = getAllPersonas();

    const handleContinue = () => {
        if (!selectedPersona) return;

        setOnboardingPersona(selectedPersona);
        router.push('/(onboarding)/preferences' as any);
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.content}
        >
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Siapa Anda?</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Pilih yang paling menggambarkan Anda untuk pengalaman yang lebih personal
                </Text>
            </View>

            <View style={styles.cardsContainer}>
                {personas.map((persona) => {
                    const Icon = PERSONA_ICONS[persona.id];
                    const isSelected = selectedPersona === persona.id;

                    return (
                        <TouchableOpacity
                            key={persona.id}
                            style={[
                                styles.card,
                                {
                                    backgroundColor: colors.surface,
                                    borderColor: isSelected ? persona.color : colors.border,
                                    borderWidth: isSelected ? 2 : 1,
                                },
                            ]}
                            onPress={() => setSelectedPersona(persona.id)}
                        >
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconContainer, { backgroundColor: persona.color + '20' }]}>
                                    <Icon size={28} color={persona.color} />
                                </View>
                                {isSelected && (
                                    <View style={[styles.checkCircle, { backgroundColor: persona.color }]}>
                                        <Check size={14} color="#FFFFFF" />
                                    </View>
                                )}
                            </View>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>
                                {persona.name}
                            </Text>
                            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                                {persona.description}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <TouchableOpacity
                style={[
                    styles.continueButton,
                    !selectedPersona && styles.buttonDisabled
                ]}
                onPress={handleContinue}
                disabled={!selectedPersona}
            >
                <Text style={styles.continueButtonText}>Lanjutkan</Text>
                <ChevronRight size={20} color="#FFFFFF" />
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
    },
    backButton: {
        padding: Spacing.xs,
        marginLeft: -Spacing.xs,
        marginBottom: Spacing.md,
    },
    header: {
        marginBottom: Spacing['2xl'],
    },
    title: {
        fontSize: FontSize['2xl'],
        fontWeight: FontWeight.bold,
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: FontSize.md,
        lineHeight: 22,
    },
    cardsContainer: {
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    card: {
        borderRadius: Radius.xl,
        padding: Spacing.lg,
        ...Shadows.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.md,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: Radius.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
        marginBottom: Spacing.xs,
    },
    cardDescription: {
        fontSize: FontSize.sm,
        lineHeight: 20,
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Brand.primary,
        height: 52,
        borderRadius: Radius.lg,
        marginTop: Spacing.md,
        ...Shadows.md,
    },
    buttonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
    },
});
