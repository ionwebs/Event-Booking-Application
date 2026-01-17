# Notification System

## Overview
A dual-layer notification system providing both in-app dropdown alerts and native browser push notifications.

## Architecture
1.  **Trigger**:
    - User A performs an action (Create/Update Booking).
    - `BookingForm.jsx` calls `notifyUsers()`.
    - This function queries ALL approved users (excluding User A) and batch-writes documents to the `notifications` collection.

2.  **Listener**:
    - `NotificationContext.jsx` maintains a real-time `onSnapshot` listener for the current user's `recipientId`.

3.  **Delivery**:
    - **In-App**: Updates the unread count badge + dropdown list immediately.
    - **Browser Push**: If permission is granted (`Notification.requestPermission`), the browser shows a system toast.

## Troubleshooting
- **"0 Docs" Log**: Means you have no unread notifications. Test with a second user account.
- **"Missing Permissions"**: Ensure Firestore rules allow reading `users` (to find recipients) and creating `notifications`.
- **"Index Error"**: Ensure the composite index for `recipientId` + `createdAt` is enabled in Firebase Console.

## Rules
We strictly prevent self-notifications:
```javascript
if (userDoc.id !== currentUser.uid) {
  // queue notification
}
```
