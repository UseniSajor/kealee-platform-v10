# Critical Build Fixes Needed

## Import Path Fixes (COMPLETED)
- ✅ Fixed `auth.middleware.ts` prisma-helper import path
- ✅ Fixed route files to import from `../middleware/auth.middleware` instead of `../modules/auth/auth.middleware`
- ✅ Fixed validation.middleware import paths in route files

## Remaining Critical Errors

### 1. Stripe API Type Errors
- `billing.service.ts`: `current_period_start`, `current_period_end` don't exist on `Response<Subscription>`
- `billing.service.ts`: `payment_intent` doesn't exist on `Invoice`
- `billing.service.ts`: Invoice list status type error
- `milestone-payment.service.ts`: `charges` doesn't exist on `Response<PaymentIntent>`
- `stripe.webhook.ts`: `last_payment_error` doesn't exist on `Invoice`
- `webhook-testing.utils.ts`: Various Stripe type mismatches

### 2. Prisma Type Errors
- Missing fields: `request`, `ownerId`, `memberships`, `readinessItems` on Project
- Missing `permitApplication` model (should be `permit`)
- Missing `escrowAccount` model
- Missing fields on Task: `createdBy`, `user` relation
- Missing fields on TaskComment: `message`, `user` relation
- Missing fields on Client: `_count`, `pmId` on AssignmentRequest
- Missing fields on Permit: `documents`, `status`, `projectData`
- Missing fields on Report: `period`, `userId`, `hoursLogged`

### 3. Zod Schema Type Errors
- `file.routes.ts`: Transform output type mismatch
- `pm-approval.routes.ts`: Transform output type mismatch for `page` and `limit`

### 4. Email Service Error
- `email.service.ts`: Missing `react` property in Resend API call

### 5. Other Type Errors
- `payment-webhook.service.ts`: `null` not assignable to `string | undefined`
- `payment.routes.ts`: `Date` not assignable to `string`
- `unified-payment.service.ts`: `Date` not assignable to `string`
- `webhook-status.routes.ts`: FastifyRequest type mismatches
- `compliance-gates.routes.ts`: Missing properties on types
- `api-client`: Missing `@kealee/auth` module, `HeadersInit` type

