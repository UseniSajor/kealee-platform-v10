# 🧪 Kealee Development System - Complete Testing Guide

## ✅ Current Status

**Servers Running:**
- ✅ Dev Server: http://localhost:3005
- ✅ Prisma Studio: http://localhost:5555
- ✅ Database: Connected and synchronized
- ✅ Prisma Client: Generated with new models

---

## 🎯 Testing Plan (Step-by-Step)

### Test 1: Verify Database Tables

**Open Prisma Studio:**
```
http://localhost:5555
```

**Check for 3 new tables:**
1. `development_leads` - Should see this in the left sidebar
2. `development_lead_notes` - Should see this in the left sidebar
3. `development_lead_activities` - Should see this in the left sidebar

**Action:** Click on `development_leads` table to view structure

**Expected:** Empty table with all columns defined (fullName, company, email, etc.)

---

### Test 2: Submit Test Lead via Website

**Step 1: Open Contact Form**
```
http://localhost:3005/development/contact
```

**Step 2: Fill Out Form with Test Data**

```
Full Name: John Smith
Company: ABC Development LLC
Email: john.smith@abcdev.com
Phone: (555) 123-4567
Role: Developer
Location: Austin, TX
Asset Type: Multifamily
Number of Units: 48
Project Stage: Permitting
Budget Range: $5–15M
Timeline: 3–6 mo
Needs Help: Check "Feasibility", "GC procurement", "Budget/Schedule"
Project Summary: We have a 48-unit multifamily project in Austin that's currently in permitting. Need help with GC procurement and budget validation before breaking ground. Site is entitled but we're concerned about construction costs.
Consent: Check the checkbox
```

**Step 3: Submit Form**
- Click "Submit Project Review Request"
- Wait for success message

**Expected Result:**
- ✅ Success message appears
- ✅ Form clears
- ✅ Thank you confirmation displayed

---

### Test 3: Verify Lead in Database

**Step 1: Open Prisma Studio**
```
http://localhost:5555
```

**Step 2: Check development_leads table**
- Click "development_leads" in left sidebar
- Click refresh icon if needed

**Expected:**
- ✅ 1 record appears with your test data
- ✅ fullName: "John Smith"
- ✅ company: "ABC Development LLC"
- ✅ status: "NEW"
- ✅ priority: "MEDIUM"
- ✅ source: "WEBSITE"

**Step 3: Check development_lead_activities table**
- Click "development_lead_activities" in left sidebar

**Expected:**
- ✅ 1 activity record with activityType: "LEAD_CREATED"
- ✅ description: "New lead submitted from website: John Smith..."

---

### Test 4: View in Admin Dashboard

**Step 1: Open Admin Dashboard**
```
http://localhost:3005/portal/development-leads
```

**Expected:**
- ✅ Stats cards show: Total Leads: 1
- ✅ Lead card displays "John Smith" / "ABC Development LLC"
- ✅ Status badge shows "NEW" in blue
- ✅ Priority badge shows "MEDIUM"
- ✅ Email, location, and project details visible

---

### Test 5: View Lead Detail Page

**Step 1: Click on the lead card**
- Click anywhere on the "John Smith" lead card

**Expected:**
- ✅ Navigates to `/portal/development-leads/[id]`
- ✅ Full lead information displayed
- ✅ Contact section shows email, phone, location
- ✅ Project details section shows asset type, units, stage, budget
- ✅ Needs help badges displayed
- ✅ Project summary text visible
- ✅ Activity log shows "LEAD_CREATED" entry

---

### Test 6: Add Note to Lead

**Step 1: Scroll to Notes section**

**Step 2: Add a test note**
```
Type: "Had initial phone call. Discussed budget concerns and timeline. Moving to contacted status."
Click "Add Note"
```

**Expected:**
- ✅ Note appears immediately in notes list
- ✅ Timestamp shows current date/time
- ✅ Activity log shows "NOTE_ADDED" entry

---

### Test 7: Update Lead Status

**Step 1: Click "Edit" button** (top right)

**Step 2: Change status**
- Status dropdown: Select "CONTACTED"
- Priority dropdown: Change to "HIGH"
- Estimated Value: Enter "75000"

**Step 3: Click "Save"**

**Expected:**
- ✅ Edit mode closes
- ✅ Status badge updates to "CONTACTED"
- ✅ Priority badge updates to "HIGH"
- ✅ Estimated value displays "$75,000"
- ✅ Activity log shows "STATUS_CHANGED" entry

---

### Test 8: Log Activity

**Step 1: In sidebar, find "Add Activity" section**

**Step 2: Add activity**
```
Activity Type: Select "EMAIL_SENT"
Description: "Sent initial proposal email with Tier 1 feasibility scope"
Click "Add Activity"
```

**Expected:**
- ✅ Activity appears in activity log
- ✅ Shows "EMAIL_SENT" type
- ✅ Description displays
- ✅ Timestamp shows current time

---

### Test 9: Verify in Prisma Studio

**Step 1: Go back to Prisma Studio**
```
http://localhost:5555
```

**Step 2: Refresh and check data**
- Click on `development_leads` table
- Click refresh icon

**Expected:**
- ✅ status: "CONTACTED"
- ✅ priority: "HIGH"
- ✅ estimatedValue: 75000
- ✅ lastContactedAt: Updated timestamp

**Step 3: Check activities table**
- Click on `development_lead_activities` table

**Expected:**
- ✅ 3 activities now:
  1. LEAD_CREATED
  2. STATUS_CHANGED
  3. NOTE_ADDED
  4. EMAIL_SENT

**Step 4: Check notes table**
- Click on `development_lead_notes` table

**Expected:**
- ✅ 1 note with your test content

---

### Test 10: Test Filtering & Search

**Step 1: Go back to lead list**
```
http://localhost:3005/portal/development-leads
```

**Step 2: Test search**
- Type "Austin" in search box
- Press enter or wait for auto-search

**Expected:**
- ✅ John Smith lead still appears (location matches)

**Step 3: Test status filter**
- Select "CONTACTED" from status dropdown

**Expected:**
- ✅ John Smith lead still appears (status matches)

**Step 4: Test filter that excludes**
- Select "WON" from status dropdown

**Expected:**
- ✅ No leads appear (our lead is CONTACTED, not WON)

**Step 5: Clear filters**
- Click "Clear Filters" button

**Expected:**
- ✅ All leads appear again

---

## 📊 Test API Endpoints Directly

### Test Stats Endpoint

```bash
curl http://localhost:3005/api/development-leads/stats
```

**Expected Response:**
```json
{
  "overview": {
    "totalLeads": 1,
    "recentLeads": 1,
    "needsFollowUp": 0,
    "conversionRate": 0
  },
  "pipeline": {
    "totalValue": 75000,
    "totalClosed": 0,
    "activeLeadsCount": 1,
    "wonLeadsCount": 0
  },
  "breakdown": {
    "byStatus": [...],
    "byPriority": [...],
    "byAssetType": [...],
    "byProjectStage": [...]
  }
}
```

### Test Get All Leads

```bash
curl http://localhost:3005/api/development-leads
```

**Expected Response:**
```json
{
  "leads": [
    {
      "id": "...",
      "fullName": "John Smith",
      "company": "ABC Development LLC",
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### Test Get Single Lead

```bash
# Replace [id] with actual ID from previous response
curl http://localhost:3005/api/development-leads/[id]
```

---

## ✅ Verification Checklist

After completing all tests, verify:

### Frontend ✓
- [ ] Contact form loads correctly
- [ ] Form validation works (try submitting empty)
- [ ] Form submission succeeds
- [ ] Success message appears
- [ ] Form clears after submission

### Database ✓
- [ ] Lead saved to development_leads table
- [ ] Initial activity created in development_lead_activities
- [ ] All fields populated correctly
- [ ] Enums stored properly (status, priority, assetType, etc.)

### Admin Dashboard ✓
- [ ] Stats cards display correct numbers
- [ ] Lead list shows submitted lead
- [ ] Filters work (status, priority, search)
- [ ] Lead card shows key information
- [ ] Click navigates to detail page

### Lead Detail Page ✓
- [ ] Full lead information displays
- [ ] Edit mode works
- [ ] Status updates save
- [ ] Activity log shows all activities
- [ ] Notes can be added
- [ ] Notes appear in list
- [ ] Activity entries auto-created on changes

### API Endpoints ✓
- [ ] /api/intake responds (form submission)
- [ ] /api/development-leads responds (list)
- [ ] /api/development-leads/stats responds (metrics)
- [ ] /api/development-leads/[id] responds (single)
- [ ] PATCH updates work
- [ ] Notes POST works
- [ ] Activities POST works

---

## 🐛 Troubleshooting

### Issue: Form Submits But No Lead in Dashboard

**Check:**
1. Is dev server running? http://localhost:3005
2. Check browser console for errors (F12)
3. Check server terminal for error logs
4. Verify DATABASE_URL in .env

**Debug:**
```bash
# Check server logs in terminal
# Look for "✓ Lead saved to database" message
```

### Issue: Admin Dashboard Empty

**Check:**
1. Is lead in database? (Check Prisma Studio)
2. Are you on correct URL? `/portal/development-leads`
3. Browser console errors? (F12)

**Debug:**
```bash
# Test API directly
curl http://localhost:3005/api/development-leads
```

### Issue: Stats Show Zero

**Check:**
1. Lead actually in database?
2. Lead status is not "ARCHIVED"?
3. estimatedValue is set (if checking pipeline)?

**Debug:**
```bash
# Test stats endpoint
curl http://localhost:3005/api/development-leads/stats
```

### Issue: Can't Update Lead

**Check:**
1. Are you in edit mode? (Click "Edit" button)
2. Did you click "Save"?
3. Check browser console for errors
4. Check server terminal for API errors

---

## 🎉 Success Criteria

You'll know everything is working when:

✅ **Form submission:**
- Form submits successfully
- Success message appears
- No errors in console

✅ **Database:**
- Lead appears in Prisma Studio
- Activity log entry created
- All fields populated correctly

✅ **Dashboard:**
- Stats cards show: Total Leads = 1
- Lead card displays in list
- Click opens detail page

✅ **Management:**
- Can update status and priority
- Can add notes
- Can log activities
- All changes save and persist

---

## 📋 Test Data Templates

### Test Lead 2 (High-Value)
```
Full Name: Sarah Johnson
Company: Johnson Family Office
Email: sarah@johnsonfamily.com
Role: Investor
Location: Denver, CO
Asset Type: Mixed-use
Units: N/A (check "Not unit-based")
Project Stage: Pre-acquisition
Budget Range: $15–50M
Timeline: 6–12 mo
Needs Help: Feasibility, Entitlements, Budget/Schedule
Summary: Evaluating mixed-use development opportunity in downtown Denver...
```

### Test Lead 3 (Rescue Project)
```
Full Name: Mike Davis
Company: Davis Construction Partners
Email: mdavis@daviscp.com
Role: Developer
Location: Miami, FL
Asset Type: Townhomes
Units: 24
Project Stage: Stalled/Rescue
Budget Range: $5–15M
Timeline: 0–3 mo
Needs Help: Rescue, Change orders, GC procurement
Summary: Project stalled due to GC disputes. 6 months behind schedule...
```

---

## 🚀 Next Phase: Production Testing

Once local testing passes, test on staging/production:

1. Deploy to Vercel
2. Test form submission on live URL
3. Verify emails actually send (Resend/SendGrid)
4. Test admin dashboard with real credentials
5. Performance testing (large lead lists)
6. Mobile device testing
7. Security testing (spam protection)

---

## 📞 Support

**If you encounter issues:**

1. Check browser console (F12 → Console tab)
2. Check server terminal for errors
3. Check Prisma Studio for data state
4. Review API responses in Network tab
5. Consult documentation files

**Documentation:**
- `BACKEND_SETUP_GUIDE.md` - Setup instructions
- `KEALEE_DEVELOPMENT_BACKEND.md` - API reference
- `COMPLETE_SYSTEM_OVERVIEW.md` - Full system docs

---

## 🎯 Success!

When all tests pass, you have:

✅ Working intake form
✅ Database integration
✅ Admin dashboard
✅ Lead management system
✅ Activity tracking
✅ Notes system
✅ Statistics & reporting

**Ready for production deployment!**

---

## 📝 Quick Reference

**URLs to Test:**
- Marketing Home: http://localhost:3005/development
- Contact Form: http://localhost:3005/development/contact
- Admin Dashboard: http://localhost:3005/portal/development-leads
- Prisma Studio: http://localhost:5555

**API Endpoints:**
- Stats: http://localhost:3005/api/development-leads/stats
- List: http://localhost:3005/api/development-leads

---

Start with **Test 1** and work through sequentially. Each test builds on the previous one.

**Ready to start testing!** 🚀
