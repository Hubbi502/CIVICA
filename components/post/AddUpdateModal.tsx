import { Brand, Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, X } from 'lucide-react-native';
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
    View
} from 'react-native';

interface AddUpdateModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (content: string, images: string[]) => Promise<void>;
    isSubmitting: boolean;
}

export default function AddUpdateModal({
    visible,
    onClose,
    onSubmit,
    isSubmitting
}: AddUpdateModalProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [content, setContent] = useState('');
    const [images, setImages] = useState<string[]>([]);

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Izin Diperlukan', 'Izin akses galeri diperlukan untuk memilih foto.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
            selectionLimit: 4 - images.length,
        });

        if (!result.canceled && result.assets) {
            const newImages = result.assets.map(asset => asset.uri);
            setImages(prev => [...prev, ...newImages].slice(0, 4));
        }
    };

    const handleTakePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Izin Diperlukan', 'Izin akses kamera diperlukan untuk mengambil foto.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            quality: 0.8,
        });

        if (!result.canceled && result.assets) {
            setImages(prev => [...prev, result.assets[0].uri].slice(0, 4));
        }
    };

    const handleRemoveImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!content.trim()) {
            Alert.alert('Error', 'Konten update tidak boleh kosong');
            return;
        }

        try {
            await onSubmit(content.trim(), images);
            // Reset form on success
            setContent('');
            setImages([]);
        } catch (error) {
            // Error handling is done in parent
        }
    };

    const handleClose = () => {
        setContent('');
        setImages([]);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                <TouchableOpacity style={styles.overlayPressable} onPress={handleClose} />
                <View style={[styles.content, { backgroundColor: colors.surface }]}>
                    <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text }]}>
                            Tambah Update Timeline
                        </Text>
                        <TouchableOpacity onPress={handleClose}>
                            <X size={24} color={colors.icon} />
                        </TouchableOpacity>
                    </View>

                    {/* Content Input */}
                    <TextInput
                        style={[
                            styles.input,
                            {
                                backgroundColor: colors.surfaceSecondary,
                                color: colors.text,
                                borderColor: colors.border
                            }
                        ]}
                        placeholder="Tulis update kondisi terkini laporan..."
                        placeholderTextColor={colors.textMuted}
                        multiline
                        value={content}
                        onChangeText={setContent}
                        maxLength={500}
                    />

                    {/* Character count */}
                    <Text style={[styles.charCount, { color: colors.textMuted }]}>
                        {content.length}/500
                    </Text>

                    {/* Image Preview */}
                    {images.length > 0 && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.imagePreviewContainer}
                        >
                            {images.map((uri, index) => (
                                <View key={index} style={styles.imagePreviewWrapper}>
                                    <Image source={{ uri }} style={styles.imagePreview} />
                                    <TouchableOpacity
                                        style={styles.removeImageButton}
                                        onPress={() => handleRemoveImage(index)}
                                    >
                                        <X size={14} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    )}

                    {/* Image Picker Buttons */}
                    <View style={styles.imagePickerRow}>
                        <TouchableOpacity
                            style={[styles.imagePickerButton, { backgroundColor: colors.surfaceSecondary }]}
                            onPress={handlePickImage}
                            disabled={images.length >= 4}
                        >
                            <ImageIcon size={20} color={images.length >= 4 ? colors.textMuted : Brand.primary} />
                            <Text
                                style={[
                                    styles.imagePickerText,
                                    { color: images.length >= 4 ? colors.textMuted : colors.text }
                                ]}
                            >
                                Galeri
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.imagePickerButton, { backgroundColor: colors.surfaceSecondary }]}
                            onPress={handleTakePhoto}
                            disabled={images.length >= 4}
                        >
                            <Camera size={20} color={images.length >= 4 ? colors.textMuted : Brand.primary} />
                            <Text
                                style={[
                                    styles.imagePickerText,
                                    { color: images.length >= 4 ? colors.textMuted : colors.text }
                                ]}
                            >
                                Kamera
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {images.length > 0 && (
                        <Text style={[styles.imageCount, { color: colors.textMuted }]}>
                            {images.length}/4 foto
                        </Text>
                    )}

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            { backgroundColor: Brand.primary },
                            (!content.trim() || isSubmitting) && styles.submitButtonDisabled
                        ]}
                        onPress={handleSubmit}
                        disabled={!content.trim() || isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <Text style={styles.submitButtonText}>Kirim Update</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    overlayPressable: {
        flex: 1,
    },
    content: {
        borderTopLeftRadius: Radius.xl,
        borderTopRightRadius: Radius.xl,
        padding: Spacing.lg,
        paddingBottom: Spacing.xl + (Platform.OS === 'ios' ? 20 : 0),
        maxHeight: '80%',
    },
    dragHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: Spacing.lg,
        opacity: 0.5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
    },
    input: {
        minHeight: 120,
        maxHeight: 200,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        fontSize: FontSize.md,
        textAlignVertical: 'top',
        borderWidth: 1,
    },
    charCount: {
        fontSize: FontSize.xs,
        textAlign: 'right',
        marginTop: 4,
    },
    imagePreviewContainer: {
        marginTop: Spacing.md,
    },
    imagePreviewWrapper: {
        position: 'relative',
        marginRight: Spacing.sm,
    },
    imagePreview: {
        width: 80,
        height: 80,
        borderRadius: Radius.md,
    },
    removeImageButton: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: Brand.error,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePickerRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.md,
    },
    imagePickerButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        borderRadius: Radius.lg,
        gap: Spacing.sm,
    },
    imagePickerText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
    imageCount: {
        fontSize: FontSize.xs,
        marginTop: Spacing.sm,
    },
    submitButton: {
        marginTop: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: Radius.lg,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
});
