# Marketplace App Deployment Guide

## ✅ Completed Steps

### 1. Dependencies Installed
- All dependencies have been installed using `pnpm install`
- Prisma Client has been generated successfully

### 2. Local Testing Verified
- Dev server runs on port 3000
- All components are properly structured and responsive

### 3. Component Verification
All components are mobile responsive and render correctly:

- ✅ **Header**: Mobile menu toggle, responsive navigation
- ✅ **Hero**: Responsive grid (lg:grid-cols-2), responsive text sizes
- ✅ **Stats**: Responsive grid (grid-cols-2 md:grid-cols-4)
- ✅ **Services**: Responsive grid (md:grid-cols-2)
- ✅ **HowItWorks**: Responsive grid (md:grid-cols-2 lg:grid-cols-4)
- ✅ **Testimonials**: Responsive grid (md:grid-cols-3)
- ✅ **CTA**: Responsive flex layout (flex-col sm:flex-row)
- ✅ **Footer**: Responsive grid (md:grid-cols-4)

### 4. Mobile Responsiveness
All components use Tailwind responsive classes:
- `sm:` breakpoint (640px+)
- `md:` breakpoint (768px+)
- `lg:` breakpoint (1024px+)

Responsive features include:
- Mobile-first navigation with hamburger menu
- Flexible grid layouts that stack on mobile
- Responsive text sizing
- Touch-friendly button sizes
- Proper spacing and padding on all screen sizes

---

## 🚀 Vercel Deployment Steps

### Step 1: Deploy to Vercel

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Navigate to marketplace directory**:
   ```bash
   cd apps/m-marketplace
   ```

4. **Deploy**:
   ```bash
   vercel
   ```
   - Follow the prompts:
     - Link to existing project? **Yes** (or create new)
     - Project name: `kealee-marketplace` (or your preferred name)
     - Root directory: Confirm `apps/m-marketplace` or set it
     - Override settings? **No** (vercel.json is already configured)

5. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

### Step 2: Add Custom Domains in Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `kealee-marketplace` project
3. Go to **Settings** → **Domains**
4. Add both domains:
   - **Primary domain**: `kealee.com`
   - **Secondary domain**: `www.kealee.com`

5. Vercel will provide DNS records to add:
   - Type: `A` record pointing to Vercel's IP
   - Or Type: `CNAME` record pointing to Vercel's domain
   - Follow Vercel's specific instructions for your DNS provider

### Step 3: Configure DNS (NameBright)

Based on your existing setup guide, configure NameBright DNS:

1. Log in to NameBright
2. Go to DNS management for `kealee.com`
3. Add the DNS records provided by Vercel:
   - For `kealee.com` (apex domain): Use A record or ALIAS record
   - For `www.kealee.com`: Use CNAME record

**Important**: The `vercel.json` already includes a redirect rule that automatically redirects `www.kealee.com` → `kealee.com`. This ensures both domains work, but www always redirects to the non-www version.

### Step 4: SSL/HTTPS Setup

Vercel automatically provisions SSL certificates via Let's Encrypt for all custom domains. This happens automatically after DNS is configured correctly.

**Wait time**: SSL certificates are typically provisioned within 24 hours after DNS changes propagate.

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] App is accessible at `https://kealee.com`
- [ ] `www.kealee.com` redirects to `https://kealee.com` (301 redirect)
- [ ] All components render correctly:
  - [ ] Header with navigation
  - [ ] Hero section
  - [ ] Stats section
  - [ ] Services cards
  - [ ] How It Works section
  - [ ] Testimonials
  - [ ] CTA section
  - [ ] Footer
- [ ] Mobile responsiveness works:
  - [ ] Test on iPhone (375px)
  - [ ] Test on iPad (768px)
  - [ ] Test on desktop (1920px)
  - [ ] Mobile menu toggles correctly
  - [ ] Grids stack properly on mobile
  - [ ] Text is readable on all screen sizes
- [ ] SSL certificate is active (green lock icon)
- [ ] Page load speed is acceptable (< 3 seconds)
- [ ] All links work correctly
- [ ] Images load (if any are added later)

---

## 📱 Mobile Testing

### Test on Different Devices

1. **Chrome DevTools**:
   - Open DevTools (F12)
   - Toggle device toolbar (Ctrl+Shift+M)
   - Test different device presets:
     - iPhone SE (375px)
     - iPhone 12 Pro (390px)
     - iPad (768px)
     - Desktop (1920px)

2. **Real Devices**:
   - Test on actual iPhone/iPad
   - Test on Android devices
   - Test on tablets

3. **Responsive Breakpoints**:
   - Mobile: < 640px
   - Tablet: 640px - 1024px
   - Desktop: > 1024px

---

## 🔧 Configuration Files

### vercel.json
```json
{
  "buildCommand": "turbo run build --filter=m-marketplace",
  "outputDirectory": "apps/m-marketplace/.next",
  "installCommand": "pnpm install --network-timeout=60000 --fetch-retries=5",
  "framework": "nextjs",
  "redirects": [
    {
      "source": "/(.*)",
      "has": [
        {
          "type": "host",
          "value": "www.kealee.com"
        }
      ],
      "destination": "https://kealee.com/$1",
      "permanent": true
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

**Key Points**:
- Build command uses Turborepo filter
- www.kealee.com automatically redirects to kealee.com
- Security headers are configured
- Framework is set to Next.js

---

## 🐛 Troubleshooting

### Build Fails
- Check that `turbo.json` has the correct filter configuration
- Verify all dependencies are installed in root: `cd ../.. && pnpm install`
- Check for TypeScript errors: `pnpm lint`

### Domain Not Working
- Verify DNS records are correctly configured
- Wait for DNS propagation (can take up to 48 hours)
- Check Vercel dashboard for domain status
- Ensure SSL certificate has been provisioned

### Components Not Rendering
- Verify all component imports are correct
- Check browser console for errors
- Verify Tailwind CSS is properly configured
- Check that `globals.css` is imported in `layout.tsx`

### Mobile Issues
- Verify Tailwind responsive classes are correct
- Test in Chrome DevTools device mode
- Check that viewport meta tag is present (Next.js adds this automatically)
- Verify flexbox/grid layouts are using responsive classes

---

## 📝 Environment Variables

If needed, add environment variables in Vercel dashboard:
- Go to **Settings** → **Environment Variables**
- Add any required variables:
  - `NEXT_PUBLIC_API_URL` (if API calls are needed)
  - `NEXT_PUBLIC_MARKETPLACE_URL` (if self-referencing)

---

## 🎯 Next Steps

After successful deployment:
1. Set up monitoring (Sentry, LogRocket)
2. Configure analytics (Google Analytics, Plausible)
3. Set up performance monitoring
4. Configure error tracking
5. Set up CI/CD for automatic deployments on push to main

---

## 📞 Support

For issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify DNS configuration
4. Contact Vercel support if needed
