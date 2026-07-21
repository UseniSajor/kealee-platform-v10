'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Search,
  ChevronRight,
  Loader2,
  Plus,
  Filter,
  ArrowLeft,
  Database,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

interface CTCDivision {
  code: string;
  name: string;
  taskCount: number;
}

interface CTCTask {
  id: string;
  ctcTaskNumber: string;
  csiCode: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  unit: string;
  unitCost: number;
  laborCost: number;
  materialCost: number;
  equipmentCost: number;
  laborHours: number;
  tags: string[];
  ctcModifierOf: string | null;
  metadata: any;
}

export default function CTCBrowserPage() {
  const [divisions, setDivisions] = useState<CTCDivision[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [tasks, setTasks] = useState<CTCTask[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [totalTasks, setTotalTasks] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Load divisions
  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.getCTCDivisions();
        if (res.success && res.data) {
          setDivisions((res.data as any).data || []);
          setTotalTasks((res.data as any).totalTasks || 0);
        }
      } catch {
        // Error loading divisions
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Search tasks
  const searchTasks = useCallback(async (p = 1) => {
    setSearchLoading(true);
    try {
      const res = await apiClient.searchCTCTasks({
        query: search || undefined,
        division: selectedDivision || undefined,
        page: p,
        limit: 50,
      });
      if (res.success && res.data) {
        const d = res.data as any;
        setTasks(d.data || []);
        setTotalPages(d.pagination?.totalPages || 1);
        setPage(p);
      }
    } catch {
      // Error searching
    } finally {
      setSearchLoading(false);
    }
  }, [search, selectedDivision]);

  // Search when division or query changes
  useEffect(() => {
    if (selectedDivision || search) {
      searchTasks(1);
    } else {
      setTasks([]);
    }
  }, [selectedDivision, searchTasks, search]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(val) || 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/cost-database" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="h-7 w-7 text-amber-600" />
            CTC Task Browser
          </h1>
          <p className="text-gray-600 mt-1">
            Browse the Construction Task Catalog by CSI division. {totalTasks > 0 && `${totalTasks.toLocaleString()} tasks available.`}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search CTC tasks by number, description, or CSI code..."
            className="pl-10"
          />
        </div>
        {selectedDivision && (
          <Button variant="outline" onClick={() => { setSelectedDivision(null); setTasks([]); }}>
            Clear Filter
          </Button>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Division Tree (sidebar) */}
        <div className="col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                CSI Divisions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto">
                  {divisions.map((div) => (
                    <button
                      key={div.code}
                      onClick={() => setSelectedDivision(div.code === selectedDivision ? null : div.code)}
                      className={`w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 hover:bg-gray-50 transition-colors flex items-center justify-between ${
                        selectedDivision === div.code ? 'bg-amber-50 text-amber-800 font-medium' : 'text-gray-700'
                      }`}
                    >
                      <span>
                        <span className="font-mono text-xs text-gray-400 mr-2">{div.code}</span>
                        {div.name}
                      </span>
                      <span className="text-xs text-gray-400">{div.taskCount}</span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Task List */}
        <div className="col-span-9">
          {searchLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : tasks.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-gray-500">
                {selectedDivision || search
                  ? 'No tasks found matching your criteria.'
                  : 'Select a CSI division or search to browse CTC tasks.'}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {/* Results header */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Showing {tasks.length} tasks (page {page} of {totalPages})</span>
              </div>

              {/* Task cards */}
              {tasks.map((task) => (
                <Card key={task.id} className={`hover:shadow-md transition-shadow ${task.ctcModifierOf ? 'ml-6 border-l-4 border-l-amber-300' : ''}`}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-bold text-amber-700">
                            {task.ctcTaskNumber}
                          </span>
                          {task.csiCode && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                              CSI {task.csiCode}
                            </span>
                          )}
                          {task.ctcModifierOf && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                              Modifier of {task.ctcModifierOf}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-800">{task.name}</p>
                        {task.subcategory && (
                          <p className="text-xs text-gray-400 mt-0.5">{task.subcategory}</p>
                        )}
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <p className="font-bold text-gray-900">{formatCurrency(task.unitCost)}</p>
                        <p className="text-xs text-gray-500">per {task.unit}</p>
                        <div className="flex gap-2 mt-1 text-xs text-gray-400">
                          <span>L: {formatCurrency(task.laborCost)}</span>
                          <span>M: {formatCurrency(task.materialCost)}</span>
                          <span>E: {formatCurrency(task.equipmentCost)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => searchTasks(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="px-3 py-1.5 text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => searchTasks(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
