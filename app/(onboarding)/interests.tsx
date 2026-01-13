import { Brand, Colors, FontSize, FontWeight, Radius, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { parseInterests } from '@/services/openRouter';
import { useAuthStore } from '@/stores/authStore';
import { router } from 'expo-router';
import { ArrowLeft, ChevronRight, Heart, Sparkles, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function InterestsScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const { setOnboardingInterests } = useAuthStore();

    const [inputText, setInputText] = useState('');
    const [interests, setInterests] = useState<string[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleAnalyze = async () => {
        if (!inputText.trim()) return;

        setIsAnalyzing(true);

        try {
            const result = await parseInterests(inputText);
            const combinedInterests = [...new Set([...result.interests, ...result.suggestedTags])];
            setInterests(combinedInterests.slice(0, 8));
        } catch (error) {
            const words = inputText
                .toLowerCase()
                .split(/[\s,]+/)
                .filter(w => w.length > 2)
                .slice(0, 5);
            setInterests(words);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const removeInterest = (interest: string) => {
        setInterests(interests.filter(i => i !== interest));
    };

    const handleContinue = () => {
        setOnboardingInterests(interests);
        router.push('/(onboarding)/persona' as any);
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
                <View style={[styles.iconContainer, { backgroundColor: Brand.error + '20' }]}>
                    <Heart size={32} color={Brand.error} />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>Apa yang Anda minati?</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Ceritakan minat Anda dengan bebas, AI kami akan membantu mengekstrak kata kunci
                </Text>
            </View>

            <View style={styles.inputSection}>
                <TextInput
                    style={[
                        styles.textInput,
                        {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                            color: colors.text,
                        }
                    ]}
                    placeholder="Contoh: Saya suka makan enak, ngopi santai, dan info tentang event lokal..."
                    placeholderTextColor={colors.textMuted}
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    maxLength={200}
                    textAlignVertical="top"
                />
                <Text style={[styles.charCount, { color: colors.textMuted }]}>
                    {inputText.length}/200
                </Text>
            </View>

            <TouchableOpacity
                style={[
                    styles.analyzeButton,
                    { backgroundColor: Brand.accent },
                    !inputText.trim() && styles.buttonDisabled
                ]}
                onPress={handleAnalyze}
                disabled={!inputText.trim() || isAnalyzing}
            >
                {isAnalyzing ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <>
                        <Sparkles size={20} color="#FFFFFF" />
                        <Text style={styles.analyzeButtonText}>Analisis dengan AI</Text>
                    </>
                )}
            </TouchableOpacity>

            {interests.length > 0 && (
                <View style={styles.tagsSection}>
                    <Text style={[styles.tagsLabel, { color: colors.text }]}>
                        Minat terdeteksi:
                    </Text>
                    <View style={styles.tagsContainer}>
                        {interests.map((interest) => (
                            <View
                                key={interest}
                                style={[styles.tag, { backgroundColor: Brand.primary + '15' }]}
                            >
                                <Text style={[styles.tagText, { color: Brand.primary }]}>
                                    {interest}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => removeInterest(interest)}
                                    style={styles.tagRemove}
                                >
                                    <X size={14} color={Brand.primary} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            <TouchableOpacity
                style={[
                    styles.continueButton,
                    interests.length === 0 && styles.buttonDisabled
                ]}
                onPress={handleContinue}
                disabled={interests.length === 0}
            >
                <Text style={styles.continueButtonText}>Lanjutkan</Text>
                <ChevronRight size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.skipButton}
                onPress={() => {
                    setOnboardingInterests([]);
                    router.push('/(onboarding)/persona' as any);
                }}
            >
                <Text style={[styles.skipText, { color: colors.textMuted }]}>
                    Lewati untuk sekarang
                </Text>
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
        lineHeight: 22,
    },
    inputSection: {
        marginBottom: Spacing.lg,
    },
    textInput: {
        borderWidth: 1,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        fontSize: FontSize.md,
        minHeight: 120,
        ...Shadows.sm,
    },
    charCount: {
        fontSize: FontSize.xs,
        textAlign: 'right',
        marginTop: Spacing.xs,
    },
    analyzeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        height: 48,
        borderRadius: Radius.lg,
        marginBottom: Spacing.xl,
        ...Shadows.md,
    },
    analyzeButtonText: {
        color: '#FFFFFF',
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    tagsSection: {
        marginBottom: Spacing.xl,
    },
    tagsLabel: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        marginBottom: Spacing.md,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: Radius.full,
        gap: Spacing.xs,
    },
    tagText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
    tagRemove: {
        padding: 2,
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Brand.primary,
        height: 52,
        borderRadius: Radius.lg,
        ...Shadows.md,
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
    },
    skipButton: {
        alignItems: 'center',
        marginTop: Spacing.lg,
        padding: Spacing.md,
    },
    skipText: {
        fontSize: FontSize.sm,
    },
});
