import {NextRequest, NextResponse} from 'next/server';
import {complianceReportGeneratorService} from '@/services/code-compliance/compliance-report-generator';
import {codeBookIntegrationService} from '@/services/code-compliance/code-book-integration';
import {dimensionCheckerService} from '@/services/code-compliance/dimension-checker';
import {accessibilityCheckerService} from '@/services/code-compliance/accessibility-checker';
import {energyCodeCheckerService} from '@/services/code-compliance/energy-code-checker';
import {fireLifeSafetyCheckerService} from '@/services/code-compliance/fire-life-safety-checker';

/**
 * POST /api/permits/:permitId/compliance/check
 * Run comprehensive compliance check for permit
 */
export async function POST(
  request: NextRequest,
  {params}: {params: {permitId: string}}
) {
  try {
    const {permitId} = params;
    const body = await request.json();

    const {
      codeBookChecks = [],
      dimensions = [],
      accessibilityChecks = [],
      energyData,
      fireLifeSafetyChecks = [],
    } = body;

    // Run code book checks
    const codeBookResults = [];
    for (const check of codeBookChecks) {
      try {
        const result = await codeBookIntegrationService.checkCompliance(
          check.codeBook,
          check.sectionNumber,
          check.parameter,
          check.actualValue
        );
        codeBookResults.push(result);
      } catch (error) {
        console.error('Code book check error:', error);
      }
    }

    // Run dimension checks
    const dimensionResults = [];
    for (const dimension of dimensions) {
      try {
        const result = await dimensionCheckerService.checkDimensionCompliance(
          dimension,
          dimension.codeBook || 'IBC',
          dimension.sectionNumber || '1006.2'
        );
        dimensionResults.push(result);
      } catch (error) {
        console.error('Dimension check error:', error);
      }
    }

    // Run accessibility checks
    const accessibilityResults = [];
    for (const check of accessibilityChecks) {
      try {
        const result = await accessibilityCheckerService.checkAccessibilityCompliance(
          check.requirementId,
          check.measurements
        );
        accessibilityResults.push(result);
      } catch (error) {
        console.error('Accessibility check error:', error);
      }
    }

    // Run energy code checks
    const energyResults = [];
    if (energyData) {
      try {
        const results = await energyCodeCheckerService.checkEnergyCodeCompliance(
          energyData.climateZone || '4',
          energyData.buildingType || 'Residential',
          energyData.envelopeData || {}
        );
        energyResults.push(...results);
      } catch (error) {
        console.error('Energy code check error:', error);
      }
    }

    // Run fire/life safety checks
    const fireSafetyResults = [];
    for (const check of fireLifeSafetyChecks) {
      try {
        const result = await fireLifeSafetyCheckerService.checkFireLifeSafetyCompliance(
          check.requirementId,
          check.measurements
        );
        fireSafetyResults.push(result);
      } catch (error) {
        console.error('Fire/life safety check error:', error);
      }
    }

    // Generate compliance report
    const report = await complianceReportGeneratorService.generateComplianceReport(
      permitId,
      codeBookResults,
      dimensionResults,
      accessibilityResults,
      energyResults,
      fireSafetyResults
    );

    return NextResponse.json(report);
  } catch (error: any) {
    console.error('Compliance check error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}
