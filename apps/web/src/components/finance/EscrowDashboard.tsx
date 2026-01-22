import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEscrow } from '../../hooks/useEscrow';
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  Lock, 
  Download,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/format';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { Alert, AlertDescription } from '../ui/Alert';

export function EscrowDashboard() {
  const { escrowId } = useParams<{ escrowId: string }>();
  const navigate = useNavigate();
  const { escrow, transactions, balanceBreakdown, isLoading, error } = useEscrow(escrowId);

  if (isLoading) {
    return <EscrowDashboardSkeleton />;
  }

  if (error || !escrow) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load escrow account. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Escrow Account</h1>
          <p className="text-gray-600 mt-1">
            Account #{escrow.escrowAccountNumber}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/escrow/${escrowId}/statements`)}
          >
            <Download className="w-4 h-4 mr-2" />
            Statements
          </Button>
          <Button
            onClick={() => navigate(`/escrow/${escrowId}/deposit`)}
            disabled={escrow.status === 'FROZEN' || escrow.status === 'CLOSED'}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Deposit
          </Button>
        </div>
      </div>

      {/* Status Alert */}
      {escrow.status === 'FROZEN' && (
        <Alert variant="warning">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            This escrow account is frozen. Contact support for more information.
          </AlertDescription>
        </Alert>
      )}

      {escrow.status === 'PENDING_DEPOSIT' && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Waiting for initial deposit of {formatCurrency(escrow.initialDepositAmount)}
          </AlertDescription>
        </Alert>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BalanceCard
          title="Current Balance"
          amount={balanceBreakdown?.currentBalance || escrow.currentBalance}
          icon={<CreditCard className="w-6 h-6" />}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
          description="Total funds in escrow"
        />
        <BalanceCard
          title="Available Balance"
          amount={balanceBreakdown?.availableBalance || escrow.availableBalance}
          icon={<CheckCircle className="w-6 h-6" />}
          iconColor="text-green-600"
          bgColor="bg-green-50"
          description="Ready for release"
        />
        <BalanceCard
          title="Held Balance"
          amount={balanceBreakdown?.heldBalance || escrow.heldBalance}
          icon={<Lock className="w-6 h-6" />}
          iconColor="text-amber-600"
          bgColor="bg-amber-50"
          description="Temporarily restricted"
        />
      </div>

      {/* Balance Breakdown Visual */}
      <Card>
        <CardHeader>
          <CardTitle>Balance Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <BalanceProgressBar
            available={escrow.availableBalance}
            held={escrow.heldBalance}
            total={escrow.currentBalance}
          />
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/escrow/${escrowId}/transactions`)}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <TransactionList transactions={transactions?.slice(0, 10) || []} />
        </CardContent>
      </Card>

      {/* Contract Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-600">Total Contract Amount</dt>
              <dd className="text-lg font-semibold text-gray-900 mt-1">
                {formatCurrency(escrow.totalContractAmount)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">Holdback Percentage</dt>
              <dd className="text-lg font-semibold text-gray-900 mt-1">
                {escrow.holdbackPercentage}%
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">Account Status</dt>
              <dd className="mt-1">
                <StatusBadge status={escrow.status} />
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">Created Date</dt>
              <dd className="text-lg font-semibold text-gray-900 mt-1">
                {formatDate(escrow.createdAt)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

// Sub-components
interface BalanceCardProps {
  title: string;
  amount: number;
  icon: React.ReactNode;
  iconColor: string;
  bgColor: string;
  description: string;
}

function BalanceCard({ title, amount, icon, iconColor, bgColor, description }: BalanceCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {formatCurrency(amount)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </div>
          <div className={`p-3 rounded-lg ${bgColor}`}>
            <div className={iconColor}>{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BalanceProgressBar({ available, held, total }: { available: number; held: number; total: number }) {
  const availablePercent = total > 0 ? (available / total) * 100 : 0;
  const heldPercent = total > 0 ? (held / total) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Available: {formatCurrency(available)}</span>
        <span className="text-gray-600">Held: {formatCurrency(held)}</span>
      </div>
      <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden flex">
        <div
          className="bg-green-500 h-full transition-all duration-300"
          style={{ width: `${availablePercent}%` }}
        />
        <div
          className="bg-amber-500 h-full transition-all duration-300"
          style={{ width: `${heldPercent}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{availablePercent.toFixed(1)}% available</span>
        <span>{heldPercent.toFixed(1)}% held</span>
      </div>
    </div>
  );
}

function TransactionList({ transactions }: { transactions: any[] }) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {transactions.map((tx) => (
        <div key={tx.id} className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getTransactionIconBg(tx.type)}`}>
              {getTransactionIcon(tx.type)}
            </div>
            <div>
              <p className="font-medium text-gray-900">{tx.description}</p>
              <p className="text-sm text-gray-600">
                {formatDate(tx.processedDate || tx.createdAt)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={`font-semibold ${getAmountColor(tx.type)}`}>
              {tx.type === 'RELEASE' || tx.type === 'REFUND' ? '-' : '+'}
              {formatCurrency(tx.amount)}
            </p>
            <TransactionStatusBadge status={tx.status} />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; variant: any }> = {
    PENDING_DEPOSIT: { label: 'Pending Deposit', variant: 'warning' },
    ACTIVE: { label: 'Active', variant: 'success' },
    FROZEN: { label: 'Frozen', variant: 'destructive' },
    CLOSED: { label: 'Closed', variant: 'secondary' },
  };

  const config = variants[status] || { label: status, variant: 'default' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function TransactionStatusBadge({ status }: { status: string }) {
  const variants: Record<string, any> = {
    PENDING: 'secondary',
    PROCESSING: 'warning',
    COMPLETED: 'success',
    FAILED: 'destructive',
    REVERSED: 'destructive',
  };

  return <Badge variant={variants[status] || 'default'} className="text-xs">{status}</Badge>;
}

function getTransactionIcon(type: string) {
  const icons: Record<string, React.ReactNode> = {
    DEPOSIT: <TrendingUp className="w-4 h-4 text-green-600" />,
    RELEASE: <TrendingDown className="w-4 h-4 text-red-600" />,
    REFUND: <TrendingDown className="w-4 h-4 text-blue-600" />,
    FEE: <CreditCard className="w-4 h-4 text-gray-600" />,
  };
  return icons[type] || <CreditCard className="w-4 h-4 text-gray-600" />;
}

function getTransactionIconBg(type: string) {
  const colors: Record<string, string> = {
    DEPOSIT: 'bg-green-50',
    RELEASE: 'bg-red-50',
    REFUND: 'bg-blue-50',
    FEE: 'bg-gray-50',
  };
  return colors[type] || 'bg-gray-50';
}

function getAmountColor(type: string) {
  if (type === 'DEPOSIT') return 'text-green-600';
  if (type === 'RELEASE' || type === 'REFUND') return 'text-red-600';
  return 'text-gray-900';
}

function EscrowDashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default EscrowDashboard;

