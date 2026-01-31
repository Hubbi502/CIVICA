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
import { useAuthStore } from "@/stores/authStore";
import { useLanguageStore } from "@/stores/languageStore";
import { Report, ReportStatus } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { enUS, id as idLocale } from "date-fns/locale";
import { router } from "expo-router";
import {
  CheckCheck,
  CheckCircle,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  MessageCircle,
  Plus,
  ThumbsUp,
  XCircle,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MOCK_REPORTS: Report[] = [
  {
    id: "1",
    authorId: "current_user",
    authorName: "Anda",
    isAnonymous: false,
    content:
      "Ada lubang besar di Jl. Sudirman depan Gedung A. Sudah beberapa hari dan cukup berbahaya untuk pengendara motor.",
    media: [
      { url: "https://picsum.photos/seed/myreport1/400/300", type: "image" },
    ],
    location: {
      address: "Jl. Sudirman No. 10",
      city: "Jakarta",
      district: "Menteng",
      latitude: -6.2,
      longitude: 106.8,
    },
    type: "REPORT",
    classification: {
      category: "REPORT",
      confidence: 0.95,
      severity: "high",
      tags: ["jalan", "lubang"],
      keywords: [],
    },
    engagement: {
      upvotes: 45,
      comments: 12,
      shares: 5,
      watchers: 28,
      views: 230,
    },
    upvotedBy: [],
    watchedBy: [],
    status: "verified",
    severity: "high",
    updates: [],
    verifiedCount: 15,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: "2",
    authorId: "current_user",
    authorName: "Anda",
    isAnonymous: false,
    content:
      "Lampu jalan di depan gang rusak dan mati. Malam hari sangat gelap.",
    media: [
      { url: "https://picsum.photos/seed/myreport2/400/300", type: "image" },
    ],
    location: {
      address: "Jl. Kebon Jeruk",
      city: "Jakarta",
      district: "Kemang",
      latitude: -6.25,
      longitude: 106.81,
    },
    type: "REPORT",
    classification: {
      category: "REPORT",
      confidence: 0.91,
      severity: "medium",
      tags: ["lampu", "penerangan"],
      keywords: [],
    },
    engagement: {
      upvotes: 23,
      comments: 5,
      shares: 2,
      watchers: 10,
      views: 120,
    },
    upvotedBy: [],
    watchedBy: [],
    status: "active",
    severity: "medium",
    updates: [],
    verifiedCount: 8,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: "3",
    authorId: "current_user",
    authorName: "Anda",
    isAnonymous: false,
    content:
      "Sampah menumpuk di tempat sampah umum sudah lebih dari seminggu tidak diangkut.",
    media: [],
    location: {
      address: "Jl. Gatot Subroto",
      city: "Jakarta",
      district: "Kuningan",
      latitude: -6.22,
      longitude: 106.83,
    },
    type: "REPORT",
    classification: {
      category: "REPORT",
      confidence: 0.88,
      severity: "low",
      tags: ["sampah", "kebersihan"],
      keywords: [],
    },
    engagement: { upvotes: 12, comments: 3, shares: 1, watchers: 5, views: 80 },
    upvotedBy: [],
    watchedBy: [],
    status: "resolved",
    severity: "low",
    updates: [],
    verifiedCount: 5,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
];

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

export default function ReportsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const { language } = useLanguageStore();

  const [reports] = useState<Report[]>(MOCK_REPORTS);
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | "all">(
    "all",
  );

  const filteredReports =
    selectedStatus === "all"
      ? reports
      : reports.filter((r) => r.status === selectedStatus);

  const stats = {
    total: reports.length,
    active: reports.filter((r) => r.status === "active").length,
    verified: reports.filter((r) => r.status === "verified").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
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
        <Text style={[styles.statNumber, { color: StatusColors.active }]}>
          {stats.active}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
          {t("active")}
        </Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.statNumber, { color: StatusColors.verified }]}>
          {stats.verified}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
          {t("verifiedStatus")}
        </Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.statNumber, { color: StatusColors.resolved }]}>
          {stats.resolved}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
          {t("resolvedStatus")}
        </Text>
      </View>
    </View>
  );

  const renderReportCard = ({ item }: { item: Report }) => {
    const statusConfig = STATUS_CONFIG[item.status];
    const StatusIcon = statusConfig.icon;

    return (
      <TouchableOpacity
        style={[styles.reportCard, { backgroundColor: colors.surface }]}
        onPress={() => router.push(`/post/${item.id}`)}
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
                  { backgroundColor: statusConfig.color + "15" },
                ]}
              >
                <StatusIcon size={12} color={statusConfig.color} />
                <Text
                  style={[styles.statusText, { color: statusConfig.color }]}
                >
                  {statusConfig.label}
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
              {item.engagement.watchers} {t("following")}
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
        data={filteredReports}
        keyExtractor={(item) => item.id}
        renderItem={renderReportCard}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
});
