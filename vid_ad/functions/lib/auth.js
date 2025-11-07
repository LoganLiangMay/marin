"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLastLogin = exports.onUserDelete = exports.onUserCreate = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
// Trigger when a new user is created
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
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
    }
    catch (error) {
        console.error('Error creating user document:', error);
    }
});
// Trigger when a user is deleted
exports.onUserDelete = functions.auth.user().onDelete(async (user) => {
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
    }
    catch (error) {
        console.error('Error deleting user data:', error);
    }
});
// Update last login timestamp
exports.updateLastLogin = functions.https.onCall(async (_data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const uid = context.auth.uid;
    try {
        await db.collection('users').doc(uid).update({
            lastLogin: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    }
    catch (error) {
        console.error('Error updating last login:', error);
        throw new functions.https.HttpsError('internal', 'Failed to update last login');
    }
});
//# sourceMappingURL=auth.js.map