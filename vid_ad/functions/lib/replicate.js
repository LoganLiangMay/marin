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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelReplicateVideo = exports.checkReplicateVideoStatus = exports.generateReplicateVideo = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const replicate_1 = __importDefault(require("replicate"));
const db = admin.firestore();
// Initialize Replicate client
const getReplicateClient = () => {
    const apiToken = process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY;
    if (!apiToken) {
        throw new functions.https.HttpsError('failed-precondition', 'Replicate API token not configured');
    }
    return new replicate_1.default({ auth: apiToken });
};
// Start video generation with Replicate
exports.generateReplicateVideo = functions.https.onCall(async (data, context) => {
    // TODO: Re-enable authentication when auth system is ready
    // For now, allow unauthenticated requests for testing
    const userId = context.auth?.uid || 'anonymous-user';
    try {
        const { model, prompt, duration, aspectRatio, resolution, seed, cameraFixed, image, lastFrameImage, productName, productDescription, keywords, brandTone, primaryColor, callToAction, targetAudience, } = data;
        // TODO: Re-enable credits check when user system is ready
        // For now, skip credits check for testing
        // Check user's credits (optional for testing)
        if (userId !== 'anonymous-user') {
            const userDoc = await db.collection('users').doc(userId).get();
            const userData = userDoc.data();
            if (userData && userData.subscription?.creditsRemaining <= 0) {
                throw new functions.https.HttpsError('resource-exhausted', 'Insufficient credits');
            }
        }
        // Initialize Replicate
        const replicate = getReplicateClient();
        // Construct model identifier
        const modelIdentifier = model === 'seedance-1-pro'
            ? 'bytedance/seedance-1-pro'
            : 'bytedance/seedance-1-lite';
        console.log(`🎬 Starting video generation with ${modelIdentifier}`);
        console.log('📝 Input:', { prompt, duration, aspectRatio, resolution });
        // Build input object for Replicate
        const input = {
            prompt,
            duration: duration || 7,
            aspect_ratio: aspectRatio || '16:9',
        };
        // Add optional parameters only if they have valid values (not null/undefined)
        if (resolution)
            input.resolution = resolution;
        if (seed !== undefined && seed !== null)
            input.seed = seed;
        if (cameraFixed !== undefined && cameraFixed !== null)
            input.camera_fixed = cameraFixed;
        if (image)
            input.image = image;
        if (lastFrameImage)
            input.last_frame_image = lastFrameImage;
        // Start prediction
        const prediction = await replicate.predictions.create({
            version: await getModelVersion(modelIdentifier, replicate),
            input,
        });
        console.log(`✅ Prediction created: ${prediction.id}`);
        // Create video generation document in Firestore
        const videoRef = db.collection('videoGenerations').doc();
        const videoId = videoRef.id;
        console.log(`📝 Creating Firestore document with ID: ${videoId}`);
        // Build document data - only include defined fields
        const docData = {
            id: videoId,
            userId,
            predictionId: prediction.id,
            model: modelIdentifier,
            status: prediction.status || 'starting',
            input,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        // Add optional fields only if they're defined
        if (productName !== undefined)
            docData.productName = productName;
        if (productDescription !== undefined)
            docData.productDescription = productDescription;
        if (keywords !== undefined)
            docData.keywords = keywords;
        if (brandTone !== undefined)
            docData.brandTone = brandTone;
        if (primaryColor !== undefined)
            docData.primaryColor = primaryColor;
        if (callToAction !== undefined)
            docData.callToAction = callToAction;
        if (targetAudience !== undefined)
            docData.targetAudience = targetAudience;
        try {
            await videoRef.set(docData);
            console.log(`✅ Firestore document created successfully: ${videoId}`);
        }
        catch (firestoreError) {
            console.error('❌ Firestore write error:', firestoreError);
            console.error('Error code:', firestoreError.code);
            console.error('Error message:', firestoreError.message);
            console.error('Error details:', firestoreError.details);
            throw firestoreError;
        }
        return {
            success: true,
            videoId,
            predictionId: prediction.id,
            status: prediction.status,
            message: 'Video generation started',
        };
    }
    catch (error) {
        console.error('❌ Error generating video:', error);
        throw new functions.https.HttpsError('internal', `Failed to start video generation: ${error.message}`);
    }
});
// Check video generation status
exports.checkReplicateVideoStatus = functions.https.onCall(async (data, context) => {
    // TODO: Re-enable authentication when auth system is ready
    const { predictionId, videoId } = data;
    const userId = context.auth?.uid || 'anonymous-user';
    try {
        // Verify ownership (skip for anonymous users during testing)
        if (videoId && userId !== 'anonymous-user') {
            const videoRef = db.collection('videoGenerations').doc(videoId);
            const videoDoc = await videoRef.get();
            if (!videoDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'Video not found');
            }
            const videoData = videoDoc.data();
            if (videoData?.userId !== userId) {
                throw new functions.https.HttpsError('permission-denied', 'Not authorized to check this video');
            }
        }
        // Get prediction status from Replicate
        const replicate = getReplicateClient();
        const prediction = await replicate.predictions.get(predictionId);
        console.log(`📊 Prediction ${predictionId} status: ${prediction.status}`);
        // Update Firestore if videoId provided
        if (videoId) {
            const videoRef = db.collection('videoGenerations').doc(videoId);
            await videoRef.update({
                status: prediction.status,
                output: prediction.output || null,
                error: prediction.error || null,
                logs: prediction.logs || null,
                metrics: prediction.metrics || null,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        return {
            success: true,
            predictionId: prediction.id,
            status: prediction.status,
            output: prediction.output,
            error: prediction.error,
            logs: prediction.logs,
            metrics: prediction.metrics,
        };
    }
    catch (error) {
        console.error('❌ Error checking video status:', error);
        throw new functions.https.HttpsError('internal', `Failed to check video status: ${error.message}`);
    }
});
// Cancel video generation
exports.cancelReplicateVideo = functions.https.onCall(async (data, context) => {
    // TODO: Re-enable authentication when auth system is ready
    const { predictionId, videoId } = data;
    const userId = context.auth?.uid || 'anonymous-user';
    try {
        // Verify ownership (skip for anonymous users during testing)
        if (videoId && userId !== 'anonymous-user') {
            const videoRef = db.collection('videoGenerations').doc(videoId);
            const videoDoc = await videoRef.get();
            if (!videoDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'Video not found');
            }
            const videoData = videoDoc.data();
            if (videoData?.userId !== userId) {
                throw new functions.https.HttpsError('permission-denied', 'Not authorized to cancel this video');
            }
        }
        // Cancel prediction on Replicate
        const replicate = getReplicateClient();
        await replicate.predictions.cancel(predictionId);
        console.log(`🛑 Prediction ${predictionId} cancelled`);
        // Update Firestore if videoId provided
        if (videoId) {
            const videoRef = db.collection('videoGenerations').doc(videoId);
            await videoRef.update({
                status: 'cancelled',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        return {
            success: true,
            predictionId,
            status: 'cancelled',
        };
    }
    catch (error) {
        console.error('❌ Error cancelling video:', error);
        throw new functions.https.HttpsError('internal', `Failed to cancel video: ${error.message}`);
    }
});
// Helper: Get model version
async function getModelVersion(modelIdentifier, replicate) {
    // Hardcoded version IDs for known models (updated: 2025-01-06)
    const KNOWN_VERSIONS = {
        'bytedance/seedance-1-lite': '31a8c59a257877f6c581596e70d0eb2b5702a7effc4a637835733419cb829bf2',
        'bytedance/seedance-1-pro': '1871e45bb27de8a632f899d769bcb71e85699e82937cf0e48e89e5ab19615e72',
    };
    // Return hardcoded version if available
    if (KNOWN_VERSIONS[modelIdentifier]) {
        console.log(`✅ Using hardcoded version for ${modelIdentifier}`);
        return KNOWN_VERSIONS[modelIdentifier];
    }
    // Try to fetch from Replicate API as fallback
    try {
        const parts = modelIdentifier.split('/');
        const owner = parts[0];
        const name = parts[1];
        if (!owner || !name) {
            throw new Error(`Invalid model identifier: ${modelIdentifier}`);
        }
        console.log(`🔍 Fetching version from API for ${modelIdentifier}`);
        const model = await replicate.models.get(owner, name);
        if (model.latest_version?.id) {
            console.log(`✅ Retrieved version from API: ${model.latest_version.id}`);
            return model.latest_version.id;
        }
        throw new Error('No version found for model');
    }
    catch (error) {
        console.error('❌ Error getting model version:', error);
        throw new functions.https.HttpsError('not-found', `Could not find version for model: ${modelIdentifier}`);
    }
}
//# sourceMappingURL=replicate.js.map