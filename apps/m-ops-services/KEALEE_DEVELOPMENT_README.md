# Kealee Development Website

Production-ready marketing website for **Kealee Development** - Owner's Representative & Development Advisory services.

## Overview

This is a complete Next.js 14 website built within the `m-ops-services` app featuring:

- 5 marketing pages (Home, Services, How It Works, Experience, Contact)
- Full intake form with validation and spam protection
- Email notifications (Resend or SendGrid)
- Lead storage in development mode
- Responsive design with Tailwind CSS
- shadcn/ui components
- SEO optimization with metadata and sitemap

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + custom components
- **Form Handling**: react-hook-form + zod validation
- **Icons**: lucide-react
- **Email**: Resend or SendGrid (configurable)

## Project Structure

```
apps/m-ops-services/
├── app/
│   ├── (marketing)/
│   │   └── development/
│   │       ├── layout.tsx           # Layout with header/footer
│   │       ├── page.tsx             # Home page
│   │       ├── services/
│   │       │   └── page.tsx         # Services page
│   │       ├── how-it-works/
│   │       │   └── page.tsx         # How It Works page
│   │       ├── experience/
│   │       │   └── page.tsx         # Experience page
│   │       └── contact/
│   │           └── page.tsx         # Contact page
│   ├── api/
│   │   └── intake/
│   │       └── route.ts             # Intake form API handler
│   ├── sitemap.ts                   # Sitemap generation
│   └── robots.ts                    # Robots.txt generation
├── components/
│   ├── development/
│   │   ├── Header.tsx               # Sticky header with nav
│   │   ├── Footer.tsx               # Footer with links
│   │   ├── IntakeFormModal.tsx      # Modal intake form
│   │   ├── ServiceTiers.tsx         # Service tier cards
│   │   ├── ProcessSteps.tsx         # 4-step process
│   │   └── FAQSection.tsx           # FAQ accordion
│   └── ui/                          # shadcn/ui components
│       ├── input.tsx
│       ├── textarea.tsx
│       ├── select.tsx
│       ├── checkbox.tsx
│       ├── accordion.tsx
│       ├── dialog.tsx
│       └── ... (other components)
├── lib/
│   └── validations/
│       └── intake.ts                # Zod schema for intake form
├── public/
│   └── kealee-development-1pager.pdf  # Placeholder PDF
├── data/                            # Created at runtime in dev
│   └── leads.json                   # Lead storage (dev only)
└── .env.example                     # Environment variables template
```

## Installation & Setup

### 1. Install Dependencies

From the workspace root:

```bash
pnpm install
```

This will install the new dependencies added to `m-ops-services/package.json`:
- `react-hook-form`
- `@hookform/resolvers`
- `zod`

### 2. Configure Environment Variables

Copy the example env file and configure:

```bash
cd apps/m-ops-services
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Email Provider: 'resend', 'sendgrid', or 'console' (for dev)
EMAIL_PROVIDER=console

# If using Resend:
RESEND_API_KEY=your_resend_api_key_here

# If using SendGrid:
SENDGRID_API_KEY=your_sendgrid_api_key_here

NODE_ENV=development
```

**Email Provider Options:**

- `console` (default): Logs emails to console - perfect for development
- `resend`: Uses Resend API (sign up at https://resend.com)
- `sendgrid`: Uses SendGrid API (sign up at https://sendgrid.com)

### 3. Run Development Server

```bash
cd apps/m-ops-services
pnpm dev
```

Visit: http://localhost:3005/development

### 4. Replace Placeholder Assets

**1-Pager PDF:**

Replace the placeholder PDF with your actual marketing collateral:

```bash
# Location: apps/m-ops-services/public/kealee-development-1pager.pdf
```

The file should be a professional PDF showcasing Kealee Development services.

## Features

### Intake Form

The contact form includes:

**Required Fields:**
- Full Name
- Company / Organization
- Email
- Role (dropdown)
- Location
- Asset Type (dropdown)
- Units (or N/A for non-unit-based)
- Project Stage
- Budget Range
- Timeline
- Areas of Need (multi-select)
- Project Summary
- Consent checkbox

**Spam Protection:**
- Honeypot field (invisible to users)
- Minimum time-to-submit check (3 seconds)
- Server-side validation with Zod

**Lead Storage:**
- In development: saves to `data/leads.json` file
- In production: only sends email (no file storage)

### Email Notifications

When a form is submitted, an email is sent to `getstarted@kealee.com` with:
- Contact information
- Project details
- Areas of need
- Project summary

**Toggle Email Providers:**

Set `EMAIL_PROVIDER` in `.env.local`:

```env
EMAIL_PROVIDER=console   # Development: logs to console
EMAIL_PROVIDER=resend    # Production: sends via Resend
EMAIL_PROVIDER=sendgrid  # Production: sends via SendGrid
```

### Pages

1. **Home** (`/development`)
   - Hero with CTAs
   - What We Do section
   - Who We Serve
   - Service Tiers preview
   - Process Steps preview
   - Case Snapshots
   - FAQ
   - Final CTA

2. **Services** (`/development/services`)
   - Service tier cards
   - Detailed tier breakdown
   - Pricing and deliverables

3. **How It Works** (`/development/how-it-works`)
   - 4-step process
   - Detailed process explanation
   - Monthly deliverables
   - Reporting cadence

4. **Experience** (`/development/experience`)
   - Core capabilities
   - Industry experience
   - Case snapshots
   - Professional background

5. **Contact** (`/development/contact`)
   - Full intake form
   - Contact information sidebar
   - What to expect

## SEO & Metadata

Each page includes:
- Title and description
- Keywords (where applicable)
- OpenGraph tags (inherited from root layout)

**Sitemap:**
- Generated at `/sitemap.xml`
- Includes all development pages

**Robots.txt:**
- Generated at `/robots.txt`
- Allows indexing of development pages
- Disallows portal and auth pages

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `EMAIL_PROVIDER=resend` (or `sendgrid`)
   - `RESEND_API_KEY=your_key` (or `SENDGRID_API_KEY`)
   - `NODE_ENV=production`

3. Deploy:

```bash
vercel --prod
```

### Environment Variables for Production

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://kealee.com
```

## API Endpoints

### POST /api/intake

Handles intake form submissions.

**Request Body:**
```json
{
  "fullName": "John Smith",
  "company": "ABC Development",
  "email": "john@example.com",
  "role": "Developer",
  "location": "Austin, TX",
  "assetType": "Multifamily",
  "units": "48",
  "projectStage": "Permitting",
  "budgetRange": "$5–15M",
  "timeline": "3–6 mo",
  "needsHelp": ["Feasibility", "GC procurement"],
  "message": "We need help with...",
  "consent": true,
  "submittedAt": 1234567890
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Your project review request has been submitted successfully..."
}
```

**Response (Error):**
```json
{
  "error": "Validation failed",
  "details": [...]
}
```

## Customization

### Colors

The design uses a neutral palette with orange accent. To change:

**Accent Color:**
- Edit Tailwind classes: `bg-orange-600`, `text-orange-600`, etc.
- Global search/replace in components

**Card Backgrounds:**
- Currently: `bg-gray-50`
- Change in component files

### Typography

Current: Default sans-serif with clear hierarchy

To customize:
1. Add font to `app/layout.tsx`
2. Update Tailwind config
3. Apply font classes

### Content

All content is hardcoded in page files. To update:
- Edit page files in `app/(marketing)/development/`
- Update copy while maintaining structure

## Lead Management

### Development Mode

Leads are saved to `data/leads.json`:

```json
[
  {
    "id": "lead_1234567890_abc123",
    "timestamp": "2026-02-06T...",
    "fullName": "John Smith",
    "company": "ABC Development",
    ...
  }
]
```

The file is created automatically on first submission.

### Production Mode

Leads are **not** saved to file. Only email notifications are sent.

To add database storage:
1. Create a Prisma model for leads
2. Update `/api/intake/route.ts` to save to database
3. Remove file storage logic

## Testing

### Test the Intake Form

1. Run dev server
2. Navigate to `/development/contact`
3. Fill out form
4. Submit and verify:
   - Success message appears
   - Email logged to console (if `EMAIL_PROVIDER=console`)
   - Lead saved to `data/leads.json`

### Test Spam Protection

1. Try submitting immediately (< 3 seconds) - should fail
2. Try filling honeypot field - should fail
3. Try submitting without consent - should fail

## Troubleshooting

### Form Not Submitting

Check:
1. All required fields filled
2. Valid email format
3. Consent checkbox checked
4. Browser console for errors

### Email Not Sending

Check:
1. `EMAIL_PROVIDER` set correctly in `.env.local`
2. API key valid and not expired
3. Email provider domain verified (Resend/SendGrid)
4. Check server logs for errors

### 404 on Pages

Ensure:
1. Next.js dev server running
2. Visiting correct URL: `/development` (not `/developments`)
3. No build errors in console

## Support

For issues or questions:
- Email: getstarted@kealee.com
- Check Next.js 14 documentation
- Review error logs in terminal

## License

Proprietary - Kealee Services
