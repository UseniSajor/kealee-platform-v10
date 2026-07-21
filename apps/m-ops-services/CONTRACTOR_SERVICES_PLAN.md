# Contractor Services - Implementation Plan

## 🎯 Overview

Creating two professional marketing websites for contractor-focused services:

1. **Kealee Operations Services** (m-ops-services) - For GCs and builders
2. **Kealee Permits & Inspections** (m-permits-inspections) - For GCs, builders, subs, specialty contractors

Both will follow the same high-quality pattern as Kealee Development but tailored for contractor audiences.

---

## 🏗️ Site 1: Kealee Operations Services (For GCs/Builders)

### Target Audience
- General contractors (solo to enterprise)
- Home builders
- Remodelers
- Commercial contractors
- Multi-family contractors

### Service Offering
**Professional Operations Support** - Outsourced operations department for contractors who need admin, coordination, and reporting without hiring full-time staff.

### Core Services
1. **Permit & Inspection Tracking** - Stay on schedule
2. **Vendor & Subcontractor Coordination** - Clear communication
3. **Weekly Client Reporting** - Professional updates
4. **Document Organization** - POs, COs, receipts, lien waivers
5. **Schedule Coordination** - Keep projects moving

### Pricing Tiers (4 Packages)
- **Package A - Solo GC:** $1,750/month
- **Package B - Growing Team:** $3,750/month (most popular)
- **Package C - Multiple Projects:** $9,500/month
- **Package D - Enterprise GC:** $16,500/month

### Pages to Build
1. **Home** - Hero, pain points, packages, ROI calculator
2. **Services** - Detailed service breakdown by package
3. **How It Works** - Process, integration, deliverables
4. **Pricing** - Package comparison, à la carte options
5. **Contact** - Intake form for GC onboarding

### Key Messaging
- "Get your weekends back"
- "Stop losing money to admin chaos"
- "Professional ops without the overhead"
- "We become your operations department"

---

## 📝 Site 2: Kealee Permits & Inspections (For Contractors)

### Target Audience
- General contractors
- Subcontractors (electrical, plumbing, HVAC, etc.)
- Specialty contractors
- Home builders
- Remodelers

### Service Offering
**Permit Management & Inspection Coordination** - Professional permit services so contractors can focus on building, not paperwork.

### Core Services
1. **Permit Application Assistance** - We prep and submit
2. **AI-Powered Compliance Review** - Catch issues before rejection
3. **Inspection Scheduling & Tracking** - Never miss an inspection
4. **Resubmittal Management** - Handle corrections quickly
5. **Multi-Jurisdiction Support** - Work across cities/counties
6. **Expedited Processing** - Fast-track when needed

### Pricing Tiers (4 Packages)
- **Package A - Basic:** Per permit pricing
- **Package B - Standard:** Monthly + unlimited permits
- **Package C - Premium:** Full service + expediting
- **Package D - Enterprise:** Multiple projects/jurisdictions

### Pages to Build
1. **Home** - Hero, pain points, permit services overview
2. **Services** - Full service catalog with pricing
3. **How It Works** - Application to approval process
4. **For Contractors** - Contractor-specific benefits
5. **Contact** - Intake form for permit needs

### Key Messaging
- "Permits approved 40% faster"
- "Stop chasing permit status"
- "We handle the paperwork, you build"
- "Never fail an inspection due to paperwork"

---

## 🎨 Design System (Consistent Across Both)

### Brand Colors
- **Primary:** Deep blue (#0ea5e9) for contractors vs orange (#ea580c) for development
- **Secondary:** Green (#10b981) for success states
- **Neutral:** Gray scale for content
- **Cards:** Light gray backgrounds

### Components to Build
- Header with contractor-focused nav
- Footer with contractor resources
- Service package cards
- Pain point cards
- Process steps
- ROI calculator
- FAQ accordion
- Intake forms (contractor-specific fields)

---

## 📊 Database Models to Add

### For Both Services:

```prisma
// GC Operations Service Leads
model GCOpsLead {
  id, company, contact, gcType, projectVolume, 
  currentChallenges, packageInterest, status, etc.
}

// Permit Service Leads  
model PermitServiceLead {
  id, company, contact, contractorType, 
  jurisdictions, permitVolume, status, etc.
}
```

---

## 🔌 APIs to Build

### For Both Services:
- `/api/gc-ops-leads` - CRUD for GC ops leads
- `/api/permit-leads` - CRUD for permit service leads
- `/api/gc-ops-intake` - Public intake form
- `/api/permit-intake` - Public intake form
- Stats and reporting endpoints

---

## 📋 Forms to Build

### GC Operations Intake Form
Fields:
- Company name, contact, role
- GC type (residential, commercial, multi-family)
- Current team size
- Projects per year
- Current pain points (multi-select)
- Package interest
- Monthly revenue range

### Permit Service Intake Form
Fields:
- Company name, contact, trade
- Contractor type (GC, sub, specialty)
- Jurisdictions worked (multi-select)
- Permits per month
- Current permit challenges
- Services needed (multi-select)
- Rush/expediting needs

---

## 🚀 Implementation Order

### Phase 1: GC Operations Services (m-ops-services)
1. Create `/gc-services` route structure
2. Build 5 marketing pages
3. Create components (Header, Footer, Package Cards, etc.)
4. Build intake form and API
5. Add database models
6. Create admin dashboard

### Phase 2: Permits & Inspections (m-permits-inspections)
1. Create `/contractors` route structure  
2. Build 5 marketing pages
3. Create components
4. Build intake form and API
5. Add database models
6. Create admin dashboard

---

## ✅ Success Criteria

### Each Site Will Have:
- ✅ 5 professional marketing pages
- ✅ Complete intake form with validation
- ✅ Database integration
- ✅ RESTful API endpoints
- ✅ Admin dashboard
- ✅ Activity tracking
- ✅ Comprehensive documentation

### Differentiation:
- **Development:** Owner's rep (protects owners)
- **GC Operations:** Operations support (supports contractors)
- **Permits:** Permit services (serves all contractor types)

---

## 📚 Documentation to Create

For each service:
- Setup guide
- API documentation
- Admin dashboard guide
- Testing guide
- Deployment checklist

---

Ready to build! Starting with GC Operations Services site...
