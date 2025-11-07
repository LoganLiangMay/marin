'use client';

import { UseFormReturn } from 'react-hook-form';
import { AdGenerationFormData } from '@/lib/schemas/adGenerationSchema';

interface AdditionalOptionsStepProps {
  form: UseFormReturn<AdGenerationFormData>;
}

const voiceStyles = [
  { value: 'alloy', label: 'Alloy', description: 'Neutral and balanced' },
  { value: 'echo', label: 'Echo', description: 'Warm and conversational' },
  { value: 'fable', label: 'Fable', description: 'Expressive and dynamic' },
  { value: 'onyx', label: 'Onyx', description: 'Authoritative and deep' },
  { value: 'nova', label: 'Nova', description: 'Friendly and upbeat' },
  { value: 'shimmer', label: 'Shimmer', description: 'Soft and pleasant' },
];

export default function AdditionalOptionsStep({ form }: AdditionalOptionsStepProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const includeVoiceover = watch('includeVoiceover');
  const voiceStyle = watch('voiceStyle');
  const productImages = watch('productImages') || [];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files);
      setValue('productImages', [...productImages, ...newImages].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = productImages.filter((_: any, i: number) => i !== index);
    setValue('productImages', updatedImages);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Additional Options</h2>
        <p className="text-gray-600">Enhance your video with extra features</p>
      </div>

      <div className="space-y-6">
        {/* Voiceover Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="includeVoiceover" className="text-sm font-medium text-gray-700">
                Include Voiceover
              </label>
              <p className="text-xs text-gray-500">Add AI-generated narration to your video</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="includeVoiceover"
                {...register('includeVoiceover')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {includeVoiceover && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Voice Style
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {voiceStyles.map((voice) => (
                  <label
                    key={voice.value}
                    className={`relative flex flex-col p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      voiceStyle === voice.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      {...register('voiceStyle')}
                      value={voice.value}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-gray-900">{voice.label}</span>
                    <span className="text-xs text-gray-500 mt-0.5">{voice.description}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Background Music */}
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="includeBackgroundMusic" className="text-sm font-medium text-gray-700">
              Include Background Music
            </label>
            <p className="text-xs text-gray-500">Add royalty-free background music</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="includeBackgroundMusic"
              {...register('includeBackgroundMusic')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Product Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Images (Optional)
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Upload up to 5 product images to include in your video
          </p>

          {productImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {productImages.map((image: any, index: number) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Product ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {productImages.length < 5 && (
            <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="productImageUpload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Upload images</span>
                    <input
                      id="productImageUpload"
                      type="file"
                      className="sr-only"
                      multiple
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      onChange={handleImageUpload}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  {productImages.length}/5 images uploaded
                </p>
              </div>
            </div>
          )}
          {errors.productImages && (
            <p className="mt-1 text-sm text-red-600">{errors.productImages.message as string}</p>
          )}
        </div>
      </div>
    </div>
  );
}