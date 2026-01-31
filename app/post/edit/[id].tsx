import { db } from '@/FirebaseConfig';
import { Brand, CategoryColors, Colors, FontSize, FontWeight, Radius, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { classifyPost } from '@/services/openRouter';
import { updatePost } from '@/services/posts';
import { uploadImages } from '@/services/storage';
import { useAuthStore } from '@/stores/authStore';
import { AIClassification, PostType } from '@/types';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import {
    AlertTriangle,
    ArrowLeft,
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
import React, { useEffect, useState } from 'react';
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

export default function EditPostScreen() {
    const { id } = useLocalSearchParams();
    const postId = Array.isArray(id) ? id[0] : id;
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { user } = useAuthStore();

    const [isLoading, setIsLoading] = useState(true);
    const [content, setContent] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showClassificationModal, setShowClassificationModal] = useState(false);
    const [classification, setClassification] = useState<AIClassification | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canSubmit = content.trim().length > 0 || images.length > 0;

    useEffect(() => {
        const fetchPost = async () => {
            if (!postId) return;
            try {
                const docRef = doc(db, 'posts', postId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setContent(data.content);
                    // Extract URLs from media array objects
                    const mediaUrls = (data.media || []).map((m: any) => m.url);
                    setImages(mediaUrls);
                    setIsAnonymous(data.isAnonymous);
                    setClassification(data.classification);
                } else {
                    Alert.alert('Error', 'Post tidak ditemukan', [
                        { text: 'OK', onPress: () => router.back() }
                    ]);
                }
            } catch (error) {
                console.error('Error fetching post:', error);
                Alert.alert('Error', 'Gagal memuat data post');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPost();
    }, [postId]);

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
            // For analysis, we send all images (both new local URIs and existing remote URLs)
            // The AI service should handle both or we might need to be careful if it expects only one type
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
        if (!classification || !user || !postId) return;

        setIsSubmitting(true);

        try {
            // Separate existing URLs from new local URIs
            const existingUrls = images.filter(img => img.startsWith('http'));
            const newImages = images.filter(img => !img.startsWith('http'));

            let newMediaUrls: string[] = [];
            if (newImages.length > 0) {
                newMediaUrls = await uploadImages(newImages, `posts/${user.id}`);
            }

            const finalMediaUrls = [...existingUrls, ...newMediaUrls];

            await updatePost(postId, {
                isAnonymous,
                content: content.trim(),
                media: finalMediaUrls.map(url => ({ url, type: 'image' })), // Update structure matches create structure
                // classification, // Optionally update classification if re-analyzed
            });

            // Depending on complexity, we might want to update classification too if it changed
            if (classification) {
                await updatePost(postId, {
                    type: classification.category,
                    classification: classification,
                    ...(classification.category === 'REPORT' && {
                        severity: classification.severity || 'medium',
                    }),
                });
            }


            setShowClassificationModal(false);
            if (Platform.OS === 'web') {
                router.replace('/(tabs)');
            } else {
                Alert.alert('Berhasil! 🎉', 'Perubahan telah disimpan', [
                    { text: 'OK', onPress: () => router.replace('/(tabs)') }
                ]);
            }
        } catch (error) {
            console.error('Update post error:', error);
            Alert.alert('Error', 'Gagal memperbarui post. Silakan coba lagi.');
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
                                        <Text style={styles.submitButtonText}>Simpan Perubahan</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Brand.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Post</Text>
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
                        <Text style={styles.postButtonText}>Simpan</Text>
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
                        AI akan menganalisis konten Anda ulang jika Anda membuat perubahan.
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
