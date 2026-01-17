# Authentication & User Management

## Overview
The application uses **Firebase Authentication** coupled with a custom Firestore `users` collection to manage identity and access control.

## Components
- **AuthContext**: Global state management for current user, loading state, and role checks.
- **Login/Register**: Standard email/password and Google Sign-In options.
- **AdminDashboard**: Interface for admins to approve/reject new users.

## User Roles
1.  **Pending**: Default state upon signup. Can login but cannot view teams, bookings, or notifications.
2.  **Approved**: Standard user. Can view all data, create bookings, and receive notifications.
3.  **Admin**: Can manage other users (approve/reject/change roles).

## Approval Workflow
1.  User signs up -> Status `pending`.
2.  Admin receives request (visible in Admin Dashboard).
3.  Admin clicks "Approve" -> Status updates to `approved`.
4.  User gains access to application features.

## Security Rules
Firestore rules enforce these roles strictly:
```javascript
// Example Rule
function isApproved() {
  return request.auth != null && 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status == 'approved';
}
```
