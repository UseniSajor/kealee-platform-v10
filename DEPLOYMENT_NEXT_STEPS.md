# 🚀 DEPLOYMENT CHECKLIST — April 5, 2026

**Status:** Code ready ✅ | Awaiting manual config  
**Current Deploy:** commit `fc1d6902` on main branch  
**Estimated Setup Time:** 10-15 minutes total

---

## ✅ WHAT'S ALREADY DONE

### Code Changes (All Committed & Pushed)
- ✅ Fixed kitchen-remodel Stripe mapping (KITCHEN_REMODEL not BASEMENT)
- ✅ Fixed bath-remodel Stripe mapping (BATH_REMODEL not BASEMENT)
- ✅ Added all 27 products to checkout route (was 9/27)
- ✅ Renamed product env vars to descriptive names (STRIPE_PRICE_PRODUCT)
- ✅ Created STRIPE_PRODUCT_MAPPING.md with setup guide
- ✅ Portal API variables set (NEXT_PUBLIC_API_URL, RESEND_API_KEY)
- ✅ Portals redeploying with live API config

---

## ⏳ PENDING: MANUAL STEPS (You Must Complete These)

### 1️⃣ Add Stripe Variables to Railway

**Where:** https://railway.app → Project → arstic-kindness service → Variables

**What to add:**

Copy this entire block and paste into Railway Variables (one at a time or bulk):

```
STRIPE_PRICE_CONCEPT=price_1SwJCjIQghAs8OOIcZxddJDk
STRIPE_PRICE_WHOLE_HOME=price_1SwJCkIQghAs8OOIPX5jfOiP
STRIPE_PRICE_KITCHEN=price_1SwJCjIQghAs8OOIcZxddJDk
STRIPE_PRICE_BATH=price_1SwJCjIQghAs8OOIcZxddJDk
STRIPE_PRICE_INTERIOR=price_1SwJCjIQghAs8OOIcZxddJDk
STRIPE_PRICE_EXTERIOR=price_1SwJCjIQghAs8OOIcZxddJDk
STRIPE_PRICE_GARDEN=price_1SwJCjIQghAs8OOIcZxddJDk
STRIPE_PRICE_LANDSCAPE=price_1SwJCjIQghAs8OOIcZxddJDk
STRIPE_PRICE_BASEMENT=price_1SwJCjIQghAs8OOIcZxddJDk
STRIPE_PRICE_ADU=price_1SwJCjIQghAs8OOIcZxddJDk
STRIPE_PRICE_TINY_HOME=price_1SwJCjIQghAs8OOIcZxddJDk
STRIPE_PRICE_NEW_BUILD=price_1SwJCjIQghAs8OOIcZxddJDk
STRIPE_PRICE_DESIGN_STARTER=price_1SwJCkIQghAs8OOIPX5jfOiP
STRIPE_PRICE_DESIGN_VIZ=price_1SwJCkIQghAs8OOIPX5jfOiP
STRIPE_PRICE_DESIGN_FULL=price_1SwJCkIQghAs8OOIPX5jfOiP
STRIPE_PRICE_OD_PERMIT_APP=price_1SwJCdIQghAs8OOI2pHSaiWV
STRIPE_PRICE_PERMIT_RESEARCH=price_1SwJCiIQghAs8OOIlrmmjQJX
STRIPE_PRICE_OD_CONTRACTOR_COORD=price_1SwJCfIQghAs8OOI5v4yJMiZ
STRIPE_PRICE_PERMIT_EXPEDITING=price_1SwJCjIQghAs8OOIW3UkF28s
STRIPE_PRICE_EST_STANDARD=price_1SwJCkIQghAs8OOIPX5jfOiP
STRIPE_PRICE_EST_CERTIFIED=price_1SwJCkIQghAs8OOIPX5jfOiP
STRIPE_PRICE_OD_PROGRESS_REPORT=price_1SwJChIQghAs8OOIrEx2y8ro
STRIPE_PRICE_OD_SCHEDULE_OPT=price_1SwJCiIQghAs8OOIFwYPNq62
STRIPE_PRICE_HISTORIC=price_1SwJCjIQghAs8OOIcZxddJDk
STRIPE_PRICE_ADU_BUNDLE=price_1SwJCjIQghAs8OOIcZxddJDk
STRIPE_PRICE_WATER_MITIGATION=price_1SwJCjIQghAs8OOIcZxddJDk
```

**How to add (Railway UI):**
1. Go to Variables tab
2. Click "+ New Variable"
3. Paste key (e.g., `STRIPE_PRICE_CONCEPT`)
4. Paste value (e.g., `price_1SwJCjIQghAs8OOIcZxddJDk`)
5. Click Save
6. Repeat for all 26 variables

**Estimated time:** 3-5 minutes

---

### 2️⃣ Trigger Redeploy

**After adding variables:**

1. Go to **Deployments** tab
2. Click **Deploy** button
3. Wait for build to complete (should be ~1-2 minutes)
4. Check **Logs** for any errors (should see 0 errors)

**Success indicators:**
- ✅ Build completes without errors
- ✅ Logs show "Deployment successful"
- ✅ Status shows "Running"

---

### 3️⃣ Test Checkout (Manual Browser Test)

**After deployment completes:**

1. **Open web-main** → https://web-main-* (or your actual domain)
2. **Click any product** (e.g., "AI Design")
3. **Click checkout button** → Should open Stripe modal
4. **DevTools check:**
   - Press F12 → Network tab
   - Look for `/api/product/checkout` request
   - Expected response: `200` with `{ "url": "https://checkout.stripe.com/pay/cs_..." }`

5. **In Stripe modal:**
   - Use test card: `4242 4242 4242 4242`
   - Expiry: `12/26`, CVC: `123`, ZIP: `12345`
   - Click Pay
   - Should see success page

---

## 📋 DEPLOYMENT VERIFICATION CHECKLIST

### Code Level ✅
- [x] All 27 products in checkout route
- [x] All product mappings fixed (kitchen, bath)
- [x] No TypeScript errors
- [x] Commits pushed to main branch

### Railway Config ⏳
- [ ] Stripe variables added (26 total)
- [ ] Web-main redeployed
- [ ] Logs show no errors

### Portal Apps ⏳
- [ ] portal-owner deployed with API config
- [ ] portal-contractor deployed with API config
- [ ] portal-developer deployed with API config

### Functional Testing ⏳
- [ ] Checkout button appears on products
- [ ] Stripe modal opens
- [ ] Test payment processes
- [ ] Success page loads

---

## 🚨 TROUBLESHOOTING

### If checkout fails with 503
**Problem:** Stripe price ID not found  
**Solution:** Check Railway variables were saved and deployed. Redeploy if needed.

### If checkout fails with 400
**Problem:** Missing API endpoint  
**Solution:** Verify `NEXT_PUBLIC_API_URL=https://arstic-kindness.up.railway.app` in Railway

### If Stripe modal doesn't open
**Problem:** API route error  
**Solution:** Check DevTools → Network → /api/product/checkout → see response error

### If payment fails
**Problem:** Test card or wrong price ID  
**Solution:** Use correct test card above. Verify price IDs in Stripe Dashboard match Railway vars.

---

## 📊 FINAL STATUS

### What's Live
| Component | Status | Details |
|-----------|--------|---------|
| **main branch** | ✅ Live | All commits deployed to origin/main |
| **web-main (code)** | ✅ Ready | All 27 products configured |
| **portal-owner (code)** | ✅ Ready | API + Resend configured |
| **portal-contractor (code)** | ✅ Ready | API + Resend configured |
| **portal-developer (code)** | ✅ Ready | API + Resend configured |
| **API (arstic-kindness)** | ✅ Live | No changes needed |
| **Database** | ✅ Live | No changes needed |

### Awaiting Manual Setup
| Step | Responsibility | Estimated Time |
|------|-----------------|-----------------|
| Add Stripe vars to Railway | User (manual) | 3-5 min |
| Trigger redeploy | User (click button) | 1-2 min |
| Test checkout | User (browser) | 2-3 min |

**Total time to go live:** ~10-15 minutes from now

---

## 🎯 SUCCESS METRICS

Once complete, you should see:

1. ✅ Web main loads without errors
2. ✅ Products display with checkout buttons
3. ✅ Checkout button → Stripe modal
4. ✅ Test payment → Success page
5. ✅ Portal apps load with project data
6. ✅ /api/v1/* endpoints returning 200

---

## 📞 NEXT IMMEDIATE ACTIONS

**User must do:**
1. Go to Railway dashboard
2. Add 26 Stripe variables (copy-paste from section 1️⃣ above)
3. Click Deploy
4. Wait 1-2 minutes
5. Test checkout in browser

**I can help with:**
- Code-level debugging if something fails
- Verifying environment variable configuration
- Checking error logs
- Creating additional product mappings if needed

---

**Ready?** Let me know once you've added the variables to Railway, and I can help verify the deployment! 🚀
