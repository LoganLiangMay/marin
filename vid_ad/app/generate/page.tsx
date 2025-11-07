'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { adGenerationSchema, AdGenerationFormData } from '@/lib/schemas/adGenerationSchema';
// import { useAuth } from '@/lib/contexts/AuthContext';
import AdGenerationForm from '@/components/AdGenerationForm';

export default function GeneratePage() {
  // const { user, loading } = useAuth();
  const user = true; // Temporarily bypass auth for testing
  const loading = false;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AdGenerationFormData>({
    resolver: zodResolver(adGenerationSchema) as any,
    defaultValues: {
      productName: '',
      productDescription: '',
      keywords: '' as any, // Schema transforms string to array
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
      targetAudience: '',
    },
  });

  // Load draft from localStorage on mount (only if continuing a draft)
  useEffect(() => {
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
  }, [form]);

  // Save draft to localStorage on form changes
  useEffect(() => {
    const subscription = form.watch((formData) => {
      localStorage.setItem('adGenerationDraft', JSON.stringify(formData));
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Redirect if not authenticated
  // useEffect(() => {
  //   if (!loading && !user) {
  //     router.push('/auth/login?returnUrl=/generate');
  //   }
  // }, [user, loading, router]);

  const onSubmit = async (data: AdGenerationFormData) => {
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
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect to generation results page with campaign ID
      console.log('🔄 Navigating to /generate/results/ with campaign ID');
      window.location.href = `/generate/results/?campaignId=${campaignId}`;
    } catch (error) {
      console.error('❌ Generation error:', error);
      alert('Error preparing video generation. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Generate Video Ad
          </h1>

          <AdGenerationForm
            form={form}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}