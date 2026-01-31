import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications: typeof import('expo-notifications');

// expo-notifications crashes in Expo Go on Android (SDK 53+) due to removed functionality.
// We mock it for Expo Go to allow the app to run (without notifications).
if (isExpoGo && Platform.OS === 'android') {
    console.warn('Expo Notifications are not supported in Expo Go on Android. Notifications will be disabled.');

    Notifications = {
        setNotificationHandler: async () => { },
        scheduleNotificationAsync: async () => { },
        addNotificationResponseReceivedListener: () => ({ remove: () => { } }),
        addNotificationReceivedListener: () => ({ remove: () => { } }),
        getExpoPushTokenAsync: async () => ({ data: '' }),
        getDevicePushTokenAsync: async () => ({ data: '' }),
        requestPermissionsAsync: async () => ({ status: 'granted' }), // Mock granted to avoid loops
        getPermissionsAsync: async () => ({ status: 'granted' }),
        setNotificationChannelAsync: async () => { },
        getLastNotificationResponseAsync: async () => null,
        AndroidImportance: {
            MAX: 5,
            HIGH: 4,
            DEFAULT: 3,
            LOW: 2,
            MIN: 1,
            NONE: 0,
        },
    } as any;
} else {
    try {
        Notifications = require('expo-notifications');
    } catch (error) {
        console.error('Failed to load expo-notifications:', error);
        Notifications = {} as any;
    }
}

export default Notifications;
