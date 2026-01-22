# Deposit Flow Components

Modern, multi-step deposit wizard for adding funds to escrow accounts.

## 🎯 Overview

The deposit flow is a 4-step wizard that guides users through:
1. **Payment Method Selection** - Choose or add a payment method
2. **Amount Entry** - Enter deposit amount with validation
3. **Confirmation** - Review all details before submitting
4. **Processing** - Real-time status updates with auto-redirect

---

## 📁 Component Structure

```
deposit/
├── DepositFlow.tsx              # Main orchestrator (step management)
├── PaymentMethodSelector.tsx    # Step 1: Payment method selection
├── AddPaymentMethodModal.tsx    # Modal for adding new methods
├── DepositAmountStep.tsx        # Step 2: Amount input
├── DepositConfirmation.tsx      # Step 3: Review and confirm
├── DepositProcessing.tsx        # Step 4: Processing status
├── index.ts                     # Component exports
└── README.md                    # This file
```

---

## 🎨 Components

### 1. DepositFlow (Main Orchestrator)

**Purpose**: Manages the 4-step deposit wizard state and navigation.

**Features**:
- Step management (payment-method → amount → confirm → processing)
- State persistence across steps
- Back button navigation
- Progress indicator
- Error recovery

**Usage**:
```tsx
import { DepositFlow } from '@/components/finance/deposit';

// In your route: /escrow/:escrowId/deposit
<DepositFlow />
```

**State Management**:
```typescript
const [currentStep, setCurrentStep] = useState<Step>('payment-method');
const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
const [amount, setAmount] = useState<number>(0);
const [depositId, setDepositId] = useState<string>('');
```

---

### 2. PaymentMethodSelector (Step 1)

**Purpose**: Display and select from saved payment methods.

**Features**:
- List all user's payment methods (cards, bank accounts)
- Visual selection with checkmark indicator
- Display processing time for each method
- Status badges (default, pending verification, failed)
- "Add New" button with modal trigger
- Disabled state for inactive methods

**Props**:
```typescript
interface PaymentMethodSelectorProps {
  onSelect: (paymentMethodId: string) => void;
  selectedId: string;
}
```

**Payment Method Display**:
- **Card**: `Visa •••• 4242` with expiry date
- **ACH**: `Chase Bank •••• 1234` with processing time
- **Wire**: `Wire Transfer` with 5-7 days notice

**Validation**:
- Must select an active payment method
- Pending verification methods show warning badge
- Failed methods are disabled

---

### 3. AddPaymentMethodModal

**Purpose**: Modal for adding new payment methods (Card or ACH).

**Features**:
- Tab selection between Card and ACH
- Card form:
  - Cardholder name
  - Card number (formatted with spaces)
  - Expiry date (MM/YY format)
  - CVC (3-4 digits)
- ACH form:
  - Account holder name
  - Routing number (9 digits)
  - Account number (masked input)
  - Microdeposit verification notice
- Real-time input formatting
- Security notice (Stripe encryption)
- Loading state during submission

**Props**:
```typescript
interface AddPaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (paymentMethodId: string) => void;
}
```

**Integration Points**:
```typescript
// Stripe Elements integration (placeholder in current implementation)
const mockStripePaymentMethodId = `pm_${Math.random().toString(36).substr(2, 9)}`;

// Real implementation would:
// 1. Use @stripe/stripe-js to create PaymentMethod
// 2. Get Stripe PaymentMethod ID
// 3. Send to backend via addPaymentMethod mutation
```

---

### 4. DepositAmountStep (Step 2)

**Purpose**: Enter and validate deposit amount.

**Features**:
- Large currency input with $ symbol
- Quick amount buttons ($100, $500, $1K, $5K, $10K)
- Real-time validation:
  - Min: $10
  - Max: $1,000,000
  - Cannot exceed escrow capacity
- Initial deposit requirement notice
- Balance preview:
  - Current balance
  - Deposit amount (+ green)
  - New balance (bold)
  - Remaining capacity
- Processing info alert

**Props**:
```typescript
interface DepositAmountStepProps {
  escrow: EscrowAgreement;
  onSubmit: (amount: number) => void;
  initialAmount?: number;
}
```

**Validation Logic**:
```typescript
// Check minimum
if (amountNum < 10) {
  setError('Minimum deposit amount is $10');
  return;
}

// Check maximum
if (amountNum > 1000000) {
  setError('Maximum deposit amount is $1,000,000');
  return;
}

// Check escrow capacity
const remainingCapacity = escrow.totalContractAmount - escrow.currentBalance;
if (amountNum > remainingCapacity) {
  setError(`Amount exceeds remaining escrow capacity (${formatCurrency(remainingCapacity)})`);
  return;
}
```

**Initial Deposit Handling**:
```typescript
const isInitialDeposit = escrow.currentBalance === 0 && escrow.initialDepositAmount > 0;

// Show alert if initial deposit requirement not met
{amountNum >= escrow.initialDepositAmount
  ? '✓ Amount meets requirement'
  : `You need to deposit at least ${formatCurrency(escrow.initialDepositAmount - amountNum)} more.`}
```

---

### 5. DepositConfirmation (Step 3)

**Purpose**: Final review before submitting deposit.

**Features**:
- Large amount display
- Payment method summary with icon
- Escrow account details:
  - Account number
  - Current balance
  - New balance (green)
- Fee breakdown:
  - Deposit amount
  - Processing fee (2.9% + $0.30)
  - Total charge
- Processing time notice
- Terms acceptance notice with links
- Back and Confirm buttons

**Props**:
```typescript
interface DepositConfirmationProps {
  amount: number;
  paymentMethodId: string;
  escrow: EscrowAgreement;
  onConfirm: () => void;
  onBack: () => void;
}
```

**Fee Calculation**:
```typescript
const platformFee = amount * 0.029 + 0.30; // Stripe typical fee
const totalCharge = amount + platformFee;
```

**Processing Time**:
- **Card**: Instant authorization, 1-2 days clearing
- **ACH**: 3-5 business days
- **Wire**: 5-7 business days

---

### 6. DepositProcessing (Step 4)

**Purpose**: Real-time deposit status with auto-refresh.

**Features**:
- Status-specific UI:
  - **Pending**: Loading spinner
  - **Processing**: Progress checklist with real-time updates
  - **Clearing**: Success with countdown
  - **Completed**: Success with confetti and auto-redirect
  - **Failed**: Error with retry options
- Auto-refresh polling (3-second interval) via React Query
- Auto-redirect countdown (5 seconds) on success
- Detailed error messages with next steps
- Manual return to dashboard button

**Props**:
```typescript
interface DepositProcessingProps {
  depositId: string;
  onComplete: () => void;
}
```

**Status Polling**:
```typescript
const { data: deposit, isLoading, error } = useDepositStatus(depositId);

// useDepositStatus hook auto-polls every 3 seconds if processing
refetchInterval: (data) => {
  return data?.status === 'PROCESSING' || data?.status === 'CLEARING' ? 3000 : false;
}
```

**Status Flow**:
```
PENDING → PROCESSING → CLEARING → COMPLETED
                     ↓
                   FAILED
```

**Auto-Redirect**:
```typescript
useEffect(() => {
  if (deposit?.status === 'COMPLETED' || deposit?.status === 'CLEARING') {
    const interval = setInterval(() => {
      setAutoRedirectSeconds((prev) => {
        if (prev <= 1) {
          onComplete(); // Navigate to dashboard
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }
}, [deposit?.status]);
```

**Failed Deposit Handling**:
- Display failure reason
- Show failure code
- Provide troubleshooting steps:
  - Check sufficient funds
  - Verify payment details
  - Try different method
  - Contact bank
- Retry button (reloads flow)

---

## 🔄 Data Flow

```
DepositFlow (State Manager)
    ↓
PaymentMethodSelector → usePaymentMethods() → paymentApi.getPaymentMethods()
    ↓
DepositAmountStep (Validation)
    ↓
DepositConfirmation (Review)
    ↓
DepositFlow → useDeposit() → depositApi.createDeposit()
    ↓
DepositProcessing → useDepositStatus() → depositApi.getDeposit() [polling]
    ↓
Navigate to Dashboard
```

---

## 🎯 Key Features

### 1. Progressive Validation
- Payment method: Must be active
- Amount: Min $10, max $1M, within capacity
- Confirmation: Review before submit
- Processing: Real-time status

### 2. User Guidance
- Progress indicator shows current step
- Back button for easy navigation
- Quick amount buttons for convenience
- Balance preview before confirmation
- Processing time notices

### 3. Error Handling
- Input validation with clear messages
- Failed payment recovery flow
- Network error retry
- Payment method verification status

### 4. Real-Time Updates
- Auto-refresh deposit status
- Polling every 3 seconds while processing
- Auto-redirect on success
- Manual refresh option

### 5. Security
- Stripe-powered payment processing
- PCI DSS compliant (no card storage)
- Encrypted communication
- Terms acceptance required

---

## 📊 Payment Method Types

### Credit/Debit Cards
- **Brands**: Visa, Mastercard, Amex, Discover
- **Processing**: Instant authorization
- **Clearing**: 1-2 business days
- **Fees**: 2.9% + $0.30
- **Display**: `Visa •••• 4242`

### ACH (Bank Transfer)
- **Types**: Checking, Savings
- **Processing**: 3-5 business days
- **Verification**: Microdeposits (1-2 days)
- **Fees**: Lower than cards (0.8% capped)
- **Display**: `Chase Bank •••• 1234`

### Wire Transfer
- **Processing**: 5-7 business days
- **Fees**: Varies by bank
- **Use Case**: Large deposits (> $10K)
- **Display**: `Wire Transfer`

---

## 🧪 Testing Scenarios

### Happy Path
1. Select payment method → ✅
2. Enter $1,000 → ✅
3. Confirm → ✅
4. Processing → COMPLETED → ✅
5. Auto-redirect to dashboard → ✅

### Error Scenarios
- **No payment methods**: Show "Add Payment Method" prompt
- **Inactive payment method**: Disable selection, show badge
- **Amount below $10**: Validation error
- **Amount exceeds capacity**: Validation error
- **Initial deposit not met**: Warning alert
- **Failed payment**: Show error, offer retry
- **Network timeout**: Show error, manual return

### Edge Cases
- **Back button during processing**: Disabled
- **Refresh during processing**: Resume with depositId
- **Multiple payment methods**: Show all, highlight default
- **Pending verification**: Show warning badge
- **Expired card**: Show in red, prevent selection

---

## 🔐 Security Considerations

1. **PCI DSS Compliance**:
   - Never store raw card numbers
   - Use Stripe Elements for card input
   - Tokenize before sending to backend

2. **Data Validation**:
   - Client-side validation (UX)
   - Server-side validation (security)
   - Zod schemas on backend

3. **Authentication**:
   - User must be authenticated
   - Payment methods scoped to user
   - Escrow access verified on backend

4. **Fraud Prevention**:
   - Amount limits ($10 min, $1M max)
   - Velocity checks on backend
   - Risk scoring with Stripe Radar

---

## 🚀 Usage Example

```tsx
// app/escrow/[escrowId]/deposit/page.tsx
import { DepositFlow } from '@/components/finance/deposit';

export default function DepositPage() {
  return (
    <div className="container mx-auto">
      <DepositFlow />
    </div>
  );
}
```

**Routing**:
```
/escrow/esc-123/deposit → DepositFlow
  → Step 1: Payment Method Selection
  → Step 2: Amount Entry
  → Step 3: Confirmation
  → Step 4: Processing
  → Redirect to /escrow/esc-123 (dashboard)
```

---

## 📦 Dependencies

```json
{
  "@tanstack/react-query": "^5.x",
  "react-router-dom": "^6.x",
  "lucide-react": "^0.x",
  "@stripe/stripe-js": "^2.x" // For real Stripe integration
}
```

---

## 🎨 Styling

Uses Tailwind CSS with the design system:
- **Colors**: Blue (primary), Green (success), Red (error), Amber (warning)
- **Spacing**: Consistent with Card padding (p-6)
- **Typography**: Semibold headings, medium labels
- **Animations**: Fade-in for steps, pulse for loading

---

## 🔮 Future Enhancements

- [ ] **Stripe Elements Integration**: Replace mock with real Stripe.js
- [ ] **Saved Amounts**: Remember user's common deposit amounts
- [ ] **Recurring Deposits**: Schedule automatic deposits
- [ ] **Multiple Currencies**: Support EUR, GBP, CAD
- [ ] **Split Payments**: Pay with multiple methods
- [ ] **Invoice Upload**: Attach invoice to deposit
- [ ] **Mobile App**: React Native version
- [ ] **Accessibility**: WCAG AAA compliance

---

## 🐛 Troubleshooting

**Issue**: Payment method not showing  
**Solution**: Check `usePaymentMethods()` returns data, verify API endpoint

**Issue**: Deposit stuck in PROCESSING  
**Solution**: Check polling interval, verify webhook configuration

**Issue**: Validation errors not showing  
**Solution**: Ensure error state is set, check Alert component rendering

**Issue**: Auto-redirect not working  
**Solution**: Verify `useEffect` dependencies, check `navigate()` function

---

Built with ❤️ for the Kealee Platform Finance & Trust Hub

