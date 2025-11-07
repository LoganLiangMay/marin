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
exports.updateVideoStatus = exports.processVideoGeneration = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
// Process video generation request
exports.processVideoGeneration = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { projectId, script, settings } = data;
    const userId = context.auth.uid;
    try {
        // Check user's credits
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        if (!userData || userData.subscription.creditsRemaining <= 0) {
            throw new functions.https.HttpsError('resource-exhausted', 'Insufficient credits');
        }
        // Create video document
        const videoRef = db.collection('videos').doc();
        const videoId = videoRef.id;
        await videoRef.set({
            id: videoId,
            projectId,
            userId,
            script,
            settings,
            status: 'queued',
            progress: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            processingSteps: {
                scriptGeneration: 'pending',
                imageGeneration: 'pending',
                voiceGeneration: 'pending',
                videoComposition: 'pending',
                finalRendering: 'pending'
            }
        });
        // TODO: Trigger actual video processing pipeline
        // This would typically involve:
        // 1. GPT-4o for script enhancement
        // 2. DALL-E 3 for image generation
        // 3. OpenAI TTS for voice generation
        // 4. FFmpeg for video composition
        // 5. Upload to S3/CloudFront
        return {
            success: true,
            videoId,
            message: 'Video generation started'
        };
    }
    catch (error) {
        console.error('Error processing video generation:', error);
        throw new functions.https.HttpsError('internal', 'Failed to process video generation');
    }
});
// Update video processing status
exports.updateVideoStatus = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { videoId, status, progress, step } = data;
    const userId = context.auth.uid;
    try {
        const videoRef = db.collection('videos').doc(videoId);
        const videoDoc = await videoRef.get();
        if (!videoDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Video not found');
        }
        const videoData = videoDoc.data();
        if (videoData?.userId !== userId) {
            throw new functions.https.HttpsError('permission-denied', 'Not authorized to update this video');
        }
        const updateData = {
            status,
            progress,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        if (step) {
            updateData[`processingSteps.${step}`] = status;
        }
        await videoRef.update(updateData);
        return { success: true };
    }
    catch (error) {
        console.error('Error updating video status:', error);
        throw new functions.https.HttpsError('internal', 'Failed to update video status');
    }
});
//# sourceMappingURL=video.js.map