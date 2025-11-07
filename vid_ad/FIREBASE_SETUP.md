# Firebase Setup Instructions

## Current Status
✅ Firebase SDK and configuration files are set up
✅ Firebase credentials added to `.env.local`
✅ Firebase Auth Admin SDK is connected
⚠️ Firestore Database needs to be enabled in Firebase Console

## Steps to Complete Firebase Setup:

### 1. Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Create Project" or select an existing project
3. Name your project (e.g., "ai-video-ad-generator")

### 2. Enable Required Services
In Firebase Console, enable:
- **Authentication** → Sign-in method → Email/Password
- **Firestore Database** → Create database → Start in test mode
- **Storage** → Get started

### 3. Get Your Configuration
1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click "Web" icon (</>) to add a web app
4. Register app with a nickname
5. Copy the configuration object

### 4. Update .env.local
Replace the placeholder values in `/Applications/Gauntlet/marin/vid_ad/.env.local` with your actual Firebase config:

```env
# Replace these with your actual values from Firebase Console:
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...your-actual-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 5. Get Service Account Key (for Admin SDK)
1. In Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save the JSON file
4. Update these values in `.env.local`:

```env
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...your-key...\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

### 6. Test Connection
After updating `.env.local`:
1. Restart the dev server: `npm run dev`
2. Visit http://localhost:3000/test-firebase
3. Click "Re-test Connection" button
4. You should see green checkmarks for Auth and Firestore

## Test Endpoints
- **API Test**: http://localhost:3000/api/firebase-test
- **UI Test**: http://localhost:3000/test-firebase

## Troubleshooting
- Make sure you're editing `.env.local` NOT `.env.example`
- Restart the dev server after changing environment variables
- Check browser console for any Firebase errors
- Ensure Firebase project has billing enabled if using certain features

## Current File Location
Your `.env.local` file is at:
`/Applications/Gauntlet/marin/vid_ad/.env.local`

Once you update this file with real Firebase credentials, the system will automatically connect!