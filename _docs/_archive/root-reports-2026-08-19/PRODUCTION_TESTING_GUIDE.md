# Production Testing Guide

**Test Environment:** https://kealee.com (production)
**Date:** April 2026
**Expected Deploy Time:** 5-10 minutes after main push

---

## QUICK TEST CHECKLIST (5 min)

```bash
# 1. Homepage loads
curl -I https://kealee.com/ | grep "200"
Expected: 200 OK

# 2. API health
curl https://api.kealee.com/health | jq .status
Expected: "ok"

# 3. Agent endpoint works
curl -X POST https://api.kealee.com/api/v1/agents/design/execute \
  -H "Content-Type: application/json" \
  -d '{"projectType":"exterior_concept"}' | jq .success
Expected: true

# 4. Intake route accessible
curl -I https://kealee.com/intake/exterior_concept | grep "200"
Expected: 200 OK

# 5. Success page accessible
curl -I https://kealee.com/intake/exterior_concept/success | grep "200"
Expected: 200 OK
```

---

## MANUAL TESTING FLOWS

### Flow 1: Homepage → Exterior Concept
**Time:** 3-5 minutes

Steps:
1. Open https://kealee.com/ in browser
2. Click "Plan My Project" button
3. Expected: Redirects to `/intake/exterior_concept`
4. Verify: Step 1 shows AI insight card
5. Wait 30-45 seconds for agent analysis
6. Click "Continue to Details"
7. Fill form: First Name, Email, Address, Description
8. Click "Review & Pay"
9. Verify: Price shows $395 (exterior_concept)
10. Click "Complete Order"
11. Verify: Redirects to Stripe checkout

**Success Criteria:**
- ✅ All buttons clickable
- ✅ Form validates
- ✅ Stripe page loads
- ✅ No console errors

---

### Flow 2: Homepage → Permit Path
**Time:** 3-5 minutes

Steps:
1. Open https://kealee.com/ in browser
2. Click "Get My Permit" button
3. Expected: Redirects to `/intake/permit_path_only`
4. Verify: Step 1 shows permit-specific insight
5. Confidence should be visible
6. Click "Continue to Details"
7. Fill form (same as Flow 1)
8. Verify: Price shows $499 (permit_path_only)
9. Click "Complete Order"
10. Stripe checkout loads

**Success Criteria:**
- ✅ Permit-specific content
- ✅ Correct price ($499)
- ✅ Form submits

---

### Flow 3: Search Bar Intent Detection
**Time:** 2-3 minutes

Steps:
1. Open https://kealee.com/
2. In search box type: "exterior renovation"
3. Click "Analyze" button
4. Expected: Routes to `/intake/exterior_concept`

Repeat with:
- "permit filing" → `/intake/permit_path_only`
- "cost estimate" → `/intake/cost_estimate`
- "kitchen remodel" → `/intake/kitchen_remodel`

**Success Criteria:**
- ✅ Intent detection works
- ✅ Routes to correct intake
- ✅ Default to design if no match

---

### Flow 4: Success Page
**Time:** 5-10 minutes

Steps:
1. Complete checkout (Flow 1 or 2)
2. Stripe shows success
3. Redirects to `/intake/[path]/success?session_id=cs_test_...`
4. Verify:
   - Success header with checkmark
   - Timeline shows 4 steps
   - Next actions cards visible
   - All CTAs functional

**Success Criteria:**
- ✅ Page loads after payment
- ✅ Timeline displays
- ✅ CTAs not broken
- ✅ Mobile responsive

---

### Flow 5: Mobile Navigation
**Time:** 2-3 minutes

Steps:
1. Open https://kealee.com/ on mobile (or DevTools)
2. Verify: Hamburger menu visible
3. Click hamburger
4. Verify: Menu opens with nav items
5. Click "Plan Project"
6. Verify: Routes to intake
7. Fill form on mobile
8. Verify: Layout responsive

**Success Criteria:**
- ✅ Hamburger menu works
- ✅ Form fields clickable
- ✅ Buttons touch-sized (>48px)
- ✅ No horizontal scroll

---

### Flow 6: API Timeout Fallback
**Time:** 1-2 minutes

Steps:
1. Go to `/intake/exterior_concept`
2. Set DevTools → Throttle Network to "Offline"
3. Wait 30+ seconds for timeout
4. Verify: Fallback response shows
5. Summary text displays
6. Continue button works

**Success Criteria:**
- ✅ No blank states
- ✅ Fallback message clear
- ✅ User can proceed

---

### Flow 7: Form Validation
**Time:** 1-2 minutes

Steps:
1. Go to `/intake/exterior_concept`
2. Click "Continue" on Step 1
3. On Step 2, leave First Name blank
4. Try to submit form
5. Verify: Error message shows
6. Fill First Name
7. Try to submit
8. Verify: Can proceed to Step 3

**Success Criteria:**
- ✅ Validation prevents submission
- ✅ Error messages clear
- ✅ Form preserved after error

---

## BROWSER TESTING

Test across these browsers:

| Browser | Desktop | Mobile | Status |
|---------|---------|--------|--------|
| Chrome | ✅ | ✅ | Test first |
| Firefox | ✅ | ✅ | Should work |
| Safari | ✅ | ✅ | Test on Mac |
| Edge | ✅ | — | Windows only |

---

## PERFORMANCE TESTING

### Lighthouse Audit
```bash
# Run Lighthouse on homepage
lighthouse https://kealee.com/ --output=json

# Expected scores:
# - Performance: > 80
# - Accessibility: > 90
# - Best Practices: > 90
# - SEO: > 90
```

### Network Waterfall
Using DevTools → Network tab:

```
Expected load times:
- First paint: < 1s
- Largest contentful paint: < 2.5s
- Total page load: < 3s
- API calls: < 1s each

Check:
✅ No unused CSS
✅ No unused JS
✅ Images optimized
✅ Fonts loaded properly
```

---

## ACCESSIBILITY TESTING

Using DevTools → Accessibility:

```
Checklist:
✅ Keyboard navigation (Tab/Enter)
✅ Focus indicators visible
✅ Form labels present
✅ Color contrast > 4.5:1
✅ No ARIA violations
✅ Screen reader compatible
```

Test with NVDA (Windows) or VoiceOver (Mac):
- Read page title
- Navigate forms
- Hear button labels
- Announce errors

---

## API TESTING

### Endpoint 1: Agent Execution
```bash
curl -X POST https://api.kealee.com/api/v1/agents/design/execute \
  -H "Content-Type: application/json" \
  -d '{
    "projectType": "exterior_concept",
    "address": "123 Main St",
    "description": "Exterior renovation"
  }' | jq .

Expected response:
{
  "success": true,
  "summary": "...",
  "confidence": 85,
  "risks": [...],
  "nextStep": "..."
}
```

### Endpoint 2: Intake Creation
```bash
curl -X POST https://kealee.com/api/intake \
  -H "Content-Type: application/json" \
  -d '{
    "projectPath": "exterior_concept",
    "clientName": "John Doe",
    "contactEmail": "john@example.com",
    "projectAddress": "123 Main St",
    "formData": {}
  }' | jq .

Expected response:
{
  "intakeId": "uuid-here"
}
```

### Endpoint 3: Checkout
```bash
curl -X POST https://kealee.com/api/intake/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "intakeId": "uuid-from-intake",
    "projectPath": "exterior_concept",
    "amount": 39500,
    "successUrl": "https://kealee.com/intake/exterior_concept/success",
    "cancelUrl": "https://kealee.com/intake/exterior_concept"
  }' | jq .

Expected response:
{
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

---

## ERROR SCENARIOS

### Scenario 1: Missing Required Field
```
Form Step 2, submit with empty email
Expected: Error message shows
Message: "Please fill in all required fields"
Action: Form preserved, can correct and resubmit
Result: ✅ PASS / ❌ FAIL
```

### Scenario 2: API Timeout
```
Network throttle to slow 3G
Wait for agent timeout (30s+)
Expected: Fallback response
Message: "We analyzed your project..."
Action: Can continue with form
Result: ✅ PASS / ❌ FAIL
```

### Scenario 3: Invalid Project Path
```
Visit: https://kealee.com/intake/invalid_path
Expected: Error card
Message: "Project Not Found"
Action: "Return Home" link works
Result: ✅ PASS / ❌ FAIL
```

### Scenario 4: Stripe Payment Error
```
Use test card: 4000 0000 0000 0002 (declined)
Expected: Error message
Message: "Card declined. Please try another card."
Action: Can retry with another card
Result: ✅ PASS / ❌ FAIL
```

---

## LOGGING CHECKS

### API Logs
```bash
railway logs --service kealee-api | tail -50

Look for:
- ✅ No ERROR messages
- ✅ Successful agent calls
- ✅ Intake creation logs
- ✅ Stripe webhook logs
```

### Worker Logs
```bash
railway logs --service worker | tail -50

Look for:
- ✅ Lead-followup processor active
- ✅ No job failures
- ✅ Email queue processing
```

### Frontend Logs
Open DevTools → Console

Look for:
- ✅ No red errors
- ✅ No warnings
- ✅ API calls 2xx status
- ✅ No 404s

---

## SIGN-OFF TEMPLATE

Once all tests pass:

```markdown
# Production Deployment Sign-Off

**Date:** [date]
**Tester:** [name]
**Commit:** 85770430

## Tests Completed
- [ ] Homepage loads clean
- [ ] All 3 intake flows work end-to-end
- [ ] Search bar intent detection works
- [ ] Success page displays
- [ ] Mobile navigation works
- [ ] API fallbacks function
- [ ] Form validation works
- [ ] No console errors
- [ ] Performance > 80
- [ ] Accessibility > 90

## Issues Found
- [ ] None
- [ ] [List any issues]

## Approval
- [x] Ready for production
- [ ] Hold for fixes

**Signed:** [name]
```

---

## AUTOMATED TESTING (FUTURE)

```bash
# Run end-to-end tests with Playwright
npx playwright test

# Run Lighthouse CI
lhci autorun

# Run accessibility audit
pa11y https://kealee.com/

# Run security scan
npm audit

# Run performance profiler
curl -X POST https://kealee.com/api/debug/profile
```

---

## DASHBOARD MONITORING

Monitor these metrics post-launch:

1. **Error Rate**
   - Target: < 1%
   - Alert: > 5%

2. **API Response Time**
   - Target: < 500ms
   - Alert: > 2s

3. **Conversion Rate**
   - Target: > 2%
   - Alert: < 0.5%

4. **Page Load Time**
   - Target: < 2.5s
   - Alert: > 5s

5. **Uptime**
   - Target: 99.9%
   - Alert: < 99%

---

**All tests pass? You're good to go! 🚀**
