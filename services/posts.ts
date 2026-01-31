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
        const q = query(
            collection(db, POSTS_COLLECTION),
            where('authorId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(docToPost);
    } catch (error) {
        console.error('Error getting user posts:', error);
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
                comments: 0,
                shares: 0,
                watchers: 0,
                views: 0,
            },
            upvotedBy: [],
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

export const updatePost = async (
    postId: string,
    updates: Partial<Post>
): Promise<void> => {
    try {
        const docRef = doc(db, POSTS_COLLECTION, postId);
        await updateDoc(docRef, {
            ...updates,
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

/**
 * Toggle upvote on a post
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

        if (hasUpvoted) {
            await updateDoc(docRef, {
                upvotedBy: arrayRemove(userId),
                'engagement.upvotes': increment(-1),
            });
            return false;
        } else {
            await updateDoc(docRef, {
                upvotedBy: arrayUnion(userId),
                'engagement.upvotes': increment(1),
            });
            return true;
        }
    } catch (error) {
        console.error('Error toggling upvote:', error);
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
