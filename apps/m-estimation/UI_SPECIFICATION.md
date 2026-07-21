# 📱 m-estimation - UI Specification & Design System

**App Name:** m-estimation (Kealee Estimation Portal)  
**URL:** estimation.kealee.com  
**Purpose:** Construction cost estimation and takeoff management  
**Target Users:** Estimators, Contractors, GCs, Project Managers  
**Status:** ❌ Not Started (Backend 85% Ready)  
**Estimated Build Time:** 2-3 weeks  
**Priority:** HIGH

---

## 🎯 EXECUTIVE SUMMARY

The m-estimation app is a **professional construction cost estimation platform** that transforms the backend estimation tool into a fully-featured, user-friendly interface for creating accurate, AI-powered estimates in minutes instead of hours.

### Key Value Propositions
1. **15-20 hour time savings** per estimate (vs. manual Excel)
2. **AI-powered** scope analysis and cost prediction
3. **Pre-built assemblies** for common construction elements
4. **Seamless integration** with bid requests and project budgets
5. **Professional output** (PDF proposals, Excel breakdowns)
6. **Real-time collaboration** with team members

---

## 🏗️ ARCHITECTURE

### Tech Stack
```yaml
Framework: Next.js 15+ (App Router)
Language: TypeScript
Styling: Tailwind CSS v4
UI Components: Shadcn/ui
State Management: React Context + Server Components
API: REST via @kealee/api-client
Authentication: Supabase Auth
Database: PostgreSQL via Prisma
File Upload: S3/R2
Real-time: WebSockets (optional)
PDF Generation: pdf-lib (backend)
Excel: xlsx (backend)
Charts: Recharts
```

### File Structure
```
apps/m-estimation/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/
│   │   ├── layout.tsx                  # Main dashboard layout
│   │   ├── page.tsx                    # Dashboard home
│   │   ├── estimates/
│   │   │   ├── page.tsx                # Estimates list
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx            # Estimate detail
│   │   │   │   ├── edit/page.tsx       # Estimate editor
│   │   │   │   ├── export/page.tsx     # Export options
│   │   │   │   └── revisions/page.tsx  # Revision history
│   │   │   └── new/
│   │   │       ├── page.tsx            # Create estimate (wizard)
│   │   │       └── from-bid/page.tsx   # Create from bid
│   │   ├── assemblies/
│   │   │   ├── page.tsx                # Assembly library
│   │   │   ├── [id]/page.tsx           # Assembly detail
│   │   │   └── new/page.tsx            # Create assembly
│   │   ├── cost-database/
│   │   │   ├── page.tsx                # Cost database home
│   │   │   ├── materials/page.tsx      # Materials
│   │   │   ├── labor/page.tsx          # Labor rates
│   │   │   └── equipment/page.tsx      # Equipment rates
│   │   ├── takeoff/
│   │   │   ├── page.tsx                # Takeoff list
│   │   │   ├── [id]/page.tsx           # Takeoff viewer
│   │   │   └── new/page.tsx            # Upload plans
│   │   ├── reports/
│   │   │   └── page.tsx                # Reports & analytics
│   │   └── settings/
│   │       └── page.tsx                # Settings
│   └── api/
│       ├── estimates/route.ts
│       ├── assemblies/route.ts
│       └── cost-database/route.ts
├── components/
│   ├── estimates/
│   │   ├── EstimateWizard.tsx          # Multi-step creation
│   │   ├── EstimateEditor.tsx          # Full editor
│   │   ├── LineItemTable.tsx           # Line items
│   │   ├── CostSummary.tsx             # Cost totals
│   │   ├── AIAnalysis.tsx              # AI insights
│   │   └── ExportDialog.tsx            # Export options
│   ├── assemblies/
│   │   ├── AssemblyBrowser.tsx         # Browse/search
│   │   ├── AssemblyCard.tsx            # Assembly display
│   │   └── AssemblyBuilder.tsx         # Create/edit
│   ├── cost-database/
│   │   ├── MaterialSearch.tsx          # Search materials
│   │   ├── LaborRateEditor.tsx         # Edit rates
│   │   └── CostImporter.tsx            # Import costs
│   ├── takeoff/
│   │   ├── PlanViewer.tsx              # PDF viewer
│   │   ├── QuantityExtractor.tsx       # Extract quantities
│   │   └── MeasurementTools.tsx        # Drawing tools
│   ├── shared/
│   │   ├── DataTable.tsx               # Reusable table
│   │   ├── SearchFilter.tsx            # Search/filter
│   │   └── FileUploader.tsx            # File upload
│   └── ui/                              # Shadcn components
├── lib/
│   ├── api.ts                           # API client
│   ├── calculations.ts                  # Client-side calcs
│   └── formatting.ts                    # Formatters
└── package.json
```

---

## 🎨 DESIGN SYSTEM

### Color Palette
```css
/* Primary - Professional Blue */
--primary: #2563eb;        /* Main brand color */
--primary-hover: #1d4ed8;
--primary-light: #dbeafe;

/* Secondary - Construction Orange */
--secondary: #f97316;      /* Accent for actions */
--secondary-hover: #ea580c;
--secondary-light: #ffedd5;

/* Neutral - Grays */
--background: #ffffff;
--foreground: #0f172a;
--muted: #f1f5f9;
--muted-foreground: #64748b;
--border: #e2e8f0;

/* Semantic Colors */
--success: #10b981;        /* Completed, approved */
--warning: #f59e0b;        /* In progress, pending */
--error: #ef4444;          /* Errors, overages */
--info: #3b82f6;           /* Information */

/* Cost-specific */
--material-cost: #8b5cf6;  /* Purple for materials */
--labor-cost: #06b6d4;     /* Cyan for labor */
--equipment-cost: #f59e0b; /* Amber for equipment */
```

### Typography
```css
/* Font Family */
font-family: 'Inter', -apple-system, sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;   /* 12px - Small labels */
--text-sm: 0.875rem;  /* 14px - Body text */
--text-base: 1rem;    /* 16px - Default */
--text-lg: 1.125rem;  /* 18px - Section headers */
--text-xl: 1.25rem;   /* 20px - Page titles */
--text-2xl: 1.5rem;   /* 24px - Hero text */
--text-3xl: 1.875rem; /* 30px - Large displays */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing System
```css
/* 4px base unit */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

---

## 📱 PAGE SPECIFICATIONS

### 1. Dashboard Home (`/dashboard`)

**Purpose:** Quick overview of estimation activities and shortcuts

#### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Header: Logo | Search | Notifications | User Menu          │
├──────┬──────────────────────────────────────────────────────┤
│      │                                                       │
│ Side │  📊 ESTIMATION DASHBOARD                             │
│ Nav  │                                                       │
│      │  ┌─────────────┬─────────────┬─────────────┐        │
│ •Est │  │ Active      │ Pending     │ Completed   │        │
│ •Asm │  │ Estimates   │ Review      │ This Month  │        │
│ •DB  │  │    12       │     5       │     47      │        │
│ •TO  │  └─────────────┴─────────────┴─────────────┘        │
│ •Rpt │                                                       │
│      │  Recent Estimates                                    │
│      │  ┌──────────────────────────────────────────┐       │
│      │  │ ⚡ Residential Addition - $125K  [Edit]  │       │
│      │  │ ⏰ Commercial TI - $480K       [Review] │       │
│      │  │ ✅ Home Remodel - $67K         [View]   │       │
│      │  └──────────────────────────────────────────┘       │
│      │                                                       │
│      │  Quick Actions                                       │
│      │  [+ New Estimate] [📋 From Bid] [📤 Import]        │
│      │                                                       │
│      │  AI Insights                                         │
│      │  💡 "Your estimates avg 8% under market this         │
│      │     month. Consider raising margins."                │
│      │                                                       │
└──────┴───────────────────────────────────────────────────────┘
```

#### Components
- **Stats Cards** (3x) - Active, Pending, Completed counts
- **Recent Estimates Table** - Last 10 with status badges
- **Quick Actions** - Primary CTAs
- **AI Insights Card** - Contextual suggestions

#### API Calls
```typescript
GET /api/estimates?status=active&limit=10
GET /api/estimates/stats
GET /api/ai/insights
```

---

### 2. Estimates List (`/dashboard/estimates`)

**Purpose:** Browse, search, and filter all estimates

#### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ 📋 ESTIMATES                                     [+ New]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Search: [_____________] 🔍                                   │
│                                                              │
│ Filters: [Status ▾] [Date Range ▾] [Project Type ▾]       │
│          [Cost Range ▾] [Assigned To ▾]                     │
│                                                              │
│ Sort: [Date Created ▾] [Name ▾] [Amount ▾] [Status ▾]      │
│                                                              │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ Estimate Name         │ Amount   │ Status │ Actions │    │
│ ├─────────────────────────────────────────────────────┤    │
│ │ 🏠 Residential Add    │ $125,450 │ Draft  │ [Edit]  │    │
│ │ 🏢 Office Buildout    │ $480,200 │ Review │ [View]  │    │
│ │ 🔨 Kitchen Remodel    │ $67,800  │ Final  │ [View]  │    │
│ │ 🏗️ Foundation Repair  │ $34,500  │ Draft  │ [Edit]  │    │
│ └─────────────────────────────────────────────────────┘    │
│                                                              │
│ Pagination: ◀ 1 2 3 ... 10 ▶                               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### Features
- **Advanced Search** - Full-text across name, project, notes
- **Multi-Filter** - Status, date, type, cost range, assignee
- **Sort Options** - Date, name, amount, status
- **Bulk Actions** - Export, archive, delete (multi-select)
- **Status Badges** - Color-coded (Draft, Review, Final, Sent)

#### API Calls
```typescript
GET /api/estimates?search={query}&status={status}&page={page}
```

---

### 3. Create Estimate Wizard (`/dashboard/estimates/new`)

**Purpose:** Step-by-step estimate creation with AI assistance

#### Wizard Steps

##### Step 1: Basic Information
```
┌─────────────────────────────────────────────────────────────┐
│ CREATE NEW ESTIMATE          [1]──[2]──[3]──[4]──[5]       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Basic Information                                           │
│                                                              │
│ Project Name *                                              │
│ [________________________________________]                  │
│                                                              │
│ Client                                                      │
│ [Select Client ▾]  or  [+ Add New Client]                 │
│                                                              │
│ Project Type *                                              │
│ ( ) Residential New Construction                            │
│ ( ) Residential Remodel                                     │
│ ( ) Commercial                                              │
│ ( ) Industrial                                              │
│ ( ) Other: [_________________]                             │
│                                                              │
│ Location                                                    │
│ [________________________________________] 🗺️               │
│                                                              │
│ Project Description                                         │
│ [_____________________________________________]             │
│ [_____________________________________________]             │
│ [_____________________________________________]             │
│                                                              │
│ 💡 AI will analyze your description to suggest line items   │
│                                                              │
│                              [Cancel] [Next: Scope Analysis] │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

##### Step 2: AI Scope Analysis
```
┌─────────────────────────────────────────────────────────────┐
│ CREATE NEW ESTIMATE          [1]──[2]──[3]──[4]──[5]       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ AI Scope Analysis                                           │
│                                                              │
│ ✨ Analyzing your project description...                    │
│                                                              │
│ AI Detected Work Items:                                     │
│ ┌────────────────────────────────────────────────┐         │
│ │ ☑ Foundation - 2,000 SF slab on grade          │         │
│ │ ☑ Framing - Wood frame, 2x6 walls              │         │
│ │ ☑ Roofing - Asphalt shingles, 2,500 SF         │         │
│ │ ☑ Plumbing - 2 full bathrooms                  │         │
│ │ ☑ Electrical - Standard 200A service            │         │
│ │ ☑ Drywall - Level 4 finish                      │         │
│ │ ☐ HVAC - Split system (suggested)               │         │
│ │ ☐ Insulation - R-19 walls, R-38 ceiling         │         │
│ └────────────────────────────────────────────────┘         │
│                                                              │
│ Suggested Assemblies:                                       │
│ • Residential Foundation - Slab on Grade (ASM-001)          │
│ • Wood Frame Wall - 2x6 16" OC (ASM-042)                    │
│ • Asphalt Shingle Roof - Standard (ASM-087)                 │
│                                                              │
│ Estimated Budget Range: $180,000 - $220,000                │
│ (Based on similar projects in your area)                    │
│                                                              │
│                              [Back] [Next: Build Estimate]  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

##### Step 3: Build Estimate (Main Editor)
```
┌─────────────────────────────────────────────────────────────┐
│ CREATE ESTIMATE          [1]──[2]──[3]──[4]──[5]           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ [📋 Add Section ▾] [➕ Add Line Item] [📦 Add Assembly]    │
│                                                              │
│ Sections & Line Items                                       │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ ▼ 03 CONCRETE                         $42,500    [...]│ │
│ │   ├─ Slab on grade (2000 SF)         $15,000          │ │
│ │   ├─ Foundation walls (120 LF)       $18,500          │ │
│ │   └─ Finishes                         $9,000          │ │
│ │                                                        │ │
│ │ ▼ 06 WOOD & PLASTICS                  $68,200    [...]│ │
│ │   ├─ Framing lumber                  $35,000          │ │
│ │   ├─ Labor - Framing                 $28,200          │ │
│ │   └─ Hardware & fasteners             $5,000          │ │
│ │                                                        │ │
│ │ ▶ 07 THERMAL & MOISTURE               $12,800    [...]│ │
│ │ ▶ 09 FINISHES                         $45,600    [...]│ │
│ │ ▶ 15 MECHANICAL                       $32,400    [...]│ │
│ │ ▶ 16 ELECTRICAL                       $28,900    [...]│ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ Cost Summary                            │ AI Insights      │
│ ┌────────────────────────────┐ │ ┌─────────────────────┐ │
│ │ Material:      $112,400    │ │ │ 💡 Consider using   │ │
│ │ Labor:          $78,900    │ │ │ engineered lumber   │ │
│ │ Equipment:       $8,700    │ │ │ to save $3,200      │ │
│ │ ──────────────────────────│ │ │                     │ │
│ │ Subtotal:      $200,000    │ │ │ 📊 Your estimate    │ │
│ │ Overhead (15%): $30,000    │ │ │ is 5% below         │ │
│ │ Profit (10%):   $23,000    │ │ │ market average      │ │
│ │ ──────────────────────────│ │ │                     │ │
│ │ TOTAL:         $253,000    │ │ └─────────────────────┘ │
│ └────────────────────────────┘ │                          │
│                                                              │
│                              [Back] [Next: Settings]        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

##### Step 4: Settings & Markup
```
┌─────────────────────────────────────────────────────────────┐
│ CREATE ESTIMATE          [1]──[2]──[3]──[4]──[5]           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Estimate Settings                                           │
│                                                              │
│ Overhead                                                    │
│ [15] % or $[________]                                       │
│                                                              │
│ Profit Margin                                               │
│ [10] % or $[________]                                       │
│                                                              │
│ Contingency                                                 │
│ [5] % (recommended for residential)                         │
│                                                              │
│ Tax Rate                                                    │
│ [7.5] % (auto-filled from location)                         │
│                                                              │
│ Payment Terms                                               │
│ ( ) Deposit: 30%, Progress: 40%/30%, Final: balance       │
│ ( ) Deposit: 50%, Final: 50%                               │
│ ( ) Custom: [___________________________________]           │
│                                                              │
│ Validity Period                                             │
│ Estimate valid for [30] days from date of issue            │
│                                                              │
│ Notes & Exclusions                                          │
│ [_____________________________________________]             │
│ [_____________________________________________]             │
│                                                              │
│                              [Back] [Next: Review & Export] │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

##### Step 5: Review & Export
```
┌─────────────────────────────────────────────────────────────┐
│ CREATE ESTIMATE          [1]──[2]──[3]──[4]──[5]           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Review & Export                                             │
│                                                              │
│ ✅ Your estimate is ready!                                  │
│                                                              │
│ Preview                                │ Export Options     │
│ ┌────────────────────────┐ │ ┌────────────────────────┐   │
│ │ [PDF Preview]          │ │ │ [📄 PDF Proposal]      │   │
│ │                        │ │ │ Professional format    │   │
│ │ Project: Addition      │ │ │                        │   │
│ │ Client: John Doe       │ │ │ [📊 Excel Breakdown]   │   │
│ │ Total: $253,000        │ │ │ Detailed line items    │   │
│ │                        │ │ │                        │   │
│ │ [View Full]            │ │ │ [📋 CSV Export]        │   │
│ └────────────────────────┘ │ │ For import to other    │   │
│                            │ │ systems                │   │
│ Actions                    │ │                        │   │
│ [✉️ Email to Client]       │ │ [💾 Save to Portal]    │   │
│ [🔗 Share Link]            │ │                        │   │
│ [🔄 Sync to Bid]           │ │ └────────────────────────┘   │
│ [💰 Convert to Budget]     │ │                              │
│                                                              │
│                              [Back] [Save & Finish]         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

### 4. Estimate Editor (`/dashboard/estimates/[id]/edit`)

**Purpose:** Full-featured estimate editing interface

#### Layout (Two-Column)
```
┌─────────────────────────────────────────────────────────────┐
│ Residential Addition - $253,000    [Save] [Export] [More ▾] │
├──────────────────────────────────┬──────────────────────────┤
│                                  │                          │
│ SECTIONS & LINE ITEMS (70%)     │ DETAILS PANEL (30%)      │
│                                  │                          │
│ [+ Section] [+ Item] [+ Asm]    │ 📊 Cost Summary          │
│                                  │ ─────────────────────    │
│ Search: [_______________] 🔍     │ Material:    $112,400    │
│                                  │ Labor:        $78,900    │
│ ▼ 03 CONCRETE            $42.5K  │ Equipment:     $8,700    │
│   [Edit Section] [Delete]       │ ─────────────────────    │
│   ┌─────────────────────────┐   │ Subtotal:    $200,000    │
│   │ Item Description  │ Qty │   │ Overhead:     $30,000    │
│   ├─────────────────────────┤   │ Profit:       $23,000    │
│   │ Slab foundation   │2000│   │ ─────────────────────    │
│   │  • Material       │$7.5│   │ TOTAL:       $253,000    │
│   │  • Labor          │$7.5│   │                          │
│   │  = $15.00/SF      │    │   │ 💡 AI Suggestions        │
│   ├─────────────────────────┤   │ ─────────────────────    │
│   │ Foundation walls  │120 │   │ • Use pre-cast for       │
│   │  • Material       │$90 │   │   $2,800 savings         │
│   │  • Labor          │$64 │   │                          │
│   │  = $154/LF        │    │   │ 📈 Comparisons           │
│   └─────────────────────────┘   │ ─────────────────────    │
│                                  │ vs. Market: -5%          │
│ ▼ 06 WOOD & PLASTICS     $68.2K  │ vs. Last Estimate: +12%  │
│   [Items...]                     │                          │
│                                  │ 📎 Attachments           │
│ ▶ 07 THERMAL & MOISTURE  $12.8K  │ ─────────────────────    │
│ ▶ 09 FINISHES            $45.6K  │ • plans.pdf              │
│ ▶ 15 MECHANICAL          $32.4K  │ • scope.docx             │
│ ▶ 16 ELECTRICAL          $28.9K  │ [+ Upload]               │
│                                  │                          │
└──────────────────────────────────┴──────────────────────────┘
```

#### Features
- **Inline Editing** - Click to edit quantities, prices
- **Drag & Drop** - Reorder sections and line items
- **Quick Calculations** - Real-time cost updates
- **Assembly Import** - Drag assemblies from library
- **Copy/Paste** - Duplicate sections or items
- **Undo/Redo** - Full edit history
- **Auto-save** - Save draft every 30 seconds
- **Collaboration** - Show who's viewing (future)

---

### 5. Assembly Library (`/dashboard/assemblies`)

**Purpose:** Browse and manage pre-built cost assemblies

#### Layout (Grid View)
```
┌─────────────────────────────────────────────────────────────┐
│ 📦 ASSEMBLY LIBRARY                            [+ New]      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Search: [_______________] 🔍                                 │
│                                                              │
│ Categories: [All ▾] [Foundation] [Framing] [Roofing]...    │
│                                                              │
│ ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│ │ 🏗️          │ 🏠          │ 🏠          │ 🏗️          │  │
│ │ Foundation  │ Wall Frame  │ Roof Asphlt │ Concrete    │  │
│ │ Slab Grade  │ 2x6 16" OC  │ Shingles    │ Footing     │  │
│ │             │             │             │             │  │
│ │ $15.50/SF   │ $18.75/SF   │ $4.25/SF    │ $45.00/LF   │  │
│ │             │             │             │             │  │
│ │ [+ Add]     │ [+ Add]     │ [+ Add]     │ [+ Add]     │  │
│ └─────────────┴─────────────┴─────────────┴─────────────┘  │
│ ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│ │ 🪟          │ 🚪          │ 🎨          │ 🔌          │  │
│ │ Window      │ Door Frame  │ Interior    │ Electrical  │  │
│ │ Vinyl Dbl   │ Pre-hung    │ Paint       │ Outlet      │  │
│ │             │             │             │             │  │
│ │ $450/EA     │ $280/EA     │ $2.50/SF    │ $125/EA     │  │
│ │             │             │             │             │  │
│ │ [+ Add]     │ [+ Add]     │ [+ Add]     │ [+ Add]     │  │
│ └─────────────┴─────────────┴─────────────┴─────────────┘  │
│                                                              │
│ Showing 8 of 247 assemblies                                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### Assembly Detail Modal
```
┌─────────────────────────────────────────────────────────┐
│ Foundation - Slab on Grade (ASM-001)     [Edit] [Clone]│
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Description                                             │
│ Standard 4" concrete slab on compacted gravel base     │
│                                                          │
│ Components                                              │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Item             │ Qty  │ Unit │ Cost/Unit│ Total │ │
│ ├────────────────────────────────────────────────────┤ │
│ │ Gravel base 4"   │ 1.00 │ SF   │ $1.50   │$1.50  │ │
│ │ Vapor barrier    │ 1.05 │ SF   │ $0.40   │$0.42  │ │
│ │ Wire mesh        │ 1.00 │ SF   │ $0.60   │$0.60  │ │
│ │ Concrete 4"      │ 0.33 │ CY   │ $120    │$3.96  │ │
│ │ Labor - Pour     │ 0.05 │ HR   │ $65     │$3.25  │ │
│ │ Labor - Finish   │ 0.08 │ HR   │ $55     │$4.40  │ │
│ │ Equipment        │ 1.00 │ SF   │ $0.85   │$0.85  │ │
│ ├────────────────────────────────────────────────────┤ │
│ │ TOTAL            │      │      │         │$15.00 │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ Usage: 347 times in estimates                           │
│ Average installed: $15.50/SF                            │
│                                                          │
│                         [Add to Estimate] [Close]       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

### 6. Cost Database (`/dashboard/cost-database`)

**Purpose:** Manage material, labor, and equipment costs

#### Tabs Interface
```
┌─────────────────────────────────────────────────────────────┐
│ 💰 COST DATABASE                                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ [Materials] [Labor] [Equipment] [Import]                    │
│                                                              │
│ ──────────────────────────────────────────────────────────  │
│ MATERIALS                                                    │
│                                                              │
│ Search: [_______________] 🔍  Division: [All ▾]            │
│                                                              │
│ Regional Adjustment: San Francisco, CA (+22%) [Change]      │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Item            │ Division│ Unit │ Cost  │ Last Update│ │
│ ├────────────────────────────────────────────────────────┤ │
│ │ Concrete 3000psi│ 03      │ CY   │ $145  │ 2026-01-15 │ │
│ │ Lumber 2x6 #2   │ 06      │ BF   │ $1.85 │ 2026-01-28 │ │
│ │ Drywall 1/2"    │ 09      │ SF   │ $0.55 │ 2026-01-20 │ │
│ │ Shingles 3-tab  │ 07      │ SQ   │ $95   │ 2026-01-10 │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ [+ Add Material] [Import from RSMeans] [Export to CSV]     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### Labor Rates by Trade
```
┌─────────────────────────────────────────────────────────────┐
│ LABOR RATES                                                 │
│                                                              │
│ Location: San Francisco, CA [Change]                        │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Trade              │ Base Rate│ Burden │ Total  │ Edit │ │
│ ├────────────────────────────────────────────────────────┤ │
│ │ Carpenter          │ $45/hr   │ +35%   │ $61/hr │ [✎] │ │
│ │ Electrician        │ $55/hr   │ +35%   │ $74/hr │ [✎] │ │
│ │ Plumber            │ $52/hr   │ +35%   │ $70/hr │ [✎] │ │
│ │ Laborer            │ $28/hr   │ +35%   │ $38/hr │ [✎] │ │
│ │ Project Manager    │ $65/hr   │ +30%   │ $85/hr │ [✎] │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ Burden includes: Workers comp, payroll taxes, insurance     │
│                                                              │
│ [+ Add Trade] [Bulk Update] [Apply to All Estimates]       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

### 7. Takeoff Module (`/dashboard/takeoff`)

**Purpose:** Upload plans and extract quantities

#### Plan Viewer with Measurement Tools
```
┌─────────────────────────────────────────────────────────────┐
│ Takeoff: Residential Addition Plans                [Tools]  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ [PDF Viewer with Drawing Canvas]                            │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │                                                        │ │
│ │   [Floor Plan Display]                                │ │
│ │                                                        │ │
│ │   Drawing tools:                                       │ │
│ │   📏 Line   ⬜ Area   ⭕ Count   🎯 Point              │ │
│ │                                                        │ │
│ │   Measurements:                                        │ │
│ │   • Foundation perimeter: 180 LF                      │ │
│ │   • Slab area: 2,000 SF                               │ │
│ │   • Windows: 12 EA                                     │ │
│ │                                                        │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ Extracted Quantities          │ Actions                     │
│ ┌───────────────────────────┐ │ [Export to Estimate]       │
│ │ Foundation: 180 LF         │ │ [Save Takeoff]             │
│ │ Slab: 2,000 SF             │ │ [AI: Auto-detect]          │
│ │ Walls: 1,200 SF            │ │                             │
│ │ Windows: 12 EA             │ │                             │
│ └───────────────────────────┘ │                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

### 8. Reports & Analytics (`/dashboard/reports`)

**Purpose:** Estimation metrics and insights

#### Dashboard
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 REPORTS & ANALYTICS                                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Date Range: [Last 30 Days ▾]                               │
│                                                              │
│ ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│ │ Total       │ Win Rate    │ Avg Margin  │ Time/Est    │  │
│ │ Estimates   │             │             │             │  │
│ │    47       │    32%      │    12.5%    │  4.2 hrs    │  │
│ └─────────────┴─────────────┴─────────────┴─────────────┘  │
│                                                              │
│ Estimates by Status                 Estimates by Type       │
│ [Pie Chart]                         [Bar Chart]             │
│                                                              │
│ Cost Accuracy Trends                Win/Loss Analysis       │
│ [Line Graph]                        [Table]                 │
│                                                              │
│ Top Performing Assemblies                                   │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 1. Foundation Slab (347 uses, 95% accurate)            │ │
│ │ 2. Wall Frame 2x6 (289 uses, 92% accurate)             │ │
│ │ 3. Asphalt Roof (156 uses, 88% accurate)               │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔧 KEY COMPONENTS

### EstimateWizard Component
```typescript
interface EstimateWizardProps {
  mode: 'new' | 'from-bid';
  bidRequestId?: string;
  onComplete: (estimateId: string) => void;
}

// Features:
// - 5-step wizard with progress indicator
// - AI scope analysis integration
// - Assembly suggestions
// - Real-time cost calculations
// - Validation at each step
```

### LineItemTable Component
```typescript
interface LineItemTableProps {
  sectionId: string;
  items: LineItem[];
  editable: boolean;
  onUpdate: (items: LineItem[]) => void;
  onAddAssembly: () => void;
}

// Features:
// - Inline editing
// - Drag & drop reordering
// - Bulk operations
// - Real-time totals
// - Keyboard shortcuts
```

### CostSummary Component
```typescript
interface CostSummaryProps {
  estimate: Estimate;
  settings: EstimateSettings;
  realTime: boolean;
}

// Features:
// - Live calculation display
// - Material/labor/equipment breakdown
// - Overhead and profit
// - Visual cost distribution (pie chart)
// - Export-ready formatting
```

### AssemblyBrowser Component
```typescript
interface AssemblyBrowserProps {
  mode: 'browse' | 'select';
  categories: string[];
  onSelect?: (assembly: Assembly) => void;
}

// Features:
// - Grid and list views
// - Category filtering
// - Search with fuzzy matching
// - Preview modal
// - Usage statistics
```

### AIAnalysisPanel Component
```typescript
interface AIAnalysisPanelProps {
  estimateId: string;
  context: 'editor' | 'review';
}

// Features:
// - Real-time suggestions
// - Value engineering tips
// - Cost comparisons
// - Risk alerts
// - Confidence scoring
```

---

## 🎨 UI/UX PATTERNS

### Keyboard Shortcuts
```
Global:
- Cmd/Ctrl + K: Quick search
- Cmd/Ctrl + N: New estimate
- Cmd/Ctrl + S: Save
- Cmd/Ctrl + Z: Undo
- Cmd/Ctrl + Shift + Z: Redo

Editor:
- Cmd/Ctrl + D: Duplicate line item
- Cmd/Ctrl + Delete: Delete selected
- Tab: Next field
- Shift + Tab: Previous field
- Enter: Add new line item
```

### Loading States
- **Skeleton screens** for lists and tables
- **Progress bars** for file uploads and exports
- **Spinners** for inline actions
- **Optimistic updates** for instant feedback

### Error Handling
- **Toast notifications** for success/error
- **Inline validation** in forms
- **Error boundaries** for component crashes
- **Retry mechanisms** for API failures

### Responsive Design
- **Mobile-first** approach
- **Tablet optimization** for field use
- **Desktop power features** (keyboard shortcuts, multi-panel)

---

## 🔄 API INTEGRATION

### Endpoints Used
```typescript
// Estimates
GET    /api/estimates
POST   /api/estimates
GET    /api/estimates/:id
PUT    /api/estimates/:id
DELETE /api/estimates/:id
GET    /api/estimates/:id/export (PDF/Excel/CSV)

// AI Features
POST   /api/ai/analyze-scope
POST   /api/ai/predict-cost
POST   /api/ai/suggest-assemblies
POST   /api/ai/value-engineer

// Assemblies
GET    /api/assemblies
POST   /api/assemblies
GET    /api/assemblies/:id

// Cost Database
GET    /api/cost-database/materials
POST   /api/cost-database/materials
PUT    /api/cost-database/materials/:id

// Takeoff
POST   /api/takeoff/upload-plan
POST   /api/takeoff/extract-quantities

// Integration
POST   /api/estimates/:id/sync-to-bid
POST   /api/estimates/:id/transfer-to-budget
```

---

## 📈 ANALYTICS & TRACKING

### User Events to Track
```typescript
// Creation Flow
- estimate_wizard_started
- estimate_wizard_step_completed
- estimate_wizard_abandoned
- estimate_created

// Editing
- line_item_added
- assembly_added
- cost_calculated
- ai_suggestion_accepted

// Export/Sharing
- estimate_exported (format)
- estimate_emailed
- estimate_synced_to_bid

// Performance
- estimate_creation_time
- calculation_time
- export_generation_time
```

---

## 🚀 IMPLEMENTATION PHASES

### Phase 1: Core MVP (Week 1)
- [ ] Basic layout and navigation
- [ ] Estimate list page
- [ ] Simple estimate editor
- [ ] Cost database browser
- [ ] Basic calculations
- [ ] PDF export

### Phase 2: Wizard & AI (Week 2)
- [ ] Create estimate wizard
- [ ] AI scope analysis
- [ ] Assembly browser and integration
- [ ] AI suggestions panel
- [ ] Value engineering

### Phase 3: Advanced Features (Week 3)
- [ ] Takeoff module
- [ ] Revision management
- [ ] Reports & analytics
- [ ] Collaboration features
- [ ] Mobile optimization

### Phase 4: Polish & Launch
- [ ] Performance optimization
- [ ] User testing
- [ ] Documentation
- [ ] Training materials
- [ ] Production deployment

---

## ✅ SUCCESS CRITERIA

### User Experience
- ✅ Create estimate in < 30 minutes (vs. 4+ hours manually)
- ✅ 90%+ user satisfaction score
- ✅ < 5% error rate in calculations
- ✅ < 2 seconds for cost calculations

### Technical
- ✅ < 2 second page load times
- ✅ 99.9% uptime
- ✅ Mobile-responsive (tablet minimum)
- ✅ Accessibility (WCAG 2.1 AA)

### Business
- ✅ 50+ estimates created in first month
- ✅ 80%+ estimate completion rate
- ✅ 30%+ integration with bid requests
- ✅ Positive ROI within 3 months

---

## 🔒 SECURITY CONSIDERATIONS

- **Role-based access** - Estimators can only see their estimates
- **Data encryption** - At rest and in transit
- **Audit logging** - Track all estimate changes
- **Export watermarking** - Optional for draft estimates
- **Client data isolation** - Multi-tenancy support

---

## 📝 NOTES FOR DEVELOPERS

### State Management
```typescript
// Use React Context for:
- User authentication state
- Current estimate being edited
- UI preferences (theme, layout)

// Use Server Components for:
- Estimate lists
- Assembly browsing
- Cost database queries

// Use Client Components for:
- Interactive editor
- Real-time calculations
- File uploads
```

### Performance Optimization
- **Virtual scrolling** for large line item lists
- **Memoization** for expensive calculations
- **Debounced auto-save** (30 seconds)
- **Lazy loading** for assemblies and cost database
- **Image optimization** for PDF preview thumbnails

### Testing Strategy
- **Unit tests** for calculation logic
- **Integration tests** for API calls
- **E2E tests** for wizard flow
- **Visual regression** tests for UI consistency

---

**UI Specification Version:** 1.0  
**Last Updated:** February 1, 2026  
**Status:** Ready for Development  
**Estimated Build Time:** 2-3 weeks  
**Priority:** HIGH - Critical Revenue Feature
