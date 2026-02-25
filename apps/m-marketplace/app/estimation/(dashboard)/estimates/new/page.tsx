'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EstimateWizard } from '@estimation/components/estimates/EstimateWizard';
import { useToast } from '@estimation/components/ui/use-toast';
import { apiClient } from '@estimation/lib/api';

export default function NewEstimatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const handleComplete = async (estimateData: any) => {
    setIsCreating(true);
    
    try {
      // Create estimate via API
      const response = await apiClient.createEstimate(estimateData);
      
      if (response.success && response.data) {
        toast({
          title: 'Estimate created!',
          description: 'Your estimate has been saved successfully.',
        });
        
        // Redirect to estimate editor — backend wraps in { estimate: {...} }
        const raw = response.data as any;
        const estimateId = raw.estimate?.id || raw.id || 'new';
        router.push(`/estimation/estimates/${estimateId}/edit`);
      } else {
        throw new Error(response.error || 'Failed to create estimate');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create estimate',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Estimate</h1>
        <p className="text-muted-foreground mt-1">
          Follow the steps to create a detailed cost estimate
        </p>
      </div>

      <EstimateWizard
        onComplete={handleComplete}
        isSubmitting={isCreating}
      />
    </div>
  );
}
