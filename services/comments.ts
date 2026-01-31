import { db } from '@/FirebaseConfig';
import { Comment } from '@/types';
import {
    addDoc,
    arrayRemove,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    getDocs,
    increment,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from 'firebase/firestore';

const COMMENTS_COLLECTION = 'comments';

/**
 * Get all comments for a post
 */
export const getComments = async (postId: string): Promise<Comment[]> => {
    try {
        const q = query(
            collection(db, COMMENTS_COLLECTION),
            where('postId', '==', postId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Comment[];
    } catch (error) {
        console.error('Error getting comments:', error);
        return [];
    }
};

import { getDoc } from 'firebase/firestore';
import { sendNotification } from './notifications';

/**
 * Add a new comment to a post
 */
export const addComment = async (
    postId: string,
    authorId: string,
    authorName: string,
    authorAvatar: string | undefined,
    content: string,
    parentId?: string
): Promise<string> => {
    try {
        const comment = {
            postId,
            authorId,
            authorName,
            authorAvatar: authorAvatar || null,
            content,
            parentId: parentId || null,
            likes: 0,
            likedBy: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, COMMENTS_COLLECTION), comment);

        // Increment comment count on the post
        const postRef = doc(db, 'posts', postId);

        // Use Promise.all to update post and fetch it for notification in parallel
        const [_, postSnap] = await Promise.all([
            updateDoc(postRef, {
                'engagement.comments': increment(1),
            }),
            getDoc(postRef)
        ]);

        // Send notification
        if (postSnap.exists()) {
            const post = postSnap.data();
            if (post.authorId && post.authorId !== authorId) {
                sendNotification(
                    post.authorId,
                    'comment',
                    'Komentar Baru',
                    `${authorName} mengomentari postingan anda: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`,
                    { postId, commentId: docRef.id, userId: authorId }
                ).catch(err => console.error('Error sending comment notification:', err));
            }
        }

        return docRef.id;
    } catch (error) {
        console.error('Error adding comment:', error);
        throw error;
    }
};

/**
 * Delete a comment
 */
export const deleteComment = async (commentId: string, postId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, COMMENTS_COLLECTION, commentId));

        // Decrement comment count on the post
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, {
            'engagement.comments': increment(-1),
        });
    } catch (error) {
        console.error('Error deleting comment:', error);
        throw error;
    }
};

/**
 * Toggle like on a comment
 */
export const toggleCommentLike = async (
    commentId: string,
    userId: string
): Promise<boolean> => {
    try {
        const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
        const commentSnap = await getDocs(
            query(collection(db, COMMENTS_COLLECTION), where('__name__', '==', commentId))
        );

        if (commentSnap.empty) return false;

        const commentData = commentSnap.docs[0].data();
        const hasLiked = commentData.likedBy?.includes(userId);

        if (hasLiked) {
            await updateDoc(commentRef, {
                likedBy: arrayRemove(userId),
                likes: increment(-1),
            });
            return false;
        } else {
            await updateDoc(commentRef, {
                likedBy: arrayUnion(userId),
                likes: increment(1),
            });
            return true;
        }
    } catch (error) {
        console.error('Error toggling comment like:', error);
        throw error;
    }
};

/**
 * Update a comment
 */
export const updateComment = async (
    commentId: string,
    content: string
): Promise<void> => {
    try {
        const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
        await updateDoc(commentRef, {
            content,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error updating comment:', error);
        throw error;
    }
};

/**
 * Report a comment
 */
export const reportComment = async (
    commentId: string,
    reason: string
): Promise<void> => {
    // Mock implementation for now
    console.log('Reporting comment:', commentId, reason);
    return Promise.resolve();
};

