import {
  Brand,
  Colors,
  FontSize,
  FontWeight,
  Radius,
  Shadows,
  Spacing,
  StatusColors,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTranslation } from "@/hooks/useTranslation";
import { getPostsByUser } from "@/services/posts";
import { useAuthStore } from "@/stores/authStore";
import { useLanguageStore } from "@/stores/languageStore";
import { Post, PostType, ReportStatus } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
import { router } from "expo-router";
import {
  AlertTriangle,
  CheckCheck,
  CheckCircle,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  MessageCircle,
  Newspaper,
  Plus,
  Sparkles,
  ThumbsUp,
  XCircle
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STATUS_CONFIG: Record<
  ReportStatus,
  { icon: React.ComponentType<any>; label: string; color: string }
> = {
  active: { icon: Clock, label: "Aktif", color: StatusColors.active },
  verified: {
    icon: CheckCircle,
    label: "Terverifikasi",
    color: StatusColors.verified,
  },
  resolved: {
    icon: CheckCheck,
    label: "Selesai",
    color: StatusColors.resolved,
  },
  closed: { icon: XCircle, label: "Ditutup", color: StatusColors.closed },
};

const TYPE_CONFIG: Record<
  PostType,
  { icon: React.ComponentType<any>; label: string; color: string }
> = {
  GENERAL: { icon: Sparkles, label: "Umum", color: "#6B7280" },
  NEWS: { icon: Newspaper, label: "Berita", color: "#3B82F6" },
  REPORT: { icon: AlertTriangle, label: "Laporan", color: "#EF4444" },
};

export default function ReportsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const { language } = useLanguageStore();

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<PostType | "all">("all");

  const fetchPosts = useCallback(async () => {
    if (!user?.id) {
      setPosts([]);
      setIsLoading(false);
      return;
    }

    try {
      const userPosts = await getPostsByUser(user.id);
      setPosts(userPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchPosts();
  }, [fetchPosts]);

  const filteredPosts =
    selectedType === "all"
      ? posts
      : posts.filter((p) => p.type === selectedType);

  const stats = {
    total: posts.length,
    reports: posts.filter((p) => p.type === "REPORT").length,
    news: posts.filter((p) => p.type === "NEWS").length,
    general: posts.filter((p) => p.type === "GENERAL").length,
  };

  const renderStatsCards = () => (
    <View style={styles.statsContainer}>
      <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.statNumber, { color: Brand.primary }]}>
          {stats.total}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
          {t("total")}
        </Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.statNumber, { color: TYPE_CONFIG.REPORT.color }]}>
          {stats.reports}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
          {TYPE_CONFIG.REPORT.label}
        </Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.statNumber, { color: TYPE_CONFIG.GENERAL.color }]}>
          {stats.general}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
          {TYPE_CONFIG.GENERAL.label}
        </Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.statNumber, { color: TYPE_CONFIG.NEWS.color }]}>
          {stats.news}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
          {TYPE_CONFIG.NEWS.label}
        </Text>
      </View>
    </View>
  );

  const renderPostCard = ({ item }: { item: Post }) => {
    const typeConfig = TYPE_CONFIG[item.type] || TYPE_CONFIG.GENERAL;
    const TypeIcon = typeConfig.icon;

    return (
      <TouchableOpacity
        style={[styles.reportCard, { backgroundColor: colors.surface }]}
        onPress={() => router.push({ pathname: '/report/[id]', params: { id: item.id } })}
        activeOpacity={0.7}
      >
        <View style={styles.reportCardContent}>
          {item.media.length > 0 ? (
            <Image
              source={{ uri: item.media[0].url }}
              style={styles.reportImage}
            />
          ) : (
            <View
              style={[
                styles.reportImagePlaceholder,
                { backgroundColor: colors.border },
              ]}
            >
              <FileText size={24} color={colors.textMuted} />
            </View>
          )}

          <View style={styles.reportInfo}>
            <Text
              style={[styles.reportContent, { color: colors.text }]}
              numberOfLines={2}
            >
              {item.content}
            </Text>
            <Text
              style={[styles.reportLocation, { color: colors.textSecondary }]}
            >
              {item.location.district}, {item.location.city}
            </Text>
            <View style={styles.reportMeta}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: typeConfig.color + "15" },
                ]}
              >
                <TypeIcon size={12} color={typeConfig.color} />
                <Text
                  style={[styles.statusText, { color: typeConfig.color }]}
                >
                  {typeConfig.label}
                </Text>
              </View>
              <Text style={[styles.reportTime, { color: colors.textMuted }]}>
                {formatDistanceToNow(item.createdAt, {
                  addSuffix: true,
                  locale: language === "id" ? idLocale : enUS,
                })}
              </Text>
            </View>
          </View>

          <ChevronRight size={20} color={colors.icon} />
        </View>

        <View
          style={[styles.reportStats, { borderTopColor: colors.borderLight }]}
        >
          <View style={styles.reportStatItem}>
            <ThumbsUp size={12} color={colors.textSecondary} />
            <Text
              style={[styles.reportStatText, { color: colors.textSecondary }]}
            >
              {item.engagement.upvotes}
            </Text>
          </View>
          <View style={styles.reportStatItem}>
            <MessageCircle size={12} color={colors.textSecondary} />
            <Text
              style={[styles.reportStatText, { color: colors.textSecondary }]}
            >
              {item.engagement.comments}
            </Text>
          </View>
          <View style={styles.reportStatItem}>
            <Eye size={12} color={colors.textSecondary} />
            <Text
              style={[styles.reportStatText, { color: colors.textSecondary }]}
            >
              {item.engagement.views} {t("views")}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <FileText size={48} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {t("noReports")}
      </Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {t("startReporting")}
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => router.push("/post/create")}
      >
        <Plus size={20} color="#FFFFFF" />
        <Text style={styles.emptyButtonText}>{t("createReport")}</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t("myReports")}
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t("myReports")}
        </Text>
      </View>

      {renderStatsCards()}

      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderPostCard}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[Brand.primary]}
            tintColor={Brand.primary}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize["2xl"],
    fontWeight: FontWeight.bold,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: "center",
    ...Shadows.sm,
  },
  statNumber: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  statLabel: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing["3xl"],
  },
  reportCard: {
    borderRadius: Radius.xl,
    marginBottom: Spacing.md,
    overflow: "hidden",
    ...Shadows.md,
  },
  reportCardContent: {
    flexDirection: "row",
    padding: Spacing.md,
    alignItems: "center",
  },
  reportImage: {
    width: 60,
    height: 60,
    borderRadius: Radius.md,
  },
  reportImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  reportInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  reportContent: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    lineHeight: 18,
  },
  reportLocation: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  reportMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    gap: 4,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  reportTime: {
    fontSize: FontSize.xs,
  },
  reportStats: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    gap: Spacing.lg,
  },
  reportStatText: {
    fontSize: FontSize.xs,
  },
  reportStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.md,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Brand.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
