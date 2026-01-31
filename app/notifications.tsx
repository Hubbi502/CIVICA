import { Brand, Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { useTranslation } from '@/hooks/useTranslation';
import { getUserNotifications, markAsRead } from '@/services/notifications';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { Notification } from '@/types';
import Notifications from '@/utils/Notifications';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { router } from 'expo-router';
import { ArrowLeft, Bell, Heart, MessageCircle, UserPlus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
    const { effectiveColorScheme } = useThemeStore();
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const colorScheme = effectiveColorScheme ?? 'light';
    const colors = Colors[colorScheme];

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;

        const unsubscribe = getUserNotifications(user.id, (data) => {
            setNotifications(data);
            setLoading(false);
        });

        // Register for push notifications permission
        registerForPushNotificationsAsync();

        return () => unsubscribe();
    }, [user?.id]);

    const handleNotificationPress = async (item: Notification) => {
        // Mark as read
        if (!item.read) {
            await markAsRead(item.id);
        }

        // Navigate based on type
        if (item.data?.postId) {
            router.push(`/post/${item.data.postId}`);
        }
    };

    const renderIcon = (type: string) => {
        switch (type) {
            case 'upvote':
                return <Heart size={16} color="#FFF" fill="#FFF" />;
            case 'comment':
                return <MessageCircle size={16} color="#FFF" fill="#FFF" />;
            case 'new_follower':
                return <UserPlus size={16} color="#FFF" />;
            default:
                return <Bell size={16} color="#FFF" />;
        }
    };

    const getIconBgColor = (type: string) => {
        switch (type) {
            case 'upvote':
                return Brand.error;
            case 'comment':
                return Brand.primary;
            case 'new_follower':
                return Brand.info;
            default:
                return Brand.primary;
        }
    };

    const formatTime = (date: Date) => {
        return formatDistanceToNow(date, { addSuffix: true, locale: idLocale });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{t('notifications') || 'Notifikasi'}</Text>
                <View style={styles.placeholder} />
            </View>


            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={Brand.primary} />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.centered}>
                            <Text style={{ color: colors.textSecondary }}>Belum ada notifikasi</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.notificationItem,
                                { backgroundColor: item.read ? colors.background : colors.surface }
                            ]}
                            onPress={() => handleNotificationPress(item)}
                        >
                            <View style={styles.avatarContainer}>
                                <View style={[styles.avatar, { backgroundColor: Colors.light.border, justifyContent: 'center', alignItems: 'center' }]}>
                                    <Bell size={24} color={Colors.light.textSecondary} />
                                </View>

                                <View style={[styles.iconBadge, { backgroundColor: getIconBgColor(item.type) }]}>
                                    {renderIcon(item.type)}
                                </View>
                            </View>
                            <View style={styles.contentContainer}>
                                <Text style={[styles.notificationText, { color: colors.text }]}>
                                    <Text style={styles.userName}>{item.title}</Text> {item.body.replace(item.title, '')}
                                </Text>
                                <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                                    {formatTime(item.createdAt)}
                                </Text>
                            </View>
                            {!item.read && <View style={[styles.dot, { backgroundColor: Brand.primary }]} />}
                        </TouchableOpacity>
                    )}
                />
            )}
        </SafeAreaView>
    );
}

async function registerForPushNotificationsAsync() {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
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
        marginBottom: Spacing.sm,
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
    listContent: {
        paddingBottom: Spacing.xl,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: Spacing.lg,
        alignItems: 'center',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: Spacing.md,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    iconBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    contentContainer: {
        flex: 1,
        marginRight: Spacing.sm,
    },
    notificationText: {
        fontSize: FontSize.md,
        lineHeight: 20,
        marginBottom: 4,
    },
    userName: {
        fontWeight: FontWeight.bold,
    },
    timeText: {
        fontSize: FontSize.xs,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    simulateButton: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        padding: Spacing.md,
        borderRadius: Radius.lg,
        alignItems: 'center',
    },
    simulateButtonText: {
        color: '#FFFFFF',
        fontWeight: FontWeight.bold,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
