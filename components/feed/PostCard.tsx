import { Brand, CategoryColors, Colors, FontSize, FontWeight, Radius, SeverityColors, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Post, PostType } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { router } from 'expo-router';
import {
    AlertTriangle,
    ArrowUp,
    Bookmark,
    Clock,
    MapPin,
    MessageCircle,
    MessageSquare,
    Newspaper,
    Share2
} from 'lucide-react-native';
import React from 'react';
import {
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface PostCardProps {
    post: Post;
    onUpvote?: (postId: string) => void;
    onComment?: (postId: string) => void;
    onShare?: (postId: string) => void;
    onSave?: (postId: string) => void;
    isUpvoted?: boolean;
    isSaved?: boolean;
}

const TYPE_ICONS: Record<PostType, React.ComponentType<any>> = {
    GENERAL: MessageSquare,
    NEWS: Newspaper,
    REPORT: AlertTriangle,
};

const TYPE_LABELS: Record<PostType, string> = {
    GENERAL: 'Umum',
    NEWS: 'Berita',
    REPORT: 'Laporan',
};

export default function PostCard({
    post,
    onUpvote,
    onComment,
    onShare,
    onSave,
    isUpvoted = false,
    isSaved = false,
}: PostCardProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const TypeIcon = TYPE_ICONS[post.type];
    const typeColor = CategoryColors[post.type.toLowerCase() as keyof typeof CategoryColors] || colors.textMuted;

    const handlePress = () => {
        router.push(`/post/${post.id}`);
    };

    const formatTime = (date: Date) => {
        return formatDistanceToNow(date, { addSuffix: true, locale: id });
    };

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: colors.surface }]}
            onPress={handlePress}
            activeOpacity={0.9}
        >
            <View style={styles.header}>
                <View style={styles.authorInfo}>
                    <View style={[styles.avatar, { backgroundColor: colors.border }]}>
                        {post.authorAvatar ? (
                            <Image source={{ uri: post.authorAvatar }} style={styles.avatarImage} />
                        ) : (
                            <Text style={[styles.avatarText, { color: colors.textSecondary }]}>
                                {post.authorName.charAt(0).toUpperCase()}
                            </Text>
                        )}
                    </View>
                    <View style={styles.authorDetails}>
                        <Text style={[styles.authorName, { color: colors.text }]}>
                            {post.authorName}
                        </Text>
                        <View style={styles.metaRow}>
                            <Clock size={12} color={colors.textMuted} />
                            <Text style={[styles.metaText, { color: colors.textMuted }]}>
                                {formatTime(post.createdAt)}
                            </Text>
                            <View style={styles.metaDot} />
                            <MapPin size={12} color={colors.textMuted} />
                            <Text style={[styles.metaText, { color: colors.textMuted }]} numberOfLines={1}>
                                {post.location.district}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.typeBadge, { backgroundColor: typeColor + '15' }]}>
                    <TypeIcon size={12} color={typeColor} />
                    <Text style={[styles.typeBadgeText, { color: typeColor }]}>
                        {TYPE_LABELS[post.type]}
                    </Text>
                </View>
            </View>

            <Text style={[styles.content, { color: colors.text }]} numberOfLines={3}>
                {post.content}
            </Text>

            {post.media.length > 0 && (
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: post.media[0].url }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                    {post.media.length > 1 && (
                        <View style={styles.imageCount}>
                            <Text style={styles.imageCountText}>+{post.media.length - 1}</Text>
                        </View>
                    )}
                </View>
            )}

            {post.type === 'REPORT' && (post as any).severity && (
                <View style={styles.severityContainer}>
                    <View style={[
                        styles.severityBadge,
                        { backgroundColor: SeverityColors[(post as any).severity as keyof typeof SeverityColors] + '15' }
                    ]}>
                        <View style={[
                            styles.severityDot,
                            { backgroundColor: SeverityColors[(post as any).severity as keyof typeof SeverityColors] }
                        ]} />
                        <Text style={[
                            styles.severityText,
                            { color: SeverityColors[(post as any).severity as keyof typeof SeverityColors] }
                        ]}>
                            {(post as any).severity === 'low' ? 'Ringan' :
                                (post as any).severity === 'medium' ? 'Sedang' :
                                    (post as any).severity === 'high' ? 'Tinggi' : 'Kritis'}
                        </Text>
                    </View>
                </View>
            )}

            {post.classification.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                    {post.classification.tags.slice(0, 3).map((tag) => (
                        <View key={tag} style={[styles.tag, { backgroundColor: colors.surfaceSecondary }]}>
                            <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                                #{tag}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onUpvote?.(post.id)}
                >
                    <ArrowUp
                        size={20}
                        color={isUpvoted ? Brand.primary : colors.icon}
                        fill={isUpvoted ? Brand.primary : 'transparent'}
                    />
                    <Text style={[
                        styles.actionText,
                        { color: isUpvoted ? Brand.primary : colors.textSecondary }
                    ]}>
                        {post.engagement.upvotes}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onComment?.(post.id)}
                >
                    <MessageCircle size={20} color={colors.icon} />
                    <Text style={[styles.actionText, { color: colors.textSecondary }]}>
                        {post.engagement.comments}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onShare?.(post.id)}
                >
                    <Share2 size={20} color={colors.icon} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onSave?.(post.id)}
                >
                    <Bookmark
                        size={20}
                        color={isSaved ? Brand.primary : colors.icon}
                        fill={isSaved ? Brand.primary : 'transparent'}
                    />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.md,
        borderRadius: Radius.xl,
        overflow: 'hidden',
        ...Shadows.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: Spacing.md,
        paddingBottom: 0,
    },
    authorInfo: {
        flexDirection: 'row',
        flex: 1,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    authorDetails: {
        flex: 1,
        marginLeft: Spacing.sm,
        justifyContent: 'center',
    },
    authorName: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
        gap: 4,
    },
    metaText: {
        fontSize: FontSize.xs,
        maxWidth: 100,
    },
    metaDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#9CA3AF',
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: Radius.full,
        gap: 4,
    },
    typeBadgeText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
    },
    content: {
        fontSize: FontSize.md,
        lineHeight: 22,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    imageContainer: {
        position: 'relative',
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.sm,
        borderRadius: Radius.lg,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: 200,
        backgroundColor: '#E5E7EB',
    },
    imageCount: {
        position: 'absolute',
        bottom: Spacing.sm,
        right: Spacing.sm,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: Radius.sm,
    },
    imageCountText: {
        color: '#FFFFFF',
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
    },
    severityContainer: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    severityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: Radius.full,
        gap: 6,
    },
    severityDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    severityText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.sm,
        gap: Spacing.xs,
    },
    tag: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: Radius.sm,
    },
    tagText: {
        fontSize: FontSize.xs,
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderTopWidth: 1,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: Spacing.xs,
    },
    actionText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
});
