import { Brand, Colors, FontSize, FontWeight, Radius, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { generateQuickActions, getChatResponse, getTimeOfDay } from '@/services/openRouter';
import { useAuthStore } from '@/stores/authStore';
import { ChatMessage, QuickAction } from '@/types';
import { AlertTriangle, Car, Coffee, MapPin, Newspaper, Send, Sparkles, Utensils } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
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
    const flatListRef = useRef<FlatList>(null);

    const timeOfDay = getTimeOfDay();
    const quickActions = user?.persona
        ? generateQuickActions(user.persona, timeOfDay)
        : [];

    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            role: 'assistant',
            content: `Halo ${user?.displayName?.split(' ')[0] || 'Civican'}! 👋\n\nSaya asisten AI CIVICA. Saya bisa membantu Anda:\n\n• Mencari tempat makan, kopi, atau layanan terdekat\n• Mengecek kondisi lalu lintas\n• Membuat laporan masalah\n• Memberi info berita kota\n\nApa yang bisa saya bantu hari ini?`,
            timestamp: new Date(),
        },
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async (text: string = inputText) => {
        if (!text.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: text.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
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
                }
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
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Asisten CIVICA</Text>
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
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.text }]}
                        placeholder="Ketik pesan..."
                        placeholderTextColor={colors.textMuted}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
                        ]}
                        onPress={() => handleSend()}
                        disabled={!inputText.trim() || isLoading}
                    >
                        <Send size={20} color="#FFFFFF" />
                    </TouchableOpacity>
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
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderTopWidth: 1,
        gap: Spacing.sm,
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
});
