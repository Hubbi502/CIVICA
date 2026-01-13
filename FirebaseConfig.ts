// Firebase Configuration for CIVICA
// @ts-ignore - Using React Native specific Firebase auth bundle
import { getReactNativePersistence } from '@firebase/auth/dist/rn/index.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { Auth, getAuth, initializeAuth } from 'firebase/auth';
import { CACHE_SIZE_UNLIMITED, Firestore, getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

// Your Firebase configuration
// TODO: Replace with your actual Firebase config from console.firebase.google.com
const firebaseConfig = {
    apiKey: "AIzaSyCD0ctDQMrcfldYX4IjwyGsmoz7s_we_dM",
    authDomain: "civica-4c460.firebaseapp.com",
    projectId: "civica-4c460",
    storageBucket: "civica-4c460.firebasestorage.app",
    messagingSenderId: "409117416271",
    appId: "1:409117416271:web:21a946a79f70794aa5833a",
    measurementId: "G-R76VM6HXYB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence for React Native
let auth: Auth;
if (Platform.OS === 'web') {
    auth = getAuth(app);
} else {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
    });
}

// Initialize Firestore with settings that work better in React Native
// experimentalForceLongPolling and experimentalAutoDetectLongPolling help with
// network connectivity issues in React Native environments
let db: Firestore;
if (Platform.OS === 'web') {
    db = getFirestore(app);
} else {
    db = initializeFirestore(app, {
        experimentalForceLongPolling: true, // This helps with React Native network issues
        cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    });
}

// Initialize Storage
const storage = getStorage(app);

export { app, auth, db, storage };

