import { Brand, Colors, FontSize, FontWeight, Radius, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/useTranslation';
import { generateQuickActions, getChatResponse, getTimeOfDay } from '@/services/openRouter';
import { useAuthStore } from '@/stores/authStore';
import { ChatMessage, QuickAction } from '@/types';
import * as ImagePicker from 'expo-image-picker';
import { AlertTriangle, Car, Coffee, ImagePlus, MapPin, Newspaper, Send, Sparkles, Utensils, X } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
    ActionSheetIOS,
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
    utensils: Utensils,
    car: Car,
    'alert-triangle': AlertTriangle,
    newspaper: Newspaper,
    coffee: Coffee,
    megaphone: Sparkles,
    'book-open': Sparkles,
    users: Sparkles,
};

export default function ChatbotScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];
    const { user } = useAuthStore();
    const { t, language } = useTranslation();
    const flatListRef = useRef<FlatList>(null);

    const timeOfDay = getTimeOfDay();
    const quickActions = user?.persona
        ? generateQuickActions(user.persona, timeOfDay)
        : [];

    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            role: 'assistant',
            content: `Halo ${user?.displayName?.split(' ')[0] || 'Civican'}! 👋\n\nSaya asisten AI CIVICA. Saya bisa membantu Anda:\n\n• Mencari tempat makan, kopi, atau layanan terdekat\n• Mengecek kondisi lalu lintas\n• Membuat laporan masalah\n• Memberi info berita kota\n• Menganalisis gambar yang Anda kirim 📸\n\nApa yang bisa saya bantu hari ini?`,
            timestamp: new Date(),
        },
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const pickImageWeb = () => {
        // Create a hidden file input for web
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                    setSelectedImage(reader.result as string);
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    const pickImage = async (useCamera: boolean) => {
        const permissionResult = useCamera
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert('Izin Diperlukan', `Izin akses ${useCamera ? 'kamera' : 'galeri'} diperlukan untuk melanjutkan.`);
            return;
        }

        const result = useCamera
            ? await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.7,
            })
            : await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.7,
            });

        if (!result.canceled && result.assets[0]) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const handlePickImage = () => {
        if (Platform.OS === 'web') {
            pickImageWeb();
        } else if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Batal', 'Kamera', 'Galeri'],
                    cancelButtonIndex: 0,
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) pickImage(true);
                    else if (buttonIndex === 2) pickImage(false);
                }
            );
        } else {
            Alert.alert('Pilih Sumber', 'Dari mana Anda ingin mengambil gambar?', [
                { text: 'Kamera', onPress: () => pickImage(true) },
                { text: 'Galeri', onPress: () => pickImage(false) },
                { text: 'Batal', style: 'cancel' },
            ]);
        }
    };

    const handleSend = async (text: string = inputText) => {
        if ((!text.trim() && !selectedImage) || isLoading) return;

        const messageText = text.trim() || (selectedImage ? 'Apa yang ada di gambar ini?' : '');

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: messageText,
            imageUri: selectedImage || undefined,
            timestamp: new Date(),
        };

        const imageToSend = selectedImage;
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setSelectedImage(null);
        setIsLoading(true);

        try {
            const response = await getChatResponse(
                [...messages, userMessage],
                {
                    persona: user?.persona || 'resident',
                    location: {
                        city: user?.location?.city || 'Jakarta',
                        district: user?.location?.district || 'Pusat',
                    },
                    timeOfDay,
                },
                imageToSend || undefined
            );

            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickAction = (action: QuickAction) => {
        handleSend(action.prompt);
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isUser = item.role === 'user';

        return (
            <View style={[
                styles.messageContainer,
                isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
            ]}>
                {!isUser && (
                    <View style={[styles.assistantAvatar, { backgroundColor: Brand.primary }]}>
                        <Sparkles size={16} color="#FFFFFF" />
                    </View>
                )}
                <View style={[
                    styles.messageBubble,
                    isUser
                        ? [styles.userBubble, { backgroundColor: Brand.primary }]
                        : [styles.assistantBubble, { backgroundColor: colors.surface }],
                ]}>
                    {item.imageUri && (
                        <Image
                            source={{ uri: item.imageUri }}
                            style={styles.messageImage}
                            resizeMode="cover"
                        />
                    )}
                    <Text style={[
                        styles.messageText,
                        { color: isUser ? '#FFFFFF' : colors.text },
                    ]}>
                        {item.content}
                    </Text>
                </View>
            </View>
        );
    };

    const renderQuickActions = () => (
        <View style={styles.quickActionsContainer}>
            <Text style={[styles.quickActionsTitle, { color: colors.textSecondary }]}>
                Aksi Cepat
            </Text>
            <View style={styles.quickActionsGrid}>
                {quickActions.map((action) => {
                    const Icon = ICON_MAP[action.icon] || MapPin;

                    return (
                        <TouchableOpacity
                            key={action.id}
                            style={[styles.quickActionButton, { backgroundColor: colors.surface }]}
                            onPress={() => handleQuickAction(action)}
                        >
                            <Icon size={20} color={Brand.primary} />
                            <Text style={[styles.quickActionText, { color: colors.text }]} numberOfLines={2}>
                                {action.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={[styles.headerIcon, { backgroundColor: Brand.primary }]}>
                    <Sparkles size={24} color="#FFFFFF" />
                </View>
                <View>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>{t('civicaAssistant')}</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                        Powered by AI
                    </Text>
                </View>
            </View>

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior="padding"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.messagesList}
                    ListFooterComponent={
                        <>
                            {isLoading && (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator color={Brand.primary} />
                                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                                        Sedang mengetik...
                                    </Text>
                                </View>
                            )}
                            {messages.length <= 1 && renderQuickActions()}
                        </>
                    }
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                />

                <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                    {selectedImage && (
                        <View style={styles.imagePreviewContainer}>
                            <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                            <TouchableOpacity
                                style={styles.removeImageButton}
                                onPress={() => setSelectedImage(null)}
                            >
                                <X size={16} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    )}
                    <View style={styles.inputRow}>
                        <TouchableOpacity
                            style={[styles.imageButton, { backgroundColor: colors.surfaceSecondary }]}
                            onPress={handlePickImage}
                            disabled={isLoading}
                        >
                            <ImagePlus size={22} color={Brand.primary} />
                        </TouchableOpacity>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.text }]}
                            placeholder={selectedImage ? t('askAnything') : t('typeMessage')}
                            placeholderTextColor={colors.textMuted}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity
                            style={[
                                styles.sendButton,
                                (!inputText.trim() && !selectedImage || isLoading) && styles.sendButtonDisabled,
                            ]}
                            onPress={() => handleSend()}
                            disabled={(!inputText.trim() && !selectedImage) || isLoading}
                        >
                            <Send size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>
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
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        gap: Spacing.md,
    },
    headerIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
    },
    headerSubtitle: {
        fontSize: FontSize.xs,
    },
    keyboardView: {
        flex: 1,
    },
    messagesList: {
        padding: Spacing.md,
        paddingBottom: Spacing.xl,
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: Spacing.md,
    },
    userMessageContainer: {
        justifyContent: 'flex-end',
    },
    assistantMessageContainer: {
        justifyContent: 'flex-start',
    },
    assistantAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.sm,
        marginTop: 4,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: Spacing.md,
        borderRadius: Radius.xl,
    },
    userBubble: {
        borderBottomRightRadius: Radius.sm,
    },
    assistantBubble: {
        borderBottomLeftRadius: Radius.sm,
        ...Shadows.sm,
    },
    messageText: {
        fontSize: FontSize.md,
        lineHeight: 22,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginLeft: 40,
        marginBottom: Spacing.md,
    },
    loadingText: {
        fontSize: FontSize.sm,
    },
    quickActionsContainer: {
        marginTop: Spacing.lg,
        marginHorizontal: Spacing.sm,
    },
    quickActionsTitle: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        marginBottom: Spacing.md,
        marginLeft: 40,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginLeft: 40,
    },
    quickActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radius.full,
        gap: Spacing.sm,
        ...Shadows.sm,
    },
    quickActionText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        maxWidth: 100,
    },
    inputContainer: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderTopWidth: 1,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: Spacing.sm,
    },
    imageButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        minHeight: 44,
        maxHeight: 100,
        borderRadius: Radius.xl,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        fontSize: FontSize.md,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Brand.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.sm,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    messageImage: {
        width: '100%',
        height: 200,
        borderRadius: Radius.lg,
        marginBottom: Spacing.sm,
    },
    imagePreviewContainer: {
        marginBottom: Spacing.sm,
        position: 'relative',
        alignSelf: 'flex-start',
    },
    imagePreview: {
        width: 80,
        height: 80,
        borderRadius: Radius.lg,
    },
    removeImageButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Brand.error,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
