'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Save,
  FileText,
  Download,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import {
  formatCurrency,
  formatCurrencyDetailed,
  formatDate,
  generateId,
} from '@/lib/utils';
import {
  calculateCostBreakdown,
  type Section,
  type LineItem,
  type EstimateSettings,
  type CostBreakdown,
} from '@/lib/calculations';
import { exportToPDF, exportToExcel, exportToCSV, type Estimate } from '@/lib/export';

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------

type EstimateStatus = 'draft' | 'review' | 'final' | 'sent';

interface EstimateData {
  id: string;
  name: string;
  projectType: string;
  clientName: string;
  location: string;
  status: EstimateStatus;
  createdAt: string;
  updatedAt: string;
  sections: Section[];
  settings: EstimateSettings;
  notes: string;
  exclusions: string;
}

const STATUS_CONFIG: Record<
  EstimateStatus,
  { label: string; variant: 'outline' | 'warning' | 'success' | 'secondary' | 'info' }
> = {
  draft: { label: 'Draft', variant: 'outline' },
  review: { label: 'In Review', variant: 'warning' },
  final: { label: 'Final', variant: 'success' },
  sent: { label: 'Sent', variant: 'info' },
};

const STATUS_TRANSITIONS: Record<EstimateStatus, EstimateStatus[]> = {
  draft: ['review'],
  review: ['draft', 'final'],
  final: ['review', 'sent'],
  sent: ['final'],
};


// -------------------------------------------------------------------
// Sub-components
// -------------------------------------------------------------------

function SummaryTab({ estimate }: { estimate: EstimateData }) {
  const breakdown = calculateCostBreakdown(estimate.sections, estimate.settings);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Project Name</p>
              <p className="font-medium">{estimate.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Client</p>
              <p className="font-medium">{estimate.clientName || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Project Type</p>
              <Badge>{estimate.projectType || 'Not specified'}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-medium">{estimate.location || 'Not specified'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estimate Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={STATUS_CONFIG[estimate.status]?.variant || 'outline'}>
                {STATUS_CONFIG[estimate.status]?.label || estimate.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">
                {estimate.createdAt ? formatDate(estimate.createdAt) : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-medium">
                {estimate.updatedAt ? formatDate(estimate.updatedAt) : 'N/A'}
              </p>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-1">Grand Total</p>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(breakdown.total)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sections Overview</CardTitle>
          <CardDescription>
            {estimate.sections.length} section
            {estimate.sections.length !== 1 ? 's' : ''},{' '}
            {estimate.sections.reduce((s, sec) => s + sec.lineItems.length, 0)} line items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {estimate.sections.map((section) => {
              const sectionTotal = section.lineItems.reduce(
                (sum, item) => sum + item.quantity * item.unitCost,
                0
              );
              return (
                <div
                  key={section.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {section.division} - {section.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {section.lineItems.length} item
                      {section.lineItems.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <p className="font-medium">{formatCurrency(sectionTotal)}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LineItemsTab({
  sections,
  onSectionsChange,
}: {
  sections: Section[];
  onSectionsChange: (sections: Section[]) => void;
}) {
  const [editingCell, setEditingCell] = useState<{
    sectionId: string;
    itemId: string;
    field: 'quantity' | 'unitCost';
  } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [addingSectionId, setAddingSectionId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    description: '',
    quantity: 0,
    unit: 'SF',
    unitCost: 0,
    type: 'material' as LineItem['type'],
  });

  const startEditing = (
    sectionId: string,
    itemId: string,
    field: 'quantity' | 'unitCost',
    currentValue: number
  ) => {
    setEditingCell({ sectionId, itemId, field });
    setEditValue(String(currentValue));
  };

  const commitEdit = () => {
    if (!editingCell) return;
    const numValue = parseFloat(editValue);
    if (isNaN(numValue) || numValue < 0) {
      setEditingCell(null);
      return;
    }

    const updated = sections.map((section) => {
      if (section.id !== editingCell.sectionId) return section;
      return {
        ...section,
        lineItems: section.lineItems.map((item) => {
          if (item.id !== editingCell.itemId) return item;
          const updatedItem = { ...item, [editingCell.field]: numValue };
          updatedItem.totalCost = updatedItem.quantity * updatedItem.unitCost;
          return updatedItem;
        }),
      };
    });

    onSectionsChange(updated);
    setEditingCell(null);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitEdit();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const addLineItem = (sectionId: string) => {
    if (!newItem.description || newItem.quantity <= 0 || newItem.unitCost <= 0) return;

    const updated = sections.map((section) => {
      if (section.id !== sectionId) return section;
      const item: LineItem = {
        id: generateId(),
        description: newItem.description,
        quantity: newItem.quantity,
        unit: newItem.unit,
        unitCost: newItem.unitCost,
        totalCost: newItem.quantity * newItem.unitCost,
        type: newItem.type,
      };
      return {
        ...section,
        lineItems: [...section.lineItems, item],
      };
    });

    onSectionsChange(updated);
    setNewItem({ description: '', quantity: 0, unit: 'SF', unitCost: 0, type: 'material' });
    setAddingSectionId(null);
  };

  const removeLineItem = (sectionId: string, itemId: string) => {
    const updated = sections.map((section) => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        lineItems: section.lineItems.filter((item) => item.id !== itemId),
      };
    });
    onSectionsChange(updated);
  };

  return (
    <div className="space-y-6">
      {sections.map((section) => {
        const sectionTotal = section.lineItems.reduce(
          (sum, item) => sum + item.quantity * item.unitCost,
          0
        );

        return (
          <Card key={section.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {section.division} - {section.name}
                </CardTitle>
                <Badge variant="secondary">{formatCurrency(sectionTotal)}</Badge>
              </div>
              <CardDescription>
                {section.lineItems.length} line item
                {section.lineItems.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Table header */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-muted/50 rounded-md text-xs font-medium text-muted-foreground mb-2">
                <div className="col-span-4">Description</div>
                <div className="col-span-1 text-right">Qty</div>
                <div className="col-span-1">Unit</div>
                <div className="col-span-2 text-right">Unit Cost</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-1">Type</div>
                <div className="col-span-1"></div>
              </div>

              {/* Line items */}
              <div className="space-y-1">
                {section.lineItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-2 px-3 py-2 items-center hover:bg-accent/30 rounded-md transition-colors text-sm"
                  >
                    <div className="col-span-4 truncate font-medium">
                      {item.description}
                    </div>
                    <div className="col-span-1 text-right">
                      {editingCell?.itemId === item.id &&
                      editingCell?.field === 'quantity' ? (
                        <Input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={handleEditKeyDown}
                          className="h-7 text-xs text-right w-full"
                          autoFocus
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:text-primary hover:underline"
                          onClick={() =>
                            startEditing(section.id, item.id, 'quantity', item.quantity)
                          }
                        >
                          {item.quantity}
                        </span>
                      )}
                    </div>
                    <div className="col-span-1 text-muted-foreground text-xs">
                      {item.unit}
                    </div>
                    <div className="col-span-2 text-right">
                      {editingCell?.itemId === item.id &&
                      editingCell?.field === 'unitCost' ? (
                        <Input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={handleEditKeyDown}
                          className="h-7 text-xs text-right w-full"
                          autoFocus
                          step="0.01"
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:text-primary hover:underline"
                          onClick={() =>
                            startEditing(section.id, item.id, 'unitCost', item.unitCost)
                          }
                        >
                          {formatCurrencyDetailed(item.unitCost)}
                        </span>
                      )}
                    </div>
                    <div className="col-span-2 text-right font-medium">
                      {formatCurrencyDetailed(item.quantity * item.unitCost)}
                    </div>
                    <div className="col-span-1">
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {item.type}
                      </Badge>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => removeLineItem(section.id, item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add line item form */}
              {addingSectionId === section.id ? (
                <div className="mt-3 pt-3 border-t space-y-3">
                  <div className="grid grid-cols-12 gap-2">
                    <Input
                      placeholder="Description"
                      value={newItem.description}
                      onChange={(e) =>
                        setNewItem({ ...newItem, description: e.target.value })
                      }
                      className="col-span-4 h-8 text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={newItem.quantity || ''}
                      onChange={(e) =>
                        setNewItem({ ...newItem, quantity: Number(e.target.value) })
                      }
                      className="col-span-2 h-8 text-sm"
                    />
                    <Input
                      placeholder="Unit"
                      value={newItem.unit}
                      onChange={(e) =>
                        setNewItem({ ...newItem, unit: e.target.value })
                      }
                      className="col-span-1 h-8 text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="$/Unit"
                      value={newItem.unitCost || ''}
                      onChange={(e) =>
                        setNewItem({ ...newItem, unitCost: Number(e.target.value) })
                      }
                      className="col-span-2 h-8 text-sm"
                      step="0.01"
                    />
                    <select
                      value={newItem.type}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          type: e.target.value as LineItem['type'],
                        })
                      }
                      className="col-span-2 h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="material">Material</option>
                      <option value="labor">Labor</option>
                      <option value="equipment">Equipment</option>
                      <option value="other">Other</option>
                    </select>
                    <Button
                      size="icon"
                      className="col-span-1 h-8 w-8"
                      onClick={() => addLineItem(section.id)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAddingSectionId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 text-muted-foreground"
                  onClick={() => setAddingSectionId(section.id)}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add Line Item
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function SettingsTab({
  settings,
  onSettingsChange,
}: {
  settings: EstimateSettings;
  onSettingsChange: (settings: EstimateSettings) => void;
}) {
  const update = (field: keyof EstimateSettings, value: number) => {
    onSettingsChange({ ...settings, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label htmlFor="edit-overhead">Overhead Percentage</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  id="edit-overhead"
                  type="number"
                  value={settings.overheadPercent ?? 0}
                  onChange={(e) => update('overheadPercent', Number(e.target.value))}
                  className="flex-1"
                  step="0.5"
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Typical range: 10-20%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label htmlFor="edit-profit">Profit Margin</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  id="edit-profit"
                  type="number"
                  value={settings.profitPercent ?? 0}
                  onChange={(e) => update('profitPercent', Number(e.target.value))}
                  className="flex-1"
                  step="0.5"
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Typical range: 8-15%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label htmlFor="edit-contingency">Contingency</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  id="edit-contingency"
                  type="number"
                  value={settings.contingencyPercent ?? 0}
                  onChange={(e) => update('contingencyPercent', Number(e.target.value))}
                  className="flex-1"
                  step="0.5"
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Recommended for residential: 5%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label htmlFor="edit-tax">Tax Rate</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  id="edit-tax"
                  type="number"
                  value={settings.taxPercent ?? 0}
                  onChange={(e) => update('taxPercent', Number(e.target.value))}
                  className="flex-1"
                  step="0.25"
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Based on project location
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function NotesTab({
  notes,
  exclusions,
  onNotesChange,
  onExclusionsChange,
}: {
  notes: string;
  exclusions: string;
  onNotesChange: (notes: string) => void;
  onExclusionsChange: (exclusions: string) => void;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notes & Assumptions</CardTitle>
          <CardDescription>
            Document any important assumptions or notes for this estimate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Enter notes and assumptions for this estimate..."
            rows={6}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Exclusions</CardTitle>
          <CardDescription>
            Items specifically not included in this estimate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={exclusions}
            onChange={(e) => onExclusionsChange(e.target.value)}
            placeholder="List items not included in this estimate..."
            rows={6}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function CostSummarySidebar({ breakdown, settings }: { breakdown: CostBreakdown; settings: EstimateSettings }) {
  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="text-lg">Cost Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Material:</span>
            <span className="font-medium">{formatCurrency(breakdown.materialCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Labor:</span>
            <span className="font-medium">{formatCurrency(breakdown.laborCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Equipment:</span>
            <span className="font-medium">{formatCurrency(breakdown.equipmentCost)}</span>
          </div>
          {breakdown.otherCost > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Other:</span>
              <span className="font-medium">{formatCurrency(breakdown.otherCost)}</span>
            </div>
          )}

          <div className="border-t pt-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium">{formatCurrency(breakdown.subtotal)}</span>
            </div>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Overhead ({settings.overheadPercent || 0}%):
            </span>
            <span className="font-medium">{formatCurrency(breakdown.overhead)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Profit ({settings.profitPercent || 0}%):
            </span>
            <span className="font-medium">{formatCurrency(breakdown.profit)}</span>
          </div>
          {(settings.contingencyPercent ?? 0) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Contingency ({settings.contingencyPercent}%):
              </span>
              <span className="font-medium">{formatCurrency(breakdown.contingency)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Tax ({settings.taxPercent || 0}%):
            </span>
            <span className="font-medium">{formatCurrency(breakdown.tax)}</span>
          </div>

          <div className="border-t pt-2">
            <div className="flex justify-between font-bold text-base">
              <span>Grand Total:</span>
              <span className="text-primary">{formatCurrency(breakdown.total)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// -------------------------------------------------------------------
// Main Page Component
// -------------------------------------------------------------------

export default function EstimateEditPage() {
  const params = useParams();
  const estimateId = params.id as string;

  const [estimate, setEstimate] = useState<EstimateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch estimate data
  useEffect(() => {
    async function fetchEstimate() {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.getEstimate(estimateId);
        if (response.success && response.data) {
          // Normalize API response to our EstimateData shape
          const data = response.data as any;
          setEstimate({
            id: data.id || estimateId,
            name: data.name || data.projectName || '',
            projectType: data.projectType || '',
            clientName: data.clientName || data.client || '',
            location: data.location || '',
            status: data.status || 'draft',
            createdAt: data.createdAt || '',
            updatedAt: data.updatedAt || '',
            sections: data.sections || [],
            settings: data.settings || {
              overheadPercent: 15,
              profitPercent: 10,
              contingencyPercent: 5,
              taxPercent: 7.5,
            },
            notes: data.notes || '',
            exclusions: data.exclusions || '',
          });
        } else {
          setError(response.error || 'Failed to load estimate');
        }
      } catch {
        setError('Failed to load estimate. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchEstimate();
  }, [estimateId]);

  // Memoize breakdown calculation
  const breakdown = useMemo(() => {
    if (!estimate) {
      return {
        materialCost: 0,
        laborCost: 0,
        equipmentCost: 0,
        otherCost: 0,
        subtotal: 0,
        overhead: 0,
        profit: 0,
        contingency: 0,
        subtotalWithMarkup: 0,
        tax: 0,
        total: 0,
      };
    }
    return calculateCostBreakdown(estimate.sections, estimate.settings);
  }, [estimate]);

  // Update handlers
  const updateSections = useCallback((sections: Section[]) => {
    setEstimate((prev) => (prev ? { ...prev, sections } : prev));
    setHasChanges(true);
  }, []);

  const updateSettings = useCallback((settings: EstimateSettings) => {
    setEstimate((prev) => (prev ? { ...prev, settings } : prev));
    setHasChanges(true);
  }, []);

  const updateNotes = useCallback((notes: string) => {
    setEstimate((prev) => (prev ? { ...prev, notes } : prev));
    setHasChanges(true);
  }, []);

  const updateExclusions = useCallback((exclusions: string) => {
    setEstimate((prev) => (prev ? { ...prev, exclusions } : prev));
    setHasChanges(true);
  }, []);

  const updateStatus = useCallback((status: EstimateStatus) => {
    setEstimate((prev) => (prev ? { ...prev, status } : prev));
    setHasChanges(true);
  }, []);

  // Save handler
  const handleSave = async () => {
    if (!estimate) return;
    setSaving(true);
    setError(null);

    try {
      const response = await apiClient.updateEstimate(estimate.id, {
        name: estimate.name,
        projectType: estimate.projectType,
        clientName: estimate.clientName,
        location: estimate.location,
        status: estimate.status,
        sections: estimate.sections,
        settings: estimate.settings,
        notes: estimate.notes,
        exclusions: estimate.exclusions,
      });

      if (response.success) {
        setHasChanges(false);
      } else {
        setError(response.error || 'Failed to save estimate');
      }
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Export handlers
  const buildExportEstimate = useCallback((): Estimate | null => {
    if (!estimate) return null;
    return {
      id: estimate.id,
      name: estimate.name,
      projectType: estimate.projectType,
      clientName: estimate.clientName,
      location: estimate.location,
      status: estimate.status,
      createdAt: estimate.createdAt,
      updatedAt: estimate.updatedAt,
      sections: estimate.sections,
      settings: estimate.settings,
      notes: estimate.notes,
      exclusions: estimate.exclusions,
    };
  }, [estimate]);

  const handleExportPDF = () => {
    const exportData = buildExportEstimate();
    if (exportData) exportToPDF(exportData);
  };

  const handleExportExcel = () => {
    const exportData = buildExportEstimate();
    if (exportData) exportToExcel(exportData);
  };

  const handleExportCSV = () => {
    const exportData = buildExportEstimate();
    if (exportData) exportToCSV(exportData);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading estimate...</p>
        </div>
      </div>
    );
  }

  // Error state (when no data at all)
  if (!estimate) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-medium">Estimate not found</h2>
          <p className="text-muted-foreground">
            The estimate you are looking for could not be loaded.
          </p>
          <Button asChild>
            <Link href="/estimates">Back to Estimates</Link>
          </Button>
        </div>
      </div>
    );
  }

  const availableTransitions = STATUS_TRANSITIONS[estimate.status] || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/estimates">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{estimate.name}</h1>
              <Badge variant={STATUS_CONFIG[estimate.status]?.variant || 'outline'}>
                {STATUS_CONFIG[estimate.status]?.label || estimate.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {estimate.clientName && `${estimate.clientName} · `}
              {estimate.projectType && `${estimate.projectType} · `}
              Last updated {estimate.updatedAt ? formatDate(estimate.updatedAt) : 'N/A'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Change */}
          {availableTransitions.length > 0 && (
            <Select
              value={estimate.status}
              onValueChange={(value) => updateStatus(value as EstimateStatus)}
            >
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Change status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={estimate.status}>
                  {STATUS_CONFIG[estimate.status]?.label}
                </SelectItem>
                {availableTransitions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_CONFIG[status]?.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Export buttons */}
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <FileText className="mr-1 h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="mr-1 h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-1 h-4 w-4" />
            CSV
          </Button>

          {/* Save */}
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {hasChanges ? 'Save Changes' : 'Saved'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Tabbed Editor */}
        <div>
          <Tabs defaultValue="summary">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="line-items">Line Items</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="mt-6">
              <SummaryTab estimate={estimate} />
            </TabsContent>

            <TabsContent value="line-items" className="mt-6">
              <LineItemsTab
                sections={estimate.sections}
                onSectionsChange={updateSections}
              />
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <SettingsTab
                settings={estimate.settings}
                onSettingsChange={updateSettings}
              />
            </TabsContent>

            <TabsContent value="notes" className="mt-6">
              <NotesTab
                notes={estimate.notes}
                exclusions={estimate.exclusions}
                onNotesChange={updateNotes}
                onExclusionsChange={updateExclusions}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Cost Summary Sidebar */}
        <div>
          <CostSummarySidebar breakdown={breakdown} settings={estimate.settings} />
        </div>
      </div>
    </div>
  );
}
