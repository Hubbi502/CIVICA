import { Brand, Colors, FontSize, FontWeight, Radius, Shadows, Spacing } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';
import { updateUserPassword } from '@/services/auth';
import { useThemeStore } from '@/stores/themeStore';
import { router } from 'expo-router';
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react-native';
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
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SecurityScreen() {
    const { effectiveColorScheme } = useThemeStore();
    const { t } = useTranslation();
    const colorScheme = effectiveColorScheme ?? 'light';
    const colors = Colors[colorScheme];

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Visibility toggles
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleUpdatePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Mohon isi semua kolom password');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Password baru dan konfirmasi tidak cocok');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password baru harus minimal 6 karakter');
            return;
        }

        setIsLoading(true);
        try {
            await updateUserPassword(currentPassword, newPassword);
            Alert.alert('Sukses', 'Password berhasil diperbarui', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('Update password error:', error);
            if (error.code === 'auth/wrong-password') {
                Alert.alert('Error', 'Password saat ini salah');
            } else if (error.code === 'auth/too-many-requests') {
                Alert.alert('Error', 'Terlalu banyak percobaan gagal. Silakan coba lagi nanti.');
            } else {
                Alert.alert('Error', 'Gagal memperbarui password: ' + error.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const PasswordInput = ({
        label,
        value,
        onChangeText,
        showPassword,
        toggleShowPassword,
        placeholder
    }: any) => (
        <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Lock size={20} color={colors.textSecondary} />
                <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={!showPassword}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                />
                <TouchableOpacity onPress={toggleShowPassword}>
                    {showPassword ? (
                        <EyeOff size={20} color={colors.textSecondary} />
                    ) : (
                        <Eye size={20} color={colors.textSecondary} />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{t('security') || 'Keamanan'}</Text>
                <View style={styles.placeholder} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={[styles.description, { color: colors.textSecondary }]}>
                        Ubah password untuk menjaga keamanan akun Anda. Gunakan password yang kuat dan unik.
                    </Text>

                    <PasswordInput
                        label="Password Saat Ini"
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        showPassword={showCurrentPassword}
                        toggleShowPassword={() => setShowCurrentPassword(!showCurrentPassword)}
                        placeholder="Masukkan password saat ini"
                    />

                    <PasswordInput
                        label="Password Baru"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        showPassword={showNewPassword}
                        toggleShowPassword={() => setShowNewPassword(!showNewPassword)}
                        placeholder="Minimal 6 karakter"
                    />

                    <PasswordInput
                        label="Konfirmasi Password Baru"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        showPassword={showConfirmPassword}
                        toggleShowPassword={() => setShowConfirmPassword(!showConfirmPassword)}
                        placeholder="Ulangi password baru"
                    />

                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: Brand.primary, opacity: isLoading ? 0.7 : 1 }]}
                        onPress={handleUpdatePassword}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
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
    content: {
        padding: Spacing.lg,
    },
    description: {
        fontSize: FontSize.md,
        marginBottom: Spacing.xl,
        lineHeight: 22,
    },
    inputGroup: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        marginBottom: Spacing.sm,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: Radius.lg,
        paddingHorizontal: Spacing.md,
        height: 48,
        gap: Spacing.md,
    },
    input: {
        flex: 1,
        fontSize: FontSize.md,
        height: '100%',
    },
    saveButton: {
        height: 50,
        borderRadius: Radius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Spacing.lg,
        ...Shadows.sm,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
    },
});
