import { Brand, Colors, FontSize, FontWeight, Radius, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/authStore';
import { router } from 'expo-router';
import { ArrowLeft, Check, Eye, EyeOff, Lock, Mail, User } from 'lucide-react-native';
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

export default function RegisterScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const { signUp, isLoading } = useAuthStore();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);

    const handleRegister = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Mohon isi nama lengkap');
            return;
        }
        if (!email.trim()) {
            Alert.alert('Error', 'Mohon isi email');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Error', 'Password minimal 6 karakter');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Konfirmasi password tidak cocok');
            return;
        }
        if (!agreeTerms) {
            Alert.alert('Error', 'Anda harus menyetujui syarat dan ketentuan');
            return;
        }

        try {
            await signUp(email.trim(), password);
            router.replace('/(onboarding)/location');
        } catch (err: any) {
            Alert.alert('Registrasi Gagal', err.message || 'Terjadi kesalahan');
        }
    };

    const handleBack = () => {
        router.back();
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
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <ArrowLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.text }]}>Buat Akun</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Bergabung dengan komunitas CIVICA
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Nama Lengkap</Text>
                        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <User size={20} color={colors.icon} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Masukkan nama lengkap"
                                placeholderTextColor={colors.textMuted}
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Mail size={20} color={colors.icon} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Masukkan email"
                                placeholderTextColor={colors.textMuted}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Password</Text>
                        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Lock size={20} color={colors.icon} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Minimal 6 karakter"
                                placeholderTextColor={colors.textMuted}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeButton}
                            >
                                {showPassword ? (
                                    <EyeOff size={20} color={colors.icon} />
                                ) : (
                                    <Eye size={20} color={colors.icon} />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Konfirmasi Password</Text>
                        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Lock size={20} color={colors.icon} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Ulangi password"
                                placeholderTextColor={colors.textMuted}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.termsContainer}
                        onPress={() => setAgreeTerms(!agreeTerms)}
                    >
                        <View style={[
                            styles.checkbox,
                            { borderColor: agreeTerms ? Brand.primary : colors.border },
                            agreeTerms && { backgroundColor: Brand.primary }
                        ]}>
                            {agreeTerms && <Check size={14} color="#FFFFFF" />}
                        </View>
                        <Text style={[styles.termsText, { color: colors.textSecondary }]}>
                            Saya menyetujui{' '}
                            <Text style={{ color: Brand.primary }}>Syarat dan Ketentuan</Text>
                            {' '}serta{' '}
                            <Text style={{ color: Brand.primary }}>Kebijakan Privasi</Text>
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.registerButton, isLoading && styles.buttonDisabled]}
                        onPress={handleRegister}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.registerButtonText}>Daftar</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.loginContainer}>
                        <Text style={[styles.loginText, { color: colors.textSecondary }]}>
                            Sudah punya akun?{' '}
                        </Text>
                        <TouchableOpacity onPress={handleBack}>
                            <Text style={[styles.loginLink, { color: Brand.primary }]}>
                                Masuk
                            </Text>
                        </TouchableOpacity>
                    </View>
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
        paddingVertical: Spacing['2xl'],
    },
    header: {
        marginBottom: Spacing['2xl'],
    },
    backButton: {
        marginBottom: Spacing.lg,
        padding: Spacing.xs,
        marginLeft: -Spacing.xs,
    },
    title: {
        fontSize: FontSize['2xl'],
        fontWeight: FontWeight.bold,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: FontSize.md,
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
    eyeButton: {
        padding: Spacing.sm,
    },
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        marginTop: Spacing.sm,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderWidth: 2,
        borderRadius: Radius.sm,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    termsText: {
        flex: 1,
        fontSize: FontSize.sm,
        lineHeight: 20,
    },
    registerButton: {
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
    registerButtonText: {
        color: '#FFFFFF',
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: Spacing.lg,
    },
    loginText: {
        fontSize: FontSize.md,
    },
    loginLink: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
});
