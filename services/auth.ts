import { auth, db } from '@/FirebaseConfig';
import { PersonaType, User, UserLocation, UserPreferences, UserStats } from '@/types';
import {
    createUserWithEmailAndPassword,
    EmailAuthProvider,
    signOut as firebaseSignOut,
    User as FirebaseUser,
    onAuthStateChanged,
    reauthenticateWithCredential,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    updatePassword,
    updateProfile,
} from 'firebase/auth';
import { doc, getDoc, getDocFromCache, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

const defaultPreferences: UserPreferences = {
    nearbyRadius: 10,
    notifications: {
        reports: true,
        news: true,
        promotions: true,
        comments: true,
        upvotes: true,
    },
    darkMode: false,
};

const defaultStats: UserStats = {
    totalReports: 0,
    totalUpvotes: 0,
    resolvedIssues: 0,
    points: 0,
    level: 'bronze',
};

export const signUp = async (
    email: string,
    password: string
): Promise<FirebaseUser> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
};

export const signIn = async (
    email: string,
    password: string
): Promise<FirebaseUser> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
};

export const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth);
};

export const resetPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
};

export const createUserProfile = async (
    userId: string,
    data: {
        email: string;
        displayName: string;
        persona: PersonaType;
        location: UserLocation;
        interests: string[];
    }
): Promise<void> => {
    console.log('[createUserProfile] Creating profile for user:', userId);

    const userDoc: Omit<User, 'id'> = {
        email: data.email,
        displayName: data.displayName,
        persona: data.persona,
        location: data.location,
        interests: data.interests,
        preferences: defaultPreferences,
        stats: defaultStats,
        badges: ['newcomer'],
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Firestore write timeout - please check your internet connection')), 15000);
    });

    await Promise.race([
        setDoc(doc(db, 'users', userId), {
            ...userDoc,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        }),
        timeoutPromise,
    ]);

    console.log('[createUserProfile] Profile created successfully');
};

export const getUserProfile = async (userId: string): Promise<User | null> => {
    const docRef = doc(db, 'users', userId);

    try {
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
            } as User;
        }

        return null;
    } catch (error: any) {
        if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
            console.warn('Firestore offline, attempting to load from cache...');
            try {
                const cachedSnap = await getDocFromCache(docRef);
                if (cachedSnap.exists()) {
                    const data = cachedSnap.data();
                    return {
                        id: cachedSnap.id,
                        ...data,
                        createdAt: data.createdAt?.toDate() || new Date(),
                        updatedAt: data.updatedAt?.toDate() || new Date(),
                    } as User;
                }
            } catch (cacheError) {
                console.warn('No cached data available:', cacheError);
            }
        }
        throw error;
    }
};

export const updateUserProfile = async (
    userId: string,
    updates: Partial<User>
): Promise<void> => {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
};

export const updateUserPassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('No user logged in');

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
};

export const updateAuthProfile = async (
    user: FirebaseUser,
    data: { displayName?: string; photoURL?: string }
): Promise<void> => {
    await updateProfile(user, data);
};

export const onAuthChange = (
    callback: (user: FirebaseUser | null) => void
): (() => void) => {
    return onAuthStateChanged(auth, callback);
};

export const getCurrentUser = (): FirebaseUser | null => {
    return auth.currentUser;
};

export const hasCompletedOnboarding = async (userId: string): Promise<boolean> => {
    const profile = await getUserProfile(userId);
    return profile !== null && profile.persona !== undefined;
};
