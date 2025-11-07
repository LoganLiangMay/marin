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
exports.generateVoiceover = exports.generateImage = exports.generateScript = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const openai_1 = __importDefault(require("openai"));
const prompts_1 = require("./prompts");
// Initialize OpenAI client
const initializeOpenAI = () => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error('OPENAI_API_KEY is not configured');
        return null;
    }
    try {
        return new openai_1.default({
            apiKey: apiKey,
            timeout: 60000, // 60 second timeout
            maxRetries: 3, // SDK handles retries internally
        });
    }
    catch (error) {
        console.error('Failed to initialize OpenAI client:', error);
        return null;
    }
};
// Lazy-loaded OpenAI client
let openaiClient = null;
const getOpenAIClient = () => {
    if (!openaiClient) {
        openaiClient = initializeOpenAI();
        if (!openaiClient) {
            throw new functions.https.HttpsError('failed-precondition', 'OpenAI API is not configured. Please set OPENAI_API_KEY environment variable.');
        }
    }
    return openaiClient;
};
const calculateCost = (promptTokens, completionTokens, model) => {
    // GPT-4o pricing (as of 2024)
    const pricing = {
        'gpt-4o': { input: 0.005 / 1000, output: 0.015 / 1000 },
        'gpt-4o-mini': { input: 0.00015 / 1000, output: 0.0006 / 1000 },
    };
    const modelPricing = pricing[model] || pricing['gpt-4o'];
    const estimatedCost = (promptTokens * modelPricing.input) +
        (completionTokens * modelPricing.output);
    return {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        estimatedCost: parseFloat(estimatedCost.toFixed(6)),
    };
};
// Script generation with GPT-4o
exports.generateScript = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { productName, productDescription, brandTone = 'professional', targetAudience, duration = 30, variationCount = 1, adType = 'product-demo', keywords = [], uniqueSellingPoints = [] } = data;
    // Prepare script generation parameters
    const scriptParams = {
        productName,
        productDescription,
        brandTone: brandTone,
        targetAudience,
        duration,
        adType: adType,
        keywords,
        uniqueSellingPoints,
    };
    // Validate inputs using prompt engineering system
    const validation = (0, prompts_1.validatePromptParams)(scriptParams);
    if (!validation.valid) {
        throw new functions.https.HttpsError('invalid-argument', `Invalid parameters: ${validation.errors.join(', ')}`);
    }
    if (variationCount < 1 || variationCount > 3) {
        throw new functions.https.HttpsError('invalid-argument', 'variationCount must be between 1 and 3');
    }
    try {
        const openai = getOpenAIClient();
        const userId = context.auth.uid;
        const startTime = Date.now();
        // Generate variations if requested (Subtask 6.3)
        const scripts = [];
        const usageStats = [];
        for (let i = 1; i <= variationCount; i++) {
            // Use prompt engineering system for sophisticated prompts (Subtask 6.2)
            const { systemPrompt, userPrompt } = variationCount > 1
                ? (0, prompts_1.generateVariationPrompt)(scriptParams, i, variationCount)
                : (0, prompts_1.generatePrompt)(scriptParams);
            // Call OpenAI API
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: variationCount > 1 ? 0.7 + (i * 0.1) : 0.7, // Increase temperature for more variety
                response_format: { type: 'json_object' },
            });
            const response = completion.choices[0]?.message?.content;
            if (!response) {
                throw new Error(`No response from OpenAI for variation ${i}`);
            }
            // Parse and validate the JSON response (Subtask 6.4)
            const script = JSON.parse(response);
            // Validate script structure
            if (!script.scenes || !Array.isArray(script.scenes)) {
                throw new Error('Invalid script format: missing scenes array');
            }
            // Validate scene timings
            const totalDuration = script.scenes.reduce((sum, scene) => sum + (scene.duration || 0), 0);
            if (Math.abs(totalDuration - duration) > 2) {
                console.warn(`Scene timing mismatch: expected ${duration}s, got ${totalDuration}s`);
            }
            scripts.push({
                variationNumber: i,
                script,
            });
            // Track usage for this variation
            usageStats.push(calculateCost(completion.usage?.prompt_tokens || 0, completion.usage?.completion_tokens || 0, 'gpt-4o'));
        }
        // Aggregate usage stats across all variations
        const totalUsage = usageStats.reduce((acc, curr) => ({
            promptTokens: acc.promptTokens + curr.promptTokens,
            completionTokens: acc.completionTokens + curr.completionTokens,
            totalTokens: acc.totalTokens + curr.totalTokens,
            estimatedCost: acc.estimatedCost + curr.estimatedCost,
        }), { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 });
        const generationTime = Date.now() - startTime;
        // Store in Firestore with versioning (Subtask 6.7)
        const scriptDoc = await admin.firestore().collection('scripts').add({
            userId,
            productName,
            productDescription,
            brandTone,
            targetAudience,
            duration,
            adType,
            keywords,
            uniqueSellingPoints,
            scripts, // All variations
            variationCount,
            usage: totalUsage,
            generationTime,
            model: 'gpt-4o',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            version: 1,
        });
        console.log(`Script generated for user ${userId}: ${scriptDoc.id}`, {
            variations: variationCount,
            tokens: totalUsage.totalTokens,
            cost: totalUsage.estimatedCost,
            duration: generationTime,
        });
        return {
            success: true,
            scriptId: scriptDoc.id,
            scripts, // Return all variations
            variationCount,
            usage: totalUsage,
            generationTime,
        };
    }
    catch (error) {
        console.error('Error generating script:', error);
        // Handle specific OpenAI errors
        if (error?.status === 429) {
            throw new functions.https.HttpsError('resource-exhausted', 'OpenAI API rate limit exceeded. Please try again later.');
        }
        if (error?.status === 401) {
            throw new functions.https.HttpsError('failed-precondition', 'OpenAI API authentication failed. Please check your API key.');
        }
        throw new functions.https.HttpsError('internal', `Failed to generate script: ${error.message || 'Unknown error'}`);
    }
});
exports.generateImage = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { prompt, style = 'vivid', // 'vivid' or 'natural'
    size = '1024x1024', // '1024x1024', '1792x1024', or '1024x1792'
    quality = 'standard' // 'standard' or 'hd'
     } = data;
    if (!prompt) {
        throw new functions.https.HttpsError('invalid-argument', 'prompt is required');
    }
    try {
        const openai = getOpenAIClient();
        const userId = context.auth.uid;
        const startTime = Date.now();
        // Generate image with DALL-E 3
        const response = await openai.images.generate({
            model: 'dall-e-3',
            prompt,
            n: 1,
            size: size,
            quality: quality,
            style: style,
        });
        if (!response.data || response.data.length === 0) {
            throw new Error('No image data in response');
        }
        const imageUrl = response.data[0]?.url;
        if (!imageUrl) {
            throw new Error('No image URL in response');
        }
        const generationTime = Date.now() - startTime;
        // Store in Firestore
        const imageDoc = await admin.firestore().collection('images').add({
            userId,
            prompt,
            imageUrl,
            style,
            size,
            quality,
            model: 'dall-e-3',
            generationTime,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Image generated for user ${userId}: ${imageDoc.id}`);
        return {
            success: true,
            imageId: imageDoc.id,
            imageUrl,
            prompt,
            revisedPrompt: response.data?.[0]?.revised_prompt,
            generationTime,
        };
    }
    catch (error) {
        console.error('Error generating image:', error);
        if (error?.status === 429) {
            throw new functions.https.HttpsError('resource-exhausted', 'OpenAI API rate limit exceeded. Please try again later.');
        }
        if (error?.status === 401) {
            throw new functions.https.HttpsError('failed-precondition', 'OpenAI API authentication failed. Please check your API key.');
        }
        throw new functions.https.HttpsError('internal', `Failed to generate image: ${error.message || 'Unknown error'}`);
    }
});
exports.generateVoiceover = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { text, voice = 'alloy', // 'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'
    speed = 1.0 // 0.25 to 4.0
     } = data;
    if (!text) {
        throw new functions.https.HttpsError('invalid-argument', 'text is required');
    }
    if (speed < 0.25 || speed > 4.0) {
        throw new functions.https.HttpsError('invalid-argument', 'speed must be between 0.25 and 4.0');
    }
    try {
        const openai = getOpenAIClient();
        const userId = context.auth.uid;
        const startTime = Date.now();
        // Generate speech with TTS
        const mp3Response = await openai.audio.speech.create({
            model: 'tts-1',
            voice: voice,
            input: text,
            speed,
        });
        // Convert response to buffer
        const buffer = Buffer.from(await mp3Response.arrayBuffer());
        // Upload to Firebase Storage
        const bucket = admin.storage().bucket();
        const fileName = `voiceovers/${userId}/${Date.now()}.mp3`;
        const file = bucket.file(fileName);
        await file.save(buffer, {
            metadata: {
                contentType: 'audio/mpeg',
                metadata: {
                    userId,
                    voice,
                    speed: speed.toString(),
                }
            }
        });
        // Get signed URL for download
        const [audioUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        const generationTime = Date.now() - startTime;
        // Store in Firestore
        const voiceoverDoc = await admin.firestore().collection('voiceovers').add({
            userId,
            text,
            voice,
            speed,
            audioUrl,
            fileName,
            model: 'tts-1',
            generationTime,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Voiceover generated for user ${userId}: ${voiceoverDoc.id}`);
        return {
            success: true,
            voiceoverId: voiceoverDoc.id,
            audioUrl,
            generationTime,
            voice,
            speed,
        };
    }
    catch (error) {
        console.error('Error generating voiceover:', error);
        if (error?.status === 429) {
            throw new functions.https.HttpsError('resource-exhausted', 'OpenAI API rate limit exceeded. Please try again later.');
        }
        if (error?.status === 401) {
            throw new functions.https.HttpsError('failed-precondition', 'OpenAI API authentication failed. Please check your API key.');
        }
        throw new functions.https.HttpsError('internal', `Failed to generate voiceover: ${error.message || 'Unknown error'}`);
    }
});
//# sourceMappingURL=openai.js.map