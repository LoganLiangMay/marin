'use client';

import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { AdGenerationFormData } from '@/lib/schemas/adGenerationSchema';
import FormStepIndicator from './form/FormStepIndicator';
import ProductInfoStep from './form/ProductInfoStep';
import BrandSettingsStep from './form/BrandSettingsStep';
import VideoConfigStep from './form/VideoConfigStep';
import AdditionalOptionsStep from './form/AdditionalOptionsStep';
import ReviewStep from './form/ReviewStep';

interface AdGenerationFormProps {
  form: UseFormReturn<AdGenerationFormData>;
  onSubmit: (data: AdGenerationFormData) => void;
  isSubmitting: boolean;
}

const steps = [
  { id: 1, name: 'Product Info', description: 'Basic product details' },
  { id: 2, name: 'Brand Settings', description: 'Brand tone and style' },
  { id: 3, name: 'Video Config', description: 'Video specifications' },
  { id: 4, name: 'Additional Options', description: 'Extra features' },
  { id: 5, name: 'Review', description: 'Review and submit' },
];

export default function AdGenerationForm({
  form,
  onSubmit,
  isSubmitting,
}: AdGenerationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = async () => {
    // Validate current step fields before proceeding
    let fieldsToValidate: (keyof AdGenerationFormData)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ['productName', 'productDescription', 'keywords'];
        break;
      case 2:
        fieldsToValidate = ['brandTone', 'primaryColor'];
        break;
      case 3:
        fieldsToValidate = ['variations', 'duration', 'orientation', 'resolution', 'frameRate', 'videoModel'];
        break;
      case 4:
        // Optional fields, no validation needed
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

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = async (stepId: number) => {
    // Allow going back without validation
    if (stepId < currentStep) {
      setCurrentStep(stepId);
      return;
    }

    // Validate all previous steps when jumping forward
    let allValid = true;
    for (let i = 1; i < stepId; i++) {
      let fieldsToValidate: (keyof AdGenerationFormData)[] = [];

      switch (i) {
        case 1:
          fieldsToValidate = ['productName', 'productDescription', 'keywords'];
          break;
        case 2:
          fieldsToValidate = ['brandTone', 'primaryColor'];
          break;
        case 3:
          fieldsToValidate = ['variations', 'duration', 'orientation', 'resolution', 'frameRate', 'videoModel'];
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

  const handleSubmit = form.handleSubmit(
    onSubmit,
    (errors) => {
      console.error('❌ Form validation errors:', errors);
      alert('Please fix the following errors:\n\n' +
        Object.entries(errors)
          .map(([field, error]: [string, any]) => `${field}: ${error?.message || 'Invalid value'}`)
          .join('\n')
      );
    }
  );

  return (
    <div className="space-y-8">
      <FormStepIndicator
        steps={steps}
        currentStep={currentStep}
        onStepClick={handleStepClick}
      />

      <div className="bg-white shadow-lg rounded-lg p-8 relative">
        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-lg font-semibold text-gray-900">Preparing your video generation...</p>
              <p className="text-sm text-gray-600 mt-2">This will only take a moment</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {currentStep === 1 && <ProductInfoStep form={form} />}
          {currentStep === 2 && <BrandSettingsStep form={form} />}
          {currentStep === 3 && <VideoConfigStep form={form} />}
          {currentStep === 4 && <AdditionalOptionsStep form={form} />}
          {currentStep === 5 && <ReviewStep form={form} />}

          <div className="flex justify-between pt-6 border-t">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="space-x-4">
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('adGenerationDraft', JSON.stringify(form.getValues()));
                }}
                className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
              >
                Save Draft
              </button>

              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  onClick={() => console.log('🖱️ Generate Video button clicked')}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Generating...' : 'Generate Video'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}