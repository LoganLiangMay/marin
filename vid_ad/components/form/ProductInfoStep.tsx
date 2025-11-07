'use client';

import { UseFormReturn } from 'react-hook-form';
import { AdGenerationFormData } from '@/lib/schemas/adGenerationSchema';

interface ProductInfoStepProps {
  form: UseFormReturn<AdGenerationFormData>;
}

export default function ProductInfoStep({ form }: ProductInfoStepProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = form;

  const productName = watch('productName') || '';
  const productDescription = watch('productDescription') || '';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Product Information</h2>
        <p className="text-gray-600">Tell us about the product you want to advertise</p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">
            Product Name *
          </label>
          <div className="relative">
            <input
              type="text"
              id="productName"
              {...register('productName')}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                errors.productName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your product name"
              maxLength={100}
            />
            <span className="absolute right-3 top-2.5 text-xs text-gray-500">
              {productName.length}/100
            </span>
          </div>
          {errors.productName && (
            <p className="mt-1 text-sm text-red-600">{errors.productName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="productDescription" className="block text-sm font-medium text-gray-700 mb-1">
            Product Description *
          </label>
          <div className="relative">
            <textarea
              id="productDescription"
              {...register('productDescription')}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none ${
                errors.productDescription ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe your product's key features and benefits"
              maxLength={500}
            />
            <span className="absolute right-3 bottom-2 text-xs text-gray-500">
              {productDescription.length}/500
            </span>
          </div>
          {errors.productDescription && (
            <p className="mt-1 text-sm text-red-600">{errors.productDescription.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">
            Keywords *
          </label>
          <input
            type="text"
            id="keywords"
            {...register('keywords')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
              errors.keywords ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter keywords separated by commas (e.g., innovative, eco-friendly, premium)"
          />
          <p className="mt-1 text-xs text-gray-500">
            Add up to 10 keywords to help generate relevant ad content
          </p>
          {errors.keywords && (
            <p className="mt-1 text-sm text-red-600">{errors.keywords.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700 mb-1">
            Target Audience (Optional)
          </label>
          <textarea
            id="targetAudience"
            {...register('targetAudience')}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none ${
              errors.targetAudience ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Describe your target audience (e.g., young professionals, eco-conscious consumers)"
            maxLength={200}
          />
          {errors.targetAudience && (
            <p className="mt-1 text-sm text-red-600">{errors.targetAudience.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}