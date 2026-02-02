

`

## **PROMPT 1: CUSTOMER-FACING STRUCTURE & SETUP**

`text`

`[PASTE CORRECT PROMPT 1 HERE — CUSTOMER-FACING STRUCTURE & SETUP]`

---

## **PROMPT 2: MARKETING PAGES FOR GENERAL CONTRACTORS**

`text`

`[PASTE CORRECT PROMPT 2 HERE — MARKETING PAGES FOR GENERAL CONTRACTORS]`

---

## **PROMPT 3: GC SIGNUP FLOW WITH COMPANY INFO**

`text`

`[PASTE CORRECT PROMPT 3 HERE — GC SIGNUP FLOW WITH COMPANY INFO]`

---

## **PROMPT 4: GC PORTAL DASHBOARD**

`text`

`[PASTE CORRECT PROMPT 4 HERE — GC PORTAL DASHBOARD]`

---

## **PROMPT 5: SERVICE REQUEST SYSTEM FOR GCs**

`text`

`[PASTE CORRECT PROMPT 5 HERE — SERVICE REQUEST SYSTEM FOR GCs]`

---

## **PROMPT 6: WEEKLY REPORTS FOR GCs**

`text`

`[PASTE CORRECT PROMPT 6 HERE — WEEKLY REPORTS FOR GCs]`

---

## **PROMPT 7: GC PROJECT MANAGEMENT VIEW**

`text`

`[PASTE CORRECT PROMPT 7 HERE — GC PROJECT MANAGEMENT VIEW]`

---

## **PROMPT 8: BILLING & SUBSCRIPTION FOR GCs**

`text`

`Create billing portal for GCs:`

`app/(portal)/billing/page.tsx`

`1. components/portal/GCBilling.tsx`  
   `- Current Package: "Package B - $3,750/month"`  
   `- Billing Cycle: "Next charge: Nov 15, 2024"`  
   `- Usage: "Service hours used: 12/40"`  
   `- Value: "You've saved approx. 44 hours this month"`

`2. Invoice History:`  
   `- Date, amount, status`  
   `- Download PDF invoices`  
   `- Tax receipts`  
   `- Payment method management`

`3. Package Management for GCs:`  
   `- Upgrade/Downgrade options`  
   `- Prorated calculations`  
   `- Feature comparison`  
   `- "What changes?" modal`

`4. Usage Analytics for GCs:`  
   `- Service hours by category`  
   `- Cost per project`  
   `- ROI calculation`  
   `- "You're saving $X compared to hiring"`

`5. Cancellation Flow:`  
   `- Exit survey: "Why are you leaving?"`  
   `- Retention offers`  
   `- Data export option`

   `- Final invoice`

---

## **PROMPT 9: GC TEAM MANAGEMENT**

`text`

`Create team management for GCs to add their team members:`

`app/(portal)/team/page.tsx`

`1. Team Roles for GCs:`  
   `- Owner/Principal (full access)`  
   `- Project Manager (project access)`  
   `- Superintendent (site access)`  
   `- Office Admin (billing/docs access)`  
   `- Client (limited view-only)`

`2. Invite Flow:`  
   `- Email invitation`  
   `- Role selection`  
   `- Project access assignment`  
   `- Welcome email with onboarding`

`3. Permission Matrix:`  
   `- Who can submit service requests?`  
   `- Who can view financials?`  
   `- Who can upload documents?`  
   `- Who can approve payments?`

`4. Audit Log:`  
   `- Team member activity`  
   `- Permission changes`

   `- Login history`

---

## **PROMPT 10: STRIPE INTEGRATION FOR GC BILLING**

`text`

`Create Stripe integration for GC subscriptions:`

`1. Stripe Products for GC Packages:`  
   `- Product: "Kealee Ops Services - Package A (GC)"`  
   `- Product: "Kealee Ops Services - Package B (GC)" ⭐`  
   `- Product: "Kealee Ops Services - Package C (GC)"`  
   `- Product: "Kealee Ops Services - Package D (GC)"`

`2. Pricing Models:`  
   `- Monthly: $1,750, $3,750, $9,500, $16,500`  
   `- Annual (save 15%): $17,850, $38,250, $96,900, $168,300`  
   `- 14-day free trial for all packages`

`3. Webhook Handlers for GCs:`  
   `- subscription.created → Create GC org, assign Package`  
   `- invoice.paid → Send receipt to GC`  
   `- invoice.payment_failed → Notify GC, retry logic`  
   `- customer.subscription.updated → Update GC package`  
   `- customer.subscription.deleted → Downgrade GC access`

`4. GC Billing Portal:`  
   `- Self-service upgrade/downgrade`  
   `- Invoice history`  
   `- Payment method management`

   `- Tax documents`

---

## **PROMPT 11: EMAIL COMMUNICATIONS FOR GCs**

`text`

`Create GC-specific email templates:`

`1. Welcome Sequence for New GCs:`  
   `- Day 0: "Welcome to Kealee Ops Services!"`  
   `- Day 1: "Meet your dedicated PM"`  
   `- Day 3: "How to submit your first service request"`  
   `- Day 7: "First weekly report preview"`

`2. Service Request Communications:`  
   `- "Your service request has been received"`  
   `- "Your request has been assigned to [PM Name]"`  
   `- "Update on your service request"`  
   `- "Your service request has been completed"`

`3. Weekly Report Emails:`  
   `- "Your weekly report is ready"`  
   `- Executive summary in email body`  
   `- Link to full report in portal`  
   `- Action items highlighted`

`4. Billing Communications:`  
   `- "Invoice #1234 is due"`  
   `- "Payment received - thank you!"`  
   `- "Payment failed - update your card"`

   `- "Your subscription has been upgraded"`

---

## **PROMPT 12: GC ONBOARDING QUESTIONNAIRE**

`text`

`Create detailed onboarding questionnaire for GCs:`

`components/gc-auth/GCOnboarding.tsx`

`Section 1: Current Operations`  
`- "How many people handle operations/admin?"`  
`- "What software do you currently use?"`  
`- "Biggest pain points in order:"`  
  `□ Permit delays`  
  `□ Subcontractor coordination`    
  `□ Change order management`  
  `□ Client communications`  
  `□ Billing/invoicing`  
  `□ Schedule tracking`

`Section 2: Project Portfolio`  
`- Number of active projects`  
`- Average project duration`  
`- Typical project value range`  
`- Project types: Residential, Commercial, Renovation, New Build`

`Section 3: Team Structure`  
`- Key team members to invite`  
`- Decision-making process`  
`- Communication preferences`

`Section 4: Goals with Kealee`  
`- "What does success look like in 3 months?"`  
`- "Key metrics you want to improve?"`  
`- "Preferred communication style?"`

`This data:`  
`1. Informs Kealee PMs about the GC`  
`2. Creates initial service requests`  
`3. Sets up project templates`

`4. Customizes reporting`

---

## **PROMPT 13: MOBILE APP FOR GCs ON SITE**

`text`

`Create mobile-optimized features for GCs on construction sites:`

`1. Mobile-First Portal:`  
   `- Touch-friendly navigation`  
   `- Large buttons for gloved hands`  
   `- Offline capability for poor connectivity`  
   `- Camera upload optimized`

`2. Site-Specific Features:`  
   `- Photo upload with GPS tagging`  
   `- Daily log entry`  
   `- Material delivery tracking`  
   `- Weather integration`  
   `- Quick inspection checklist`

`3. Push Notifications for GCs:`  
   `- "Inspection scheduled for tomorrow"`  
   `- "Permit approved"`  
   `- "Subcontractor arrived on site"`  
   `- "Weather delay warning"`

`4. PWA Installation:`  
   `- Add to home screen`  
   `- Offline forms`  
   `- Background sync`

   `- Local cache of project data`

---

## **PROMPT 14: ANALYTICS & GC SUCCESS METRICS**

`text`

`Create success tracking for GCs:`

`1. GC Dashboard Metrics:`  
   `- Hours saved per week`  
   `- Project delay reduction`  
   `- Permit approval time improvement`  
   `- Cost savings from optimization`  
   `- Client satisfaction scores`

`2. ROI Dashboard:`  
   `- "Your investment: $3,750/month"`  
   `- "Your savings: $8,200/month" (calculated)`  
   `- "ROI: 218%"`  
   `- "Break-even: 1.4 months"`

`3. Benchmarking:`  
   `- "You're performing better than 75% of GCs"`  
   `- "Average permit approval: 12 days (industry: 28 days)"`  
   `- "Project completion: 2 days ahead of schedule"`

`4. Success Stories:`  
   `- "Since joining, GC XYZ increased projects by 40%"`  
   `- "GC ABC reduced admin costs by 65%"`

   `- Case study links`

---

## **KEY DIFFERENTIATORS FOR GCs:**

Traditional Approach: GC hires in-house ops person ($80K+/year \+ benefits)  
Kealee Approach: GC subscribes to Package B ($3,750/month \= $45K/year)

Benefits for GCs:

1. No hiring/training \- Instant operations team  
2. Scalable \- Add projects without adding staff  
3. Expertise \- Permit specialists, scheduling experts  
4. Technology \- Full platform included  
5. Risk reduction \- Compliance handled by experts

---

## **LAUNCH STRATEGY FOR GCs:**

Week 8 Launch Target: First 10 GC customers on Package B  
Target GC Profile:

* 3-5 active projects  
* 5-15 employees  
* $2M-$10M annual revenue  
* Pain point: Permit delays or admin overload

Marketing Channels:

1. GC associations (NAHB, local builder associations)  
2. Construction trade shows  
3. LinkedIn targeting GC owners  
4. Referral program from existing GCs

Success Metric: $37,500 MRR from 10 Package B GCs by Week 12

---

## **BUILD PRIORITY ORDER:**

1. Prompt 1 \- GC-Facing Structure  
2. Prompt 3 \- GC Signup Flow (REVENUE\!)  
3. Prompt 10 \- Stripe Integration (PAYMENTS\!)  
4. Prompt 4 \- GC Portal Dashboard  
5. Prompt 5 \- Service Requests (CORE VALUE)  
6. Prompt 6 \- Weekly Reports (CORE VALUE)  
7. Prompt 8 \- Billing Portal  
8. Prompt 2 \- Marketing Pages (ACQUISITION)  
9. Remaining prompts for polish

Start with the revenue-generating features first\! Package B signup flow (Prompt 3\) and Stripe integration (Prompt 10\) are CRITICAL for Week 8 launch.

