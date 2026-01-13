import * as authService from '@/services/auth';
import { PersonaType, User, UserLocation } from '@/types';
import { User as FirebaseUser } from 'firebase/auth';
import { create } from 'zustand';

interface OnboardingData {
    location?: UserLocation;
    interests?: string[];
    persona?: PersonaType;
    preferences?: string[];
}

interface AuthState {
    firebaseUser: FirebaseUser | null;
    user: User | null;
    isLoading: boolean;
    isInitialized: boolean;
    error: string | null;

    onboardingData: OnboardingData;

    initialize: () => () => void;
    signUp: (email: string, password: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;

    setOnboardingLocation: (location: UserLocation) => void;
    setOnboardingInterests: (interests: string[]) => void;
    setOnboardingPersona: (persona: PersonaType) => void;
    setOnboardingPreferences: (preferences: string[]) => void;
    completeOnboarding: (displayName: string) => Promise<void>;

    refreshProfile: () => Promise<void>;
    updateProfile: (updates: Partial<User>) => Promise<void>;

    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    firebaseUser: null,
    user: null,
    isLoading: true,
    isInitialized: false,
    error: null,
    onboardingData: {},

    initialize: () => {
        const unsubscribe = authService.onAuthChange(async (firebaseUser) => {
            set({ isLoading: true });

            if (firebaseUser) {
                try {
                    const profile = await authService.getUserProfile(firebaseUser.uid);
                    set({
                        firebaseUser,
                        user: profile,
                        isLoading: false,
                        isInitialized: true,
                    });
                } catch (error) {
                    console.error('Error loading user profile:', error);
                    set({
                        firebaseUser,
                        user: null,
                        isLoading: false,
                        isInitialized: true,
                    });
                }
            } else {
                set({
                    firebaseUser: null,
                    user: null,
                    isLoading: false,
                    isInitialized: true,
                    onboardingData: {},
                });
            }
        });

        return unsubscribe;
    },

    signUp: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
            const firebaseUser = await authService.signUp(email, password);
            set({ firebaseUser, isLoading: false });
        } catch (error: any) {
            set({
                error: error.message || 'Failed to sign up',
                isLoading: false
            });
            throw error;
        }
    },

    signIn: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
            const firebaseUser = await authService.signIn(email, password);
            const profile = await authService.getUserProfile(firebaseUser.uid);
            set({
                firebaseUser,
                user: profile,
                isLoading: false
            });
        } catch (error: any) {
            set({
                error: error.message || 'Failed to sign in',
                isLoading: false
            });
            throw error;
        }
    },

    signOut: async () => {
        set({ isLoading: true, error: null });
        try {
            await authService.signOut();
            set({
                firebaseUser: null,
                user: null,
                isLoading: false,
                onboardingData: {},
            });
        } catch (error: any) {
            set({
                error: error.message || 'Failed to sign out',
                isLoading: false
            });
            throw error;
        }
    },

    resetPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
            await authService.resetPassword(email);
            set({ isLoading: false });
        } catch (error: any) {
            set({
                error: error.message || 'Failed to send reset email',
                isLoading: false
            });
            throw error;
        }
    },

    setOnboardingLocation: (location: UserLocation) => {
        set((state) => ({
            onboardingData: { ...state.onboardingData, location },
        }));
    },

    setOnboardingInterests: (interests: string[]) => {
        set((state) => ({
            onboardingData: { ...state.onboardingData, interests },
        }));
    },

    setOnboardingPersona: (persona: PersonaType) => {
        set((state) => ({
            onboardingData: { ...state.onboardingData, persona },
        }));
    },

    setOnboardingPreferences: (preferences: string[]) => {
        set((state) => ({
            onboardingData: { ...state.onboardingData, preferences },
        }));
    },

    completeOnboarding: async (displayName: string) => {
        const { firebaseUser, onboardingData } = get();

        console.log('[completeOnboarding] Starting with data:', {
            hasFirebaseUser: !!firebaseUser,
            location: onboardingData.location,
            persona: onboardingData.persona,
            interests: onboardingData.interests,
        });

        if (!firebaseUser) {
            throw new Error('No authenticated user');
        }

        if (!onboardingData.location || !onboardingData.persona) {
            throw new Error('Onboarding data incomplete: missing location or persona');
        }

        set({ isLoading: true, error: null });

        try {
            console.log('[completeOnboarding] Updating Firebase Auth profile...');
            await authService.updateAuthProfile(firebaseUser, { displayName });

            console.log('[completeOnboarding] Creating Firestore user profile...');
            await authService.createUserProfile(firebaseUser.uid, {
                email: firebaseUser.email!,
                displayName,
                persona: onboardingData.persona,
                location: onboardingData.location,
                interests: onboardingData.interests || [],
            });

            console.log('[completeOnboarding] Reloading profile...');
            const profile = await authService.getUserProfile(firebaseUser.uid);

            console.log('[completeOnboarding] Success! Profile:', profile);
            set({
                user: profile,
                isLoading: false,
                onboardingData: {},
            });
        } catch (error: any) {
            console.error('[completeOnboarding] Error:', error);
            set({
                error: error.message || 'Failed to complete onboarding',
                isLoading: false
            });
            throw error;
        }
    },

    refreshProfile: async () => {
        const { firebaseUser } = get();
        if (!firebaseUser) return;

        try {
            const profile = await authService.getUserProfile(firebaseUser.uid);
            set({ user: profile });
        } catch (error) {
            console.error('Failed to refresh profile:', error);
        }
    },

    updateProfile: async (updates: Partial<User>) => {
        const { firebaseUser, user } = get();
        if (!firebaseUser || !user) return;

        set({ isLoading: true, error: null });

        try {
            await authService.updateUserProfile(firebaseUser.uid, updates);
            set({
                user: { ...user, ...updates },
                isLoading: false,
            });
        } catch (error: any) {
            set({
                error: error.message || 'Failed to update profile',
                isLoading: false
            });
            throw error;
        }
    },

    clearError: () => set({ error: null }),
}));
