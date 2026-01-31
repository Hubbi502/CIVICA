import AddUpdateModal from '@/components/post/AddUpdateModal';
import Timeline from '@/components/post/Timeline';
import { Brand, Colors, SeverityColors } from '@/constants/theme';
import { db } from '@/FirebaseConfig';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { addComment, deleteComment, getComments, reportComment, toggleCommentLike, updateComment } from '@/services/comments';
import { addReportUpdate, deletePost, toggleDownvote, toggleUpvote, toggleWatch } from '@/services/posts';
import { uploadImages } from '@/services/storage';
import { useAuthStore } from '@/stores/authStore';
import { Comment, Post } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
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
  Link,
  MapPin,
  MessageCircle,
  MoreVertical,
  Send,
  Share2,
  Trash2,
  X
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PostDetail extends Post {
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

export default function PostDetailScreen() {
  const { id: postId, openComment } = useLocalSearchParams<{ id: string; openComment?: string }>();
  const colorScheme = useColorScheme() ?? 'light';
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
  const [editCommentContent, setEditCommentContent] = useState('');
  const [showCommentOptionsModal, setShowCommentOptionsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAddUpdateModal, setShowAddUpdateModal] = useState(false);
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);

  // Comments state - auto-open if navigated with openComment query param
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showComments, setShowComments] = useState(openComment === 'true');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

  // Auto-scroll to comment input when openComment is true
  useEffect(() => {
    if (openComment === 'true' && !isLoading) {
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

  const fetchPost = React.useCallback(async () => {
    if (!postId) return;

    try {
      // Only set loading on initial load or if explicitly needed
      if (!post) setIsLoading(true);

      const postRef = doc(db, 'posts', postId);
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
          location: data.location || { district: '', city: '', address: '' },
          type: data.type,
          classification: data.classification,
          engagement: data.engagement || { upvotes: 0, downvotes: 0, comments: 0, shares: 0, watchers: 0, views: 0 },
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
      console.error('Error fetching post:', error);
    } finally {
      setIsLoading(false);
    }
  }, [postId, user?.id]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const performDelete = async () => {
    try {
      setIsLoading(true);
      await deletePost(postId);
      setShowDeleteModal(false);
      if (Platform.OS === 'web') {
        router.navigate('/(tabs)');
      } else {
        Alert.alert('Berhasil', 'Post berhasil dihapus', [
          { text: 'OK', onPress: () => router.navigate('/(tabs)') }
        ]);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      Alert.alert('Error', 'Gagal menghapus post');
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
      setPost(prev => prev ? {
        ...prev,
        engagement: {
          ...prev.engagement,
          upvotes: nowUpvoted ? prev.engagement.upvotes + 1 : prev.engagement.upvotes - 1,
          downvotes: nowUpvoted && isDownvoted ? prev.engagement.downvotes - 1 : prev.engagement.downvotes,
        }
      } : null);
    } catch (error) {
      console.error('Error toggling upvote:', error);
    }
  };

  const handleDownvote = async () => {
    if (!user?.id || !postId) return;
    try {
      const nowDownvoted = await toggleDownvote(postId, user.id);
      setIsDownvoted(nowDownvoted);
      if (nowDownvoted) setIsUpvoted(false); // Mutually exclusive
      // Update local engagement count
      setPost(prev => prev ? {
        ...prev,
        engagement: {
          ...prev.engagement,
          downvotes: nowDownvoted ? (prev.engagement.downvotes || 0) + 1 : (prev.engagement.downvotes || 0) - 1,
          upvotes: nowDownvoted && isUpvoted ? prev.engagement.upvotes - 1 : prev.engagement.upvotes,
        }
      } : null);
    } catch (error) {
      console.error('Error toggling downvote:', error);
    }
  };

  const handleWatch = async () => {
    if (!user?.id || !postId) return;
    try {
      const nowWatching = await toggleWatch(postId, user.id);
      setIsWatching(nowWatching);
      // Update local engagement count
      setPost(prev => prev ? {
        ...prev,
        engagement: {
          ...prev.engagement,
          watchers: nowWatching ? prev.engagement.watchers + 1 : prev.engagement.watchers - 1,
        }
      } : null);
    } catch (error) {
      console.error('Error toggling watch:', error);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user?.id) return;

    // Optimistic update
    setComments(prevComments => prevComments.map(c => {
      if (c.id === commentId) {
        const isLiked = c.likedBy.includes(user.id);
        return {
          ...c,
          likes: isLiked ? c.likes - 1 : c.likes + 1,
          likedBy: isLiked
            ? c.likedBy.filter(id => id !== user.id)
            : [...c.likedBy, user.id]
        };
      }
      return c;
    }));

    try {
      await toggleCommentLike(commentId, user.id);
    } catch (error) {
      console.error('Error toggling like:', error);
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
        user.displayName || 'User',
        user.avatarUrl,
        newComment.trim(),
        replyingTo?.id // Pass parentId if replying
      );
      setNewComment('');
      setReplyingTo(null); // Clear reply state
      // Refresh comments
      const fetchedComments = await getComments(postId);
      setComments(fetchedComments);
      // Update engagement count
      setPost(prev => prev ? {
        ...prev,
        engagement: {
          ...prev.engagement,
          comments: prev.engagement.comments + 1,
        }
      } : null);
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Gagal menambahkan komentar');
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
    const comment = comments.find(c => c.id === activeCommentId);
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
      setComments(prev => prev.map(c =>
        c.id === editingCommentId ? { ...c, content: editCommentContent.trim() } : c
      ));
      setEditingCommentId(null);
      setEditCommentContent('');
    } catch (error) {
      Alert.alert('Error', 'Gagal mengedit komentar');
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditCommentContent('');
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleCopyLink = async () => {
    if (!postId) return;
    const storageUrl = process.env.EXPO_PUBLIC_STORAGE_API_URL || 'https://storage.sangkaraprasetya.site';
    const shareLink = `${storageUrl}/post/${postId}`;
    const message = `Lihat postingan ini di CIVICA! ${shareLink}`;

    await Clipboard.setStringAsync(message);
    setShowShareModal(false);

    if (Platform.OS === 'android') {
      Alert.alert('Berhasil', 'Tautan disalin ke clipboard');
    } else {
      Alert.alert('Berhasil', 'Tautan disalin');
    }
  };

  const handleNativeShare = async () => {
    try {
      const storageUrl = process.env.EXPO_PUBLIC_STORAGE_API_URL || 'https://storage.sangkaraprasetya.site';
      const shareLink = `${storageUrl}/post/${postId}`;
      const message = `Lihat postingan ini di CIVICA!\n\n${shareLink}`;
      const imageUrl = post?.media && post.media.length > 0 ? post.media[0].url : undefined;

      const content: any = { message, title: 'Bagikan Postingan CIVICA' };
      const options: any = { dialogTitle: 'Bagikan Postingan CIVICA' };

      if (Platform.OS === 'ios' && imageUrl) content.url = imageUrl;

      await Share.share(content, options);
      setShowShareModal(false);
    } catch (error) {
      Alert.alert('Error', 'Gagal membagikan postingan');
    }
  };

  const handleReportCommentAction = async () => {
    if (activeCommentId) {
      try {
        await reportComment(activeCommentId, 'Reported by user');
        Alert.alert('Info', 'Laporan diterima. Kami akan meninjau komentar ini.');
      } catch (error) {
        Alert.alert('Error', 'Gagal melaporkan komentar');
      }
    }
    setShowCommentOptionsModal(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!postId) return;
    try {
      await deleteComment(commentId, postId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      // Update engagement count
      setPost(prev => prev ? {
        ...prev,
        engagement: {
          ...prev.engagement,
          comments: prev.engagement.comments - 1,
        }
      } : null);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleAddUpdate = async (content: string, images: string[]) => {
    if (!post || !user) return;
    setIsSubmittingUpdate(true);
    try {
      let media = undefined;
      if (images.length > 0) {
        const uploadedUrls = await uploadImages(images, `reports/${post.id}/${Date.now()}`);
        if (uploadedUrls.length > 0) {
          media = uploadedUrls.map(url => ({ url, type: 'image' as const }));
        }
      }

      const result = await addReportUpdate(post.id, {
        authorId: user.id,
        authorName: user.displayName || 'User',
        authorAvatar: user.avatarUrl,
        content,
        media
      });

      setShowAddUpdateModal(false);

      // Show appropriate message based on verification status
      if (result.isVerified && post.status !== 'verified') {
        Alert.alert('Terverifikasi! 🎉', 'Laporan telah divalidasi karena sudah mencapai 3 update timeline.');
      } else {
        Alert.alert('Berhasil', 'Update timeline berhasil ditambahkan');
      }

      fetchPost();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal menambahkan update');
    } finally {
      setIsSubmittingUpdate(false);
    }
  };

  const renderCommentOptionsModal = () => {
    const comment = comments.find(c => c.id === activeCommentId);
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
        <View style={[styles.bottomSheetOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <TouchableOpacity
            style={styles.overlayPressable}
            onPress={() => setShowCommentOptionsModal(false)}
          />
          <View style={[styles.bottomSheetContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />

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
                <AlertTriangle size={20} color={Brand.warning || '#F59E0B'} />
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
                <Trash2 size={20} color={Brand.error || '#FF3B30'} />
                <Text style={[styles.menuItemText, { color: Brand.error || '#FF3B30' }]}>
                  Hapus Komentar
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.surfaceSecondary }]}
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
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <AlertTriangle size={24} color={Brand.error || '#FF3B30'} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Hapus Post
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowDeleteModal(false)}>
                <X size={24} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              Apakah Anda yakin ingin menghapus post ini? Tindakan ini tidak dapat dibatalkan.
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
                style={[styles.deleteButton, isLoading && styles.buttonDisabled]}
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
        <View style={[styles.bottomSheetOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <TouchableOpacity
            style={styles.overlayPressable}
            onPress={() => setShowOptionsModal(false)}
          />
          <View style={[styles.bottomSheetContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />

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
              <Trash2 size={20} color={Brand.error || '#FF3B30'} />
              <Text style={[styles.menuItemText, { color: Brand.error || '#FF3B30' }]}>
                Hapus Post
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.surfaceSecondary }]}
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

  const renderShareModal = () => {
    return (
      <Modal
        visible={showShareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={[styles.bottomSheetOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <TouchableOpacity
            style={styles.overlayPressable}
            onPress={() => setShowShareModal(false)}
          />
          <View style={[styles.bottomSheetContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />

            <Text style={[styles.bottomSheetTitle, { color: colors.text }]}>
              Bagikan
            </Text>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={handleCopyLink}
            >
              <Link size={20} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>
                Salin Tautan
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={handleNativeShare}
            >
              <Share2 size={20} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>
                Opsi Lainnya...
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.surfaceSecondary }]}
              onPress={() => setShowShareModal(false)}
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

  const renderAddUpdateModal = () => (
    <AddUpdateModal
      visible={showAddUpdateModal}
      onClose={() => setShowAddUpdateModal(false)}
      onSubmit={handleAddUpdate}
      isSubmitting={isSubmittingUpdate}
    />
  );

  if (isLoading && !showDeleteModal && !showOptionsModal) {
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

  if (!post) {
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

  const isAuthor = user?.id === post.authorId;

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
          <TouchableOpacity onPress={handleShare}>
            <Share2 size={24} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false}>
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
                  {formatDistanceToNow(post.createdAt, { addSuffix: true, locale: id })}
                </Text>
              </View>
            </View>

            {isAuthor && (
              <TouchableOpacity onPress={handleOptions} style={styles.optionsButton}>
                <MoreVertical size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.content, { color: colors.text }]}>
            {post.content}
          </Text>

          {post.media.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
              {post.media.map((media, index) => (
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
              {post.location.address}
            </Text>
          </View>

          {post.severity && (
            <View style={styles.severityRow}>
              <AlertTriangle size={16} color={SeverityColors[post.severity!]} />
              <Text style={[styles.severityLabel, { color: colors.textSecondary }]}>
                Tingkat Keparahan:
              </Text>
              <View style={[styles.severityBadge, { backgroundColor: SeverityColors[post.severity!] + '15' }]}>
                <Text style={[styles.severityText, { color: SeverityColors[post.severity!] }]}>
                  {post.severity === 'low' ? 'Ringan' :
                    post.severity === 'medium' ? 'Sedang' :
                      post.severity === 'high' ? 'Tinggi' : 'Kritis'}
                </Text>
              </View>
            </View>
          )}

          {post.type === 'REPORT' && (
            <Timeline
              updates={post.updates || []}
              isVerified={post.status === 'verified'}
              verifiedCount={post.verifiedCount || 0}
              onAddUpdate={() => setShowAddUpdateModal(true)}
              canAddUpdate={!!user}
            />
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
          {post.type === 'REPORT' && (
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
            <Text style={[styles.noCommentsText, { color: colors.textMuted }]}>
              Belum ada komentar. Jadilah yang pertama!
            </Text>
          ) : (
            <>
              {/* Parent comments (no parentId) */}
              {comments.filter(c => !c.parentId).map((comment) => (
                <View key={comment.id}>
                  <View style={[styles.commentItem, { borderBottomColor: colors.border }]}>
                    {comment.authorAvatar ? (
                      <Image source={{ uri: comment.authorAvatar }} style={styles.commentAvatar} />
                    ) : (
                      <View style={[styles.commentAvatar, { backgroundColor: Brand.primary }]}>
                        <Text style={styles.commentAvatarText}>
                          {comment.authorName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.commentContent}>
                      <View style={styles.commentHeader}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={[styles.commentAuthor, { color: colors.text }]}>
                              {comment.authorName}
                            </Text>
                            <Text style={[styles.commentTime, { color: colors.textMuted }]}>
                              {formatDistanceToNow(comment.createdAt, { addSuffix: true, locale: id })}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity onPress={() => handleCommentOptions(comment)}>
                          <MoreVertical size={16} color={colors.textMuted} />
                        </TouchableOpacity>
                      </View>

                      {editingCommentId === comment.id ? (
                        <View style={styles.editContainer}>
                          <TextInput
                            style={[styles.editInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
                            value={editCommentContent}
                            onChangeText={setEditCommentContent}
                            multiline
                            autoFocus
                          />
                          <View style={styles.editActions}>
                            <TouchableOpacity onPress={handleCancelEdit} style={styles.editCancelBtn}>
                              <Text style={[styles.editBtnText, { color: colors.textSecondary }]}>Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSaveEditComment} style={styles.editSaveBtn}>
                              <Text style={[styles.editBtnText, { color: Brand.primary }]}>Simpan</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <Text style={[styles.commentText, { color: colors.textSecondary }]}>
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
                            color={comment.likedBy?.includes(user?.id || '') ? Brand.error : colors.textMuted}
                            fill={comment.likedBy?.includes(user?.id || '') ? Brand.error : 'transparent'}
                          />
                          <Text style={[styles.commentLikeCount, { color: colors.textMuted }]}>
                            {comment.likes}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.commentReplyBtn}
                          onPress={() => handleReply(comment)}
                        >
                          <CornerDownLeft size={14} color={Brand.primary} />
                          <Text style={[styles.commentReplyText, { color: Brand.primary }]}>
                            Balas
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Nested replies */}
                  {comments.filter(r => r.parentId === comment.id).map((reply) => (
                    <View key={reply.id} style={[styles.commentItem, styles.replyItem, { borderBottomColor: colors.border }]}>
                      {reply.authorAvatar ? (
                        <Image source={{ uri: reply.authorAvatar }} style={[styles.commentAvatar, styles.replyAvatar]} />
                      ) : (
                        <View style={[styles.commentAvatar, styles.replyAvatar, { backgroundColor: Brand.accent }]}>
                          <Text style={[styles.commentAvatarText, { fontSize: 10 }]}>
                            {reply.authorName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.commentContent}>
                        <View style={styles.commentHeader}>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={[styles.commentAuthor, { color: colors.text, fontSize: 12 }]}>
                                {reply.authorName}
                              </Text>
                              <Text style={[styles.commentTime, { color: colors.textMuted }]}>
                                {formatDistanceToNow(reply.createdAt, { addSuffix: true, locale: id })}
                              </Text>
                            </View>
                          </View>
                          <TouchableOpacity onPress={() => handleCommentOptions(reply)}>
                            <MoreVertical size={14} color={colors.textMuted} />
                          </TouchableOpacity>
                        </View>

                        {editingCommentId === reply.id ? (
                          <View style={styles.editContainer}>
                            <TextInput
                              style={[styles.editInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary, fontSize: 13 }]}
                              value={editCommentContent}
                              onChangeText={setEditCommentContent}
                              multiline
                              autoFocus
                            />
                            <View style={styles.editActions}>
                              <TouchableOpacity onPress={handleCancelEdit} style={styles.editCancelBtn}>
                                <Text style={[styles.editBtnText, { color: colors.textSecondary }]}>Batal</Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={handleSaveEditComment} style={styles.editSaveBtn}>
                                <Text style={[styles.editBtnText, { color: Brand.primary }]}>Simpan</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : (
                          <Text style={[styles.commentText, { color: colors.textSecondary, fontSize: 13 }]}>
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
                              color={reply.likedBy?.includes(user?.id || '') ? Brand.error : colors.textMuted}
                              fill={reply.likedBy?.includes(user?.id || '') ? Brand.error : 'transparent'}
                            />
                            <Text style={[styles.commentLikeCount, { color: colors.textMuted }]}>
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
            <View style={[styles.commentInputContainer, { borderTopColor: colors.border }]}>
              {/* Reply indicator */}
              {replyingTo && (
                <View style={[styles.replyIndicator, { backgroundColor: colors.surfaceSecondary }]}>
                  <Text style={[styles.replyIndicatorText, { color: colors.textSecondary }]}>
                    Membalas {replyingTo.authorName}
                  </Text>
                  <TouchableOpacity onPress={cancelReply}>
                    <X size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.commentInputRow}>
                <TextInput
                  style={[styles.commentInput, { backgroundColor: colors.surfaceSecondary, color: colors.text }]}
                  placeholder={replyingTo ? `Balas ke ${replyingTo.authorName}...` : "Tulis komentar..."}
                  placeholderTextColor={colors.textMuted}
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                  autoFocus
                />
                <TouchableOpacity
                  style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
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

      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {/* Upvote Button */}
        <TouchableOpacity
          style={[styles.voteButton, isUpvoted && { backgroundColor: Brand.primary + '15' }]}
          onPress={handleUpvote}
        >
          <ArrowUp
            size={20}
            color={isUpvoted ? Brand.primary : colors.text}
            fill={isUpvoted ? Brand.primary : 'transparent'}
          />
          <Text style={[styles.voteText, { color: isUpvoted ? Brand.primary : colors.text }]}>
            {post.engagement.upvotes}
          </Text>
        </TouchableOpacity>

        {/* Downvote Button */}
        <TouchableOpacity
          style={[styles.voteButton, isDownvoted && { backgroundColor: Brand.error + '15' }]}
          onPress={handleDownvote}
        >
          <ArrowDown
            size={20}
            color={isDownvoted ? Brand.error : colors.text}
            fill={isDownvoted ? Brand.error : 'transparent'}
          />
          <Text style={[styles.voteText, { color: isDownvoted ? Brand.error : colors.text }]}>
            {post.engagement.downvotes || 0}
          </Text>
        </TouchableOpacity>

        {/* Comment Button */}
        <TouchableOpacity
          style={[styles.actionButton, showComments && { backgroundColor: Brand.primary + '15' }]}
          onPress={handleToggleComments}
        >
          <MessageCircle size={20} color={showComments ? Brand.primary : colors.text} />
          <Text style={[styles.actionButtonText, { color: showComments ? Brand.primary : colors.text }]}>
            {post.engagement.comments}
          </Text>
        </TouchableOpacity>

        {/* Watch Button */}
        <TouchableOpacity
          style={[styles.watchButton, isWatching && { backgroundColor: Brand.success }]}
          onPress={handleWatch}
        >
          <Eye size={18} color={isWatching ? '#FFFFFF' : Brand.success} />
          <Text style={[styles.watchButtonText, { color: isWatching ? '#FFFFFF' : Brand.success }]}>
            {isWatching ? 'Mengikuti' : 'Ikuti'}
          </Text>
        </TouchableOpacity>
      </View>

      {renderCommentOptionsModal()}
      {renderOptionsModal()}
      {renderDeleteModal()}
      {renderShareModal()}
      {renderAddUpdateModal()}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  section: {
    padding: 16,
    marginBottom: 8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 18,
    fontWeight: '600',
  },
  authorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  optionsButton: {
    padding: 8,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  imagesContainer: {
    marginBottom: 16,
  },
  postImage: {
    width: 280,
    height: 200,
    borderRadius: 12,
    marginRight: 8,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
  },
  severityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  severityLabel: {
    fontSize: 14,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 8,
    gap: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
  },
  commentsSection: {
    padding: 16,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  commentItem: {
    marginBottom: 16,
  },
  commentRow: {
    flexDirection: 'row',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  commentContent: {
    flex: 1,
    marginLeft: 10,
  },
  commentBubble: {
    padding: 12,
    borderRadius: 16,
    borderTopLeftRadius: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 16,
  },
  commentTime: {
    fontSize: 12,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentActionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  replyContainer: {
    marginLeft: 46,
    marginTop: 12,
  },
  replyItem: {
    marginBottom: 12,
  },
  replyBubble: {
    padding: 10,
    borderRadius: 12,
    borderTopLeftRadius: 4,
  },
  editInputContainer: {
    marginTop: 8,
  },
  editInput: {
    padding: 12,
    borderRadius: 12,
    fontSize: 14,
    minHeight: 60,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  editCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    padding: 12,
    borderTopWidth: 1,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
    borderRadius: 8,
    gap: 8,
  },
  replyIndicatorText: {
    flex: 1,
    fontSize: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    padding: 12,
    borderRadius: 24,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  voteText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Brand.success,
    gap: 6,
  },
  watchButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalMessage: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Brand.error || '#FF3B30',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  // Bottom Sheet Styles
  bottomSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayPressable: {
    flex: 1,
  },
  bottomSheetContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Missing styles
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  noCommentsText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editContainer: {
    marginTop: 8,
  },
  editCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editSaveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 16,
  },
  commentLikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentLikeCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  commentReplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentReplyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentInputContainer: {
    padding: 12,
    borderTopWidth: 1,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  commentInput: {
    flex: 1,
    maxHeight: 100,
    padding: 12,
    borderRadius: 24,
    fontSize: 14,
  },
});
