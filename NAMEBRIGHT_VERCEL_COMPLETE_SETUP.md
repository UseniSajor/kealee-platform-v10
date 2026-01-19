# 🌐 Complete Setup Guide: Kealee.com with NameBright DNS + Vercel Hosting

**Time Required:** 2-3 hours  
**Difficulty:** Intermediate  
**Prerequisites:** 
- GitHub repository with your apps
- Vercel account
- NameBright domain (kealee.com)
- Railway API deployed

---

## 📋 Table of Contents

1. [Deploy Apps to Vercel](#step-1-deploy-apps-to-vercel)
2. [Add Custom Domains in Vercel](#step-2-add-custom-domains-in-vercel)
3. [Configure NameBright DNS](#step-3-configure-namebright-dns)
4. [Connect to Railway API](#step-4-connect-to-railway-api)
5. [SSL/HTTPS Setup](#step-5-ssl-https-setup)
6. [Testing & Verification](#step-6-testing-verification)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  NAMEBRIGHT (DNS Provider)                              │
│  - Manages kealee.com domain                            │
│  - Routes traffic to Vercel                             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  VERCEL (Frontend Hosting)                              │
│  ├── app.kealee.com         → Main App                  │
│  ├── admin.kealee.com       → OS Admin                  │
│  ├── pm.kealee.com          → PM Dashboard              │
│  ├── permits.kealee.com     → Permits & Inspections     │
│  ├── owner.kealee.com       → Project Owner             │
│  ├── architect.kealee.com   → Architect Tools           │
│  └── services.kealee.com    → Ops Services              │
└─────────────────────────────────────────────────────────┘
                          ↓ API Calls
┌─────────────────────────────────────────────────────────┐
│  RAILWAY (Backend API)                                  │
│  └── api.kealee.com         → API Server                │
└─────────────────────────────────────────────────────────┘
```

---

<a name="step-1-deploy-apps-to-vercel"></a>
## 📦 Step 1: Deploy Apps to Vercel

### 1.1 Prepare Your Apps

Ensure each app has a `vercel.json` configuration:

**Example: `apps/os-admin/vercel.json`**
```json
{
  "buildCommand": "cd ../.. && pnpm build --filter=os-admin",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "pnpm install",
  "devCommand": "pnpm dev"
}
```

### 1.2 Deploy Each App

For each of your 7 apps:

#### **App 1: OS Admin** (`apps/os-admin`)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your repository: `kealee-platform-v10`
4. Configure:
   - **Project Name:** `kealee-os-admin`
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/os-admin`
   - **Build Command:** `cd ../.. && pnpm build --filter=os-admin`
   - **Output Directory:** `.next`
   - **Install Command:** `pnpm install`
5. Add Environment Variables:
   ```env
   NEXT_PUBLIC_API_URL=https://api.kealee.com
   NEXT_PUBLIC_APP_URL=https://admin.kealee.com
   ```
6. Click **"Deploy"**
7. Note the auto-generated URL: `kealee-os-admin.vercel.app`

#### **App 2: PM Dashboard** (`apps/os-pm`)

1. Click **"Add New Project"**
2. Import repository: `kealee-platform-v10`
3. Configure:
   - **Project Name:** `kealee-os-pm`
   - **Root Directory:** `apps/os-pm`
   - **Build Command:** `cd ../.. && pnpm build --filter=os-pm`
4. Environment Variables:
   ```env
   NEXT_PUBLIC_API_URL=https://api.kealee.com
   NEXT_PUBLIC_APP_URL=https://pm.kealee.com
   ```
5. Deploy and note URL: `kealee-os-pm.vercel.app`

#### **App 3: Permits & Inspections** (`apps/m-permits-inspections`)

1. Click **"Add New Project"**
2. Configure:
   - **Project Name:** `kealee-permits`
   - **Root Directory:** `apps/m-permits-inspections`
   - **Build Command:** `cd ../.. && pnpm build --filter=m-permits-inspections`
3. Environment Variables:
   ```env
   NEXT_PUBLIC_API_URL=https://api.kealee.com
   NEXT_PUBLIC_APP_URL=https://permits.kealee.com
   ```
4. Deploy and note URL: `kealee-permits.vercel.app`

#### **App 4: Project Owner** (`apps/m-project-owner`)

1. Click **"Add New Project"**
2. Configure:
   - **Project Name:** `kealee-owner`
   - **Root Directory:** `apps/m-project-owner`
   - **Build Command:** `cd ../.. && pnpm build --filter=m-project-owner`
3. Environment Variables:
   ```env
   NEXT_PUBLIC_API_URL=https://api.kealee.com
   NEXT_PUBLIC_APP_URL=https://owner.kealee.com
   ```
4. Deploy and note URL: `kealee-owner.vercel.app`

#### **App 5: Architect** (`apps/m-architect`)

1. Click **"Add New Project"**
2. Configure:
   - **Project Name:** `kealee-architect`
   - **Root Directory:** `apps/m-architect`
   - **Build Command:** `cd ../.. && pnpm build --filter=m-architect`
3. Environment Variables:
   ```env
   NEXT_PUBLIC_API_URL=https://api.kealee.com
   NEXT_PUBLIC_APP_URL=https://architect.kealee.com
   ```
4. Deploy and note URL: `kealee-architect.vercel.app`

#### **App 6: Ops Services** (`apps/m-ops-services`)

1. Click **"Add New Project"**
2. Configure:
   - **Project Name:** `kealee-services`
   - **Root Directory:** `apps/m-ops-services`
   - **Build Command:** `cd ../.. && pnpm build --filter=m-ops-services`
3. Environment Variables:
   ```env
   NEXT_PUBLIC_API_URL=https://api.kealee.com
   NEXT_PUBLIC_APP_URL=https://services.kealee.com
   ```
4. Deploy and note URL: `kealee-services.vercel.app`

#### **App 7: Main App** (`apps/web` or primary app)

1. Click **"Add New Project"**
2. Configure:
   - **Project Name:** `kealee-app`
   - **Root Directory:** (your main app directory)
   - **Build Command:** `cd ../.. && pnpm build --filter=<app-name>`
3. Environment Variables:
   ```env
   NEXT_PUBLIC_API_URL=https://api.kealee.com
   NEXT_PUBLIC_APP_URL=https://app.kealee.com
   ```
4. Deploy and note URL: `kealee-app.vercel.app`

---

<a name="step-2-add-custom-domains-in-vercel"></a>
## 🌐 Step 2: Add Custom Domains in Vercel

For **each** deployed project, add your custom domain:

### 2.1 OS Admin → admin.kealee.com

1. Go to Vercel project: **kealee-os-admin**
2. Click **Settings** → **Domains**
3. Add domain: `admin.kealee.com`
4. Click **Add**
5. Vercel will show required DNS records:
   ```
   Type: CNAME
   Name: admin
   Value: cname.vercel-dns.com
   ```
6. **Don't close this page** - you'll need these records for NameBright

### 2.2 PM Dashboard → pm.kealee.com

1. Project: **kealee-os-pm**
2. Settings → Domains
3. Add: `pm.kealee.com`
4. Note DNS records:
   ```
   Type: CNAME
   Name: pm
   Value: cname.vercel-dns.com
   ```

### 2.3 Permits → permits.kealee.com

1. Project: **kealee-permits**
2. Settings → Domains
3. Add: `permits.kealee.com`
4. Note DNS records:
   ```
   Type: CNAME
   Name: permits
   Value: cname.vercel-dns.com
   ```

### 2.4 Project Owner → owner.kealee.com

1. Project: **kealee-owner**
2. Settings → Domains
3. Add: `owner.kealee.com`
4. Note DNS records:
   ```
   Type: CNAME
   Name: owner
   Value: cname.vercel-dns.com
   ```

### 2.5 Architect → architect.kealee.com

1. Project: **kealee-architect**
2. Settings → Domains
3. Add: `architect.kealee.com`
4. Note DNS records:
   ```
   Type: CNAME
   Name: architect
   Value: cname.vercel-dns.com
   ```

### 2.6 Ops Services → services.kealee.com

1. Project: **kealee-services**
2. Settings → Domains
3. Add: `services.kealee.com`
4. Note DNS records:
   ```
   Type: CNAME
   Name: services
   Value: cname.vercel-dns.com
   ```

### 2.7 Main App → app.kealee.com (and www)

1. Project: **kealee-app**
2. Settings → Domains
3. Add **two** domains:
   - `app.kealee.com`
   - `www.kealee.com`
4. Note DNS records:
   ```
   Type: CNAME
   Name: app
   Value: cname.vercel-dns.com
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

### 2.8 Summary of All Domains

| Subdomain | Vercel Project | Custom Domain |
|-----------|----------------|---------------|
| admin | kealee-os-admin | admin.kealee.com |
| pm | kealee-os-pm | pm.kealee.com |
| permits | kealee-permits | permits.kealee.com |
| owner | kealee-owner | owner.kealee.com |
| architect | kealee-architect | architect.kealee.com |
| services | kealee-services | services.kealee.com |
| app | kealee-app | app.kealee.com |
| www | kealee-app | www.kealee.com |

---

<a name="step-3-configure-namebright-dns"></a>
## 🔧 Step 3: Configure NameBright DNS

### 3.1 Access NameBright DNS Management

1. Go to [NameBright.com](https://www.namebright.com)
2. Sign in to your account
3. Click **My Account** → **Domain Manager**
4. Find **kealee.com** and click **Manage DNS**

### 3.2 Clear Existing DNS Records (if any)

1. Delete any existing A, AAAA, or CNAME records for subdomains
2. **Keep** the root domain A records if you have a landing page
3. **Keep** MX records if you have email configured

### 3.3 Add CNAME Records for Vercel Apps

Add these CNAME records in NameBright:

**Record 1: Admin**
```
Type: CNAME
Host: admin
Points to: cname.vercel-dns.com
TTL: 3600 (or Auto)
```

**Record 2: PM**
```
Type: CNAME
Host: pm
Points to: cname.vercel-dns.com
TTL: 3600
```

**Record 3: Permits**
```
Type: CNAME
Host: permits
Points to: cname.vercel-dns.com
TTL: 3600
```

**Record 4: Owner**
```
Type: CNAME
Host: owner
Points to: cname.vercel-dns.com
TTL: 3600
```

**Record 5: Architect**
```
Type: CNAME
Host: architect
Points to: cname.vercel-dns.com
TTL: 3600
```

**Record 6: Services**
```
Type: CNAME
Host: services
Points to: cname.vercel-dns.com
TTL: 3600
```

**Record 7: App**
```
Type: CNAME
Host: app
Points to: cname.vercel-dns.com
TTL: 3600
```

**Record 8: WWW**
```
Type: CNAME
Host: www
Points to: cname.vercel-dns.com
TTL: 3600
```

### 3.4 Add CNAME Record for Railway API

**Record 9: API**
```
Type: CNAME
Host: api
Points to: <your-railway-url>.railway.app
TTL: 3600
```

**Example:**
```
Type: CNAME
Host: api
Points to: kealee-platform-v10-production.up.railway.app
TTL: 3600
```

### 3.5 Add Root Domain Records (Optional)

If you want `kealee.com` to redirect to `app.kealee.com`:

**Option A: Use Vercel's A Records**
```
Type: A
Host: @ (or leave blank)
Points to: 76.76.21.21
TTL: 3600
```

**Option B: Redirect to www**
```
Type: A
Host: @
Points to: 76.76.21.21
TTL: 3600

Type: CNAME
Host: www
Points to: cname.vercel-dns.com
TTL: 3600
```

### 3.6 Final DNS Configuration in NameBright

Your NameBright DNS records should look like this:

```
┌──────────────┬───────┬────────────────────────────────────────┬──────┐
│ Host         │ Type  │ Points To                              │ TTL  │
├──────────────┼───────┼────────────────────────────────────────┼──────┤
│ admin        │ CNAME │ cname.vercel-dns.com                   │ 3600 │
│ pm           │ CNAME │ cname.vercel-dns.com                   │ 3600 │
│ permits      │ CNAME │ cname.vercel-dns.com                   │ 3600 │
│ owner        │ CNAME │ cname.vercel-dns.com                   │ 3600 │
│ architect    │ CNAME │ cname.vercel-dns.com                   │ 3600 │
│ services     │ CNAME │ cname.vercel-dns.com                   │ 3600 │
│ app          │ CNAME │ cname.vercel-dns.com                   │ 3600 │
│ www          │ CNAME │ cname.vercel-dns.com                   │ 3600 │
│ api          │ CNAME │ your-railway-app.up.railway.app        │ 3600 │
│ @            │ A     │ 76.76.21.21 (Vercel)                   │ 3600 │
└──────────────┴───────┴────────────────────────────────────────┴──────┘
```

### 3.7 Save and Verify DNS

1. Click **Save** or **Update** in NameBright
2. DNS propagation takes **5 minutes to 48 hours**
3. Usually works within **15-30 minutes**

---

<a name="step-4-connect-to-railway-api"></a>
## 🔌 Step 4: Connect to Railway API

### 4.1 Get Railway API URL

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Open your **Production API** service
3. Go to **Settings** → **Networking**
4. Copy the **Public Domain** URL
   ```
   Example: kealee-platform-v10-production.up.railway.app
   ```

### 4.2 Add Custom Domain in Railway (Optional)

You can add `api.kealee.com` directly in Railway:

1. In Railway → **Production API** service
2. Go to **Settings** → **Networking**
3. Click **Generate Domain** → **Custom Domain**
4. Enter: `api.kealee.com`
5. Railway will show you a CNAME target
6. This should match what you added in NameBright

### 4.3 Update Vercel Environment Variables

For **each** Vercel project, update the API URL:

1. Go to Vercel project
2. **Settings** → **Environment Variables**
3. Edit `NEXT_PUBLIC_API_URL`
4. Change to: `https://api.kealee.com`
5. Click **Save**
6. **Redeploy** the project for changes to take effect

**Do this for all 7 projects:**
- kealee-os-admin
- kealee-os-pm
- kealee-permits
- kealee-owner
- kealee-architect
- kealee-services
- kealee-app

### 4.4 Update Railway CORS Settings

In Railway → **Production API** → **Variables**:

Update `CORS_ORIGINS` to include all your domains:

```env
CORS_ORIGINS=https://admin.kealee.com,https://pm.kealee.com,https://permits.kealee.com,https://owner.kealee.com,https://architect.kealee.com,https://services.kealee.com,https://app.kealee.com,https://www.kealee.com
```

---

<a name="step-5-ssl-https-setup"></a>
## 🔒 Step 5: SSL/HTTPS Setup

### 5.1 Vercel Automatic SSL

Vercel automatically provisions SSL certificates:

1. Once DNS propagates, Vercel detects the domain
2. Vercel issues a free SSL certificate (Let's Encrypt)
3. HTTPS is automatically enabled
4. HTTP requests are auto-redirected to HTTPS

**Check SSL Status:**
1. Go to each Vercel project
2. Settings → Domains
3. Look for **green checkmark** next to domain
4. Status should say: **"Valid Configuration"**

### 5.2 Railway Automatic SSL

Railway also auto-provisions SSL:

1. Once DNS propagates to Railway
2. SSL certificate is automatically issued
3. `https://api.kealee.com` will work

**Verify:**
```bash
curl https://api.kealee.com/health
```

---

<a name="step-6-testing-verification"></a>
## ✅ Step 6: Testing & Verification

### 6.1 Check DNS Propagation

**Use online tools:**
- [WhatsMyDNS.net](https://whatsmydns.net)
- [DNSChecker.org](https://dnschecker.org)

**Test each subdomain:**
```
admin.kealee.com
pm.kealee.com
permits.kealee.com
owner.kealee.com
architect.kealee.com
services.kealee.com
app.kealee.com
www.kealee.com
api.kealee.com
```

### 6.2 Test Each App

**Test in browser:**

1. **Admin:** https://admin.kealee.com
   - Should load OS Admin dashboard
   - Check browser console for errors
   - Verify API calls work

2. **PM:** https://pm.kealee.com
   - Should load PM Dashboard
   - Test login/signup

3. **Permits:** https://permits.kealee.com
   - Should load Permits app

4. **Owner:** https://owner.kealee.com
   - Should load Project Owner app

5. **Architect:** https://architect.kealee.com
   - Should load Architect tools

6. **Services:** https://services.kealee.com
   - Should load Ops Services

7. **Main App:** https://app.kealee.com
   - Should load main application

8. **WWW:** https://www.kealee.com
   - Should redirect or load main app

### 6.3 Test API Connection

**From browser console** (on any app):

```javascript
fetch('https://api.kealee.com/health')
  .then(r => r.json())
  .then(console.log)
  
// Expected: {status: "ok"}
```

**Test API endpoints:**

```bash
# Health check
curl https://api.kealee.com/health

# Test CORS
curl -H "Origin: https://admin.kealee.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://api.kealee.com/health
```

### 6.4 Verify SSL Certificates

**Check certificate:**
```bash
# For each domain
openssl s_client -connect admin.kealee.com:443 -servername admin.kealee.com < /dev/null | openssl x509 -noout -dates
```

**Or use browser:**
- Click the padlock icon in address bar
- Click "Certificate" or "Connection is secure"
- Verify certificate is valid and issued by Let's Encrypt

### 6.5 Test Cross-App Navigation

1. Login to one app (e.g., admin.kealee.com)
2. Navigate to another app (e.g., pm.kealee.com)
3. Verify authentication persists (if using shared auth)

---

<a name="troubleshooting"></a>
## 🔧 Troubleshooting

### Issue 1: "Domain Not Found" or 404

**Symptoms:**
- Browser shows "This site can't be reached"
- DNS lookup fails

**Solutions:**
1. **Check DNS propagation**
   - Use whatsmydns.net
   - Wait 15-30 minutes minimum
   - Can take up to 48 hours

2. **Verify DNS records in NameBright**
   - Ensure CNAME points to `cname.vercel-dns.com`
   - Check for typos in subdomain names
   - Ensure there are no conflicting A records

3. **Check Vercel domain configuration**
   - Go to Vercel project → Settings → Domains
   - Ensure domain is added
   - Look for any error messages

---

### Issue 2: Vercel Shows "Invalid Configuration"

**Symptoms:**
- Red X or warning in Vercel Domains tab
- Domain status: "Invalid Configuration"

**Solutions:**
1. **Verify DNS records**
   ```bash
   nslookup admin.kealee.com
   # Should return cname.vercel-dns.com
   ```

2. **Remove and re-add domain**
   - In Vercel → Settings → Domains
   - Click "Remove" on the domain
   - Wait 5 minutes
   - Re-add the domain

3. **Check for DNS conflicts**
   - Ensure no A record exists for the same subdomain
   - Only CNAME should be present

---

### Issue 3: SSL Certificate Not Working

**Symptoms:**
- "Your connection is not private" error
- HTTP works but HTTPS doesn't

**Solutions:**
1. **Wait for certificate provisioning**
   - Can take 5-30 minutes after DNS propagates
   - Vercel automatically provisions SSL

2. **Force SSL renewal in Vercel**
   - Settings → Domains
   - Click "Refresh" or remove/re-add domain

3. **Check domain status**
   - Must show "Valid Configuration" before SSL works

---

### Issue 4: API CORS Errors

**Symptoms:**
- Browser console shows: "CORS policy: No 'Access-Control-Allow-Origin' header"
- API calls fail from frontend

**Solutions:**
1. **Update Railway CORS settings**
   ```env
   CORS_ORIGINS=https://admin.kealee.com,https://pm.kealee.com,...
   ```
   - Include ALL your Vercel domains
   - No trailing slashes
   - Separated by commas (no spaces)

2. **Restart Railway API**
   - After updating CORS_ORIGINS
   - Go to Deployments → Restart

3. **Test CORS**
   ```bash
   curl -H "Origin: https://admin.kealee.com" \
        -H "Access-Control-Request-Method: GET" \
        -X OPTIONS \
        https://api.kealee.com/health
   ```

---

### Issue 5: Environment Variables Not Working

**Symptoms:**
- App shows "Cannot connect to API"
- `NEXT_PUBLIC_API_URL` is undefined

**Solutions:**
1. **Verify environment variables in Vercel**
   - Settings → Environment Variables
   - Must start with `NEXT_PUBLIC_` to be available in browser

2. **Redeploy after adding variables**
   - Environment variables only apply to new deployments
   - Go to Deployments → click "..." → Redeploy

3. **Check variable spelling**
   - Must match exactly: `NEXT_PUBLIC_API_URL`
   - No spaces or extra characters

---

### Issue 6: Railway Custom Domain Not Working

**Symptoms:**
- `api.kealee.com` shows 404 or doesn't resolve

**Solutions:**
1. **Verify CNAME in NameBright**
   ```bash
   nslookup api.kealee.com
   # Should return your-railway-app.up.railway.app
   ```

2. **Check Railway custom domain settings**
   - Railway → Settings → Networking
   - Ensure `api.kealee.com` is added
   - Status should be "Active"

3. **Alternative: Use Railway's default URL**
   - Update Vercel apps to use:
   ```env
   NEXT_PUBLIC_API_URL=https://kealee-platform-v10-production.up.railway.app
   ```

---

### Issue 7: Build Failures on Vercel

**Symptoms:**
- Deployment fails during build
- Error: "Command failed with exit code 1"

**Solutions:**
1. **Check build command**
   ```bash
   # Correct:
   cd ../.. && pnpm build --filter=os-admin
   
   # Wrong:
   pnpm build
   ```

2. **Verify root directory**
   - Must be set to app folder: `apps/os-admin`
   - Not workspace root

3. **Check build logs**
   - Click on failed deployment
   - Scroll to see actual error
   - Often TypeScript errors or missing dependencies

---

## 📝 Quick Reference Commands

### DNS Lookup
```bash
nslookup admin.kealee.com
dig admin.kealee.com +short
```

### Test API Connection
```bash
curl https://api.kealee.com/health
curl https://api.kealee.com/health/db
```

### Test HTTPS
```bash
curl -I https://admin.kealee.com
```

### Check Certificate
```bash
openssl s_client -connect admin.kealee.com:443 -servername admin.kealee.com < /dev/null
```

---

## 🎯 Final Checklist

- [ ] All 7 apps deployed to Vercel
- [ ] Custom domains added in each Vercel project
- [ ] 9 CNAME records added in NameBright
- [ ] DNS propagated (check whatsmydns.net)
- [ ] All domains show "Valid Configuration" in Vercel
- [ ] SSL certificates active (green padlock)
- [ ] API URL updated in all Vercel apps
- [ ] CORS_ORIGINS updated in Railway
- [ ] All apps accessible via custom domains
- [ ] API calls working from frontend
- [ ] Cross-app navigation working
- [ ] Authentication working

---

## 🎉 Success!

Once all checklist items are complete, your full Kealee platform should be live:

```
✅ https://admin.kealee.com       → OS Admin
✅ https://pm.kealee.com          → PM Dashboard  
✅ https://permits.kealee.com     → Permits & Inspections
✅ https://owner.kealee.com       → Project Owner
✅ https://architect.kealee.com   → Architect Tools
✅ https://services.kealee.com    → Ops Services
✅ https://app.kealee.com         → Main App
✅ https://api.kealee.com         → API Server
```

---

## 📚 Additional Resources

- [Vercel Domains Documentation](https://vercel.com/docs/concepts/projects/custom-domains)
- [NameBright DNS Management](https://www.namebright.com/Support/DNSHelp)
- [Railway Custom Domains](https://docs.railway.app/deploy/exposing-your-app#custom-domains)
- [DNS Propagation Checker](https://whatsmydns.net)
- [SSL Checker](https://www.sslshopper.com/ssl-checker.html)

---

**Version:** 1.0  
**Last Updated:** January 2026  
**Author:** Kealee Platform Team
