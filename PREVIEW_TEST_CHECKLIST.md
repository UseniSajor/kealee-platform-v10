# 🧪 Preview Deployment Test Checklist

**Use this checklist for every preview deployment before promoting to production**

---

## 📋 **TEST SESSION INFO**

| Field | Value |
|-------|-------|
| **App Name** | _________________ |
| **Preview URL** | _________________ |
| **Branch** | _________________ |
| **Tester** | _________________ |
| **Date** | _________________ |
| **Time Started** | _________________ |
| **Time Completed** | _________________ |

---

## ✅ **1. DEPLOYMENT VERIFICATION**

- [ ] Preview deployment completed successfully
- [ ] No build errors in Vercel logs
- [ ] Preview URL is accessible
- [ ] Preview environment indicator visible (if implemented)
- [ ] Correct branch deployed

**Notes:**
```
_____________________________________________
_____________________________________________
```

---

## ✅ **2. BASIC FUNCTIONALITY**

### **Page Loading:**
- [ ] Home page loads without errors
- [ ] All navigation links work
- [ ] Images load correctly
- [ ] Fonts render properly
- [ ] Layout is not broken

### **Console Checks:**
- [ ] No JavaScript errors in console (F12)
- [ ] No failed network requests
- [ ] No 404 errors
- [ ] No CORS errors
- [ ] Warnings are acceptable

**Console Errors Found:**
```
_____________________________________________
_____________________________________________
```

---

## ✅ **3. AUTHENTICATION & SECURITY**

- [ ] Login page loads
- [ ] Can log in with test credentials
- [ ] Session persists across pages
- [ ] Logout works correctly
- [ ] Protected routes redirect to login
- [ ] No sensitive data exposed in console
- [ ] Environment variables hidden in client
- [ ] HTTPS enabled (lock icon in browser)

**Test Credentials Used:**
```
Email: _____________________________
Password: (not recorded for security)
```

---

## ✅ **4. API INTEGRATION**

- [ ] API URL environment variable correct
- [ ] API calls return data
- [ ] Loading states work
- [ ] Error handling works
- [ ] Data displays correctly
- [ ] Forms submit successfully
- [ ] API response times acceptable (< 2 sec)

**API Endpoints Tested:**
```
[ ] GET /api/endpoint1 - ___________
[ ] POST /api/endpoint2 - ___________
[ ] PUT /api/endpoint3 - ___________
```

---

## ✅ **5. DATABASE & SUPABASE**

- [ ] Supabase connection works
- [ ] Data fetches correctly
- [ ] Real-time subscriptions work (if applicable)
- [ ] Queries return expected data
- [ ] Row-level security working
- [ ] No unauthorized access possible

**Supabase Tables Tested:**
```
[ ] Table 1: ___________
[ ] Table 2: ___________
[ ] Table 3: ___________
```

---

## ✅ **6. RESPONSIVE DESIGN**

### **Desktop (1920x1080):**
- [ ] Layout correct
- [ ] All elements visible
- [ ] No horizontal scroll
- [ ] Text readable

### **Tablet (768x1024):**
- [ ] Layout adapts correctly
- [ ] Navigation menu works
- [ ] Forms usable
- [ ] Images scale properly

### **Mobile (375x667):**
- [ ] Mobile menu works
- [ ] Touch targets large enough
- [ ] Text readable without zoom
- [ ] No elements cut off

---

## ✅ **7. PERFORMANCE**

### **Lighthouse Scores (Run in Incognito):**
```
Performance:  _____ / 100 (Target: 90+)
Accessibility: _____ / 100 (Target: 90+)
Best Practices: _____ / 100 (Target: 90+)
SEO:          _____ / 100 (Target: 90+)
```

### **Load Times:**
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3s
- [ ] Cumulative Layout Shift < 0.1

**Performance Issues:**
```
_____________________________________________
_____________________________________________
```

---

## ✅ **8. APP-SPECIFIC TESTS**

### **For os-admin:**
- [ ] Admin dashboard loads
- [ ] User management works
- [ ] Settings save correctly
- [ ] Reports generate
- [ ] Admin actions logged

### **For os-pm:**
- [ ] Project list loads
- [ ] Can create new project
- [ ] Timeline displays correctly
- [ ] Task management works
- [ ] File upload works

### **For m-architect:**
- [ ] Design projects load
- [ ] 3D viewer works (if applicable)
- [ ] File upload works
- [ ] Collaboration features work
- [ ] Export functionality works

### **For m-ops-services:**
- [ ] Pricing page displays correctly
- [ ] Stripe checkout loads (TEST MODE)
- [ ] Test payment works
- [ ] Service requests work
- [ ] Booking system works

**App-Specific Issues:**
```
_____________________________________________
_____________________________________________
```

---

## ✅ **9. STRIPE INTEGRATION** (m-ops-services only)

- [ ] Stripe initialized in TEST mode
- [ ] Test API key detected
- [ ] Pricing page loads all tiers
- [ ] Checkout session creates
- [ ] Test card works: `4242 4242 4242 4242`
- [ ] Success page redirects correctly
- [ ] Webhook receives events (check Stripe dashboard)
- [ ] No live mode keys in preview

**Stripe Test Results:**
```
Package Tested: _____________
Checkout URL: _____________
Payment Status: _____________
```

---

## ✅ **10. ERROR HANDLING**

- [ ] 404 page works
- [ ] 500 error page works
- [ ] Network error handling
- [ ] Form validation errors
- [ ] User-friendly error messages
- [ ] Errors don't break UI

**Error Scenarios Tested:**
```
[ ] Invalid form input - ___________
[ ] Network timeout - ___________
[ ] API error - ___________
```

---

## ✅ **11. CROSS-BROWSER TESTING**

### **Chrome:**
- [ ] All features work
- [ ] No console errors
- [ ] Performance good

### **Safari:**
- [ ] All features work
- [ ] No console errors
- [ ] Styles correct

### **Firefox:**
- [ ] All features work
- [ ] No console errors
- [ ] Styles correct

### **Mobile Safari (iOS):**
- [ ] All features work
- [ ] Touch events work
- [ ] No iOS-specific bugs

---

## ✅ **12. ACCESSIBILITY**

- [ ] Can navigate with keyboard only
- [ ] Tab order logical
- [ ] Focus indicators visible
- [ ] Alt text on images
- [ ] ARIA labels present
- [ ] Color contrast sufficient
- [ ] Screen reader friendly (test if possible)

**Accessibility Issues:**
```
_____________________________________________
_____________________________________________
```

---

## ✅ **13. EDGE CASES**

- [ ] Long text handles gracefully
- [ ] Empty states display correctly
- [ ] Large data sets don't crash
- [ ] Slow network simulated (throttle to 3G)
- [ ] Multiple tabs/windows work
- [ ] Browser back/forward work

---

## ✅ **14. SECURITY CHECKS**

- [ ] No API keys in client-side code
- [ ] Environment variables secure
- [ ] No SQL injection vectors
- [ ] XSS protection working
- [ ] CSRF tokens present (if applicable)
- [ ] Content Security Policy set
- [ ] No mixed content warnings

**Security Tools Used:**
```
[ ] Browser DevTools Security tab
[ ] Lighthouse Security audit
[ ] Manual inspection
```

---

## 📊 **FINAL ASSESSMENT**

### **Critical Issues (Must Fix Before Production):**
```
1. _____________________________________________
2. _____________________________________________
3. _____________________________________________
```

### **Non-Critical Issues (Can Fix Later):**
```
1. _____________________________________________
2. _____________________________________________
3. _____________________________________________
```

### **Performance Metrics:**
```
Average Page Load Time: _____ seconds
Average API Response: _____ ms
Largest Bundle Size: _____ KB
```

### **Overall Quality Score:**
```
Functionality:    _____ / 10
Performance:      _____ / 10
User Experience:  _____ / 10
Security:         _____ / 10
Accessibility:    _____ / 10

TOTAL SCORE:      _____ / 50
```

---

## ✅ **DEPLOYMENT DECISION**

### **Recommendation:**
- [ ] ✅ **APPROVE** - Ready for production
- [ ] ⚠️ **APPROVE WITH NOTES** - Deploy but track issues
- [ ] ❌ **REJECT** - Needs fixes before production

### **Approver Signature:**
```
Name: _____________________________
Role: _____________________________
Date: _____________________________
```

### **Next Steps:**
```
_____________________________________________
_____________________________________________
_____________________________________________
```

---

## 📸 **SCREENSHOTS** (Optional)

Attach screenshots of:
- [ ] Successful homepage load
- [ ] Successful login
- [ ] Key features working
- [ ] Any bugs found
- [ ] Lighthouse report

**Screenshot Links/Attachments:**
```
_____________________________________________
_____________________________________________
```

---

## 📝 **ADDITIONAL NOTES**

```
_____________________________________________
_____________________________________________
_____________________________________________
_____________________________________________
_____________________________________________
```

---

**Test Completed:** _____ / _____ / _____  
**Ready for Production:** YES / NO  
**Approved by:** _____________________

---

## 🔄 **VERSION HISTORY**

| Date | Tester | Version | Status | Notes |
|------|--------|---------|--------|-------|
| | | | | |
| | | | | |
| | | | | |

---

**Save this checklist for each preview deployment. Track improvements over time!** ✅
