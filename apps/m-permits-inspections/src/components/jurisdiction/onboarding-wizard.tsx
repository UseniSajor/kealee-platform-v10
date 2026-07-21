/**
 * Jurisdiction Onboarding Wizard
 * Multi-step wizard for jurisdiction onboarding
 */

'use client';

import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Progress} from '@/components/ui/progress';
import {CheckCircle2, MapPin, CreditCard, Users} from 'lucide-react';

const onboardingSchema = z.object({
  // Step 1: Basic Info
  name: z.string().min(1, 'Name is required'),
  code: z.string().optional(),
  state: z.string().min(1, 'State is required'),
  county: z.string().optional(),
  city: z.string().optional(),
  contactEmail: z.string().email('Invalid email'),
  contactPhone: z.string().min(1, 'Phone is required'),
  websiteUrl: z.string().url('Invalid URL').optional().or(z.literal('')),

  // Step 2: Service Area (simplified - would use map)
  serviceAreaJson: z.string().optional(),

  // Step 3: Subscription
  subscriptionTier: z.enum(['BASIC', 'PRO', 'ENTERPRISE']),
  billingEmail: z.string().email('Invalid email').optional().or(z.literal('')),

  // Step 4: Admin
  adminEmail: z.string().email('Invalid email'),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

const steps = [
  {id: 1, title: 'Basic Info', icon: MapPin},
  {id: 2, title: 'Service Area', icon: MapPin},
  {id: 3, title: 'Subscription', icon: CreditCard},
  {id: 4, title: 'Admin Setup', icon: Users},
];

interface OnboardingWizardProps {
  onComplete?: (result: {jurisdictionId: string; licenseKey: string}) => void;
}

export function JurisdictionOnboardingWizard({onComplete}: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onChange',
    defaultValues: {
      subscriptionTier: 'BASIC',
    },
  });

  const progress = (currentStep / steps.length) * 100;

  const handleNext = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fieldsToValidate as any);

    if (isValid && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (data: OnboardingFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // Parse service area GeoJSON if provided; otherwise send null for server default
      let serviceArea = null;
      if (data.serviceAreaJson) {
        try {
          serviceArea = JSON.parse(data.serviceAreaJson);
        } catch {
          setSubmitError('The service area GeoJSON is not valid JSON. Please fix it or leave the field empty.');
          setIsSubmitting(false);
          return;
        }
      }

      const response = await fetch('/api/jurisdictions/onboard', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          ...data,
          serviceArea,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Onboarding failed');
      }

      const result = await response.json();
      onComplete?.(result);
    } catch (error) {
      console.error('Onboarding error:', error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Failed to complete onboarding. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Jurisdiction Onboarding</CardTitle>
          <CardDescription>
            Set up your jurisdiction account to start processing permits
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.id}
                    className={`flex-1 text-center ${
                      step.id <= currentStep ? 'text-primary' : 'text-gray-400'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center mb-2 ${
                        step.id < currentStep
                          ? 'bg-primary text-white'
                          : step.id === currentStep
                          ? 'bg-primary text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {step.id < currentStep ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <p className="text-xs mt-1">{step.title}</p>
                  </div>
                );
              })}
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Content */}
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="min-h-[400px]">
              {currentStep === 1 && <Step1BasicInfo form={form} />}
              {currentStep === 2 && <Step2ServiceArea form={form} />}
              {currentStep === 3 && <Step3Subscription form={form} />}
              {currentStep === 4 && <Step4Admin form={form} />}
            </div>

            {/* Submit Error */}
            {submitError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                Back
              </Button>
              {currentStep < steps.length ? (
                <Button type="button" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Completing Setup...' : 'Complete Setup'}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Step 1: Basic Info
function Step1BasicInfo({form}: {form: any}) {
  const {register, formState: {errors}, watch} = form;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Basic Information</h2>
        <p className="text-gray-600">Enter your jurisdiction's basic details</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Jurisdiction Name *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="e.g., Prince George's County, MD"
          />
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="state">State *</Label>
            <Input id="state" {...register('state')} placeholder="e.g., MD" />
            {errors.state && (
              <p className="text-sm text-red-600">{errors.state.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Jurisdiction Code</Label>
            <Input
              id="code"
              {...register('code')}
              placeholder="Auto-generated if empty"
            />
            <p className="text-xs text-gray-500">
              Unique identifier (e.g., PGC-MD)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="county">County</Label>
            <Input id="county" {...register('county')} placeholder="Optional" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" {...register('city')} placeholder="Optional" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactEmail">Contact Email *</Label>
          <Input
            id="contactEmail"
            type="email"
            {...register('contactEmail')}
            placeholder="contact@jurisdiction.gov"
          />
          {errors.contactEmail && (
            <p className="text-sm text-red-600">{errors.contactEmail.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Contact Phone *</Label>
            <Input
              id="contactPhone"
              type="tel"
              {...register('contactPhone')}
              placeholder="(555) 123-4567"
            />
            {errors.contactPhone && (
              <p className="text-sm text-red-600">{errors.contactPhone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="websiteUrl">Website</Label>
            <Input
              id="websiteUrl"
              type="url"
              {...register('websiteUrl')}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 2: Service Area
function Step2ServiceArea({form}: {form: any}) {
  const {register} = form;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Service Area</h2>
        <p className="text-gray-600">Define your jurisdiction's service area</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="serviceAreaJson">Service Area (GeoJSON)</Label>
          <textarea
            id="serviceAreaJson"
            {...register('serviceAreaJson')}
            className="w-full min-h-[300px] p-3 border rounded-md font-mono text-sm"
            placeholder='{"type": "Polygon", "coordinates": [[[...]]]}'
          />
          <p className="text-xs text-gray-500">
            Paste GeoJSON polygon or leave empty for default (entire state)
          </p>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            💡 Tip: You can draw the service area on a map in the full version, or
            import from a GIS system. For now, paste the GeoJSON directly.
          </p>
        </div>
      </div>
    </div>
  );
}

// Step 3: Subscription
function Step3Subscription({form}: {form: any}) {
  const {register, watch, formState: {errors}} = form;
  const tier = watch('subscriptionTier');

  const tierInfo: Record<string, {price: number; features: string[]}> = {
    BASIC: {
      price: 500,
      features: [
        'Up to 100 permits/month',
        'Up to 3 staff users',
        'Basic reporting',
        'Email support',
      ],
    },
    PRO: {
      price: 1000,
      features: [
        'Up to 500 permits/month',
        'Up to 10 staff users',
        'Advanced reporting',
        'Custom fee schedules',
        'Phone support',
      ],
    },
    ENTERPRISE: {
      price: 2000,
      features: [
        'Unlimited permits',
        'Unlimited staff users',
        'Custom integrations',
        'GIS integration',
        'White-label options',
        'Dedicated account manager',
      ],
    },
  };

  const info = tierInfo[tier] || tierInfo.BASIC;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Subscription Tier</h2>
        <p className="text-gray-600">Choose your subscription plan</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="subscriptionTier">Subscription Tier *</Label>
          <Select
            value={tier}
            onValueChange={(value) => form.setValue('subscriptionTier', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BASIC">Basic - $500/month</SelectItem>
              <SelectItem value="PRO">Pro - $1,000/month</SelectItem>
              <SelectItem value="ENTERPRISE">Enterprise - $2,000/month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-blue-900">{tier} Plan</h3>
            <span className="text-2xl font-bold text-blue-900">${info.price}/month</span>
          </div>
          <ul className="space-y-2">
            {info.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-blue-800">
                <CheckCircle2 className="w-4 h-4" />
                {feature}
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-2">
          <Label htmlFor="billingEmail">Billing Email (Optional)</Label>
          <Input
            id="billingEmail"
            type="email"
            {...register('billingEmail')}
            placeholder="billing@jurisdiction.gov"
          />
          <p className="text-xs text-gray-500">
            If different from contact email
          </p>
        </div>
      </div>
    </div>
  );
}

// Step 4: Admin Setup
function Step4Admin({form}: {form: any}) {
  const {register, formState: {errors}} = form;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Administrator Account</h2>
        <p className="text-gray-600">Set up the primary administrator account</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="adminEmail">Administrator Email *</Label>
          <Input
            id="adminEmail"
            type="email"
            {...register('adminEmail')}
            placeholder="admin@jurisdiction.gov"
          />
          {errors.adminEmail && (
            <p className="text-sm text-red-600">{errors.adminEmail.message}</p>
          )}
          <p className="text-xs text-gray-500">
            This user will be set as the jurisdiction administrator
          </p>
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-900">
            ⚠️ The user with this email must already have an account. If not, they
            should sign up first before completing this onboarding.
          </p>
        </div>
      </div>
    </div>
  );
}

function getFieldsForStep(step: number): (keyof OnboardingFormData)[] {
  switch (step) {
    case 1:
      return ['name', 'state', 'contactEmail', 'contactPhone'];
    case 2:
      return [];
    case 3:
      return ['subscriptionTier'];
    case 4:
      return ['adminEmail'];
    default:
      return [];
  }
}
