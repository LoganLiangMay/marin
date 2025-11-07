# Enable Firestore Database - Quick Setup

## Current Issue
Firebase Auth is working but Firestore Database returns "NOT_FOUND" error.
This means the Firestore database hasn't been created in your Firebase project yet.

## Quick Fix Steps

1. **Go to Firebase Console:**
   https://console.firebase.google.com/project/vid-ad/firestore

2. **Click "Create Database"**

3. **Choose Security Rules Mode:**
   - Select **"Start in test mode"** (for development)
   - This allows read/write access for 30 days

4. **Choose Location:**
   - Select **nam5 (us-central)** or your preferred region
   - Click "Enable"

5. **Wait for Database Creation:**
   - This takes about 30 seconds
   - You'll see an empty database once ready

6. **Test Connection:**
   After Firestore is enabled, test again:
   ```bash
   curl http://localhost:3000/api/firebase-admin-test
   ```

## Expected Result After Enabling
```json
{
  "success": true,
  "message": "✅ Firebase Admin SDK is fully connected!",
  "testResults": {
    "adminAuth": true,
    "adminDb": true,
    "testWrite": true,
    "testRead": true
  }
}
```

## Security Rules (for production later)
After development, update Firestore security rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can read/write
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Direct Link to Enable Firestore
Click here to enable Firestore for your project:
https://console.firebase.google.com/project/vid-ad/firestore/databases/-default-/data/~2F

After enabling, all Firebase services should be working!