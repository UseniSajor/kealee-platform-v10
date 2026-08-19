# Quick Start: Portal API Integration

## What Was Created

✅ **4 Configuration Files** - All in the root directory:
1. `.env.production` templates for each portal (never commit these!)
2. `PORTAL_API_SETUP.md` - Comprehensive 200+ line guide
3. `scripts/update-portal-api.sh` - Bash/Mac/Linux setup script
4. `scripts/update-portal-api.ps1` - PowerShell/Windows setup script

---

## 30-Second Quick Start

### Have your credentials ready:
- Live API endpoint (e.g., `https://api.kealee.com`)
- Resend API key (from https://resend.com)

### Option A: Use the Setup Script (Recommended)

**On Mac/Linux:**
```bash
chmod +x scripts/update-portal-api.sh
./scripts/update-portal-api.sh
```

**On Windows (PowerShell):**
```powershell
powershell -File scripts/update-portal-api.ps1
```

The script will:
1. Ask for your API URL and Resend key
2. Show you manual instructions for Railway Dashboard
3. Optionally generate local `.env.local` files

### Option B: Manual Railway Dashboard Update

1. Go to https://railway.app → Your Project
2. For each portal (owner, contractor, developer):
   - Click service → Variables tab
   - Add: `NEXT_PUBLIC_API_URL=https://api.kealee.com`
   - Add: `RESEND_API_KEY=re_xxxxx` (if sending emails)
   - Click Deploy → Trigger Deploy

### Verify It Works

After deployment (2-5 min):
1. Open portal URL
2. DevTools → Network tab
3. Look for `/api/v1/*` requests
4. Should see `200` responses ✓

---

## File Locations

| File | Purpose |
|------|---------|
| `apps/portal-owner/.env.production` | Template - customize & add to Railway |
| `apps/portal-contractor/.env.production` | Template - customize & add to Railway |
| `apps/portal-developer/.env.production` | Template - customize & add to Railway |
| `PORTAL_API_SETUP.md` | Full documentation (read this for details) |
| `scripts/update-portal-api.sh` | Automated setup (Mac/Linux) |
| `scripts/update-portal-api.ps1` | Automated setup (Windows) |

---

## Environment Variables Needed

### All Portals
- `NEXT_PUBLIC_API_URL` - Your API server (required)

### If Sending Emails
- `RESEND_API_KEY` - From https://resend.com (optional)
- `RESEND_FROM_EMAIL` - Sender address (optional)

### Already Usually Set
- `NEXT_PUBLIC_SUPABASE_URL` - Auth backend
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Auth token
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Payments

---

## What Happens After You Update?

1. Railway will rebuild each portal app (2-5 minutes per service)
2. New environment variables get injected at build time
3. Portals will connect to your live API instead of localhost:3001
4. Users can see live data (projects, messages, payments, etc.)

---

## Troubleshooting

**Portal shows "Failed to load data"?**
- Check: Is API URL correct? Is API service running?
- Check: DevTools Console for CORS errors

**Emails not sending?**
- Check: Is RESEND_API_KEY set in Railway?
- Check: Does it start with `re_`?
- Check: Visit https://resend.com/api-tokens to verify

**Still using old values after deploy?**
- Clear browser cache (Cmd+Shift+Delete)
- Wait for Railway deployment to fully complete
- Check: DevTools → Application → Clear Storage

---

## Next Steps

1. **Read** `PORTAL_API_SETUP.md` for detailed documentation
2. **Run** the setup script (`update-portal-api.sh` or `.ps1`)
3. **Update** Railway variables (via script or dashboard)
4. **Deploy** the three portal services
5. **Test** connectivity (DevTools → Network tab)
6. **Check** logs if anything fails (Railway → Logs)

---

## Need Help?

- Detailed guide: See `PORTAL_API_SETUP.md`
- API endpoints: See `PORTAL_API_SETUP.md` → API Endpoints section
- Railway docs: https://railway.app/docs
- Resend setup: https://resend.com/docs

Good luck! 🚀
