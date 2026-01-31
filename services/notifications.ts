import { db } from '@/FirebaseConfig';
import { Notification, NotificationType } from '@/types';
import {
    addDoc,
    collection,
    doc,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from 'firebase/firestore';

const NOTIFICATIONS_COLLECTION = 'notifications';

export const sendNotification = async (
    toUserId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: {
        postId?: string;
        commentId?: string;
        userId?: string; // The user causing the notification
        badgeId?: string;
    }
): Promise<string> => {
    try {
        const notificationData = {
            userId: toUserId,
            type,
            title,
            body,
            data: data || {},
            read: false,
            createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), notificationData);
        return docRef.id;
    } catch (error) {
        console.error('Error sending notification:', error);
        throw error;
    }
};

export const getUserNotifications = (
    userId: string,
    callback: (notifications: Notification[]) => void
) => {
    const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
    );

    return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Notification[];
        callback(notifications);
    });
};

export const markAsRead = async (notificationId: string) => {
    try {
        const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
        await updateDoc(docRef, {
            read: true,
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
};

export const markAllAsRead = async (userId: string) => {
    // This functionality usually requires a batch update or iterating client side if not using a cloud function
    // For now, we'll keep it simple or implement if needed
};
