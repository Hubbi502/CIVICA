import { Brand, Colors, FontSize, FontWeight, Radius, Shadows, Spacing } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';
import { uploadAvatar } from '@/services/storage';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { ArrowLeft, Camera, User } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
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

export default function EditProfileScreen() {
    const { effectiveColorScheme } = useThemeStore();
    const { t } = useTranslation();
    const { user, updateProfile } = useAuthStore();
    const colorScheme = effectiveColorScheme ?? 'light';
    const colors = Colors[colorScheme];

    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handlePickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled && result.assets[0].uri) {
                setSelectedImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', t('failedToPickImage'));
        }
    };

    const handleSave = async () => {
        if (!displayName.trim()) {
            Alert.alert('Error', 'Username tidak boleh kosong');
            return;
        }

        setIsLoading(true);
        try {
            let avatarUrl = user?.avatarUrl;

            // Upload new avatar if selected
            if (selectedImage) {
                avatarUrl = await uploadAvatar(selectedImage, user?.id || 'unknown');
            }

            // Update user profile
            await updateProfile({
                displayName: displayName.trim(),
                avatarUrl,
            });

            Alert.alert('Sukses', 'Profil berhasil diperbarui', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', t('failedToUpdateProfile'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{t('editProfile') || 'Edit Profil'}</Text>
                <View style={styles.placeholder} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatar, { backgroundColor: Brand.primary }]}>
                            {selectedImage ? (
                                <Image source={{ uri: selectedImage }} style={styles.avatarImage} />
                            ) : user?.avatarUrl ? (
                                <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
                            ) : (
                                <Text style={styles.avatarText}>
                                    {user?.displayName?.charAt(0).toUpperCase() || "U"}
                                </Text>
                            )}

                            <TouchableOpacity
                                style={[styles.editAvatarButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                onPress={handlePickImage}
                            >
                                <Camera size={20} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Username</Text>
                        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <User size={20} color={colors.textSecondary} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                value={displayName}
                                onChangeText={setDisplayName}
                                placeholder="Masukkan username"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                        <Text style={[styles.hint, { color: colors.textSecondary }]}>
                            Username ini akan terlihat oleh pengguna lain.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: Brand.primary, opacity: isLoading ? 0.7 : 1 }]}
                        onPress={handleSave}
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
    avatarContainer: {
        alignItems: 'center',
        marginVertical: Spacing.xl,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: "center",
        alignItems: "center",
    },
    avatarImage: {
        width: "100%",
        height: "100%",
        borderRadius: 50,
    },
    avatarText: {
        fontSize: 36,
        fontWeight: FontWeight.bold,
        color: "#FFFFFF",
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        ...Shadows.sm,
    },
    formGroup: {
        marginBottom: Spacing.xl,
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
        height: 50,
        gap: Spacing.md,
    },
    input: {
        flex: 1,
        fontSize: FontSize.md,
        height: '100%',
    },
    hint: {
        fontSize: FontSize.xs,
        marginTop: Spacing.xs,
        marginLeft: Spacing.xs,
    },
    saveButton: {
        height: 50,
        borderRadius: Radius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.sm,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
    },
});
