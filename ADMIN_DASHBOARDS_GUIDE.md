# 🎛️ Admin Dashboards - Internal Use Only

## ⚠️ Important: Admin Dashboards Are NOT Client-Facing

These dashboards are for **internal Kealee operations team use only** to manage leads and service requests. They are not accessible to clients.

---

## 📍 Admin Dashboard Locations

### 1. Development Leads Dashboard (Internal Only)

**URL:** http://localhost:3005/portal/development-leads

**Purpose:** Manage owner's rep and development advisory leads

**Who uses it:** Kealee operations team managing Development service

**Features:**
- View all development leads
- Filter by status (NEW, CONTACTED, QUALIFIED, etc.)
- Search leads
- View statistics (pipeline value, conversion rate)
- Click lead to see details
- Update status and priority
- Add notes and activities
- Track estimated deal value

**Access:** `/portal/development-leads` (requires authentication in production)

---

### 2. GC Operations Leads Dashboard (Internal Only)

**URL:** http://localhost:3006/portal/gc-ops-leads

**Purpose:** Manage GC operations trial requests and subscriptions

**Who uses it:** Kealee operations team managing GC Operations service

**Features:**
- View all GC trial requests
- Filter by status (NEW, TRIAL_ACTIVE, CONVERTED, CHURNED)
- Track trial conversions
- Monitor package subscriptions
- Update lead details
- Add notes and activities
- Track monthly recurring revenue

**Access:** `/portal/gc-ops-leads` (requires authentication in production)

---

### 3. Permit Service Leads Dashboard (Internal Only)

**URL:** http://localhost:5173/portal/permit-leads

**Purpose:** Manage contractor permit service requests

**Who uses it:** Kealee operations team managing Permit services

**Features:**
- View all permit service requests
- Filter by contractor type
- Track permit volume
- Monitor first permit to active client conversion
- Update lead details
- Track total permits processed
- Monitor monthly revenue

**Access:** `/portal/permit-leads` (requires authentication in production)

---

## 👥 Client-Facing vs Internal Dashboards

### ❌ Admin Dashboards (Internal - NOT for clients)

**Location:** `/portal/*` routes
**Users:** Kealee operations team only
**Purpose:** Lead management, sales tracking, operations
**Features:** Full CRUD, notes, activities, stats

**Examples:**
- `/portal/development-leads`
- `/portal/gc-ops-leads`
- `/portal/permit-leads`

### ✅ Client Dashboards (Client-Facing)

**Location:** `m-project-owner` app (separate)
**Users:** Homeowners, developers, property owners
**Purpose:** Project tracking, milestone approvals, payments
**Features:** View-only project data, approve milestones, messaging

**Examples (Not yet built):**
- `app.kealee.com/dashboard` - Client project overview
- `app.kealee.com/projects/[id]` - Individual project view
- `app.kealee.com/documents` - Project documents
- `app.kealee.com/payments` - Payment history

---

## 🔒 Security & Access

### Admin Dashboards (Current)
- **Development mode:** Open (no auth yet)
- **Production:** Requires authentication
- **Access control:** Admin/ops team only
- **Not indexed:** robots.txt blocks search engines

### Implementation Needed:
```typescript
// middleware.ts - Protect /portal/* routes
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Protect admin dashboards
  if (pathname.startsWith('/portal')) {
    const session = await getServerSession();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}
```

---

## 📊 Dashboard Comparison

| Feature | Admin Dashboards | Client Dashboards |
|---------|------------------|-------------------|
| **Users** | Kealee ops team | Clients/customers |
| **Purpose** | Lead management | Project tracking |
| **Location** | `/portal/*` | `m-project-owner` app |
| **Access** | Internal only | Client login required |
| **Features** | Full CRUD | View + approve |
| **Data** | All leads | Own projects only |
| **Built** | ✅ Yes (3 dashboards) | ⏳ Not yet |

---

## 🎯 Current Admin Dashboard Features

### All Dashboards Include:

**Lead List View:**
- Filter by status
- Search by name/company/email
- Pagination
- Summary statistics
- Click to view details

**Lead Detail View:**
- Full contact information
- Project/business details
- Status and priority dropdowns
- Estimated value tracking
- Notes section (add/view)
- Activity log (automatic tracking)
- Quick actions (edit, update)

---

## 🔧 Access Admin Dashboards

### Development (Port 3005)
```
http://localhost:3005/portal/development-leads
```

### GC Operations (Port 3006)
```
http://localhost:3006/portal/gc-ops-leads
```

### Permits (Port 5173)
```
http://localhost:5173/portal/permit-leads
```

**Note:** These are for Kealee team use to manage incoming leads and service requests.

---

## 🚀 Client-Facing Dashboards (To Be Built)

**Future client dashboards will be in:** `m-project-owner` app

**Will include:**
- Project timeline view
- Budget overview
- Document library
- Milestone approvals
- Payment management
- Messaging with team
- Progress photos

**These are separate from admin lead management dashboards.**

---

## ✅ Summary

**Admin Dashboards:**
- ✅ Built (3 dashboards)
- ✅ Internal use only
- ✅ Lead management
- ✅ NOT client-facing

**Client Dashboards:**
- ⏳ To be built in m-project-owner
- ⏳ Will be client-facing
- ⏳ For project tracking
- ⏳ Different from admin tools

**Current admin dashboards are for Kealee operations team to manage leads from the 3 marketing websites.**
