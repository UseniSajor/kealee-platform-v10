import {JurisdictionOnboardingWizard} from '@/components/jurisdiction/onboarding-wizard';

export default function JurisdictionOnboardingPage() {
  return (
    <div className="container mx-auto p-6">
      <JurisdictionOnboardingWizard
        onComplete={(result) => {
          // Redirect to dashboard or configuration
          window.location.href = `/dashboard/jurisdiction/configuration?jurisdictionId=${result.jurisdictionId}`;
        }}
      />
    </div>
  );
}
