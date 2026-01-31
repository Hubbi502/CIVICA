import {
  Brand,
  Colors,
  FontSize,
  FontWeight,
  LevelColors,
  Radius,
  Shadows,
  Spacing,
} from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTranslation } from "@/hooks/useTranslation";
import { uploadAvatar } from "@/services/storage";
import { useAuthStore } from "@/stores/authStore";
import { LEVEL_CONFIG } from "@/services/gamification";
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from "expo-router";
import {
  Award,
  Camera,
  CheckCircle,
  ChevronRight,
  FileText,
  Flame,
  Handshake,
  LogOut,
  MapPin,
  PenLine,
  Settings,
  ShieldCheck,
  Star,
  ThumbsUp,
  Trophy
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BADGES = [
  { id: "1", name: "Pemula", Icon: Star, color: "#FBBF24", unlocked: true },
  { id: "2", name: "Pelapor", Icon: PenLine, color: "#3B82F6", unlocked: true },
  {
    id: "3",
    name: "Terverifikasi",
    Icon: ShieldCheck,
    color: "#10B981",
    unlocked: true,
  },
  {
    id: "4",
    name: "Penolong",
    Icon: Handshake,
    color: "#8B5CF6",
    unlocked: false,
  },
  { id: "5", name: "Top 10", Icon: Trophy, color: "#F59E0B", unlocked: false },
  { id: "6", name: "Streak 7", Icon: Flame, color: "#EF4444", unlocked: false },
];


export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { user, signOut, updateProfile, refreshProfile } = useAuthStore();
  const { t } = useTranslation();
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, [])
  );

  const stats = user?.stats || {
    totalReports: 0,
    totalUpvotes: 0,
    resolvedIssues: 0,
    points: 0,
    level: "bronze" as const,
  };

  const levelInfo = LEVEL_CONFIG[stats.level];
  const progress = Math.min((stats.points / levelInfo.target) * 100, 100);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleEditAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0].uri) {
        setIsUpdatingAvatar(true);
        try {
          // Upload to storage
          const downloadUrl = await uploadAvatar(result.assets[0].uri, user?.id || 'unknown');

          // Update user profile
          await updateProfile({ avatarUrl: downloadUrl });

          Alert.alert(t('success'), t('profileUpdated'));
        } catch (error) {
          console.error("Error updating avatar:", error);
          Alert.alert(t('error'), t('failedToUpdateProfile'));
        } finally {
          setIsUpdatingAvatar(false);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert(t('error'), t('failedToPickImage'));
    }
  };

  const SettingsItem = ({
    icon: Icon,
    label,
    onPress,
    showBadge = false,
  }: {
    icon: React.ComponentType<any>;
    label: string;
    onPress: () => void;
    showBadge?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.settingsItem, { backgroundColor: colors.surface }]}
      onPress={onPress}
    >
      <View style={styles.settingsItemLeft}>
        <Icon size={20} color={colors.icon} />
        <Text style={[styles.settingsItemText, { color: colors.text }]}>
          {label}
        </Text>
      </View>
      <View style={styles.settingsItemRight}>
        {showBadge && <View style={styles.notificationDot} />}
        <ChevronRight size={20} color={colors.icon} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t("profile")}
          </Text>
          <TouchableOpacity onPress={() => router.push("/settings" as any)}>
            <Settings size={24} color={colors.icon} />
          </TouchableOpacity>
        </View>

        <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatar, { backgroundColor: Brand.primary }]}>
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarText}>
                  {user?.displayName?.charAt(0).toUpperCase() || "U"}
                </Text>
              )}

              {/* Loading overlay */}
              {isUpdatingAvatar && (
                <View style={[styles.loadingOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                </View>
              )}

              {/* Edit button */}
              <TouchableOpacity
                style={[styles.editAvatarButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={handleEditAvatar}
                disabled={isUpdatingAvatar}
              >
                <Camera size={14} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {user?.displayName || "Civican"}
              </Text>
              <View style={styles.locationRow}>
                <MapPin size={14} color={colors.textSecondary} />
                <Text
                  style={[styles.locationText, { color: colors.textSecondary }]}
                >
                  {user?.location?.district}, {user?.location?.city}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.levelSection}>
            <View style={styles.levelHeader}>
              <View
                style={[
                  styles.levelBadge,
                  { backgroundColor: LevelColors[stats.level] + "20" },
                ]}
              >
                <Award size={16} color={LevelColors[stats.level]} />
                <Text
                  style={[
                    styles.levelText,
                    { color: LevelColors[stats.level] },
                  ]}
                >
                  {levelInfo.label}
                </Text>
              </View>
              <Text
                style={[styles.pointsText, { color: colors.textSecondary }]}
              >
                {stats.points} / {levelInfo.target} pts
              </Text>
            </View>
            <View
              style={[styles.progressBar, { backgroundColor: colors.border }]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                    backgroundColor: LevelColors[stats.level],
                  },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <FileText size={24} color={Brand.primary} />
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {stats.totalReports}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t("reportsCount")}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <ThumbsUp size={24} color={Brand.success} />
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {stats.totalUpvotes}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t("upvotesCount")}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <CheckCircle size={24} color={Brand.warning} />
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {stats.resolvedIssues}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t("resolved")}
            </Text>
          </View>
        </View>

        <View style={[styles.badgesCard, { backgroundColor: colors.surface }]}>
          <View style={styles.badgesHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t("badges")}
            </Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: Brand.primary }]}>
                {t("seeAll")}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.badgesGrid}>
            {BADGES.map((badge) => (
              <View
                key={badge.id}
                style={[
                  styles.badgeItem,
                  !badge.unlocked && styles.badgeLocked,
                ]}
              >
                <View
                  style={[
                    styles.badgeIconContainer,
                    {
                      backgroundColor: badge.unlocked
                        ? badge.color + "20"
                        : colors.border,
                    },
                  ]}
                >
                  <badge.Icon
                    size={24}
                    color={badge.unlocked ? badge.color : colors.textMuted}
                  />
                </View>
                <Text
                  style={[
                    styles.badgeName,
                    { color: badge.unlocked ? colors.text : colors.textMuted },
                  ]}
                >
                  {badge.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View
          style={[styles.impactCard, { backgroundColor: Brand.primary + "10" }]}
        >
          <View style={styles.impactHeader}>
            <Star size={20} color={Brand.primary} fill={Brand.primary} />
            <Text style={[styles.impactTitle, { color: Brand.primary }]}>
              {t("yourImpact")}
            </Text>
          </View>
          <Text style={[styles.impactText, { color: colors.text }]}>
            {t("impactText")}{" "}
            <Text style={{ fontWeight: FontWeight.bold }}>
              {stats.resolvedIssues} {t("problemsResolved")}
            </Text>{" "}
            {t("andYourPosts")}{" "}
            <Text style={{ fontWeight: FontWeight.bold }}>1,245</Text>{" "}
            {t("people")}
          </Text>
        </View>



        <TouchableOpacity
          style={[styles.signOutButton, { borderColor: Brand.error }]}
          onPress={handleSignOut}
        >
          <LogOut size={20} color={Brand.error} />
          <Text style={[styles.signOutText, { color: Brand.error }]}>
            {t("signOut")}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            CIVICA v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize["2xl"],
    fontWeight: FontWeight.bold,
  },
  profileCard: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    ...Shadows.md,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 32,
  },
  avatarText: {
    fontSize: FontSize["2xl"],
    fontWeight: FontWeight.bold,
    color: "#FFFFFF",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 32,
    zIndex: 1,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    zIndex: 2,
    ...Shadows.sm,
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  profileName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  locationText: {
    fontSize: FontSize.sm,
  },
  levelSection: {},
  levelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 4,
  },
  levelText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  pointsText: {
    fontSize: FontSize.sm,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
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
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  badgesCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    ...Shadows.sm,
  },
  badgesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  seeAllText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  badgeItem: {
    width: "30%",
    alignItems: "center",
    padding: Spacing.sm,
  },
  badgeLocked: {
    opacity: 0.4,
  },
  badgeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeName: {
    fontSize: FontSize.xs,
    marginTop: 4,
    textAlign: "center",
  },
  impactCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
  },
  impactHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  impactTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  impactText: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  settingsSection: {
    marginTop: Spacing.xl,
  },
  settingsGroup: {
    marginTop: Spacing.md,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    overflow: "hidden",
  },
  settingsItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  settingsItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  settingsItemText: {
    fontSize: FontSize.md,
  },
  settingsItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Brand.error,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  signOutText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  footer: {
    alignItems: "center",
    marginVertical: Spacing.xl,
  },
  footerText: {
    fontSize: FontSize.xs,
  },
});
