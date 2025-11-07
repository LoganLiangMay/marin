import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// Process video generation request
export const processVideoGeneration = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const { projectId, script, settings } = data;
  const userId = context.auth.uid;

  try {
    // Check user's credits
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || userData.subscription.creditsRemaining <= 0) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Insufficient credits'
      );
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
  } catch (error) {
    console.error('Error processing video generation:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to process video generation'
    );
  }
});

// Update video processing status
export const updateVideoStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const { videoId, status, progress, step } = data;
  const userId = context.auth.uid;

  try {
    const videoRef = db.collection('videos').doc(videoId);
    const videoDoc = await videoRef.get();

    if (!videoDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Video not found'
      );
    }

    const videoData = videoDoc.data();
    if (videoData?.userId !== userId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Not authorized to update this video'
      );
    }

    const updateData: any = {
      status,
      progress,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (step) {
      updateData[`processingSteps.${step}`] = status;
    }

    await videoRef.update(updateData);

    return { success: true };
  } catch (error) {
    console.error('Error updating video status:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to update video status'
    );
  }
});