import {
    Brand,
    Colors,
    FontSize,
    FontWeight,
    Radius,
    SeverityColors,
    Spacing,
} from "@/constants/theme";
import { db } from "@/FirebaseConfig";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    addComment,
    deleteComment,
    getComments,
    reportComment,
    toggleCommentLike,
    updateComment,
} from "@/services/comments";
import {
    deletePost,
    toggleDownvote,
    toggleUpvote,
    toggleWatch,
} from "@/services/posts";
import { useAuthStore } from "@/stores/authStore";
import { Comment, Post } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { router, useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import {
    AlertTriangle,
    ArrowDown,
    ArrowLeft,
    ArrowUp,
    Bookmark,
    CheckCircle,
    Clock,
    CornerDownLeft,
    Edit2,
    Eye,
    Heart,
    MapPin,
    MessageCircle,
    MoreVertical,
    Send,
    Share2,
    Trash2,
    X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface PostDetail extends Post {
  status?: "active" | "verified" | "resolved" | "closed";
  severity?: "low" | "medium" | "high" | "critical";
  updates?: {
    id: string;
    authorName: string;
    content: string;
    media?: { url: string; type: string }[];
    createdAt: Date;
  }[];
  verifiedCount?: number;
}

export default function PostDetailScreen() {
  const { id: postId, openComment } = useLocalSearchParams<{
    id: string;
    openComment?: string;
  }>();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { user } = useAuthStore();
  const scrollViewRef = React.useRef<ScrollView>(null);

  const [post, setPost] = useState<PostDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [isDownvoted, setIsDownvoted] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const [showCommentOptionsModal, setShowCommentOptionsModal] = useState(false);

  // Comments state - auto-open if navigated with openComment query param
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showComments, setShowComments] = useState(openComment === "true");
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

  // Auto-scroll to comment input when openComment is true
  useEffect(() => {
    if (openComment === "true" && !isLoading) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  }, [openComment, isLoading]);

  // Toggle comments and scroll to bottom
  const handleToggleComments = () => {
    const newShowComments = !showComments;
    setShowComments(newShowComments);
    if (newShowComments) {
      // Wait for the comments section to render, then scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return;

      try {
        setIsLoading(true);
        const postRef = doc(db, "posts", postId);
        const postSnap = await getDoc(postRef);

        if (postSnap.exists()) {
          const data = postSnap.data();
          const postData = {
            id: postSnap.id,
            authorId: data.authorId,
            authorName: data.authorName,
            authorAvatar: data.authorAvatar,
            isAnonymous: data.isAnonymous,
            content: data.content,
            media: data.media || [],
            location: data.location || { district: "", city: "", address: "" },
            type: data.type,
            classification: data.classification,
            engagement: data.engagement || {
              upvotes: 0,
              downvotes: 0,
              comments: 0,
              shares: 0,
              watchers: 0,
              views: 0,
            },
            upvotedBy: data.upvotedBy || [],
            downvotedBy: data.downvotedBy || [],
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
          } as PostDetail;

          setPost(postData);

          // Set initial vote/watch states based on current user
          if (user?.id) {
            setIsUpvoted(postData.upvotedBy.includes(user.id));
            setIsDownvoted(postData.downvotedBy?.includes(user.id) || false);
            setIsWatching(postData.watchedBy.includes(user.id));
          }

          // Fetch comments
          const fetchedComments = await getComments(postId);
          setComments(fetchedComments);
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [postId, user?.id]);

  const performDelete = async () => {
    try {
      setIsLoading(true);
      await deletePost(postId);
      setShowDeleteModal(false);
      if (Platform.OS === "web") {
        router.navigate("/(tabs)");
      } else {
        Alert.alert("Berhasil", "Post berhasil dihapus", [
          { text: "OK", onPress: () => router.navigate("/(tabs)") },
        ]);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      Alert.alert("Error", "Gagal menghapus post");
      setIsLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleOptions = () => {
    setShowOptionsModal(true);
  };

  const handleUpvote = async () => {
    if (!user?.id || !postId) return;
    try {
      const nowUpvoted = await toggleUpvote(postId, user.id);
      setIsUpvoted(nowUpvoted);
      if (nowUpvoted) setIsDownvoted(false); // Mutually exclusive
      // Update local engagement count
      setPost((prev) =>
        prev
          ? {
              ...prev,
              engagement: {
                ...prev.engagement,
                upvotes: nowUpvoted
                  ? prev.engagement.upvotes + 1
                  : prev.engagement.upvotes - 1,
                downvotes:
                  nowUpvoted && isDownvoted
                    ? prev.engagement.downvotes - 1
                    : prev.engagement.downvotes,
              },
            }
          : null,
      );
    } catch (error) {
      console.error("Error toggling upvote:", error);
    }
  };

  const handleDownvote = async () => {
    if (!user?.id || !postId) return;
    try {
      const nowDownvoted = await toggleDownvote(postId, user.id);
      setIsDownvoted(nowDownvoted);
      if (nowDownvoted) setIsUpvoted(false); // Mutually exclusive
      // Update local engagement count
      setPost((prev) =>
        prev
          ? {
              ...prev,
              engagement: {
                ...prev.engagement,
                downvotes: nowDownvoted
                  ? (prev.engagement.downvotes || 0) + 1
                  : (prev.engagement.downvotes || 0) - 1,
                upvotes:
                  nowDownvoted && isUpvoted
                    ? prev.engagement.upvotes - 1
                    : prev.engagement.upvotes,
              },
            }
          : null,
      );
    } catch (error) {
      console.error("Error toggling downvote:", error);
    }
  };

  const handleWatch = async () => {
    if (!user?.id || !postId) return;
    try {
      const nowWatching = await toggleWatch(postId, user.id);
      setIsWatching(nowWatching);
      // Update local engagement count
      setPost((prev) =>
        prev
          ? {
              ...prev,
              engagement: {
                ...prev.engagement,
                watchers: nowWatching
                  ? prev.engagement.watchers + 1
                  : prev.engagement.watchers - 1,
              },
            }
          : null,
      );
    } catch (error) {
      console.error("Error toggling watch:", error);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user?.id) return;

    // Optimistic update
    setComments((prevComments) =>
      prevComments.map((c) => {
        if (c.id === commentId) {
          const isLiked = c.likedBy.includes(user.id);
          return {
            ...c,
            likes: isLiked ? c.likes - 1 : c.likes + 1,
            likedBy: isLiked
              ? c.likedBy.filter((id) => id !== user.id)
              : [...c.likedBy, user.id],
          };
        }
        return c;
      }),
    );

    try {
      await toggleCommentLike(commentId, user.id);
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert logic could go here, or just refresh
      if (postId) {
        const fetchedComments = await getComments(postId);
        setComments(fetchedComments);
      }
    }
  };

  const handleAddComment = async () => {
    if (!user?.id || !postId || !newComment.trim()) return;
    try {
      setIsSubmittingComment(true);
      await addComment(
        postId,
        user.id,
        user.displayName || "User",
        user.avatarUrl,
        newComment.trim(),
        replyingTo?.id, // Pass parentId if replying
      );
      setNewComment("");
      setReplyingTo(null); // Clear reply state
      // Refresh comments
      const fetchedComments = await getComments(postId);
      setComments(fetchedComments);
      // Update engagement count
      setPost((prev) =>
        prev
          ? {
              ...prev,
              engagement: {
                ...prev.engagement,
                comments: prev.engagement.comments + 1,
              },
            }
          : null,
      );
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Error", "Gagal menambahkan komentar");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReply = (comment: Comment) => {
    setReplyingTo(comment);
    setShowComments(true);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const isCommentEditable = (createdAt: Date) => {
    const now = new Date();
    const diffInMinutes = (now.getTime() - createdAt.getTime()) / 1000 / 60;
    return diffInMinutes <= 3;
  };

  const handleCommentOptions = (comment: Comment) => {
    setActiveCommentId(comment.id);
    setShowCommentOptionsModal(true);
  };

  const handleEditComment = () => {
    const comment = comments.find((c) => c.id === activeCommentId);
    if (comment) {
      setEditingCommentId(comment.id);
      setEditCommentContent(comment.content);
    }
    setShowCommentOptionsModal(false);
  };

  const handleSaveEditComment = async () => {
    if (!editingCommentId || !editCommentContent.trim()) return;

    try {
      await updateComment(editingCommentId, editCommentContent.trim());
      setComments((prev) =>
        prev.map((c) =>
          c.id === editingCommentId
            ? { ...c, content: editCommentContent.trim() }
            : c,
        ),
      );
      setEditingCommentId(null);
      setEditCommentContent("");
    } catch (error) {
      Alert.alert("Error", "Gagal mengedit komentar");
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditCommentContent("");
  };

  const handleReportCommentAction = async () => {
    if (activeCommentId) {
      try {
        await reportComment(activeCommentId, "Reported by user");
        Alert.alert(
          "Info",
          "Laporan diterima. Kami akan meninjau komentar ini.",
        );
      } catch (error) {
        Alert.alert("Error", "Gagal melaporkan komentar");
      }
    }
    setShowCommentOptionsModal(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!postId) return;
    try {
      await deleteComment(commentId, postId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      // Update engagement count
      setPost((prev) =>
        prev
          ? {
              ...prev,
              engagement: {
                ...prev.engagement,
                comments: prev.engagement.comments - 1,
              },
            }
          : null,
      );
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const renderCommentOptionsModal = () => {
    const comment = comments.find((c) => c.id === activeCommentId);
    if (!comment) return null;

    const isCommentAuthor = user?.id === comment.authorId;
    const canEdit = isCommentAuthor && isCommentEditable(comment.createdAt);

    return (
      <Modal
        visible={showCommentOptionsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCommentOptionsModal(false)}
      >
        <View
          style={[
            styles.bottomSheetOverlay,
            { backgroundColor: "rgba(0,0,0,0.5)" },
          ]}
        >
          <TouchableOpacity
            style={styles.overlayPressable}
            onPress={() => setShowCommentOptionsModal(false)}
          />
          <View
            style={[
              styles.bottomSheetContent,
              { backgroundColor: colors.surface },
            ]}
          >
            <View
              style={[styles.dragHandle, { backgroundColor: colors.border }]}
            />

            <Text style={[styles.bottomSheetTitle, { color: colors.text }]}>
              Pilihan Komentar
            </Text>

            {canEdit && (
              <TouchableOpacity
                style={[styles.menuItem, { borderBottomColor: colors.border }]}
                onPress={handleEditComment}
              >
                <Edit2 size={20} color={colors.text} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>
                  Edit Komentar
                </Text>
              </TouchableOpacity>
            )}

            {!isCommentAuthor && (
              <TouchableOpacity
                style={[styles.menuItem, { borderBottomColor: colors.border }]}
                onPress={handleReportCommentAction}
              >
                <AlertTriangle size={20} color={Brand.warning || "#F59E0B"} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>
                  Laporkan Komentar
                </Text>
              </TouchableOpacity>
            )}

            {isCommentAuthor && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowCommentOptionsModal(false);
                  handleDeleteComment(comment.id);
                }}
              >
                <Trash2 size={20} color={Brand.error || "#FF3B30"} />
                <Text
                  style={[
                    styles.menuItemText,
                    { color: Brand.error || "#FF3B30" },
                  ]}
                >
                  Hapus Komentar
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.closeButton,
                { backgroundColor: colors.surfaceSecondary },
              ]}
              onPress={() => setShowCommentOptionsModal(false)}
            >
              <Text style={[styles.closeButtonText, { color: colors.text }]}>
                Batal
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderDeleteModal = () => {
    return (
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <AlertTriangle size={24} color={Brand.error || "#FF3B30"} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Hapus Post
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowDeleteModal(false)}>
                <X size={24} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <Text
              style={[styles.modalMessage, { color: colors.textSecondary }]}
            >
              Apakah Anda yakin ingin menghapus post ini? Tindakan ini tidak
              dapat dibatalkan.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                  Batal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.deleteButton,
                  isLoading && styles.buttonDisabled,
                ]}
                onPress={performDelete}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.deleteButtonText}>Hapus</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderOptionsModal = () => {
    return (
      <Modal
        visible={showOptionsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <View
          style={[
            styles.bottomSheetOverlay,
            { backgroundColor: "rgba(0,0,0,0.5)" },
          ]}
        >
          <TouchableOpacity
            style={styles.overlayPressable}
            onPress={() => setShowOptionsModal(false)}
          />
          <View
            style={[
              styles.bottomSheetContent,
              { backgroundColor: colors.surface },
            ]}
          >
            <View
              style={[styles.dragHandle, { backgroundColor: colors.border }]}
            />

            <Text style={[styles.bottomSheetTitle, { color: colors.text }]}>
              Pilihan Post
            </Text>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                setShowOptionsModal(false);
                router.push(`/post/edit/${postId}`);
              }}
            >
              <Edit2 size={20} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>
                Edit Post
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowOptionsModal(false);
                setTimeout(() => setShowDeleteModal(true), 300); // Small delay for animation
              }}
            >
              <Trash2 size={20} color={Brand.error || "#FF3B30"} />
              <Text
                style={[
                  styles.menuItemText,
                  { color: Brand.error || "#FF3B30" },
                ]}
              >
                Hapus Post
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.closeButton,
                { backgroundColor: colors.surfaceSecondary },
              ]}
              onPress={() => setShowOptionsModal(false)}
            >
              <Text style={[styles.closeButtonText, { color: colors.text }]}>
                Batal
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  if (isLoading && !showDeleteModal && !showOptionsModal) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Detail Laporan
          </Text>
          <View style={styles.headerActions} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Brand.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Detail Laporan
          </Text>
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

  const isAuthor = user?.id === post.authorId;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Detail Laporan
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setIsSaved(!isSaved)}>
              <Bookmark
                size={24}
                color={isSaved ? Brand.primary : colors.icon}
                fill={isSaved ? Brand.primary : "transparent"}
              />
            </TouchableOpacity>
            <TouchableOpacity>
              <Share2 size={24} color={colors.icon} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.authorRow}>
              <View style={[styles.avatar, { backgroundColor: Brand.primary }]}>
                <Text style={styles.avatarText}>
                  {post.authorName.charAt(0)}
                </Text>
              </View>
              <View style={styles.authorInfo}>
                <Text style={[styles.authorName, { color: colors.text }]}>
                  {post.authorName}
                </Text>
                <View style={styles.metaRow}>
                  <Clock size={12} color={colors.textMuted} />
                  <Text style={[styles.metaText, { color: colors.textMuted }]}>
                    {formatDistanceToNow(post.createdAt, {
                      addSuffix: true,
                      locale: id,
                    })}
                  </Text>
                </View>
              </View>

              {isAuthor && (
                <TouchableOpacity
                  onPress={handleOptions}
                  style={styles.optionsButton}
                >
                  <MoreVertical size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={[styles.content, { color: colors.text }]}>
              {post.content}
            </Text>

            {post.media.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.imagesContainer}
              >
                {post.media.map((media, index) => (
                  <Image
                    key={index}
                    source={{ uri: media.url }}
                    style={styles.postImage}
                  />
                ))}
              </ScrollView>
            )}

            <View
              style={[
                styles.locationCard,
                { backgroundColor: colors.surfaceSecondary },
              ]}
            >
              <MapPin size={16} color={Brand.primary} />
              <Text style={[styles.locationText, { color: colors.text }]}>
                {post.location.address}
              </Text>
            </View>

            {post.severity && (
              <View style={styles.severityRow}>
                <AlertTriangle
                  size={16}
                  color={SeverityColors[post.severity!]}
                />
                <Text
                  style={[
                    styles.severityLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Tingkat Keparahan:
                </Text>
                <View
                  style={[
                    styles.severityBadge,
                    { backgroundColor: SeverityColors[post.severity!] + "15" },
                  ]}
                >
                  <Text
                    style={[
                      styles.severityText,
                      { color: SeverityColors[post.severity!] },
                    ]}
                  >
                    {post.severity === "low"
                      ? "Ringan"
                      : post.severity === "medium"
                        ? "Sedang"
                        : post.severity === "high"
                          ? "Tinggi"
                          : "Kritis"}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View style={[styles.statsRow, { backgroundColor: colors.surface }]}>
            <View style={styles.statItem}>
              <ArrowUp size={18} color={colors.textSecondary} />
              <Text style={[styles.statText, { color: colors.text }]}>
                {post.engagement.upvotes}
              </Text>
            </View>
            <View style={styles.statItem}>
              <MessageCircle size={18} color={colors.textSecondary} />
              <Text style={[styles.statText, { color: colors.text }]}>
                {post.engagement.comments}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Eye size={18} color={colors.textSecondary} />
              <Text style={[styles.statText, { color: colors.text }]}>
                {post.engagement.watchers} mengikuti
              </Text>
            </View>
            {post.type === "REPORT" && (
              <View style={styles.statItem}>
                <CheckCircle size={18} color={Brand.success} />
                <Text style={[styles.statText, { color: colors.text }]}>
                  {post.verifiedCount} verifikasi
                </Text>
              </View>
            )}
          </View>

          {/* Comments Section - Always Visible */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Komentar ({comments.length})
              </Text>
            </View>

            {comments.length === 0 ? (
              <Text
                style={[styles.noCommentsText, { color: colors.textMuted }]}
              >
                Belum ada komentar. Jadilah yang pertama!
              </Text>
            ) : (
              <>
                {/* Parent comments (no parentId) */}
                {comments
                  .filter((c) => !c.parentId)
                  .map((comment) => (
                    <View key={comment.id}>
                      <View
                        style={[
                          styles.commentItem,
                          { borderBottomColor: colors.border },
                        ]}
                      >
                        {comment.authorAvatar ? (
                          <Image
                            source={{ uri: comment.authorAvatar }}
                            style={styles.commentAvatar}
                          />
                        ) : (
                          <View
                            style={[
                              styles.commentAvatar,
                              { backgroundColor: Brand.primary },
                            ]}
                          >
                            <Text style={styles.commentAvatarText}>
                              {comment.authorName.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <View style={styles.commentContent}>
                          <View style={styles.commentHeader}>
                            <View style={{ flex: 1 }}>
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                }}
                              >
                                <Text
                                  style={[
                                    styles.commentAuthor,
                                    { color: colors.text },
                                  ]}
                                >
                                  {comment.authorName}
                                </Text>
                                <Text
                                  style={[
                                    styles.commentTime,
                                    { color: colors.textMuted },
                                  ]}
                                >
                                  {formatDistanceToNow(comment.createdAt, {
                                    addSuffix: true,
                                    locale: id,
                                  })}
                                </Text>
                              </View>
                            </View>
                            <TouchableOpacity
                              onPress={() => handleCommentOptions(comment)}
                            >
                              <MoreVertical
                                size={16}
                                color={colors.textMuted}
                              />
                            </TouchableOpacity>
                          </View>

                          {editingCommentId === comment.id ? (
                            <View style={styles.editContainer}>
                              <TextInput
                                style={[
                                  styles.editInput,
                                  {
                                    color: colors.text,
                                    borderColor: colors.border,
                                    backgroundColor: colors.surfaceSecondary,
                                  },
                                ]}
                                value={editCommentContent}
                                onChangeText={setEditCommentContent}
                                multiline
                                autoFocus
                              />
                              <View style={styles.editActions}>
                                <TouchableOpacity
                                  onPress={handleCancelEdit}
                                  style={styles.editCancelBtn}
                                >
                                  <Text
                                    style={[
                                      styles.editBtnText,
                                      { color: colors.textSecondary },
                                    ]}
                                  >
                                    Batal
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={handleSaveEditComment}
                                  style={styles.editSaveBtn}
                                >
                                  <Text
                                    style={[
                                      styles.editBtnText,
                                      { color: Brand.primary },
                                    ]}
                                  >
                                    Simpan
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          ) : (
                            <Text
                              style={[
                                styles.commentText,
                                { color: colors.textSecondary },
                              ]}
                            >
                              {comment.content}
                            </Text>
                          )}

                          <View style={styles.commentActions}>
                            <TouchableOpacity
                              style={styles.commentLikeBtn}
                              onPress={() => handleLikeComment(comment.id)}
                            >
                              <Heart
                                size={14}
                                color={
                                  comment.likedBy?.includes(user?.id || "")
                                    ? Brand.error
                                    : colors.textMuted
                                }
                                fill={
                                  comment.likedBy?.includes(user?.id || "")
                                    ? Brand.error
                                    : "transparent"
                                }
                              />
                              <Text
                                style={[
                                  styles.commentLikeCount,
                                  { color: colors.textMuted },
                                ]}
                              >
                                {comment.likes}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.commentReplyBtn}
                              onPress={() => handleReply(comment)}
                            >
                              <CornerDownLeft size={14} color={Brand.primary} />
                              <Text
                                style={[
                                  styles.commentReplyText,
                                  { color: Brand.primary },
                                ]}
                              >
                                Balas
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>

                      {/* Nested replies */}
                      {comments
                        .filter((r) => r.parentId === comment.id)
                        .map((reply) => (
                          <View
                            key={reply.id}
                            style={[
                              styles.commentItem,
                              styles.replyItem,
                              { borderBottomColor: colors.border },
                            ]}
                          >
                            {reply.authorAvatar ? (
                              <Image
                                source={{ uri: reply.authorAvatar }}
                                style={[
                                  styles.commentAvatar,
                                  styles.replyAvatar,
                                ]}
                              />
                            ) : (
                              <View
                                style={[
                                  styles.commentAvatar,
                                  styles.replyAvatar,
                                  { backgroundColor: Brand.accent },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.commentAvatarText,
                                    { fontSize: 10 },
                                  ]}
                                >
                                  {reply.authorName.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                            )}
                            <View style={styles.commentContent}>
                              <View style={styles.commentHeader}>
                                <View style={{ flex: 1 }}>
                                  <View
                                    style={{
                                      flexDirection: "row",
                                      alignItems: "center",
                                    }}
                                  >
                                    <Text
                                      style={[
                                        styles.commentAuthor,
                                        { color: colors.text, fontSize: 12 },
                                      ]}
                                    >
                                      {reply.authorName}
                                    </Text>
                                    <Text
                                      style={[
                                        styles.commentTime,
                                        { color: colors.textMuted },
                                      ]}
                                    >
                                      {formatDistanceToNow(reply.createdAt, {
                                        addSuffix: true,
                                        locale: id,
                                      })}
                                    </Text>
                                  </View>
                                </View>
                                <TouchableOpacity
                                  onPress={() => handleCommentOptions(reply)}
                                >
                                  <MoreVertical
                                    size={14}
                                    color={colors.textMuted}
                                  />
                                </TouchableOpacity>
                              </View>

                              {editingCommentId === reply.id ? (
                                <View style={styles.editContainer}>
                                  <TextInput
                                    style={[
                                      styles.editInput,
                                      {
                                        color: colors.text,
                                        borderColor: colors.border,
                                        backgroundColor:
                                          colors.surfaceSecondary,
                                        fontSize: 13,
                                      },
                                    ]}
                                    value={editCommentContent}
                                    onChangeText={setEditCommentContent}
                                    multiline
                                    autoFocus
                                  />
                                  <View style={styles.editActions}>
                                    <TouchableOpacity
                                      onPress={handleCancelEdit}
                                      style={styles.editCancelBtn}
                                    >
                                      <Text
                                        style={[
                                          styles.editBtnText,
                                          { color: colors.textSecondary },
                                        ]}
                                      >
                                        Batal
                                      </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      onPress={handleSaveEditComment}
                                      style={styles.editSaveBtn}
                                    >
                                      <Text
                                        style={[
                                          styles.editBtnText,
                                          { color: Brand.primary },
                                        ]}
                                      >
                                        Simpan
                                      </Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              ) : (
                                <Text
                                  style={[
                                    styles.commentText,
                                    {
                                      color: colors.textSecondary,
                                      fontSize: 13,
                                    },
                                  ]}
                                >
                                  {reply.content}
                                </Text>
                              )}

                              <View style={styles.commentActions}>
                                <TouchableOpacity
                                  style={styles.commentLikeBtn}
                                  onPress={() => handleLikeComment(reply.id)}
                                >
                                  <Heart
                                    size={12}
                                    color={
                                      reply.likedBy?.includes(user?.id || "")
                                        ? Brand.error
                                        : colors.textMuted
                                    }
                                    fill={
                                      reply.likedBy?.includes(user?.id || "")
                                        ? Brand.error
                                        : "transparent"
                                    }
                                  />
                                  <Text
                                    style={[
                                      styles.commentLikeCount,
                                      { color: colors.textMuted },
                                    ]}
                                  >
                                    {reply.likes}
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        ))}
                    </View>
                  ))}
              </>
            )}

            {/* Comment Input - Only shown when pressing comment button */}
            {showComments && (
              <View
                style={[
                  styles.commentInputContainer,
                  { borderTopColor: colors.border },
                ]}
              >
                {/* Reply indicator */}
                {replyingTo && (
                  <View
                    style={[
                      styles.replyIndicator,
                      { backgroundColor: colors.surfaceSecondary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.replyIndicatorText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Membalas {replyingTo.authorName}
                    </Text>
                    <TouchableOpacity onPress={cancelReply}>
                      <X size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                )}
                <View style={styles.commentInputRow}>
                  <TextInput
                    style={[
                      styles.commentInput,
                      {
                        backgroundColor: colors.surfaceSecondary,
                        color: colors.text,
                      },
                    ]}
                    placeholder={
                      replyingTo
                        ? `Balas ke ${replyingTo.authorName}...`
                        : "Tulis komentar..."
                    }
                    placeholderTextColor={colors.textMuted}
                    value={newComment}
                    onChangeText={setNewComment}
                    multiline
                    autoFocus
                  />
                  <TouchableOpacity
                    style={[
                      styles.sendButton,
                      !newComment.trim() && styles.sendButtonDisabled,
                    ]}
                    onPress={handleAddComment}
                    disabled={!newComment.trim() || isSubmittingComment}
                  >
                    {isSubmittingComment ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Send size={18} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        <View
          style={[
            styles.bottomBar,
            { backgroundColor: colors.surface, borderTopColor: colors.border },
          ]}
        >
          {/* Upvote Button */}
          <TouchableOpacity
            style={[
              styles.voteButton,
              isUpvoted && { backgroundColor: Brand.primary + "15" },
            ]}
            onPress={handleUpvote}
          >
            <ArrowUp
              size={20}
              color={isUpvoted ? Brand.primary : colors.text}
              fill={isUpvoted ? Brand.primary : "transparent"}
            />
            <Text
              style={[
                styles.voteText,
                { color: isUpvoted ? Brand.primary : colors.text },
              ]}
            >
              {post.engagement.upvotes}
            </Text>
          </TouchableOpacity>

          {/* Downvote Button */}
          <TouchableOpacity
            style={[
              styles.voteButton,
              isDownvoted && { backgroundColor: Brand.error + "15" },
            ]}
            onPress={handleDownvote}
          >
            <ArrowDown
              size={20}
              color={isDownvoted ? Brand.error : colors.text}
              fill={isDownvoted ? Brand.error : "transparent"}
            />
            <Text
              style={[
                styles.voteText,
                { color: isDownvoted ? Brand.error : colors.text },
              ]}
            >
              {post.engagement.downvotes || 0}
            </Text>
          </TouchableOpacity>

          {/* Comment Button */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              showComments && { backgroundColor: Brand.primary + "15" },
            ]}
            onPress={handleToggleComments}
          >
            <MessageCircle
              size={20}
              color={showComments ? Brand.primary : colors.text}
            />
            <Text
              style={[
                styles.actionButtonText,
                { color: showComments ? Brand.primary : colors.text },
              ]}
            >
              {post.engagement.comments}
            </Text>
          </TouchableOpacity>

          {/* Watch Button */}
          <TouchableOpacity
            style={[
              styles.watchButton,
              isWatching && { backgroundColor: Brand.success },
            ]}
            onPress={handleWatch}
          >
            <Eye size={18} color={isWatching ? "#FFFFFF" : Brand.success} />
            <Text
              style={[
                styles.watchButtonText,
                { color: isWatching ? "#FFFFFF" : Brand.success },
              ]}
            >
              {isWatching ? "Mengikuti" : "Ikuti"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {renderDeleteModal()}
      {renderOptionsModal()}
      {renderCommentOptionsModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
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
    flexDirection: "row",
    gap: Spacing.md,
  },
  section: {
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
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
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    fontSize: FontSize.xs,
  },
  optionsButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
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
    flexDirection: "row",
    alignItems: "center",
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
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  severityLabel: {
    fontSize: FontSize.sm,
  },
  severityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    gap: 4,
  },
  severityText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.lg,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  addUpdateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  addUpdateText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  timeline: {},
  timelineItem: {
    flexDirection: "row",
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
    width: "100%",
    height: 120,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
  },
  updateTime: {
    fontSize: FontSize.xs,
    marginTop: Spacing.sm,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    gap: Spacing.xs,
  },
  actionButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  watchButton: {
    flexDirection: "row",
    alignItems: "center",
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
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  errorText: {
    fontSize: FontSize.md,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  modalMessage: {
    fontSize: FontSize.md,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: Brand.error || "#FF3B30",
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  bottomSheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlayPressable: {
    flex: 1,
  },
  bottomSheetContent: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl + (Platform.OS === "ios" ? 20 : 0),
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.lg,
    opacity: 0.5,
  },
  bottomSheetTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "transparent",
  },
  menuItemText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  closeButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  // Vote buttons
  voteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  voteText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },

  // Comments
  noCommentsText: {
    fontSize: FontSize.md,
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: Spacing.xl,
  },
  commentItem: {
    flexDirection: "row",
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  commentAvatarText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: "#FFFFFF",
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  commentAuthor: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  commentTime: {
    fontSize: FontSize.xs,
  },
  commentText: {
    fontSize: FontSize.md,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginTop: 4,
  },
  commentLikeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  commentLikeCount: {
    fontSize: FontSize.xs,
  },
  commentReplyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  commentReplyText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },

  // Nested Replies
  replyItem: {
    marginLeft: 42,
    borderBottomWidth: 0,
    paddingVertical: Spacing.sm,
  },
  replyAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },

  // Comment Input
  commentInputContainer: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  replyIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    marginBottom: Spacing.sm,
  },
  replyIndicatorText: {
    fontSize: FontSize.xs,
    fontStyle: "italic",
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    fontSize: FontSize.md,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#E5E7EB", // Gray 200
  },
  // Edit Comment
  editContainer: {
    flex: 1,
    marginTop: Spacing.sm,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
    minHeight: 60,
    textAlignVertical: "top",
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  editCancelBtn: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
  },
  editSaveBtn: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
  },
  editBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
});
