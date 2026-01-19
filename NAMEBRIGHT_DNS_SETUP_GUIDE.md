# 🌐 NameBright DNS Configuration Guide for Kealee Platform
## Complete Step-by-Step DNS Setup for Vercel Deployment

**Time Required:** 20-30 minutes  
**Difficulty:** Beginner-Friendly  
**Domain Registrar:** NameBright  
**Hosting Platform:** Vercel

---

## 📋 **TABLE OF CONTENTS**

1. [Overview & Domain Strategy](#overview)
2. [Recommended Domain Structure](#domain-structure)
3. [Part 1: Access NameBright DNS Management](#part-1-namebright)
4. [Part 2: Add DNS Records for Each App](#part-2-add-records)
5. [Part 3: Configure Vercel Custom Domains](#part-3-vercel)
6. [Part 4: Verification & Testing](#part-4-testing)
7. [Troubleshooting](#troubleshooting)
8. [Complete DNS Records Reference](#reference)

---

<a name="overview"></a>
## 🎯 **OVERVIEW**

### **What You're Setting Up:**

```
Your Custom Domains                 Vercel Apps
─────────────────────               ────────────────
admin.kealee.com         ──────►    os-admin
pm.kealee.com            ──────►    os-pm
permits.kealee.com       ──────►    m-permits-inspections
owner.kealee.com         ──────►    m-project-owner
architect.kealee.com     ──────►    m-architect
services.kealee.com      ──────►    m-ops-services

Optional:
www.kealee.com           ──────►    Marketing site
kealee.com (root)        ──────►    Landing page
```

---

### **Prerequisites:**

Before starting:
- ✅ You own the domain `kealee.com` (or your custom domain)
- ✅ Domain is registered with NameBright
- ✅ You have NameBright account login credentials
- ✅ All 6 apps are deployed to Vercel (or being deployed)
- ✅ You have access to Vercel dashboard

---

<a name="domain-structure"></a>
## 🏗️ **RECOMMENDED DOMAIN STRUCTURE**

### **For Your 6 Kealee Apps:**

| App | Subdomain | Purpose | User Type |
|-----|-----------|---------|-----------|
| **os-admin** | `admin.kealee.com` | Internal admin console | Internal team |
| **os-pm** | `pm.kealee.com` | Project management | Project managers |
| **m-permits-inspections** | `permits.kealee.com` | Permits & inspections hub | Permit staff |
| **m-project-owner** | `owner.kealee.com` | Project owner portal | Property owners |
| **m-architect** | `architect.kealee.com` | Architect dashboard | Architects |
| **m-ops-services** | `services.kealee.com` | Operations & services | Service providers |

### **Alternative Naming (if preferred):**

| Alternative Option 1 | Alternative Option 2 |
|---------------------|---------------------|
| `dashboard.kealee.com` | `app.kealee.com` |
| `projects.kealee.com` | `manage.kealee.com` |
| `permits.kealee.com` | `permits.kealee.com` |
| `portal.kealee.com` | `client.kealee.com` |
| `design.kealee.com` | `architect.kealee.com` |
| `ops.kealee.com` | `services.kealee.com` |

**For this guide, we'll use the first option (admin, pm, permits, etc.)**

---

<a name="part-1-namebright"></a>
## 🔐 **PART 1: ACCESS NAMEBRIGHT DNS MANAGEMENT**

### **Step 1.1: Login to NameBright**

1. Go to: **https://www.namebright.com**
2. Click **"Sign In"** (top right)
3. Enter your credentials
4. Click **"Sign In"**

---

### **Step 1.2: Navigate to DNS Management**

After logging in:

1. **Click "Domain Manager"** (top navigation or dashboard)
2. Find **"kealee.com"** in your domain list
3. **Click on "kealee.com"** to open domain details
4. Look for **"DNS"** or **"DNS Management"** tab/section
5. **Click "Manage DNS"** or **"Edit DNS"**

You should now see your DNS records page.

---

### **Step 1.3: Understand Current DNS Records**

Your DNS page will show existing records. Typical defaults:

```
Type    Name    Value                           TTL
────────────────────────────────────────────────────
A       @       [IP Address]                    3600
A       www     [IP Address]                    3600
MX      @       mail.kealee.com                 3600
TXT     @       "v=spf1 include:..."           3600
```

**Don't delete these unless you know what they do!**

We'll be **adding new records** for your Vercel apps.

---

<a name="part-2-add-records"></a>
## ➕ **PART 2: ADD DNS RECORDS FOR EACH APP**

### **Step 2.1: Get Vercel's DNS Target**

Vercel uses a single DNS target for all custom domains:

```
cname.vercel-dns.com
```

We'll use this for all subdomain records.

---

### **Step 2.2: Add DNS Records in NameBright**

For **each** of the 6 subdomains, you'll add a CNAME record.

---

#### **Record 1: Admin Dashboard (os-admin)**

1. Click **"Add New Record"** or **"+ Add Record"**
2. Fill in these details:

```yaml
Record Type: CNAME
Host: admin
Points To: cname.vercel-dns.com
TTL: 3600 (or Auto)
```

3. Click **"Save"** or **"Add Record"**

**What this does:** Creates `admin.kealee.com` pointing to Vercel

---

#### **Record 2: Project Manager Dashboard (os-pm)**

Add another record:

```yaml
Record Type: CNAME
Host: pm
Points To: cname.vercel-dns.com
TTL: 3600
```

Click **"Save"**

---

#### **Record 3: Permits & Inspections (m-permits-inspections)**

Add another record:

```yaml
Record Type: CNAME
Host: permits
Points To: cname.vercel-dns.com
TTL: 3600
```

Click **"Save"**

---

#### **Record 4: Project Owner Portal (m-project-owner)**

Add another record:

```yaml
Record Type: CNAME
Host: owner
Points To: cname.vercel-dns.com
TTL: 3600
```

Click **"Save"**

---

#### **Record 5: Architect Dashboard (m-architect)**

Add another record:

```yaml
Record Type: CNAME
Host: architect
Points To: cname.vercel-dns.com
TTL: 3600
```

Click **"Save"**

---

#### **Record 6: Operations Services (m-ops-services)**

Add another record:

```yaml
Record Type: CNAME
Host: services
Points To: cname.vercel-dns.com
TTL: 3600
```

Click **"Save"**

---

### **Step 2.3: Optional - Add Root Domain (kealee.com)**

If you want your root domain to also point to Vercel:

**Option A: A Records (Recommended)**

Add these 4 A records:

```yaml
Record Type: A
Host: @ (or leave blank)
Points To: 76.76.21.21
TTL: 3600
```

```yaml
Record Type: A
Host: @ (or leave blank)
Points To: 76.76.21.142
TTL: 3600
```

```yaml
Record Type: A
Host: @ (or leave blank)
Points To: 76.76.21.164
TTL: 3600
```

```yaml
Record Type: A
Host: @ (or leave blank)
Points To: 76.76.21.241
TTL: 3600
```

**Option B: CNAME Flattening (if NameBright supports it)**

```yaml
Record Type: CNAME
Host: @ (or leave blank)
Points To: cname.vercel-dns.com
TTL: 3600
```

---

### **Step 2.4: Optional - Add WWW Subdomain**

To make `www.kealee.com` work:

```yaml
Record Type: CNAME
Host: www
Points To: cname.vercel-dns.com
TTL: 3600
```

---

### **Step 2.5: Verify All Records Are Added**

Your DNS records should now look like this:

```
Type    Host        Points To                   TTL
────────────────────────────────────────────────────────
CNAME   admin       cname.vercel-dns.com        3600
CNAME   pm          cname.vercel-dns.com        3600
CNAME   permits     cname.vercel-dns.com        3600
CNAME   owner       cname.vercel-dns.com        3600
CNAME   architect   cname.vercel-dns.com        3600
CNAME   services    cname.vercel-dns.com        3600
CNAME   www         cname.vercel-dns.com        3600 (optional)
A       @           76.76.21.21                 3600 (optional)
A       @           76.76.21.142                3600 (optional)
A       @           76.76.21.164                3600 (optional)
A       @           76.76.21.241                3600 (optional)
```

✅ **DNS Configuration Complete in NameBright!**

---

<a name="part-3-vercel"></a>
## 🔗 **PART 3: CONFIGURE VERCEL CUSTOM DOMAINS**

Now you need to tell Vercel about these custom domains.

### **Step 3.1: Add Domain to os-admin App**

1. Go to **Vercel Dashboard**: https://vercel.com/dashboard
2. Click on **"kealee-platform-v10-os-admin"** project (or your os-admin project name)
3. Click **"Settings"** tab
4. Click **"Domains"** in left sidebar
5. In the **"Add Domain"** field, enter: `admin.kealee.com`
6. Click **"Add"**

Vercel will start verifying the domain (takes 1-10 minutes).

---

### **Step 3.2: Add Domain to os-pm App**

Repeat for os-pm:

1. Go to **kealee-platform-v10-os-pm** project
2. **Settings** → **Domains**
3. Add: `pm.kealee.com`
4. Click **"Add"**

---

### **Step 3.3: Add Domain to m-permits-inspections App**

1. Go to **kealee-platform-v10-m-permits-inspections** project
2. **Settings** → **Domains**
3. Add: `permits.kealee.com`
4. Click **"Add"**

---

### **Step 3.4: Add Domain to m-project-owner App**

1. Go to **kealee-platform-v10-m-project-owner** project
2. **Settings** → **Domains**
3. Add: `owner.kealee.com`
4. Click **"Add"**

---

### **Step 3.5: Add Domain to m-architect App**

1. Go to **kealee-platform-v10-m-architect** project
2. **Settings** → **Domains**
3. Add: `architect.kealee.com`
4. Click **"Add"**

---

### **Step 3.6: Add Domain to m-ops-services App**

1. Go to **kealee-platform-v10-m-ops-services** project
2. **Settings** → **Domains**
3. Add: `services.kealee.com`
4. Click **"Add"**

---

### **Step 3.7: Wait for Verification**

For each domain, Vercel will show:

```
⏳ Pending Verification
   Checking DNS configuration...
```

After 1-10 minutes, this changes to:

```
✅ Valid Configuration
   Domain is active
```

---

### **Step 3.8: Set Primary Domain (Optional)**

For each app, you can set which domain is "primary":

1. In **Settings** → **Domains**
2. Find your custom domain (e.g., `admin.kealee.com`)
3. Click **"..."** → **"Set as Primary Domain"**

This makes your custom domain the default redirect target.

---

<a name="part-4-testing"></a>
## 🧪 **PART 4: VERIFICATION & TESTING**

### **Step 4.1: Check DNS Propagation**

DNS changes can take 5 minutes to 48 hours to propagate globally.

**Check status using online tools:**

1. Go to: **https://dnschecker.org**
2. Enter: `admin.kealee.com`
3. Select **"CNAME"** record type
4. Click **"Search"**

**Expected result:**
```
admin.kealee.com → cname.vercel-dns.com
```

Repeat for all 6 subdomains.

---

### **Step 4.2: Test Each Domain in Browser**

Open each URL in your browser:

```bash
https://admin.kealee.com       # os-admin
https://pm.kealee.com          # os-pm
https://permits.kealee.com     # m-permits-inspections
https://owner.kealee.com       # m-project-owner
https://architect.kealee.com   # m-architect
https://services.kealee.com    # m-ops-services
```

**Expected:**
- ✅ Page loads successfully
- ✅ HTTPS (green padlock) is active
- ✅ No certificate warnings
- ✅ App functions correctly

---

### **Step 4.3: Verify SSL Certificates**

Vercel automatically provisions SSL certificates.

1. Visit each domain
2. Click the **padlock icon** in browser address bar
3. Check certificate details:
   - Issued by: **Let's Encrypt** or **Vercel**
   - Valid for your domain
   - Not expired

---

### **Step 4.4: Test API Connectivity**

For each app, test that it can connect to your Railway API:

1. Open browser DevTools (F12)
2. Go to **"Network"** tab
3. Refresh the page
4. Look for API calls to your Railway URL
5. Verify they return `200 OK` responses

---

### **Step 4.5: Update Environment Variables**

After custom domains are working, update your Vercel environment variables:

For **m-ops-services** (needs its own URL for Stripe webhooks):

1. Go to **m-ops-services** → **Settings** → **Environment Variables**
2. Update or add:
   ```env
   NEXT_PUBLIC_APP_URL=https://services.kealee.com
   ```
3. **Redeploy** the app for changes to take effect

---

<a name="troubleshooting"></a>
## 🔧 **TROUBLESHOOTING**

### **Issue 1: Domain Not Verifying in Vercel**

**Symptoms:**
```
⚠️ Invalid Configuration
DNS record not found
```

**Solutions:**

1. **Wait longer** - DNS can take up to 48 hours
2. **Check DNS records in NameBright:**
   - Verify CNAME record exists
   - Verify it points to `cname.vercel-dns.com`
   - Check for typos in subdomain name
3. **Flush DNS cache:**
   ```bash
   # Windows
   ipconfig /flushdns
   
   # Mac
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   
   # Linux
   sudo systemd-resolve --flush-caches
   ```

---

### **Issue 2: "This Site Can't Be Reached"**

**Symptoms:**
```
This site can't be reached
admin.kealee.com's server IP address could not be found
```

**Solutions:**

1. **DNS hasn't propagated yet** - wait 1-24 hours
2. **Check DNS with dnschecker.org**
3. **Verify record in NameBright:**
   ```yaml
   Type: CNAME
   Host: admin
   Value: cname.vercel-dns.com
   ```

---

### **Issue 3: SSL Certificate Warning**

**Symptoms:**
```
⚠️ Your connection is not private
NET::ERR_CERT_COMMON_NAME_INVALID
```

**Solutions:**

1. **Wait 5-10 minutes** - Vercel is still provisioning SSL
2. **Check Vercel domain status:**
   - Should show "Valid Configuration"
3. **Remove and re-add domain in Vercel** if stuck after 1 hour

---

### **Issue 4: Wrong App Shows Up**

**Symptoms:**
- `admin.kealee.com` shows the wrong Vercel app

**Solutions:**

1. **Check Vercel domain assignments:**
   - Go to each project → Settings → Domains
   - Verify each domain is only assigned to ONE project
2. **Remove duplicate domains:**
   - If a domain appears in multiple projects, remove it from the wrong ones

---

### **Issue 5: Root Domain Not Working**

**Symptoms:**
- `kealee.com` doesn't work but subdomains do

**Solutions:**

1. **Add A records for root domain** (see Step 2.3)
2. **Or use CNAME flattening** if NameBright supports it
3. **Or use redirect:**
   ```yaml
   Type: URL Redirect
   Host: @
   Redirects To: https://admin.kealee.com
   ```

---

### **Issue 6: DNS Propagation Taking Too Long**

**Symptoms:**
- Changes made hours ago still not working

**Solutions:**

1. **Check NameBright DNS nameservers:**
   - Verify your domain is using NameBright's nameservers
   - If using external nameservers, add records there instead
2. **Lower TTL values** (optional):
   - Change TTL to 300 (5 minutes) for faster updates
   - Update records
   - Wait 24 hours for old TTL to expire
3. **Contact NameBright support** if stuck after 48 hours

---

<a name="reference"></a>
## 📚 **COMPLETE DNS RECORDS REFERENCE**

### **Copy-Paste DNS Records for NameBright**

Add these records in your NameBright DNS management:

```
# Kealee Platform Apps - CNAME Records
# ────────────────────────────────────────────────────────────

Type: CNAME
Host: admin
Value: cname.vercel-dns.com
TTL: 3600

Type: CNAME
Host: pm
Value: cname.vercel-dns.com
TTL: 3600

Type: CNAME
Host: permits
Value: cname.vercel-dns.com
TTL: 3600

Type: CNAME
Host: owner
Value: cname.vercel-dns.com
TTL: 3600

Type: CNAME
Host: architect
Value: cname.vercel-dns.com
TTL: 3600

Type: CNAME
Host: services
Value: cname.vercel-dns.com
TTL: 3600

# Optional: WWW Subdomain
# ────────────────────────────────────────────────────────────

Type: CNAME
Host: www
Value: cname.vercel-dns.com
TTL: 3600

# Optional: Root Domain (kealee.com) - A Records
# ────────────────────────────────────────────────────────────

Type: A
Host: @
Value: 76.76.21.21
TTL: 3600

Type: A
Host: @
Value: 76.76.21.142
TTL: 3600

Type: A
Host: @
Value: 76.76.21.164
TTL: 3600

Type: A
Host: @
Value: 76.76.21.241
TTL: 3600
```

---

## 📊 **VERIFICATION CHECKLIST**

### **NameBright Configuration:**

- [ ] Logged into NameBright
- [ ] Opened DNS management for kealee.com
- [ ] Added CNAME record for `admin`
- [ ] Added CNAME record for `pm`
- [ ] Added CNAME record for `permits`
- [ ] Added CNAME record for `owner`
- [ ] Added CNAME record for `architect`
- [ ] Added CNAME record for `services`
- [ ] All records point to `cname.vercel-dns.com`
- [ ] All records saved successfully

---

### **Vercel Configuration:**

- [ ] Added `admin.kealee.com` to os-admin project
- [ ] Added `pm.kealee.com` to os-pm project
- [ ] Added `permits.kealee.com` to m-permits-inspections project
- [ ] Added `owner.kealee.com` to m-project-owner project
- [ ] Added `architect.kealee.com` to m-architect project
- [ ] Added `services.kealee.com` to m-ops-services project
- [ ] All domains show "Valid Configuration"
- [ ] SSL certificates provisioned

---

### **Testing:**

- [ ] DNS propagation checked on dnschecker.org
- [ ] `https://admin.kealee.com` loads successfully
- [ ] `https://pm.kealee.com` loads successfully
- [ ] `https://permits.kealee.com` loads successfully
- [ ] `https://owner.kealee.com` loads successfully
- [ ] `https://architect.kealee.com` loads successfully
- [ ] `https://services.kealee.com` loads successfully
- [ ] All domains have HTTPS (green padlock)
- [ ] No certificate warnings
- [ ] Apps can connect to Railway API

---

## 🎓 **BEST PRACTICES**

### **DO:**

✅ Use descriptive subdomains (admin, pm, permits)  
✅ Set TTL to 3600 (1 hour) for production  
✅ Let Vercel handle SSL certificates automatically  
✅ Test in incognito/private browsing mode  
✅ Document your domain mappings  
✅ Use HTTPS everywhere  

### **DON'T:**

❌ Use extremely long subdomains (hard to remember)  
❌ Add same domain to multiple Vercel projects  
❌ Change DNS records frequently  
❌ Set very low TTL (<300) without reason  
❌ Forget to update NEXT_PUBLIC_APP_URL for m-ops-services  
❌ Mix up which subdomain goes to which app  

---

## 🔒 **SECURITY CONSIDERATIONS**

### **1. HTTPS/SSL:**
- ✅ Vercel automatically provisions SSL certificates
- ✅ Certificates auto-renew
- ✅ HTTPS enforced by default

### **2. DDoS Protection:**
- ✅ Vercel includes DDoS protection
- ✅ Rate limiting on Vercel edge network

### **3. DNS Security:**
- ✅ Use NameBright's DNSSEC (if available)
- ✅ Enable two-factor auth on NameBright account
- ✅ Don't share NameBright credentials

---

## 📈 **NEXT STEPS AFTER DNS SETUP**

1. **Configure Email for Domain:**
   - Set up SendGrid for `noreply@kealee.com`
   - Add SPF, DKIM, DMARC records

2. **Set Up Redirects:**
   - Redirect `www.kealee.com` → `admin.kealee.com`
   - Or create a landing page at root domain

3. **Monitor DNS:**
   - Use UptimeRobot or Pingdom
   - Alert if domains go down

4. **Document URLs:**
   - Share domain list with team
   - Update internal documentation

5. **Analytics:**
   - Enable Vercel Analytics for each domain
   - Set up Google Analytics

---

## 🎯 **QUICK COMMAND REFERENCE**

### **Check DNS from Command Line:**

```bash
# Check CNAME records
nslookup admin.kealee.com
nslookup pm.kealee.com
nslookup permits.kealee.com
nslookup owner.kealee.com
nslookup architect.kealee.com
nslookup services.kealee.com

# Should all show: cname.vercel-dns.com

# Alternative: dig command (Mac/Linux)
dig admin.kealee.com CNAME +short
# Should return: cname.vercel-dns.com
```

### **Flush Local DNS Cache:**

```bash
# Windows
ipconfig /flushdns

# Mac
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Linux
sudo systemd-resolve --flush-caches
```

### **Test HTTPS:**

```bash
# Check SSL certificate
curl -I https://admin.kealee.com

# Should show: HTTP/2 200
```

---

## 🆘 **GET HELP**

**NameBright Support:** https://www.namebright.com/Support  
**Vercel Support:** https://vercel.com/support  
**Vercel Domains Docs:** https://vercel.com/docs/concepts/projects/domains  
**DNS Checker:** https://dnschecker.org  

---

## 🎉 **SUCCESS!**

Once all domains are verified and working:

```
✅ admin.kealee.com      → os-admin
✅ pm.kealee.com         → os-pm
✅ permits.kealee.com    → m-permits-inspections
✅ owner.kealee.com      → m-project-owner
✅ architect.kealee.com  → m-architect
✅ services.kealee.com   → m-ops-services
```

**Your Kealee Platform is now accessible on custom domains!** 🚀

---

## 📝 **SUMMARY TABLE**

| Vercel Project | Custom Domain | DNS Record | Status |
|---------------|---------------|------------|--------|
| os-admin | admin.kealee.com | CNAME → cname.vercel-dns.com | ⏳ → ✅ |
| os-pm | pm.kealee.com | CNAME → cname.vercel-dns.com | ⏳ → ✅ |
| m-permits-inspections | permits.kealee.com | CNAME → cname.vercel-dns.com | ⏳ → ✅ |
| m-project-owner | owner.kealee.com | CNAME → cname.vercel-dns.com | ⏳ → ✅ |
| m-architect | architect.kealee.com | CNAME → cname.vercel-dns.com | ⏳ → ✅ |
| m-ops-services | services.kealee.com | CNAME → cname.vercel-dns.com | ⏳ → ✅ |

---

**Last Updated:** January 19, 2026  
**Guide Version:** 1.0  
**Estimated Setup Time:** 20-30 minutes (+ DNS propagation time)

---

**🎊 Congratulations! You've completed the DNS setup for all 6 Kealee Platform apps!**
