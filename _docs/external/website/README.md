# Kealee Development Website

A production-ready marketing website for Kealee Development - Owner's Representative & Development Advisory services.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** components
- **react-hook-form** + **zod** validation
- **Resend** or **SendGrid** for email delivery

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your email provider credentials:

**For Resend (recommended):**
```
EMAIL_PROVIDER=RESEND
RESEND_API_KEY=your_resend_api_key
EMAIL_TO=getstarted@kealee.com
EMAIL_FROM=noreply@yourdomain.com
```

**For SendGrid:**
```
EMAIL_PROVIDER=SENDGRID
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_TO=getstarted@kealee.com
EMAIL_FROM=noreply@yourdomain.com
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
npm run build
npm start
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

The site is optimized for Vercel deployment with automatic builds and previews.

## Project Structure

```
kealee-website/
├── app/
│   ├── (pages)/
│   │   ├── services/
│   │   ├── how-it-works/
│   │   ├── experience/
│   │   └── contact/
│   ├── api/
│   │   └── intake/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/           # shadcn/ui components
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── ...
├── lib/
│   └── utils.ts
├── public/
│   └── kealee-development-1pager.pdf
└── data/
    └── leads.json    # Development-only lead storage
```

## Features

- 🎨 Modern, clean design with deep rustic orange accent
- 📱 Fully responsive (mobile-first)
- ♿ Accessible components
- 📧 Lead intake with email delivery
- 🔒 Spam protection (honeypot + timing)
- 📄 SEO optimized with metadata
- 🚀 Fast performance
- 📊 Lead storage in development mode

## Pages

1. **Home** - Hero, services overview, tiers, FAQ
2. **Services** - Detailed tier breakdown
3. **How It Works** - 4-step process
4. **Experience** - Capabilities and case snapshots
5. **Contact** - Lead intake form

## Lead Intake

The contact form includes:
- Full validation with zod
- Spam protection (honeypot + minimum submission time)
- Email delivery to getstarted@kealee.com
- Local JSON storage in development
- File upload UI (instructs to email separately)

## License

© 2026 Kealee Development. All rights reserved.
