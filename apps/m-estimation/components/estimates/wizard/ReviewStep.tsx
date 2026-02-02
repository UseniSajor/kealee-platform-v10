'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Download,
  Mail,
  Link as LinkIcon,
  ArrowRight,
  DollarSign,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { calculateCostBreakdown } from '@/lib/calculations';

interface ReviewStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
  isSubmitting?: boolean;
}

export function ReviewStep({
  data,
  onNext,
  onBack,
  isSubmitting,
}: ReviewStepProps) {
  const { basicInfo, sections, settings } = data;

  const allItems = (sections || []).flatMap((s: any) =>
    s.items.map((item: any) => ({
      ...item,
      totalCost: item.quantity * item.unitCost,
    }))
  );

  const breakdown = calculateCostBreakdown(
    sections || [],
    settings || {}
  );

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log(`Exporting as ${format}...`);
    // Will trigger download
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Review & Export</h2>
        <p className="text-muted-foreground mt-1">
          Your estimate is ready! Review and choose export options
        </p>
      </div>

      {/* Success Banner */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-green-900">
              Estimate Ready!
            </h3>
            <p className="text-sm text-green-700 mt-1">
              Your {basicInfo?.projectName || 'estimate'} has been calculated
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estimate Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Project</p>
                <p className="font-medium">{basicInfo?.projectName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-medium">
                  {basicInfo?.clientName || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <Badge>{basicInfo?.projectType || 'Not specified'}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">
                  {basicInfo?.location || 'Not specified'}
                </p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Total Amount</p>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(breakdown.total)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cost Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Material:</span>
                  <span className="font-medium">
                    {formatCurrency(breakdown.materialCost)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Labor:</span>
                  <span className="font-medium">
                    {formatCurrency(breakdown.laborCost)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Equipment:</span>
                  <span className="font-medium">
                    {formatCurrency(breakdown.equipmentCost)}
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">
                      {formatCurrency(breakdown.subtotal)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Overhead ({settings?.overheadPercent}%):
                  </span>
                  <span className="font-medium">
                    {formatCurrency(breakdown.overhead)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Profit ({settings?.profitPercent}%):
                  </span>
                  <span className="font-medium">
                    {formatCurrency(breakdown.profit)}
                  </span>
                </div>
                {settings?.contingencyPercent > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Contingency ({settings.contingencyPercent}%):
                    </span>
                    <span className="font-medium">
                      {formatCurrency(breakdown.contingency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Tax ({settings?.taxPercent}%):
                  </span>
                  <span className="font-medium">
                    {formatCurrency(breakdown.tax)}
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold">
                    <span>TOTAL:</span>
                    <span className="text-primary">
                      {formatCurrency(breakdown.total)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Options */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleExport('pdf')}
              >
                <FileText className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">PDF Proposal</p>
                  <p className="text-xs text-muted-foreground">
                    Professional format for clients
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleExport('excel')}
              >
                <Download className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Excel Breakdown</p>
                  <p className="text-xs text-muted-foreground">
                    Detailed line items
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleExport('csv')}
              >
                <Download className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">CSV Export</p>
                  <p className="text-xs text-muted-foreground">
                    For import to other systems
                  </p>
                </div>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Mail className="mr-3 h-5 w-5" />
                Email to Client
              </Button>

              <Button variant="outline" className="w-full justify-start">
                <LinkIcon className="mr-3 h-5 w-5" />
                Share Link
              </Button>

              <Button variant="outline" className="w-full justify-start">
                <ArrowRight className="mr-3 h-5 w-5" />
                Sync to Bid Request
              </Button>

              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="mr-3 h-5 w-5" />
                Convert to Project Budget
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={() => onNext({})} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Saving...
            </>
          ) : (
            'Save & Finish'
          )}
        </Button>
      </div>
    </div>
  );
}
