import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, query, where, orderBy, onSnapshot, limit, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
    return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [permission, setPermission] = useState(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            return Notification.permission;
        }
        return 'denied'; // Safe default for unsupported browsers
    });

    // Request browser permission
    const requestPermission = async () => {
        if (!('Notification' in window)) {
            console.log('This browser does not support desktop notification');
            return false;
        }

        const result = await Notification.requestPermission();
        setPermission(result);
        return result === 'granted';
    };

    // Send browser notification
    const sendBrowserNotification = (title, body) => {
        // Add safety check for browsers without Notification API
        if (!('Notification' in window)) {
            console.log('Browser notifications not supported');
            return;
        }

        if (permission === 'granted') {
            new Notification(title, {
                body,
                icon: '/vite.svg'
            });
        }
    };

    // Mark as read
    const markAsRead = async (notificationId) => {
        try {
            const notificationRef = doc(db, 'notifications', notificationId);
            await updateDoc(notificationRef, { read: true });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            const batch = writeBatch(db);
            notifications.forEach(notif => {
                if (!notif.read) {
                    const ref = doc(db, 'notifications', notif.id);
                    batch.update(ref, { read: true });
                }
            });
            await batch.commit();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    useEffect(() => {
        if (!currentUser) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        // Query last 20 notifications for the current user
        const q = query(
            collection(db, 'notifications'),
            where('recipientId', '==', currentUser.uid),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log('🔔 Notification Snapshot:', snapshot.size, 'docs');

            const newNotifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
            }));

            // Check for NEW unread notifications to trigger alert
            if (newNotifications.length > 0) {
                const latest = newNotifications[0];
                const now = new Date();
                const diff = (now - latest.createdAt) / 1000;

                console.log('🔔 Latest:', latest.title, '| Read:', latest.read, '| Age (s):', diff);

                if (!latest.read && diff < 10) {
                    console.log('🔔 Triggering Browser Notification for:', latest.title);
                    sendBrowserNotification(latest.title, latest.message);
                }
            }

            setNotifications(newNotifications);
            setUnreadCount(newNotifications.filter(n => !n.read).length);
        }, (error) => {
            console.error("🔥 Error listening to notifications:", error);
        });

        return () => unsubscribe();
    }, [currentUser, permission]); // Re-run if user changes

    const value = {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        requestPermission,
        permission
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
