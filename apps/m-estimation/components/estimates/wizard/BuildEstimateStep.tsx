'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Package, Sparkles, Search, Database, Loader2 } from 'lucide-react';
import { formatCurrency, formatCurrencyDetailed } from '@/lib/utils';
import { calculateCostBreakdown } from '@/lib/calculations';
import { apiClient } from '@/lib/api';

interface BuildEstimateStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
  isSubmitting?: boolean;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  type: 'material' | 'labor' | 'equipment';
}

interface Section {
  id: string;
  division: string;
  name: string;
  items: LineItem[];
}

export function BuildEstimateStep({
  data,
  onNext,
  onBack,
}: BuildEstimateStepProps) {
  const [sections, setSections] = useState<Section[]>(
    data.sections || [
      {
        id: '1',
        division: '03',
        name: 'CONCRETE',
        items: [
          {
            id: '1-1',
            description: 'Slab on grade',
            quantity: 2000,
            unit: 'SF',
            unitCost: 15.0,
            type: 'material',
          },
        ],
      },
    ]
  );

  const [newItem, setNewItem] = useState({
    description: '',
    quantity: 0,
    unit: 'SF',
    unitCost: 0,
    type: 'material' as 'material' | 'labor' | 'equipment',
  });

  // CTC browser state
  const [showCTC, setShowCTC] = useState(false);
  const [ctcSearch, setCTCSearch] = useState('');
  const [ctcResults, setCTCResults] = useState<any[]>([]);
  const [ctcLoading, setCTCLoading] = useState(false);

  const searchCTC = useCallback(async () => {
    if (!ctcSearch.trim()) return;
    setCTCLoading(true);
    try {
      const res = await apiClient.searchCTCTasks({ query: ctcSearch, limit: 20 });
      if (res.success && res.data) {
        setCTCResults((res.data as any).data || []);
      }
    } catch {
      // Search failed silently
    } finally {
      setCTCLoading(false);
    }
  }, [ctcSearch]);

  const addCTCTask = (task: any, sectionId: string) => {
    setSections(
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: [
                ...section.items,
                {
                  id: `ctc-${task.ctcTaskNumber}-${Date.now()}`,
                  description: `${task.ctcTaskNumber} - ${task.name}`,
                  quantity: 1,
                  unit: task.unit || 'EA',
                  unitCost: Number(task.unitCost) || 0,
                  type: 'material' as const,
                },
              ],
            }
          : section
      )
    );
  };

  const addLineItem = (sectionId: string) => {
    if (!newItem.description || newItem.quantity <= 0 || newItem.unitCost <= 0) {
      return;
    }

    setSections(
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: [
                ...section.items,
                {
                  ...newItem,
                  id: `${sectionId}-${Date.now()}`,
                },
              ],
            }
          : section
      )
    );

    setNewItem({
      description: '',
      quantity: 0,
      unit: 'SF',
      unitCost: 0,
      type: 'material',
    });
  };

  const removeLineItem = (sectionId: string, itemId: string) => {
    setSections(
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.filter((item) => item.id !== itemId),
            }
          : section
      )
    );
  };

  const calculateSectionTotal = (section: Section) => {
    return section.items.reduce(
      (sum, item) => sum + item.quantity * item.unitCost,
      0
    );
  };

  const allItems = sections.flatMap((s) =>
    s.items.map((item) => ({
      ...item,
      totalCost: item.quantity * item.unitCost,
    }))
  );

  const breakdown = calculateCostBreakdown(
    sections.map((s) => ({ ...s, lineItems: allItems, subtotal: 0 })),
    {}
  );

  const handleNext = () => {
    if (allItems.length === 0) {
      alert('Please add at least one line item');
      return;
    }
    onNext({ sections });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Build Estimate</h2>
        <p className="text-muted-foreground mt-1">
          Add sections and line items to build your estimate
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Line Items (70%) */}
        <div className="lg:col-span-2 space-y-4">
          {sections.map((section) => (
            <Card key={section.id}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {section.division} - {section.name}
                  </CardTitle>
                  <Badge variant="secondary">
                    {formatCurrency(calculateSectionTotal(section))}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {section.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} {item.unit} × {formatCurrencyDetailed(item.unitCost)} ={' '}
                        {formatCurrency(item.quantity * item.unitCost)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(section.id, item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}

                {/* Add Item Form */}
                <div className="grid grid-cols-12 gap-2 pt-3 border-t">
                  <Input
                    placeholder="Description"
                    value={newItem.description}
                    onChange={(e) =>
                      setNewItem({ ...newItem, description: e.target.value })
                    }
                    className="col-span-4"
                  />
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={newItem.quantity || ''}
                    onChange={(e) =>
                      setNewItem({ ...newItem, quantity: Number(e.target.value) })
                    }
                    className="col-span-2"
                  />
                  <Input
                    placeholder="Unit"
                    value={newItem.unit}
                    onChange={(e) =>
                      setNewItem({ ...newItem, unit: e.target.value })
                    }
                    className="col-span-2"
                  />
                  <Input
                    type="number"
                    placeholder="$/Unit"
                    value={newItem.unitCost || ''}
                    onChange={(e) =>
                      setNewItem({ ...newItem, unitCost: Number(e.target.value) })
                    }
                    className="col-span-3"
                  />
                  <Button
                    size="icon"
                    onClick={() => addLineItem(section.id)}
                    className="col-span-1"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>

          {/* CTC Task Browser */}
          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Database className="h-4 w-4 text-amber-600" />
                  CTC Task Catalog
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCTC(!showCTC)}
                >
                  {showCTC ? 'Hide' : 'Browse CTC Tasks'}
                </Button>
              </div>
            </CardHeader>
            {showCTC && (
              <CardContent className="pt-0 space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search CTC tasks by number, description, or CSI code..."
                    value={ctcSearch}
                    onChange={(e) => setCTCSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchCTC()}
                    className="flex-1"
                  />
                  <Button size="icon" onClick={searchCTC} disabled={ctcLoading}>
                    {ctcLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {ctcResults.length > 0 && (
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {ctcResults.map((task: any) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-2 rounded-md border hover:bg-accent/50 text-sm"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="font-mono text-xs text-amber-700 mr-1.5">
                            {task.ctcTaskNumber}
                          </span>
                          <span className="text-muted-foreground">{task.name}</span>
                        </div>
                        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                          <span className="text-xs font-medium">
                            {formatCurrency(task.unitCost)}/{task.unit}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => addCTCTask(task, sections[0]?.id || '1')}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {ctcResults.length === 0 && ctcSearch && !ctcLoading && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No CTC tasks found. Try a different search term.
                  </p>
                )}
              </CardContent>
            )}
          </Card>
        </div>

        {/* Cost Summary (30%) */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cost Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Material:</span>
                  <span className="font-medium">
                    {formatCurrency(breakdown.materialCost)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Labor:</span>
                  <span className="font-medium">
                    {formatCurrency(breakdown.laborCost)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Equipment:</span>
                  <span className="font-medium">
                    {formatCurrency(breakdown.equipmentCost)}
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between font-bold">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(breakdown.subtotal)}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Overhead and profit will be added in the next step
              </p>
            </CardContent>
          </Card>

          {/* AI Suggestions */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Package className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    Consider using engineered lumber to save approximately $3,200
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Package className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    Your estimate is 5% below market average
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext}>Next: Settings & Markup</Button>
      </div>
    </div>
  );
}
