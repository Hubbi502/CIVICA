import { db } from '@/FirebaseConfig';
import { Brand, Colors, FontSize, FontWeight, Radius, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SeverityLevel } from '@/types';
import {
    collection,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    where,
} from 'firebase/firestore';
import {
    Activity,
    AlertTriangle,
    ArrowDown,
    ArrowUp,
    CheckCircle,
    Clock,
    FileText,
    TrendingUp,
    Trophy,
    Users
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TodaysSnapshot {
    newReports: { value: number; change: number; isUp: boolean };
    resolved: { value: number; change: number; isUp: boolean };
    activeUsers: { value: number; change: number; isUp: boolean };
    avgResponse: { value: string; change: number; isUp: boolean };
}

interface UrgentIssue {
    id: string;
    title: string;
    location: string;
    severity: SeverityLevel;
    reportedAgo: string;
    upvotes: number;
}

interface Contributor {
    id: string;
    name: string;
    points: number;
    reports: number;
    avatar: string;
}

interface WeeklyData {
    day: string;
    reports: number;
    resolved: number;
}

const SEVERITY_COLORS = {
    critical: '#DC2626',
    high: '#F59E0B',
    medium: '#3B82F6',
    low: '#10B981',
};

const SEVERITY_ORDER: SeverityLevel[] = ['critical', 'high', 'medium', 'low'];

const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'baru saja';
    if (diffMins < 60) return `${diffMins} menit`;
    if (diffHours < 24) return `${diffHours} jam`;
    return `${diffDays} hari`;
};

const getStartOfToday = (): Date => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
};

const getStartOfYesterday = (): Date => {
    const date = getStartOfToday();
    date.setDate(date.getDate() - 1);
    return date;
};

const getDayName = (daysAgo: number): string => {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return days[date.getDay()];
};

export default function PulseScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [todaysSnapshot, setTodaysSnapshot] = useState<TodaysSnapshot>({
        newReports: { value: 0, change: 0, isUp: true },
        resolved: { value: 0, change: 0, isUp: true },
        activeUsers: { value: 0, change: 0, isUp: true },
        avgResponse: { value: '-', change: 0, isUp: true },
    });
    const [urgentIssues, setUrgentIssues] = useState<UrgentIssue[]>([]);
    const [topContributors, setTopContributors] = useState<Contributor[]>([]);
    const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);

    const fetchTodaysSnapshot = async () => {
        try {
            const postsRef = collection(db, 'posts');
            const startOfToday = getStartOfToday();
            const startOfYesterday = getStartOfYesterday();

            const todayQuery = query(
                postsRef,
                where('type', '==', 'REPORT'),
                where('createdAt', '>=', startOfToday)
            );
            const todaySnapshot = await getDocs(todayQuery);
            const todayReports = todaySnapshot.size;

            const yesterdayQuery = query(
                postsRef,
                where('type', '==', 'REPORT'),
                where('createdAt', '>=', startOfYesterday),
                where('createdAt', '<', startOfToday)
            );
            const yesterdaySnapshot = await getDocs(yesterdayQuery);
            const yesterdayReports = yesterdaySnapshot.size;

            const reportsChange = yesterdayReports > 0
                ? Math.round(((todayReports - yesterdayReports) / yesterdayReports) * 100)
                : todayReports > 0 ? 100 : 0;

            const resolvedQuery = query(
                postsRef,
                where('type', '==', 'REPORT'),
                where('status', '==', 'resolved'),
                where('updatedAt', '>=', startOfToday)
            );
            const resolvedSnapshot = await getDocs(resolvedQuery);
            const resolvedToday = resolvedSnapshot.size;

            const activeUsersSet = new Set<string>();
            todaySnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.authorId) {
                    activeUsersSet.add(data.authorId);
                }
            });
            const activeUsers = activeUsersSet.size;

            let totalResponseTime = 0;
            let responseCount = 0;
            resolvedSnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.createdAt && data.updatedAt) {
                    const created = data.createdAt.toDate();
                    const updated = data.updatedAt.toDate();
                    const diffHours = (updated.getTime() - created.getTime()) / 3600000;
                    totalResponseTime += diffHours;
                    responseCount++;
                }
            });
            const avgResponseTime = responseCount > 0
                ? (totalResponseTime / responseCount).toFixed(1) + 'h'
                : '-';

            setTodaysSnapshot({
                newReports: {
                    value: todayReports,
                    change: Math.abs(reportsChange),
                    isUp: reportsChange >= 0
                },
                resolved: {
                    value: resolvedToday,
                    change: 0,
                    isUp: true
                },
                activeUsers: {
                    value: activeUsers,
                    change: 0,
                    isUp: true
                },
                avgResponse: {
                    value: avgResponseTime,
                    change: 0,
                    isUp: true
                },
            });
        } catch (error) {
            console.error('Error fetching today snapshot:', error);
        }
    };

    const fetchUrgentIssues = async () => {
        try {
            const postsRef = collection(db, 'posts');

            const urgentQuery = query(
                postsRef,
                where('type', '==', 'REPORT'),
                where('status', 'in', ['active', 'verified']),
                orderBy('createdAt', 'desc'),
                limit(10)
            );

            const snapshot = await getDocs(urgentQuery);
            const issues: UrgentIssue[] = [];

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const severity = data.severity || data.classification?.severity || 'medium';

                if (severity === 'critical' || severity === 'high' || severity === 'medium') {
                    const createdAt = data.createdAt?.toDate() || new Date();
                    issues.push({
                        id: doc.id,
                        title: data.content?.substring(0, 50) + (data.content?.length > 50 ? '...' : '') || 'Laporan',
                        location: data.location?.district
                            ? `${data.location.district}, ${data.location.city}`
                            : data.location?.address || 'Lokasi tidak diketahui',
                        severity: severity as SeverityLevel,
                        reportedAgo: formatTimeAgo(createdAt),
                        upvotes: data.engagement?.upvotes || 0,
                    });
                }
            });

            issues.sort((a, b) => {
                return SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity);
            });

            setUrgentIssues(issues.slice(0, 5));
        } catch (error) {
            console.error('Error fetching urgent issues:', error);
        }
    };

    const fetchTopContributors = async () => {
        try {
            const postsRef = collection(db, 'posts');

            const postsQuery = query(
                postsRef,
                where('type', '==', 'REPORT'),
                orderBy('createdAt', 'desc'),
                limit(100)
            );

            const snapshot = await getDocs(postsQuery);
            const contributorMap = new Map<string, {
                name: string;
                reports: number;
                upvotes: number;
            }>();

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.authorId && !data.isAnonymous) {
                    const existing = contributorMap.get(data.authorId);
                    if (existing) {
                        existing.reports += 1;
                        existing.upvotes += data.engagement?.upvotes || 0;
                    } else {
                        contributorMap.set(data.authorId, {
                            name: data.authorName || 'Anonymous',
                            reports: 1,
                            upvotes: data.engagement?.upvotes || 0,
                        });
                    }
                }
            });

            const contributors: Contributor[] = [];
            let rank = 1;
            contributorMap.forEach((value, key) => {
                contributors.push({
                    id: key,
                    name: value.name,
                    points: value.reports * 10 + value.upvotes * 2,
                    reports: value.reports,
                    avatar: rank <= 3 ? ['🏆', '🥈', '🥉'][rank - 1] : `${rank}`,
                });
                rank++;
            });

            contributors.sort((a, b) => b.points - a.points);

            contributors.forEach((c, i) => {
                c.avatar = i < 3 ? ['🏆', '🥈', '🥉'][i] : `${i + 1}`;
            });

            setTopContributors(contributors.slice(0, 5));
        } catch (error) {
            console.error('Error fetching top contributors:', error);
        }
    };

    const fetchWeeklyData = async () => {
        try {
            const postsRef = collection(db, 'posts');
            const data: WeeklyData[] = [];

            for (let i = 6; i >= 0; i--) {
                const dayStart = new Date();
                dayStart.setDate(dayStart.getDate() - i);
                dayStart.setHours(0, 0, 0, 0);

                const dayEnd = new Date(dayStart);
                dayEnd.setHours(23, 59, 59, 999);

                const reportsQuery = query(
                    postsRef,
                    where('type', '==', 'REPORT'),
                    where('createdAt', '>=', dayStart),
                    where('createdAt', '<=', dayEnd)
                );

                const reportsSnapshot = await getDocs(reportsQuery);
                let resolved = 0;

                reportsSnapshot.docs.forEach(doc => {
                    if (doc.data().status === 'resolved') {
                        resolved++;
                    }
                });

                data.push({
                    day: getDayName(i),
                    reports: reportsSnapshot.size,
                    resolved: resolved,
                });
            }

            setWeeklyData(data);
        } catch (error) {
            console.error('Error fetching weekly data:', error);
        }
    };

    const refreshData = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([
            fetchTodaysSnapshot(),
            fetchUrgentIssues(),
            fetchTopContributors(),
            fetchWeeklyData(),
        ]);
        setRefreshing(false);
    }, []);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([
                fetchTodaysSnapshot(),
                fetchUrgentIssues(),
                fetchTopContributors(),
                fetchWeeklyData(),
            ]);
            setLoading(false);
        };

        loadData();

        const postsRef = collection(db, 'posts');
        const unsubscribe = onSnapshot(
            query(postsRef, orderBy('createdAt', 'desc'), limit(50)),
            () => {
                fetchTodaysSnapshot();
                fetchUrgentIssues();
                fetchTopContributors();
            },
            (error) => {
                console.error('Error listening to posts:', error);
            }
        );

        return () => unsubscribe();
    }, []);

    const maxReports = Math.max(...(weeklyData.length > 0 ? weeklyData.map(d => d.reports) : [1]), 1);

    const StatCard = ({
        icon: Icon,
        iconColor,
        title,
        value,
        change,
        isUp
    }: {
        icon: React.ComponentType<any>;
        iconColor: string;
        title: string;
        value: string | number;
        change: number;
        isUp: boolean;
    }) => (
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.statIconContainer, { backgroundColor: iconColor + '15' }]}>
                <Icon size={20} color={iconColor} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
            <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
            <View style={styles.changeContainer}>
                {isUp ? (
                    <ArrowUp size={12} color={Brand.success} />
                ) : (
                    <ArrowDown size={12} color={Brand.error} />
                )}
                <Text style={[
                    styles.changeText,
                    { color: isUp ? Brand.success : Brand.error }
                ]}>
                    {Math.abs(change)}%
                </Text>
            </View>
        </View>
    );

    const BarChart = () => (
        <View style={styles.chartContainer}>
            <View style={styles.chartBars}>
                {weeklyData.map((item: WeeklyData, index: number) => (
                    <View key={index} style={styles.barGroup}>
                        <View style={styles.barsWrapper}>
                            <View
                                style={[
                                    styles.bar,
                                    styles.reportsBar,
                                    {
                                        height: (item.reports / maxReports) * 80,
                                        backgroundColor: Brand.primary,
                                    }
                                ]}
                            />
                            <View
                                style={[
                                    styles.bar,
                                    styles.resolvedBar,
                                    {
                                        height: (item.resolved / maxReports) * 80,
                                        backgroundColor: Brand.success,
                                    }
                                ]}
                            />
                        </View>
                        <Text style={[styles.barLabel, { color: colors.textMuted }]}>
                            {item.day}
                        </Text>
                    </View>
                ))}
            </View>
            <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: Brand.primary }]} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>Laporan</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: Brand.success }]} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>Selesai</Text>
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Brand.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                        Memuat data...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={refreshData}
                        colors={[Brand.primary]}
                        tintColor={Brand.primary}
                    />
                }
            >
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>Laporan Kota</Text>
                        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                            Jakarta • Hari ini
                        </Text>
                    </View>
                    <View style={[styles.liveIndicator, { backgroundColor: Brand.success + '20' }]}>
                        <View style={styles.liveDot} />
                        <Text style={[styles.liveText, { color: Brand.success }]}>LIVE</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        📊 Ringkasan Hari Ini
                    </Text>
                    <View style={styles.statsGrid}>
                        <StatCard
                            icon={FileText}
                            iconColor={Brand.primary}
                            title="Laporan Baru"
                            value={todaysSnapshot.newReports.value}
                            change={todaysSnapshot.newReports.change}
                            isUp={todaysSnapshot.newReports.isUp}
                        />
                        <StatCard
                            icon={CheckCircle}
                            iconColor={Brand.success}
                            title="Terselesaikan"
                            value={todaysSnapshot.resolved.value}
                            change={todaysSnapshot.resolved.change}
                            isUp={todaysSnapshot.resolved.isUp}
                        />
                        <StatCard
                            icon={Users}
                            iconColor={Brand.info}
                            title="Pengguna Aktif"
                            value={todaysSnapshot.activeUsers.value}
                            change={todaysSnapshot.activeUsers.change}
                            isUp={todaysSnapshot.activeUsers.isUp}
                        />
                        <StatCard
                            icon={Clock}
                            iconColor={Brand.warning}
                            title="Rata-rata Respon"
                            value={todaysSnapshot.avgResponse.value}
                            change={todaysSnapshot.avgResponse.change}
                            isUp={todaysSnapshot.avgResponse.isUp}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            📈 Statistik Mingguan
                        </Text>
                        <TrendingUp size={20} color={Brand.success} />
                    </View>
                    <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
                        <BarChart />
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            🚨 Isu Mendesak
                        </Text>
                        <View style={[styles.urgentBadge, { backgroundColor: Brand.error + '20' }]}>
                            <Text style={[styles.urgentBadgeText, { color: Brand.error }]}>
                                {urgentIssues.length}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.issuesList}>
                        {urgentIssues.length === 0 ? (
                            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    Tidak ada isu mendesak saat ini 🎉
                                </Text>
                            </View>
                        ) : (
                            urgentIssues.map((issue: UrgentIssue) => (
                                <View
                                    key={issue.id}
                                    style={[styles.issueCard, { backgroundColor: colors.surface }]}
                                >
                                    <View style={[
                                        styles.severityIndicator,
                                        { backgroundColor: SEVERITY_COLORS[issue.severity] }
                                    ]} />
                                    <View style={styles.issueContent}>
                                        <Text style={[styles.issueTitle, { color: colors.text }]}>
                                            {issue.title}
                                        </Text>
                                        <Text style={[styles.issueLocation, { color: colors.textSecondary }]}>
                                            📍 {issue.location}
                                        </Text>
                                        <View style={styles.issueMeta}>
                                            <Text style={[styles.issueTime, { color: colors.textMuted }]}>
                                                {issue.reportedAgo} lalu
                                            </Text>
                                            <View style={styles.upvoteContainer}>
                                                <Activity size={12} color={Brand.primary} />
                                                <Text style={[styles.upvoteText, { color: Brand.primary }]}>
                                                    {issue.upvotes}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                    <AlertTriangle
                                        size={20}
                                        color={SEVERITY_COLORS[issue.severity]}
                                    />
                                </View>
                            ))
                        )}
                    </View>
                </View>

                <View style={[styles.section, styles.lastSection]}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            🏆 Top Kontributor
                        </Text>
                        <Trophy size={20} color={Brand.warning} />
                    </View>
                    <View style={[styles.contributorsCard, { backgroundColor: colors.surface }]}>
                        {topContributors.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    Belum ada kontributor
                                </Text>
                            </View>
                        ) : (
                            topContributors.map((contributor: Contributor, index: number) => (
                                <View
                                    key={contributor.id}
                                    style={[
                                        styles.contributorItem,
                                        index !== topContributors.length - 1 && styles.contributorBorder
                                    ]}
                                >
                                    <View style={styles.contributorRank}>
                                        <Text style={styles.rankEmoji}>
                                            {index < 3 ? contributor.avatar : `#${index + 1}`}
                                        </Text>
                                    </View>
                                    <View style={styles.contributorInfo}>
                                        <Text style={[styles.contributorName, { color: colors.text }]}>
                                            {contributor.name}
                                        </Text>
                                        <Text style={[styles.contributorStats, { color: colors.textSecondary }]}>
                                            {contributor.reports} laporan
                                        </Text>
                                    </View>
                                    <View style={styles.pointsBadge}>
                                        <Text style={[styles.pointsText, { color: Brand.primary }]}>
                                            {contributor.points} pts
                                        </Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                </View>
            </ScrollView>
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
        gap: Spacing.md,
    },
    loadingText: {
        fontSize: FontSize.md,
        marginTop: Spacing.sm,
    },
    emptyState: {
        padding: Spacing.xl,
        borderRadius: Radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: FontSize.sm,
        textAlign: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    headerTitle: {
        fontSize: FontSize['2xl'],
        fontWeight: FontWeight.bold,
    },
    headerSubtitle: {
        fontSize: FontSize.sm,
        marginTop: 2,
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: Radius.full,
        gap: 6,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Brand.success,
    },
    liveText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
    },
    section: {
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    lastSection: {
        marginBottom: Spacing['3xl'],
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
        marginBottom: Spacing.md,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    statCard: {
        width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm) / 2,
        padding: Spacing.md,
        borderRadius: Radius.lg,
        ...Shadows.sm,
    },
    statIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    statValue: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
    },
    statTitle: {
        fontSize: FontSize.xs,
        marginTop: 2,
    },
    changeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.xs,
        gap: 2,
    },
    changeText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
    },
    chartCard: {
        padding: Spacing.lg,
        borderRadius: Radius.xl,
        ...Shadows.sm,
    },
    chartContainer: {
        alignItems: 'center',
    },
    chartBars: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        width: '100%',
        height: 100,
        marginBottom: Spacing.md,
    },
    barGroup: {
        alignItems: 'center',
        flex: 1,
    },
    barsWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 2,
    },
    bar: {
        width: 12,
        borderRadius: 4,
        minHeight: 4,
    },
    reportsBar: {},
    resolvedBar: {},
    barLabel: {
        fontSize: FontSize.xs,
        marginTop: Spacing.xs,
    },
    chartLegend: {
        flexDirection: 'row',
        gap: Spacing.lg,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        fontSize: FontSize.xs,
    },
    urgentBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: Radius.full,
    },
    urgentBadgeText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
    },
    issuesList: {
        gap: Spacing.sm,
    },
    issueCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: Radius.lg,
        ...Shadows.sm,
    },
    severityIndicator: {
        width: 4,
        height: '100%',
        borderRadius: 2,
        marginRight: Spacing.md,
    },
    issueContent: {
        flex: 1,
    },
    issueTitle: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
    },
    issueLocation: {
        fontSize: FontSize.sm,
        marginTop: 2,
    },
    issueMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.xs,
        gap: Spacing.md,
    },
    issueTime: {
        fontSize: FontSize.xs,
    },
    upvoteContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    upvoteText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
    },
    contributorsCard: {
        borderRadius: Radius.xl,
        overflow: 'hidden',
        ...Shadows.sm,
    },
    contributorItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
    },
    contributorBorder: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    contributorRank: {
        width: 40,
        alignItems: 'center',
    },
    rankEmoji: {
        fontSize: 20,
    },
    contributorInfo: {
        flex: 1,
        marginLeft: Spacing.sm,
    },
    contributorName: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
    },
    contributorStats: {
        fontSize: FontSize.xs,
        marginTop: 2,
    },
    pointsBadge: {
        backgroundColor: Brand.primary + '15',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: Radius.md,
    },
    pointsText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
    },
});
