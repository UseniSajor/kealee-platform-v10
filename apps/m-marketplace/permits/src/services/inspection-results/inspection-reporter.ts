/**
 * Inspection Report Generator Service
 * Generate inspection reports
 */

import {createClient} from '@permits/src/lib/supabase/client';
import {resultsManagerService, InspectionResult} from './results-manager';
import {correctionTrackerService} from './correction-tracker';

export interface InspectionReport {
  inspectionId: string;
  inspectionNumber: string;
  permitId: string;
  permitNumber: string;
  inspectionType: string;
  location: string;
  inspectorName: string;
  scheduledDate: Date;
  completedDate: Date;
  result: 'PASS' | 'PASS_WITH_COMMENTS' | 'FAIL' | 'PARTIAL_PASS';
  summary: string;
  checklistItems: Array<{
    category: string;
    item: string;
    status: string;
    notes?: string;
  }>;
  photos: Array<{
    fileUrl: string;
    caption?: string;
    location?: string;
  }>;
  corrections: Array<{
    description: string;
    location?: string;
    category: string;
    severity: string;
    mustFixBefore?: string;
  }>;
  recommendations?: string[];
}

export class InspectionReporterService {
  /**
   * Generate inspection report
   */
  async generateInspectionReport(inspectionId: string): Promise<InspectionReport> {
    const supabase = createClient();

    // Get inspection result
    const result = await resultsManagerService.getInspectionResult(inspectionId);

    // Get permit details
    const {data: permit} = await supabase
      .from('Permit')
      .select('permitNumber, projectAddress')
      .eq('id', result.permitId)
      .single();

    // Get inspector details
    const {data: inspector} = await supabase
      .from('User')
      .select('name')
      .eq('id', result.completedBy)
      .single();

    // Get inspection details for scheduled date
    const {data: inspection} = await supabase
      .from('Inspection')
      .select('scheduledDate')
      .eq('id', inspectionId)
      .single();

    // Generate summary
    const summary = this.generateSummary(result);

    // Generate recommendations
    const recommendations = this.generateRecommendations(result);

    return {
      inspectionId: result.inspectionId,
      inspectionNumber: result.inspectionNumber,
      permitId: result.permitId,
      permitNumber: permit?.permitNumber || 'N/A',
      inspectionType: result.type,
      location: permit?.projectAddress || 'N/A',
      inspectorName: inspector?.name || 'Unknown',
      scheduledDate: inspection?.scheduledDate ? new Date(inspection.scheduledDate) : result.completedAt,
      completedDate: result.completedAt,
      result: result.result,
      summary,
      checklistItems: result.checklistItems,
      photos: result.photos.map(p => ({
        fileUrl: p.fileUrl,
        caption: p.caption,
        location: p.location,
      })),
      corrections: result.corrections.map(c => ({
        description: c.description,
        location: c.location,
        category: c.category,
        severity: c.severity,
        mustFixBefore: c.mustFixBefore,
      })),
      recommendations,
    };
  }

  /**
   * Generate summary
   */
  private generateSummary(result: InspectionResult): string {
    const passed = result.checklistItems.filter(i => i.status === 'PASS').length;
    const failed = result.checklistItems.filter(i => i.status === 'FAIL').length;
    const total = result.checklistItems.length;

    let summary = `Inspection ${result.result}. `;
    summary += `${passed} of ${total} checklist items passed. `;

    if (result.corrections.length > 0) {
      summary += `${result.corrections.length} correction(s) required. `;
      const critical = result.corrections.filter(c => c.severity === 'CRITICAL').length;
      if (critical > 0) {
        summary += `${critical} critical correction(s). `;
      }
    } else {
      summary += 'No corrections required. ';
    }

    if (result.result === 'FAIL') {
      summary += 'Reinspection required before work can proceed.';
    } else if (result.result === 'PASS') {
      summary += 'Work approved to proceed.';
    }

    return summary.trim();
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(result: InspectionResult): string[] {
    const recommendations: string[] = [];

    if (result.result === 'FAIL') {
      recommendations.push('Address all corrections and request reinspection.');
    }

    if (result.corrections.length > 0) {
      const critical = result.corrections.filter(c => c.severity === 'CRITICAL').length;
      if (critical > 0) {
        recommendations.push(
          `Priority: Address ${critical} critical correction(s) immediately.`
        );
      }

      const blocking = result.corrections.filter(c => c.mustFixBefore).length;
      if (blocking > 0) {
        recommendations.push(
          `${blocking} correction(s) must be resolved before next inspection.`
        );
      }
    }

    const failedItems = result.checklistItems.filter(i => i.status === 'FAIL');
    if (failedItems.length > 0) {
      recommendations.push(
        `Review and correct ${failedItems.length} failed checklist item(s).`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('No additional recommendations. Work approved to proceed.');
    }

    return recommendations;
  }

  /**
   * Export report as PDF
   */
  async exportReportAsPDF(report: InspectionReport): Promise<string> {
    // In production, would use PDF generation library
    // For now, return JSON representation
    return JSON.stringify(report, null, 2);
  }

  /**
   * Export report as JSON
   */
  async exportReportAsJSON(report: InspectionReport): Promise<string> {
    return JSON.stringify(report, null, 2);
  }
}

// Import createClient
import {createClient} from '@permits/src/lib/supabase/client';

// Singleton instance
export const inspectionReporterService = new InspectionReporterService();
