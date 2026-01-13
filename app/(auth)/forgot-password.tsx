import { Brand, Colors, FontSize, FontWeight, Radius, Shadows, Spacing } from '@/constants/theme';
import { auth } from '@/FirebaseConfig';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { ArrowLeft, Mail, MapPin } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ForgotPasswordScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleResetPassword = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Mohon masukkan email Anda');
            return;
        }

        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, email.trim());
            Alert.alert(
                'Email Terkirim',
                'Silakan cek email Anda untuk instruksi reset password.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error: any) {
            let message = 'Terjadi kesalahan saat mengirim email reset.';
            if (error.code === 'auth/user-not-found') {
                message = 'Email tidak terdaftar.';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Format email tidak valid.';
            }
            Alert.alert('Error', message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>

                <View style={styles.header}>
                    <View style={[styles.logoContainer, { backgroundColor: Brand.primary }]}>
                        <MapPin size={40} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>
                        Lupa Password
                    </Text>
                    <Text style={[styles.description, { color: colors.textMuted }]}>
                        Masukkan email Anda untuk menerima instruksi reset password
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Mail size={20} color={colors.icon} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Masukkan email Anda"
                                placeholderTextColor={colors.textMuted}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.resetButton, isLoading && styles.buttonDisabled]}
                        onPress={handleResetPassword}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.resetButtonText}>Kirim Email Reset</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backToLoginButton}
                    >
                        <Text style={[styles.backToLoginText, { color: Brand.primary }]}>
                            Kembali ke Login
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing['3xl'],
    },
    backButton: {
        marginBottom: Spacing.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing['3xl'],
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: Radius.xl,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
        ...Shadows.lg,
    },
    title: {
        fontSize: FontSize['2xl'],
        fontWeight: FontWeight.bold,
        marginBottom: Spacing.sm,
    },
    description: {
        fontSize: FontSize.sm,
        textAlign: 'center',
        paddingHorizontal: Spacing.xl,
    },
    form: {
        gap: Spacing.lg,
    },
    inputGroup: {
        gap: Spacing.sm,
    },
    label: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: Radius.lg,
        paddingHorizontal: Spacing.md,
        height: 52,
        ...Shadows.sm,
    },
    inputIcon: {
        marginRight: Spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: FontSize.md,
    },
    resetButton: {
        backgroundColor: Brand.primary,
        height: 52,
        borderRadius: Radius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Spacing.md,
        ...Shadows.md,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    resetButtonText: {
        color: '#FFFFFF',
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
    },
    backToLoginButton: {
        alignItems: 'center',
        marginTop: Spacing.lg,
    },
    backToLoginText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
    },
});
