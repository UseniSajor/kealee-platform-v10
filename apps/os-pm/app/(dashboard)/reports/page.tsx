'use client';

import { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  BarChart3,
  DollarSign,
  HardHat,
  ShieldCheck,
  Settings,
  Eye,
  Share2,
  ChevronLeft,
  ChevronRight,
  CalendarClock,
  Mail,
  Play,
  Pause,
  Repeat,
  TrendingUp,
  Wrench,
  ClipboardList,
  FileSpreadsheet,
  FileBadge,
  ToggleRight,
  ToggleLeft,
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@kealee/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@kealee/ui/card';
import { Input } from '@kealee/ui/input';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReportCategory =
  | 'all'
  | 'financial'
  | 'project'
  | 'field'
  | 'safety'
  | 'client'
  | 'custom';

type ReportStatus = 'ready' | 'generating' | 'draft' | 'failed';
type FileFormat = 'pdf' | 'excel' | 'csv';

interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  lastGenerated: string;
  autoSchedule?: string;
  formats: FileFormat[];
  icon: React.ReactNode;
  category: ReportCategory;
}

interface RecentReport {
  id: string;
  name: string;
  type: ReportCategory;
  period: string;
  generatedBy: string;
  date: string;
  pages: number;
  size: string;
  status: ReportStatus;
  formats: FileFormat[];
}

interface ScheduledReport {
  id: string;
  name: string;
  schedule: string;
  nextRun: string;
  recipients: string;
  recipientCount: number;
  active: boolean;
}

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const CATEGORIES: { key: ReportCategory; label: string }[] = [
  { key: 'all', label: 'All Reports' },
  { key: 'financial', label: 'Financial' },
  { key: 'project', label: 'Project' },
  { key: 'field', label: 'Field' },
  { key: 'safety', label: 'Safety' },
  { key: 'client', label: 'Client' },
  { key: 'custom', label: 'Custom' },
];

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'tpl-1',
    title: 'Weekly Progress Report',
    description:
      'Summary of all project progress, milestones, and issues',
    lastGenerated: 'Today at 6:00 AM',
    autoSchedule: 'Every Monday 6 AM',
    formats: ['pdf', 'excel'],
    icon: <BarChart3 className="h-6 w-6" />,
    category: 'project',
  },
  {
    id: 'tpl-2',
    title: 'Monthly Financial Summary',
    description:
      'Revenue, expenses, profit by project and overall',
    lastGenerated: 'Feb 1, 2026',
    formats: ['pdf', 'excel'],
    icon: <DollarSign className="h-6 w-6" />,
    category: 'financial',
  },
  {
    id: 'tpl-3',
    title: 'Project Budget vs Actual',
    description:
      'Compare planned budget against actual costs per project',
    lastGenerated: 'Yesterday',
    formats: ['pdf', 'excel'],
    icon: <TrendingUp className="h-6 w-6" />,
    category: 'financial',
  },
  {
    id: 'tpl-4',
    title: 'Daily Safety Report',
    description:
      'Safety incidents, compliance scores, near-misses',
    lastGenerated: 'Today at 5:00 PM',
    formats: ['pdf'],
    icon: <ShieldCheck className="h-6 w-6" />,
    category: 'safety',
  },
  {
    id: 'tpl-5',
    title: 'Client Billing Statement',
    description:
      'Per-client invoice summary and payment status',
    lastGenerated: 'Jan 31, 2026',
    formats: ['pdf'],
    icon: <FileBadge className="h-6 w-6" />,
    category: 'client',
  },
  {
    id: 'tpl-6',
    title: 'Labor Utilization Report',
    description:
      'Crew hours, overtime, utilization rates by trade',
    lastGenerated: 'Yesterday',
    formats: ['excel'],
    icon: <HardHat className="h-6 w-6" />,
    category: 'field',
  },
  {
    id: 'tpl-7',
    title: 'Change Order Log',
    description:
      'All COs with cost/schedule impacts and approval status',
    lastGenerated: '3 days ago',
    formats: ['pdf', 'excel'],
    icon: <ClipboardList className="h-6 w-6" />,
    category: 'project',
  },
  {
    id: 'tpl-8',
    title: 'Subcontractor Performance',
    description:
      'Sub ratings, compliance status, payment history',
    lastGenerated: 'Last week',
    formats: ['pdf'],
    icon: <Wrench className="h-6 w-6" />,
    category: 'field',
  },
];

const RECENT_REPORTS: RecentReport[] = [
  {
    id: 'rpt-1',
    name: 'Weekly Progress Report - Week 5',
    type: 'project',
    period: 'Jan 27 - Feb 2',
    generatedBy: 'Auto-generated',
    date: '2026-02-03',
    pages: 18,
    size: '2.4 MB',
    status: 'ready',
    formats: ['pdf', 'excel'],
  },
  {
    id: 'rpt-2',
    name: 'January Financial Summary',
    type: 'financial',
    period: 'January 2026',
    generatedBy: 'Mike Rodriguez',
    date: '2026-02-01',
    pages: 32,
    size: '4.1 MB',
    status: 'ready',
    formats: ['pdf', 'excel'],
  },
  {
    id: 'rpt-3',
    name: 'Q4 2025 Annual Review',
    type: 'financial',
    period: 'Q4 2025',
    generatedBy: 'Sarah Kim',
    date: '2026-01-15',
    pages: 45,
    size: '6.8 MB',
    status: 'ready',
    formats: ['pdf'],
  },
  {
    id: 'rpt-4',
    name: 'Thompson Build Progress',
    type: 'project',
    period: 'Jan 27-31',
    generatedBy: 'Auto-generated',
    date: '2026-02-01',
    pages: 8,
    size: '1.2 MB',
    status: 'ready',
    formats: ['pdf'],
  },
  {
    id: 'rpt-5',
    name: 'Safety Audit - January',
    type: 'safety',
    period: 'January 2026',
    generatedBy: 'Lisa Chen',
    date: '2026-02-01',
    pages: 12,
    size: '1.8 MB',
    status: 'ready',
    formats: ['pdf'],
  },
  {
    id: 'rpt-6',
    name: 'Budget Variance Report',
    type: 'financial',
    period: 'January 2026',
    generatedBy: 'Mike Rodriguez',
    date: '2026-02-02',
    pages: 15,
    size: '2.1 MB',
    status: 'ready',
    formats: ['pdf', 'excel'],
  },
  {
    id: 'rpt-7',
    name: 'Labor Hours Summary',
    type: 'field',
    period: 'January 2026',
    generatedBy: 'Carlos Mendez',
    date: '2026-02-01',
    pages: 10,
    size: '1.5 MB',
    status: 'ready',
    formats: ['excel'],
  },
  {
    id: 'rpt-8',
    name: 'Subcontractor Scorecard',
    type: 'field',
    period: 'Q4 2025',
    generatedBy: "James O'Brien",
    date: '2026-01-20',
    pages: 22,
    size: '3.2 MB',
    status: 'ready',
    formats: ['pdf', 'excel'],
  },
  {
    id: 'rpt-9',
    name: 'Client Satisfaction Survey',
    type: 'client',
    period: 'Q4 2025',
    generatedBy: 'Sarah Kim',
    date: '2026-01-18',
    pages: 8,
    size: '0.9 MB',
    status: 'ready',
    formats: ['pdf'],
  },
  {
    id: 'rpt-10',
    name: 'Permit Status Report',
    type: 'project',
    period: 'January 2026',
    generatedBy: 'Lisa Chen',
    date: '2026-02-01',
    pages: 6,
    size: '0.7 MB',
    status: 'ready',
    formats: ['pdf'],
  },
  {
    id: 'rpt-11',
    name: 'Equipment Utilization',
    type: 'field',
    period: 'January 2026',
    generatedBy: 'Auto-generated',
    date: '2026-02-01',
    pages: 9,
    size: '1.1 MB',
    status: 'ready',
    formats: ['excel'],
  },
  {
    id: 'rpt-12',
    name: 'Revenue Forecast Q1 2026',
    type: 'financial',
    period: 'Q1 2026',
    generatedBy: 'Mike Rodriguez',
    date: '2026-02-03',
    pages: 14,
    size: '2.0 MB',
    status: 'draft',
    formats: ['pdf', 'excel'],
  },
];

const SCHEDULED_REPORTS: ScheduledReport[] = [
  {
    id: 'sched-1',
    name: 'Weekly Progress',
    schedule: 'Every Monday 6:00 AM',
    nextRun: format(new Date(2026, 1, 9, 6, 0), 'MMM d, yyyy h:mm a'),
    recipients: 'All PMs',
    recipientCount: 5,
    active: true,
  },
  {
    id: 'sched-2',
    name: 'Daily Safety Summary',
    schedule: 'Every Weekday 5:00 PM',
    nextRun: format(new Date(2026, 1, 6, 17, 0), 'MMM d, yyyy h:mm a'),
    recipients: 'Safety Team',
    recipientCount: 3,
    active: true,
  },
  {
    id: 'sched-3',
    name: 'Monthly Financial',
    schedule: '1st of Month 7:00 AM',
    nextRun: format(new Date(2026, 2, 1, 7, 0), 'MMM d, yyyy h:mm a'),
    recipients: 'Finance + Owners',
    recipientCount: 4,
    active: true,
  },
  {
    id: 'sched-4',
    name: 'Client Billing Statements',
    schedule: '1st and 15th',
    nextRun: format(new Date(2026, 1, 15, 7, 0), 'MMM d, yyyy h:mm a'),
    recipients: 'Billing Dept',
    recipientCount: 2,
    active: true,
  },
  {
    id: 'sched-5',
    name: 'Labor Hours',
    schedule: 'Every Friday 4:00 PM',
    nextRun: format(new Date(2026, 1, 6, 16, 0), 'MMM d, yyyy h:mm a'),
    recipients: 'Payroll',
    recipientCount: 2,
    active: true,
  },
];

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function FormatBadge({ fmt }: { fmt: FileFormat }) {
  const styles: Record<FileFormat, string> = {
    pdf: 'bg-red-100 text-red-700 border-red-200',
    excel: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    csv: 'bg-blue-100 text-blue-700 border-blue-200',
  };
  const labels: Record<FileFormat, string> = {
    pdf: 'PDF',
    excel: 'Excel',
    csv: 'CSV',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        styles[fmt]
      )}
    >
      {labels[fmt]}
    </span>
  );
}

function StatusBadge({ status }: { status: ReportStatus }) {
  const map: Record<
    ReportStatus,
    { label: string; classes: string }
  > = {
    ready: {
      label: 'Ready',
      classes:
        'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    generating: {
      label: 'Generating',
      classes:
        'bg-amber-50 text-amber-700 border-amber-200 animate-pulse',
    },
    draft: {
      label: 'Draft',
      classes: 'bg-gray-100 text-gray-600 border-gray-200',
    },
    failed: {
      label: 'Failed',
      classes: 'bg-red-50 text-red-700 border-red-200',
    },
  };
  const { label, classes } = map[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        classes
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          status === 'ready' && 'bg-emerald-500',
          status === 'generating' && 'bg-amber-500',
          status === 'draft' && 'bg-gray-400',
          status === 'failed' && 'bg-red-500'
        )}
      />
      {label}
    </span>
  );
}

function TypeBadge({ type }: { type: ReportCategory }) {
  const colors: Record<string, string> = {
    financial: 'bg-violet-100 text-violet-700',
    project: 'bg-blue-100 text-blue-700',
    field: 'bg-amber-100 text-amber-700',
    safety: 'bg-emerald-100 text-emerald-700',
    client: 'bg-pink-100 text-pink-700',
    custom: 'bg-gray-100 text-gray-600',
    all: 'bg-gray-100 text-gray-600',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize',
        colors[type]
      )}
    >
      {type}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ReportsPage() {
  const [activeCategory, setActiveCategory] =
    useState<ReportCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [builderSources, setBuilderSources] = useState({
    projects: true,
    financials: false,
    labor: false,
    safety: false,
    documents: false,
  });
  const [builderGroupBy, setBuilderGroupBy] =
    useState('project');
  const [builderIncludeCharts, setBuilderIncludeCharts] =
    useState(true);
  const [builderDateFrom, setBuilderDateFrom] =
    useState('2026-01-01');
  const [builderDateTo, setBuilderDateTo] =
    useState('2026-01-31');

  const ROWS_PER_PAGE = 6;

  // Filter templates by category
  const filteredTemplates =
    activeCategory === 'all'
      ? REPORT_TEMPLATES
      : REPORT_TEMPLATES.filter(
          (t) => t.category === activeCategory
        );

  // Filter recent reports by category + search
  const filteredReports = RECENT_REPORTS.filter((r) => {
    const matchesCategory =
      activeCategory === 'all' || r.type === activeCategory;
    const matchesSearch =
      !searchQuery ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.generatedBy
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.ceil(
    filteredReports.length / ROWS_PER_PAGE
  );
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  return (
    <div className="space-y-8 pb-12">
      {/* ----------------------------------------------------------------- */}
      {/* 1. HEADER                                                         */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Reports &amp; Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Generate, schedule, and download comprehensive project
            reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" />
            Export All
          </Button>
          <Button variant="secondary" size="sm">
            <CalendarClock className="mr-1.5 h-4 w-4" />
            Schedule Report
          </Button>
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 2. CATEGORY TABS                                                  */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-gray-200 pb-px">
        {CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => {
              setActiveCategory(key);
              setCurrentPage(1);
            }}
            className={cn(
              'whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors',
              activeCategory === key
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 3. QUICK REPORT GENERATORS                                        */}
      {/* ----------------------------------------------------------------- */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Quick Report Generators
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filteredTemplates.map((tpl) => (
            <Card
              key={tpl.id}
              className="group relative cursor-pointer transition-shadow hover:shadow-md"
            >
              <CardHeader className="pb-2">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {tpl.icon}
                </div>
                <CardTitle className="text-sm">
                  {tpl.title}
                </CardTitle>
                <CardDescription className="line-clamp-2 text-xs">
                  {tpl.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{tpl.lastGenerated}</span>
                </div>
                {tpl.autoSchedule && (
                  <div className="flex items-center gap-1.5">
                    <Repeat className="h-3.5 w-3.5" />
                    <span>{tpl.autoSchedule}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">Format:</span>
                  <div className="flex gap-1">
                    {tpl.formats.map((f) => (
                      <FormatBadge key={f} fmt={f} />
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                >
                  <Play className="mr-1.5 h-3.5 w-3.5" />
                  Generate Now
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 4. RECENT REPORTS TABLE                                           */}
      {/* ----------------------------------------------------------------- */}
      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Reports
          </h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 w-64 pl-8"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-1.5 h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>

        <Card className="py-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/60 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="whitespace-nowrap px-4 py-3">
                    Report Name
                  </th>
                  <th className="whitespace-nowrap px-4 py-3">
                    Type
                  </th>
                  <th className="whitespace-nowrap px-4 py-3">
                    Period
                  </th>
                  <th className="whitespace-nowrap px-4 py-3">
                    Generated By
                  </th>
                  <th className="whitespace-nowrap px-4 py-3">
                    Date
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">
                    Pages
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">
                    Size
                  </th>
                  <th className="whitespace-nowrap px-4 py-3">
                    Format
                  </th>
                  <th className="whitespace-nowrap px-4 py-3">
                    Status
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedReports.map((rpt) => (
                  <tr
                    key={rpt.id}
                    className="transition-colors hover:bg-gray-50/50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                        {rpt.name}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <TypeBadge type={rpt.type} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {rpt.period}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {rpt.generatedBy}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {format(new Date(rpt.date), 'MMM d, yyyy')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-gray-600">
                      {rpt.pages}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-gray-600">
                      {rpt.size}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex gap-1">
                        {rpt.formats.map((f) => (
                          <FormatBadge key={f} fmt={f} />
                        ))}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={rpt.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Share"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedReports.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-12 text-center text-gray-400"
                    >
                      No reports match your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
              <span className="text-gray-500">
                Showing{' '}
                {(currentPage - 1) * ROWS_PER_PAGE + 1}
                {' - '}
                {Math.min(
                  currentPage * ROWS_PER_PAGE,
                  filteredReports.length
                )}{' '}
                of {filteredReports.length} reports
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((p) => Math.max(1, p - 1))
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <Button
                    key={i}
                    variant={
                      currentPage === i + 1
                        ? 'default'
                        : 'outline'
                    }
                    size="icon-sm"
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(totalPages, p + 1)
                    )
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 5. SCHEDULED REPORTS                                              */}
      {/* ----------------------------------------------------------------- */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Scheduled Reports
          </h2>
          <Button variant="outline" size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Schedule
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SCHEDULED_REPORTS.map((sched) => (
            <Card key={sched.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm">
                    {sched.name}
                  </CardTitle>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                      sched.active
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-gray-100 text-gray-500'
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        sched.active
                          ? 'bg-emerald-500'
                          : 'bg-gray-400'
                      )}
                    />
                    {sched.active ? 'Active' : 'Paused'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                  <span>{sched.schedule}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>Next run: {sched.nextRun}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {sched.recipients} ({sched.recipientCount})
                  </span>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                >
                  <Settings className="mr-1 h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                >
                  {sched.active ? (
                    <>
                      <Pause className="mr-1 h-3.5 w-3.5" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="mr-1 h-3.5 w-3.5" />
                      Resume
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* 6. REPORT BUILDER PREVIEW                                         */}
      {/* ----------------------------------------------------------------- */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Custom Report Builder
        </h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Build a Custom Report
            </CardTitle>
            <CardDescription>
              Select data sources, date range, and grouping to
              generate a tailored report.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left column - data sources */}
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Data Sources
                  </label>
                  <div className="space-y-2">
                    {(
                      Object.keys(builderSources) as Array<
                        keyof typeof builderSources
                      >
                    ).map((key) => {
                      const labels: Record<string, string> = {
                        projects: 'Projects',
                        financials: 'Financials',
                        labor: 'Labor',
                        safety: 'Safety',
                        documents: 'Documents',
                      };
                      const icons: Record<
                        string,
                        React.ReactNode
                      > = {
                        projects: (
                          <BarChart3 className="h-4 w-4" />
                        ),
                        financials: (
                          <DollarSign className="h-4 w-4" />
                        ),
                        labor: (
                          <HardHat className="h-4 w-4" />
                        ),
                        safety: (
                          <ShieldCheck className="h-4 w-4" />
                        ),
                        documents: (
                          <FileText className="h-4 w-4" />
                        ),
                      };
                      return (
                        <label
                          key={key}
                          className={cn(
                            'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors',
                            builderSources[key]
                              ? 'border-primary/40 bg-primary/5 text-gray-900'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={builderSources[key]}
                            onChange={() =>
                              setBuilderSources((prev) => ({
                                ...prev,
                                [key]: !prev[key],
                              }))
                            }
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className="text-gray-400">
                            {icons[key]}
                          </span>
                          {labels[key]}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right column - options */}
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Date Range
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Calendar className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        type="date"
                        value={builderDateFrom}
                        onChange={(e) =>
                          setBuilderDateFrom(e.target.value)
                        }
                        className="pl-8"
                      />
                    </div>
                    <span className="text-sm text-gray-400">
                      to
                    </span>
                    <div className="relative flex-1">
                      <Calendar className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        type="date"
                        value={builderDateTo}
                        onChange={(e) =>
                          setBuilderDateTo(e.target.value)
                        }
                        className="pl-8"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Group By
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Project', 'Client', 'Trade', 'Phase'].map(
                      (opt) => {
                        const val = opt.toLowerCase();
                        return (
                          <button
                            key={val}
                            onClick={() =>
                              setBuilderGroupBy(val)
                            }
                            className={cn(
                              'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                              builderGroupBy === val
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                            )}
                          >
                            {opt}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <BarChart3 className="h-4 w-4 text-gray-400" />
                    Include Charts
                  </div>
                  <button
                    onClick={() =>
                      setBuilderIncludeCharts((v) => !v)
                    }
                    className="text-primary"
                    aria-label="Toggle include charts"
                  >
                    {builderIncludeCharts ? (
                      <ToggleRight className="h-7 w-7" />
                    ) : (
                      <ToggleLeft className="h-7 w-7 text-gray-400" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-gray-400">
                    Output formats:
                  </span>
                  <FormatBadge fmt="pdf" />
                  <FormatBadge fmt="excel" />
                  <FormatBadge fmt="csv" />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-2 border-t pt-4">
            <Button variant="outline" size="sm">
              Reset
            </Button>
            <Button size="sm">
              <FileSpreadsheet className="mr-1.5 h-4 w-4" />
              Generate Custom Report
            </Button>
          </CardFooter>
        </Card>
      </section>
    </div>
  );
}
