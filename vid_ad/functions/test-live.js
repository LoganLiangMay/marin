/**
 * Live test of OpenAI integration via Firebase emulator
 */

const axios = require('axios');

async function testGenerateScript() {
  console.log('🧪 Testing generateScript with real OpenAI API call...\n');

  const testData = {
    data: {
      productName: 'Smart Water Bottle',
      productDescription: 'A smart bottle that tracks your hydration and reminds you to drink water.',
      brandTone: 'casual',
      duration: 10,
      variationCount: 1, // Just 1 to keep costs low (~$0.01)
    }
  };

  console.log('Test Request:', JSON.stringify(testData, null, 2));
  console.log('\nCalling Firebase emulator endpoint...\n');

  try {
    // For Firebase callable functions, we need to mock the auth context
    // The emulator accepts a special format for testing
    const response = await axios.post(
      'http://127.0.0.1:5001/vid-ad/us-central1/generateScript',
      {
        data: testData.data
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token' // Mock auth for testing
        },
        timeout: 60000 // 60 second timeout
      }
    );

    console.log('✅ SUCCESS!\n');
    console.log('Response:', JSON.stringify(response.data, null, 2));

    // Extract key metrics
    if (response.data && response.data.result) {
      const result = response.data.result;
      console.log('\n📊 Generation Metrics:');
      console.log(`   Scripts Generated: ${result.variationCount}`);
      console.log(`   Tokens Used: ${result.usage.totalTokens}`);
      console.log(`   Estimated Cost: $${result.usage.estimatedCost.toFixed(4)}`);
      console.log(`   Generation Time: ${result.generationTime}ms`);
      console.log(`   Script ID: ${result.scriptId}`);

      if (result.scripts && result.scripts[0]) {
        const script = result.scripts[0].script;
        console.log('\n📝 Generated Script:');
        console.log(`   Title: ${script.title || 'N/A'}`);
        console.log(`   Scenes: ${script.scenes?.length || 0}`);
        console.log(`   Total Duration: ${script.totalDuration}s`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR:', error.response?.data || error.message);
    process.exit(1);
  }
}

testGenerateScript();
