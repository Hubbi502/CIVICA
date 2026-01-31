import FilterBar from '@/components/feed/FilterBar';
import PostCard from '@/components/feed/PostCard';
import { Brand, Colors, FontSize, FontWeight, Radius, Shadows, Spacing } from '@/constants/theme';
import { db } from '@/FirebaseConfig';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/useTranslation';
import { toggleUpvote } from '@/services/posts';
import { useAuthStore } from '@/stores/authStore';
import { FeedFilters, Post } from '@/types';
import { router } from 'expo-router';
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { Bell, MapPin, Plus, Search, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const [posts, setPosts] = useState<Post[]>([]);
  const [filters, setFilters] = useState<FeedFilters>({ type: 'all', sortBy: 'recent' });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [upvotedPosts, setUpvotedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Filter posts based on search query
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) {
      return posts;
    }
    const query = searchQuery.toLowerCase().trim();
    return posts.filter(post =>
      post.content.toLowerCase().includes(query) ||
      post.authorName.toLowerCase().includes(query) ||
      post.location?.address?.toLowerCase().includes(query) ||
      post.location?.district?.toLowerCase().includes(query) ||
      post.classification?.tags?.some(tag => tag.toLowerCase().includes(query)) ||
      post.classification?.keywords?.some(keyword => keyword.toLowerCase().includes(query))
    );
  }, [posts, searchQuery]);

  const buildQuery = useCallback(() => {
    const postsRef = collection(db, 'posts');
    let constraints = [];

    if (filters.type && filters.type !== 'all') {
      constraints.push(where('type', '==', filters.type));
    }

    if (filters.sortBy === 'trending') {
      constraints.push(orderBy('engagement.upvotes', 'desc'));
    } else {
      constraints.push(orderBy('createdAt', 'desc'));
    }

    constraints.push(limit(50));

    return query(postsRef, ...constraints);
  }, [filters]);

  const fetchPosts = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error refreshing posts:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Only set loading if we don't have posts yet (initial load)
    if (posts.length === 0) {
      setIsLoading(true);
    }

    const q = buildQuery();
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newPosts: Post[] = [];
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          newPosts.push({
            id: doc.id,
            authorId: data.authorId,
            authorName: data.authorName,
            authorAvatar: data.authorAvatar,
            isAnonymous: data.isAnonymous,
            content: data.content,
            media: data.media || [],
            location: data.location,
            type: data.type,
            classification: data.classification,
            engagement: data.engagement || { upvotes: 0, comments: 0, shares: 0, watchers: 0, views: 0 },
            upvotedBy: data.upvotedBy || [],
            watchedBy: data.watchedBy || [],
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            ...(data.type === 'REPORT' && {
              status: data.status,
              severity: data.severity || data.classification?.severity,
              updates: data.updates || [],
              verifiedCount: data.verifiedCount || 0,
            }),
          } as Post);
        });

        setPosts(newPosts);
        setIsLoading(false);

        if (user?.id) {
          const userUpvotes = new Set<string>();
          newPosts.forEach(post => {
            if (post.upvotedBy?.includes(user.id)) {
              userUpvotes.add(post.id);
            }
          });
          setUpvotedPosts(userUpvotes);
        }
      },
      (error) => {
        console.error('Error listening to posts:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [buildQuery, user?.id]);

  const handleUpvote = async (postId: string) => {
    if (!user?.id) return;

    const newUpvoted = new Set(upvotedPosts);
    const wasUpvoted = newUpvoted.has(postId);

    if (wasUpvoted) {
      newUpvoted.delete(postId);
    } else {
      newUpvoted.add(postId);
    }
    setUpvotedPosts(newUpvoted);

    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          engagement: {
            ...p.engagement,
            upvotes: wasUpvoted
              ? p.engagement.upvotes - 1
              : p.engagement.upvotes + 1,
          },
        };
      }
      return p;
    }));

    try {
      await toggleUpvote(postId, user.id);
    } catch (error) {
      console.error('Error toggling upvote:', error);
      if (wasUpvoted) {
        newUpvoted.add(postId);
      } else {
        newUpvoted.delete(postId);
      }
      setUpvotedPosts(newUpvoted);
    }
  };

  const handleSave = (postId: string) => {
    const newSaved = new Set(savedPosts);
    if (newSaved.has(postId)) {
      newSaved.delete(postId);
    } else {
      newSaved.add(postId);
    }
    setSavedPosts(newSaved);
  };

  const headerComponent = useMemo(() => {
    const themeColors = Colors[colorScheme];
    return (
      <View style={[styles.header, { backgroundColor: themeColors.background }]}>
        <View style={styles.headerTop}>
          {showSearch ? (
            <View style={styles.searchContainer}>
              <View style={[styles.searchInputContainer, { backgroundColor: themeColors.surface }]}>
                <Search size={18} color={themeColors.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: themeColors.text }]}
                  placeholder={t('searchPlaceholder')}
                  placeholderTextColor={themeColors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={18} color={themeColors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={[styles.cancelButton]}
                onPress={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
              >
                <Text style={[styles.cancelText, { color: Brand.primary }]}>
                  {t('cancel')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.headerLeft}>
                <View style={styles.locationRow}>
                  <MapPin size={16} color={Brand.primary} />
                  <Text style={[styles.locationText, { color: themeColors.text }]}>
                    {user?.location?.district || t('location')}
                  </Text>
                </View>
                <Text style={[styles.welcomeText, { color: themeColors.textSecondary }]}>
                  {t('hello')}, {user?.displayName?.split(' ')[0] || 'Civican'}! 👋
                </Text>
              </View>

              <View style={styles.headerRight}>
                <TouchableOpacity
                  style={[styles.iconButton, { backgroundColor: themeColors.surface }]}
                  onPress={() => setShowSearch(true)}
                >
                  <Search size={20} color={themeColors.icon} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.iconButton, { backgroundColor: themeColors.surface }]}>
                  <Bell size={20} color={themeColors.icon} />
                  <View style={styles.notificationBadge} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {searchQuery.trim() && (
          <View style={styles.searchResultInfo}>
            <Text style={[styles.searchResultText, { color: themeColors.textSecondary }]}>
              {filteredPosts.length} {t('resultsFound')} "{searchQuery}"
            </Text>
          </View>
        )}

        <FilterBar filters={filters} onFilterChange={setFilters} />
      </View>
    );
  }, [showSearch, searchQuery, colorScheme, user, t, filteredPosts.length, filters]);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyTitle, { color: Colors[colorScheme].text }]}>
        {t('noPosts')}
      </Text>
      <Text style={[styles.emptyText, { color: Colors[colorScheme].textSecondary }]}>
        {t('beFirst')}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]} edges={['top']}>
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onUpvote={handleUpvote}
            onSave={handleSave}
            isUpvoted={upvotedPosts.has(item.id)}
            isSaved={savedPosts.has(item.id)}
          />
        )}
        ListHeaderComponent={headerComponent}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={fetchPosts}
            colors={[Brand.primary]}
            tintColor={Brand.primary}
          />
        }
        style={{ backgroundColor: Colors[colorScheme].background }}
        contentContainerStyle={[styles.listContent, { backgroundColor: Colors[colorScheme].background }]}
        showsVerticalScrollIndicator={false}
      />

      {isLoading && posts.length === 0 && (
        <View style={[styles.loadingOverlay, { backgroundColor: Colors[colorScheme].background }]}>
          <ActivityIndicator size="large" color={Brand.primary} />
        </View>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/post/create')}
        activeOpacity={0.8}
      >
        <Plus size={28} color="#FFFFFF" strokeWidth={2.5} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: Spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerLeft: {},
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  welcomeText: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Brand.error,
  },
  listContent: {
    paddingBottom: Spacing['3xl'],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.md,
    textAlign: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    paddingVertical: 4,
  },
  cancelButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  cancelText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  searchResultInfo: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  searchResultText: {
    fontSize: FontSize.sm,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255, 0.8)',
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },
});
