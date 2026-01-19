# 🚀 Vercel Deployment Steps - Marketplace App

## ✅ Prerequisites Completed
- ✅ Dependencies installed
- ✅ Build successful (verified locally)
- ✅ Vercel CLI installed globally
- ✅ `vercel.json` configured for domains

---

## Step 1: Login to Vercel

Run this command to authenticate:

```bash
cd apps/m-marketplace
vercel login
```

This will:
1. Open your browser
2. Prompt you to log in to your Vercel account
3. Authorize the CLI to access your account

**Note**: If you don't have a Vercel account, sign up at [vercel.com](https://vercel.com/signup)

---

## Step 2: Deploy to Production

Once logged in, deploy to production:

```bash
cd apps/m-marketplace
vercel --prod --yes
```

**What this does**:
- Links the project to Vercel (or creates new project on first deploy)
- Builds the app using the configuration in `vercel.json`
- Deploys to production
- Returns a deployment URL like: `https://your-project.vercel.app`

**First-time deployment**:
You'll be prompted to:
- Link to existing project? → Choose **No** (create new) or **Yes** if you have an existing project
- Project name: `kealee-marketplace` (or your preferred name)
- Directory: Confirm `apps/m-marketplace`
- Override settings? → **No** (vercel.json is already configured)

---

## Step 3: Add Custom Domains in Vercel Dashboard

### 3.1 Access Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Find and click on your `kealee-marketplace` project

### 3.2 Add Domains
1. Click on **Settings** tab
2. Click on **Domains** in the left sidebar
3. Add both domains:
   - Click **"Add"** or **"Add Domain"** button
   - Enter: `kealee.com`
   - Click **Add**
   - Repeat for: `www.kealee.com`

### 3.3 Get DNS Configuration
After adding domains, Vercel will show you DNS configuration instructions:

**For `kealee.com` (apex domain)**:
- Type: `A` record
- Name: `@` or leave blank
- Value: Vercel will provide IP addresses (usually 3 IPs)

**OR** (if supported by NameBright):
- Type: `ALIAS` or `ANAME` record
- Name: `@` or leave blank
- Value: `cname.vercel-dns.com.` (or the value Vercel provides)

**For `www.kealee.com` (subdomain)**:
- Type: `CNAME` record
- Name: `www`
- Value: `cname.vercel-dns.com.` (or the value Vercel provides)

**⚠️ Important**: Vercel will display the exact DNS values you need. Copy these values before proceeding to Step 4.

---

## Step 4: Configure DNS in NameBright

### 4.1 Access NameBright DNS Management
1. Log in to [NameBright](https://www.namebright.com/)
2. Navigate to **Domains** → **Manage Domains**
3. Click on `kealee.com`
4. Go to **DNS Management** or **DNS Settings**

### 4.2 Add DNS Records

#### For Apex Domain (`kealee.com`)
**Option A - Using A Records** (Recommended if ALIAS not available):
1. Find existing `@` A record (if any) - note it down for backup
2. Edit or Add A record:
   - **Host/Name**: `@` or leave blank
   - **Type**: `A`
   - **TTL**: `3600` (or use default)
   - **Value/Points to**: Enter the first IP address Vercel provided
3. Add 2 more A records with the same settings but different IPs (Vercel usually provides 3 IPs)

**Option B - Using ALIAS/ANAME** (If NameBright supports it):
1. Add ALIAS record:
   - **Host/Name**: `@` or leave blank
   - **Type**: `ALIAS` or `ANAME`
   - **TTL**: `3600`
   - **Value/Points to**: The ALIAS target Vercel provided (e.g., `cname.vercel-dns.com.`)

#### For WWW Subdomain (`www.kealee.com`)
1. Find existing `www` CNAME record (if any) - note it down for backup
2. Edit or Add CNAME record:
   - **Host/Name**: `www`
   - **Type**: `CNAME`
   - **TTL**: `3600`
   - **Value/Points to**: The CNAME value Vercel provided (e.g., `cname.vercel-dns.com.`)

### 4.3 Save Changes
- Click **Save** or **Update DNS**
- DNS changes may take a few minutes to propagate

---

## Step 5: Verify Domain Configuration

### 5.1 Check Vercel Dashboard
1. Go back to Vercel Dashboard → Your Project → Settings → Domains
2. Wait for DNS verification:
   - Status should change from **"Pending"** to **"Valid"**
   - This usually takes 5-15 minutes, but can take up to 48 hours

### 5.2 SSL Certificate
- Vercel automatically provisions SSL certificates via Let's Encrypt
- Once DNS is verified, SSL is automatically configured
- Wait time: Typically 5-60 minutes after DNS verification

### 5.3 Test Domains
Once verified, test your domains:

```bash
# Test apex domain
curl -I https://kealee.com

# Test www subdomain (should redirect to kealee.com)
curl -I https://www.kealee.com
```

Or visit in browser:
- ✅ `https://kealee.com` → Should show your marketplace
- ✅ `https://www.kealee.com` → Should redirect to `https://kealee.com` (301 redirect)

---

## Step 6: Verify Deployment

### 6.1 Component Verification Checklist
- [ ] Header renders correctly
- [ ] Hero section displays
- [ ] Stats section shows
- [ ] Services cards render
- [ ] How It Works section displays
- [ ] Testimonials show
- [ ] CTA section renders
- [ ] Footer displays

### 6.2 Mobile Responsiveness Test
Test on different screen sizes:
- [ ] Mobile (375px) - menu works, content stacks properly
- [ ] Tablet (768px) - layouts adapt correctly
- [ ] Desktop (1920px) - full layout displays

### 6.3 Functionality Test
- [ ] Navigation links work
- [ ] Mobile hamburger menu toggles
- [ ] All buttons are clickable
- [ ] Smooth scrolling works
- [ ] External links open correctly

---

## 🐛 Troubleshooting

### Issue: "Domain already in use"
**Solution**: The domain might be connected to another Vercel project. Check your other projects or contact Vercel support.

### Issue: DNS verification pending for hours
**Possible causes**:
1. DNS changes haven't propagated (wait 24-48 hours)
2. Incorrect DNS records (double-check values)
3. Cached DNS (try `nslookup kealee.com` to check current DNS)

**Solution**: 
- Verify DNS records are correct in NameBright
- Use online DNS checker tools (e.g., `dnschecker.org`)
- Wait for full propagation (up to 48 hours)

### Issue: SSL certificate not provisioning
**Solution**:
- Ensure DNS is verified first
- SSL certificates are auto-provisioned after DNS verification
- Wait 24 hours, then contact Vercel support if still not working

### Issue: www.kealee.com not redirecting
**Solution**: 
- The redirect is configured in `vercel.json`
- Ensure `www.kealee.com` is added as a domain in Vercel
- Clear browser cache and test again

### Issue: Build fails on Vercel
**Solution**:
- Check build logs in Vercel dashboard
- Ensure `vercel.json` configuration is correct
- Verify all dependencies are in `package.json`
- Check that Turborepo build command works locally

---

## 📝 Post-Deployment Checklist

After successful deployment:
- [ ] Both domains are accessible
- [ ] SSL certificates are active (green lock icon)
- [ ] www redirects to apex domain
- [ ] All components render correctly
- [ ] Mobile responsiveness works
- [ ] Page loads quickly (< 3 seconds)
- [ ] No console errors in browser
- [ ] Analytics tracking (if configured)
- [ ] Monitoring set up (if using Sentry/LogRocket)

---

## 🔄 Future Deployments

After initial setup, future deployments are automatic if:
- GitHub integration is enabled (auto-deploys on push to main)
- Or manually deploy with: `vercel --prod --yes`

---

## 📞 Support

**Vercel Support**:
- Documentation: [vercel.com/docs](https://vercel.com/docs)
- Support: [vercel.com/support](https://vercel.com/support)

**NameBright Support**:
- Support: Check NameBright dashboard for support options

---

## ✅ Success Indicators

You'll know deployment is successful when:
1. ✅ Vercel deployment shows "Ready" status
2. ✅ `https://kealee.com` loads your marketplace
3. ✅ `https://www.kealee.com` redirects to `https://kealee.com`
4. ✅ SSL certificates show as "Valid" in Vercel
5. ✅ All components render correctly
6. ✅ Mobile responsiveness works

**Congratulations! Your marketplace is live! 🎉**
