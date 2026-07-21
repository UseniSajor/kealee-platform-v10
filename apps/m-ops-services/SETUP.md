# Quick Setup Guide - Kealee Development Website

## 🚀 Quick Start (5 minutes)

### 1. Install Dependencies

From the workspace root:

```bash
pnpm install
```

### 2. Set Up Environment

```bash
cd apps/m-ops-services
cp .env.example .env.local
```

Edit `.env.local` - for development, keep it simple:

```env
EMAIL_PROVIDER=console
NODE_ENV=development
```

This will log emails to your terminal instead of sending them.

### 3. Run the Dev Server

```bash
pnpm dev
```

### 4. Visit the Website

Open your browser to: **http://localhost:3005/development**

That's it! 🎉

## 📋 Test the Intake Form

1. Navigate to http://localhost:3005/development/contact
2. Fill out the form with test data
3. Submit the form
4. Check your terminal - you should see the email content logged
5. Check `apps/m-ops-services/data/leads.json` - your test lead is saved there

## 📧 Set Up Email (Optional - For Production)

### Option 1: Resend (Recommended)

1. Sign up at https://resend.com (free tier available)
2. Get your API key
3. Update `.env.local`:

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your_actual_key_here
```

4. Verify your sending domain in Resend dashboard

### Option 2: SendGrid

1. Sign up at https://sendgrid.com
2. Get your API key
3. Update `.env.local`:

```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your_actual_key_here
```

4. Verify your sending domain in SendGrid dashboard

## 🎨 Customize Content

All page content is in:

- `app/(marketing)/development/page.tsx` - Home page
- `app/(marketing)/development/services/page.tsx` - Services
- `app/(marketing)/development/how-it-works/page.tsx` - How It Works
- `app/(marketing)/development/experience/page.tsx` - Experience
- `app/(marketing)/development/contact/page.tsx` - Contact

Edit these files to update copy, pricing, case studies, etc.

## 📄 Replace the 1-Pager PDF

Replace this placeholder file with your actual PDF:

```
public/kealee-development-1pager.pdf
```

The download button is in the header and on the home page.

## 🚢 Deploy to Vercel

1. Push your code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard:
   - `EMAIL_PROVIDER=resend`
   - `RESEND_API_KEY=your_key`
   - `NODE_ENV=production`
   - `NEXT_PUBLIC_BASE_URL=https://yourdomain.com`

4. Deploy!

## 📊 View Submitted Leads

In development, leads are saved to:

```
apps/m-ops-services/data/leads.json
```

Each lead includes:
- Unique ID
- Timestamp
- All form data

In production, leads are only emailed (no file storage).

## 🎯 Pages Overview

- **/development** - Home page with hero, services overview, FAQ
- **/development/services** - Detailed service tiers and pricing
- **/development/how-it-works** - Process and methodology
- **/development/experience** - Case studies and background
- **/development/contact** - Intake form

## 🆘 Troubleshooting

**Form not submitting?**
- Check browser console for errors
- Verify all required fields are filled
- Make sure consent checkbox is checked

**Email not sending?**
- Check `.env.local` has correct provider and API key
- Verify API key is active in provider dashboard
- Check terminal logs for error messages

**Pages showing 404?**
- Make sure dev server is running: `pnpm dev`
- Navigate to `/development` (with the `/`)

**TypeScript errors?**
- Run `pnpm install` to ensure all deps are installed
- Restart your IDE/editor

## 📚 Full Documentation

See `KEALEE_DEVELOPMENT_README.md` for complete documentation including:
- Full project structure
- API documentation
- Advanced customization
- Production deployment details

## ✅ Checklist Before Launch

- [ ] Dependencies installed (`pnpm install`)
- [ ] Environment variables configured
- [ ] Replaced placeholder 1-pager PDF
- [ ] Updated content in all pages
- [ ] Tested intake form submission
- [ ] Verified email delivery
- [ ] Checked mobile responsiveness
- [ ] Tested all internal links
- [ ] SEO metadata reviewed
- [ ] Deployed to staging environment
- [ ] Final QA testing
- [ ] Production deployment

---

**Questions?** Email getstarted@kealee.com
