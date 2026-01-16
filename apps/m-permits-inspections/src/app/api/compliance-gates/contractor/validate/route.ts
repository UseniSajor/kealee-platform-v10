import {NextRequest, NextResponse} from 'next/server';
import {licenseValidationService} from '@/services/compliance-gates/license-validation';
import {insuranceVerificationService} from '@/services/compliance-gates/insurance-verification';

/**
 * POST /api/compliance-gates/contractor/validate
 * Validate contractor license and insurance during permit application
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {contractorId, permitType, projectValuation} = body;

    if (!contractorId || !permitType) {
      return NextResponse.json(
        {error: 'contractorId and permitType required'},
        {status: 400}
      );
    }

    // Validate license
    const licenseValidation = await licenseValidationService.validateContractorLicense(
      contractorId,
      permitType
    );

    // Validate insurance
    const insuranceValidation = await insuranceVerificationService.validateContractorInsurance(
      contractorId,
      permitType,
      projectValuation
    );

    const canProceed = licenseValidation.valid && insuranceValidation.valid;

    return NextResponse.json({
      canProceed,
      license: licenseValidation,
      insurance: insuranceValidation,
      blockingReasons: [
        ...(licenseValidation.valid ? [] : [licenseValidation.message]),
        ...(insuranceValidation.valid ? [] : insuranceValidation.requiredActions),
      ],
      requiredActions: [
        ...(licenseValidation.requiredActions || []),
        ...(insuranceValidation.requiredActions || []),
      ],
    });
  } catch (error: any) {
    console.error('Contractor validation error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}
