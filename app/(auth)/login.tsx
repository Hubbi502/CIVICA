import { Brand, Colors, FontSize, FontWeight, Radius, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/authStore';
import { router } from 'expo-router';
import { Eye, EyeOff, Lock, Mail, MapPin } from 'lucide-react-native';
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

export default function LoginScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const { signIn, isLoading, error, clearError } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Mohon isi email dan password');
            return;
        }

        try {
            await signIn(email.trim(), password);
        } catch (err: any) {
            Alert.alert('Login Gagal', err.message || 'Terjadi kesalahan');
        }
    };

    const handleForgotPassword = () => {
        router.push('./forgot-password');
    };

    const handleRegister = () => {
        router.push('/register');
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
                    <View style={[styles.logoContainer, { backgroundColor: Brand.primary }]}>
                        <MapPin size={40} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>CIVICA</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Public Eyes
                    </Text>
                    <Text style={[styles.description, { color: colors.textMuted }]}>
                        Bersama membangun kota yang lebih baik
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

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Password</Text>
                        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Lock size={20} color={colors.icon} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Masukkan password"
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

                    <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotButton}>
                        <Text style={[styles.forgotText, { color: Brand.primary }]}>
                            Lupa password?
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.loginButton, isLoading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.loginButtonText}>Masuk</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.registerContainer}>
                        <Text style={[styles.registerText, { color: colors.textSecondary }]}>
                            Belum punya akun?{' '}
                        </Text>
                        <TouchableOpacity onPress={handleRegister}>
                            <Text style={[styles.registerLink, { color: Brand.primary }]}>
                                Daftar sekarang
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
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing['3xl'],
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
        fontSize: FontSize['3xl'],
        fontWeight: FontWeight.bold,
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.medium,
        marginTop: Spacing.xs,
    },
    description: {
        fontSize: FontSize.sm,
        marginTop: Spacing.sm,
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
    forgotButton: {
        alignSelf: 'flex-end',
    },
    forgotText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
    loginButton: {
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
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: Spacing.xl,
    },
    registerText: {
        fontSize: FontSize.md,
    },
    registerLink: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
});
