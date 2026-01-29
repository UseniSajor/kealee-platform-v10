# **Kealee Command Center Platform Summary (Updated)**

## **Platform Overview**

Kealee is a comprehensive construction project management and marketplace platform built as a monorepo with multiple client-facing mini-apps. The platform operates on a 3.5% commission model on transactions and connects homeowners, contractors, lenders, and service providers throughout the entire construction lifecycle.  
---

## **Core Modules**

### **1\. m-marketplace (Primary Marketing & Marketplace)**

URL: marketplace.kealee.com

The central hub and primary marketing site for the entire platform. More than just marketing—it's a full-featured marketplace.

Features:

* Contractor discovery and hiring  
* Service provider listings (architects, engineers, inspectors)  
* Lead generation and bidding system  
* Subscription plans for contractors  
* Credit packs for lead purchases  
* Platform-wide search and filtering

Target Users: All platform participants (discovery entry point)  
---

### **2\. m-ops-services (Operations & PM Services)**

URL: ops.kealee.com

Client-facing app for project management services, serving multiple user types with tailored experiences.

For Homeowners/Project Owners:

* Find and hire professional project managers  
* Get quotes for PM services  
* Track project progress

For GCs/Builders/Contractors:

* Access PM tools and workflows  
* Manage multiple projects  
* Subcontractor coordination  
* Schedule and resource management

Fee Structure:

* Homeowners: 3.5% platform fee on transactions  
* GCs/Contractors: Subscription \+ 2.5% transaction fee  
* Lenders: Custom enterprise pricing

---

### **3\. m-project-owner (Project Owner Portal)**

URL: projects.kealee.com

Dedicated portal where project and homeowners access PM services and manage their construction projects, including the full PreCon (Pre-Construction) Services Flow.

PreCon Services Flow (9-Phase Pipeline):

| Phase | Description |
| :---- | :---- |
| 1\. Intake | Submit project request with category, details, location |
| 2\. Design In Progress | Design team creates custom concepts |
| 3\. Design Review | Owner reviews 2-5 design concepts |
| 4\. Design Approved | Owner selects preferred design |
| 5\. SRP Generated | Suggested Retail Price calculated |
| 6\. Marketplace/Bidding | Project listed, contractors submit bids |
| 7\. Awarded | Owner selects winning contractor |
| 8\. Contract Ratified | Digital contract signed |
| 9\. Completed | Project finished |

Design Package Tiers:

| Tier | Price | Features |
| :---- | :---- | :---- |
| Basic | $199 | 2 concepts, basic floor plan, material suggestions |
| Standard | $499 | 3 concepts, 3D renderings, cost estimate, detailed plans |
| Premium | $999 | 5 concepts, permit-ready docs, interactive 3D walkthrough |

Project Categories:

* Kitchen Remodel  
* Bathroom Remodel  
* Room Addition  
* New Construction  
* Whole Home Renovation  
* Exterior Work  
* Custom/Other

PreCon Pipeline Dashboard:

* Visual pipeline with project counts per stage  
* Pending design fee alerts  
* Recent projects with quick stats  
* Filter by status (active, pending payment, bidding, completed)

Additional Portal Features:

* Project dashboard and timeline tracking  
* Budget tracking and approvals  
* Document management  
* Contractor communication hub  
* Milestone tracking  
* Payment management (integrated with Finance & Trust)

Target Users: Homeowners, property developers, project owners  
---

### **4\. m-finance-trust (Lender Portal)**

URL: finance.kealee.com

Primary function: Construction loan management for lenders. Escrow functionality is built into all platform transactions.

Features:

* Loan portfolio management  
* Draw request processing and approval  
* Disbursement tracking  
* Project risk monitoring  
* Inspection scheduling and reports  
* Borrower and contractor oversight

Dashboard Includes:

* Total loan portfolio overview  
* Pending draw requests  
* Monthly disbursement metrics  
* Active project count  
* Risk indicators (Low/Medium/High)

Target Users: Construction lenders, banks, credit unions  
---

### **5\. m-architect (Architecture Services)**

URL: architect.kealee.com

Architecture service marketplace and project collaboration portal.

Features:

* Find licensed architects  
* Design package ordering  
* Plan review and approval workflows  
* 3D visualization integration  
* Permit-ready drawing packages

Pricing Tiers:

* Basic Design: $2,500  
* Standard Package: $5,000  
* Premium Full-Service: $12,000  
* Custom/Commercial: $25,000+

---

### **6\. m-engineer (Engineering Services)**

URL: engineer.kealee.com

Structural, civil, and MEP engineering services marketplace.

Features:

* Engineering service discovery  
* Structural calculations and reports  
* Foundation design  
* MEP (Mechanical, Electrical, Plumbing) engineering  
* Stamped drawings for permits

Service Categories:

* Structural Engineering ($800-$5,000)  
* Civil Engineering ($1,500-$8,000)  
* MEP Design ($2,000-$15,000)  
* Specialty Engineering ($3,000-$25,000)

---

### **7\. m-permits-inspections (Permit & Inspection Tracking)**

URL: permits.kealee.com

Permit application management and inspection scheduling system.

Features:

* Permit application submission  
* Status tracking dashboard  
* Inspection scheduling  
* Document upload and management  
* Jurisdiction requirements database  
* Compliance checklists

Target Users: Contractors, homeowners, project managers  
---

### **8\. m-command-center (14 Mini-App Automation Platform)**

URL: command.kealee.com

The administrative backbone powering all platform operations with 14 integrated mini-apps.

Mini-Apps Include:

1. PreCon \- Pre-construction planning and workflow  
2. Estimation Engine \- AI-powered cost estimation  
3. Bid Management \- RFP and bid collection  
4. Contract Management \- Digital contracts and signatures  
5. Schedule Manager \- Project scheduling and Gantt charts  
6. Budget Tracker \- Real-time budget monitoring  
7. Document Hub \- Centralized document management  
8. Communication Center \- Messaging and notifications  
9. Inspection Tracker \- Inspection management  
10. Change Order System \- Change order processing  
11. Payment Processing \- Transaction handling  
12. Reporting Dashboard \- Analytics and reports  
13. Resource Manager \- Labor and equipment tracking  
14. Compliance Monitor \- Regulatory compliance tracking

---

## **Revenue Model**

| User Type | Fee Structure |
| :---- | :---- |
| Homeowners | 3.5% platform fee on transactions |
| GCs/Contractors | Subscription \+ 2.5% transaction fee |
| Lenders | Custom enterprise pricing |
| Service Providers | Subscription \+ lead purchase credits |
| PreCon Design Packages | $199 / $499 / $999 (one-time) |

---

## **Technical Architecture**

```
kealee-platform-v10/
├── apps/
│   ├── m-marketplace/        # Primary marketing + marketplace
│   ├── m-ops-services/       # PM services portal
│   ├── m-project-owner/      # Project owner dashboard + PreCon flow
│   │   └── app/precon/       # PreCon services (new, list, detail)
│   ├── m-finance-trust/      # Lender portal
│   ├── m-architect/          # Architecture services
│   ├── m-engineer/           # Engineering services
│   ├── m-permits-inspections/# Permit tracking
│   └── m-command-center/     # Admin platform
├── packages/
│   ├── database/             # Prisma schema (PreConProject, ContractorBid, etc.)
│   ├── ui/                   # Shared component library
│   └── config/               # Shared configurations
└── services/
    └── api/                  # Backend API with Stripe integration
```

Key PreCon Database Models:

* PreConProject \- Main project entity with 11 phase states  
* DesignConcept \- Design options for project owner review  
* ContractorBid \- Marketplace bids from contractors  
* PlatformFee \- Fee tracking (design packages, commissions)  
* PreConPhaseHistory \- Audit trail of phase transitions

