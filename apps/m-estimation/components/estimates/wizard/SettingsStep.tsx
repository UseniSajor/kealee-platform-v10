'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Info } from 'lucide-react';

interface SettingsStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
  isSubmitting?: boolean;
}

export function SettingsStep({
  data,
  onNext,
  onBack,
}: SettingsStepProps) {
  const [settings, setSettings] = useState(
    data.settings || {
      overheadPercent: 15,
      profitPercent: 10,
      contingencyPercent: 5,
      taxPercent: 7.5,
      paymentTerms: 'deposit',
      validityDays: 30,
      notes: '',
      exclusions: '',
    }
  );

  const handleSubmit = () => {
    onNext({ settings });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings & Markup</h2>
        <p className="text-muted-foreground mt-1">
          Configure overhead, profit, and other settings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Overhead */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label htmlFor="overhead">Overhead Percentage</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  id="overhead"
                  type="number"
                  value={settings.overheadPercent}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      overheadPercent: Number(e.target.value),
                    })
                  }
                  className="flex-1"
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Typical range: 10-20%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Profit */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label htmlFor="profit">Profit Margin</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  id="profit"
                  type="number"
                  value={settings.profitPercent}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      profitPercent: Number(e.target.value),
                    })
                  }
                  className="flex-1"
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Typical range: 8-15%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contingency */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label htmlFor="contingency">Contingency</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  id="contingency"
                  type="number"
                  value={settings.contingencyPercent}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contingencyPercent: Number(e.target.value),
                    })
                  }
                  className="flex-1"
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Recommended for residential: 5%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tax */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label htmlFor="tax">Tax Rate</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  id="tax"
                  type="number"
                  value={settings.taxPercent}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      taxPercent: Number(e.target.value),
                    })
                  }
                  className="flex-1"
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Auto-filled from location
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Terms */}
      <div>
        <Label htmlFor="paymentTerms">Payment Terms</Label>
        <select
          id="paymentTerms"
          value={settings.paymentTerms}
          onChange={(e) =>
            setSettings({ ...settings, paymentTerms: e.target.value })
          }
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
        >
          <option value="deposit">30% Deposit, 40% Progress, 30% Final</option>
          <option value="fifty-fifty">50% Deposit, 50% Final</option>
          <option value="milestone">Milestone-based</option>
          <option value="custom">Custom (specify in notes)</option>
        </select>
      </div>

      {/* Validity Period */}
      <div>
        <Label htmlFor="validity">Estimate Valid For (days)</Label>
        <Input
          id="validity"
          type="number"
          value={settings.validityDays}
          onChange={(e) =>
            setSettings({ ...settings, validityDays: Number(e.target.value) })
          }
          className="mt-2 max-w-xs"
        />
      </div>

      {/* Notes & Exclusions */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="notes">Notes & Assumptions</Label>
          <Textarea
            id="notes"
            value={settings.notes}
            onChange={(e) =>
              setSettings({ ...settings, notes: e.target.value })
            }
            placeholder="Any additional notes or assumptions..."
            rows={4}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="exclusions">Exclusions</Label>
          <Textarea
            id="exclusions"
            value={settings.exclusions}
            onChange={(e) =>
              setSettings({ ...settings, exclusions: e.target.value })
            }
            placeholder="Items not included in this estimate..."
            rows={4}
            className="mt-2"
          />
        </div>
      </div>

      {/* Info Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 flex gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900">
            These settings will be applied to your estimate in the final step.
            You'll see the complete cost breakdown including overhead, profit, and
            tax.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleSubmit}>Next: Review & Export</Button>
      </div>
    </div>
  );
}
