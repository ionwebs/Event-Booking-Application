# 🚀 Event Booking Application - Complete Setup Guide

This guide will walk you through setting up the Event Booking Application from scratch, including Firebase configuration, environment setup, and deployment.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Firebase Project Setup](#firebase-project-setup)
- [Getting Firebase Credentials](#getting-firebase-credentials)
- [Local Development Setup](#local-development-setup)
- [Database Initialization](#database-initialization)
- [Security Rules Configuration](#security-rules-configuration)
- [Push Notifications Setup](#push-notifications-setup)
- [First Admin User](#first-admin-user)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download here](https://git-scm.com/)
- A **Google Account** (for Firebase)
- A modern web browser (Chrome, Firefox, Edge, or Safari)

---

## Firebase Project Setup

### Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter a project name (e.g., "Event Booking App")
4. (Optional) Enable Google Analytics if you want usage tracking
5. Click **"Create project"** and wait for it to initialize

### Step 2: Enable Authentication

1. In your Firebase project, click **"Authentication"** in the left sidebar
2. Click **"Get started"**
3. Go to the **"Sign-in method"** tab

#### Enable Email/Password Authentication

4. Find and click on **"Email/Password"** in the providers list
5. Toggle **"Enable"** to ON
6. Click **"Save"**

#### Enable Google Sign-In (Required)

7. Find and click on **"Google"** in the providers list
8. Toggle **"Enable"** to ON
9. Enter a **Project support email** (your email address)
10. Click **"Save"**

> **⚠️ Important**: Google Sign-In must be enabled for the application to work properly. Without it, you'll get a `CONFIGURATION_NOT_FOUND` error when trying to sign in.

### Step 3: Create Firestore Database

1. Click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Choose **"Start in production mode"** (we'll add custom rules later)
4. Select a Cloud Firestore location (choose one closest to your users)
5. Click **"Enable"**

---

## Getting Firebase Credentials

### Step 1: Get Web App Configuration

1. In Firebase Console, click the **gear icon** (⚙️) next to "Project Overview"
2. Select **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **Web icon** (`</>`) to add a web app
5. Enter an app nickname (e.g., "Event Booking Web")
6. Check **"Also set up Firebase Hosting"** (optional)
7. Click **"Register app"**

### Step 2: Copy Firebase Config

You'll see a `firebaseConfig` object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

**Keep this information handy** - you'll need it in the next section.

### Step 3: Get VAPID Key (for Push Notifications)

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Click on the **"Cloud Messaging"** tab
3. Scroll down to **"Web Push certificates"**
4. Click **"Generate key pair"**
5. Copy the **VAPID key** (starts with "B...")

---

## Local Development Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/ionwebs/Event-Booking-Application.git
cd Event-Booking-Application
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Create Environment File

Create a `.env` file in the root directory:

```bash
# On Windows
copy .env.example .env

# On macOS/Linux
cp .env.example .env
```

> **⚠️ Important**: The `.env` file is already in `.gitignore` and will NOT be committed to version control.

### Step 4: Configure Environment Variables

Open the `.env` file and add your Firebase credentials:

```env
# ============================================
# Firebase Web App Configuration
# (From Firebase Console > Project Settings > Your apps > Web app config)
# ============================================
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# ============================================
# VAPID Key for Push Notifications
# (From Firebase Console > Project Settings > Cloud Messaging > Web Push certificates)
# This is DIFFERENT from the API Key above!
# ============================================
VITE_FIREBASE_VAPID_KEY=BXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

#### 📋 Quick Reference: Where to Find Each Credential

| Environment Variable | Where to Find It | Looks Like |
|---------------------|------------------|------------|
| `VITE_FIREBASE_API_KEY` | Project Settings → Your apps → Web app config → `apiKey` | `AIza...` (short) |
| `VITE_FIREBASE_AUTH_DOMAIN` | Same config → `authDomain` | `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Same config → `projectId` | `your-project-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Same config → `storageBucket` | `your-project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Same config → `messagingSenderId` | `123456789012` |
| `VITE_FIREBASE_APP_ID` | Same config → `appId` | `1:123456789012:web:abc...` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Same config → `measurementId` | `G-XXXXXXXXXX` |
| `VITE_FIREBASE_VAPID_KEY` | Project Settings → Cloud Messaging → Web Push certificates | `B...` (very long, ~88 chars) |

> **⚠️ Important**: 
> - Replace all values with your actual Firebase credentials
> - Never commit the `.env` file to version control
> - The `.env` file should already be in `.gitignore`

### Step 5: Start Development Server

```bash
npm run dev
```

The application should now be running at `http://localhost:5173`

---

## Database Initialization

### Create Initial Collections

The application will automatically create collections when you use features, but you can manually create them:

1. Go to Firebase Console → **Firestore Database**
2. Click **"Start collection"**
3. Create the following collections:

#### Collections to Create:

- **`users`** - Stores user profiles and roles
- **`teams`** - Stores team/resource information
- **`bookings`** - Stores event bookings
- **`customFields`** - Stores custom field definitions
- **`notifications`** - Stores user notifications

You can leave these empty for now - they'll be populated as you use the app.

---

## Security Rules Configuration

### Step 1: Create Firestore Rules File

Create a file named `firestore.rules` in your project root (if it doesn't exist):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user is admin
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
      allow delete: if isAdmin();
    }
    
    // Teams collection
    match /teams/{teamId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    // Bookings collection
    match /bookings/{bookingId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && 
                      (resource.data.userId == request.auth.uid || isAdmin());
      allow delete: if isAuthenticated() && 
                      (resource.data.userId == request.auth.uid || isAdmin());
    }
    
    // Custom Fields collection
    match /customFields/{fieldId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    // Notifications collection
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() && 
                    resource.data.recipientId == request.auth.uid;
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && 
                      resource.data.recipientId == request.auth.uid;
      allow delete: if isAuthenticated() && 
                      resource.data.recipientId == request.auth.uid;
    }
  }
}
```

### Step 2: Deploy Security Rules

1. Go to Firebase Console → **Firestore Database**
2. Click on the **"Rules"** tab
3. Copy the entire content from `firestore.rules`
4. Paste it into the Firebase Console rules editor
5. Click **"Publish"**

---

## Push Notifications Setup

### Step 1: Create Service Worker

The project already includes `firebase-messaging-sw.js` in the `public` folder. Verify it exists and contains your Firebase config.

### Step 2: Test Notifications

1. Open the app in your browser
2. Click on the notification bell icon
3. Click **"Enable Notifications"** when prompted
4. Grant permission when your browser asks

> **Note**: Push notifications are NOT supported on iOS Safari/Chrome. They work on:
> - Android (Chrome, Firefox, Edge)
> - Desktop (Chrome, Firefox, Edge)

---

## First Admin User

### Method 1: Manual Setup (Recommended)

1. **Register a new user** through the app's signup page
2. Go to Firebase Console → **Firestore Database**
3. Find the `users` collection
4. Click on your user document
5. Click **"Add field"** or edit existing fields
6. Add/Update the `role` field:
   - Field: `role`
   - Type: `string`
   - Value: `admin`
7. Click **"Update"**
8. Refresh your app - you should now have admin access

### Method 2: Using Firebase Console

1. Go to Firebase Console → **Authentication**
2. Click **"Add user"**
3. Enter email and password
4. Click **"Add user"**
5. Copy the **User UID**
6. Go to **Firestore Database**
7. Click **"Start collection"** → Enter `users`
8. Document ID: Paste the User UID
9. Add fields:
   ```
   email: "admin@example.com"
   role: "admin"
   displayName: "Admin User"
   createdAt: [Current timestamp]
   ```
10. Click **"Save"**

---

## Troubleshooting

### Issue: "Firebase configuration is incomplete"

**Solution**: 
- Check that all environment variables in `.env` are set correctly
- Restart the development server after changing `.env`
- Verify there are no extra spaces or quotes in the `.env` file

### Issue: "auth/configuration-not-found" or Google Sign-In not working

**Solution**:
- Go to Firebase Console → **Authentication** → **Sign-in method**
- Enable **Google** provider
- Add a support email address
- Click **Save**
- Restart your development server

### Issue: "API key not valid"

**Solution**:
- Verify your API key in `.env` starts with `AIza`
- Make sure you copied the complete API key from Firebase Console
- Check for any extra spaces or quotes around the key
- API key should be approximately 39 characters long

### Issue: "Permission denied" errors in Firestore

**Solution**:
- Ensure you've deployed the security rules
- Check that your user has the correct role in Firestore
- Verify you're logged in

### Issue: Notifications not working

**Solution**:
- Verify VAPID key is correct in `.env`
- Check browser console for errors
- Ensure you're not on iOS (not supported)
- Grant notification permissions when prompted

### Issue: "Module not found" errors

**Solution**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port 5173 already in use

**Solution**:
```bash
# Kill the process using port 5173
# On Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# On macOS/Linux:
lsof -ti:5173 | xargs kill -9
```

---

## Next Steps

Once your setup is complete:

1. ✅ Create your first admin user
2. ✅ Create teams/resources in the Teams page
3. ✅ (Optional) Add custom fields for bookings
4. ✅ Create your first booking
5. ✅ Test notifications

For detailed feature documentation, see:
- [Authentication & User Roles](docs/AUTHENTICATION.md)
- [Booking System & Calendar](docs/BOOKING_SYSTEM.md)
- [Team Management](docs/TEAM_MANAGEMENT.md)
- [Push Notifications](docs/NOTIFICATIONS.md)
- [Custom Fields](docs/CUSTOM_FIELDS.md)

---

## 🎉 Congratulations!

Your Event Booking Application is now set up and ready to use!

For support or questions, please open an issue on [GitHub](https://github.com/ionwebs/Event-Booking-Application/issues) or contact us at [contact@ionwebs.com](mailto:contact@ionwebs.com).
