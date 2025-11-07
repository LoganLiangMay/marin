import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// Trigger when a new user is created
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName, photoURL } = user;

  // Create user document in Firestore
  try {
    await db.collection('users').doc(uid).set({
      email: email || '',
      displayName: displayName || '',
      photoURL: photoURL || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      subscription: {
        plan: 'free',
        creditsRemaining: 5, // Free tier credits
        creditsUsed: 0,
        resetDate: null
      },
      preferences: {
        theme: 'light',
        emailNotifications: true,
        language: 'en'
      },
      stats: {
        videosGenerated: 0,
        totalProcessingTime: 0,
        storageUsed: 0
      }
    });

    console.log(`User document created for ${uid}`);
  } catch (error) {
    console.error('Error creating user document:', error);
  }
});

// Trigger when a user is deleted
export const onUserDelete = functions.auth.user().onDelete(async (user) => {
  const { uid } = user;

  try {
    // Delete user document
    await db.collection('users').doc(uid).delete();

    // Delete user's projects
    const projectsSnapshot = await db.collection('projects')
      .where('userId', '==', uid)
      .get();

    const batch = db.batch();
    projectsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    console.log(`User data deleted for ${uid}`);
  } catch (error) {
    console.error('Error deleting user data:', error);
  }
});

// Update last login timestamp
export const updateLastLogin = functions.https.onCall(async (_data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const uid = context.auth.uid;

  try {
    await db.collection('users').doc(uid).update({
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating last login:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to update last login'
    );
  }
});