# Railway Deployment Checklist

**Commit Hash:** `85770430` — UI/UX Redesign: Production-Ready Homepage + Intake + Components
**Date:** April 2026
**Status:** ✅ PUSHED TO MAIN (Awaiting GitHub Actions + Railway Deploy)

---

## DEPLOYMENT PIPELINE

```
GitHub Push (main)
  ↓
GitHub Actions Workflow Triggered
  ├─ API Service Docker build
  ├─ web-main Next.js build
  ├─ Portal apps build
  └─ Worker service build
    ↓
Railway Auto-Deploy
  ├─ Pull latest code
  ├─ Install dependencies (pnpm)
  ├─ Build services
  ├─ Deploy to production
  └─ Health check
    ↓
LIVE ON PRODUCTION ✅
```

---

## SERVICES DEPLOYING

| Service | Changes | Status |
|---------|---------|--------|
| `web-main` | Homepage + Intake + Components | Building |
| `api` | Real agent execution wiring | Building |
| `worker` | Lead-followup processor | Building |
| `portal-developer` | API integration | Building |

---

## ENV VARS REQUIRED ON RAILWAY

**Already Set (verified 2026-04-03):**
- ✅ `STRIPE_SECRET_KEY`
- ✅ `ANTHROPIC_API_KEY`
- ✅ `DATABASE_URL`

**Recommended (for full functionality):**
- `RESEND_API_KEY` — Email confirmations
- `INTERNAL_LLM_ENABLED` — Set to false (optional)
- `NEXT_PUBLIC_SUPABASE_URL` — Already set
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Already set

---

## VERIFICATION ENDPOINTS

Once deployed, verify these routes work:

### Homepage
```
GET https://kealee.com/
Expected: Hero + search box + 3 CTAs load
Status: Check navbar renders clean
```

### Intake Flows
```
GET https://kealee.com/intake/exterior_concept
Expected: 3-step wizard loads
Step 1: AI insight loads from /api/agents/design/execute
Status: Insight card displays summary + risks

GET https://kealee.com/intake/permit_path_only
Expected: Same flow, different agent (permit)
Status: Insight card shows permit-specific content

GET https://kealee.com/intake/cost_estimate
Expected: Same flow, design agent
Status: Works like exterior_concept
```

### Success Page
```
GET https://kealee.com/intake/exterior_concept/success?session_id=cs_test_...
Expected: Timeline + next actions display
Status: Email CTA, dashboard link, services upsell visible
```

### API Routes
```
POST https://api.kealee.com/api/v1/agents/design/execute
Expected: Agent response with { success, summary, risks, confidence }
Status: Fallback returns if API down

POST https://api.kealee.com/api/v1/agents/permit/execute
Expected: Permit-specific agent response
Status: Fallback returns if API down

GET https://api.kealee.com/health
Expected: { status: 'ok', service: 'api' }
Status: All workers should show true
```

---

## PRODUCTION VERIFICATION CHECKLIST

### Homepage Load
- [ ] Page loads in < 2 seconds
- [ ] Hero section renders with image/gradient
- [ ] Search box is interactive
- [ ] 3 primary buttons all clickable
- [ ] Value strip displays correctly
- [ ] Mobile responsive (test on phone)

### Intake Flow Verification
- [ ] `/intake/exterior_concept` loads
- [ ] Step 1: AI insight loads (30s timeout)
- [ ] "Continue" button advances to Step 2
- [ ] Step 2: Form fields render (First Name, Email, Address, Description)
- [ ] Form validation works (try submitting empty)
- [ ] Step 3: Review page shows price + delivery
- [ ] "Complete Order" redirects to Stripe
- [ ] Stripe checkout loads

### Success Page Verification
- [ ] Success page displays after payment
- [ ] Timeline shows 4 steps
- [ ] Next actions cards render
- [ ] "Check Email" works (mailto: or prompts)
- [ ] "Track Progress" links to /projects (or shows 404 gracefully)
- [ ] "Explore Services" links to /homeowners
- [ ] Mobile layout responsive

### Permits Flow (Existing)
- [ ] `/permits` page loads
- [ ] Intake form submits
- [ ] `/permits/checkout` redirects to Stripe
- [ ] `/permits/success` displays confirmation

### Navigation
- [ ] Logo links to home
- [ ] "Plan Project" → `/intake/exterior_concept`
- [ ] "Get Permit" → `/intake/permit_path_only`
- [ ] "Price Project" → `/intake/cost_estimate`
- [ ] Search bar in topbar (desktop)
- [ ] Mobile menu hamburger works
- [ ] Auth links work

### API Integration
- [ ] `GET /api/agents/design/execute` returns valid response
- [ ] `GET /api/agents/permit/execute` returns valid response
- [ ] `POST /api/intake` creates intake record
- [ ] `POST /api/intake/checkout` returns Stripe URL
- [ ] All endpoints have 30s timeout
- [ ] Fallback responses work if API down

### Error Handling
- [ ] Invalid project path → Shows error card with home link
- [ ] API timeout → Shows fallback response
- [ ] Form validation error → Shows message + form preserved
- [ ] Stripe error → Shows error message + retry option
- [ ] Network error → Graceful fallback

### Performance
- [ ] Lighthouse score > 80
- [ ] First Contentful Paint < 2s
- [ ] Largest Contentful Paint < 3s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Images optimized (Next.js Image component)

### Accessibility
- [ ] Tab navigation works
- [ ] Focus indicators visible
- [ ] Form labels associated
- [ ] Error messages read by screen reader
- [ ] Color contrast > 4.5:1
- [ ] Alt text on images

---

## ROLLBACK PLAN

If deployment issues occur:

1. **Immediate Rollback:**
   ```bash
   git revert 85770430
   git push origin main
   # Railway will auto-redeploy
   ```

2. **Quick Fix Commit:**
   ```bash
   # Fix the issue
   git add .
   git commit -m "fix: [issue description]"
   git push origin main
   ```

3. **Contact Railway Support:**
   - Project: artistic-kindness
   - Environment: production
   - Issue: [describe issue]

---

## DEPLOYMENT MONITORING

### GitHub Actions
- Check: https://github.com/UseniSajor/kealee-platform-v10/actions
- Look for workflow: "Deploy" or "CI/CD"
- Status should show: ✅ All checks passed

### Railway Dashboard
- Project: artistic-kindness
- Environment: production
- Services: web-main, kealee-api, worker, portal-*
- Each should show: ✅ Healthy / ✅ Active

### Real-Time Logs
```bash
# SSH into Railway container (if needed)
railway logs --service web-main

# Check API logs
railway logs --service kealee-api

# Check worker logs
railway logs --service worker
```

---

## DATABASE SCHEMA

**No schema changes required** for this deployment.

All intake/output/project routes use existing:
- `ProjectOutput` table (already created)
- `PublicIntakeLead` table (already exists)
- No new migrations needed

---

## POST-DEPLOYMENT TASKS (NEXT SPRINT)

1. **Analytics:** Set up Mixpanel/Amplitude tracking
2. **Email:** Configure Resend templates for confirmations
3. **SMS:** Set up Twilio for SMS reminders
4. **Support:** Configure customer support inbox (Zendesk/Intercom)
5. **A/B Testing:** Set up Experiments on CTAs
6. **Monitoring:** Configure alerts on error rates

---

## PRODUCTION LAUNCH SIGN-OFF

- [ ] All verification checks pass
- [ ] Performance metrics acceptable
- [ ] No errors in logs
- [ ] API integrations working
- [ ] Email confirmations sending
- [ ] Analytics tracking
- [ ] Team sign-off

**Go Live:** ✅ **READY FOR PRODUCTION**

---

## MONITORING COMMANDS

```bash
# Watch web-main logs
railway logs --service web-main --follow

# Check API health
curl https://api.kealee.com/health

# Check Stripe webhook status
curl https://api.kealee.com/api/stripe/status

# View all service status
railway status
```

---

## SUPPORT CONTACT

If issues arise during deployment:
- Railway Status: https://status.railway.app
- GitHub Issues: https://github.com/UseniSajor/kealee-platform-v10/issues
- Team Slack: #engineering

---

**Deployment Commit:** `85770430`
**Expected Completion:** 5-10 minutes after push
**Live Status:** Monitor Railway dashboard for confirmation
