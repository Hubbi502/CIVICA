import { db } from '@/FirebaseConfig';
import { AIClassification, FeedFilters, Post, PostLocation, ReportUpdate } from '@/types';
import {
    addDoc,
    arrayRemove,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    DocumentSnapshot,
    getDoc,
    getDocs,
    increment,
    limit,
    orderBy,
    query,
    serverTimestamp,
    startAfter,
    Timestamp,
    updateDoc,
    where,
} from 'firebase/firestore';

const POSTS_COLLECTION = 'posts';
const POSTS_PER_PAGE = 20;

const docToPost = (doc: DocumentSnapshot): Post => {
    const data = doc.data()!;
    return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Post;
};

export const getPosts = async (
    filters: FeedFilters = {},
    lastDoc?: DocumentSnapshot
): Promise<{ posts: Post[]; lastDoc: DocumentSnapshot | null }> => {
    try {
        let q = query(collection(db, POSTS_COLLECTION));

        if (filters.type && filters.type !== 'all') {
            q = query(q, where('type', '==', filters.type));
        }

        if (filters.status) {
            q = query(q, where('status', '==', filters.status));
        }

        if (filters.sortBy === 'trending') {
            q = query(q, orderBy('engagement.upvotes', 'desc'));
        } else {
            q = query(q, orderBy('createdAt', 'desc'));
        }

        q = query(q, limit(POSTS_PER_PAGE));
        if (lastDoc) {
            q = query(q, startAfter(lastDoc));
        }

        const snapshot = await getDocs(q);
        const posts = snapshot.docs.map(docToPost);
        const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

        return { posts, lastDoc: newLastDoc };
    } catch (error) {
        console.error('Error getting posts:', error);
        return { posts: [], lastDoc: null };
    }
};

export const getPostsByUser = async (userId: string): Promise<Post[]> => {
    try {
        console.log('[getPostsByUser] Fetching posts for userId:', userId);
        // Note: Removed orderBy to avoid composite index requirement
        // Sorting is done in JavaScript after fetching
        const q = query(
            collection(db, POSTS_COLLECTION),
            where('authorId', '==', userId)
        );
        const snapshot = await getDocs(q);
        console.log('[getPostsByUser] Found', snapshot.docs.length, 'posts');
        const posts = snapshot.docs.map(docToPost);
        // Sort by createdAt descending in JavaScript
        return posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
        console.error('Error getting user posts:', error);
        // Log more details about the error
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        return [];
    }
};

export const getPost = async (postId: string): Promise<Post | null> => {
    try {
        const docRef = doc(db, POSTS_COLLECTION, postId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docToPost(docSnap);
        }
        return null;
    } catch (error) {
        console.error('Error getting post:', error);
        return null;
    }
};

export const createPost = async (
    postData: {
        authorId: string;
        authorName: string;
        authorAvatar?: string;
        isAnonymous: boolean;
        content: string;
        mediaUrls: string[];
        location: PostLocation;
        classification: AIClassification;
    }
): Promise<string> => {
    try {
        const post = {
            authorId: postData.authorId,
            authorName: postData.isAnonymous ? 'Anonymous' : postData.authorName,
            authorAvatar: postData.isAnonymous ? null : (postData.authorAvatar || null),
            isAnonymous: postData.isAnonymous,
            content: postData.content,
            media: postData.mediaUrls.map((url) => ({
                url,
                type: 'image',
            })),
            location: postData.location,
            type: postData.classification.category,
            classification: postData.classification,
            engagement: {
                upvotes: 0,
                downvotes: 0,
                comments: 0,
                shares: 0,
                watchers: 0,
                views: 0,
            },
            upvotedBy: [],
            downvotedBy: [],
            watchedBy: [],
            ...(postData.classification.category === 'REPORT' && {
                status: 'active',
                severity: postData.classification.severity || 'medium',
                updates: [],
                verifiedCount: 0,
            }),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, POSTS_COLLECTION), post);
        return docRef.id;
    } catch (error) {
        console.error('Error creating post:', error);
        throw error;
    }
};

/**
 * Recursively removes undefined values from an object.
 * Firebase updateDoc() does not accept undefined values.
 * Also preserves special Firebase types like Timestamps.
 */
const removeUndefined = (obj: any): any => {
    if (obj === null || obj === undefined) {
        return obj;
    }
    // Preserve Firebase Timestamps and Dates as-is
    if (obj instanceof Date || (obj && obj.toDate && typeof obj.toDate === 'function')) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(removeUndefined).filter(item => item !== undefined);
    }
    if (typeof obj === 'object') {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined) {
                const cleanedValue = removeUndefined(value);
                // Only add non-undefined values
                if (cleanedValue !== undefined) {
                    cleaned[key] = cleanedValue;
                }
            }
        }
        return cleaned;
    }
    return obj;
};

export const updatePost = async (
    postId: string,
    updates: Partial<Post>
): Promise<void> => {
    try {
        const docRef = doc(db, POSTS_COLLECTION, postId);
        // Remove undefined values as Firebase doesn't accept them
        const cleanedUpdates = removeUndefined(updates);
        console.log('Cleaned updates to send:', JSON.stringify(cleanedUpdates, null, 2));
        await updateDoc(docRef, {
            ...cleanedUpdates,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating post:', error);
        throw error;
    }
};

/**
 * Delete a post
 */
export const deletePost = async (postId: string): Promise<void> => {
    try {
        const docRef = doc(db, POSTS_COLLECTION, postId);
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Error deleting post:', error);
        throw error;
    }
};

import { getUserProfile } from './auth';
import { sendNotification } from './notifications';

/**
 * Toggle upvote on a post (mutually exclusive with downvote)
 */
export const toggleUpvote = async (
    postId: string,
    userId: string
): Promise<boolean> => {
    try {
        const docRef = doc(db, POSTS_COLLECTION, postId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return false;

        const post = docSnap.data();
        const hasUpvoted = post.upvotedBy?.includes(userId);
        const hasDownvoted = post.downvotedBy?.includes(userId);

        if (hasUpvoted) {
            // Remove upvote
            await updateDoc(docRef, {
                upvotedBy: arrayRemove(userId),
                'engagement.upvotes': increment(-1),
            });
            return false;
        } else {
            // Add upvote and remove downvote if exists
            const updates: any = {
                upvotedBy: arrayUnion(userId),
                'engagement.upvotes': increment(1),
            };

            if (hasDownvoted) {
                updates.downvotedBy = arrayRemove(userId);
                updates['engagement.downvotes'] = increment(-1);
            }

            await updateDoc(docRef, updates);

            // Send notification
            if (post.authorId && post.authorId !== userId) {
                // Fetch liker profile to get name
                getUserProfile(userId).then(profile => {
                    const likerName = profile?.displayName || 'Seseorang';
                    sendNotification(
                        post.authorId,
                        'upvote',
                        'Postingan Disukai',
                        `${likerName} menyukai postingan anda`,
                        { postId, userId }
                    ).catch(err => console.error('Error sending upvote notification:', err));
                });
            }

            return true;
        }
    } catch (error) {
        console.error('Error toggling upvote:', error);
        throw error;
    }
};

/**
 * Toggle downvote on a post (mutually exclusive with upvote)
 */
export const toggleDownvote = async (
    postId: string,
    userId: string
): Promise<boolean> => {
    try {
        const docRef = doc(db, POSTS_COLLECTION, postId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return false;

        const post = docSnap.data();
        const hasDownvoted = post.downvotedBy?.includes(userId);
        const hasUpvoted = post.upvotedBy?.includes(userId);

        if (hasDownvoted) {
            // Remove downvote
            await updateDoc(docRef, {
                downvotedBy: arrayRemove(userId),
                'engagement.downvotes': increment(-1),
            });
            return false;
        } else {
            // Add downvote and remove upvote if exists
            const updates: any = {
                downvotedBy: arrayUnion(userId),
                'engagement.downvotes': increment(1),
            };

            if (hasUpvoted) {
                updates.upvotedBy = arrayRemove(userId);
                updates['engagement.upvotes'] = increment(-1);
            }

            await updateDoc(docRef, updates);
            return true;
        }
    } catch (error) {
        console.error('Error toggling downvote:', error);
        throw error;
    }
};

/**
 * Toggle watch on a report
 */
export const toggleWatch = async (
    postId: string,
    userId: string
): Promise<boolean> => {
    try {
        const docRef = doc(db, POSTS_COLLECTION, postId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return false;

        const post = docSnap.data();
        const isWatching = post.watchedBy?.includes(userId);

        if (isWatching) {
            await updateDoc(docRef, {
                watchedBy: arrayRemove(userId),
                'engagement.watchers': increment(-1),
            });
            return false;
        } else {
            await updateDoc(docRef, {
                watchedBy: arrayUnion(userId),
                'engagement.watchers': increment(1),
            });
            return true;
        }
    } catch (error) {
        console.error('Error toggling watch:', error);
        throw error;
    }
};

/**
 * Add update to a report
 */
export const addReportUpdate = async (
    postId: string,
    update: Omit<ReportUpdate, 'id' | 'createdAt'>
): Promise<void> => {
    try {
        const docRef = doc(db, POSTS_COLLECTION, postId);
        const newUpdate = {
            ...update,
            id: Date.now().toString(),
            createdAt: Timestamp.now(),
        };

        await updateDoc(docRef, {
            updates: arrayUnion(newUpdate),
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error adding report update:', error);
        throw error;
    }
};

/**
 * Update report status
 */
export const updateReportStatus = async (
    postId: string,
    status: 'active' | 'verified' | 'resolved' | 'closed'
): Promise<void> => {
    try {
        const docRef = doc(db, POSTS_COLLECTION, postId);
        await updateDoc(docRef, {
            status,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating report status:', error);
        throw error;
    }
};

/**
 * Increment view count
 */
export const incrementViews = async (postId: string): Promise<void> => {
    try {
        const docRef = doc(db, POSTS_COLLECTION, postId);
        await updateDoc(docRef, {
            'engagement.views': increment(1),
        });
    } catch (error) {
        console.error('Error incrementing views:', error);
    }
};
