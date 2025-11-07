const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDAjuN7DdBwYp-jbqj2Ggqr_MpkGNO0IM0",
  authDomain: "vid-ad.firebaseapp.com",
  projectId: "vid-ad",
  storageBucket: "vid-ad.firebasestorage.app",
  messagingSenderId: "1027409091749",
  appId: "1:1027409091749:web:27f5ea72b77df64697e73d",
  measurementId: "G-5JW3H50NFJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

async function testReplicateVideo() {
  console.log('🧪 Testing Replicate video generation...\n');

  try {
    const generateVideoFn = httpsCallable(functions, 'generateReplicateVideo');

    console.log('📤 Calling generateReplicateVideo function...');
    const result = await generateVideoFn({
      model: 'seedance-1-lite',
      prompt: 'A serene mountain landscape at sunset with golden light',
      duration: 5,
      aspectRatio: '16:9',
      resolution: '720p',
      productName: 'Test Product',
      productDescription: 'Testing Replicate integration'
    });

    const data = result.data;

    console.log('\n✅ Success!');
    console.log('📊 Response:', JSON.stringify(data, null, 2));
    console.log('\n🎬 Video ID:', data.videoId);
    console.log('🔮 Prediction ID:', data.predictionId);
    console.log('📈 Status:', data.status);

    // Now check status
    console.log('\n⏳ Checking video status...');
    const checkStatusFn = httpsCallable(functions, 'checkReplicateVideoStatus');

    const statusResult = await checkStatusFn({
      predictionId: data.predictionId,
      videoId: data.videoId
    });

    const statusData = statusResult.data;
    console.log('\n📊 Status Response:', JSON.stringify(statusData, null, 2));
    console.log('📈 Current Status:', statusData.status);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Details:', error);
  }
}

testReplicateVideo();
