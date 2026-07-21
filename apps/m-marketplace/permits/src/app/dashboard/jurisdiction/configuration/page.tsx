import {ConfigurationDashboard} from '@permits/src/components/jurisdiction/configuration-dashboard';

export default function JurisdictionConfigurationPage({
  searchParams,
}: {
  searchParams: {jurisdictionId?: string};
}) {
  const jurisdictionId = searchParams.jurisdictionId || '';

  if (!jurisdictionId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <p className="text-gray-600">Jurisdiction ID is required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <ConfigurationDashboard jurisdictionId={jurisdictionId} />
    </div>
  );
}
