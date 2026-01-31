import { Brand, Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { CheckCircle, Clock, Plus, User } from 'lucide-react-native';
import React from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface TimelineUpdate {
    id: string;
    authorId?: string;
    authorName: string;
    authorAvatar?: string;
    content: string;
    media?: { url: string; type: string }[];
    createdAt: Date;
}

interface TimelineProps {
    updates: TimelineUpdate[];
    isVerified: boolean;
    verifiedCount: number;
    onAddUpdate: () => void;
    canAddUpdate: boolean;
}

export default function Timeline({
    updates,
    isVerified,
    verifiedCount,
    onAddUpdate,
    canAddUpdate
}: TimelineProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const sortedUpdates = [...updates].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={[styles.title, { color: colors.text }]}>
                        Timeline Laporan
                    </Text>
                    {isVerified && (
                        <View style={[styles.verifiedBadge, { backgroundColor: Brand.success + '20' }]}>
                            <CheckCircle size={12} color={Brand.success} />
                            <Text style={[styles.verifiedText, { color: Brand.success }]}>
                                Terverifikasi
                            </Text>
                        </View>
                    )}
                </View>
                {canAddUpdate && (
                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: Brand.primary }]}
                        onPress={onAddUpdate}
                    >
                        <Plus size={16} color="#FFFFFF" />
                        <Text style={styles.addButtonText}>Tambah Update</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Progress indicator */}
            <View style={styles.progressContainer}>
                <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                    {verifiedCount}/3 update untuk verifikasi
                </Text>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                    <View
                        style={[
                            styles.progressFill,
                            {
                                backgroundColor: Brand.success,
                                width: `${Math.min((verifiedCount / 3) * 100, 100)}%`
                            }
                        ]}
                    />
                </View>
            </View>

            {/* Timeline items */}
            {sortedUpdates.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Clock size={32} color={colors.textMuted} />
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                        Belum ada update timeline
                    </Text>
                    <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                        Tambahkan update untuk melacak progress laporan
                    </Text>
                </View>
            ) : (
                <View style={styles.timeline}>
                    {sortedUpdates.map((update, index) => (
                        <View key={update.id} style={styles.timelineItem}>
                            {/* Line connector */}
                            <View style={styles.lineContainer}>
                                <View
                                    style={[
                                        styles.dot,
                                        {
                                            backgroundColor: index === 0 ? Brand.primary : colors.border,
                                            borderColor: index === 0 ? Brand.primary : colors.border
                                        }
                                    ]}
                                />
                                {index < sortedUpdates.length - 1 && (
                                    <View style={[styles.line, { backgroundColor: colors.border }]} />
                                )}
                            </View>

                            {/* Content */}
                            <View style={[styles.itemContent, { backgroundColor: colors.surfaceSecondary }]}>
                                {/* Author info */}
                                <View style={styles.itemHeader}>
                                    <View style={styles.authorInfo}>
                                        {update.authorAvatar ? (
                                            <Image
                                                source={{ uri: update.authorAvatar }}
                                                style={styles.avatar}
                                            />
                                        ) : (
                                            <View style={[styles.avatar, { backgroundColor: Brand.primary }]}>
                                                <User size={12} color="#FFFFFF" />
                                            </View>
                                        )}
                                        <Text style={[styles.authorName, { color: colors.text }]}>
                                            {update.authorName}
                                        </Text>
                                    </View>
                                    <View style={[styles.timeBadge, { backgroundColor: colors.border + '60' }]}>
                                        <Clock size={10} color={colors.textSecondary} />
                                        <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                                            {formatDistanceToNow(update.createdAt, { addSuffix: true, locale: id })}
                                        </Text>
                                    </View>
                                </View>

                                {/* Content text */}
                                <Text style={[styles.contentText, { color: colors.text }]}>
                                    {update.content}
                                </Text>

                                {/* Media */}
                                {update.media && update.media.length > 0 && (
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        style={styles.mediaContainer}
                                    >
                                        {update.media.map((media, mediaIndex) => (
                                            <Image
                                                key={mediaIndex}
                                                source={{ uri: media.url }}
                                                style={styles.mediaImage}
                                            />
                                        ))}
                                    </ScrollView>
                                )}
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    title: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: Radius.full,
        gap: 4,
    },
    verifiedText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radius.lg,
        gap: 4,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
    progressContainer: {
        marginBottom: Spacing.lg,
    },
    progressText: {
        fontSize: FontSize.xs,
        marginBottom: 6,
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
    },
    emptyText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
        marginTop: Spacing.md,
    },
    emptySubtext: {
        fontSize: FontSize.sm,
        textAlign: 'center',
        marginTop: Spacing.xs,
    },
    timeline: {
        gap: 0,
    },
    timelineItem: {
        flexDirection: 'row',
    },
    lineContainer: {
        width: 24,
        alignItems: 'center',
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        marginTop: Spacing.md,
    },
    line: {
        width: 2,
        flex: 1,
        marginTop: 4,
    },
    itemContent: {
        flex: 1,
        marginLeft: Spacing.sm,
        marginBottom: Spacing.md,
        padding: Spacing.md,
        borderRadius: Radius.lg,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    avatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    authorName: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
    timeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: Radius.full,
        gap: 4,
    },
    timeText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
    },
    contentText: {
        fontSize: FontSize.sm,
        lineHeight: 20,
    },
    mediaContainer: {
        marginTop: Spacing.sm,
    },
    mediaImage: {
        width: 120,
        height: 90,
        borderRadius: Radius.md,
        marginRight: Spacing.sm,
    },
});
