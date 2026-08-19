# 🧪 COMPREHENSIVE WORKFLOW TESTING GUIDE

**Date:** April 5, 2026  
**Goal:** Test AI Agents → AI Concept → Permits → Checkout  
**Expected Duration:** 15-20 minutes for full workflow

---

## 🎯 TEST WORKFLOW OVERVIEW

```
1. Web-Main (AI Concept)
   ↓
2. Submit photos + scope
   ↓
3. AI concept generated
   ↓
4. Permits workflow (optional)
   ↓
5. Contractor matching
   ↓
6. Checkout with Stripe
```

---

## TEST 1: AI AGENTS & CHATBOT

**Location:** Web-main site → Look for "Ask Anything" bar or AI chat widget

### 1a. AskAnythingBar Test
1. **Go to:** https://web-main-* (your domain)
2. **Look for:** Input bar at bottom/top saying "Ask Anything" or similar
3. **Type a question:** "What's the cost of a kitchen remodel?"
4. **Expected outcome:**
   - ✅ Input is accepted
   - ✅ Response appears (may take 2-3 seconds)
   - ✅ Shows relevant product/pricing info
   - ❌ If no response: Check browser console (F12 → Console) for errors

**What to check in DevTools:**
- F12 → Network tab
- Look for requests to `/api/v1/chat` or `/api/*/messages`
- Expected response: `200` with JSON containing the answer

### 1b. Chat History Test
1. **Ask multiple questions** in sequence:
   - "How long does a bathroom remodel take?"
   - "What permits do I need?"
   - "How much does this cost?"
2. **Expected outcome:**
   - ✅ All questions answered
   - ✅ Context maintained (bot remembers previous questions)
   - ✅ Links to relevant products/services

### 1c. Portal Chat Test (Portal-Owner)
1. **Go to:** portal-owner-* (your domain)
2. **Log in** (if required)
3. **Look for:** Chat widget in bottom-right corner
4. **Send message:** "What's my project status?"
5. **Expected outcome:**
   - ✅ Message sent to `/api/v1/messages/conversations`
   - ✅ Response shows in chat window
   - ✅ DevTools Network shows `200` responses

---

## TEST 2: AI CONCEPT WORKFLOW

**Location:** Web-main → Any product page → "Start Now" button

### 2a. AI Design Concept (Kitchen Remodel)
1. **Navigate to:** https://web-main-*/products/kitchen-remodel
2. **Click:** "Start My Kitchen Concept" button
3. **Expected outcome:**
   - ✅ Redirects to intake form (`/intake/kitchen_remodel`)
   - ✅ Form loads with photo upload
   - ✅ No 404 or 500 errors

### 2b. Fill Out Intake Form
1. **On the intake form:**
   - **Name:** Test User
   - **Email:** test@example.com
   - **Photos:** Can skip or upload test images
   - **Goal/Scope:** "Remodel kitchen with new layout"
   - **Budget Range:** $50,000 - $100,000
   - **Timeline:** 3-6 months

2. **Click "Submit"**

3. **Expected outcome:**
   - ✅ Form validates (no empty required fields)
   - ✅ Submission succeeds (no 400 error)
   - ✅ Redirects to success page or dashboard
   - ✅ DevTools shows POST to `/api/v1/intakes` or similar with `201` response

**What to check in DevTools:**
```
Network tab → Find "intakes" or "intake" POST request
- Method: POST
- Status: 201 Created (or 200 OK)
- Response: Should contain intake ID and confirmation
```

### 2c. Check AI Concept Generation
1. **After submission, wait 30 seconds** (AI processing)
2. **Reload page or check dashboard**
3. **Expected outcome:**
   - ✅ Concept appears in dashboard
   - ✅ Shows AI-generated floor plan concept
   - ✅ Includes cost band estimate
   - ✅ Includes permit scope assessment

**What to check:**
- Concept should have: floor plan, cost band, permit path, scope outline
- If missing: Check browser console for errors

---

## TEST 3: PERMITS WORKFLOW

**Location:** Web-main → Products → Permit services

### 3a. Start Permit Package
1. **Navigate to:** https://web-main-*/products/permit-package
2. **Click:** "Start Permit Filing" button
3. **Expected outcome:**
   - ✅ Redirects to permit intake form
   - ✅ Form loads without errors

### 3b. Fill Permit Form
1. **On permit intake form:**
   - **Project Type:** Kitchen Remodel (or other)
   - **Jurisdiction:** Fairfax / Montgomery / DC
   - **Scope:** "Moving wall, new electrical circuits"
   - **Existing Plans:** Not required
   - **Target Timeline:** 4-8 weeks

2. **Click "Submit"**

3. **Expected outcome:**
   - ✅ Form validation passes
   - ✅ POST request to `/api/v1/permits` or `/api/v1/intakes` succeeds
   - ✅ Returns permit ID and confirmation

### 3c. Link to Previous Concept (Optional)
1. **If AI Concept was already created:**
   - Permit form may offer option to link to existing concept
   - ✅ Selecting it should pre-fill scope automatically

### 3d. Check Permit Status
1. **After submission, navigate to dashboard**
2. **Look for "Permits" section**
3. **Expected outcome:**
   - ✅ Permit appears with status "Processing" or "Submitted"
   - ✅ Shows permit ID, jurisdiction, estimated completion date
   - ✅ Has comment/update history (if responses from agency)

**What to check in DevTools:**
```
Network tab → Look for:
- POST /api/v1/permits or /api/v1/intakes (status 201)
- GET /api/v1/permits/:id or /api/v1/projects/:id (status 200)
```

---

## TEST 4: CHECKOUT WORKFLOW

**Location:** Web-main → Product pages → Checkout buttons

### 4a. Navigate to Product & Initiate Checkout
1. **Go to:** https://web-main-*/products (any product)
2. **Click a product** (e.g., "AI Design," "Permit Package")
3. **Click "Buy Now"** or **"Add to Cart"** button
4. **Expected outcome:**
   - ✅ Checkout dialog/page appears
   - ✅ Shows product name, price, description
   - ✅ No 404 or 500 errors

### 4b. Proceed to Stripe
1. **Click "Checkout"** button
2. **Expected outcome:**
   - ✅ Stripe modal (payment form) opens
   - ✅ Shows product name, amount, Stripe branding

**What to check in DevTools:**
```
Network tab → Look for:
- POST /api/product/checkout (status 200)
- Response contains: { "url": "https://checkout.stripe.com/pay/cs_..." }
```

### 4c. Test Payment with Stripe Test Card

⚠️ **IMPORTANT:** Stripe variables not yet in Railway, so you may see **503 errors**. This is expected and correct.

**When variables ARE added:**

1. **Stripe Modal shows:**
   - Product name and price
   - "Pay" button
   - Card input fields

2. **Fill Stripe form:**
   - **Card Number:** `4242 4242 4242 4242` (test card)
   - **Expiry:** `12/26` (any future month/year)
   - **CVC:** `123` (any 3 digits)
   - **ZIP Code:** `12345` (any valid format)
   - **Email:** `test@example.com`

3. **Click "Pay"**

4. **Expected outcome:**
   - ✅ Payment processes (takes 1-2 seconds)
   - ✅ Redirects to success page: `/products/success?session_id=...`
   - ✅ Shows "Thank you for your purchase"
   - ✅ Contains order/session ID

**What to check in DevTools:**
```
Network tab:
- POST to https://checkout.stripe.com/pay/cs_* (Stripe redirects)
- GET /products/success?session_id=* (status 200)
- Success page contains order confirmation
```

### 4d. Verify Order in Dashboard
1. **After success page, navigate to portal dashboard**
2. **Look for "Orders" or "Purchases" section**
3. **Expected outcome:**
   - ✅ Order appears with status "Complete" or "Paid"
   - ✅ Shows product, amount, date, session ID
   - ✅ Linked to original concept/permit if applicable

---

## 🔍 COMPREHENSIVE DEVTOOLS CHECKLIST

**Use this to verify all API calls are working:**

### Open DevTools (F12) and check these:

#### **Console Tab**
- [ ] No red errors
- [ ] No 404/500 errors
- [ ] No "undefined" warnings

#### **Network Tab**
- [ ] Filter by "XHR" (API calls only)
- [ ] All requests should show **Status 200, 201, or 204**
- [ ] **404 = Missing endpoint** (bad)
- [ ] **500 = Server error** (bad)
- [ ] **503 = Not configured/missing env var** (expected before Stripe setup)

#### **Key API Calls to Verify**

| Endpoint | Method | Expected Status | What it means |
|----------|--------|-----------------|---------------|
| `/api/v1/messages` | POST | 201/200 | Chat working ✅ |
| `/api/v1/intakes` | POST | 201 | Concept submission ✅ |
| `/api/v1/permits` | POST | 201 | Permit submission ✅ |
| `/api/product/checkout` | POST | 200 *(pre-Stripe vars)*<br>200 *(post-vars)* | Checkout route working ✅ |
| Stripe modal redirect | GET | 302 | Payment gateway redirect ✅ |
| `/products/success` | GET | 200 | Success page load ✅ |

---

## ⚠️ EXPECTED ISSUES & SOLUTIONS

### Issue: Checkout returns 503
**Cause:** Stripe variables not in Railway yet  
**Solution:** This is EXPECTED before manual setup. Once you add Stripe variables and redeploy, this will return 200.

### Issue: Chat doesn't respond
**Cause:** API not configured or LLM service down  
**Solution:** Check Network tab for `/api/v1/messages` request. If 500, API is down. If 404, endpoint missing.

### Issue: Form submission fails with 400
**Cause:** Validation error or missing required field  
**Solution:** Check Network → POST response body for error message. Fill all required fields (usually marked with *)

### Issue: Permit or Concept doesn't appear after submission
**Cause:** Page not refreshing or API delay  
**Solution:** Wait 5-10 seconds, then refresh page. Check Network tab to confirm POST succeeded (201 status).

### Issue: Redirect loops (keeps redirecting)
**Cause:** Auth issue or route misconfiguration  
**Solution:** Check if you're logged in. If form redirects to login, you need to auth first.

---

## 📊 TEST REPORT TEMPLATE

**Print/copy this and fill out as you test:**

```
TEST SESSION: April 5, 2026
Tester: [Your name]
Platform: Web-Main + Portals
Start time: [HH:MM]

AI AGENTS:
- [ ] AskAnythingBar responds to questions
- [ ] Chat history maintained across questions
- [ ] Portal chat sends/receives messages
- Notes: ___________________________________

AI CONCEPT:
- [ ] Product pages load
- [ ] Intake forms appear
- [ ] Form submission succeeds (201)
- [ ] Concept generated in time
- [ ] Concept appears in dashboard
- Notes: ___________________________________

PERMITS:
- [ ] Permit product page loads
- [ ] Permit form appears
- [ ] Form submission succeeds (201)
- [ ] Permit status visible in dashboard
- [ ] Can link to existing concepts
- Notes: ___________________________________

CHECKOUT:
- [ ] Product pages show checkout buttons
- [ ] Checkout dialog appears
- [ ] /api/product/checkout returns 200 (or 503 pre-config)
- [ ] Stripe modal opens (after variables configured)
- [ ] Test payment processes (with test card)
- [ ] Success page displays order
- [ ] Order appears in dashboard
- Notes: ___________________________________

OVERALL:
- Bugs found: [ ] Yes [ ] No
- If yes, list: ___________________________________
- Ready for production: [ ] Yes [ ] No
- Additional testing needed: [ ] Yes [ ] No
```

---

## 🚀 NEXT STEPS AFTER TESTING

### If all tests pass ✅
1. Add 26 Stripe variables to Railway (from DEPLOYMENT_NEXT_STEPS.md)
2. Trigger redeploy
3. Rerun checkout test with real Stripe modal
4. **Platform is LIVE!**

### If tests fail ❌
1. Check the troubleshooting section above
2. Verify all commits are deployed (`git log --oneline`)
3. Check Railway logs for errors
4. Let me know which endpoint is failing, and I'll debug

---

## 📞 TESTING SUPPORT

**Need help?** Provide:
1. Which test step failed
2. The API endpoint (from Network tab)
3. HTTP response status + body
4. Browser console errors (if any)
5. Browser/platform being tested

---

**Ready to test?** Start with Test 1 (AI Agents) and work through all tests. Let me know what you find! 🧪
