import { GeneralSubCategories } from '@/constants/categories';
import { Brand, CategoryColors, Colors, FontSize, FontWeight, Radius, SeverityColors, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { classifyPost } from '@/services/openRouter';
import { createPost } from '@/services/posts';
import { uploadImages } from '@/services/storage';
import { useAuthStore } from '@/stores/authStore';
import { AIClassification, PostType } from '@/types';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import {
    AlertTriangle,
    Camera,
    CheckCircle,
    Edit2,
    Eye,
    EyeOff,
    ImageIcon,
    MapPin,
    MessageCircle,
    Newspaper,
    Sparkles,
    X
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TYPE_CONFIG: Record<PostType, { icon: React.ComponentType<any>; label: string; color: string }> = {
    GENERAL: { icon: MessageCircle, label: 'Umum', color: CategoryColors.general },
    NEWS: { icon: Newspaper, label: 'Berita', color: CategoryColors.news },
    REPORT: { icon: AlertTriangle, label: 'Laporan', color: CategoryColors.report },
};

export default function CreatePostScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { user } = useAuthStore();

    const [content, setContent] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showClassificationModal, setShowClassificationModal] = useState(false);
    const [classification, setClassification] = useState<AIClassification | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canSubmit = content.trim().length > 0 || images.length > 0;

    const pickImage = async (useCamera: boolean) => {
        if (images.length >= 5) {
            Alert.alert('Batas Tercapai', 'Maksimal 5 gambar per post');
            return;
        }

        const permissionResult = useCamera
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert('Izin Diperlukan', `Mohon izinkan akses ${useCamera ? 'kamera' : 'galeri'}`);
            return;
        }

        const result = useCamera
            ? await ImagePicker.launchCameraAsync({
                mediaTypes: 'images',
                quality: 0.8,
                allowsEditing: true,
            })
            : await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                quality: 0.8,
                allowsMultipleSelection: true,
                selectionLimit: 5 - images.length,
            });

        if (!result.canceled) {
            const newImages = result.assets.map(a => a.uri);
            setImages([...images, ...newImages].slice(0, 5));
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleAnalyze = async () => {
        if (!canSubmit) return;

        setIsAnalyzing(true);

        try {
            const result = await classifyPost(images, content);
            setClassification(result);
            setShowClassificationModal(true);
        } catch (error) {
            console.error('Classification error:', error);
            Alert.alert('Error', 'Gagal menganalisis konten. Silakan coba lagi.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSubmit = async () => {
        if (!classification || !user) return;

        setIsSubmitting(true);

        try {
            let mediaUrls: string[] = [];
            if (images.length > 0) {
                mediaUrls = await uploadImages(images, `posts/${user.id}`);
            }

            await createPost({
                authorId: user.id,
                authorName: user.displayName || 'User',
                authorAvatar: user.avatarUrl,
                isAnonymous,
                content: content.trim(),
                mediaUrls,
                location: {
                    address: '',
                    city: user.location?.city || 'Jakarta',
                    district: user.location?.district || '',
                    latitude: user.location?.latitude || 0,
                    longitude: user.location?.longitude || 0,
                },
                classification,
            });

            setShowClassificationModal(false);
            if (Platform.OS === 'web') {
                router.navigate('/(tabs)');
            } else {
                Alert.alert('Berhasil! 🎉', 'Post Anda telah dipublikasikan', [
                    { text: 'OK', onPress: () => router.navigate('/(tabs)') }
                ]);
            }
        } catch (error) {
            console.error('Create post error:', error);
            Alert.alert('Error', 'Gagal membuat post. Silakan coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderClassificationModal = () => {
        if (!classification) return null;

        const config = TYPE_CONFIG[classification.category];
        const TypeIcon = config.icon;

        return (
            <Modal
                visible={showClassificationModal}
                transparent
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderLeft}>
                                <Sparkles size={20} color={Brand.accent} />
                                <Text style={[styles.modalTitle, { color: colors.text }]}>
                                    Analisis AI
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowClassificationModal(false)}>
                                <X size={24} color={colors.icon} />
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.categoryCard, { backgroundColor: config.color + '10' }]}>
                            <TypeIcon size={32} color={config.color} />
                            <View style={styles.categoryInfo}>
                                <Text style={[styles.categoryLabel, { color: colors.textSecondary }]}>
                                    Kategori Terdeteksi
                                </Text>
                                <Text style={[styles.categoryValue, { color: config.color }]}>
                                    {config.label}
                                </Text>
                            </View>
                            <View style={[styles.confidenceBadge, { backgroundColor: config.color }]}>
                                <Text style={styles.confidenceText}>
                                    {Math.round(classification.confidence * 100)}%
                                </Text>
                            </View>
                        </View>

                        {classification.category === 'GENERAL' && classification.subCategory && (
                            <View style={styles.infoRow}>
                                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                                    Tagline:
                                </Text>
                                <View style={[
                                    styles.severityBadge,
                                    { backgroundColor: GeneralSubCategories[classification.subCategory].color + '15' }
                                ]}>
                                    <Text style={[
                                        styles.severityText,
                                        { color: GeneralSubCategories[classification.subCategory].color }
                                    ]}>
                                        {GeneralSubCategories[classification.subCategory].name}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {classification.severity && (
                            <View style={styles.infoRow}>
                                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                                    Tingkat Keparahan:
                                </Text>
                                <View style={[
                                    styles.severityBadge,
                                    { backgroundColor: SeverityColors[classification.severity] + '15' }
                                ]}>
                                    <Text style={[
                                        styles.severityText,
                                        { color: SeverityColors[classification.severity] }
                                    ]}>
                                        {classification.severity === 'low' ? 'Ringan' :
                                            classification.severity === 'medium' ? 'Sedang' :
                                                classification.severity === 'high' ? 'Tinggi' : 'Kritis'}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {classification.tags.length > 0 && (
                            <View style={styles.tagsSection}>
                                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                                    Tag Disarankan:
                                </Text>
                                <View style={styles.tagsContainer}>
                                    {classification.tags.map((tag) => (
                                        <View key={tag} style={[styles.tag, { backgroundColor: colors.surfaceSecondary }]}>
                                            <Text style={[styles.tagText, { color: colors.text }]}>
                                                #{tag}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.editButton, { borderColor: colors.border }]}
                                onPress={() => setShowClassificationModal(false)}
                            >
                                <Edit2 size={18} color={colors.text} />
                                <Text style={[styles.editButtonText, { color: colors.text }]}>
                                    Edit
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
                                onPress={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <>
                                        <CheckCircle size={18} color="#FFFFFF" />
                                        <Text style={styles.submitButtonText}>Konfirmasi & Post</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <X size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Buat Post</Text>
                <TouchableOpacity
                    style={[
                        styles.postButton,
                        !canSubmit && styles.postButtonDisabled,
                    ]}
                    onPress={handleAnalyze}
                    disabled={!canSubmit || isAnalyzing}
                >
                    {isAnalyzing ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <Text style={styles.postButtonText}>Post</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
                <View style={styles.userRow}>
                    <View style={[styles.avatar, { backgroundColor: Brand.primary }]}>
                        <Text style={styles.avatarText}>
                            {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={[styles.userName, { color: colors.text }]}>
                            {isAnonymous ? 'Anonymous' : user?.displayName || 'Anda'}
                        </Text>
                        <View style={styles.locationRow}>
                            <MapPin size={12} color={colors.textMuted} />
                            <Text style={[styles.locationText, { color: colors.textMuted }]}>
                                {user?.location?.district}, {user?.location?.city}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[styles.anonymousToggle, isAnonymous && { backgroundColor: Brand.primary }]}
                        onPress={() => setIsAnonymous(!isAnonymous)}
                    >
                        {isAnonymous ? (
                            <EyeOff size={16} color="#FFFFFF" />
                        ) : (
                            <Eye size={16} color={colors.icon} />
                        )}
                    </TouchableOpacity>
                </View>

                <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    placeholder="Apa yang ingin Anda bagikan?"
                    placeholderTextColor={colors.textMuted}
                    value={content}
                    onChangeText={setContent}
                    multiline
                    maxLength={500}
                    textAlignVertical="top"
                />

                <Text style={[styles.charCount, { color: colors.textMuted }]}>
                    {content.length}/500
                </Text>

                {images.length > 0 && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.imagesContainer}
                        contentContainerStyle={styles.imagesContent}
                    >
                        {images.map((uri, index) => (
                            <View key={index} style={styles.imageWrapper}>
                                <Image source={{ uri }} style={styles.imagePreview} />
                                <TouchableOpacity
                                    style={styles.removeImageButton}
                                    onPress={() => removeImage(index)}
                                >
                                    <X size={16} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                )}

                <View style={styles.mediaButtons}>
                    <TouchableOpacity
                        style={[styles.mediaButton, { backgroundColor: colors.surface }]}
                        onPress={() => pickImage(true)}
                    >
                        <Camera size={24} color={Brand.primary} />
                        <Text style={[styles.mediaButtonText, { color: colors.text }]}>
                            Kamera
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.mediaButton, { backgroundColor: colors.surface }]}
                        onPress={() => pickImage(false)}
                    >
                        <ImageIcon size={24} color={Brand.success} />
                        <Text style={[styles.mediaButtonText, { color: colors.text }]}>
                            Galeri
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.aiInfoCard, { backgroundColor: Brand.accent + '10' }]}>
                    <Sparkles size={20} color={Brand.accent} />
                    <Text style={[styles.aiInfoText, { color: colors.textSecondary }]}>
                        AI akan menganalisis konten Anda dan menyarankan kategori terbaik
                    </Text>
                </View>
            </ScrollView>

            {renderClassificationModal()}
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
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
    },
    postButton: {
        backgroundColor: Brand.primary,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: Radius.full,
        minWidth: 70,
        alignItems: 'center',
    },
    postButtonDisabled: {
        opacity: 0.5,
    },
    postButtonText: {
        color: '#FFFFFF',
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    content: {
        flex: 1,
        padding: Spacing.lg,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
    },
    userInfo: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    userName: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    locationText: {
        fontSize: FontSize.xs,
    },
    anonymousToggle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    textInput: {
        fontSize: FontSize.lg,
        minHeight: 120,
        lineHeight: 26,
    },
    charCount: {
        fontSize: FontSize.xs,
        textAlign: 'right',
        marginTop: Spacing.xs,
    },
    imagesContainer: {
        marginTop: Spacing.lg,
    },
    imagesContent: {
        gap: Spacing.sm,
    },
    imageWrapper: {
        position: 'relative',
    },
    imagePreview: {
        width: 120,
        height: 120,
        borderRadius: Radius.lg,
    },
    removeImageButton: {
        position: 'absolute',
        top: Spacing.xs,
        right: Spacing.xs,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mediaButtons: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginTop: Spacing.xl,
    },
    mediaButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        borderRadius: Radius.lg,
        ...Shadows.sm,
    },
    mediaButtonText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
    },
    aiInfoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: Radius.lg,
        marginTop: Spacing.xl,
    },
    aiInfoText: {
        flex: 1,
        fontSize: FontSize.sm,
        lineHeight: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: Radius['2xl'],
        borderTopRightRadius: Radius['2xl'],
        padding: Spacing.xl,
        paddingBottom: Spacing['3xl'],
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    modalHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    modalTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
    },
    categoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: Radius.xl,
        marginBottom: Spacing.lg,
    },
    categoryInfo: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    categoryLabel: {
        fontSize: FontSize.xs,
    },
    categoryValue: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
    },
    confidenceBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: Radius.full,
    },
    confidenceText: {
        color: '#FFFFFF',
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
        gap: Spacing.sm,
    },
    infoLabel: {
        fontSize: FontSize.sm,
    },
    severityBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: Radius.full,
    },
    severityText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
    tagsSection: {
        marginBottom: Spacing.lg,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginTop: Spacing.sm,
    },
    tag: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: Radius.full,
    },
    tagText: {
        fontSize: FontSize.sm,
    },
    modalActions: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginTop: Spacing.lg,
    },
    editButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        borderRadius: Radius.lg,
        borderWidth: 1,
    },
    editButtonText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
    },
    submitButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Brand.primary,
        paddingVertical: Spacing.md,
        borderRadius: Radius.lg,
        ...Shadows.md,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
});
