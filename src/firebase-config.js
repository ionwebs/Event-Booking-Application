import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Detect iOS devices - Firebase Messaging is not supported on iOS Safari/Chrome
const isIOS = typeof window !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !window.MSStream;

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Log configuration status (remove in production)
console.log('Firebase Config Status:', {
    apiKey: firebaseConfig.apiKey ? '✓ Set' : '✗ Missing',
    authDomain: firebaseConfig.authDomain ? '✓ Set' : '✗ Missing',
    projectId: firebaseConfig.projectId ? '✓ Set' : '✗ Missing',
    storageBucket: firebaseConfig.storageBucket ? '✓ Set' : '✗ Missing',
    messagingSenderId: firebaseConfig.messagingSenderId ? '✓ Set' : '✗ Missing',
    appId: firebaseConfig.appId ? '✓ Set' : '✗ Missing',
    platform: isIOS ? 'iOS (Messaging disabled)' : 'Desktop/Android'
});

// Check if configuration is valid
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('❌ Firebase configuration is incomplete! Check your .env file.');
    console.error('Make sure all VITE_FIREBASE_* variables are set correctly.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Firebase Cloud Messaging (only on supported platforms)
let messaging = null;
if (!isIOS) {
    try {
        messaging = getMessaging(app);
        console.log('✅ Firebase Messaging initialized');
    } catch (error) {
        console.warn('⚠️ Firebase Messaging not supported in this browser:', error);
    }
} else {
    console.info('ℹ️ Firebase Messaging disabled on iOS (not supported by iOS Safari/Chrome)');
}

export { messaging };

// Request notification permission and get FCM token
export const requestNotificationPermission = async () => {
    // Check if running on iOS
    const isIOSDevice = typeof window !== 'undefined' &&
        /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !window.MSStream;

    if (isIOSDevice) {
        console.info('Push notifications not supported on iOS web browsers');
        return null;
    }

    // Check if messaging is initialized
    if (!messaging) {
        console.warn('Messaging not initialized');
        return null;
    }

    try {
        // Check if Notification API is available
        if (!('Notification' in window)) {
            console.warn('Notification API not available');
            return null;
        }

        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            const token = await getToken(messaging, {
                vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
            });

            console.log('FCM Token:', token);
            return token;
        } else {
            console.log('Notification permission denied');
            return null;
        }
    } catch (error) {
        console.error('Error getting notification permission:', error);
        return null;
    }
};

// Listen for foreground messages
export const onMessageListener = () => {
    if (!messaging) {
        return Promise.reject('Messaging not initialized');
    }

    return new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            console.log('Message received:', payload);
            resolve(payload);
        });
    });
};

export default app;
