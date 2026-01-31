import { db } from '@/FirebaseConfig';
import { useAuthStore } from '@/stores/authStore';
import Notifications from '@/utils/Notifications';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

export function useNotificationListener() {
    const { user } = useAuthStore();
    const isFirstLoad = useRef(true);

    useEffect(() => {
        if (!user?.id) return;

        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', user.id),
            orderBy('createdAt', 'desc'),
            limit(10)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            // Skip the first snapshot (initial data load)
            if (isFirstLoad.current) {
                isFirstLoad.current = false;
                return;
            }

            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    // Don't notify if already read (shouldn't happen for new, but safety)
                    if (!data.read && Platform.OS !== 'web') {
                        Notifications.scheduleNotificationAsync({
                            content: {
                                title: data.title || 'Notifikasi Baru',
                                body: data.body || 'Anda memiliki notifikasi baru',
                                data: data.data,
                            },
                            trigger: null, // Show immediately
                        });
                    }
                }
            });
        });

        return () => unsubscribe();
    }, [user?.id]);
}
