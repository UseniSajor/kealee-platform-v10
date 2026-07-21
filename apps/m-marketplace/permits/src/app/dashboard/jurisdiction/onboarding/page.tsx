import {JurisdictionOnboardingWizard} from '@permits/src/components/jurisdiction/onboarding-wizard';

export default function JurisdictionOnboardingPage() {
  return (
    <div className="container mx-auto p-6">
      <JurisdictionOnboardingWizard
        onComplete={(result) => {
          // Redirect to dashboard or configuration
          window.location.href = `/permits/dashboard/jurisdiction/configuration?jurisdictionId=${result.jurisdictionId}`;
        }}
      />
    </div>
  );
}
