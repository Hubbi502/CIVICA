import { Brand, Colors, FontSize, FontWeight, Radius, SeverityColors, Spacing, StatusColors } from '@/constants/theme';
import { db } from '@/FirebaseConfig';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Post } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import {
    AlertTriangle,
    ArrowLeft,
    ArrowUp,
    Bookmark,
    Camera,
    CheckCircle,
    Clock,
    Eye,
    MapPin,
    MessageCircle,
    Share2,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ReportDetail extends Post {
    status?: 'active' | 'verified' | 'resolved' | 'closed';
    severity?: 'low' | 'medium' | 'high' | 'critical';
    updates?: {
        id: string;
        authorName: string;
        content: string;
        media?: { url: string; type: string }[];
        createdAt: Date;
    }[];
    verifiedCount?: number;
}

export default function ReportDetailScreen() {
    const { id: reportId } = useLocalSearchParams<{ id: string }>();
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [report, setReport] = useState<ReportDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpvoted, setIsUpvoted] = useState(false);
    const [isWatching, setIsWatching] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const fetchReport = async () => {
            if (!reportId) return;

            try {
                setIsLoading(true);
                const reportRef = doc(db, 'posts', reportId);
                const reportSnap = await getDoc(reportRef);

                if (reportSnap.exists()) {
                    const data = reportSnap.data();
                    setReport({
                        id: reportSnap.id,
                        authorId: data.authorId,
                        authorName: data.authorName,
                        authorAvatar: data.authorAvatar,
                        isAnonymous: data.isAnonymous,
                        content: data.content,
                        media: data.media || [],
                        location: data.location || { district: '', city: '', address: '' },
                        type: data.type,
                        classification: data.classification,
                        engagement: data.engagement || { upvotes: 0, comments: 0, shares: 0, watchers: 0, views: 0 },
                        upvotedBy: data.upvotedBy || [],
                        watchedBy: data.watchedBy || [],
                        createdAt: data.createdAt?.toDate() || new Date(),
                        updatedAt: data.updatedAt?.toDate() || new Date(),
                        status: data.status,
                        severity: data.severity || data.classification?.severity,
                        updates: (data.updates || []).map((u: any) => ({
                            ...u,
                            createdAt: u.createdAt?.toDate() || new Date(),
                        })),
                        verifiedCount: data.verifiedCount || 0,
                    } as ReportDetail);
                }
            } catch (error) {
                console.error('Error fetching report:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReport();
    }, [reportId]);

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
                <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Detail Laporan</Text>
                    <View style={styles.headerActions} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Brand.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (!report) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
                <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Detail Laporan</Text>
                    <View style={styles.headerActions} />
                </View>
                <View style={styles.errorContainer}>
                    <Text style={[styles.errorText, { color: colors.textSecondary }]}>
                        Laporan tidak ditemukan
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Detail Laporan</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={() => setIsSaved(!isSaved)}>
                        <Bookmark
                            size={24}
                            color={isSaved ? Brand.primary : colors.icon}
                            fill={isSaved ? Brand.primary : 'transparent'}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Share2 size={24} color={colors.icon} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={[styles.section, { backgroundColor: colors.surface }]}>
                    <View style={styles.authorRow}>
                        <View style={[styles.avatar, { backgroundColor: Brand.primary }]}>
                            <Text style={styles.avatarText}>
                                {report.authorName.charAt(0)}
                            </Text>
                        </View>
                        <View style={styles.authorInfo}>
                            <Text style={[styles.authorName, { color: colors.text }]}>
                                {report.authorName}
                            </Text>
                            <View style={styles.metaRow}>
                                <Clock size={12} color={colors.textMuted} />
                                <Text style={[styles.metaText, { color: colors.textMuted }]}>
                                    {formatDistanceToNow(report.createdAt, { addSuffix: true, locale: id })}
                                </Text>
                            </View>
                        </View>

                        {report.status && (
                            <View style={[styles.statusBadge, { backgroundColor: StatusColors[report.status!] + '15' }]}>
                                <CheckCircle size={14} color={StatusColors[report.status!]} />
                                <Text style={[styles.statusText, { color: StatusColors[report.status!] }]}>
                                    {report.status === 'verified' ? 'Terverifikasi' :
                                        report.status === 'resolved' ? 'Selesai' :
                                            report.status === 'closed' ? 'Ditutup' : 'Aktif'}
                                </Text>
                            </View>
                        )}
                    </View>

                    <Text style={[styles.content, { color: colors.text }]}>
                        {report.content}
                    </Text>

                    {report.media.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
                            {report.media.map((media, index) => (
                                <Image
                                    key={index}
                                    source={{ uri: media.url }}
                                    style={styles.postImage}
                                />
                            ))}
                        </ScrollView>
                    )}

                    <View style={[styles.locationCard, { backgroundColor: colors.surfaceSecondary }]}>
                        <MapPin size={16} color={Brand.primary} />
                        <Text style={[styles.locationText, { color: colors.text }]}>
                            {report.location.address}
                        </Text>
                    </View>

                    {report.severity && (
                        <View style={styles.severityRow}>
                            <AlertTriangle size={16} color={SeverityColors[report.severity!]} />
                            <Text style={[styles.severityLabel, { color: colors.textSecondary }]}>
                                Tingkat Keparahan:
                            </Text>
                            <View style={[styles.severityBadge, { backgroundColor: SeverityColors[report.severity!] + '15' }]}>
                                <Text style={[styles.severityText, { color: SeverityColors[report.severity!] }]}>
                                    {report.severity === 'low' ? 'Ringan' :
                                        report.severity === 'medium' ? 'Sedang' :
                                            report.severity === 'high' ? 'Tinggi' : 'Kritis'}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                <View style={[styles.statsRow, { backgroundColor: colors.surface }]}>
                    <View style={styles.statItem}>
                        <ArrowUp size={18} color={colors.textSecondary} />
                        <Text style={[styles.statText, { color: colors.text }]}>
                            {report.engagement.upvotes}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <MessageCircle size={18} color={colors.textSecondary} />
                        <Text style={[styles.statText, { color: colors.text }]}>
                            {report.engagement.comments}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Eye size={18} color={colors.textSecondary} />
                        <Text style={[styles.statText, { color: colors.text }]}>
                            {report.engagement.watchers} mengikuti
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <CheckCircle size={18} color={Brand.success} />
                        <Text style={[styles.statText, { color: colors.text }]}>
                            {report.verifiedCount} verifikasi
                        </Text>
                    </View>
                </View>

                <View style={[styles.section, { backgroundColor: colors.surface }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Update Komunitas
                        </Text>
                        <TouchableOpacity style={styles.addUpdateButton}>
                            <Camera size={16} color={Brand.primary} />
                            <Text style={[styles.addUpdateText, { color: Brand.primary }]}>
                                Tambah Update
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.timeline}>
                        <View style={styles.timelineItem}>
                            <View style={[styles.timelineDot, { backgroundColor: Brand.primary }]} />
                            <View style={styles.timelineContent}>
                                <Text style={[styles.timelineTitle, { color: colors.text }]}>
                                    Laporan Dibuat
                                </Text>
                                <Text style={[styles.timelineTime, { color: colors.textMuted }]}>
                                    {formatDistanceToNow(report.createdAt, { addSuffix: true, locale: id })}
                                </Text>
                            </View>
                        </View>

                        {(report.updates || []).map((update) => (
                            <View key={update.id} style={styles.timelineItem}>
                                <View style={[styles.timelineDot, { backgroundColor: Brand.success }]} />
                                <View style={[styles.updateCard, { backgroundColor: colors.surfaceSecondary }]}>
                                    <Text style={[styles.updateAuthor, { color: colors.text }]}>
                                        {update.authorName}
                                    </Text>
                                    <Text style={[styles.updateContent, { color: colors.textSecondary }]}>
                                        {update.content}
                                    </Text>
                                    {update.media && (
                                        <Image source={{ uri: update.media[0].url }} style={styles.updateImage} />
                                    )}
                                    <Text style={[styles.updateTime, { color: colors.textMuted }]}>
                                        {formatDistanceToNow(update.createdAt, { addSuffix: true, locale: id })}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.actionButton, isUpvoted && { backgroundColor: Brand.primary + '15' }]}
                    onPress={() => setIsUpvoted(!isUpvoted)}
                >
                    <ArrowUp
                        size={20}
                        color={isUpvoted ? Brand.primary : colors.text}
                        fill={isUpvoted ? Brand.primary : 'transparent'}
                    />
                    <Text style={[styles.actionButtonText, isUpvoted && { color: Brand.primary }]}>
                        Upvote
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                    <MessageCircle size={20} color={colors.text} />
                    <Text style={styles.actionButtonText}>Komentar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.watchButton, isWatching && { backgroundColor: Brand.success }]}
                    onPress={() => setIsWatching(!isWatching)}
                >
                    <Eye size={18} color={isWatching ? '#FFFFFF' : Brand.success} />
                    <Text style={[styles.watchButtonText, isWatching && { color: '#FFFFFF' }]}>
                        {isWatching ? 'Mengikuti' : 'Ikuti'}
                    </Text>
                </TouchableOpacity>
            </View>
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
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: Spacing.xs,
    },
    headerTitle: {
        flex: 1,
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
        marginLeft: Spacing.sm,
    },
    headerActions: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    section: {
        padding: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
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
    authorInfo: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    authorName: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    metaText: {
        fontSize: FontSize.xs,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: Radius.full,
        gap: 4,
    },
    statusText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
    },
    content: {
        fontSize: FontSize.md,
        lineHeight: 24,
        marginBottom: Spacing.md,
    },
    imagesContainer: {
        marginBottom: Spacing.md,
    },
    postImage: {
        width: 280,
        height: 200,
        borderRadius: Radius.lg,
        marginRight: Spacing.sm,
    },
    locationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: Radius.lg,
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    locationText: {
        flex: 1,
        fontSize: FontSize.sm,
    },
    severityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    severityLabel: {
        fontSize: FontSize.sm,
    },
    severityBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: Radius.full,
    },
    severityText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        marginBottom: Spacing.sm,
        gap: Spacing.lg,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    addUpdateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    addUpdateText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
    timeline: {},
    timelineItem: {
        flexDirection: 'row',
        marginBottom: Spacing.md,
    },
    timelineDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginTop: 4,
        marginRight: Spacing.md,
    },
    timelineContent: {
        flex: 1,
    },
    timelineTitle: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
    timelineTime: {
        fontSize: FontSize.xs,
        marginTop: 2,
    },
    updateCard: {
        flex: 1,
        padding: Spacing.md,
        borderRadius: Radius.lg,
    },
    updateAuthor: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        marginBottom: 4,
    },
    updateContent: {
        fontSize: FontSize.sm,
        lineHeight: 20,
    },
    updateImage: {
        width: '100%',
        height: 120,
        borderRadius: Radius.md,
        marginTop: Spacing.sm,
    },
    updateTime: {
        fontSize: FontSize.xs,
        marginTop: Spacing.sm,
    },
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderTopWidth: 1,
        gap: Spacing.sm,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.sm,
        borderRadius: Radius.lg,
        gap: Spacing.xs,
    },
    actionButtonText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
    watchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: Radius.full,
        borderWidth: 1,
        borderColor: Brand.success,
        gap: Spacing.xs,
    },
    watchButtonText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        color: Brand.success,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    errorText: {
        fontSize: FontSize.md,
        textAlign: 'center',
    },
});
