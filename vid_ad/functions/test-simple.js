/**
 * Simple test of OpenAI prompt engineering without Firebase dependencies
 */

const OpenAI = require('openai');
const { generatePrompt } = require('./lib/prompts');

// Load .env file
require('dotenv').config();

async function testOpenAIIntegration() {
  console.log('🧪 Testing OpenAI Integration...\n');

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 60000,
    maxRetries: 3,
  });

  console.log('✅ OpenAI client initialized');
  console.log(`✅ API key configured: ${process.env.OPENAI_API_KEY ? 'Yes' : 'No'}\n`);

  // Test prompt generation
  const scriptParams = {
    productName: 'Smart Water Bottle',
    productDescription: 'A smart bottle that tracks your hydration and reminds you to drink water.',
    brandTone: 'casual',
    targetAudience: 'health-conscious millennials',
    duration: 10,
    keywords: ['hydration', 'smart', 'healthy'],
    uniqueSellingPoints: ['Tracks water intake', 'Sends reminders', 'Connects to app'],
  };

  console.log('📝 Generating optimized prompt...');
  const { systemPrompt, userPrompt } = generatePrompt(scriptParams);

  console.log('\n✅ System Prompt Generated:');
  console.log(systemPrompt.substring(0, 200) + '...\n');

  console.log('✅ User Prompt Generated:');
  console.log(userPrompt.substring(0, 200) + '...\n');

  console.log('🚀 Calling OpenAI GPT-4o API...');
  const startTime = Date.now();

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const generationTime = Date.now() - startTime;

    console.log(`✅ SUCCESS! (${generationTime}ms)\n`);

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const script = JSON.parse(response);

    console.log('📊 Generation Metrics:');
    console.log(`   Model: gpt-4o`);
    console.log(`   Prompt Tokens: ${completion.usage?.prompt_tokens || 0}`);
    console.log(`   Completion Tokens: ${completion.usage?.completion_tokens || 0}`);
    console.log(`   Total Tokens: ${completion.usage?.total_tokens || 0}`);

    // Calculate cost
    const inputCost = (completion.usage?.prompt_tokens || 0) * (0.005 / 1000);
    const outputCost = (completion.usage?.completion_tokens || 0) * (0.015 / 1000);
    const totalCost = inputCost + outputCost;

    console.log(`   Estimated Cost: $${totalCost.toFixed(4)}`);
    console.log(`   Generation Time: ${generationTime}ms\n`);

    console.log('📝 Generated Script:');
    console.log(`   Title: ${script.title || 'N/A'}`);
    console.log(`   Hook: ${script.hook || 'N/A'}`);
    console.log(`   Scenes: ${script.scenes?.length || 0}`);
    console.log(`   Total Duration: ${script.totalDuration}s`);
    console.log(`   Target Emotion: ${script.targetEmotion || 'N/A'}`);
    console.log(`   CTA: ${script.callToAction || 'N/A'}\n`);

    if (script.scenes && script.scenes.length > 0) {
      console.log('🎬 Scene Breakdown:');
      script.scenes.forEach((scene, index) => {
        console.log(`\n   Scene ${index + 1} (${scene.duration}s):`);
        console.log(`      Visual: ${scene.description?.substring(0, 80)}...`);
        console.log(`      Dialogue: "${scene.dialogue?.substring(0, 80)}..."`);
      });
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  ✅ OpenAI Integration Test PASSED');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('🎉 All systems operational!');
    console.log(`💰 Test cost: $${totalCost.toFixed(4)}`);
    console.log('\n✅ Prompt Engineering System: Working');
    console.log('✅ OpenAI GPT-4o API: Working');
    console.log('✅ JSON Structured Output: Working');
    console.log('✅ Cost Calculation: Working\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.status === 401) {
      console.error('   → OpenAI API key is invalid or missing');
    } else if (error.status === 429) {
      console.error('   → Rate limit exceeded');
    }
    process.exit(1);
  }
}

testOpenAIIntegration();
