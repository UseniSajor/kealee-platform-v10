import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft,
  Search,
  Filter,
  Download,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Alert, AlertDescription } from '../ui/Alert';
import { Skeleton } from '../ui/Skeleton';
import { accountingApi } from '../../api/accounting.api';
import type { EscrowTransaction, TransactionType, TransactionStatus } from '../../types/finance.types';

export function TransactionHistory() {
  const { escrowId } = useParams<{ escrowId: string }>();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['escrow-transactions', escrowId],
    queryFn: () => accountingApi.getEscrowTransactions(escrowId!),
    enabled: !!escrowId,
  });

  // Filter and sort transactions
  const filteredTransactions = React.useMemo(() => {
    if (!transactions) return [];

    let filtered = transactions.filter((tx: EscrowTransaction) => {
      const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tx.reference?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || tx.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.processedDate || b.createdAt).getTime() - new Date(a.processedDate || a.createdAt).getTime();
      } else if (sortBy === 'date-asc') {
        return new Date(a.processedDate || a.createdAt).getTime() - new Date(b.processedDate || b.createdAt).getTime();
      } else if (sortBy === 'amount-desc') {
        return b.amount - a.amount;
      } else {
        return a.amount - b.amount;
      }
    });

    return filtered;
  }, [transactions, searchTerm, typeFilter, statusFilter, sortBy]);

  // Calculate totals
  const totals = React.useMemo(() => {
    if (!filteredTransactions) return { deposits: 0, releases: 0, fees: 0, net: 0 };

    return filteredTransactions.reduce((acc, tx) => {
      if (tx.status === 'COMPLETED') {
        if (tx.type === 'DEPOSIT') acc.deposits += tx.amount;
        else if (tx.type === 'RELEASE') acc.releases += tx.amount;
        else if (tx.type === 'FEE') acc.fees += tx.amount;
      }
      return acc;
    }, { deposits: 0, releases: 0, fees: 0, net: 0 });
  }, [filteredTransactions]);

  totals.net = totals.deposits - totals.releases - totals.fees;

  const handleExport = () => {
    // Implement CSV export
    const csv = generateCSV(filteredTransactions);
    downloadCSV(csv, `escrow-transactions-${escrowId}.csv`);
  };

  if (isLoading) {
    return <TransactionHistorySkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load transactions</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => navigate(`/escrow/${escrowId}`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
            <p className="text-gray-600 mt-1">{transactions?.length || 0} total transactions</p>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Deposits"
          amount={totals.deposits}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <SummaryCard
          label="Total Releases"
          amount={totals.releases}
          color="text-red-600"
          bgColor="bg-red-50"
        />
        <SummaryCard
          label="Total Fees"
          amount={totals.fees}
          color="text-gray-600"
          bgColor="bg-gray-50"
        />
        <SummaryCard
          label="Net Change"
          amount={totals.net}
          color={totals.net >= 0 ? 'text-green-600' : 'text-red-600'}
          bgColor={totals.net >= 0 ? 'bg-green-50' : 'bg-red-50'}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="DEPOSIT">Deposits</SelectItem>
                <SelectItem value="RELEASE">Releases</SelectItem>
                <SelectItem value="REFUND">Refunds</SelectItem>
                <SelectItem value="FEE">Fees</SelectItem>
                <SelectItem value="INTEREST">Interest</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="REVERSED">Reversed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-600">
              Showing {filteredTransactions.length} of {transactions?.length || 0} transactions
            </p>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="amount-desc">Highest Amount</SelectItem>
                <SelectItem value="amount-asc">Lowest Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card>
        <CardContent className="p-0">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No transactions found</p>
              {(searchTerm || typeFilter !== 'all' || statusFilter !== 'all') && (
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchTerm('');
                    setTypeFilter('all');
                    setStatusFilter('all');
                  }}
                  className="mt-2"
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTransactions.map((tx) => (
                <TransactionRow key={tx.id} transaction={tx} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Sub-components
function SummaryCard({ label, amount, color, bgColor }: { 
  label: string; 
  amount: number; 
  color: string; 
  bgColor: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className={`text-2xl font-bold mt-2 ${color}`}>
          {formatCurrency(amount)}
        </p>
      </CardContent>
    </Card>
  );
}

function TransactionRow({ transaction }: { transaction: EscrowTransaction }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <div
        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {/* Icon */}
            <div className={`p-2 rounded-lg ${getTransactionIconBg(transaction.type)}`}>
              {getTransactionIcon(transaction.type)}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900 truncate">{transaction.description}</p>
                <TransactionStatusBadge status={transaction.status} />
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                <span>{formatDateTime(transaction.processedDate || transaction.createdAt)}</span>
                {transaction.reference && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-xs">{transaction.reference}</span>
                  </>
                )}
              </div>
            </div>

            {/* Amount */}
            <div className="text-right">
              <p className={`text-lg font-semibold ${getAmountColor(transaction.type)}`}>
                {transaction.type === 'RELEASE' || transaction.type === 'REFUND' || transaction.type === 'FEE' ? '-' : '+'}
                {formatCurrency(transaction.amount)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{transaction.currency}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && transaction.metadata && (
        <div className="px-4 pb-4 bg-gray-50">
          <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction ID:</span>
              <span className="font-mono">{transaction.id}</span>
            </div>
            {transaction.initiatedBy && (
              <div className="flex justify-between">
                <span className="text-gray-600">Initiated By:</span>
                <span>{transaction.initiatedBy}</span>
              </div>
            )}
            {transaction.approvedBy && (
              <div className="flex justify-between">
                <span className="text-gray-600">Approved By:</span>
                <span>{transaction.approvedBy}</span>
              </div>
            )}
            {transaction.scheduledDate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Scheduled Date:</span>
                <span>{formatDateTime(transaction.scheduledDate)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  const variants: Record<TransactionStatus, any> = {
    PENDING: { label: 'Pending', variant: 'secondary' },
    PROCESSING: { label: 'Processing', variant: 'warning' },
    COMPLETED: { label: 'Completed', variant: 'success' },
    FAILED: { label: 'Failed', variant: 'destructive' },
    REVERSED: { label: 'Reversed', variant: 'destructive' },
  };

  const config = variants[status] || { label: status, variant: 'default' };
  return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
}

function getTransactionIcon(type: TransactionType) {
  const icons: Record<TransactionType, React.ReactNode> = {
    DEPOSIT: <TrendingUp className="w-4 h-4 text-green-600" />,
    RELEASE: <TrendingDown className="w-4 h-4 text-red-600" />,
    REFUND: <TrendingDown className="w-4 h-4 text-blue-600" />,
    FEE: <CreditCard className="w-4 h-4 text-gray-600" />,
    INTEREST: <TrendingUp className="w-4 h-4 text-purple-600" />,
  };
  return icons[type];
}

function getTransactionIconBg(type: TransactionType) {
  const colors: Record<TransactionType, string> = {
    DEPOSIT: 'bg-green-50',
    RELEASE: 'bg-red-50',
    REFUND: 'bg-blue-50',
    FEE: 'bg-gray-50',
    INTEREST: 'bg-purple-50',
  };
  return colors[type];
}

function getAmountColor(type: TransactionType) {
  if (type === 'DEPOSIT' || type === 'INTEREST') return 'text-green-600';
  if (type === 'RELEASE' || type === 'REFUND' || type === 'FEE') return 'text-red-600';
  return 'text-gray-900';
}

function generateCSV(transactions: EscrowTransaction[]): string {
  const headers = ['Date', 'Type', 'Description', 'Amount', 'Status', 'Reference'];
  const rows = transactions.map(tx => [
    formatDateTime(tx.processedDate || tx.createdAt),
    tx.type,
    tx.description,
    tx.amount.toString(),
    tx.status,
    tx.reference || '',
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

function TransactionHistorySkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default TransactionHistory;

