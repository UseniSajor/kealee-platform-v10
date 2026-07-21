import {
  VideoInspection,
  VideoInspectionReport,
  Deficiency,
  VideoAIAnalysis,
  VideoInspectionChecklistItem,
  VideoReference,
} from '@permits/src/types/video-inspection';

/**
 * Post-Inspection Processing Service
 * Generates AI reports and processes inspection data
 */
export class PostProcessingService {
  /**
   * Generate AI inspection report
   */
  async generateAIReport(
    inspection: VideoInspection,
    aiAnalysis: VideoAIAnalysis,
  ): Promise<VideoInspectionReport> {
    try {
      // Collect all findings
      const deficiencies: Deficiency[] = [];
      const videoReferences: VideoReference[] = [];
      const recommendations: string[] = [];

      // Process AI findings
      if (aiAnalysis.defects && aiAnalysis.defects.length > 0) {
        for (const defect of aiAnalysis.defects) {
          deficiencies.push({
            id: `deficiency-${defect.id}`,
            category: 'Defects',
            description: defect.description,
            severity: defect.severity,
            videoTimestamp: defect.timestamp,
            aiDetected: true,
            inspectorConfirmed: false,
            recommendedAction: defect.recommendedAction,
          });

          videoReferences.push({
            timestamp: defect.timestamp,
            description: `Defect detected: ${defect.defectType}`,
            findings: [defect.description],
          });

          if (defect.recommendedAction) {
            recommendations.push(defect.recommendedAction);
          }
        }
      }

      // Process code compliance findings
      if (aiAnalysis.codeCompliance && aiAnalysis.codeCompliance.length > 0) {
        for (const compliance of aiAnalysis.codeCompliance) {
          if (!compliance.compliant) {
            deficiencies.push({
              id: `deficiency-compliance-${compliance.id}`,
              category: 'Code Compliance',
              description: `${compliance.codeReference}: ${compliance.requirement}`,
              severity: 'major',
              codeReference: compliance.codeReference,
              videoTimestamp: compliance.timestamp,
              aiDetected: true,
              inspectorConfirmed: false,
              recommendedAction: compliance.recommendation,
            });

            videoReferences.push({
              timestamp: compliance.timestamp,
              description: `Code compliance issue: ${compliance.codeReference}`,
              findings: compliance.findings,
            });

            if (compliance.recommendation) {
              recommendations.push(compliance.recommendation);
            }
          }
        }
      }

      // Process checklist items
      for (const item of inspection.checklist) {
        if (item.status === 'completed' && item.aiFindings) {
          for (const finding of item.aiFindings) {
            if (finding.severity === 'major' || finding.severity === 'critical') {
              deficiencies.push({
                id: `deficiency-checklist-${item.id}-${finding.id}`,
                category: item.category,
                description: finding.description,
                severity: finding.severity,
                videoTimestamp: finding.timestamp,
                screenshotUrl: item.screenshotUrl,
                aiDetected: true,
                inspectorConfirmed: false,
              });

              videoReferences.push({
                timestamp: finding.timestamp,
                description: `Checklist item: ${item.description}`,
                screenshotUrl: item.screenshotUrl,
                findings: [finding.description],
              });
            }
          }
        }
      }

      // Determine compliance status
      const complianceStatus = this.determineComplianceStatus(
        deficiencies,
        inspection.checklist,
      );

      // Generate summary
      const summary = this.generateSummary(inspection, deficiencies, aiAnalysis);

      // Create report
      const report: VideoInspectionReport = {
        id: `report-${inspection.id}-${Date.now()}`,
        inspectionId: inspection.id,
        generatedAt: new Date(),
        generatedBy: 'ai',
        summary,
        deficiencies,
        complianceStatus,
        recommendations: [...new Set(recommendations)], // Remove duplicates
        videoReferences,
        attachments: inspection.recording
          ? [
              {
                id: `attachment-${inspection.recording.id}`,
                type: 'video',
                url: inspection.recording.storageUrl,
                description: 'Full inspection recording',
              },
            ]
          : [],
      };

      return report;
    } catch (error) {
      console.error('Error generating AI report:', error);
      throw new Error('Failed to generate inspection report');
    }
  }

  /**
   * Process video for timestamped evidence
   */
  async processVideoEvidence(
    inspection: VideoInspection,
    timestamps: number[],
  ): Promise<VideoReference[]> {
    try {
      const references: VideoReference[] = [];

      for (const timestamp of timestamps) {
        // Find relevant findings at this timestamp
        const findings: string[] = [];

        // Check AI analysis
        if (inspection.aiAnalysis) {
          const defects = inspection.aiAnalysis.defects?.filter(
            (d) => Math.abs(d.timestamp - timestamp) < 5, // Within 5 seconds
          );
          if (defects) {
            findings.push(...defects.map((d) => d.description));
          }

          const compliance = inspection.aiAnalysis.codeCompliance?.filter(
            (c) => Math.abs(c.timestamp - timestamp) < 5,
          );
          if (compliance) {
            findings.push(...compliance.map((c) => c.requirement));
          }
        }

        // Check checklist items
        const checklistItems = inspection.checklist.filter(
          (item) => item.timestamp && Math.abs(item.timestamp - timestamp) < 5,
        );
        if (checklistItems.length > 0) {
          findings.push(...checklistItems.map((item) => item.description));
        }

        references.push({
          timestamp,
          description: `Evidence at ${this.formatTimestamp(timestamp)}`,
          findings,
        });
      }

      return references;
    } catch (error) {
      console.error('Error processing video evidence:', error);
      return [];
    }
  }

  /**
   * Catalog deficiencies with video references
   */
  async catalogDeficiencies(
    inspection: VideoInspection,
    report: VideoInspectionReport,
  ): Promise<Deficiency[]> {
    try {
      // Enhance deficiencies with video references
      const enhancedDeficiencies = report.deficiencies.map((deficiency) => {
        // Find corresponding video reference
        const videoRef = report.videoReferences.find(
          (ref) => Math.abs(ref.timestamp - deficiency.videoTimestamp) < 2,
        );

        return {
          ...deficiency,
          screenshotUrl: videoRef?.screenshotUrl || deficiency.screenshotUrl,
        };
      });

      return enhancedDeficiencies;
    } catch (error) {
      console.error('Error cataloging deficiencies:', error);
      return report.deficiencies;
    }
  }

  /**
   * Generate quality assurance review data
   */
  async generateQAReviewData(
    inspection: VideoInspection,
    report: VideoInspectionReport,
  ): Promise<{
    needsReview: boolean;
    reviewItems: Array<{
      type: string;
      description: string;
      severity: string;
      timestamp: number;
    }>;
  }> {
    try {
      const reviewItems: Array<{
        type: string;
        description: string;
        severity: string;
        timestamp: number;
      }> = [];

      // Flag critical deficiencies for review
      const criticalDeficiencies = report.deficiencies.filter(
        (d) => d.severity === 'critical',
      );
      for (const deficiency of criticalDeficiencies) {
        reviewItems.push({
          type: 'deficiency',
          description: deficiency.description,
          severity: deficiency.severity,
          timestamp: deficiency.videoTimestamp,
        });
      }

      // Flag high-confidence AI findings for review
      if (inspection.aiAnalysis) {
        const highConfidenceFindings = [
          ...(inspection.aiAnalysis.defects?.filter((d) => d.confidence > 0.8) || []),
          ...(inspection.aiAnalysis.codeCompliance?.filter(
            (c) => !c.compliant && c.confidence > 0.8,
          ) || []),
        ];

        for (const finding of highConfidenceFindings) {
          reviewItems.push({
            type: 'ai_finding',
            description: 'description' in finding ? finding.description : finding.requirement,
            severity: 'severity' in finding ? finding.severity : 'major',
            timestamp: finding.timestamp,
          });
        }
      }

      return {
        needsReview: reviewItems.length > 0,
        reviewItems,
      };
    } catch (error) {
      console.error('Error generating QA review data:', error);
      return {needsReview: false, reviewItems: []};
    }
  }

  // Helper methods

  private determineComplianceStatus(
    deficiencies: Deficiency[],
    checklist: VideoInspectionChecklistItem[],
  ): 'compliant' | 'non-compliant' | 'partial' | 'pending' {
    const criticalDeficiencies = deficiencies.filter((d) => d.severity === 'critical');
    const majorDeficiencies = deficiencies.filter((d) => d.severity === 'major');
    const completedItems = checklist.filter((item) => item.status === 'completed');
    const requiredItems = checklist.filter((item) => item.required);

    if (criticalDeficiencies.length > 0) {
      return 'non-compliant';
    }

    if (majorDeficiencies.length > 0) {
      return 'partial';
    }

    if (completedItems.length < requiredItems.length) {
      return 'pending';
    }

    return 'compliant';
  }

  private generateSummary(
    inspection: VideoInspection,
    deficiencies: Deficiency[],
    aiAnalysis: VideoAIAnalysis,
  ): string {
    const duration = inspection.endedAt && inspection.startedAt
      ? Math.round((inspection.endedAt.getTime() - inspection.startedAt.getTime()) / 1000 / 60)
      : 0;

    const summaryParts: string[] = [];

    summaryParts.push(
      `Video inspection completed on ${inspection.scheduledAt.toLocaleDateString()}.`,
    );
    summaryParts.push(`Duration: ${duration} minutes.`);

    if (aiAnalysis.objectDetections && aiAnalysis.objectDetections.length > 0) {
      summaryParts.push(
        `Detected ${aiAnalysis.objectDetections.length} construction elements.`,
      );
    }

    if (deficiencies.length > 0) {
      summaryParts.push(
        `Found ${deficiencies.length} deficiency${deficiencies.length > 1 ? 'ies' : ''}:`,
      );
      const critical = deficiencies.filter((d) => d.severity === 'critical').length;
      const major = deficiencies.filter((d) => d.severity === 'major').length;
      const minor = deficiencies.filter((d) => d.severity === 'minor').length;

      if (critical > 0) summaryParts.push(`${critical} critical`);
      if (major > 0) summaryParts.push(`${major} major`);
      if (minor > 0) summaryParts.push(`${minor} minor`);
    } else {
      summaryParts.push('No deficiencies detected.');
    }

    return summaryParts.join(' ');
  }

  private formatTimestamp(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

// Singleton instance
export const postProcessingService = new PostProcessingService();
