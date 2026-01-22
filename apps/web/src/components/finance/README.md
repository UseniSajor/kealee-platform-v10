# Finance & Escrow UI Components

Modern, production-ready React components for the Kealee Platform's Finance & Trust Hub.

## 📁 Component Structure

```
finance/
├── EscrowDashboard.tsx      # Main escrow account overview
├── DepositForm.tsx           # Multi-step deposit creation
├── TransactionHistory.tsx    # Searchable transaction list
├── StatementViewer.tsx       # PDF statement viewer
└── index.ts                  # Component exports
```

## 🎨 Components

### EscrowDashboard

**Purpose**: Main landing page for escrow account management.

**Features**:
- Real-time balance display (current, available, held)
- Visual balance breakdown with progress bar
- Recent transactions list (last 10)
- Contract summary with key details
- Status-aware alerts (frozen, pending deposit)
- Quick actions (add deposit, view statements)

**Usage**:
```tsx
import { EscrowDashboard } from '@/components/finance';

// In your route: /escrow/:escrowId
<EscrowDashboard />
```

**Data Dependencies**:
- `useEscrow(escrowId)` - Fetches escrow agreement, transactions, balance

**Key Features**:
- Mobile responsive grid layout
- Color-coded transaction types
- Disabled states for frozen accounts
- Empty state handling

---

### DepositForm

**Purpose**: 3-step wizard for creating escrow deposits.

**Features**:
- **Step 1: Amount Entry**
  - Manual input with validation ($10 min, $1M max)
  - Quick amount buttons ($100, $500, $1K, $5K)
  - Balance preview
  
- **Step 2: Payment Method**
  - Radio selection of saved methods
  - Card/ACH support with icons
  - "Add New" button with redirect
  - Verification status badges

- **Step 3: Confirmation**
  - Review all details
  - Clear amount display
  - Payment method summary
  - Processing indicator

**Usage**:
```tsx
import { DepositForm } from '@/components/finance';

// In your route: /escrow/:escrowId/deposit
<DepositForm />
```

**Data Dependencies**:
- `useEscrow(escrowId)` - Escrow details
- `usePaymentMethods()` - User's payment methods
- `useDeposit()` - Deposit creation mutation

**Validation**:
- Amount must be numeric and > $10
- Payment method must be selected
- Escrow cannot be frozen or closed

---

### TransactionHistory

**Purpose**: Complete transaction history with filtering and export.

**Features**:
- Search by description/reference
- Filter by type (deposit, release, refund, fee)
- Filter by status (pending, processing, completed, failed)
- Sort by date or amount (ascending/descending)
- CSV export functionality
- Summary cards (total deposits, releases, fees, net change)
- Expandable transaction details
- Pagination support

**Usage**:
```tsx
import { TransactionHistory } from '@/components/finance';

// In your route: /escrow/:escrowId/transactions
<TransactionHistory />
```

**Data Dependencies**:
- `useQuery` with `accountingApi.getEscrowTransactions(escrowId)`

**Export Format**:
```csv
Date,Type,Description,Amount,Status,Reference
Jan 15 2026,DEPOSIT,Initial Deposit,5000.00,COMPLETED,DEP-2026-00001
```

---

### StatementViewer

**Purpose**: Browse and download account statements.

**Features**:
- Statement list with type badges (monthly, quarterly, custom)
- PDF preview in iframe
- Download button for local save
- Email statement option
- Status tracking (generated, sent, viewed)
- Custom statement generator link
- Statement metadata display

**Usage**:
```tsx
import { StatementViewer } from '@/components/finance';

// In your route: /escrow/:escrowId/statements
<StatementViewer />
```

**Data Dependencies**:
- `useQuery` with `accountingApi.getStatements(escrowId)`

**Statement Types**:
- `MONTHLY`: Auto-generated on 1st of month
- `QUARTERLY`: Q1, Q2, Q3, Q4 summaries
- `ANNUAL`: Year-end statement
- `CUSTOM`: User-generated for specific date range

---

## 🔧 Supporting Infrastructure

### API Clients (`/api`)

**accounting.api.ts**:
- `getEscrow()`, `getEscrowTransactions()`, `getEscrowBalance()`
- `getStatements()`, `sendStatement()`, `downloadStatement()`
- `getCashFlowReport()`, `getProfitLossReport()`, etc.

**escrow.api.ts**:
- `getEscrow()`, `getEscrowByContract()`, `listEscrows()`
- `placeEscrowHold()`, `releaseHold()`, `processRefund()`

**deposit.api.ts**:
- `createDeposit()`, `getDeposit()`, `getDepositHistory()`
- `processDeposit()`, `retryDeposit()`, `cancelDeposit()`

**payment.api.ts**:
- `getPaymentMethods()`, `addPaymentMethod()`, `removePaymentMethod()`
- `setDefaultPaymentMethod()`, `verifyPaymentMethod()`

### Custom Hooks (`/hooks`)

**useEscrow.ts**:
```tsx
const { 
  escrow,              // EscrowAgreement
  transactions,        // EscrowTransaction[]
  balanceBreakdown,    // BalanceBreakdown
  isLoading,
  error,
  placeHold,           // (data) => Promise<EscrowHold>
  isPlacingHold
} = useEscrow(escrowId);
```

**useDeposit.ts**:
```tsx
const { 
  createDeposit,       // (data) => Promise<DepositRequest>
  processDeposit,      // (id) => void
  retryDeposit,        // (id) => void
  isCreating,
  isProcessing,
  isRetrying
} = useDeposit();
```

**usePaymentMethods.ts**:
```tsx
const { 
  paymentMethods,      // PaymentMethod[]
  isLoading,
  addPaymentMethod,    // (data) => Promise<PaymentMethod>
  removePaymentMethod, // (id) => void
  setDefault,          // (id) => void
  isAdding,
  isRemoving
} = usePaymentMethods();
```

### UI Components (`/components/ui`)

Modern, accessible components following shadcn/ui patterns:

- **Button**: Variants (default, outline, ghost, link, destructive), sizes (sm, default, lg)
- **Card**: CardHeader, CardTitle, CardContent, CardFooter
- **Input**: Standard text input with focus states
- **Label**: Form labels with proper associations
- **Badge**: Status indicators with color variants
- **Alert**: Contextual messages (default, success, warning, destructive)
- **Skeleton**: Loading placeholders with pulse animation
- **Select**: Dropdown with keyboard navigation
- **RadioGroup**: Grouped radio buttons
- **Separator**: Horizontal/vertical dividers

### Utilities (`/utils`)

**format.ts**:
```tsx
formatCurrency(amount: number, currency = 'USD'): string
// 5000 → "$5,000.00"

formatDate(date: Date | string): string
// 2026-01-15 → "Jan 15, 2026"

formatDateTime(date: Date | string): string
// 2026-01-15T14:30 → "Jan 15, 2026, 2:30 PM"
```

---

## 🎯 Key Features

### Real-Time Updates
Components use React Query for automatic cache invalidation and refetching:
```tsx
// Deposits invalidate escrow queries
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['escrow', escrowId] });
}
```

### Error Handling
Graceful error states with user-friendly messages:
```tsx
if (error) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>Failed to load. Try again.</AlertDescription>
    </Alert>
  );
}
```

### Loading States
Skeleton screens match content structure:
```tsx
if (isLoading) return <EscrowDashboardSkeleton />;
```

### Mobile Responsive
Tailwind classes adapt to screen size:
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Cards stack on mobile, 3 columns on desktop */}
</div>
```

### Accessibility
- ARIA labels and roles
- Keyboard navigation support
- Focus management in modals
- Screen reader-friendly status updates

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
# Ensure you have these installed
npm install @tanstack/react-query axios react-router-dom lucide-react sonner
```

### 2. Configure API Base URL

```typescript
// .env.local
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Wrap App with Query Client

```tsx
// app/layout.tsx or _app.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function RootLayout({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### 4. Add Routes

```tsx
// app/routes
<Route path="/escrow/:escrowId" element={<EscrowDashboard />} />
<Route path="/escrow/:escrowId/deposit" element={<DepositForm />} />
<Route path="/escrow/:escrowId/transactions" element={<TransactionHistory />} />
<Route path="/escrow/:escrowId/statements" element={<StatementViewer />} />
```

### 5. Add Tailwind Config

```js
// tailwind.config.js
module.exports = {
  content: [
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
  ],
  // ... rest of config
}
```

---

## 🧪 Testing Checklist

- [ ] Load escrow dashboard with valid ID
- [ ] Handle missing escrow (404)
- [ ] Deposit form validation (min/max amounts)
- [ ] Payment method selection and persistence
- [ ] Transaction filtering and search
- [ ] CSV export functionality
- [ ] Statement PDF preview and download
- [ ] Mobile responsive layouts
- [ ] Keyboard navigation
- [ ] Loading states and error handling

---

## 🔐 Security Considerations

1. **Authentication**: All API calls include auth token from localStorage
2. **Authorization**: Backend validates user access to escrow accounts
3. **Input Validation**: Client-side validation + backend Zod schemas
4. **XSS Protection**: React's automatic escaping of user input
5. **CSRF**: withCredentials: true for cookie-based auth

---

## 📊 Performance

- **Code Splitting**: Each component can be lazy-loaded
- **React Query Caching**: Reduces redundant API calls
- **Optimistic Updates**: Immediate UI feedback on mutations
- **Pagination**: Large transaction lists load incrementally
- **Debounced Search**: Prevents excessive API calls

---

## 🎨 Design System

### Colors
- **Primary**: Blue 600 (#2563EB)
- **Success**: Green 600 (#16A34A)
- **Warning**: Amber 600 (#D97706)
- **Destructive**: Red 600 (#DC2626)
- **Gray**: Gray 50-900 scale

### Typography
- **Headings**: Semibold, tracking-tight
- **Body**: Regular, gray-900
- **Labels**: Medium, gray-600
- **Code**: Mono font family

### Spacing
- **Containers**: p-6 (24px padding)
- **Cards**: gap-6 (24px between cards)
- **Inline**: gap-3 (12px between buttons)

---

## 🐛 Troubleshooting

**Issue**: "Module not found: @tanstack/react-query"
- **Solution**: `npm install @tanstack/react-query`

**Issue**: Tailwind classes not applying
- **Solution**: Add component paths to tailwind.config.js content array

**Issue**: "localStorage is not defined" (Next.js SSR)
- **Solution**: Already handled with `typeof window !== 'undefined'` check

**Issue**: CORS errors on API calls
- **Solution**: Configure backend CORS to allow your frontend origin

---

## 📚 Next Steps

- [ ] Add Stripe Elements for direct card entry
- [ ] Implement WebSocket for real-time balance updates
- [ ] Add analytics tracking (Mixpanel, GA)
- [ ] Build admin hold management UI
- [ ] Create dispute filing component
- [ ] Add lien waiver viewer
- [ ] Implement custom report builder UI

---

## 🤝 Contributing

These components follow the modern React + TypeScript patterns established in the Kealee Platform. When adding new features:

1. Use TypeScript for all files
2. Follow existing naming conventions
3. Add proper error handling and loading states
4. Ensure mobile responsiveness
5. Test with various data states (empty, loading, error, success)
6. Update this README with new components

---

Built with ❤️ for the Kealee Platform

