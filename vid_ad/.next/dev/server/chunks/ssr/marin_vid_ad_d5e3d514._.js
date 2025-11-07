module.exports = [
"[project]/marin/vid_ad/lib/schemas/adGenerationSchema.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BrandTone",
    ()=>BrandTone,
    "ReplicateModel",
    ()=>ReplicateModel,
    "VideoFrameRate",
    ()=>VideoFrameRate,
    "VideoOrientation",
    ()=>VideoOrientation,
    "VideoResolution",
    ()=>VideoResolution,
    "adGenerationSchema",
    ()=>adGenerationSchema,
    "estimateGenerationCost",
    ()=>estimateGenerationCost,
    "formatKeywordsToString",
    ()=>formatKeywordsToString,
    "getModelPricing",
    ()=>getModelPricing,
    "isValidHexColor",
    ()=>isValidHexColor,
    "keywordsSchema",
    ()=>keywordsSchema,
    "productDescriptionSchema",
    ()=>productDescriptionSchema,
    "productNameSchema",
    ()=>productNameSchema
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/marin/vid_ad/node_modules/zod/v4/classic/external.js [app-ssr] (ecmascript) <export * as z>");
;
const BrandTone = {
    PROFESSIONAL: 'professional',
    CASUAL: 'casual',
    PLAYFUL: 'playful',
    LUXURY: 'luxury',
    ENERGETIC: 'energetic',
    MINIMALIST: 'minimalist'
};
const VideoOrientation = {
    PORTRAIT: 'portrait',
    LANDSCAPE: 'landscape',
    SQUARE: 'square'
};
const VideoResolution = {
    HD_720P: '720p',
    FHD_1080P: '1080p',
    UHD_4K: '4k'
};
const VideoFrameRate = {
    FPS_24: 24,
    FPS_30: 30,
    FPS_60: 60
};
const ReplicateModel = {
    SEEDANCE_LITE: 'seedance-1-lite',
    SEEDANCE_PRO: 'seedance-1-pro'
};
const adGenerationSchema = __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    // Product Information
    productName: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'Product name is required').max(100, 'Product name must be 100 characters or less').trim(),
    productDescription: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(10, 'Product description must be at least 10 characters').max(500, 'Product description must be 500 characters or less').trim(),
    keywords: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().transform((val)=>val.split(',').map((k)=>k.trim()).filter(Boolean)).pipe(__TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()).min(1, 'At least one keyword is required').max(10, 'Maximum 10 keywords allowed')),
    // Brand Settings
    brandTone: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        BrandTone.PROFESSIONAL,
        BrandTone.CASUAL,
        BrandTone.PLAYFUL,
        BrandTone.LUXURY,
        BrandTone.ENERGETIC,
        BrandTone.MINIMALIST
    ]).default(BrandTone.PROFESSIONAL),
    primaryColor: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format').default('#000000'),
    // Video Configuration
    variations: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int('Variations must be a whole number').min(1, 'Minimum 1 variation required').max(3, 'Maximum 3 variations allowed').default(1),
    duration: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(5, 'Minimum duration is 5 seconds').max(10, 'Maximum duration is 10 seconds').default(7),
    orientation: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        VideoOrientation.PORTRAIT,
        VideoOrientation.LANDSCAPE,
        VideoOrientation.SQUARE
    ]).default(VideoOrientation.LANDSCAPE),
    resolution: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        VideoResolution.HD_720P,
        VideoResolution.FHD_1080P,
        VideoResolution.UHD_4K
    ]).default(VideoResolution.FHD_1080P),
    frameRate: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().refine((val)=>[
            24,
            30,
            60
        ].includes(val), {
        message: 'Frame rate must be 24, 30, or 60 fps'
    }).default(30),
    videoModel: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        ReplicateModel.SEEDANCE_LITE,
        ReplicateModel.SEEDANCE_PRO
    ]).default(ReplicateModel.SEEDANCE_LITE),
    // File Uploads (optional) - Simplified to avoid validation issues
    logoFile: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].any().optional(),
    productImages: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].any().optional().default([]),
    // Additional Options
    includeVoiceover: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().default(true),
    voiceStyle: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'alloy',
        'echo',
        'fable',
        'onyx',
        'nova',
        'shimmer'
    ]).default('alloy').optional(),
    includeBackgroundMusic: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().default(true),
    callToAction: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(50, 'Call to action must be 50 characters or less').optional(),
    targetAudience: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(200, 'Target audience description must be 200 characters or less').optional()
});
const productNameSchema = adGenerationSchema.shape.productName;
const productDescriptionSchema = adGenerationSchema.shape.productDescription;
const keywordsSchema = adGenerationSchema.shape.keywords;
const isValidHexColor = (color)=>{
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};
const formatKeywordsToString = (keywords)=>{
    return keywords.join(', ');
};
const getModelPricing = (model, resolution = '720p')=>{
    // Pricing per second based on Replicate's actual pricing
    const pricing = {
        'seedance-1-lite': {
            '480p': 0.018,
            '720p': 0.036,
            '1080p': 0.072
        },
        'seedance-1-pro': {
            '480p': 0.03,
            '720p': 0.06,
            '1080p': 0.15
        }
    };
    const modelKey = model;
    const resKey = resolution;
    return pricing[modelKey]?.[resKey] || 0.036;
};
const estimateGenerationCost = (model, duration, variations, resolution = '720p')=>{
    const pricePerSecond = getModelPricing(model, resolution);
    return pricePerSecond * duration * variations;
};
}),
"[project]/marin/vid_ad/components/form/FormStepIndicator.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>FormStepIndicator
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/marin/vid_ad/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
'use client';
;
function FormStepIndicator({ steps, currentStep, onStepClick }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
        "aria-label": "Progress",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
            className: "flex items-center justify-between",
            children: steps.map((step, stepIdx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                    className: `relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''} ${stepIdx !== 0 ? 'flex-1' : ''}`,
                    children: [
                        stepIdx !== steps.length - 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute top-4 left-8 -right-8 sm:left-12 sm:-right-20 h-0.5",
                            "aria-hidden": "true",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `h-full ${step.id < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/FormStepIndicator.tsx",
                                lineNumber: 35,
                                columnNumber: 17
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/marin/vid_ad/components/form/FormStepIndicator.tsx",
                            lineNumber: 31,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: ()=>onStepClick(step.id),
                            className: `group relative flex items-center ${step.id <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed'}`,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "flex h-9 items-center",
                                    "aria-hidden": "true",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${step.id < currentStep ? 'bg-blue-600 group-hover:bg-blue-800' : step.id === currentStep ? 'border-2 border-blue-600 bg-white' : 'border-2 border-gray-300 bg-white'}`,
                                        children: step.id < currentStep ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            className: "h-5 w-5 text-white",
                                            viewBox: "0 0 20 20",
                                            fill: "currentColor",
                                            "aria-hidden": "true",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                fillRule: "evenodd",
                                                d: "M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z",
                                                clipRule: "evenodd"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/FormStepIndicator.tsx",
                                                lineNumber: 66,
                                                columnNumber: 23
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/marin/vid_ad/components/form/FormStepIndicator.tsx",
                                            lineNumber: 60,
                                            columnNumber: 21
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: `h-2.5 w-2.5 rounded-full ${step.id === currentStep ? 'bg-blue-600' : 'bg-transparent'}`
                                        }, void 0, false, {
                                            fileName: "[project]/marin/vid_ad/components/form/FormStepIndicator.tsx",
                                            lineNumber: 73,
                                            columnNumber: 21
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/marin/vid_ad/components/form/FormStepIndicator.tsx",
                                        lineNumber: 50,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/marin/vid_ad/components/form/FormStepIndicator.tsx",
                                    lineNumber: 49,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "ml-4 flex min-w-0 flex-col",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: `text-sm font-medium ${step.id <= currentStep ? 'text-blue-600' : 'text-gray-500'}`,
                                            children: step.name
                                        }, void 0, false, {
                                            fileName: "[project]/marin/vid_ad/components/form/FormStepIndicator.tsx",
                                            lineNumber: 82,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-xs text-gray-500",
                                            children: step.description
                                        }, void 0, false, {
                                            fileName: "[project]/marin/vid_ad/components/form/FormStepIndicator.tsx",
                                            lineNumber: 89,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/marin/vid_ad/components/form/FormStepIndicator.tsx",
                                    lineNumber: 81,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/marin/vid_ad/components/form/FormStepIndicator.tsx",
                            lineNumber: 42,
                            columnNumber: 13
                        }, this)
                    ]
                }, step.name, true, {
                    fileName: "[project]/marin/vid_ad/components/form/FormStepIndicator.tsx",
                    lineNumber: 24,
                    columnNumber: 11
                }, this))
        }, void 0, false, {
            fileName: "[project]/marin/vid_ad/components/form/FormStepIndicator.tsx",
            lineNumber: 22,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/marin/vid_ad/components/form/FormStepIndicator.tsx",
        lineNumber: 21,
        columnNumber: 5
    }, this);
}
}),
"[project]/marin/vid_ad/components/form/ProductInfoStep.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ProductInfoStep
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/marin/vid_ad/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
'use client';
;
function ProductInfoStep({ form }) {
    const { register, watch, formState: { errors } } = form;
    const productName = watch('productName') || '';
    const productDescription = watch('productDescription') || '';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-2xl font-semibold text-gray-900 mb-2",
                        children: "Product Information"
                    }, void 0, false, {
                        fileName: "[project]/marin/vid_ad/components/form/ProductInfoStep.tsx",
                        lineNumber: 23,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-600",
                        children: "Tell us about the product you want to advertise"
                    }, void 0, false, {
                        fileName: "[project]/marin/vid_ad/components/form/ProductInfoStep.tsx",
                        lineNumber: 24,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/marin/vid_ad/components/form/ProductInfoStep.tsx",
                lineNumber: 22,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                htmlFor: "productName",
                                className: "block text-sm font-medium text-gray-700 mb-1",
                                children: "Product Name *"
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/ProductInfoStep.tsx",
                                lineNumber: 29,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "relative",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        id: "productName",
                                        ...register('productName'),
                                        className: `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.productName ? 'border-red-500' : 'border-gray-300'}`,
                                        placeholder: "Enter your product name",
                                        maxLength: 100
                                    }, void 0, false, {
                                        fileName: "[project]/marin/vid_ad/components/form/ProductInfoStep.tsx",
                                        lineNumber: 33,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "absolute right-3 top-2.5 text-xs text-gray-500",
                                        children: [
                                            productName.length,
                                            "/100"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/marin/vid_ad/components/form/ProductInfoStep.tsx",
                                        lineNumber: 43,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/marin/vid_ad/components/form/ProductInfoStep.tsx",
                                lineNumber: 32,
                                columnNumber: 11
                            }, this),
                            errors.productName && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-1 text-sm text-red-600",
                                children: errors.productName.message
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/ProductInfoStep.tsx",
                                lineNumber: 48,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/marin/vid_ad/components/form/ProductInfoStep.tsx",
                        lineNumber: 28,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                htmlFor: "productDescription",
                                className: "block text-sm font-medium text-gray-700 mb-1",
                                children: "Product Description *"
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/ProductInfoStep.tsx",
                                lineNumber: 53,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "relative",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                        id: "productDescription",
                                        ...register('productDescription'),
                                        rows: 4,
                                        className: `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none ${errors.productDescription ? 'border-red-500' : 'border-gray-300'}`,
                                        placeholder: "Describe your product's key features and benefits",
                                        maxLength: 500
                                    }, void 0, false, {
                                        fileName: "[project]/marin/vid_ad/components/form/ProductInfoStep.tsx",
                                        lineNumber: 57,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "absolute right-3 bottom-2 text-xs text-gray-500",
                                        children: [
                                            productDescription.length,
                                            "/500"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/marin/vid_ad/components/form/ProductInfoStep.tsx",
                                        lineNumber: 67,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/marin/vid_ad/components/form/ProductInfoStep.tsx",
                                lineNumber: 56,
                                columnNumber: 11
                            }, this),
                            errors.productDescription && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-1 text-sm text-red-600",
                                children: errors.productDescription.message
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/ProductInfoStep.tsx",
                                lineNumber: 72,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/marin/vid_ad/components/form/ProductInfoStep.tsx",
                        lineNumber: 52,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                htmlFor: "keywords",
                                className: "block text-sm font-medium text-gray-700 mb-1",
                                children: "Keywords *"
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/ProductInfoStep.tsx",
                                lineNumber: 77,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "text",
                                id: "keywords",
                                ...register('keywords'),
                                className: `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.keywords ? 'border-red-500' : 'border-gray-300'}`,
                                placeholder: "Enter keywords separated by commas (e.g., innovative, eco-friendly, premium)"
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/ProductInfoStep.tsx",
                                lineNumber: 80,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-1 text-xs text-gray-500",
                                children: "Add up to 10 keywords to help generate relevant ad content"
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/ProductInfoStep.tsx",
                                lineNumber: 89,
                                columnNumber: 11
                            }, this),
                            errors.keywords && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-1 text-sm text-red-600",
                                children: errors.keywords.message
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/ProductInfoStep.tsx",
                                lineNumber: 93,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/marin/vid_ad/components/form/ProductInfoStep.tsx",
                        lineNumber: 76,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                htmlFor: "targetAudience",
                                className: "block text-sm font-medium text-gray-700 mb-1",
                                children: "Target Audience (Optional)"
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/ProductInfoStep.tsx",
                                lineNumber: 98,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                id: "targetAudience",
                                ...register('targetAudience'),
                                rows: 3,
                                className: `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none ${errors.targetAudience ? 'border-red-500' : 'border-gray-300'}`,
                                placeholder: "Describe your target audience (e.g., young professionals, eco-conscious consumers)",
                                maxLength: 200
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/ProductInfoStep.tsx",
                                lineNumber: 101,
                                columnNumber: 11
                            }, this),
                            errors.targetAudience && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-1 text-sm text-red-600",
                                children: errors.targetAudience.message
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/ProductInfoStep.tsx",
                                lineNumber: 112,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/marin/vid_ad/components/form/ProductInfoStep.tsx",
                        lineNumber: 97,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/marin/vid_ad/components/form/ProductInfoStep.tsx",
                lineNumber: 27,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/marin/vid_ad/components/form/ProductInfoStep.tsx",
        lineNumber: 21,
        columnNumber: 5
    }, this);
}
}),
"[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>BrandSettingsStep
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/marin/vid_ad/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$lib$2f$schemas$2f$adGenerationSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/marin/vid_ad/lib/schemas/adGenerationSchema.ts [app-ssr] (ecmascript)");
'use client';
;
;
const brandToneOptions = [
    {
        value: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$lib$2f$schemas$2f$adGenerationSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BrandTone"].PROFESSIONAL,
        label: 'Professional',
        description: 'Clean, corporate, trustworthy'
    },
    {
        value: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$lib$2f$schemas$2f$adGenerationSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BrandTone"].CASUAL,
        label: 'Casual',
        description: 'Friendly, approachable, relaxed'
    },
    {
        value: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$lib$2f$schemas$2f$adGenerationSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BrandTone"].PLAYFUL,
        label: 'Playful',
        description: 'Fun, energetic, creative'
    },
    {
        value: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$lib$2f$schemas$2f$adGenerationSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BrandTone"].LUXURY,
        label: 'Luxury',
        description: 'Elegant, premium, sophisticated'
    },
    {
        value: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$lib$2f$schemas$2f$adGenerationSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BrandTone"].ENERGETIC,
        label: 'Energetic',
        description: 'Dynamic, exciting, bold'
    },
    {
        value: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$lib$2f$schemas$2f$adGenerationSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BrandTone"].MINIMALIST,
        label: 'Minimalist',
        description: 'Simple, clean, modern'
    }
];
function BrandSettingsStep({ form }) {
    const { register, watch, setValue, formState: { errors } } = form;
    const selectedTone = watch('brandTone');
    const primaryColor = watch('primaryColor');
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-2xl font-semibold text-gray-900 mb-2",
                        children: "Brand Settings"
                    }, void 0, false, {
                        fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                        lineNumber: 33,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-600",
                        children: "Define your brand's visual style and tone"
                    }, void 0, false, {
                        fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                        lineNumber: 34,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                lineNumber: 32,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block text-sm font-medium text-gray-700 mb-3",
                                children: "Brand Tone *"
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                lineNumber: 39,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-2 md:grid-cols-3 gap-4",
                                children: brandToneOptions.map((option)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: `relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedTone === option.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "radio",
                                                ...register('brandTone'),
                                                value: option.value,
                                                className: "sr-only"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                                lineNumber: 52,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm font-medium text-gray-900",
                                                children: option.label
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                                lineNumber: 58,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs text-gray-500 mt-1",
                                                children: option.description
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                                lineNumber: 59,
                                                columnNumber: 17
                                            }, this),
                                            selectedTone === option.value && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "absolute top-2 right-2",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                    className: "w-5 h-5 text-blue-500",
                                                    fill: "currentColor",
                                                    viewBox: "0 0 20 20",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        fillRule: "evenodd",
                                                        d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z",
                                                        clipRule: "evenodd"
                                                    }, void 0, false, {
                                                        fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                                        lineNumber: 67,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                                    lineNumber: 62,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                                lineNumber: 61,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, option.value, true, {
                                        fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                        lineNumber: 44,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                lineNumber: 42,
                                columnNumber: 11
                            }, this),
                            errors.brandTone && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-2 text-sm text-red-600",
                                children: errors.brandTone.message
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                lineNumber: 79,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                        lineNumber: 38,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                htmlFor: "primaryColor",
                                className: "block text-sm font-medium text-gray-700 mb-2",
                                children: "Primary Brand Color *"
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                lineNumber: 84,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center space-x-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex-1",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "color",
                                                    id: "primaryColor",
                                                    ...register('primaryColor'),
                                                    className: "h-12 w-12 border border-gray-300 rounded cursor-pointer"
                                                }, void 0, false, {
                                                    fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                                    lineNumber: 90,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    value: primaryColor,
                                                    onChange: (e)=>setValue('primaryColor', e.target.value),
                                                    placeholder: "#000000",
                                                    className: `ml-3 flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.primaryColor ? 'border-red-500' : 'border-gray-300'}`,
                                                    pattern: "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                                                }, void 0, false, {
                                                    fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                                    lineNumber: 96,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                            lineNumber: 89,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                        lineNumber: 88,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-20 h-12 rounded-lg border-2 border-gray-300",
                                        style: {
                                            backgroundColor: primaryColor
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                        lineNumber: 108,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                lineNumber: 87,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-1 text-xs text-gray-500",
                                children: "Choose a color that represents your brand"
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                lineNumber: 113,
                                columnNumber: 11
                            }, this),
                            errors.primaryColor && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-1 text-sm text-red-600",
                                children: errors.primaryColor.message
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                lineNumber: 117,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                        lineNumber: 83,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block text-sm font-medium text-gray-700 mb-2",
                                children: "Logo Upload (Optional)"
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                lineNumber: 122,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-1 text-center",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            className: "mx-auto h-12 w-12 text-gray-400",
                                            stroke: "currentColor",
                                            fill: "none",
                                            viewBox: "0 0 48 48",
                                            "aria-hidden": "true",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                d: "M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02",
                                                strokeWidth: 2,
                                                strokeLinecap: "round",
                                                strokeLinejoin: "round"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                                lineNumber: 134,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                            lineNumber: 127,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex text-sm text-gray-600",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    htmlFor: "logoFile",
                                                    className: "relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            children: "Upload a file"
                                                        }, void 0, false, {
                                                            fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                                            lineNumber: 146,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            id: "logoFile",
                                                            type: "file",
                                                            ...register('logoFile'),
                                                            className: "sr-only",
                                                            accept: "image/jpeg,image/jpg,image/png,image/webp,image/gif"
                                                        }, void 0, false, {
                                                            fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                                            lineNumber: 147,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                                    lineNumber: 142,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "pl-1",
                                                    children: "or drag and drop"
                                                }, void 0, false, {
                                                    fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                                    lineNumber: 155,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                            lineNumber: 141,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-xs text-gray-500",
                                            children: "PNG, JPG, GIF, WebP up to 5MB"
                                        }, void 0, false, {
                                            fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                            lineNumber: 157,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                    lineNumber: 126,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                lineNumber: 125,
                                columnNumber: 11
                            }, this),
                            errors.logoFile && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-1 text-sm text-red-600",
                                children: errors.logoFile.message
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                lineNumber: 161,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                        lineNumber: 121,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                htmlFor: "callToAction",
                                className: "block text-sm font-medium text-gray-700 mb-1",
                                children: "Call to Action (Optional)"
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                lineNumber: 166,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "text",
                                id: "callToAction",
                                ...register('callToAction'),
                                className: `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.callToAction ? 'border-red-500' : 'border-gray-300'}`,
                                placeholder: "e.g., Shop Now, Learn More, Get Started",
                                maxLength: 50
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                lineNumber: 169,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-1 text-xs text-gray-500",
                                children: "Text for the action button in your ad"
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                lineNumber: 179,
                                columnNumber: 11
                            }, this),
                            errors.callToAction && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-1 text-sm text-red-600",
                                children: errors.callToAction.message
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                                lineNumber: 183,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                        lineNumber: 165,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
                lineNumber: 37,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx",
        lineNumber: 31,
        columnNumber: 5
    }, this);
}
}),
"[project]/marin/vid_ad/components/form/VideoConfigStep.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>VideoConfigStep
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/marin/vid_ad/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$lib$2f$schemas$2f$adGenerationSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/marin/vid_ad/lib/schemas/adGenerationSchema.ts [app-ssr] (ecmascript)");
'use client';
;
;
function VideoConfigStep({ form }) {
    const { register, watch } = form;
    const variations = watch('variations');
    const duration = watch('duration');
    const orientation = watch('orientation');
    const resolution = watch('resolution');
    const videoModel = watch('videoModel');
    const estimatedCost = (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$lib$2f$schemas$2f$adGenerationSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["estimateGenerationCost"])(videoModel, duration, variations, resolution);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-2xl font-semibold text-gray-900 mb-2",
                        children: "Video Configuration"
                    }, void 0, false, {
                        fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                        lineNumber: 34,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-600",
                        children: "Set your video specifications and generation options"
                    }, void 0, false, {
                        fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                        lineNumber: 35,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                lineNumber: 33,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block text-sm font-medium text-gray-700 mb-3",
                                children: "AI Model (Replicate Seedance) *"
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                lineNumber: 41,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-1 md:grid-cols-2 gap-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: `relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${videoModel === __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$lib$2f$schemas$2f$adGenerationSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ReplicateModel"].SEEDANCE_LITE ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "radio",
                                                ...register('videoModel'),
                                                value: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$lib$2f$schemas$2f$adGenerationSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ReplicateModel"].SEEDANCE_LITE,
                                                className: "sr-only"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                                lineNumber: 52,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm font-medium text-gray-900",
                                                children: "Seedance 1 Lite"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                                lineNumber: 58,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs text-gray-500 mt-1",
                                                children: "Budget-friendly, quick drafts"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                                lineNumber: 59,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs text-green-600 mt-1",
                                                children: "$0.036/sec @ 720p"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                                lineNumber: 60,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                        lineNumber: 45,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: `relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${videoModel === __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$lib$2f$schemas$2f$adGenerationSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ReplicateModel"].SEEDANCE_PRO ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "radio",
                                                ...register('videoModel'),
                                                value: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$lib$2f$schemas$2f$adGenerationSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ReplicateModel"].SEEDANCE_PRO,
                                                className: "sr-only"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                                lineNumber: 70,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm font-medium text-gray-900",
                                                children: "Seedance 1 Pro"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                                lineNumber: 76,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs text-gray-500 mt-1",
                                                children: "Higher quality, better realism"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                                lineNumber: 77,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs text-green-600 mt-1",
                                                children: "$0.06/sec @ 720p"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                                lineNumber: 78,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                        lineNumber: 63,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                lineNumber: 44,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                        lineNumber: 40,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                htmlFor: "variations",
                                className: "block text-sm font-medium text-gray-700 mb-2",
                                children: [
                                    "Number of Variations: ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-blue-600 font-semibold",
                                        children: variations
                                    }, void 0, false, {
                                        fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                        lineNumber: 86,
                                        columnNumber: 35
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                lineNumber: 85,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "range",
                                id: "variations",
                                ...register('variations', {
                                    valueAsNumber: true
                                }),
                                min: "1",
                                max: "3",
                                step: "1",
                                className: "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                lineNumber: 88,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-between text-xs text-gray-500 mt-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "1"
                                    }, void 0, false, {
                                        fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                        lineNumber: 98,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "2"
                                    }, void 0, false, {
                                        fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                        lineNumber: 99,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "3"
                                    }, void 0, false, {
                                        fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                        lineNumber: 100,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                lineNumber: 97,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-2 text-xs text-gray-500",
                                children: "Generate multiple variations to choose from"
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                lineNumber: 102,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                        lineNumber: 84,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                htmlFor: "duration",
                                className: "block text-sm font-medium text-gray-700 mb-2",
                                children: [
                                    "Video Duration: ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-blue-600 font-semibold",
                                        children: [
                                            duration,
                                            "s"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                        lineNumber: 110,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                lineNumber: 109,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "range",
                                id: "duration",
                                ...register('duration', {
                                    valueAsNumber: true
                                }),
                                min: "5",
                                max: "10",
                                step: "1",
                                className: "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                lineNumber: 112,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-between text-xs text-gray-500 mt-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "5s"
                                    }, void 0, false, {
                                        fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                        lineNumber: 122,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "6s"
                                    }, void 0, false, {
                                        fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                        lineNumber: 123,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "7s"
                                    }, void 0, false, {
                                        fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                        lineNumber: 124,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "8s"
                                    }, void 0, false, {
                                        fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                        lineNumber: 125,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "9s"
                                    }, void 0, false, {
                                        fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                        lineNumber: 126,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "10s"
                                    }, void 0, false, {
                                        fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                        lineNumber: 127,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                lineNumber: 121,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                        lineNumber: 108,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block text-sm font-medium text-gray-700 mb-3",
                                children: "Video Orientation *"
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                lineNumber: 133,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-3 gap-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: `relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${orientation === __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$lib$2f$schemas$2f$adGenerationSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VideoOrientation"].PORTRAIT ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "radio",
                                                ...register('orientation'),
                                                value: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$lib$2f$schemas$2f$adGenerationSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VideoOrientation"].PORTRAIT,
                                                className: "sr-only"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                                lineNumber: 144,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "w-8 h-12 border-2 border-gray-400 rounded mb-2"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                                lineNumber: 150,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs font-medium",
                                                children: "Portrait"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                                lineNumber: 151,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs text-gray-500",
                                                children: "9:16"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                                lineNumber: 152,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                        lineNumber: 137,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: `relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${orientation === __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$lib$2f$schemas$2f$adGenerationSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VideoOrientation"].LANDSCAPE ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "radio",
                                                ...register('orientation'),
                                                value: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$lib$2f$schemas$2f$adGenerationSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VideoOrientation"].LANDSCAPE,
                                                className: "sr-only"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                                lineNumber: 162,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "w-12 h-8 border-2 border-gray-400 rounded mb-2"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                                lineNumber: 168,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs font-medium",
                                                children: "Landscape"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                                lineNumber: 169,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs text-gray-500",
                                                children: "16:9"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                                lineNumber: 170,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                        lineNumber: 155,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: `relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${orientation === __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$lib$2f$schemas$2f$adGenerationSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VideoOrientation"].SQUARE ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "radio",
                                                ...register('orientation'),
                                                value: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$lib$2f$schemas$2f$adGenerationSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VideoOrientation"].SQUARE,
                                                className: "sr-only"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                                lineNumber: 180,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "w-10 h-10 border-2 border-gray-400 rounded mb-2"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                                lineNumber: 186,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs font-medium",
                                                children: "Square"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                                lineNumber: 187,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs text-gray-500",
                                                children: "1:1"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                                lineNumber: 188,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                        lineNumber: 173,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                lineNumber: 136,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                        lineNumber: 132,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-2 gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        htmlFor: "resolution",
                                        className: "block text-sm font-medium text-gray-700 mb-1",
                                        children: "Resolution *"
                                    }, void 0, false, {
                                        fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                        lineNumber: 196,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        id: "resolution",
                                        ...register('resolution'),
                                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$lib$2f$schemas$2f$adGenerationSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VideoResolution"].HD_720P,
                                                children: "720p HD"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                                lineNumber: 204,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$lib$2f$schemas$2f$adGenerationSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VideoResolution"].FHD_1080P,
                                                children: "1080p Full HD"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                                lineNumber: 205,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$lib$2f$schemas$2f$adGenerationSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VideoResolution"].UHD_4K,
                                                children: "4K Ultra HD"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                                lineNumber: 206,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                        lineNumber: 199,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                lineNumber: 195,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        htmlFor: "frameRate",
                                        className: "block text-sm font-medium text-gray-700 mb-1",
                                        children: "Frame Rate *"
                                    }, void 0, false, {
                                        fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                        lineNumber: 211,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        id: "frameRate",
                                        ...register('frameRate', {
                                            valueAsNumber: true
                                        }),
                                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$lib$2f$schemas$2f$adGenerationSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VideoFrameRate"].FPS_24,
                                                children: "24 fps (Cinematic)"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                                lineNumber: 219,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$lib$2f$schemas$2f$adGenerationSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VideoFrameRate"].FPS_30,
                                                children: "30 fps (Standard)"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                                lineNumber: 220,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$lib$2f$schemas$2f$adGenerationSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["VideoFrameRate"].FPS_60,
                                                children: "60 fps (Smooth)"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                                lineNumber: 221,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                        lineNumber: 214,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                lineNumber: 210,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                        lineNumber: 194,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-blue-50 border border-blue-200 rounded-lg p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-between items-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-sm font-medium text-gray-700",
                                        children: "Estimated Generation Cost:"
                                    }, void 0, false, {
                                        fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                        lineNumber: 229,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-lg font-bold text-blue-600",
                                        children: [
                                            "$",
                                            estimatedCost.toFixed(2)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                        lineNumber: 230,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                lineNumber: 228,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-gray-600 mt-1",
                                children: [
                                    "Based on ",
                                    variations,
                                    " variation",
                                    variations > 1 ? 's' : '',
                                    " × ",
                                    duration,
                                    " seconds × ",
                                    videoModel === __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$lib$2f$schemas$2f$adGenerationSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ReplicateModel"].SEEDANCE_PRO ? 'Seedance Pro' : 'Seedance Lite',
                                    " @ ",
                                    resolution
                                ]
                            }, void 0, true, {
                                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                                lineNumber: 234,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                        lineNumber: 227,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
                lineNumber: 38,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/marin/vid_ad/components/form/VideoConfigStep.tsx",
        lineNumber: 32,
        columnNumber: 5
    }, this);
}
}),
"[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AdditionalOptionsStep
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/marin/vid_ad/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
'use client';
;
const voiceStyles = [
    {
        value: 'alloy',
        label: 'Alloy',
        description: 'Neutral and balanced'
    },
    {
        value: 'echo',
        label: 'Echo',
        description: 'Warm and conversational'
    },
    {
        value: 'fable',
        label: 'Fable',
        description: 'Expressive and dynamic'
    },
    {
        value: 'onyx',
        label: 'Onyx',
        description: 'Authoritative and deep'
    },
    {
        value: 'nova',
        label: 'Nova',
        description: 'Friendly and upbeat'
    },
    {
        value: 'shimmer',
        label: 'Shimmer',
        description: 'Soft and pleasant'
    }
];
function AdditionalOptionsStep({ form }) {
    const { register, watch, setValue, formState: { errors } } = form;
    const includeVoiceover = watch('includeVoiceover');
    const voiceStyle = watch('voiceStyle');
    const productImages = watch('productImages') || [];
    const handleImageUpload = (e)=>{
        const files = e.target.files;
        if (files) {
            const newImages = Array.from(files);
            setValue('productImages', [
                ...productImages,
                ...newImages
            ].slice(0, 5));
        }
    };
    const removeImage = (index)=>{
        const updatedImages = productImages.filter((_, i)=>i !== index);
        setValue('productImages', updatedImages);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-2xl font-semibold text-gray-900 mb-2",
                        children: "Additional Options"
                    }, void 0, false, {
                        fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                        lineNumber: 47,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-600",
                        children: "Enhance your video with extra features"
                    }, void 0, false, {
                        fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                        lineNumber: 48,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                lineNumber: 46,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center justify-between",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                htmlFor: "includeVoiceover",
                                                className: "text-sm font-medium text-gray-700",
                                                children: "Include Voiceover"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                                lineNumber: 56,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs text-gray-500",
                                                children: "Add AI-generated narration to your video"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                                lineNumber: 59,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                        lineNumber: 55,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "relative inline-flex items-center cursor-pointer",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "checkbox",
                                                id: "includeVoiceover",
                                                ...register('includeVoiceover'),
                                                className: "sr-only peer"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                                lineNumber: 62,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                                lineNumber: 68,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                        lineNumber: 61,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                lineNumber: 54,
                                columnNumber: 11
                            }, this),
                            includeVoiceover && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "block text-sm font-medium text-gray-700 mb-3",
                                        children: "Voice Style"
                                    }, void 0, false, {
                                        fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                        lineNumber: 74,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "grid grid-cols-2 md:grid-cols-3 gap-3",
                                        children: voiceStyles.map((voice)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: `relative flex flex-col p-3 border-2 rounded-lg cursor-pointer transition-all ${voiceStyle === voice.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "radio",
                                                        ...register('voiceStyle'),
                                                        value: voice.value,
                                                        className: "sr-only"
                                                    }, void 0, false, {
                                                        fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                                        lineNumber: 87,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-sm font-medium text-gray-900",
                                                        children: voice.label
                                                    }, void 0, false, {
                                                        fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                                        lineNumber: 93,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-xs text-gray-500 mt-0.5",
                                                        children: voice.description
                                                    }, void 0, false, {
                                                        fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                                        lineNumber: 94,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, voice.value, true, {
                                                fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                                lineNumber: 79,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                        lineNumber: 77,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                lineNumber: 73,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                        lineNumber: 53,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        htmlFor: "includeBackgroundMusic",
                                        className: "text-sm font-medium text-gray-700",
                                        children: "Include Background Music"
                                    }, void 0, false, {
                                        fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                        lineNumber: 105,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-gray-500",
                                        children: "Add royalty-free background music"
                                    }, void 0, false, {
                                        fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                        lineNumber: 108,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                lineNumber: 104,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "relative inline-flex items-center cursor-pointer",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "checkbox",
                                        id: "includeBackgroundMusic",
                                        ...register('includeBackgroundMusic'),
                                        className: "sr-only peer"
                                    }, void 0, false, {
                                        fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                        lineNumber: 111,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
                                    }, void 0, false, {
                                        fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                        lineNumber: 117,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                lineNumber: 110,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                        lineNumber: 103,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "block text-sm font-medium text-gray-700 mb-2",
                                children: "Product Images (Optional)"
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                lineNumber: 123,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-gray-500 mb-3",
                                children: "Upload up to 5 product images to include in your video"
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                lineNumber: 126,
                                columnNumber: 11
                            }, this),
                            productImages.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-2 md:grid-cols-3 gap-4 mb-4",
                                children: productImages.map((image, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "relative group",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "aspect-square bg-gray-100 rounded-lg overflow-hidden",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                    src: URL.createObjectURL(image),
                                                    alt: `Product ${index + 1}`,
                                                    className: "w-full h-full object-cover"
                                                }, void 0, false, {
                                                    fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                                    lineNumber: 135,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                                lineNumber: 134,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>removeImage(index),
                                                className: "absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                    className: "w-4 h-4",
                                                    fill: "none",
                                                    stroke: "currentColor",
                                                    viewBox: "0 0 24 24",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round",
                                                        strokeWidth: 2,
                                                        d: "M6 18L18 6M6 6l12 12"
                                                    }, void 0, false, {
                                                        fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                                        lineNumber: 147,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                                    lineNumber: 146,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                                lineNumber: 141,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, index, true, {
                                        fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                        lineNumber: 133,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                lineNumber: 131,
                                columnNumber: 13
                            }, this),
                            productImages.length < 5 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-1 text-center",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            className: "mx-auto h-12 w-12 text-gray-400",
                                            stroke: "currentColor",
                                            fill: "none",
                                            viewBox: "0 0 48 48",
                                            "aria-hidden": "true",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                d: "M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02",
                                                strokeWidth: 2,
                                                strokeLinecap: "round",
                                                strokeLinejoin: "round"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                                lineNumber: 165,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                            lineNumber: 158,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex text-sm text-gray-600",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    htmlFor: "productImageUpload",
                                                    className: "relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            children: "Upload images"
                                                        }, void 0, false, {
                                                            fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                                            lineNumber: 177,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            id: "productImageUpload",
                                                            type: "file",
                                                            className: "sr-only",
                                                            multiple: true,
                                                            accept: "image/jpeg,image/jpg,image/png,image/webp,image/gif",
                                                            onChange: handleImageUpload
                                                        }, void 0, false, {
                                                            fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                                            lineNumber: 178,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                                    lineNumber: 173,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "pl-1",
                                                    children: "or drag and drop"
                                                }, void 0, false, {
                                                    fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                                    lineNumber: 187,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                            lineNumber: 172,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-xs text-gray-500",
                                            children: [
                                                productImages.length,
                                                "/5 images uploaded"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                            lineNumber: 189,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                    lineNumber: 157,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                lineNumber: 156,
                                columnNumber: 13
                            }, this),
                            errors.productImages && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-1 text-sm text-red-600",
                                children: errors.productImages.message
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                                lineNumber: 196,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                        lineNumber: 122,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
                lineNumber: 51,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx",
        lineNumber: 45,
        columnNumber: 5
    }, this);
}
}),
"[project]/marin/vid_ad/components/form/ReviewStep.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ReviewStep
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/marin/vid_ad/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$lib$2f$schemas$2f$adGenerationSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/marin/vid_ad/lib/schemas/adGenerationSchema.ts [app-ssr] (ecmascript)");
'use client';
;
;
function ReviewStep({ form }) {
    const { watch } = form;
    const formData = watch();
    const estimatedCost = (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$lib$2f$schemas$2f$adGenerationSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["estimateGenerationCost"])(formData.videoModel, formData.duration, formData.variations, formData.resolution);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-2xl font-semibold text-gray-900 mb-2",
                        children: "Review & Generate"
                    }, void 0, false, {
                        fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                        lineNumber: 28,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-600",
                        children: "Review your settings before generating your video ad"
                    }, void 0, false, {
                        fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                        lineNumber: 29,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                lineNumber: 27,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-gray-50 rounded-lg p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "font-medium text-gray-900 mb-3",
                                children: "Product Information"
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                lineNumber: 35,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dl", {
                                className: "space-y-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex justify-between",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                className: "text-sm text-gray-600",
                                                children: "Product Name:"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                lineNumber: 38,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                className: "text-sm font-medium text-gray-900",
                                                children: formData.productName
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                lineNumber: 39,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                        lineNumber: 37,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                className: "text-sm text-gray-600 mb-1",
                                                children: "Description:"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                lineNumber: 42,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                className: "text-sm text-gray-900",
                                                children: formData.productDescription
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                lineNumber: 43,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                        lineNumber: 41,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                className: "text-sm text-gray-600 mb-1",
                                                children: "Keywords:"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                lineNumber: 46,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                className: "text-sm text-gray-900",
                                                children: typeof formData.keywords === 'string' ? formData.keywords : (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$lib$2f$schemas$2f$adGenerationSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatKeywordsToString"])(formData.keywords || [])
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                lineNumber: 47,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                        lineNumber: 45,
                                        columnNumber: 13
                                    }, this),
                                    formData.targetAudience && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                className: "text-sm text-gray-600 mb-1",
                                                children: "Target Audience:"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                lineNumber: 55,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                className: "text-sm text-gray-900",
                                                children: formData.targetAudience
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                lineNumber: 56,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                        lineNumber: 54,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                lineNumber: 36,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                        lineNumber: 34,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-gray-50 rounded-lg p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "font-medium text-gray-900 mb-3",
                                children: "Brand Settings"
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                lineNumber: 64,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dl", {
                                className: "space-y-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex justify-between",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                className: "text-sm text-gray-600",
                                                children: "Brand Tone:"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                lineNumber: 67,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                className: "text-sm font-medium text-gray-900 capitalize",
                                                children: formData.brandTone
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                lineNumber: 68,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                        lineNumber: 66,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex justify-between items-center",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                className: "text-sm text-gray-600",
                                                children: "Primary Color:"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                lineNumber: 71,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                className: "flex items-center space-x-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "w-6 h-6 rounded border border-gray-300",
                                                        style: {
                                                            backgroundColor: formData.primaryColor
                                                        }
                                                    }, void 0, false, {
                                                        fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                        lineNumber: 73,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-sm font-medium text-gray-900",
                                                        children: formData.primaryColor
                                                    }, void 0, false, {
                                                        fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                        lineNumber: 77,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                lineNumber: 72,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                        lineNumber: 70,
                                        columnNumber: 13
                                    }, this),
                                    formData.callToAction && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex justify-between",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                className: "text-sm text-gray-600",
                                                children: "Call to Action:"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                lineNumber: 82,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                className: "text-sm font-medium text-gray-900",
                                                children: formData.callToAction
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                lineNumber: 83,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                        lineNumber: 81,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                lineNumber: 65,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                        lineNumber: 63,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-gray-50 rounded-lg p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "font-medium text-gray-900 mb-3",
                                children: "Video Configuration"
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                lineNumber: 91,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dl", {
                                className: "space-y-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex justify-between",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                className: "text-sm text-gray-600",
                                                children: "AI Model:"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                lineNumber: 94,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                className: "text-sm font-medium text-gray-900",
                                                children: formData.videoModel === 'seedance-1-pro' ? 'Seedance 1 Pro' : 'Seedance 1 Lite'
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                lineNumber: 95,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                        lineNumber: 93,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex justify-between",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                className: "text-sm text-gray-600",
                                                children: "Variations:"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                lineNumber: 100,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                className: "text-sm font-medium text-gray-900",
                                                children: formData.variations
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                lineNumber: 101,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                        lineNumber: 99,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex justify-between",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                className: "text-sm text-gray-600",
                                                children: "Duration:"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                lineNumber: 104,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                className: "text-sm font-medium text-gray-900",
                                                children: [
                                                    formData.duration,
                                                    " seconds"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                lineNumber: 105,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                        lineNumber: 103,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex justify-between",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                className: "text-sm text-gray-600",
                                                children: "Orientation:"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                lineNumber: 108,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                className: "text-sm font-medium text-gray-900 capitalize",
                                                children: formData.orientation
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                lineNumber: 109,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                        lineNumber: 107,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex justify-between",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                className: "text-sm text-gray-600",
                                                children: "Resolution:"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                lineNumber: 112,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                className: "text-sm font-medium text-gray-900 uppercase",
                                                children: formData.resolution
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                lineNumber: 113,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                        lineNumber: 111,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex justify-between",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                className: "text-sm text-gray-600",
                                                children: "Frame Rate:"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                lineNumber: 116,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                className: "text-sm font-medium text-gray-900",
                                                children: [
                                                    formData.frameRate,
                                                    " fps"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                lineNumber: 117,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                        lineNumber: 115,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                lineNumber: 92,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                        lineNumber: 90,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-gray-50 rounded-lg p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "font-medium text-gray-900 mb-3",
                                children: "Additional Options"
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                lineNumber: 124,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dl", {
                                className: "space-y-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex justify-between",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                className: "text-sm text-gray-600",
                                                children: "Voiceover:"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                lineNumber: 127,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                className: "text-sm font-medium text-gray-900",
                                                children: formData.includeVoiceover ? `Yes (${formData.voiceStyle})` : 'No'
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                lineNumber: 128,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                        lineNumber: 126,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex justify-between",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                className: "text-sm text-gray-600",
                                                children: "Background Music:"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                lineNumber: 133,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                className: "text-sm font-medium text-gray-900",
                                                children: formData.includeBackgroundMusic ? 'Yes' : 'No'
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                lineNumber: 134,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                        lineNumber: 132,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex justify-between",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                className: "text-sm text-gray-600",
                                                children: "Product Images:"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                lineNumber: 139,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                className: "text-sm font-medium text-gray-900",
                                                children: [
                                                    formData.productImages?.length || 0,
                                                    " uploaded"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                                lineNumber: 140,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                        lineNumber: 138,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                lineNumber: 125,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                        lineNumber: 123,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-blue-50 border-2 border-blue-200 rounded-lg p-4",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-between items-center",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "font-medium text-gray-900",
                                            children: "Estimated Generation Cost"
                                        }, void 0, false, {
                                            fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                            lineNumber: 151,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-xs text-gray-600 mt-1",
                                            children: "This estimate includes video generation only"
                                        }, void 0, false, {
                                            fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                            lineNumber: 152,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                    lineNumber: 150,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-right",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-2xl font-bold text-blue-600",
                                            children: [
                                                "$",
                                                estimatedCost.toFixed(2)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                            lineNumber: 157,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-xs text-gray-600",
                                            children: [
                                                formData.variations,
                                                " × ",
                                                formData.duration,
                                                "s × ",
                                                formData.videoModel === 'seedance-1-pro' ? 'Pro' : 'Lite',
                                                " @ ",
                                                formData.resolution
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                            lineNumber: 158,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                    lineNumber: 156,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                            lineNumber: 149,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                        lineNumber: 148,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    className: "flex-shrink-0 h-5 w-5 text-yellow-400 mt-0.5",
                                    viewBox: "0 0 20 20",
                                    fill: "currentColor",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                        fillRule: "evenodd",
                                        d: "M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z",
                                        clipRule: "evenodd"
                                    }, void 0, false, {
                                        fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                        lineNumber: 173,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                    lineNumber: 168,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "ml-3",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "text-sm font-medium text-yellow-800",
                                            children: "Generation Time"
                                        }, void 0, false, {
                                            fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                            lineNumber: 180,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "mt-1 text-sm text-yellow-700",
                                            children: "Video generation typically takes 2-5 minutes. You'll receive real-time updates on the progress and can track the status in your dashboard."
                                        }, void 0, false, {
                                            fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                            lineNumber: 181,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                                    lineNumber: 179,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                            lineNumber: 167,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                        lineNumber: 166,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
                lineNumber: 32,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/marin/vid_ad/components/form/ReviewStep.tsx",
        lineNumber: 26,
        columnNumber: 5
    }, this);
}
}),
"[project]/marin/vid_ad/components/AdGenerationForm.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AdGenerationForm
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/marin/vid_ad/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/marin/vid_ad/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$components$2f$form$2f$FormStepIndicator$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/marin/vid_ad/components/form/FormStepIndicator.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$components$2f$form$2f$ProductInfoStep$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/marin/vid_ad/components/form/ProductInfoStep.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$components$2f$form$2f$BrandSettingsStep$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/marin/vid_ad/components/form/BrandSettingsStep.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$components$2f$form$2f$VideoConfigStep$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/marin/vid_ad/components/form/VideoConfigStep.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$components$2f$form$2f$AdditionalOptionsStep$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/marin/vid_ad/components/form/AdditionalOptionsStep.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$components$2f$form$2f$ReviewStep$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/marin/vid_ad/components/form/ReviewStep.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
;
;
const steps = [
    {
        id: 1,
        name: 'Product Info',
        description: 'Basic product details'
    },
    {
        id: 2,
        name: 'Brand Settings',
        description: 'Brand tone and style'
    },
    {
        id: 3,
        name: 'Video Config',
        description: 'Video specifications'
    },
    {
        id: 4,
        name: 'Additional Options',
        description: 'Extra features'
    },
    {
        id: 5,
        name: 'Review',
        description: 'Review and submit'
    }
];
function AdGenerationForm({ form, onSubmit, isSubmitting }) {
    const [currentStep, setCurrentStep] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(1);
    const handleNext = async ()=>{
        // Validate current step fields before proceeding
        let fieldsToValidate = [];
        switch(currentStep){
            case 1:
                fieldsToValidate = [
                    'productName',
                    'productDescription',
                    'keywords'
                ];
                break;
            case 2:
                fieldsToValidate = [
                    'brandTone',
                    'primaryColor'
                ];
                break;
            case 3:
                fieldsToValidate = [
                    'variations',
                    'duration',
                    'orientation',
                    'resolution',
                    'frameRate',
                    'videoModel'
                ];
                break;
            case 4:
                break;
        }
        if (fieldsToValidate.length > 0) {
            const isValid = await form.trigger(fieldsToValidate);
            if (!isValid) return;
        }
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        }
    };
    const handlePrevious = ()=>{
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };
    const handleStepClick = async (stepId)=>{
        // Allow going back without validation
        if (stepId < currentStep) {
            setCurrentStep(stepId);
            return;
        }
        // Validate all previous steps when jumping forward
        let allValid = true;
        for(let i = 1; i < stepId; i++){
            let fieldsToValidate = [];
            switch(i){
                case 1:
                    fieldsToValidate = [
                        'productName',
                        'productDescription',
                        'keywords'
                    ];
                    break;
                case 2:
                    fieldsToValidate = [
                        'brandTone',
                        'primaryColor'
                    ];
                    break;
                case 3:
                    fieldsToValidate = [
                        'variations',
                        'duration',
                        'orientation',
                        'resolution',
                        'frameRate',
                        'videoModel'
                    ];
                    break;
            }
            if (fieldsToValidate.length > 0) {
                const isValid = await form.trigger(fieldsToValidate);
                if (!isValid) {
                    allValid = false;
                    break;
                }
            }
        }
        if (allValid) {
            setCurrentStep(stepId);
        }
    };
    const handleSubmit = form.handleSubmit(onSubmit, (errors)=>{
        console.error('❌ Form validation errors:', errors);
        alert('Please fix the following errors:\n\n' + Object.entries(errors).map(([field, error])=>`${field}: ${error?.message || 'Invalid value'}`).join('\n'));
    });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-8",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$components$2f$form$2f$FormStepIndicator$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                steps: steps,
                currentStep: currentStep,
                onStepClick: handleStepClick
            }, void 0, false, {
                fileName: "[project]/marin/vid_ad/components/AdGenerationForm.tsx",
                lineNumber: 121,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white shadow-lg rounded-lg p-8 relative",
                children: [
                    isSubmitting && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 rounded-lg",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-center",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"
                                }, void 0, false, {
                                    fileName: "[project]/marin/vid_ad/components/AdGenerationForm.tsx",
                                    lineNumber: 132,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-lg font-semibold text-gray-900",
                                    children: "Preparing your video generation..."
                                }, void 0, false, {
                                    fileName: "[project]/marin/vid_ad/components/AdGenerationForm.tsx",
                                    lineNumber: 133,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-gray-600 mt-2",
                                    children: "This will only take a moment"
                                }, void 0, false, {
                                    fileName: "[project]/marin/vid_ad/components/AdGenerationForm.tsx",
                                    lineNumber: 134,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/marin/vid_ad/components/AdGenerationForm.tsx",
                            lineNumber: 131,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/marin/vid_ad/components/AdGenerationForm.tsx",
                        lineNumber: 130,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                        onSubmit: handleSubmit,
                        className: "space-y-6",
                        children: [
                            currentStep === 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$components$2f$form$2f$ProductInfoStep$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                form: form
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/AdGenerationForm.tsx",
                                lineNumber: 140,
                                columnNumber: 33
                            }, this),
                            currentStep === 2 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$components$2f$form$2f$BrandSettingsStep$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                form: form
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/AdGenerationForm.tsx",
                                lineNumber: 141,
                                columnNumber: 33
                            }, this),
                            currentStep === 3 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$components$2f$form$2f$VideoConfigStep$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                form: form
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/AdGenerationForm.tsx",
                                lineNumber: 142,
                                columnNumber: 33
                            }, this),
                            currentStep === 4 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$components$2f$form$2f$AdditionalOptionsStep$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                form: form
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/AdGenerationForm.tsx",
                                lineNumber: 143,
                                columnNumber: 33
                            }, this),
                            currentStep === 5 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$components$2f$form$2f$ReviewStep$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                form: form
                            }, void 0, false, {
                                fileName: "[project]/marin/vid_ad/components/AdGenerationForm.tsx",
                                lineNumber: 144,
                                columnNumber: 33
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-between pt-6 border-t",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: handlePrevious,
                                        disabled: currentStep === 1,
                                        className: "px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed",
                                        children: "Previous"
                                    }, void 0, false, {
                                        fileName: "[project]/marin/vid_ad/components/AdGenerationForm.tsx",
                                        lineNumber: 147,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-x-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>{
                                                    localStorage.setItem('adGenerationDraft', JSON.stringify(form.getValues()));
                                                },
                                                className: "px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50",
                                                children: "Save Draft"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/AdGenerationForm.tsx",
                                                lineNumber: 157,
                                                columnNumber: 15
                                            }, this),
                                            currentStep < steps.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: handleNext,
                                                className: "px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700",
                                                children: "Next"
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/AdGenerationForm.tsx",
                                                lineNumber: 168,
                                                columnNumber: 17
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "submit",
                                                disabled: isSubmitting,
                                                onClick: ()=>console.log('🖱️ Generate Video button clicked'),
                                                className: "px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed",
                                                children: isSubmitting ? 'Generating...' : 'Generate Video'
                                            }, void 0, false, {
                                                fileName: "[project]/marin/vid_ad/components/AdGenerationForm.tsx",
                                                lineNumber: 176,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/marin/vid_ad/components/AdGenerationForm.tsx",
                                        lineNumber: 156,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/marin/vid_ad/components/AdGenerationForm.tsx",
                                lineNumber: 146,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/marin/vid_ad/components/AdGenerationForm.tsx",
                        lineNumber: 139,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/marin/vid_ad/components/AdGenerationForm.tsx",
                lineNumber: 127,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/marin/vid_ad/components/AdGenerationForm.tsx",
        lineNumber: 120,
        columnNumber: 5
    }, this);
}
}),
"[project]/marin/vid_ad/app/generate/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>GeneratePage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/marin/vid_ad/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/marin/vid_ad/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$react$2d$hook$2d$form$2f$dist$2f$index$2e$esm$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/marin/vid_ad/node_modules/react-hook-form/dist/index.esm.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f40$hookform$2f$resolvers$2f$zod$2f$dist$2f$zod$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/marin/vid_ad/node_modules/@hookform/resolvers/zod/dist/zod.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$lib$2f$schemas$2f$adGenerationSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/marin/vid_ad/lib/schemas/adGenerationSchema.ts [app-ssr] (ecmascript)");
// import { useAuth } from '@/lib/contexts/AuthContext';
var __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$components$2f$AdGenerationForm$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/marin/vid_ad/components/AdGenerationForm.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
function GeneratePage() {
    // const { user, loading } = useAuth();
    const user = true; // Temporarily bypass auth for testing
    const loading = false;
    const [isSubmitting, setIsSubmitting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const form = (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$react$2d$hook$2d$form$2f$dist$2f$index$2e$esm$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useForm"])({
        resolver: (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f40$hookform$2f$resolvers$2f$zod$2f$dist$2f$zod$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["zodResolver"])(__TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$lib$2f$schemas$2f$adGenerationSchema$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["adGenerationSchema"]),
        defaultValues: {
            productName: '',
            productDescription: '',
            keywords: '',
            brandTone: 'professional',
            primaryColor: '#000000',
            variations: 1,
            duration: 7,
            orientation: 'landscape',
            resolution: '1080p',
            frameRate: 30,
            videoModel: 'seedance-1-lite',
            logoFile: undefined,
            productImages: [],
            includeVoiceover: true,
            voiceStyle: 'alloy',
            includeBackgroundMusic: true,
            callToAction: '',
            targetAudience: ''
        }
    });
    // Load draft from localStorage on mount (only if continuing a draft)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // Check if we're coming from a "Generate New Campaign" click
        // by checking if there's a 'new' query parameter
        const searchParams = new URLSearchParams(window.location.search);
        const isNewCampaign = searchParams.get('new') === 'true';
        if (isNewCampaign) {
            // Clear any old draft and start fresh
            console.log('🆕 Starting new campaign - clearing draft');
            localStorage.removeItem('adGenerationDraft');
            form.reset(); // Reset to default values
            return;
        }
        // Otherwise, try to load a saved draft
        const savedDraft = localStorage.getItem('adGenerationDraft');
        if (savedDraft) {
            try {
                const parsedDraft = JSON.parse(savedDraft);
                console.log('📝 Loading saved draft');
                form.reset(parsedDraft);
            } catch (error) {
                console.error('Failed to load draft:', error);
            }
        }
    }, [
        form
    ]);
    // Save draft to localStorage on form changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const subscription = form.watch((formData)=>{
            localStorage.setItem('adGenerationDraft', JSON.stringify(formData));
        });
        return ()=>subscription.unsubscribe();
    }, [
        form
    ]);
    // Redirect if not authenticated
    // useEffect(() => {
    //   if (!loading && !user) {
    //     router.push('/auth/login?returnUrl=/generate');
    //   }
    // }, [user, loading, router]);
    const onSubmit = async (data)=>{
        console.log('🎬 onSubmit called with data:', data);
        setIsSubmitting(true);
        try {
            console.log('💾 Saving generation data to localStorage...');
            // Generate unique campaign ID
            const campaignId = crypto.randomUUID();
            console.log('🆔 Generated campaign ID:', campaignId);
            // Save campaign data with unique key
            const campaignData = {
                id: campaignId,
                createdAt: Date.now(),
                ...data
            };
            const campaignKey = `campaign_${campaignId}`;
            localStorage.setItem(campaignKey, JSON.stringify(campaignData));
            // Track the active campaign ID
            localStorage.setItem('activeCampaignId', campaignId);
            // Clear draft after successful submission
            localStorage.removeItem('adGenerationDraft');
            console.log('✅ Campaign data saved, redirecting to results page...');
            // Small delay to ensure state updates and show loading state
            await new Promise((resolve)=>setTimeout(resolve, 500));
            // Redirect to generation results page with campaign ID
            console.log('🔄 Navigating to /generate/results/ with campaign ID');
            window.location.href = `/generate/results/?campaignId=${campaignId}`;
        } catch (error) {
            console.error('❌ Generation error:', error);
            alert('Error preparing video generation. Please try again.');
            setIsSubmitting(false);
        }
    };
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-gray-50 py-8",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "container mx-auto px-4",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "max-w-4xl mx-auto",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "text-3xl font-bold text-gray-900 mb-8",
                        children: "Generate Video Ad"
                    }, void 0, false, {
                        fileName: "[project]/marin/vid_ad/app/generate/page.tsx",
                        lineNumber: 141,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$marin$2f$vid_ad$2f$components$2f$AdGenerationForm$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        form: form,
                        onSubmit: onSubmit,
                        isSubmitting: isSubmitting
                    }, void 0, false, {
                        fileName: "[project]/marin/vid_ad/app/generate/page.tsx",
                        lineNumber: 145,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/marin/vid_ad/app/generate/page.tsx",
                lineNumber: 140,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/marin/vid_ad/app/generate/page.tsx",
            lineNumber: 139,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/marin/vid_ad/app/generate/page.tsx",
        lineNumber: 138,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=marin_vid_ad_d5e3d514._.js.map